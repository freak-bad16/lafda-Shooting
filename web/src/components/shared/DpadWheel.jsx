/**
 * COMPONENT: DpadWheel (Shared)
 * Giant circular D-pad with 4 wedge sectors + center button.
 * Props:
 *   onInput(type)       — called with "UP"|"DOWN"|"LEFT"|"RIGHT"|"OK"
 *   activeScreen        — current game screen id (controls which buttons are visible)
 */

const DpadWheel = ({ onInput, activeScreen }) => {
  const isSnake   = activeScreen === "game_snake";
  const isGuess   = activeScreen === "game_guess";
  const isNever   = activeScreen === "game_never";

  const showUP    = !isGuess;
  const showDOWN  = !isGuess;
  const showLEFT  = isSnake || isGuess;
  const showRIGHT = isSnake || isGuess;
  const showOK    = !isSnake && !isNever;

  const fire = (type) => {
    if (navigator.vibrate) navigator.vibrate(40);
    onInput(type);
  };

  return (
    <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div className="wc-dpad-wheel">

        {showUP && (
          <button
            className="wc-dpad-btn wc-dpad-up"
            onTouchStart={(e) => { e.preventDefault(); fire("UP"); }}
            onClick={() => fire("UP")}
          >
            {isNever ? "HAVE 😈" : "▲"}
          </button>
        )}

        {showLEFT && (
          <button
            className="wc-dpad-btn wc-dpad-left"
            onTouchStart={(e) => { e.preventDefault(); fire("LEFT"); }}
            onClick={() => fire("LEFT")}
          >
            ◀
          </button>
        )}

        {showRIGHT && (
          <button
            className="wc-dpad-btn wc-dpad-right"
            onTouchStart={(e) => { e.preventDefault(); fire("RIGHT"); }}
            onClick={() => fire("RIGHT")}
          >
            ▶
          </button>
        )}

        {showDOWN && (
          <button
            className="wc-dpad-btn wc-dpad-down"
            onTouchStart={(e) => { e.preventDefault(); fire("DOWN"); }}
            onClick={() => fire("DOWN")}
          >
            {isNever ? "NEVER 😇" : "▼"}
          </button>
        )}

        {showOK && (
          <button
            className="wc-dpad-center"
            onTouchStart={(e) => { e.preventDefault(); fire("OK"); }}
            onClick={() => fire("OK")}
          >
            ↵
          </button>
        )}

      </div>
    </div>
  );
};

export default DpadWheel;
