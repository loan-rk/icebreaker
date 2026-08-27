import { useEffect, useMemo, useState } from "react";
import { Users, ArrowRight, Radio } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { MAX_PLAYERS, TOTAL_QUESTIONS, type Option, type Participant, type Question, type ResponseRow } from "@/lib/game";
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
          className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
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
}: {
  players: Participant[];
  isHost: boolean;
  onStart: () => void;
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
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
        >
          Démarrer le jeu <ArrowRight className="h-4 w-4" />
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
          "text-center text-3xl font-bold leading-tight sm:text-5xl",
          leaving ? "animate-flash-out-left" : "animate-flash-in",
        )}
      >
        <span className="text-primary">›</span> {text}
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
          Question {question.id}/{TOTAL_QUESTIONS} · {kind === "prediction" ? "Prédiction" : "Ton vote"}
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{question.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {kind === "prediction" ? "Que va choisir la majorité ?" : question.prompt}
        </p>
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
                "flex items-center gap-4 rounded-xl bg-surface px-5 py-4 text-left transition-colors",
                picked ? "ring-2 ring-primary" : "hover:bg-surface-strong",
                isHost && "cursor-default opacity-70",
              )}
            >
              <span className="text-2xl">{o.emoji}</span>
              <span className="font-medium">{o.label}</span>
            </button>
          );
        })}
      </div>

      {kind === "prediction" ? (
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
            Déjà prédit ({answeredNames.length}/{players.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {answeredNames.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-2 rounded-full bg-surface py-1 pl-1 pr-3 text-sm"
              >
                <Avatar name={p.name} size={24} />
                {p.name}
              </span>
            ))}
          </div>
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
            className={cn("h-full rounded-full transition-none", winner ? "bg-primary" : "bg-muted-foreground/60")}
            style={{ width: `${shown}%` }}
          />
        </div>
      </div>
      <div className={cn("text-center text-4xl font-bold", winner ? "text-primary" : "text-muted-foreground")}>
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
        <p className="text-xs uppercase tracking-widest text-primary">Résultats · {question.title}</p>
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

export function Constellation({
  options,
  responses,
}: {
  options: Option[];
  responses: ResponseRow[];
}) {
  const nodes = useMemo(() => {
    const votes = responses.filter((r) => r.kind === "vote");
    const n = options.length;
    // Best count per question => that option is the majority node
    const best = new Map<number, number>();
    for (const o of options) {
      const c = votes.filter((v) => v.option_id === o.id).length;
      best.set(o.question_id, Math.max(best.get(o.question_id) ?? 0, c));
    }
    return options.map((o, i) => {
      const qVotes = votes.filter((v) => v.question_id === o.question_id);
      const mine = qVotes.filter((v) => v.option_id === o.id).length;
      const pct = qVotes.length ? Math.round((mine / qVotes.length) * 100) : 0;
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      const radius = 240 + (i % 2 === 0 ? 0 : 55);
      return {
        ...o,
        pct,
        major: mine > 0 && mine === best.get(o.question_id),
        x: 400 + Math.cos(angle) * radius,
        y: 330 + Math.sin(angle) * radius * 0.72,
      };
    });
  }, [options, responses]);

  const edges = useMemo(() => {
    const out: { key: string; a: (typeof nodes)[number]; b: (typeof nodes)[number]; strong: boolean }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const sameQuestion = a.question_id === b.question_id;
        const bothMajor = a.major && b.major;
        // Majority nodes form the dense web; minority nodes only link to their own question.
        if (!bothMajor && !sameQuestion) continue;
        out.push({ key: `${a.id}-${b.id}`, a, b, strong: bothMajor });
      }
    }
    return out;
  }, [nodes]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="text-center">
        <p className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-primary">
          <Radio className="h-4 w-4" /> Portrait-robot RadioKing
        </p>
        <h1 className="mt-2 text-3xl font-bold">La Constellation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Les ondes majoritaires brillent en corail.
        </p>
      </div>

      <svg viewBox="0 0 800 660" className="w-full">
        {edges.map((e) => (
          <line
            key={e.key}
            x1={e.a.x}
            y1={e.a.y}
            x2={e.b.x}
            y2={e.b.y}
            stroke={e.strong ? "#FF7F50" : "#FFFFFF"}
            strokeOpacity={e.strong ? 0.35 : 0.14}
            strokeWidth={e.strong ? 1.4 : 0.8}
            strokeDasharray={e.strong ? undefined : "4 6"}
          />
        ))}
        {nodes.map((n) => {
          const r = n.major ? 34 : 20;
          return (
            <g key={n.id} className="cursor-pointer">
              <circle
                cx={n.x}
                cy={n.y}
                r={r + 10}
                fill={n.major ? "#FF7F50" : "#FFFFFF"}
                opacity={n.major ? 0.12 : 0.04}
                className={n.major ? "animate-pulse-ring" : undefined}
              />
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={n.major ? "#FF7F50" : "#333333"}
                stroke={n.major ? "#FF7F50" : "#5a5a5a"}
                strokeWidth={1.5}
              />
              <text
                x={n.x}
                y={n.y + r * 0.28}
                textAnchor="middle"
                fontSize={r * 0.85}
              >
                {n.emoji}
              </text>
              <text
                x={n.x}
                y={n.y + r + 20}
                textAnchor="middle"
                fontSize={13}
                fill={n.major ? "#FFFFFF" : "#B5B5B5"}
              >
                {n.short_label}
              </text>
              <text
                x={n.x}
                y={n.y + r + 36}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill={n.major ? "#FF7F50" : "#8a8a8a"}
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
