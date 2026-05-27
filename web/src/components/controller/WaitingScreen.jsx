/**
 * VIEW: WaitingScreen
 * Controller screen 2 — Lobby waiting room with player avatar and name editor.
 */

import PlayerAvatar from "../shared/PlayerAvatar";

const WaitingScreen = ({ playerName, playerColor, roomCode, onNameChange, onYesStart }) => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", alignItems: "center" }}>

    {/* Logo header */}
    <div className="wc-header" style={{ justifyContent: "center" }}>
      <div className="wc-logo-mini">
        <div className="wc-logo-icon" />
        <span style={{ fontSize: "16px", fontWeight: "800" }}>Lafda Shooting</span>
      </div>
    </div>

    {/* Large Avatar Bubble */}
    <div className="wc-profile-avatar-wrap">
      <div
        className="wc-roster-avatar"
        style={{ backgroundColor: playerColor, boxShadow: `0 10px 30px ${playerColor}40` }}
      >
        {playerName ? playerName.trim().slice(0, 1).toUpperCase() : "P"}
      </div>
      <input
        type="text"
        className="wc-roster-name-input"
        value={playerName}
        onChange={(e) => onNameChange(e.target.value)}
        maxLength={14}
      />
      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "6px" }}>
        ✏ Tap to change nickname
      </div>
    </div>

    {/* Status messages */}
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "#fff", fontSize: "16px", fontWeight: "600" }}>
        Sab aagaye kya? 🤔
      </p>
      <p style={{ color: "#9ca3af", fontSize: "12px", marginTop: "4px" }}>
        Room Wing: {roomCode}
      </p>
    </div>

    {/* Start trigger */}
    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "10px" }}>
        Has everyone joined?
      </span>
      <button className="wc-btn-capsule-solid" onClick={onYesStart}>
        Chalo Shuru Karein! 🎮
      </button>
    </div>

  </div>
);

export default WaitingScreen;
