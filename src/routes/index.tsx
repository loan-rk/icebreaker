import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/hooks/useGame";
import { FLASH_MS } from "@/lib/game";
import { HostPanel } from "@/components/HostPanel";
import { RadioKingPlayer } from "@/components/RadioKingPlayer";
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
      { title: "This or That - RadioKing" },
      {
        name: "description",
        content:
          "Jeu This or That pour l'icebreaker de la réunion mensuelle RadioKing : vote et découvre la constellation de l'équipe !",
      },
      { property: "og:title", content: "This or That - RadioKing" },
      {
        property: "og:description",
        content: "Vote et révèle la constellation de RadioKing !",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const g = useGame();
  const [hostMode, setHostMode] = useState(false);
  // Passe à vrai au clic « Rejoindre » : ce geste débloque l'audio du
  // navigateur, on en profite pour ouvrir le lecteur radio au montage.
  const [radioAuDemarrage, setRadioAuDemarrage] = useState(false);

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
    return (
      <div className="flex min-h-dvh items-center justify-center text-muted-foreground">…</div>
    );
  }

  if (!g.me) {
    return (
      <JoinScreen
        hostMode={hostMode}
        onToggleHost={() => setHostMode((v) => !v)}
        onJoin={(name) => {
          setRadioAuDemarrage(true);
          void g.join(name, hostMode);
        }}
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
    screen = (
      <Constellation
        options={g.options}
        responses={g.responses}
        questions={g.questions}
        players={g.players}
        isHost={isHost}
      />
    );
  }

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden bg-background">
      {/* Vagues sombres façon radioking.com */}
      <div className="rk-waves" aria-hidden>
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none" className="h-full w-full opacity-70">
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
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{screen}</div>

      {/* Lecteur radio persistant : monté ici (hors des écrans de phase), il
          survit à tous les changements d'écran et joue en continu du lobby
          jusqu'à la constellation. Replié pendant le vote pour ne rien masquer. */}
      <RadioKingPlayer collapsed={phase === "vote"} ouvrirAuDemarrage={radioAuDemarrage} />

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
