import { useEffect, useRef, useState } from "react";
import sound from "../../services/sound";

const HOSTEL_PROMPTS = [
  { text: "Guess the price of an extra cheese Maggi + Chai at the hostel gate (INR)", min: 10, max: 150, target: 85 },
  { text: "Guess the number of proxy attendances a hostel roomie can pull off before getting caught", min: 1, max: 20, target: 12 },
  { text: "Guess the maximum number of people packed inside a single hostel room during exam night", min: 2, max: 25, target: 14 },
  { text: "Guess the cost of a last-minute auto-rickshaw ride to the exam center when running late (INR)", min: 50, max: 400, target: 180 },
  { text: "Guess the temperature of a hostel bathroom shower in peak December (Celsius)", min: 2, max: 45, target: 8 },
  { text: "Guess the standard number of unwashed coffee mugs currently in a hostel room", min: 1, max: 30, target: 17 },
  { text: "Guess the average semester CGPA of a hostel backbencher (out of 10) times 10", min: 40, max: 100, target: 63 }
];

function GuessTheNumber({ lastInput, players, onExit }) {
  const [activePrompt, setActivePrompt] = useState(HOSTEL_PROMPTS[0]);
  const [gameState, setGameState] = useState("guessing"); // 'guessing', 'revealed', 'gameover'
  const [playerGuesses, setPlayerGuesses] = useState({});
  const [lockedGuesses, setLockedGuesses] = useState({});
  const [points, setPoints] = useState({});
  const [clues, setClues] = useState({});
  const [roundWinner, setRoundWinner] = useState("");
  const [matchWinner, setMatchWinner] = useState(null);

  const activePlayers = players.length > 0 ? players : [
    { playerIndex: 0, playerName: "Player 1", playerColor: "#00f0ff" }
  ];

  // Store refs to prevent stale closure loops
  const stateRef = useRef({
    gameState: "guessing",
    playerGuesses: {},
    lockedGuesses: {},
    points: {},
    promptIndex: 0
  });

  // Initialize
  useEffect(() => {
    const initialGuesses = {};
    const initialPoints = {};
    
    activePlayers.forEach(p => {
      initialGuesses[p.playerIndex] = Math.floor((activePrompt.min + activePrompt.max) / 2);
      initialPoints[p.playerIndex] = 0;
    });

    stateRef.current = {
      gameState: "guessing",
      playerGuesses: initialGuesses,
      lockedGuesses: {},
      points: initialPoints,
      promptIndex: 0
    };

    setPlayerGuesses(initialGuesses);
    setLockedGuesses({});
    setPoints(initialPoints);
    setGameState("guessing");
    setMatchWinner(null);
    setActivePrompt(HOSTEL_PROMPTS[0]);
    sound.playStart();
  }, [players]);

  // Handle inputs
  useEffect(() => {
    if (!lastInput) return;
    const { playerIndex, type } = lastInput;
    const state = stateRef.current;

    if (state.gameState === "guessing") {
      const min = activePrompt.min;
      const max = activePrompt.max;
      const currentGuess = state.playerGuesses[playerIndex] ?? Math.floor((min + max) / 2);

      // Lock status check
      if (state.lockedGuesses[playerIndex]) return;

      let nextGuess = currentGuess;
      let moved = false;

      if (type === "LEFT") {
        nextGuess = Math.max(min, currentGuess - 1);
        moved = true;
      }
      if (type === "RIGHT") {
        nextGuess = Math.min(max, currentGuess + 1);
        moved = true;
      }
      if (type === "DOWN") {
        nextGuess = Math.max(min, currentGuess - 5);
        moved = true;
      }
      if (type === "UP") {
        nextGuess = Math.min(max, currentGuess + 5);
        moved = true;
      }

      if (moved) {
        state.playerGuesses[playerIndex] = nextGuess;
        setPlayerGuesses({ ...state.playerGuesses });
        sound.playMove();
      }

      if (type === "OK") {
        state.lockedGuesses[playerIndex] = true;
        setLockedGuesses({ ...state.lockedGuesses });
        sound.playSelect();

        // Check if all players have locked in their guesses
        const allLocked = activePlayers.every(p => state.lockedGuesses[p.playerIndex]);
        if (allLocked) {
          revealRound();
        }
      }
      
      if (type === "BACK") {
        sound.playBack();
        onExit("store");
      }
    } else if (state.gameState === "revealed") {
      if (type === "OK") {
        sound.playSelect();
        // Go to next round or show match over
        const matchOver = activePlayers.some(p => state.points[p.playerIndex] >= 3);
        if (matchOver) {
          const maxP = activePlayers.reduce((max, p) => 
            state.points[p.playerIndex] > state.points[max.playerIndex] ? p : max
          , activePlayers[0]);
          setMatchWinner(maxP.playerName);
          state.gameState = "gameover";
          setGameState("gameover");
          sound.playStart();
        } else {
          startNewRound();
        }
      }
      if (type === "BACK") {
        sound.playBack();
        onExit("store");
      }
    } else if (state.gameState === "gameover") {
      if (type === "OK") {
        onExit("restart");
      }
      if (type === "BACK") {
        onExit("store");
      }
    }
  }, [lastInput, activePrompt]);

  const revealRound = () => {
    const state = stateRef.current;
    state.gameState = "revealed";
    setGameState("revealed");
    sound.playExplosion();

    const target = activePrompt.target;
    const newClues = {};
    let closestPlayer = null;
    let minDiff = Infinity;

    activePlayers.forEach(p => {
      const guess = state.playerGuesses[p.playerIndex];
      const diff = Math.abs(guess - target);

      if (guess > target) {
        newClues[p.playerIndex] = "TOO HIGH 📈";
      } else if (guess < target) {
        newClues[p.playerIndex] = "TOO LOW 📉";
      } else {
        newClues[p.playerIndex] = "EXACT! 🎯";
      }

      if (diff < minDiff) {
        minDiff = diff;
        closestPlayer = p;
      }
    });

    setClues(newClues);

    // Award Points
    const roundWinnersList = [];
    activePlayers.forEach(p => {
      const guess = state.playerGuesses[p.playerIndex];
      if (guess === target) {
        state.points[p.playerIndex] += 2; // Perfect guess gets 2 points
        roundWinnersList.push(`${p.playerName} (Perfect!)`);
      }
    });

    if (roundWinnersList.length === 0 && closestPlayer) {
      state.points[closestPlayer.playerIndex] += 1; // Closest gets 1 point
      roundWinnersList.push(closestPlayer.playerName);
    }

    setRoundWinner(roundWinnersList.join(", ") + " won the round!");
    setPoints({ ...state.points });
  };

  const startNewRound = () => {
    const state = stateRef.current;
    const nextIdx = (state.promptIndex + 1) % HOSTEL_PROMPTS.length;
    const nextPrompt = HOSTEL_PROMPTS[nextIdx];

    const initialGuesses = {};
    activePlayers.forEach(p => {
      initialGuesses[p.playerIndex] = Math.floor((nextPrompt.min + nextPrompt.max) / 2);
    });

    state.gameState = "guessing";
    state.promptIndex = nextIdx;
    state.playerGuesses = initialGuesses;
    state.lockedGuesses = {};

    setActivePrompt(nextPrompt);
    setPlayerGuesses(initialGuesses);
    setLockedGuesses({});
    setClues({});
    setRoundWinner("");
    setGameState("guessing");
    sound.playStart();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "800px" }}>
      {/* HUD Header */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "20px", alignItems: "center" }}>
        <h2 className="font-orbitron glow-text-pink" style={{ fontSize: "28px" }}>HOSTEL GUESS MASTER</h2>
        <div style={{ display: "flex", gap: "15px" }}>
          {activePlayers.map(p => (
            <div 
              key={p.playerIndex} 
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                padding: "8px 16px",
                borderRadius: "8px",
                borderLeft: `4px solid ${p.playerColor}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
            >
              <span style={{ fontSize: "11px", color: "#8b92b6", display: "flex", alignItems: "center", gap: "5px" }}>
                <span>{p.playerAvatar || "🎓"}</span>
                <span>{p.playerName}</span>
              </span>
              <span className="font-orbitron" style={{ fontSize: "16px", color: "#fff", fontWeight: "bold" }}>
                {points[p.playerIndex] || 0} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="glass-panel" style={{ width: "100%", padding: "40px", textAlign: "center", border: "2px solid rgba(255,0,127,0.15)", position: "relative" }}>
        
        {gameState === "guessing" && (
          <>
            <h3 className="font-orbitron glow-text-cyan" style={{ fontSize: "20px", marginBottom: "30px", minHeight: "60px" }}>
              {activePrompt.text}
            </h3>

            {/* Visual Sliders */}
            <div style={{ margin: "40px 0", position: "relative", padding: "20px 0" }}>
              {/* Range Track */}
              <div style={{ height: "10px", background: "rgba(255,255,255,0.1)", borderRadius: "5px", width: "100%", position: "relative" }}>
                {/* Labels */}
                <div style={{ position: "absolute", left: 0, top: "-25px", fontSize: "14px", color: "#8b92b6" }} className="font-orbitron">{activePrompt.min}</div>
                <div style={{ position: "absolute", right: 0, top: "-25px", fontSize: "14px", color: "#8b92b6" }} className="font-orbitron">{activePrompt.max}</div>

                {/* Player Sliders */}
                {activePlayers.map(p => {
                  const guess = playerGuesses[p.playerIndex] || activePrompt.min;
                  const percent = ((guess - activePrompt.min) / (activePrompt.max - activePrompt.min)) * 100;
                  const isLocked = lockedGuesses[p.playerIndex];

                  return (
                    <div 
                      key={p.playerIndex} 
                      style={{
                        position: "absolute",
                        left: `${percent}%`,
                        top: "-5px",
                        transform: "translateX(-50%)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        transition: "left 0.15s ease-out"
                      }}
                    >
                      {/* Floating Guess Tag */}
                      <div style={{
                        background: p.playerColor,
                        color: "#000",
                        fontWeight: "bold",
                        fontSize: "14px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        marginBottom: "10px",
                        boxShadow: `0 0 10px ${p.playerColor}`,
                        opacity: isLocked ? 0.6 : 1
                      }} className="font-orbitron">
                        {guess}
                      </div>
                      
                      {/* Thumb Indicator */}
                      <div style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        backgroundColor: "#fff",
                        border: `4px solid ${p.playerColor}`,
                        boxShadow: `0 0 12px ${p.playerColor}`,
                        transform: isLocked ? "scale(0.8)" : "scale(1.2)",
                        transition: "all 0.15s ease"
                      }} />
                      
                      {/* Name tag */}
                      <div style={{ fontSize: "11px", color: isLocked ? "#39ff14" : "#fff", marginTop: "5px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>{p.playerAvatar || "🎓"}</span>
                        <span>{p.playerName} {isLocked ? "✔" : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginTop: "80px", color: "#8b92b6" }} className="font-orbitron">
              <p>Controls: <span style={{ color: "#00f0ff" }}>LEFT/RIGHT</span> to adjust guess, <span style={{ color: "#39ff14" }}>A / OK</span> to Lock In!</p>
            </div>
          </>
        )}

        {gameState === "revealed" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 className="font-orbitron" style={{ color: "#8b92b6", fontSize: "16px", marginBottom: "10px" }}>THE TARGET WAS</h3>
            <h1 className="font-press-start glow-text-green" style={{ fontSize: "52px", marginBottom: "35px" }}>
              {activePrompt.target}
            </h1>

            {/* Results Grid */}
            <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
              {activePlayers.map(p => {
                const guess = playerGuesses[p.playerIndex];
                const clue = clues[p.playerIndex];
                const diff = Math.abs(guess - activePrompt.target);
                
                return (
                  <div 
                    key={p.playerIndex} 
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.03)",
                      padding: "15px 25px",
                      borderRadius: "10px",
                      border: `1px solid ${p.playerColor}33`,
                      borderLeft: `5px solid ${p.playerColor}`
                    }}
                  >
                    <span className="font-orbitron" style={{ fontSize: "18px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{p.playerAvatar || "🎓"}</span>
                      <span>{p.playerName}</span>
                    </span>
                    <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                      <span className="font-orbitron" style={{ color: "#8b92b6" }}>Guessed: <strong style={{ color: "#fff" }}>{guess}</strong> (Diff: {diff})</span>
                      <span className="font-orbitron" style={{
                        color: clue.includes("CORRECT") || clue.includes("EXACT") ? "#39ff14" : clue.includes("HIGH") ? "#ff0055" : "#00f0ff",
                        fontWeight: "bold"
                      }}>{clue}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: "rgba(57, 255, 20, 0.08)",
              border: "1px solid rgba(57, 255, 20, 0.3)",
              padding: "15px 30px",
              borderRadius: "8px",
              marginBottom: "30px"
            }}>
              <p className="font-orbitron" style={{ color: "#39ff14", fontSize: "16px", fontWeight: "bold" }}>{roundWinner}</p>
            </div>

            <p className="font-orbitron animate-pulse-slow" style={{ color: "#8b92b6" }}>
              Press <span style={{ color: "#39ff14", fontWeight: "bold" }}>A / OK</span> to Continue to Next Round
            </p>
          </div>
        )}

        {gameState === "gameover" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h1 className="font-press-start glow-text-pink" style={{ fontSize: "26px", marginBottom: "20px" }}>MATCH COMPLETE</h1>
            <h2 className="font-orbitron" style={{ fontSize: "24px", color: "#fff", marginBottom: "40px" }}>
              🏆 Guess Master Winner: <span className="glow-text-cyan" style={{ fontWeight: "bold" }}>{matchWinner}</span> 🏆
            </h2>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "rgba(255,255,255,0.05)",
              padding: "20px 40px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              alignItems: "center"
            }}>
              <p className="font-orbitron" style={{ color: "#8b92b6", fontSize: "14px" }}>
                Press <span style={{ color: "#39ff14", fontWeight: "bold" }}>A / OK</span> to Restart Match
              </p>
              <p className="font-orbitron" style={{ color: "#8b92b6", fontSize: "14px" }}>
                Press <span style={{ color: "#ff007f", fontWeight: "bold" }}>B / BACK</span> to Return to Game Store
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default GuessTheNumber;
