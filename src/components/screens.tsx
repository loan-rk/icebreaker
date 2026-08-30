import { useEffect, useMemo, useState } from "react";
import { Users, ArrowRight, Radio } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import {
  MAX_PLAYERS,
  TOTAL_QUESTIONS,
  type Option,
  type Participant,
  type Question,
  type ResponseRow,
} from "@/lib/game";
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
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
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
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="text-center">
        <p className="text-xl font-medium">En attente du lancement...</p>
        <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {players.length}/{MAX_PLAYERS} participants connectés
        </p>
      </div>

      <div className="grid w-full grid-cols-3 gap-4 sm:grid-cols-5">
        {players.map((p) => (
          <div key={p.id} className="flex flex-col items-center gap-2">
            <Avatar name={p.name} size={56} />
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
    <div className="flex min-h-screen items-center justify-center overflow-hidden px-8">
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

/* ---------------- Answer (prediction / vote) ---------------- */

export function AnswerScreen({
  question,
  options,
  kind,
  myAnswer,
  onPick,
  answered,
  players,
  isHost,
}: {
  question: Question;
  options: Option[];
  kind: "prediction" | "vote";
  myAnswer?: string;
  onPick: (id: string) => void;
  answered: ResponseRow[];
  players: Participant[];
  isHost: boolean;
}) {
  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const answeredNames = answered
    .map((r) => byId.get(r.participant_id))
    .filter(Boolean) as Participant[];

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-8 px-6 py-20">
      <div>
        <p className="text-xs uppercase tracking-widest text-primary">
          Question {question.id}/{TOTAL_QUESTIONS} ·{" "}
          {kind === "prediction" ? "Prédiction" : "Ton vote"}
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{question.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {kind === "prediction" ? "Que va choisir la majorité ?" : question.prompt}
        </p>
      </div>

      <div className="grid gap-3">
        {options.map((o) => {
          const picked = myAnswer === o.id;
          // En phase de prédiction, on affiche qui a prédit quoi sous chaque option.
          const pickers =
            kind === "prediction"
              ? (answered
                  .filter((r) => r.option_id === o.id)
                  .map((r) => byId.get(r.participant_id))
                  .filter(Boolean) as Participant[])
              : [];
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
                {kind === "prediction" && pickers.length > 0 && (
                  <span className="ml-auto text-sm font-semibold text-primary">
                    {pickers.length}
                  </span>
                )}
              </span>
              {kind === "prediction" && pickers.length > 0 && (
                <span className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
                  {pickers.map((p) => (
                    <span
                      key={p.id}
                      className="flex items-center gap-2 rounded-full bg-surface-strong py-1 pl-1 pr-3 text-xs"
                    >
                      <Avatar name={p.name} size={20} />
                      {p.name}
                    </span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {kind === "prediction" ? (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Déjà prédit ({answeredNames.length}/{players.length})
          </p>
        </div>
      ) : (
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
      )}
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
      <div className="flex h-24 flex-col items-center justify-end gap-1 text-center">
        <span className="text-3xl">{option.emoji}</span>
        <span className="text-sm text-muted-foreground">{option.label}</span>
      </div>
      <div className="mt-4 flex h-10 items-center">
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
          "text-center text-4xl font-bold",
          winner ? "text-primary" : "text-muted-foreground",
        )}
      >
        {shown}%
      </div>
      <div className="mt-6 flex flex-col items-center gap-2">
        {voters.map((v) => (
          <div key={v.id} className="flex items-center gap-2 text-sm">
            <Avatar name={v.name} size={26} />
            <span className="text-muted-foreground">{v.name}</span>
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
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-10 px-6 py-20">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-primary">
          Résultats · {question.title}
        </p>
        <h1 className="mt-2 text-2xl font-bold">{question.prompt}</h1>
      </div>
      <div className="flex items-start gap-6">
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
  );
}

/* ---------------- Constellation ---------------- */

// Écart minimum (en points de pourcentage) entre la 1re et la 2e option pour
// qu'une question soit considérée comme tranchée. En dessous, elle est
// "partagée" : aucune réponse n'est mise en avant.
const MARGE_MAJORITE = 0.1;

type NoeudConstellation = {
  id: string;
  emoji: string;
  short_label: string;
  question_id: number;
  pct: number;
  role: "majorite" | "minorite" | "partagee";
  x: number;
  y: number;
};

export function Constellation({
  options,
  responses,
}: {
  options: Option[];
  responses: ResponseRow[];
}) {
  const { nodes, hubs, questionIds } = useMemo(() => {
    const votes = responses.filter((r) => r.kind === "vote");
    const questionIds = [...new Set(options.map((o) => o.question_id))].sort((a, b) => a - b);

    const CX = 400;
    const CY = 335;
    const RAYON_CENTRE = 168;
    const RAYON_EXTERNE = 288;
    const APLATISSEMENT = 0.78;
    // Écartement visé entre deux options voisines, en pixels : converti en
    // angle selon le rayon, pour que les pastilles ne se chevauchent jamais.
    const ECART_PX = 112;

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
      const ecart = total > 0 && tete && second ? (tete.n - second.n) / total : 0;
      const tranchee = total > 0 && !!tete && tete.n > 0 && ecart >= MARGE_MAJORITE;

      const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
      const externes = tranchee ? compte.filter((c) => c.option.id !== tete!.option.id) : compte;

      if (tranchee && tete) {
        nodes.push({
          id: tete.option.id,
          emoji: tete.option.emoji,
          short_label: tete.option.short_label,
          question_id: qid,
          pct: pct(tete.n),
          role: "majorite",
          ...hub,
        });
      }

      externes.forEach((c, k) => {
        // Sur une question partagée, les options restent groupées à mi-distance.
        const rayon = tranchee ? RAYON_EXTERNE : (RAYON_CENTRE + RAYON_EXTERNE) / 2;
        const decalage = (k - (externes.length - 1) / 2) * (ECART_PX / rayon);
        nodes.push({
          id: c.option.id,
          emoji: c.option.emoji,
          short_label: c.option.short_label,
          question_id: qid,
          pct: pct(c.n),
          role: tranchee ? "minorite" : "partagee",
          ...position(angle + decalage, rayon),
        });
      });
    });

    return { nodes, hubs, questionIds };
  }, [options, responses]);

  // Deux familles de traits seulement : l'anneau qui relie les 6 questions,
  // et un rayon court entre le centre de chaque question et ses options.
  const anneau = hubs.map((h, i) => ({ a: h, b: hubs[(i + 1) % hubs.length]! }));
  const rayons = nodes
    .filter((n) => n.role !== "majorite")
    .map((n) => ({ n, hub: hubs[questionIds.indexOf(n.question_id)]! }));

  const style = {
    majorite: { r: 33, fill: "#FF7F50", stroke: "#FF7F50", label: "#FFFFFF", pct: "#FF7F50" },
    partagee: { r: 22, fill: "#3a3a3a", stroke: "#6f6f6f", label: "#D8D8D8", pct: "#9a9a9a" },
    minorite: { r: 17, fill: "#2e2e2e", stroke: "#4a4a4a", label: "#9a9a9a", pct: "#7a7a7a" },
  } as const;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="text-center">
        <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-primary">
          <Radio className="h-4 w-4" /> Portrait-robot RadioKing
        </p>
        <h1 className="mt-2 text-3xl font-bold">La Constellation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          En corail, les choix qui font consensus. En gris, les questions qui nous divisent.
        </p>
      </div>

      <svg viewBox="0 0 800 700" className="w-full">
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
                  r={st.r + 10}
                  fill="#FF7F50"
                  opacity={0.12}
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
              <text x={n.x} y={n.y + st.r * 0.28} textAnchor="middle" fontSize={st.r * 0.85}>
                {n.emoji}
              </text>
              <text x={n.x} y={n.y + st.r + 18} textAnchor="middle" fontSize={12} fill={st.label}>
                {n.short_label}
              </text>
              <text
                x={n.x}
                y={n.y + st.r + 33}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill={st.pct}
              >
                {n.pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
