import { useEffect, useState, useRef } from "react";
import socket from "./socket/socket";
import sound from "./services/sound";

// Import games
import SnakeGame from "./games/snake/SnakeGame";
import GuessTheNumber from "./games/guess-number/GuessTheNumber";
import NeverEver from "./games/never-ever/NeverEver";
import GuessTheImposter from "./games/imposter/GuessTheImposter";

const AVATAR_OPTIONS = ["☠️", "😉", "😂", "🤗", "😡", "👻"];

function App() {
  // Console-specific state
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [screen, setScreen] = useState("landing"); // 'landing', 'splash', 'store', 'game_snake', 'game_guess', 'game_never', 'game_imposter'
  const [selectedGame, setSelectedGame] = useState(0);
  const [lastInput, setLastInput] = useState(null);

  // Web controller-specific state
  const [isWebController, setIsWebController] = useState(false);
  const [controllerRoom, setControllerRoom] = useState("");
  const [controllerJoined, setControllerJoined] = useState(false);
  const [controllerError, setControllerError] = useState("");
  
  // Phase management: 'input', 'waiting', 'splash', 'gamepad'
  const [cPhase, setCPhase] = useState("input");
  const [cPlayerIndex, setCPlayerIndex] = useState(0);
  const [cPlayerName, setCPlayerName] = useState("Player 1");
  const [cPlayerColor, setCPlayerColor] = useState("#00f0ff");
  const [cSelectedAvatar, setCSelectedAvatar] = useState("🎓");
  const [cActiveScreen, setCActiveScreen] = useState("landing");
  const [cPrivatePayload, setCPrivatePayload] = useState(null);
  const [cShowSecret, setCShowSecret] = useState(false);

  // Orientation state for web controller
  const [isPortrait, setIsPortrait] = useState(
    typeof window !== "undefined" ? window.innerHeight > window.innerWidth : false
  );

  const games = [
    {
      id: "game_snake",
      title: "Neon Snake Duel",
      desc: "Classic arcade action for up to 4 players! Grow your snake, trap your roommates, and rule the grid.",
      players: "1 - 4 Players",
      color: "#00f0ff"
    },
    {
      id: "game_guess",
      title: "Hostel Guess Master",
      desc: "A visual bidding duel! Guess prices of campus foods, exam rules, and midnight rickshaw fares.",
      players: "1 - 4 Players",
      color: "#ff007f"
    },
    {
      id: "game_never",
      title: "Never Have I Ever",
      desc: "The ultimate college hostel confessions game. Cast secret votes and flip cards to reveal student secrets!",
      players: "1 - 4 Players",
      color: "#39ff14"
    },
    {
      id: "game_imposter",
      title: "Guess The Imposter",
      desc: "Local social deduction. All players receive a secret campus word except one Imposter. Blabber and vote!",
      players: "2 - 4 Players",
      color: "#ffae00"
    }
  ];

  // Detect mode on load and register orientation checkers
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const room = urlParams.get("room");

    if (mode === "controller" || room || /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      setIsWebController(true);
      if (room) {
        setControllerRoom(room.replace(/\s+/g, "").toUpperCase());
      }
    }

    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Keep references of crucial states to resolve React stale closures in socket events
  const screenRef = useRef(screen);
  const selectedGameRef = useRef(selectedGame);
  const playersRef = useRef(players);
  const roomCodeRef = useRef(roomCode);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { selectedGameRef.current = selectedGame; }, [selectedGame]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  // Main Console Socket Listener
  useEffect(() => {
    if (isWebController) return;

    socket.emit("create-room");

    socket.on("room-created", (code) => {
      setRoomCode(code);
    });

    socket.on("player-list-update", (playerList) => {
      setPlayers(playerList);
      if (playerList.length > 0) {
        sound.playStart();
      }
    });

    socket.on("arcade-started", () => {
      sound.playStart();
      setScreen("splash");
      
      setTimeout(() => {
        setScreen("store");
        socket.emit("console-screen-change", {
          roomCode: roomCodeRef.current,
          screen: "store"
        });
      }, 2500);
    });

    socket.on("controller-input", (inputData) => {
      setLastInput({
        playerIndex: inputData.playerIndex,
        playerColor: inputData.playerColor,
        playerName: inputData.playerName,
        type: inputData.type,
        timestamp: Date.now()
      });

      const activeScreen = screenRef.current;
      const currentSelected = selectedGameRef.current;
      const connectedCount = playersRef.current.length;
      
      if (activeScreen === "store") {
        if (inputData.type === "DOWN") {
          sound.playMove();
          setSelectedGame((prev) => (prev < games.length - 1 ? prev + 1 : 0));
        }

        if (inputData.type === "UP") {
          sound.playMove();
          setSelectedGame((prev) => (prev > 0 ? prev - 1 : games.length - 1));
        }

        if (inputData.type === "BACK") {
          sound.playBack();
          setScreen("landing");
          socket.emit("console-screen-change", {
            roomCode: roomCodeRef.current,
            screen: "landing"
          });
        }

        if (inputData.type === "OK") {
          const selectedId = games[currentSelected].id;
          
          if (selectedId === "game_imposter" && connectedCount < 2) {
            alert("Guess the Imposter requires at least 2 players! Connect another phone.");
            return;
          }

          sound.playSelect();
          sound.playStart();
          setScreen(selectedId);
          socket.emit("console-screen-change", {
            roomCode: roomCodeRef.current,
            screen: selectedId
          });
        }
      }
    });

    return () => {
      socket.off("room-created");
      socket.off("player-list-update");
      socket.off("arcade-started");
      socket.off("controller-input");
    };
  }, [isWebController]);

  // Main Web Controller Socket Listener
  useEffect(() => {
    if (!isWebController) return;

    socket.on("joined-room", (data) => {
      setControllerJoined(true);
      setControllerError("");
      if (data.playerIndex !== undefined) {
        setCPlayerIndex(data.playerIndex);
        setCPlayerName(data.playerName);
        setCPlayerColor(data.playerColor);
        if (data.playerAvatar) {
          setCSelectedAvatar(data.playerAvatar);
        }
      }
      setCPhase("waiting");
      if (navigator.vibrate) navigator.vibrate([0, 50, 50, 50]);
    });

    socket.on("join-error", (err) => {
      setControllerError(err);
      if (navigator.vibrate) navigator.vibrate(150);
    });

    socket.on("player-reassigned", (data) => {
      setCPlayerIndex(data.playerIndex);
      setCPlayerName(data.playerName);
      setCPlayerColor(data.playerColor);
    });

    socket.on("console-screen-change", ({ screen, data }) => {
      setCActiveScreen(screen);
      if (screen === "store" || (data && data.phase === "distributing")) {
        setCPrivatePayload(null);
        setCShowSecret(false);
      }
    });

    socket.on("private-payload", (payload) => {
      setCPrivatePayload(payload);
      if (navigator.vibrate) navigator.vibrate(80);
    });

    socket.on("arcade-started", () => {
      setCPhase("splash");
      if (navigator.vibrate) navigator.vibrate([0, 100, 100, 100]);
      setTimeout(() => {
        setCPhase("gamepad");
      }, 2500);
    });

    socket.on("room-destroyed", () => {
      setControllerJoined(false);
      setCPhase("input");
      alert("Main console disconnected! Lobby closed.");
    });

    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get("room");
    if (room) {
      socket.emit("join-room", room.replace(/\s+/g, "").toUpperCase());
    }

    return () => {
      socket.off("joined-room");
      socket.off("join-error");
      socket.off("player-reassigned");
      socket.off("console-screen-change");
      socket.off("private-payload");
      socket.off("arcade-started");
      socket.off("room-destroyed");
    };
  }, [isWebController]);

  const handleGameExit = (action) => {
    if (action === "store") {
      setScreen("store");
      socket.emit("console-screen-change", {
        roomCode,
        screen: "store"
      });
    } else if (action === "restart") {
      const currentScreen = screen;
      setScreen("store");
      setTimeout(() => {
        setScreen(currentScreen);
        socket.emit("console-screen-change", {
          roomCode,
          screen: currentScreen
        });
      }, 50);
    }
  };



  // ==================== WEB CONTROLLER gamepad UI ====================
  if (isWebController) {
    const handleKeyPress = (val) => {
      if (navigator.vibrate) navigator.vibrate(25);
      setControllerError("");

      if (val === "X") {
        setControllerRoom((prev) => prev.slice(0, -1));
      } else if (val === "OK") {
        if (controllerRoom.length < 4) {
          setControllerError("Room code must be exactly 4 digits!");
          return;
        }
        socket.emit("join-room", {
          roomCode: controllerRoom,
          playerName: cPlayerName,
          playerAvatar: cSelectedAvatar
        });
      } else {
        if (controllerRoom.length < 4) {
          setControllerRoom((prev) => prev + val);
        }
      }
    };

    const handleWebNameChange = (val) => {
      setCPlayerName(val);
      if (controllerJoined) {
        socket.emit("update-player-name", {
          roomCode: controllerRoom,
          name: val,
          avatar: cSelectedAvatar
        });
      }
    };

    const handleWebAvatarSelect = (emoji) => {
      if (navigator.vibrate) navigator.vibrate(30);
      setCSelectedAvatar(emoji);
      if (controllerJoined) {
        socket.emit("update-player-name", {
          roomCode: controllerRoom,
          name: cPlayerName,
          avatar: emoji
        });
      }
    };

    const handleWebYesStart = () => {
      if (navigator.vibrate) navigator.vibrate(60);
      socket.emit("start-arcade", controllerRoom);
    };

    const triggerInput = (type) => {
      if (navigator.vibrate) navigator.vibrate(40);
      socket.emit("controller-input", {
        roomCode: controllerRoom,
        type
      });
    };

    // Render rotate phone warning in Portrait mode (Only when in active gamepad mode!)
    if (isPortrait && cPhase === "gamepad") {
      return (
        <div style={{
          width: "100vw", height: "100vh", backgroundColor: "#06070a",
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
          color: "white", fontFamily: "'Orbitron', sans-serif", padding: "30px", textAlign: "center", boxSizing: "border-box"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "25px", color: "#00f0ff", animation: "pulse 2s infinite ease-in-out" }}>📱🔄</div>
          <h1 className="glow-text-pink" style={{ fontSize: "20px", fontWeight: "900", marginBottom: "15px", letterSpacing: "1px" }}>ROTATION REQUIRED</h1>
          <p style={{ color: "#8b92b6", fontSize: "14px", lineHeight: "1.6", maxWidth: "340px" }}>
            Please rotate your phone horizontally to **Landscape Mode** to play!
            <br /><br />
            <span style={{ fontSize: "11px", color: "#ff007f" }}>Enable Auto-Rotate in your phone settings!</span>
          </p>
        </div>
      );
    }

    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#06070a",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "20px",
        color: "white",
        fontFamily: "'Orbitron', sans-serif",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden"
      }}>
        <div className="scanline-light" />

        {/* Phase 1: Input Room Code and editable nickname (Portrait Layout) */}
        {cPhase === "input" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", alignItems: "center", padding: "10px 0" }}>
            
            {/* Nickname & Avatar Row at the top */}
            <div style={{ width: "100%", maxWidth: "340px", backgroundColor: "#121420", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: "8px", color: "#8b92b6", letterSpacing: "1px", fontWeight: "bold" }}>CHOOSE YOUR NICKNAME:</span>
              <input
                type="text"
                value={cPlayerName}
                onChange={(e) => handleWebNameChange(e.target.value)}
                maxLength={14}
                style={{
                  width: "100%", background: "#08090d", border: "1px solid #1a1e36", color: "#fff",
                  borderRadius: "5px", padding: "6px 10px", fontSize: "12px", fontWeight: "bold",
                  outline: "none", marginTop: "4px", fontFamily: "'Orbitron', sans-serif"
                }}
              />

              <span style={{ fontSize: "8px", color: "#8b92b6", letterSpacing: "1.5px", fontWeight: "bold", display: "block", marginTop: "10px" }}>SELECT YOUR AVATAR:</span>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                {AVATAR_OPTIONS.map((emoji) => {
                  const isActive = cSelectedAvatar === emoji;
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleWebAvatarSelect(emoji)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: isActive ? "rgba(0, 240, 255, 0.08)" : "#161824",
                        border: `1.5px solid ${isActive ? "#00f0ff" : "#2a2d3d"}`,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: "18px",
                        cursor: "pointer",
                        outline: "none",
                        boxShadow: isActive ? "0 0 8px rgba(0, 240, 255, 0.4)" : "none",
                        transition: "all 0.15s ease",
                        transform: isActive ? "scale(1.1)" : "none"
                      }}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Code */}
            <div style={{ textAlign: "center", margin: "10px 0" }}>
              <span style={{ fontSize: "12px", color: "#8b92b6", letterSpacing: "1.5px", fontWeight: "bold" }}>ENTER THE CODE</span>
              <h1 style={{ fontSize: "36px", fontWeight: "900", color: "#00f0ff", letterSpacing: "8px", marginTop: "4px", textShadow: "0 0 10px rgba(0,240,255,0.3)" }}>
                {controllerRoom.padEnd(4, "_")}
              </h1>
              {controllerError && (
                <p style={{ color: "#ff007f", fontSize: "11px", fontWeight: "bold", marginTop: "6px" }}>{controllerError}</p>
              )}
            </div>

            {/* Numeric Keypad layout */}
            <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                {["1", "2", "3"].map(k => (
                  <button key={k} onClick={() => handleKeyPress(k)} style={{ flex: 1, height: "48px", backgroundColor: "#161824", border: "1px solid #2a2d3d", borderRadius: "8px", color: "#fff", fontSize: "18px", fontWeight: "bold", fontFamily: "'Orbitron', sans-serif" }}>{k}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {["4", "5", "6"].map(k => (
                  <button key={k} onClick={() => handleKeyPress(k)} style={{ flex: 1, height: "48px", backgroundColor: "#161824", border: "1px solid #2a2d3d", borderRadius: "8px", color: "#fff", fontSize: "18px", fontWeight: "bold", fontFamily: "'Orbitron', sans-serif" }}>{k}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                {["7", "8", "9"].map(k => (
                  <button key={k} onClick={() => handleKeyPress(k)} style={{ flex: 1, height: "48px", backgroundColor: "#161824", border: "1px solid #2a2d3d", borderRadius: "8px", color: "#fff", fontSize: "18px", fontWeight: "bold", fontFamily: "'Orbitron', sans-serif" }}>{k}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => handleKeyPress("X")} style={{ flex: 1, height: "48px", backgroundColor: "rgba(255,0,127,0.06)", border: "1px solid #ff007f33", borderRadius: "8px", color: "#ff007f", fontSize: "18px", fontWeight: "bold", fontFamily: "'Orbitron', sans-serif" }}>X</button>
                <button onClick={() => handleKeyPress("0")} style={{ flex: 1, height: "48px", backgroundColor: "#161824", border: "1px solid #2a2d3d", borderRadius: "8px", color: "#fff", fontSize: "18px", fontWeight: "bold", fontFamily: "'Orbitron', sans-serif" }}>0</button>
                <button onClick={() => handleKeyPress("OK")} style={{ flex: 1, height: "48px", backgroundColor: "rgba(57,255,20,0.06)", border: "1px solid #39ff1433", borderRadius: "8px", color: "#39ff14", fontSize: "16px", fontWeight: "bold", fontFamily: "'Orbitron', sans-serif" }}>OK</button>
              </div>
            </div>

            <span style={{ fontSize: "9px", color: "#484d6b", letterSpacing: "1px" }}>AETHER LOBBY BRIDGING ENGINE</span>
          </div>
        )}

        {/* Phase 2: Lobby Joined, waiting state + Has everyone joined? with YES button */}
        {cPhase === "waiting" && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", alignItems: "center", padding: "20px 0" }}>
            
            {/* Change nickname & avatar on the fly */}
            <div style={{ width: "100%", maxWidth: "340px", backgroundColor: "#121420", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontSize: "8px", color: "#8b92b6", letterSpacing: "1px", fontWeight: "bold" }}>EDIT NICKNAME IN LOBBY:</span>
              <input
                type="text"
                value={cPlayerName}
                onChange={(e) => handleWebNameChange(e.target.value)}
                maxLength={14}
                style={{
                  width: "100%", background: "#08090d", border: `1px solid ${cPlayerColor}`, color: "#fff",
                  borderRadius: "5px", padding: "6px 10px", fontSize: "12px", fontWeight: "bold",
                  outline: "none", marginTop: "4px", fontFamily: "'Orbitron', sans-serif"
                }}
              />

              <span style={{ fontSize: "8px", color: "#8b92b6", letterSpacing: "1.5px", fontWeight: "bold", display: "block", marginTop: "10px" }}>UPDATE AVATAR:</span>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                {AVATAR_OPTIONS.map((emoji) => {
                  const isActive = cSelectedAvatar === emoji;
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleWebAvatarSelect(emoji)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: isActive ? `${cPlayerColor}15` : "#161824",
                        border: `1.5px solid ${isActive ? cPlayerColor : "#2a2d3d"}`,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        fontSize: "18px",
                        cursor: "pointer",
                        outline: "none",
                        boxShadow: isActive ? `0 0 8px ${cPlayerColor}80` : "none",
                        transition: "all 0.15s ease",
                        transform: isActive ? "scale(1.1)" : "none"
                      }}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Waiting text */}
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: cPlayerColor, boxShadow: `0 0 10px ${cPlayerColor}`, margin: "0 auto 15px auto" }} className="animate-pulse-slow" />
              <h2 style={{ fontSize: "15px", color: "#fff", fontWeight: "bold", letterSpacing: "1px" }}>LOBBY SECURED!</h2>
              <p style={{ color: "#8b92b6", fontSize: "11px", fontStyle: "italic", marginTop: "4px" }}>Waiting for more players to join?...</p>
            </div>

            {/* YES button Confirm drawer */}
            <div style={{ width: "100%", maxWidth: "340px", backgroundColor: "#121420", border: "1px solid rgba(255,255,255,0.05)", padding: "15px", borderRadius: "12px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#8b92b6", fontWeight: "bold", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>HAS EVERYONE JOINED?</span>
              <button 
                onClick={handleWebYesStart}
                style={{
                  width: "100%", backgroundColor: "#39ff14", color: "#000", fontWeight: "900",
                  fontSize: "13px", padding: "12px 0", border: "none", borderRadius: "6px",
                  cursor: "pointer", letterSpacing: "1px", fontFamily: "'Orbitron', sans-serif",
                  boxShadow: "0 0 12px rgba(57,255,20,0.3)"
                }}
              >
                YES, START PLAYING!
              </button>
            </div>

          </div>
        )}

        {/* Phase 3: Transition Splash Screen */}
        {cPhase === "splash" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center" }}>
            <h3 className="glow-text-cyan" style={{ fontSize: "12px", fontWeight: "bold", letterSpacing: "2px", marginBottom: "8px", textShadow: "0 0 10px rgba(0,240,255,0.3)" }}>CONNECTED ENJOY YOUR EXPERIENCE</h3>
            <h1 style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "3px" }}>AETHER ARCADE</h1>
          </div>
        )}

        {/* Phase 4: Active landscape Gamepad (Rotated) */}
        {/* Phase 4: Active landscape Gamepad (Rotated via CSS transform if portrait!) */}
        {cPhase === "gamepad" && (() => {
          // Dynamic button configuration based on active game screen
          const isSnake = cActiveScreen === "game_snake";
          const isGuess = cActiveScreen === "game_guess";
          const isNever = cActiveScreen === "game_never";
          const isImposter = cActiveScreen === "game_imposter";

          const showUP = !isGuess;
          const showDOWN = !isGuess;
          const showLEFT = isSnake || isGuess;
          const showRIGHT = isSnake || isGuess;
          const showOK = !isSnake && !isNever;

          return (
            <div style={{
              display: "flex",
              width: isPortrait ? "100vh" : "100%",
              height: isPortrait ? "100vw" : "100%",
              position: isPortrait ? "absolute" : "relative",
              top: isPortrait ? "50%" : "auto",
              left: isPortrait ? "50%" : "auto",
              transform: isPortrait ? "translate(-50%, -50%) rotate(90deg)" : "none",
              transformOrigin: "center",
              justifyContent: "space-between",
              border: `2.5px solid ${cPlayerColor}`,
              boxShadow: `inset 0 0 15px ${cPlayerColor}1a, 0 0 20px ${cPlayerColor}15`,
              borderRadius: "16px",
              padding: "20px",
              boxSizing: "border-box",
              overflow: "hidden",
              backgroundColor: "#06070a"
            }}>
              
              {/* LEFT PANE: Profile details, clue cabinet, B/BACK button */}
              <div style={{
                width: "40%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                boxSizing: "border-box",
                padding: "5px 10px"
              }}>
                {/* Profile Card */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                  <div style={{
                    width: "74px",
                    height: "74px",
                    borderRadius: "50%",
                    backgroundColor: "#121420",
                    border: `3px solid ${cPlayerColor}`,
                    boxShadow: `0 0 15px ${cPlayerColor}80`,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "36px",
                    marginBottom: "8px"
                  }}>
                    {cSelectedAvatar}
                  </div>
                  <span style={{ color: cPlayerColor, fontWeight: "900", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", textShadow: `0 0 6px ${cPlayerColor}40` }}>{cPlayerName}</span>
                  <span style={{ fontSize: "9px", color: "#8b92b6", marginTop: "2px" }}>ROOM: {controllerRoom}</span>
                </div>

                {/* Private cabinet clue overlay */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "100%", margin: "10px 0" }}>
                  {cPrivatePayload ? (
                    <div style={{ border: `1.5px solid ${cPlayerColor}`, backgroundColor: "#0d0f17", padding: "8px", borderRadius: "8px", textAlign: "center", width: "100%", boxSizing: "border-box" }}>
                      <span style={{ fontSize: "8px", color: "#8b92b6", fontWeight: "bold", letterSpacing: "1px", display: "block" }}>CLUE CABINET</span>
                      {cShowSecret ? (
                        <div>
                          <span style={{ color: "#8b92b6", fontSize: "8px" }}>Category: {cPrivatePayload.category}</span>
                          <p style={{ fontSize: "12px", fontWeight: "900", color: cPrivatePayload.role === "imposter" ? "#ff007f" : "#00f0ff", margin: "2px 0" }}>{cPrivatePayload.word}</p>
                          <button onClick={() => setCShowSecret(false)} style={{ border: "none", background: "#161824", color: "#8b92b6", borderRadius: "3px", padding: "2px 6px", fontSize: "8px", cursor: "pointer" }}>HIDE</button>
                        </div>
                      ) : (
                        <button onClick={() => setCShowSecret(true)} style={{ width: "100%", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", color: "#fff", fontWeight: "bold", padding: "6px 0", borderRadius: "5px", fontSize: "9px", cursor: "pointer", fontFamily: "'Orbitron', sans-serif" }}>REVEAL WORD</button>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: "center" }}>
                      <span style={{ color: "#484d6b", fontSize: "8px", fontWeight: "bold", letterSpacing: "1.5px" }}>PHASE: {cActiveScreen.replace("game_", "").toUpperCase()}</span>
                    </div>
                  )}
                </div>

                {/* B / BACK Button */}
                <button 
                  onTouchStart={(e) => { e.preventDefault(); triggerInput("BACK"); }}
                  onClick={() => triggerInput("BACK")}
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "50%",
                    backgroundColor: "#2e121e",
                    border: "1.5px solid #ff007f",
                    color: "white",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.4)",
                    fontFamily: "'Orbitron', sans-serif",
                    outline: "none"
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "bold" }}>B</span>
                  <span style={{ fontSize: "6px", color: "#ff007f", marginTop: "-3px" }}>BACK</span>
                </button>
              </div>

              {/* RIGHT PANE: Unified Circular Console D-pad Controller */}
              <div style={{
                width: "60%",
                height: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxSizing: "border-box"
              }}>
                <div style={{
                  width: "210px",
                  height: "210px",
                  borderRadius: "50%",
                  backgroundColor: "#10111a",
                  border: "2px solid rgba(255,255,255,0.06)",
                  boxShadow: `0 0 15px rgba(0,0,0,0.5), inset 0 0 10px rgba(255,255,255,0.02)`,
                  position: "relative",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  
                  {/* UP Button (Top edge) */}
                  {showUP && (
                    <button
                      onTouchStart={(e) => { e.preventDefault(); triggerInput("UP"); }}
                      onClick={() => triggerInput("UP")}
                      style={{
                        position: "absolute",
                        top: "5px",
                        left: "70px",
                        width: "70px",
                        height: "55px",
                        borderRadius: "15px 15px 0 0",
                        border: isNever ? "1.5px solid #39ff14" : "1px solid #30344d",
                        backgroundColor: isNever ? "#10261f" : "#1f2233",
                        color: isNever ? "#39ff14" : "#8b92b6",
                        fontSize: isNever ? "8px" : "16px",
                        fontWeight: "bold",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        outline: "none",
                        cursor: "pointer",
                        fontFamily: "'Orbitron', sans-serif"
                      }}
                    >
                      {isNever ? (
                        <>
                          <span>HAVE</span>
                          <span style={{ fontSize: "9px" }}>😈</span>
                        </>
                      ) : "▲"}
                    </button>
                  )}

                  {/* DOWN Button (Bottom edge) */}
                  {showDOWN && (
                    <button
                      onTouchStart={(e) => { e.preventDefault(); triggerInput("DOWN"); }}
                      onClick={() => triggerInput("DOWN")}
                      style={{
                        position: "absolute",
                        bottom: "5px",
                        left: "70px",
                        width: "70px",
                        height: "55px",
                        borderRadius: "0 0 15px 15px",
                        border: isNever ? "1.5px solid #ff007f" : "1px solid #30344d",
                        backgroundColor: isNever ? "#2e121e" : "#1f2233",
                        color: isNever ? "#ff007f" : "#8b92b6",
                        fontSize: isNever ? "8px" : "16px",
                        fontWeight: "bold",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        outline: "none",
                        cursor: "pointer",
                        fontFamily: "'Orbitron', sans-serif"
                      }}
                    >
                      {isNever ? (
                        <>
                          <span>NEVER</span>
                          <span style={{ fontSize: "9px" }}>😇</span>
                        </>
                      ) : "▼"}
                    </button>
                  )}

                  {/* LEFT Button (Left edge) */}
                  {showLEFT && (
                    <button
                      onTouchStart={(e) => { e.preventDefault(); triggerInput("LEFT"); }}
                      onClick={() => triggerInput("LEFT")}
                      style={{
                        position: "absolute",
                        left: "5px",
                        top: "70px",
                        width: "55px",
                        height: "70px",
                        borderRadius: "15px 0 0 15px",
                        border: "1px solid #30344d",
                        backgroundColor: "#1f2233",
                        color: "#8b92b6",
                        fontSize: "16px",
                        fontWeight: "bold",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      ◀
                    </button>
                  )}

                  {/* RIGHT Button (Right edge) */}
                  {showRIGHT && (
                    <button
                      onTouchStart={(e) => { e.preventDefault(); triggerInput("RIGHT"); }}
                      onClick={() => triggerInput("RIGHT")}
                      style={{
                        position: "absolute",
                        right: "5px",
                        top: "70px",
                        width: "55px",
                        height: "70px",
                        borderRadius: "0 15px 15px 0",
                        border: "1px solid #30344d",
                        backgroundColor: "#1f2233",
                        color: "#8b92b6",
                        fontSize: "16px",
                        fontWeight: "bold",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        outline: "none",
                        cursor: "pointer"
                      }}
                    >
                      ▶
                    </button>
                  )}

                  {/* OK/A Button (Nested core center) */}
                  {showOK && (
                    <button
                      onTouchStart={(e) => { e.preventDefault(); triggerInput("OK"); }}
                      onClick={() => triggerInput("OK")}
                      style={{
                        position: "absolute",
                        top: "70px",
                        left: "70px",
                        width: "70px",
                        height: "70px",
                        borderRadius: "50%",
                        border: "2.5px solid #39ff14",
                        backgroundColor: "#10261f",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "bold",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        outline: "none",
                        cursor: "pointer",
                        boxShadow: "0 0 12px rgba(57,255,20,0.3)",
                        fontFamily: "'Orbitron', sans-serif"
                      }}
                    >
                      <span style={{ fontSize: "16px", fontWeight: "bold" }}>A</span>
                      <span style={{ fontSize: "6px", color: "#39ff14", marginTop: "-3px" }}>OK</span>
                    </button>
                  )}
                  
                </div>
              </div>

            </div>
          );
        })()}
      </div>
    );
  }

  // ==================== CONSOLE TV/GAME SCREEN UI ====================
  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      flexDirection: "column",
      position: "relative",
      backgroundColor: "var(--bg-primary)"
    }}>
      <div className="scanline-light" />

      {/* 1. LANDING SCREEN (AirConsole Split Half Roster / Half Joining Layout) */}
      {screen === "landing" && (
        <div style={{ display: "flex", width: "1150px", height: "550px", justifyContent: "space-between", alignItems: "stretch", gap: "50px" }}>
          
          {/* LEFT HALF: Connect Phone Guide & 4-digit Codes */}
          <div className="glass-panel glass-panel-cyan" style={{ flex: 1.2, display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px", textAlign: "center" }}>
            <div>
              <h1 className="font-orbitron glow-text-cyan" style={{ fontSize: "40px", fontWeight: "900", letterSpacing: "1px" }}>AETHER ARCADE</h1>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "12px", lineHeight: "1.5" }}>
                Connect your phones as controllers
              </p>
            </div>

            {/* Instruction Banner */}
            <div style={{ margin: "40px 0" }}>
              <p style={{ color: "#fff", fontSize: "18px", lineHeight: "1.6" }}>
                Open <strong style={{ color: "#00f0ff", textShadow: "0 0 8px rgba(0,240,255,0.4)" }}>aetherarcade.com</strong> on your phone
                <br />
                and enter the code below:
              </p>
              
              {/* Giant Spaced Room Code */}
              <h1 className="font-orbitron glow-text-cyan animate-pulse-slow" style={{ fontSize: "72px", margin: "25px 0", fontWeight: "900", letterSpacing: "12px" }}>
                {roomCode || "LOADING"}
              </h1>
            </div>
          </div>

          {/* RIGHT HALF: Connected Players List */}
          <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", padding: "30px", justifyContent: "space-between" }}>
            <div>
              <span className="font-orbitron" style={{ color: "#8b92b6", fontSize: "12px", letterSpacing: "1.5px" }}>
                CONNECTED LOBBY ({players.length}/4)
              </span>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "20px" }}>
                {players.length === 0 ? (
                  <div style={{ padding: "40px 0", textAlign: "center", color: "#484d6b" }} className="font-orbitron animate-pulse-slow">
                    WAITING FOR PHONES TO KEY-IN CODE...
                  </div>
                ) : (
                  players.map((p) => (
                    <div 
                      key={p.playerIndex} 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "15px",
                        background: "rgba(255, 255, 255, 0.03)",
                        padding: "12px 20px",
                        borderRadius: "10px",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderLeft: `4px solid ${p.playerColor}`,
                        boxShadow: `inset 4px 0 0 ${p.playerColor}`
                      }}
                    >
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: p.playerColor, boxShadow: `0 0 8px ${p.playerColor}` }} />
                      <span style={{ fontSize: "20px" }}>{p.playerAvatar || "🎓"}</span>
                      <span className="font-orbitron" style={{ color: "#fff", fontWeight: "bold", fontSize: "15px" }}>
                        {p.playerName}
                      </span>
                      <span className="font-press-start" style={{ marginLeft: "auto", color: "#39ff14", fontSize: "8px" }}>READY</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Guide footer */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
              {players.length > 0 ? (
                <p className="font-orbitron" style={{ color: "#39ff14", fontSize: "12px", textAlign: "center", fontWeight: "bold" }}>
                  TAP "YES, START PLAYING" ON GAMEPAD TO UNLOCK!
                </p>
              ) : (
                <p className="font-orbitron" style={{ color: "#8b92b6", fontSize: "11px", textAlign: "center" }}>
                  Turn any screen into a party console! Zero extra cost.
                </p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 2. SPLASH TRANSITION SCREEN */}
      {screen === "splash" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h2 className="font-orbitron glow-text-cyan animate-pulse-slow" style={{ fontSize: "22px", fontWeight: "bold", letterSpacing: "4px", marginBottom: "15px" }}>
            CONNECTED ENJOY YOUR EXPERIENCE
          </h2>
          <h1 className="font-orbitron" style={{ fontSize: "56px", fontWeight: "900", letterSpacing: "6px", color: "white" }}>
            AETHER ARCADE
          </h1>
        </div>
      )}

      {/* 3. GAME STORE SCREEN */}
      {screen === "store" && (
        <div style={{ display: "flex", width: "1100px", height: "550px", gap: "40px", alignItems: "stretch" }}>
          
          {/* Left Column: Carousel Menu list */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 className="font-orbitron glow-text-cyan" style={{ fontSize: "28px", letterSpacing: "1px", marginBottom: "20px" }}>CHOOSE MINI-GAME</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                {games.map((g, idx) => {
                  const isSelected = idx === selectedGame;
                  return (
                    <div
                      key={g.id}
                      style={{
                        padding: "15px 25px",
                        borderRadius: "12px",
                        background: isSelected ? `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))` : "transparent",
                        border: `1px solid ${isSelected ? g.color : "transparent"}`,
                        boxShadow: isSelected ? `0 0 15px ${g.color}22` : "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        transition: "all 0.2s ease",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: isSelected ? g.color : "transparent",
                        boxShadow: isSelected ? `0 0 10px ${g.color}` : "none",
                        transition: "all 0.2s ease"
                      }} />

                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="font-orbitron" style={{ 
                          fontSize: "18px", 
                          fontWeight: "bold",
                          color: isSelected ? "#fff" : "var(--color-text-secondary)",
                          transition: "color 0.2s ease"
                        }}>
                          {g.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick dashboard player roster */}
            <div style={{ background: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="font-orbitron" style={{ fontSize: "11px", color: "var(--color-text-secondary)", letterSpacing: "1px" }}>ACTIVE PLAYERS IN LOBBY:</span>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                {players.map(p => (
                  <span 
                    key={p.playerIndex} 
                    className="font-orbitron" 
                    style={{ 
                      fontSize: "12px", 
                      color: p.playerColor, 
                      fontWeight: "bold",
                      border: `1px solid ${p.playerColor}33`,
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: `${p.playerColor}0d`,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>{p.playerAvatar || "🎓"}</span>
                    <span>{p.playerName}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Game Card Detail preview */}
          <div className="glass-panel" style={{
            flex: 1.2,
            border: `2px solid ${games[selectedGame].color}44`,
            boxShadow: `0 0 25px ${games[selectedGame].color}11`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "40px",
            position: "relative"
          }}>
            <div>
              <span className="font-press-start" style={{ 
                color: games[selectedGame].color, 
                backgroundColor: `${games[selectedGame].color}1a`,
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "9px"
              }}>
                {games[selectedGame].players}
              </span>

              <h1 className="font-orbitron" style={{ fontSize: "40px", color: "#fff", fontWeight: "900", margin: "25px 0 15px 0" }}>
                {games[selectedGame].title}
              </h1>

              <p style={{ color: "var(--color-text-secondary)", fontSize: "17px", lineHeight: "1.6" }}>
                {games[selectedGame].desc}
              </p>
            </div>

            {/* Launch instructions */}
            <div style={{ 
              borderTop: "1px solid rgba(255, 255, 255, 0.08)", 
              paddingTop: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
                Scroll: <strong style={{ color: "#fff" }}>UP / DOWN</strong>
              </span>
              <span className="font-orbitron animate-pulse-slow" style={{ fontSize: "15px", color: games[selectedGame].color, fontWeight: "bold" }}>
                Press A / OK to PLAY!
              </span>
            </div>
          </div>

        </div>
      )}

      {/* 4. ACTIVE GAMES */}
      {screen === "game_snake" && (
        <SnakeGame lastInput={lastInput} players={players} onExit={handleGameExit} />
      )}

      {screen === "game_guess" && (
        <GuessTheNumber lastInput={lastInput} players={players} onExit={handleGameExit} />
      )}

      {screen === "game_never" && (
        <NeverEver lastInput={lastInput} players={players} onExit={handleGameExit} />
      )}

      {screen === "game_imposter" && (
        <GuessTheImposter lastInput={lastInput} players={players} roomCode={roomCode} onExit={handleGameExit} />
      )}

    </div>
  );
}

export default App;