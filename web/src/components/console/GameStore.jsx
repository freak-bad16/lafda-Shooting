/**
 * VIEW: GameStore (Console)
 * TV game selection carousel — navigate with D-pad, press OK to launch.
 */

import GAMES from "../../constants/gamesList";

const GameStore = ({ selectedGame, players }) => (
  <div style={{ display: "flex", width: "1100px", height: "550px", gap: "40px", alignItems: "stretch" }}>

    {/* Left: Game list */}
    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <h2
          className="font-orbitron glow-text-cyan"
          style={{ fontSize: "28px", letterSpacing: "1px", marginBottom: "20px" }}
        >
          CHOOSE MINI-GAME
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {GAMES.map((g, idx) => {
            const isSelected = idx === selectedGame;
            return (
              <div
                key={g.id}
                style={{
                  padding: "15px 25px",
                  borderRadius: "12px",
                  background: isSelected ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))" : "transparent",
                  border: `1px solid ${isSelected ? g.color : "transparent"}`,
                  boxShadow: isSelected ? `0 0 15px ${g.color}22` : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{
                  width: "8px", height: "8px", borderRadius: "50%",
                  backgroundColor: isSelected ? g.color : "transparent",
                  boxShadow: isSelected ? `0 0 10px ${g.color}` : "none",
                  transition: "all 0.2s ease",
                }} />
                <span className="font-orbitron" style={{ fontSize: "18px", fontWeight: "bold", color: isSelected ? "#fff" : "var(--ac-text-secondary)", transition: "color 0.2s ease" }}>
                  {g.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active players roster */}
      <div style={{ background: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="font-orbitron" style={{ fontSize: "11px", color: "var(--ac-text-secondary)", letterSpacing: "1px" }}>
          ACTIVE PLAYERS IN LOBBY:
        </span>
        <div style={{ display: "flex", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
          {players.map((p) => (
            <span key={p.playerIndex} className="font-orbitron" style={{ fontSize: "12px", color: p.playerColor, fontWeight: "bold", border: `1px solid ${p.playerColor}33`, padding: "4px 8px", borderRadius: "6px", background: `${p.playerColor}0d`, display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{p.playerAvatar || "🎓"}</span>
              <span>{p.playerName}</span>
            </span>
          ))}
        </div>
      </div>
    </div>

    {/* Right: Game detail card */}
    <div
      className="glass-panel"
      style={{ flex: 1.2, border: `2px solid ${GAMES[selectedGame].color}44`, boxShadow: `0 0 25px ${GAMES[selectedGame].color}11`, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px", position: "relative" }}
    >
      <div>
        <span className="font-press-start" style={{ color: GAMES[selectedGame].color, backgroundColor: `${GAMES[selectedGame].color}1a`, padding: "6px 12px", borderRadius: "6px", fontSize: "9px" }}>
          {GAMES[selectedGame].players}
        </span>
        <h1 className="font-orbitron" style={{ fontSize: "40px", color: "#fff", fontWeight: "900", margin: "25px 0 15px 0" }}>
          {GAMES[selectedGame].title}
        </h1>
        <p style={{ color: "var(--ac-text-secondary)", fontSize: "17px", lineHeight: "1.6" }}>
          {GAMES[selectedGame].desc}
        </p>
      </div>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "14px", color: "var(--ac-text-secondary)" }}>
          Scroll: <strong style={{ color: "#fff" }}>UP / DOWN</strong>
        </span>
        <span className="font-orbitron animate-pulse-slow" style={{ fontSize: "15px", color: GAMES[selectedGame].color, fontWeight: "bold" }}>
          Press OK to PLAY!
        </span>
      </div>
    </div>

  </div>
);

export default GameStore;
