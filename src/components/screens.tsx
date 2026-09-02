import { useEffect, useMemo, useRef, useState } from "react";
import { Users, ArrowRight, Radio, Download, FileText } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { type Option, type Participant, type Question, type ResponseRow } from "@/lib/game";
import { exporterConstellationPng, exporterResumePdf } from "@/lib/constellation-export";
import { cn } from "@/lib/utils";

/* ---------------- Join ---------------- */

export function JoinScreen({
  onJoin,
  hostMode,
  onToggleHost,
}: {
  onJoin: (name: string) => void;
  hostMode: boolean;
  onToggleHost: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) onJoin(name.trim());
        }}
        className="flex w-full max-w-xs flex-col items-center gap-6"
      >
        <Avatar name={name || undefined} size={96} accent={hostMode} />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom"
          maxLength={18}
          className="w-full rounded-xl bg-surface px-4 py-3 text-center text-lg outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="btn-rk btn-rk-hover w-full px-4 py-3 font-semibold disabled:pointer-events-none disabled:opacity-40"
        >
          {hostMode ? "Rejoindre en animateur" : "Rejoindre"}
        </button>
      </form>
      <button
        onClick={onToggleHost}
        className={cn(
          "mt-10 text-xs transition-colors",
          hostMode ? "text-primary" : "text-muted-foreground/50 hover:text-muted-foreground",
        )}
      >
        {hostMode ? "Mode animateur activé" : "·"}
      </button>
    </div>
  );
}

/* ---------------- Lobby ---------------- */

