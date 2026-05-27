/**
 * PAGE: ConsolePage
 * Assembles all console (TV) screens using the useConsole hook.
 * FIX: Persistent floating fullscreen button visible on ALL screens.
 */

import useConsole from "../hooks/useConsole";
import LandingScreen from "../components/console/LandingScreen";
import LobbyScreen   from "../components/console/LobbyScreen";
import GameStore     from "../components/console/GameStore";

// Game components
import SnakeGame         from "../games/snake/SnakeGame";
import GuessTheNumber    from "../games/guess-number/GuessTheNumber";
import NeverEver         from "../games/never-ever/NeverEver";
import GuessTheImposter  from "../games/imposter/GuessTheImposter";

const ConsolePage = () => {
  const c = useConsole();

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", position: "relative", backgroundColor: "var(--ac-dark)", overflow: "hidden" }}>
      <div className="scanline-light" />

      {/* ── FIX 1: Persistent fullscreen toggle — always visible ─────────── */}
      <div
        onClick={c.enterFullscreen}
        title={c.isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        style={{
          position: "fixed",
          bottom: "18px",
          right: "18px",
          zIndex: 9999,
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
          color: "#ffffff",
          fontSize: "16px",
          transition: "background 0.2s ease",
          userSelect: "none",
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.14)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"}
      >
        {c.isFullscreen ? "⊠" : "⛶"}
      </div>

      {/* ── Screens ──────────────────────────────────────────────────────── */}

      {c.screen === "landing" && (
        <LandingScreen onStart={() => c.setScreen("lobby")} />
      )}

      {c.screen === "lobby" && (
        <LobbyScreen
          roomCode={c.roomCode}
          players={c.players}
          lobbyLeftView={c.lobbyLeftView}
          activeButtons={c.activeButtons}
          onLogoClick={() => c.setScreen("landing")}
          onToggleView={c.toggleLobbyView}
          // FIX 1: fullscreen button is now global — no longer needed inside LobbyScreen
          onFullscreen={c.enterFullscreen}
        />
      )}

      {c.screen === "splash" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 className="font-orbitron glow-text-cyan animate-pulse-slow" style={{ fontSize: "22px", fontWeight: "bold", letterSpacing: "4px", marginBottom: "15px" }}>
            CONNECTED — ENJOY YOUR EXPERIENCE
          </h2>
          <h1 className="font-orbitron" style={{ fontSize: "56px", fontWeight: "900", letterSpacing: "6px", color: "white" }}>
            LAFDA SHOOTING
          </h1>
        </div>
      )}

      {c.screen === "store" && (
        <GameStore selectedGame={c.selectedGame} players={c.players} />
      )}

      {c.screen === "game_snake" && (
        <SnakeGame lastInput={c.lastInput} players={c.players} onExit={c.handleGameExit} />
      )}
      {c.screen === "game_guess" && (
        <GuessTheNumber lastInput={c.lastInput} players={c.players} onExit={c.handleGameExit} />
      )}
      {c.screen === "game_never" && (
        <NeverEver lastInput={c.lastInput} players={c.players} onExit={c.handleGameExit} />
      )}
      {c.screen === "game_imposter" && (
        <GuessTheImposter lastInput={c.lastInput} players={c.players} roomCode={c.roomCode} onExit={c.handleGameExit} />
      )}
    </div>
  );
};

export default ConsolePage;
