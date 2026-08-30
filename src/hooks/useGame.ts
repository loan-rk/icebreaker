import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  nextPhase,
  PHASE_DURATION,
  type GameState,
  type Option,
  type Participant,
  type Question,
  type ResponseRow,
} from "@/lib/game";

const STORAGE_KEY = "rk-icebreaker-participant";

export function useGame() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [state, setState] = useState<GameState | null>(null);
  const [me, setMe] = useState<Participant | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const [q, o, p, r, g] = await Promise.all([
      supabase.from("questions").select("*").order("id"),
      supabase.from("options").select("*").order("position"),
      supabase.from("participants").select("*").order("created_at"),
      supabase.from("responses").select("*"),
      supabase.from("game_state").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (q.data) setQuestions(q.data as Question[]);
    if (o.data) setOptions(o.data as Option[]);
    if (p.data) setParticipants(p.data as Participant[]);
    if (r.data) setResponses(r.data as ResponseRow[]);
    if (g.data) setState(g.data as GameState);
  }, []);

  // Initial load + restore local identity
  useEffect(() => {
    let alive = true;
    (async () => {
      await refresh();
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { data } = await supabase
          .from("participants")
          .select("*")
          .eq("id", stored)
          .maybeSingle();
        if (alive && data) setMe(data as Participant);
        else localStorage.removeItem(STORAGE_KEY);
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [refresh]);

  // Realtime: refetch on any change (small dataset, always consistent)
  useEffect(() => {
    const channel = supabase
      .channel("icebreaker")
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "responses" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "game_state" }, refresh)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  // If the host wiped the players, drop the local identity so the join screen returns.
  // Re-check the participant directly before clearing it: the realtime participant
  // list can briefly be stale immediately after a successful join.
  useEffect(() => {
    if (!ready || !me || participants.length === 0) return;
    if (participants.some((p) => p.id === me.id)) return;

    let alive = true;
    void (async () => {
      const { data, error } = await supabase
        .from("participants")
        .select("id")
        .eq("id", me.id)
        .maybeSingle();

      if (!alive || error || data) return;
      localStorage.removeItem(STORAGE_KEY);
      setMe(null);
    })();

    return () => {
      alive = false;
    };
  }, [ready, me, participants]);

  const join = useCallback(async (name: string, isHost: boolean) => {
    const { data, error } = await supabase
      .from("participants")
      .insert({ name: name.trim(), is_host: isHost })
      .select()
      .single();
    if (error || !data) throw error;
    localStorage.setItem(STORAGE_KEY, data.id);
    setMe(data as Participant);
    return data as Participant;
  }, []);

  const leave = useCallback(async () => {
    if (me) await supabase.from("participants").delete().eq("id", me.id);
    localStorage.removeItem(STORAGE_KEY);
    setMe(null);
  }, [me]);

  /** Promote the local participant to host (used by the ?host= URL param). */
  const becomeHost = useCallback(async () => {
    if (!me || me.is_host) return;
    const { data } = await supabase
      .from("participants")
      .update({ is_host: true })
      .eq("id", me.id)
      .select()
      .maybeSingle();
    if (data) setMe(data as Participant);
    await refresh();
  }, [me, refresh]);


  const submit = useCallback(
    async (kind: "prediction" | "vote", optionId: string) => {
      if (!me || !state) return;
      await supabase.from("responses").upsert(
        {
          participant_id: me.id,
          question_id: state.question_id,
          kind,
          option_id: optionId,
        },
        { onConflict: "participant_id,question_id,kind" },
      );
      await refresh();
    },
    [me, state, refresh],
  );

  const setGame = useCallback(async (patch: Partial<GameState>) => {
    await supabase
      .from("game_state")
      .update({ ...patch, phase_started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", 1);
  }, []);

  const advance = useCallback(async () => {
    if (!state) return;
    const n = nextPhase(state.phase, state.question_id);
    await setGame(n);
  }, [state, setGame]);

  const restart = useCallback(async () => {
    await supabase.from("responses").delete().neq("question_id", -1);
    await setGame({ phase: "lobby", question_id: 1, paused: false });
  }, [setGame]);

  /** Full reset: wipes responses AND every participant (hosts kept). */
  const resetAll = useCallback(async () => {
    await supabase.from("responses").delete().neq("question_id", -1);
    await supabase.from("participants").delete().eq("is_host", false);
    await setGame({ phase: "lobby", question_id: 1, paused: false });
    await refresh();
  }, [setGame, refresh]);

  const togglePause = useCallback(async () => {
    if (!state) return;
    await supabase.from("game_state").update({ paused: !state.paused }).eq("id", 1);
  }, [state]);

  // Host drives the clock (2s flashes, 20s safety timer on answer screens)
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  const isHost = !!me?.is_host;
  const players = useMemo(() => participants.filter((p) => !p.is_host), [participants]);

  const currentAnswers = useMemo(() => {
    if (!state) return { prediction: [] as ResponseRow[], vote: [] as ResponseRow[] };
    const forQ = responses.filter((r) => r.question_id === state.question_id);
    return {
      prediction: forQ.filter((r) => r.kind === "prediction"),
      vote: forQ.filter((r) => r.kind === "vote"),
    };
  }, [responses, state]);

  const everyoneAnswered =
    players.length > 0 &&
    ((state?.phase === "predict" && currentAnswers.prediction.length >= players.length) ||
      (state?.phase === "vote" && currentAnswers.vote.length >= players.length));

  useEffect(() => {
    if (!isHost || !state || state.paused) return;
    const duration = PHASE_DURATION[state.phase];
    if (!duration) return;
    const elapsed = Date.now() - new Date(state.phase_started_at).getTime();
    const wait = everyoneAnswered ? 600 : Math.max(0, duration - elapsed);
    const t = setTimeout(() => void advanceRef.current(), wait);
    return () => clearTimeout(t);
  }, [isHost, state, everyoneAnswered]);

  return {
    ready,
    me,
    state,
    questions,
    options,
    participants,
    players,
    responses,
    currentAnswers,
    join,
    leave,
    becomeHost,

    submit,
    advance,
    togglePause,
    restart,
    resetAll,
    setGame,
  };
}
