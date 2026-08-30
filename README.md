# RadioKing Icebreakers

Crée une application web d'icebreaker temps réel hautement interactive pour la réunion mensuelle de l'entreprise RadioKing. 

Stack technique cible : React, Tailwind CSS, Lucide React, et Supabase (Realtime) pour la synchronisation en direct des ~20 participants et de l'animateur (host). Pas d'authentification par email : simple saisie de prénom. 

Charte graphique : 

* Mode sombre uniquement. Fond : #252525. Texte : Blanc (principal) et Gris clair (secondaire).

* Couleur d'accent : #FF7F50 (orange corail).

* Style flat design, épuré, très moderne, sans dégradés complexes.

Architecture des rôles et écrans : 

1. ÉCRAN D'ENTRÉE (Participant) : Épuré. Un rond avatar par défaut centré, un champ de saisie du prénom en dessous, et un bouton "Rejoindre". Pas de titre ni d'icône décorative. Un paramètre URL secret ou un bouton discret permet d'accéder au rôle "Animateur" (Host).

2. LOBBY : Message "En attente du lancement...". Grille affichant les avatars + prénoms des participants connectés en temps réel avec un compteur "X/20 participants connectés". L'animateur voit un bouton "Démarrer le jeu".

3. BOUCLE DE JEU (6 questions, pilotée par l'animateur ou automatique avec sécurité de 20s) : 

  * Étape A (Pop-up prédiction) : Flash de 2 secondes avec le texte "À toi de deviner ce que la majorité va choisir".

  * Étape B (Écran prédiction) : La question et ses options s'affichent. Le joueur clique sur ce qu'il prédit être le choix de la majorité. Affichage NON anonyme : les prénoms des joueurs apparaissent sous une liste "Déjà prédit" dès qu'ils ont soumis leur choix.

  * Étape C (Pop-up vote) : Flash de 2 secondes avec le texte "À toi de choisir".

  * Étape D (Écran de vote) : Même question. Le joueur vote pour son propre choix. Vote STRICTEMENT anonyme : aucun retour visuel sur les choix, juste un indicateur visuel discret sur l'avatar du joueur pour valider qu'il a voté.

  * Étape E (Écran de Reveal "Versus") : Deux colonnes parfaitement alignées verticalement (Gauche vs Droite). Une jauge/barre de progression s'anime de 0% à la valeur finale en 1.5s avec le chiffre qui s'incrémente. Sous chaque jauge, la liste verticale des avatars/prénoms de ceux qui ont voté pour cette option apparaît. L'animateur valide le passage à la question suivante via un bouton "Suivant".

4. PORTRAIT-ROBOT FINAL (La Constellation) : 

  * Génère un canvas ou un réseau SVG interactif et stylisé représentant l'univers "ondes/radio".

  * Chaque option des 6 questions devient un nœud du réseau (jusqu'à 13 nœuds). Les nœuds sont tous interconnectés par des lignes pour former un réseau dense (pas seulement un point central).

  * Les nœuds des options majoritaires sont visuellement plus grands et marqués en orange corail, les minoritaires sont plus petits et discrets. Chaque nœud affiche son emoji, son libellé court et son pourcentage global.

Contenu des 6 questions à intégrer en base de données : 

1. Visio cassée — 🔇 Perdre le son vs 📵 Perdre l'image

2. Ambiance sonore — 🎵 Musique en fond permanent vs 🤫 Silence total pour se concentrer

3. Style de travail — 🌅 Commencer dès 8h et finir tôt vs 🦉 Commencer dès 10h et finir tard

4. Notifications Slack — 🔔 Activées en permanence vs 🔕 Tout en silencieux

5. Fonctionnalité à sauver — 📅 La planification vs 📻 Le direct

6. Style perso — ☕ Café vs 🍵 Thé vs 🍺 Bière (3 choix)

Contrôles de l'Animateur : L'animateur dispose d'un panneau flottant persistant avec un bouton "Suivant" (pour forcer l'étape supérieure) et "Pause" pour figer le timer de sécurité.

---

## Stack

TanStack Start (SSR) + React 19 + Tailwind CSS 4 + shadcn/ui, Supabase (Postgres + Realtime) pour la synchronisation temps réel. Build serveur via Nitro.

## Développement local

Prérequis : Node 20 ou plus.

```sh
npm install
cp .env.example .env   # puis renseigner les valeurs du projet Supabase
npm run dev            # http://localhost:8080
```

Scripts disponibles : `dev`, `build`, `preview`, `lint`, `format`, `typecheck`.

## Variables d'environnement

| Variable | Rôle |
| --- | --- |
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publishable (exposée au navigateur, protégée par les policies RLS) |

Ces deux variables sont lues côté navigateur : elles sont visibles par tous les participants. La sécurité repose donc entièrement sur les policies Row Level Security définies dans `supabase/migrations/`.

## Base de données

Le schéma et les données de départ (6 questions et leurs options) vivent dans `supabase/migrations/`. Pour l'appliquer à un projet neuf :

```sh
supabase link --project-ref <project-ref>
supabase db push
```

## Déploiement

`npm run build` produit un serveur déployable dans `.output/`. Nitro détecte la plateforme cible automatiquement chez la plupart des hébergeurs ; sinon on force le preset :

```sh
NITRO_PRESET=node-server npm run build        # VPS, Docker, Render...
NITRO_PRESET=cloudflare-module npm run build  # Cloudflare Workers
NITRO_PRESET=vercel npm run build             # Vercel
```
