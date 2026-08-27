import { Pause, Play, SkipForward, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Phase } from "@/lib/game";

const PHASE_LABEL: Record<Phase, string> = {
  lobby: "Lobby",
  flash_predict: "Flash prédiction",
  predict: "Prédictions",
  flash_vote: "Flash vote",
  vote: "Votes",
  reveal: "Révélation",
  final: "Constellation",
};

export function HostPanel({
  phase,
  questionId,
  paused,
  onNext,
  onTogglePause,
  onRestart,
  onResetAll,
}: {
  phase: Phase;
  questionId: number;
  paused: boolean;
  onNext: () => void;
  onTogglePause: () => void;
  onRestart: () => void;
  onResetAll: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-surface-strong px-3 py-2 shadow-lg">
      <div className="px-2 text-xs leading-tight">
        <div className="font-semibold">{PHASE_LABEL[phase]}</div>
        <div className="text-muted-foreground">Q{questionId}/6 · Animateur</div>
      </div>
      <button
        onClick={onTogglePause}
        className={cn(
          "flex items-center gap-1 rounded-xl px-3 py-2 text-sm",
          paused ? "bg-primary text-primary-foreground" : "bg-surface",
        )}
      >
        {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
        {paused ? "Reprendre" : "Pause"}
      </button>
      <button
        onClick={onNext}
        className="flex items-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Suivant <SkipForward className="h-4 w-4" />
      </button>
      <button
        onClick={onRestart}
        title="Réinitialiser la partie"
        className="rounded-xl bg-surface p-2 text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
    </div>
  );
}
