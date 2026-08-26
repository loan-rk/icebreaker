import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { HostPanel } from "@/components/HostPanel";
import {
  AnswerScreen,
  Constellation,
  FlashScreen,
  JoinScreen,
  Lobby,
  RevealScreen,
} from "@/components/screens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Icebreaker RadioKing — Réunion mensuelle" },
      {
        name: "description",
        content:
          "Jeu d'icebreaker temps réel pour la réunion mensuelle RadioKing : prédis, vote et découvre le portrait-robot de l'équipe.",
      },
      { property: "og:title", content: "Icebreaker RadioKing — Réunion mensuelle" },
      {
        property: "og:description",
        content:
          "Prédis les choix de la majorité, vote anonymement et révèle la constellation de l'équipe RadioKing.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const g = useGame();
  const [hostMode, setHostMode] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("host") === "radioking" || p.has("host")) setHostMode(true);
  }, []);

  const question = useMemo(
    () => g.questions.find((q) => q.id === g.state?.question_id) ?? null,
    [g.questions, g.state],
  );
  const options = useMemo(
    () => g.options.filter((o) => o.question_id === g.state?.question_id),
    [g.options, g.state],
  );

  if (!g.ready || !g.state) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">…</div>;
  }

  if (!g.me) {
    return (
      <JoinScreen
        hostMode={hostMode}
        onToggleHost={() => setHostMode((v) => !v)}
        onJoin={(name) => void g.join(name, hostMode)}
      />
    );
  }

  const isHost = g.me.is_host;
  const phase = g.state.phase;
  const myPrediction = g.currentAnswers.prediction.find((r) => r.participant_id === g.me?.id);
  const myVote = g.currentAnswers.vote.find((r) => r.participant_id === g.me?.id);

  let screen: React.ReactNode = null;
  if (phase === "lobby") {
    screen = <Lobby players={g.players} isHost={isHost} onStart={() => void g.advance()} />;
  } else if (phase === "flash_predict") {
    screen = <FlashScreen text="À toi de deviner ce que la majorité va choisir" />;
  } else if (phase === "flash_vote") {
    screen = <FlashScreen text="À toi de choisir" />;
  } else if ((phase === "predict" || phase === "vote") && question) {
    const kind = phase === "predict" ? "prediction" : "vote";
    screen = (
      <AnswerScreen
        question={question}
        options={options}
        kind={kind}
        {...((kind === "prediction" ? myPrediction?.option_id : myVote?.option_id)
          ? { myAnswer: (kind === "prediction" ? myPrediction : myVote)!.option_id }
          : {})}
        onPick={(id) => void g.submit(kind, id)}
        answered={kind === "prediction" ? g.currentAnswers.prediction : g.currentAnswers.vote}
        players={g.players}
        isHost={isHost}
      />
    );
  } else if (phase === "reveal" && question) {
    screen = (
      <RevealScreen
        question={question}
        options={options}
        votes={g.currentAnswers.vote}
        players={g.players}
      />
    );
  } else if (phase === "final") {
    screen = <Constellation options={g.options} responses={g.responses} />;
  }

  return (
    <main className="min-h-screen bg-background">
      {screen}
      {isHost && (
        <HostPanel
          phase={phase}
          questionId={g.state.question_id}
          paused={g.state.paused}
          onNext={() => void g.advance()}
          onTogglePause={() => void g.togglePause()}
          onRestart={() => void g.restart()}
        />
      )}
    </main>
  );
}
