export type Phase =
  | "lobby"
  | "flash_vote"
  | "vote"
  | "reveal"
  | "final";

export type Question = { id: number; title: string; prompt: string };
export type Option = {
  id: string;
  question_id: number;
  emoji: string;
  label: string;
  short_label: string;
  position: number;
};
export type Participant = {
  id: string;
  name: string;
  is_host: boolean;
  created_at: string;
};
export type ResponseRow = {
  id: string;
  participant_id: string;
  question_id: number;
  kind: "vote";
  option_id: string;
};
export type GameState = {
  id: number;
  phase: Phase;
  question_id: number;
  paused: boolean;
  phase_started_at: string;
};

export const MAX_PLAYERS = 20;
export const FLASH_MS = 2000;
export const SAFETY_MS = 20000;

export const PHASE_DURATION: Partial<Record<Phase, number>> = {
  flash_vote: FLASH_MS,
  vote: SAFETY_MS,
};

/**
 * Détermine la phase suivante à partir de la liste ordonnée des identifiants
 * de questions réellement chargées depuis Supabase. On raisonne toujours en
 * position dans la liste : les identifiants peuvent être non contigus (trou
 * après une suppression en base).
 */
export function nextPhase(
  phase: Phase,
  questionId: number,
  questionIds: number[],
): { phase: Phase; question_id: number } {
  switch (phase) {
    case "lobby": {
      const first = questionIds[0];
      return first === undefined
        ? { phase: "final", question_id: questionId }
        : { phase: "flash_vote", question_id: first };
    }
    case "flash_vote":
      return { phase: "vote", question_id: questionId };
    case "vote":
      return { phase: "reveal", question_id: questionId };
    case "reveal": {
      const index = questionIds.indexOf(questionId);
      const next = index === -1 ? undefined : questionIds[index + 1];
      return next === undefined
        ? { phase: "final", question_id: questionId }
        : { phase: "flash_vote", question_id: next };
    }
    default:
      return { phase: "final", question_id: questionId };
  }
}

export function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase();
}

/** Deterministic hue per name so an avatar keeps its color everywhere. */
export function avatarHue(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}
