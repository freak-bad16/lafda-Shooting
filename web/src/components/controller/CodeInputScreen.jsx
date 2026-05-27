/**
 * VIEW: CodeInputScreen
 * Controller screen 1 — Enter a 6-digit room code using the circular keypad.
 */

import CircularKeypad from "../shared/CircularKeypad";

const CodeInputScreen = ({ roomCode, error, serverIP, onKey, onSettingsPress }) => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", alignItems: "center" }}>

    {/* Header */}
    <div className="wc-header">
      <div className="wc-logo-mini">
        <div className="wc-logo-icon" />
        <span style={{ fontSize: "16px", fontWeight: "800" }}>Lafda Shooting</span>
      </div>
      <button
        onClick={onSettingsPress}
        style={{ background: "transparent", border: "1px solid rgba(0,229,117,0.3)", borderRadius: "6px", color: "#00e575", fontSize: "11px", fontWeight: "bold", padding: "3px 8px", cursor: "pointer", fontFamily: "inherit" }}
      >
        ⚙ IP: {serverIP}
      </button>
    </div>

    {/* Code Display */}
    <div style={{ width: "100%", textAlign: "center" }}>
      <div className="ac-code-container" style={{ margin: "0 auto 12px auto", width: "fit-content", justifyContent: "center" }}>
        <div className="ac-code-ticket-icon" style={{ backgroundColor: "#00e575" }} />
        <span className="ac-code-text" style={{ fontSize: "28px", letterSpacing: "6px" }}>
          {roomCode.padEnd(6, "_")}
        </span>
      </div>
      {error && (
        <p style={{ color: "#ff007f", fontSize: "12px", fontWeight: "bold", margin: "0 0 8px 0" }}>
          {error}
        </p>
      )}
      <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 20px 0" }}>
        Enter the 6-digit room code shown on screen
      </p>
    </div>

    {/* Circular Keypad */}
    <CircularKeypad onKey={onKey} />

    {/* Footer */}
    <div style={{ padding: "16px 0", color: "#9ca3af", fontSize: "12px", textAlign: "center" }}>
      ❓ Make sure you're on the same WiFi as the TV screen
    </div>
  </div>
);

export default CodeInputScreen;
