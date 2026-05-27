/**
 * VIEW: GamepadScreen
 * Controller screen 3 — Active gamepad with:
 * - Snake touch controls
 * - Normal D-pad wheel
 * - Functional action shelf
 * - Clue cabinet
 */

import PlayerAvatar from "../shared/PlayerAvatar";
import DpadWheel from "../shared/DpadWheel";

const GamepadScreen = ({
  playerName,
  playerColor,
  roomCode,
  activeScreen,
  privatePayload,
  showSecret,
  setShowSecret,
  onInput,
  onEditNickname,
  onExit,
}) => {

  // FIX: Detect snake correctly
  const isSnake =
    activeScreen?.toLowerCase().includes("snake");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        width: "100%",
      }}
    >

      {/* HEADER */}
      <div className="wc-active-header">
        <PlayerAvatar
          name={playerName}
          color={playerColor}
          size={48}
        />

        <div style={{ marginLeft: "12px" }}>
          <div className="wc-active-name">
            {playerName}
          </div>

          <div
            style={{
              fontSize: "10px",
              color: "#9ca3af",
            }}
          >
            Wing: {roomCode}
          </div>
        </div>

        <div
          className="wc-active-edit"
          onClick={onEditNickname}
        >
          Edit ✏
        </div>
      </div>

      {/* CLUE CABINET */}
      {privatePayload && (
        <div
          style={{
            border: `1.5px solid ${playerColor}`,
            backgroundColor: "#111215",
            padding: "10px",
            borderRadius: "14px",
            textAlign: "center",
            margin: "8px 0",
          }}
        >
          <span
            style={{
              fontSize: "9px",
              color: "#9ca3af",
              fontWeight: "bold",
              letterSpacing: "1px",
              display: "block",
            }}
          >
            CLUE CABINET
          </span>

          {showSecret ? (
            <div>
              <span
                style={{
                  color: "#9ca3af",
                  fontSize: "10px",
                }}
              >
                Category: {privatePayload.category}
              </span>

              <p
                style={{
                  fontSize: "15px",
                  fontWeight: "900",
                  color:
                    privatePayload.role === "imposter"
                      ? "#ff007f"
                      : "#00e575",
                  margin: "4px 0",
                }}
              >
                {privatePayload.word}
              </p>

              <button
                onClick={() => setShowSecret(false)}
                style={{
                  border: "none",
                  background: "#1c1d24",
                  color: "#9ca3af",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "10px",
                  cursor: "pointer",
                }}
              >
                HIDE
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSecret(true)}
              style={{
                width: "100%",
                border:
                  "1px solid rgba(255,255,255,0.05)",
                background:
                  "rgba(255,255,255,0.02)",
                color: "#fff",
                fontWeight: "bold",
                padding: "8px 0",
                borderRadius: "8px",
                fontSize: "11px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              REVEAL WORD
            </button>
          )}
        </div>
      )}

      {/* ACTION SHELF */}
      <div className="wc-shelf-bar">

        {/* EXIT */}
        <div
          className="wc-shelf-btn"
          onClick={onExit}
          title="Exit session"
          style={{
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "16px" }}>
            🚪
          </span>

          <span
            style={{
              fontSize: "8px",
              color: "#9ca3af",
              fontWeight: "600",
            }}
          >
            EXIT
          </span>
        </div>

        {/* BACK */}
        <div
          className="wc-shelf-btn"
          onClick={() => onInput("BACK")}
          title="Back"
          style={{
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "16px" }}>
            ↩
          </span>

          <span
            style={{
              fontSize: "8px",
              color: "#9ca3af",
              fontWeight: "600",
            }}
          >
            BACK
          </span>
        </div>

        {/* GAMES */}
        <div
          className="wc-shelf-btn"
          onClick={() => onInput("SEARCH")}
          title="Search games"
          style={{
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span style={{ fontSize: "16px" }}>
            🎮
          </span>

          <span
            style={{
              fontSize: "8px",
              color: "#9ca3af",
              fontWeight: "600",
            }}
          >
            GAMES
          </span>
        </div>

      </div>

      {/* CONTROLS */}
      {isSnake ? (

        /* SNAKE CONTROLS */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "18px",
            paddingBottom: "18px",
          }}
        >

          {/* UP */}
          <button
            onTouchStart={() => onInput("UP")}
            onMouseDown={() => onInput("UP")}
            style={snakeVerticalBtn}
          >
            ▲
          </button>

          {/* LEFT RIGHT */}
          <div
            style={{
              display: "flex",
              gap: "28px",
            }}
          >

            <button
              onTouchStart={() => onInput("LEFT")}
              onMouseDown={() => onInput("LEFT")}
              style={snakeHorizontalBtn}
            >
              ◀
            </button>

            <button
              onTouchStart={() => onInput("RIGHT")}
              onMouseDown={() => onInput("RIGHT")}
              style={snakeHorizontalBtn}
            >
              ▶
            </button>

          </div>

          {/* DOWN */}
          <button
            onTouchStart={() => onInput("DOWN")}
            onMouseDown={() => onInput("DOWN")}
            style={snakeVerticalBtn}
          >
            ▼
          </button>

        </div>

      ) : (

        /* NORMAL D-PAD */
        <DpadWheel
          onInput={onInput}
          activeScreen={activeScreen}
        />

      )}

    </div>
  );
};

/* SNAKE BUTTON STYLES */

const baseSnakeBtn = {
  border: "2px solid #2d3140",
  background: "#1b1c24",
  color: "#ffffff",
  fontSize: "34px",
  fontWeight: "900",
  borderRadius: "22px",
  cursor: "pointer",
  userSelect: "none",
  boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
};

const snakeVerticalBtn = {
  ...baseSnakeBtn,
  width: "100px",
  height: "76px",
};

const snakeHorizontalBtn = {
  ...baseSnakeBtn,
  width: "120px",
  height: "86px",
};

export default GamepadScreen;