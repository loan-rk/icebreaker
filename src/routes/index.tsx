import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { FLASH_MS } from "@/lib/game";
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
          "Jeu d'icebreaker temps réel pour la réunion mensuelle RadioKing : vote et découvre le portrait-robot de l'équipe.",
      },
      { property: "og:title", content: "Icebreaker RadioKing — Réunion mensuelle" },
      {
        property: "og:description",
        content:
          "Vote anonymement et révèle la constellation de l'équipe RadioKing.",
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

  // Déjà connecté en participant mais arrivé via ?host= → promotion en animateur.
  useEffect(() => {
    if (hostMode && g.me && !g.me.is_host) void g.becomeHost();
  }, [hostMode, g.me, g]);


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
  const myVote = g.currentAnswers.find((r) => r.participant_id === g.me?.id);

  // Position de la question courante dans la liste chargée (0 si absente) et total réel.
  const questionCount = g.questionIds.length;
  const questionPosition = g.questionIds.indexOf(g.state.question_id) + 1;

  let screen: React.ReactNode = null;
  if (phase === "lobby") {
    screen = (
      <Lobby
        players={g.players}
        isHost={isHost}
        onStart={() => void g.advance()}
        onLeave={() => void g.leave()}
      />
    );

  } else if (phase === "flash_vote") {
    screen = <FlashScreen text="À toi de choisir" exitAfterMs={FLASH_MS - 450} />;
  } else if (phase === "vote" && question) {
    screen = (
      <AnswerScreen
        question={question}
        questionPosition={questionPosition}
        questionCount={questionCount}
        options={options}
        {...(myVote?.option_id ? { myAnswer: myVote.option_id } : {})}
        onPick={(id) => void g.submit(id)}
        answered={g.currentAnswers}
        players={g.players}
        isHost={isHost}
      />
    );
  } else if (phase === "reveal" && question) {
    screen = (
      <RevealScreen
        question={question}
        options={options}
        votes={g.currentAnswers}
        players={g.players}
      />
    );
  } else if (phase === "final") {
    screen = <Constellation options={g.options} responses={g.responses} />;
  }

  return (
    <main className="relative min-h-screen bg-background">
      {/* Vagues sombres façon radioking.com */}
      <div className="rk-waves" aria-hidden>
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="h-full w-full opacity-70"
        >
          <path
            d="M0,0 H520 C430,220 700,330 610,540 C540,720 690,820 760,900 H0 Z"
            fill="#ffffff"
            fillOpacity="0.025"
          />
          <path
            d="M1440,0 H980 C1080,200 830,340 950,540 C1040,700 1180,800 1240,900 H1440 Z"
            fill="#ffffff"
            fillOpacity="0.04"
          />
        </svg>
      </div>
      <div className="relative z-10">{screen}</div>
      {isHost && (
        <HostPanel
          phase={phase}
          questionPosition={questionPosition}
          questionCount={questionCount}
          paused={g.state.paused}
          onNext={() => void g.advance()}
          onTogglePause={() => void g.togglePause()}
          onRestart={() => void g.restart()}
          onResetAll={() => void g.resetAll()}
        />
      )}
    </main>
  );
}
