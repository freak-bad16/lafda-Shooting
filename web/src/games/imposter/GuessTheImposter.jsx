import { useEffect, useRef, useState } from "react";
import socket from "../../socket/socket";
import sound from "../../services/sound";

const IMPOSTER_WORDS = [
  { category: "Indian Street Food", word: "Gol Gappa", fakeWord: "Chaat" },
  { category: "Hostel Essentials", word: "Electric Kettle", fakeWord: "Iron Box" },
  { category: "College Celebrities", word: "Dean", fakeWord: "HOD" },
  { category: "Bollywood Movies", word: "Sholay", fakeWord: "Dilwale" },
  { category: "Indian Festivals", word: "Diwali", fakeWord: "Holi" },
  { category: "Cricket Legends", word: "Virat Kohli", fakeWord: "MS Dhoni" }
];

function GuessTheImposter({ lastInput, players, roomCode, onExit }) {
  const [activeRound, setActiveRound] = useState(IMPOSTER_WORDS[0]);
  const [gameState, setGameState] = useState("distributing"); // 'distributing', 'describing', 'voting', 'tally', 'gameover'
  const [imposterIndex, setImposterIndex] = useState(-1);
  const [votes, setVotes] = useState({}); // voterIndex -> votedTargetIndex
  const [currentVoteSelector, setCurrentVoteSelector] = useState({}); // voterIndex -> targetIndex
  const [playerScores, setPlayerScores] = useState({});
  const [voteTally, setVoteTally] = useState({});
  const [roundResult, setRoundResult] = useState("");

  const activePlayers = players.length > 0 ? players : [
    { playerIndex: 0, playerName: "Player 1", playerColor: "#00f0ff" },
    { playerIndex: 1, playerName: "Player 2", playerColor: "#ff007f" },
  ];

  const stateRef = useRef({
    gameState: "distributing",
    votes: {},
    currentVoteSelector: {},
    imposterIndex: -1,
    roundIndex: 0,
    scores: {}
  });

  // Init Game
  useEffect(() => {
    const initialScores = {};
    activePlayers.forEach(p => {
      initialScores[p.playerIndex] = 0;
    });

    stateRef.current = {
      gameState: "distributing",
      votes: {},
      currentVoteSelector: {},
      imposterIndex: -1,
      roundIndex: 0,
      scores: initialScores
    };

    setPlayerScores(initialScores);
    startNewRound(0);
  }, [players]);

  // Handle Inputs
  useEffect(() => {
    if (!lastInput) return;
    const { playerIndex, type } = lastInput;
    const state = stateRef.current;

    if (state.gameState === "distributing") {
      if (type === "OK") {
        sound.playSelect();
        state.gameState = "describing";
        setGameState("describing");
        // Notify players that describing has started
        socket.emit("console-screen-change", {
          roomCode,
          screen: "imposter",
          data: { phase: "describing" }
        });
      }
      if (type === "BACK") {
        sound.playBack();
        onExit("store");
      }
    } else if (state.gameState === "describing") {
      if (type === "OK") {
        sound.playSelect();
        // Prepare voting selectors for each player
        const selectors = {};
        activePlayers.forEach(p => {
          // Initialize selector pointing to the next player (so you don't vote for yourself)
          const ownIndex = p.playerIndex;
          const otherPlayers = activePlayers.filter(o => o.playerIndex !== ownIndex);
          selectors[ownIndex] = otherPlayers[0]?.playerIndex ?? 0;
        });

        state.currentVoteSelector = selectors;
        state.votes = {};
        state.gameState = "voting";
        
        setCurrentVoteSelector(selectors);
        setVotes({});
        setGameState("voting");

        // Notify controllers to show the voting layout
        socket.emit("console-screen-change", {
          roomCode,
          screen: "imposter",
          data: { phase: "voting" }
        });
      }
      if (type === "BACK") {
        sound.playBack();
        onExit("store");
      }
    } else if (state.gameState === "voting") {
      // Locking checking
      if (state.votes[playerIndex] !== undefined) return;

      const currentTarget = state.currentVoteSelector[playerIndex] ?? 0;
      const otherPlayers = activePlayers.filter(o => o.playerIndex !== playerIndex);
      const currentIndexInOthers = otherPlayers.findIndex(o => o.playerIndex === currentTarget);
      
      let nextTarget = currentTarget;
      let moved = false;

      if (type === "UP") {
        const nextIdx = (currentIndexInOthers - 1 + otherPlayers.length) % otherPlayers.length;
        nextTarget = otherPlayers[nextIdx].playerIndex;
        moved = true;
      }
      if (type === "DOWN") {
        const nextIdx = (currentIndexInOthers + 1) % otherPlayers.length;
        nextTarget = otherPlayers[nextIdx].playerIndex;
        moved = true;
      }

      if (moved) {
        state.currentVoteSelector[playerIndex] = nextTarget;
        setCurrentVoteSelector({ ...state.currentVoteSelector });
        sound.playMove();
      }

      if (type === "OK") {
        state.votes[playerIndex] = currentTarget;
        setVotes({ ...state.votes });
        sound.playSelect();

        // Check if all players voted
        const allVoted = activePlayers.every(p => state.votes[p.playerIndex] !== undefined);
        if (allVoted) {
          revealVotes();
        }
      }
    } else if (state.gameState === "tally") {
      if (type === "OK") {
        sound.playSelect();
        const scoreLimit = activePlayers.some(p => state.scores[p.playerIndex] >= 4);
        if (scoreLimit) {
          const maxP = activePlayers.reduce((max, p) => 
            state.scores[p.playerIndex] > state.scores[max.playerIndex] ? p : max
          , activePlayers[0]);
          state.gameState = "gameover";
          setGameState("gameover");
          setRoundResult(`${maxP.playerName} wins the match!`);
        } else {
          startNewRound(state.roundIndex + 1);
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
  }, [lastInput, activeRound]);

  const startNewRound = (roundIdx) => {
    const state = stateRef.current;
    const wordItem = IMPOSTER_WORDS[roundIdx % IMPOSTER_WORDS.length];
    
    // Pick random imposter
    const impIndex = activePlayers[Math.floor(Math.random() * activePlayers.length)].playerIndex;
    
    state.gameState = "distributing";
    state.roundIndex = roundIdx;
    state.imposterIndex = impIndex;
    state.votes = {};
    state.currentVoteSelector = {};

    setImposterIndex(impIndex);
    setVotes({});
    setCurrentVoteSelector({});
    setActiveRound(wordItem);
    setGameState("distributing");

    // Push secret roles directly to individual player controller sockets!
    activePlayers.forEach(p => {
      const isImposter = p.playerIndex === impIndex;
      const payload = {
        category: wordItem.category,
        role: isImposter ? "imposter" : "crew",
        word: isImposter ? "YOU ARE THE IMPOSTER" : wordItem.word
      };

      // Notify the server to send this payload privately to this player's socket!
      socket.emit("send-private-payload", {
        roomCode,
        targetPlayerId: p.socketId,
        payload
      });
    });

    // Notify all controllers that we've switched screens
    socket.emit("console-screen-change", {
      roomCode,
      screen: "imposter",
      data: { phase: "distributing" }
    });

    sound.playStart();
  };

  const revealVotes = () => {
    const state = stateRef.current;
    state.gameState = "tally";
    setGameState("tally");
    sound.playExplosion();

    // Tally votes
    const tallies = {};
    activePlayers.forEach(p => {
      const vote = state.votes[p.playerIndex];
      tallies[vote] = (tallies[vote] || 0) + 1;
    });

    setVoteTally(tallies);

    // Find player with maximum votes
    let maxVotedIndex = -1;
    let maxVotes = -1;
    let tie = false;

    for (const playerIdxStr in tallies) {
      const playerIdx = parseInt(playerIdxStr);
      if (tallies[playerIdx] > maxVotes) {
        maxVotes = tallies[playerIdx];
        maxVotedIndex = playerIdx;
        tie = false;
      } else if (tallies[playerIdx] === maxVotes) {
        tie = true;
      }
    }

    const imposterPlayer = activePlayers.find(p => p.playerIndex === state.imposterIndex);

    if (!tie && maxVotedIndex === state.imposterIndex) {
      // Imposter caught!
      setRoundResult(`Imposter was CAUGHT! ${imposterPlayer.playerName} was indeed the Imposter! 🕵️‍♂️`);
      // Award 1 point to all Crew
      activePlayers.forEach(p => {
        if (p.playerIndex !== state.imposterIndex) {
          state.scores[p.playerIndex] += 1;
        }
      });
    } else {
      // Imposter escaped!
      setRoundResult(`Imposter ESCAPED! ${imposterPlayer.playerName} was the Imposter and successfully blended in! 😈`);
      // Award 2 points to Imposter
      state.scores[state.imposterIndex] += 2;
    }

    setPlayerScores({ ...state.scores });

    // Tell server to update controller screens to show round over
    socket.emit("console-screen-change", {
      roomCode,
      screen: "imposter",
      data: { phase: "tally" }
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "800px" }}>
      {/* HUD Header */}
      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", marginBottom: "20px", alignItems: "center" }}>
        <h2 className="font-orbitron glow-text-orange" style={{ fontSize: "28px" }}>GUESS THE IMPOSTER</h2>
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
              <span className="font-orbitron" style={{ fontSize: "15px", color: "#fff", fontWeight: "bold" }}>
                {playerScores[p.playerIndex] || 0} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Board */}
      <div className="glass-panel" style={{ width: "100%", padding: "40px", textAlign: "center", border: "2px solid rgba(255,174,0,0.2)", minHeight: "380px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        
        {gameState === "distributing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
            <h1 className="font-orbitron glow-text-orange" style={{ fontSize: "22px", marginBottom: "20px" }}>
              DISTRIBUTING ROLE CARDS...
            </h1>
            <p style={{ color: "#fff", fontSize: "16px", marginBottom: "30px", maxWidth: "550px" }}>
              Look at your phone screen! All players have received a secret word, except the Imposter who is completely in the dark!
            </p>
            <div style={{
              background: "rgba(255,174,0,0.06)",
              border: "1px dashed #ffae00",
              padding: "15px 30px",
              borderRadius: "8px",
              marginBottom: "35px"
            }}>
              <span className="font-orbitron" style={{ fontSize: "15px", color: "#8b92b6" }}>ROUND CATEGORY:</span>
              <h2 className="font-orbitron" style={{ color: "#fff", fontSize: "24px", marginTop: "5px" }}>{activePrompt.category}</h2>
            </div>
            
            <p className="font-orbitron animate-pulse-slow" style={{ color: "#39ff14" }}>
              Press <span style={{ color: "#fff" }}>A / OK</span> to Begin Describing Phase
            </p>
          </div>
        )}

        {gameState === "describing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
            <h1 className="font-press-start glow-text-cyan" style={{ fontSize: "18px", marginBottom: "25px" }}>DISCUSS & DESCRIBE</h1>
            <p style={{ color: "#fff", fontSize: "18px", lineHeight: "1.6", maxWidth: "600px", marginBottom: "30px" }}>
              Go around in a circle. Each player must state **ONE single word** to describe their secret word. 
              <br />
              <br />
              <strong style={{ color: "#ffae00" }}>Imposter:</strong> Try to listen to others and guess the word so you can blend in!
            </p>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", marginBottom: "40px" }}>
              {activePlayers.map(p => (
                <div key={p.playerIndex} style={{ padding: "8px 16px", borderRadius: "20px", background: "rgba(255,255,255,0.05)", border: `1px solid ${p.playerColor}`, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{p.playerAvatar || "🎓"}</span>
                  <span className="font-orbitron" style={{ color: p.playerColor, fontWeight: "bold" }}>{p.playerName}</span>
                </div>
              ))}
            </div>

            <p className="font-orbitron animate-pulse-slow" style={{ color: "#39ff14" }}>
              Ready to vote? Press <span style={{ color: "#fff" }}>A / OK</span> to open Voting Panel
            </p>
          </div>
        )}

        {gameState === "voting" && (
          <div>
            <h1 className="font-press-start glow-text-pink" style={{ fontSize: "18px", marginBottom: "20px" }}>VOTE THE IMPOSTER</h1>
            <p style={{ color: "#8b92b6", fontSize: "14px", marginBottom: "30px" }}>
              Use your gamepad <span style={{ color: "#00f0ff" }}>UP / DOWN</span> keys to target someone and press <span style={{ color: "#39ff14" }}>A / OK</span> to lock in your vote!
            </p>

            {/* Voting Grid */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "20px", marginBottom: "20px" }}>
              {activePlayers.map(voter => {
                const hasVoted = votes[voter.playerIndex] !== undefined;
                const activeTargetIdx = currentVoteSelector[voter.playerIndex];
                const targetPlayer = activePlayers.find(o => o.playerIndex === activeTargetIdx);

                return (
                  <div 
                    key={voter.playerIndex}
                    style={{
                      width: "180px",
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${voter.playerColor}33`,
                      borderRadius: "12px",
                      padding: "15px",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between"
                    }}
                  >
                    <span className="font-orbitron" style={{ color: voter.playerColor, fontWeight: "bold", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{voter.playerAvatar || "🎓"}</span>
                      <span>{voter.playerName}</span>
                    </span>
                    
                    <div style={{ margin: "15px 0" }}>
                      {hasVoted ? (
                        <div style={{ color: "#39ff14" }}>
                          <span style={{ fontSize: "12px", color: "#8b92b6" }}>Voted For:</span>
                          <p style={{ fontWeight: "bold" }} className="font-orbitron">
                            {activePlayers.find(p => p.playerIndex === votes[voter.playerIndex])?.playerName}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontSize: "12px", color: "#8b92b6" }}>Targeting:</span>
                          <p style={{ color: "#ffae00", fontWeight: "bold" }} className="font-orbitron">
                            {targetPlayer ? targetPlayer.playerName : "None"}
                          </p>
                        </div>
                      )}
                    </div>

                    <span style={{ fontSize: "11px", color: hasVoted ? "#39ff14" : "#8b92b6" }}>
                      {hasVoted ? "✔ Voted" : "⚡ Selecting..."}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {gameState === "tally" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h1 className="font-orbitron glow-text-orange" style={{ fontSize: "20px", marginBottom: "25px" }}>VOTE REVEAL</h1>

            {/* Results Grid */}
            <div style={{ width: "100%", maxWidth: "500px", background: "rgba(255,255,255,0.02)", padding: "20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "30px" }}>
              {activePlayers.map(p => {
                const count = voteTally[p.playerIndex] || 0;
                const isImposter = p.playerIndex === imposterIndex;

                return (
                  <div key={p.playerIndex} style={{ display: "flex", justifyBetween: "space-between", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className="font-orbitron" style={{ color: p.playerColor, fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{p.playerAvatar || "🎓"}</span>
                        <span>{p.playerName}</span>
                      </span>
                      {isImposter && (
                        <span style={{ background: "rgba(255,174,0,0.15)", border: "1px solid #ffae00", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", color: "#ffae00" }} className="font-orbitron">IMPOSTER</span>
                      )}
                    </div>
                    <span className="font-orbitron" style={{ color: "#fff", fontWeight: "bold" }}>
                      {count} Votes {count > 0 ? "🔥" : ""}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{
              background: "rgba(255,174,0,0.08)",
              border: "1px solid rgba(255,174,0,0.3)",
              padding: "15px 30px",
              borderRadius: "8px",
              marginBottom: "30px",
              maxWidth: "600px"
            }}>
              <p className="font-orbitron" style={{ color: "#ffae00", fontSize: "16px", fontWeight: "bold" }}>{roundResult}</p>
            </div>

            <p className="font-orbitron animate-pulse-slow" style={{ color: "#39ff14" }}>
              Press <span style={{ color: "#fff" }}>A / OK</span> to Continue
            </p>
          </div>
        )}

        {gameState === "gameover" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h1 className="font-press-start glow-text-orange" style={{ fontSize: "24px", marginBottom: "20px" }}>MATCH ENDED</h1>
            <h2 className="font-orbitron" style={{ color: "#fff", fontSize: "20px", marginBottom: "40px" }}>{roundResult}</h2>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "rgba(255, 255, 255, 0.05)",
              padding: "20px 40px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              alignItems: "center"
            }}>
              <p className="font-orbitron" style={{ color: "#8b92b6", fontSize: "14px" }}>
                Press <span style={{ color: "#39ff14", fontWeight: "bold" }}>A / OK</span> to Play Again
              </p>
              <p className="font-orbitron" style={{ color: "#8b92b6", fontSize: "14px" }}>
                Press <span style={{ color: "#ff007f", fontWeight: "bold" }}>B / BACK</span> to Exit to Store
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default GuessTheImposter;
