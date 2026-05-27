/**
 * VIEW: LobbyScreen (Console)
 * TV split-screen lobby — left pane shows guide or player roster,
 * right pane shows room code + QR.
 */

const LobbyScreen = ({
  roomCode,
  players,
  lobbyLeftView,
  activeButtons,
  onLogoClick,
  onToggleView,
  onFullscreen,
}) => {
  const formattedCode = roomCode
    ? roomCode.replace(/\s+/g, "").slice(0, 3) + " " + roomCode.replace(/\s+/g, "").slice(3)
    : "LOADING";

  return (
    <div className="ac-lobby-container">

      {/* ── LEFT PANE ────────────────────────────────────────────── */}
      <div className="ac-lobby-left">
        {lobbyLeftView === "guide" ? (
          // Guide / Tutorial mockup
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div className="ac-mac-frame">
              <div className="ac-mac-header">
                <div className="ac-mac-dot ac-mac-red" />
                <div className="ac-mac-dot ac-mac-yellow" />
                <div className="ac-mac-dot ac-mac-green" />
              </div>
              <div className="ac-mac-content">
                <div className="ac-racing-preview">
                  <div className="ac-racing-half ac-racing-p1">
                    <span className="ac-racing-avatar-label">WING P1</span>
                    <div className="ac-racing-road"><div className="ac-racing-stripes" /></div>
                    <div className="ac-racing-kart">🏎️</div>
                  </div>
                  <div className="ac-racing-half ac-racing-p2">
                    <span className="ac-racing-avatar-label">WING P2</span>
                    <div className="ac-racing-road"><div className="ac-racing-stripes" /></div>
                    <div className="ac-racing-kart ac-racing-p2-avatar">🏎️</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Phone mockups with live button highlights */}
            <div className="ac-phones-row">
              {[0, 1].map((idx) => (
                <div key={idx} className="ac-phone-mockup" style={{ borderColor: activeButtons[idx] ? "#00e575" : "" }}>
                  <div className="ac-phone-notch" />
                  <div className="ac-phone-label">
                    <span style={{ backgroundColor: activeButtons[idx] ? "#00e575" : "" }} />
                    P{idx + 1}
                  </div>
                  <div className="ac-phone-screen">
                    {["LEFT", "USE", "RIGHT"].map((btn) => (
                      <div
                        key={btn}
                        className={`ac-phone-btn${btn === "USE" ? " ac-phone-btn-center" : ""}`}
                        style={{
                          backgroundColor:
                            (btn === "LEFT" && activeButtons[idx] === "LEFT") ? "var(--ac-green)" :
                            (btn === "RIGHT" && activeButtons[idx] === "RIGHT") ? "var(--ac-green)" :
                            (btn === "USE" && ["OK","UP","DOWN"].includes(activeButtons[idx])) ? "var(--ac-blue)" : "",
                          color:
                            (btn !== "USE" && activeButtons[idx] === btn) ? "#000" :
                            (btn === "USE" && ["OK","UP","DOWN"].includes(activeButtons[idx])) ? "#fff" : "",
                        }}
                      >
                        {btn}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="ac-guide-text">Phones + Screen = Console</div>
          </div>
        ) : (
          // Player roster
          <div className="ac-players-container">
            <h1 className="ac-players-title">Players</h1>
            <div className="ac-players-row">
              {Array.from({ length: 4 }).map((_, idx) => {
                const player = players[idx];
                return player ? (
                  <div key={player.playerIndex} className="ac-player-bubble-wrap">
                    <div className="ac-player-bubble" style={{ borderColor: player.playerColor, boxShadow: `0 0 20px ${player.playerColor}60` }}>
                      {player.playerName ? player.playerName.trim().slice(0, 1).toUpperCase() : "P"}
                    </div>
                    <div className="ac-player-name">{player.playerName}</div>
                  </div>
                ) : (
                  <div key={`empty-${idx}`} className="ac-player-bubble-wrap">
                    <div className="ac-player-add-bubble"><span>+</span></div>
                    <div className="ac-player-name" style={{ opacity: 0.4 }}>Player {idx + 1}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {players.length > 0 && (
          <button className="ac-lobby-left-toggle" onClick={onToggleView}>
            {lobbyLeftView === "guide" ? "Show Players" : "Show Guide"}
          </button>
        )}
      </div>

      {/* ── RIGHT PANE ───────────────────────────────────────────── */}
      <div className="ac-lobby-right">
        <div className="ac-lobby-header">
          <div className="ac-logo" onClick={onLogoClick}>
            <div className="ac-logo-icon" />
            <span>Lafda Shooting</span>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="ac-header-ticket">
              <div className="ac-ticket-icon" />
              <span>{formattedCode}</span>
            </div>
            <div className="ac-fullscreen-icon" onClick={onFullscreen}>⛶</div>
          </div>
        </div>

        <h1 className="ac-connect-title">Connect your phones as controllers</h1>
        <p className="ac-connect-subtitle">
          Open <span className="ac-connect-url">{window.location.hostname || "lafda.local"}</span> on your phone
          <br />and <span className="ac-connect-bold">enter the code</span> below:
        </p>

        <div className="ac-code-container">
          <div className="ac-code-ticket-icon" />
          <span className="ac-code-text">{formattedCode}</span>
        </div>

        <div className="ac-or-scan">Or scan:</div>
        <div className="ac-qr-frame">
          <img
            className="ac-qr-img"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=111215&bgcolor=ffffff&data=${encodeURIComponent("http://" + window.location.host + "/?room=" + roomCode)}`}
            alt="Scan to Connect"
          />
        </div>

        <div style={{ position: "absolute", bottom: "30px", left: 0, width: "100%", display: "flex", justifyContent: "center" }}>
          {players.length > 0 ? (
            <div style={{ color: "#00e575", fontSize: "13px", fontWeight: "bold", textShadow: "0 0 8px rgba(0,229,117,0.3)" }}>
              TAP "CHALO SHURU KAREIN" ON YOUR PHONE TO PLAY!
            </div>
          ) : (
            <div style={{ color: "#525866", fontSize: "11px" }}>
              Turn any screen into a party console! Zero extra cost.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default LobbyScreen;
