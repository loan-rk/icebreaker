import { useEffect, useState } from "react";
import { Radio, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Lecteur web fourni par RadioKing pour la webradio « avocadoradio ».
// `c` / `c2` = couleurs (rouge RadioKing sur fond blanc).
// Le slash final est nécessaire : sans lui, les bundles JS du lecteur (chargés
// en relatif) renvoient 404 et le lecteur reste blanc.
const PLAYER_SRC = "https://player.radioking.io/avocadoradio/?c=%2384000E&c2=%23FFFFFF";
// Script côté page (facultatif) : gère le redimensionnement et l'ouverture du
// lecteur en pop-up. Chargé une seule fois, en asynchrone.
const HELPER_SRC = "https://player.radioking.io/scripts/iframe.bundle.js";

/**
 * Lecteur radio RadioKing flottant et persistant.
 *
 * Monté une seule fois par le composant racine du jeu (pas dans un écran de
 * phase), il reste donc à l'écran — et continue de jouer — du lobby jusqu'à la
 * constellation finale, sans jamais être démonté lors d'un changement de phase.
 *
 * Il se présente comme une petite pastille dans un coin (en haut à droite sur
 * mobile, en bas à droite sur desktop) qu'on déplie pour révéler le lecteur.
 * L'iframe reste montée même repliée : la musique ne s'interrompt pas. Replié,
 * il ne recouvre ni les boutons de vote ni le panneau animateur ; il se replie
 * d'ailleurs tout seul quand `collapsed` passe à vrai (phase de vote).
 *
 * `ouvrirAuDemarrage` : ouvre le volet dès le montage. Sert à profiter du clic
 * « Rejoindre » (qui débloque l'audio dans le navigateur pour la session) pour
 * lancer la lecture sans geste supplémentaire. Si le navigateur refuse quand
 * même, aucun message : le bouton « Radio » reste le recours manuel.
 */
export function RadioKingPlayer({
  collapsed = false,
  ouvrirAuDemarrage = false,
}: {
  collapsed?: boolean;
  ouvrirAuDemarrage?: boolean;
}) {
  const [ouvert, setOuvert] = useState(ouvrirAuDemarrage);

  useEffect(() => {
    if (collapsed) setOuvert(false);
  }, [collapsed]);

  useEffect(() => {
    if (document.querySelector(`script[src="${HELPER_SRC}"]`)) return;
    const script = document.createElement("script");
    script.src = HELPER_SRC;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div
      // La boîte du conteneur est large (largeur du volet) mais souvent vide :
      // pointer-events-none dessus, réactivé sur les seuls éléments visibles,
      // pour ne pas intercepter les clics destinés à ce qui est en dessous.
      className="pointer-events-none fixed right-3 top-3 z-40 flex flex-col items-end gap-1.5 sm:bottom-3 sm:top-auto sm:flex-col-reverse"
    >
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label={ouvert ? "Replier le lecteur radio" : "Déplier le lecteur radio"}
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-strong/95 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur transition-colors hover:border-white/25"
      >
        <Radio className="h-3.5 w-3.5 text-primary" />
        Radio
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", ouvert && "rotate-180")} />
      </button>

      <div
        className={cn(
          // Largeur plafonnée en laissant ~5rem à gauche : sur très petit écran
          // le volet déplié ne recouvre pas les boutons d'export du coin gauche.
          "w-[300px] max-w-[calc(100vw-5rem)] overflow-hidden rounded-md shadow-lg transition-[height,opacity] duration-200",
          ouvert
            ? "pointer-events-auto h-[145px] opacity-100"
            : "pointer-events-none h-0 opacity-0",
        )}
      >
        <iframe
          src={PLAYER_SRC}
          title="Lecteur radio RadioKing — Avocado Radio"
          loading="lazy"
          scrolling="no"
          // Autorise le lecteur à démarrer seul si le navigateur a débloqué
          // l'audio (après le clic « Rejoindre »).
          allow="autoplay"
          className="h-[145px] w-full border-0"
        />
      </div>
    </div>
  );
}