export function Lobby({
  players,
  isHost,
  onStart,
  onLeave,
}: {
  players: Participant[];
  isHost: boolean;
  onStart: () => void;
  onLeave?: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-8 sm:gap-8 sm:py-16">
        <div className="text-center">
          <p className="text-xl font-medium">En attente du lancement...</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {players.length} participant{players.length > 1 ? "s" : ""} connecté
            {players.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4">
          {players.map((p) => (
            <div key={p.id} className="flex flex-col items-center gap-2">
              <Avatar name={p.name} size={48} />
              <span className="max-w-full truncate text-xs text-muted-foreground">{p.name}</span>
            </div>
          ))}
        </div>

        {isHost && (
          <button
            onClick={onStart}
            className="btn-rk btn-rk-hover flex items-center gap-2 px-6 py-3 font-semibold"
          >
            Démarrer le jeu <ArrowRight className="h-4 w-4" />
          </button>
        )}

        {onLeave && (
          <button
            onClick={onLeave}
            className="text-xs text-muted-foreground/60 underline-offset-4 hover:text-foreground hover:underline"
          >
            Quitter
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------- Flash ---------------- */

export function FlashScreen({ text, exitAfterMs }: { text: string; exitAfterMs?: number }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    setLeaving(false);
    if (!exitAfterMs) return;
    const t = setTimeout(() => setLeaving(true), Math.max(0, exitAfterMs));
    return () => clearTimeout(t);
  }, [text, exitAfterMs]);

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-8">
      <p
        className={cn(
          "max-w-3xl text-center text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl",
          leaving ? "animate-flash-out-left" : "animate-flash-in",
        )}
      >
        <span className="text-gradient-rk">{text}</span>
      </p>
    </div>
  );
}

/* ---------------- Answer (vote) ---------------- */

export function AnswerScreen({
  question,
  questionPosition,
  questionCount,
  options,
  myAnswer,
  onPick,
  answered,
  players,
  isHost,
}: {
  question: Question;
  questionPosition: number;
  questionCount: number;
  options: Option[];
  myAnswer?: string;
  onPick: (id: string) => void;
  answered: ResponseRow[];
  players: Participant[];
  isHost: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-6 px-6 py-10 sm:gap-8 sm:py-20">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">
            Question {questionPosition}/{questionCount} · Ton vote
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{question.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{question.prompt}</p>
        </div>

        <div className="grid gap-3">
          {options.map((o) => {
            const picked = myAnswer === o.id;
            return (
              <button
                key={o.id}
                disabled={isHost}
                onClick={() => onPick(o.id)}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border border-white/5 bg-surface px-5 py-4 text-left transition-all",
                  picked
                    ? "border-primary/60 shadow-[0_10px_24px_-14px_var(--primary)] ring-2 ring-primary"
                    : "hover:-translate-y-0.5 hover:bg-surface-strong",
                  isHost && "cursor-default opacity-70",
                )}
              >
                <span className="flex items-center gap-4">
                  <span className="text-2xl">{o.emoji}</span>
                  <span className="font-medium">{o.label}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Vote anonyme · {answered.length}/{players.length} ont voté
          </p>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <Avatar
                key={p.id}
                name={p.name}
                size={32}
                done={answered.some((r) => r.participant_id === p.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Reveal ---------------- */

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function RevealColumn({
  option,
  percent,
  voters,
  winner,
}: {
  option: Option;
  percent: number;
  voters: Participant[];
  winner: boolean;
}) {
  const shown = useCountUp(percent);
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex h-20 flex-col items-center justify-end gap-1 text-center sm:h-24">
        <span className="text-2xl sm:text-3xl">{option.emoji}</span>
        <span className="text-xs text-muted-foreground sm:text-sm">{option.label}</span>
      </div>
      <div className="mt-3 flex h-8 items-center sm:mt-4 sm:h-10">
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-strong">
          <div
            className={cn(
              "h-full rounded-full transition-none",
              winner ? "btn-rk" : "bg-muted-foreground/60",
            )}
            style={{ width: `${shown}%` }}
          />
        </div>
      </div>
      <div
        className={cn(
          "text-center text-3xl font-bold sm:text-4xl",
          winner ? "text-primary" : "text-muted-foreground",
        )}
      >
        {shown}%
      </div>
      <div className="mt-4 flex flex-col items-center gap-1.5 sm:mt-6 sm:gap-2">
        {voters.map((v) => (
          <div key={v.id} className="flex items-center gap-2 text-xs sm:text-sm">
            <Avatar name={v.name} size={22} />
            <span className="max-w-[6rem] truncate text-muted-foreground">{v.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RevealScreen({
  question,
  options,
  votes,
  players,
}: {
  question: Question;
  options: Option[];
  votes: ResponseRow[];
  players: Participant[];
}) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const total = votes.length || 1;
  const counts = options.map((o) => votes.filter((v) => v.option_id === o.id).length);
  const max = Math.max(...counts, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-6 px-6 py-10 sm:gap-10 sm:py-20">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-primary">
            Résultats · {question.title}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{question.prompt}</h1>
        </div>
        <div className="flex items-start gap-4 sm:gap-6">
          {options.map((o, i) => (
            <RevealColumn
              key={o.id}
              option={o}
              percent={Math.round(((counts[i] ?? 0) / total) * 100)}
              winner={(counts[i] ?? 0) === max && max > 0}
              voters={
                votes
                  .filter((v) => v.option_id === o.id)
                  .map((v) => byId.get(v.participant_id))
                  .filter(Boolean) as Participant[]
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Constellation ---------------- */

// Écart minimum (en points de pourcentage) entre la 1re et la 2e option pour
// qu'une question soit considérée comme tranchée. En dessous, elle est
// "partagée" : aucune réponse n'est mise en avant.
const MARGE_MAJORITE = 0.1;

const LABEL_FONT = 11;
const PCT_FONT = 10;
// Largeur approximative d'un glyphe (fraction de la taille de police) : sert à
// estimer la place occupée par un libellé pour éviter tout chevauchement.
const LARGEUR_GLYPHE = 0.6;

/** Coupe un libellé trop long en deux lignes équilibrées (sur espace ou tiret,
 *  ou en dernier recours au milieu d'un mot insécable). */
function couperLibelle(s: string): string[] {
  if (s.length <= 10) return [s];
  const seps: number[] = [];
  for (let i = 0; i < s.length; i++) if (s[i] === " " || s[i] === "-") seps.push(i);
  if (seps.length === 0) {
    const c = Math.ceil(s.length / 2);
    return [s.slice(0, c) + "-", s.slice(c)];
  }
  let best = seps[0]!;
  let bestDiff = Infinity;
  for (const i of seps) {
    const gauche = s[i] === "-" ? i + 1 : i;
    const diff = Math.abs(gauche - (s.length - (i + 1)));
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  const coupe = s[best] === "-" ? best + 1 : best;
  return [s.slice(0, coupe).trim(), s.slice(best + 1).trim()];
}

function largeurLibelle(s: string): number {
  return Math.max(...couperLibelle(s).map((l) => l.length * LABEL_FONT * LARGEUR_GLYPHE + 10));
}

type NoeudConstellation = {
  id: string;
  emoji: string;
  lignes: string[];
  question_id: number;
  pct: number;
  role: "majorite" | "minorite" | "partagee" | "neutre";
  x: number;
  y: number;
};

export function Constellation({
  options,
  responses,
  questions = [],
  players = [],
  isHost = false,
}: {
  options: Option[];
  responses: ResponseRow[];
  questions?: Question[];
  players?: Participant[];
  isHost?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [exportEnCours, setExportEnCours] = useState<null | "png" | "pdf">(null);

  const lancerExport = async (type: "png" | "pdf") => {
    if (!svgRef.current || exportEnCours) return;
    setExportEnCours(type);
    try {
      if (type === "png") {
        await exporterConstellationPng(svgRef.current);
      } else {
        await exporterResumePdf(svgRef.current, {
          questions,
          options,
          participants: players,
          responses,
        });
      }
    } catch (err) {
      console.error("[constellation] export échoué", err);
    } finally {
      setExportEnCours(null);
    }
  };

  const { nodes, hubs, questionIds, viewBox, ratioViewBox } = useMemo(() => {
    const votes = responses.filter((r) => r.kind === "vote");
    const questionIds = [...new Set(options.map((o) => o.question_id))].sort((a, b) => a - b);
    const N = questionIds.length;

    // Aplatissement vertical de l'anneau : constante fixe (1 = anneau bien
    // circulaire). Le viewBox garde donc toujours les mêmes proportions ; le SVG
    // (preserveAspectRatio="xMidYMid meet" + aspect-ratio CSS) se contente
    // ensuite de grossir/rétrécir uniformément selon la place disponible.
    const APLATISSEMENT = 1;
    // Écartement latéral visé entre deux options voisines d'une même question.
    const ECART_PX = 130;
    // Distance radiale minimale entre le centre d'un groupe et ses options.
    const GAP_EXTERNE = 118;
    // Fraction du secteur angulaire d'une question réellement utilisée par ses
    // options : le reste sert de gouttière entre deux questions voisines.
    const GARDE = 0.82;

    // Largeur du plus grand libellé du jeu : dimensionne les rayons pour que ni
    // les pastilles ni leurs textes ne se chevauchent, quel que soit N.
    const maxLibelle = Math.max(44, ...options.map((o) => largeurLibelle(o.short_label)));

    const SECTEUR = N > 0 ? (2 * Math.PI) / N : 2 * Math.PI;
    // Rayon de l'anneau des questions : croît avec N (corde constante entre
    // groupes voisins) et avec la largeur des libellés.
    const RAYON_CENTRE =
      N > 1 ? Math.max(168, maxLibelle / (SECTEUR * 0.85), 80 / Math.sin(Math.PI / N)) : 0;
    // Rayon des options : assez grand pour poser côte à côte les deux options
    // d'une question partagée sans que leurs libellés se touchent.
    const RAYON_EXTERNE = Math.max(
      RAYON_CENTRE + GAP_EXTERNE,
      (2 * maxLibelle + 16) / (SECTEUR * GARDE),
    );

    // viewBox serré autour du dessin (juste la place des pastilles et de leurs
    // libellés) pour que la constellation occupe un maximum de l'espace affiché.
    const MARGE_H = 12 + maxLibelle / 2;
    const W = RAYON_EXTERNE + MARGE_H;
    const H_HAUT = RAYON_EXTERNE * APLATISSEMENT + 28;
    const H_BAS = RAYON_EXTERNE * APLATISSEMENT + 74;
    const CX = W;
    const CY = H_HAUT;
    const largeurViewBox = Math.round(2 * W);
    const hauteurViewBox = Math.round(H_HAUT + H_BAS);
    const viewBox = `0 0 ${largeurViewBox} ${hauteurViewBox}`;
    // Proportions fixes du dessin : appliquées telles quelles au <svg> (via
    // aspect-ratio) pour qu'il grossisse sans jamais se déformer.
    const ratioViewBox = largeurViewBox / hauteurViewBox;

    const position = (angle: number, rayon: number) => ({
      x: CX + Math.cos(angle) * rayon,
      y: CY + Math.sin(angle) * rayon * APLATISSEMENT,
    });

    const nodes: NoeudConstellation[] = [];
    const hubs: { x: number; y: number }[] = [];

    questionIds.forEach((qid, qi) => {
      const angle = (qi / questionIds.length) * Math.PI * 2 - Math.PI / 2;
      const hub = position(angle, RAYON_CENTRE);
      hubs.push(hub);

      const qOptions = options.filter((o) => o.question_id === qid);
      const qVotes = votes.filter((v) => v.question_id === qid);
      const compte = qOptions.map((o) => ({
        option: o,
        n: qVotes.filter((v) => v.option_id === o.id).length,
      }));
      const total = qVotes.length;
      const classement = [...compte].sort((a, b) => b.n - a.n);
      const tete = classement[0];
      const second = classement[1];

      // Question tranchée uniquement si la 1re devance nettement la 2e.
      // (Calcul inchangé : il porte sur *toutes* les options, y compris à 0.)
      const ecart = total > 0 && tete && second ? (tete.n - second.n) / total : 0;
      const tranchee = total > 0 && !!tete && tete.n > 0 && ecart >= MARGE_MAJORITE;

      const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

      // Question sans aucun vote : une seule pastille neutre au centre du
      // secteur, pour ne pas laisser de trou dans l'anneau.
      if (total === 0) {
        nodes.push({
          id: `sans-vote-${qid}`,
          emoji: "",
          lignes: ["Pas de vote"],
          question_id: qid,
          pct: 0,
          role: "neutre",
          ...hub,
        });
        return;
      }

      // Seules les options ayant recueilli au moins un vote sont dessinées ;
      // le calcul des % et de la majorité ci-dessus, lui, les garde toutes.
      const externes = (
        tranchee ? compte.filter((c) => c.option.id !== tete!.option.id) : compte
      ).filter((c) => c.n > 0);

      if (tranchee && tete) {
        nodes.push({
          id: tete.option.id,
          emoji: tete.option.emoji,
          lignes: couperLibelle(tete.option.short_label),
          question_id: qid,
          pct: pct(tete.n),
          role: "majorite",
          ...hub,
        });
      }

      // Options non mises en avant : éventail latéral au rayon externe. L'angle
      // de l'éventail est borné par la gouttière du secteur pour ne jamais
      // empiéter sur la question voisine.
      const m = externes.length;
      const eventail = Math.min((m <= 1 ? 0 : m - 1) * (ECART_PX / RAYON_EXTERNE), SECTEUR * GARDE);
      externes.forEach((c, k) => {
        const decalage = m <= 1 ? 0 : ((k - (m - 1) / 2) / (m - 1)) * eventail;
        nodes.push({
          id: c.option.id,
          emoji: c.option.emoji,
          lignes: couperLibelle(c.option.short_label),
          question_id: qid,
          pct: pct(c.n),
          role: tranchee ? "minorite" : "partagee",
          ...position(angle + decalage, RAYON_EXTERNE),
        });
      });
    });

    return { nodes, hubs, questionIds, viewBox, ratioViewBox };
  }, [options, responses]);

  // Deux familles de traits seulement : l'anneau qui relie les questions,
  // et un rayon court entre le centre de chaque question et ses options.
  const anneau = hubs.map((h, i) => ({ a: h, b: hubs[(i + 1) % hubs.length]! }));
  const rayons = nodes
    .filter((n) => n.role !== "majorite" && n.role !== "neutre")
    .map((n) => ({ n, hub: hubs[questionIds.indexOf(n.question_id)]! }));

  const style = {
    majorite: { r: 23, fill: "#FF7F50", stroke: "#FF7F50", label: "#FFFFFF", pct: "#FF7F50" },
    partagee: { r: 22, fill: "#3a3a3a", stroke: "#6f6f6f", label: "#D8D8D8", pct: "#9a9a9a" },
    minorite: { r: 17, fill: "#2e2e2e", stroke: "#4a4a4a", label: "#9a9a9a", pct: "#7a7a7a" },
    neutre: { r: 15, fill: "#2a2a2a", stroke: "#454545", label: "#8a8a8a", pct: "#8a8a8a" },
  } as const;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-1.5 px-1 py-2 sm:gap-3 sm:px-6 sm:py-5">
      {/* Boutons d'export : en position fixe dans le coin haut-gauche (z-40,
          au-dessus du dessin), un coin qui ne chevauche ni le lecteur radio
          (haut-droite / bas-droite) ni le panneau animateur (bas-centre).
          Le PNG est ouvert à tous ; le PDF (données nominatives) reste réservé
          à l'animateur. */}
      <div className="fixed left-2 top-2 z-40 flex flex-col gap-1.5 sm:left-3 sm:top-3">
        <button
          type="button"
          onClick={() => void lancerExport("png")}
          disabled={exportEnCours !== null}
          aria-busy={exportEnCours === "png"}
          title="Télécharger la constellation en PNG"
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-strong/95 px-2.5 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur transition-colors hover:border-white/25 hover:text-foreground disabled:opacity-40"
        >
          <Download className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">
            {exportEnCours === "png" ? "Génération…" : "Constellation PNG"}
          </span>
        </button>
        {isHost && (
          <button
            type="button"
            onClick={() => void lancerExport("pdf")}
            disabled={exportEnCours !== null}
            aria-busy={exportEnCours === "pdf"}
            title="Télécharger le résumé en PDF"
            className="flex items-center gap-1.5 rounded-full border border-white/10 bg-surface-strong/95 px-2.5 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur transition-colors hover:border-white/25 hover:text-foreground disabled:opacity-40"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">
              {exportEnCours === "pdf" ? "Génération…" : "Résumé PDF"}
            </span>
          </button>
        )}
      </div>

      <div className="shrink-0 text-center">
        <p className="flex items-center justify-center gap-2 text-[0.65rem] uppercase tracking-widest text-primary sm:text-xs">
          <Radio className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Portrait-robot
        </p>
        <h1 className="text-lg font-bold sm:mt-2 sm:text-3xl">La constellation de RadioKing</h1>
      </div>

      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{ aspectRatio: ratioViewBox }}
          className="max-h-full w-full"
        >
          {anneau.map((e, i) => (
            <line
              key={`anneau-${i}`}
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              stroke="#FF7F50"
              strokeOpacity={0.22}
              strokeWidth={1.2}
            />
          ))}
          {rayons.map(({ n, hub }) => (
            <line
              key={`rayon-${n.id}`}
              x1={hub.x}
              y1={hub.y}
              x2={n.x}
              y2={n.y}
              stroke="#FFFFFF"
              strokeOpacity={0.12}
              strokeWidth={0.8}
              strokeDasharray="4 6"
            />
          ))}
          {nodes.map((n) => {
            const st = style[n.role];
            return (
              <g key={n.id}>
                {n.role === "majorite" && (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={st.r + 5}
                    fill="#FF7F50"
                    opacity={0.1}
                    className="animate-pulse-ring"
                  />
                )}
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={st.r}
                  fill={st.fill}
                  stroke={st.stroke}
                  strokeWidth={1.5}
                />
                {n.emoji && (
                  <text x={n.x} y={n.y + st.r * 0.28} textAnchor="middle" fontSize={st.r * 0.85}>
                    {n.emoji}
                  </text>
                )}
                <text
                  x={n.x}
                  y={n.y + st.r + 13}
                  textAnchor="middle"
                  fontSize={LABEL_FONT}
                  fill={st.label}
                >
                  {n.lignes.map((ligne, i) => (
                    <tspan key={i} x={n.x} dy={i === 0 ? 0 : LABEL_FONT + 2}>
                      {ligne}
                    </tspan>
                  ))}
                </text>
                {n.role !== "neutre" && (
                  <text
                    x={n.x}
                    y={n.y + st.r + 15 + n.lignes.length * (LABEL_FONT + 2)}
                    textAnchor="middle"
                    fontSize={PCT_FONT}
                    fontWeight={700}
                    fill={st.pct}
                  >
                    {n.pct}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
