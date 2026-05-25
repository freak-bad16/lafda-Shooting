import { useEffect, useRef, useState } from "react";
import sound from "../../services/sound";

const COLLEGE_CARDS = [
  { text: "Never have I ever sneaked out of the hostel past curfew night gate." },
  { text: "Never have I ever used a roommate's deodorant, towel, or socks without asking." },
  { text: "Never have I ever pulled an all-nighter gaming or chatting, and completely slept through the mid-sem exam." },
  { text: "Never have I ever called a friend's proxy attendance in a massive lecture hall while they were asleep in hostel." },
  { text: "Never have I ever cooked Maggi inside a hostel room using an illegal electric kettle." },
  { text: "Never have I ever eaten another hostel mate's home-made sweets (dabba) while they were in class." },
  { text: "Never have I ever studied for an entire semester syllabus in just the 3 hours before the exam." },
  { text: "Never have I ever lied to my parents about a back-log paper or an attendance short-list." },
  { text: "Never have I ever copy-pasted a college coding assignment or lab report and forgot to change the name header." },
  { text: "Never have I ever fallen asleep during a serious laboratory session or seminar class." }
];

function NeverEver({ lastInput, players, onExit }) {
  const [cardIndex, setCardIndex] = useState(0);
  const [gameState, setGameState] = useState("voting"); // 'voting', 'revealed'
  const [votes, setVotes] = useState({}); // playerIndex -> 'have' or 'never'
  const [confessions, setConfessions] = useState({}); // playerIndex -> count of 'have'

  const activePlayers = players.length > 0 ? players : [
    { playerIndex: 0, playerName: "Player 1", playerColor: "#00f0ff" }
  ];

  const stateRef = useRef({
    gameState: "voting",
    votes: {},
    confessions: {},
    cardIndex: 0
  });

  useEffect(() => {
    const initialConfessions = {};
    activePlayers.forEach(p => {
      initialConfessions[p.playerIndex] = 0;
    });

    stateRef.current = {
      gameState: "voting",
      votes: {},
      confessions: initialConfessions,
      cardIndex: 0
    };

    setCardIndex(0);
    setVotes({});
    setConfessions(initialConfessions);
    setGameState("voting");
    sound.playStart();
  }, [players]);

  // Handle inputs
  useEffect(() => {
    if (!lastInput) return;
    const { playerIndex, type } = lastInput;
    const state = stateRef.current;

    if (state.gameState === "voting") {
      let voted = false;

      // UP / OK = HAVE
      if (type === "UP" || type === "OK") {
        state.votes[playerIndex] = "have";
        voted = true;
      }
      // DOWN / BACK = NEVER
      if (type === "DOWN" || type === "BACK") {
        state.votes[playerIndex] = "never";
        voted = true;
      }

      if (voted) {
        setVotes({ ...state.votes });
        sound.playMove();

        // Check if everyone voted
        const allVoted = activePlayers.every(p => state.votes[p.playerIndex] !== undefined);
        if (allVoted) {
          revealVotes();
        }
      }
    } else if (state.gameState === "revealed") {
      if (type === "OK") {
        sound.playSelect();
        nextCard();
      }
      if (type === "BACK") {
        sound.playBack();
        onExit("store");
      }
    }
  }, [lastInput, cardIndex]);

  const revealVotes = () => {
    const state = stateRef.current;
    state.gameState = "revealed";
    setGameState("revealed");
    sound.playExplosion();

    // Increment confession count for players who voted 'have'
    activePlayers.forEach(p => {
      if (state.votes[p.playerIndex] === "have") {
        state.confessions[p.playerIndex] += 1;
      }
    });

    setConfessions({ ...state.confessions });
  };

  const nextCard = () => {
    const state = stateRef.current;
    const nextIdx = (state.cardIndex + 1) % COLLEGE_CARDS.length;

    state.gameState = "voting";
    state.cardIndex = nextIdx;
    state.votes = {};

    setCardIndex(nextIdx);
    setVotes({});
    setGameState("voting");
    sound.playStart();
  };

  const activeCard = COLLEGE_CARDS[cardIndex];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "800px" }}>
      {/* HUD Header */}
      <div style={{ display: "flex", justifyBetween: "space-between", width: "100%", marginBottom: "20px", alignItems: "center", justifyContent: "space-between" }}>
        <h2 className="font-orbitron glow-text-pink" style={{ fontSize: "28px" }}>NEVER HAVE I EVER</h2>
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
                {confessions[p.playerIndex] || 0} Confessions 😈
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Arena */}
      <div className="glass-panel glass-panel-pink" style={{ width: "100%", padding: "40px", textAlign: "center", position: "relative", minHeight: "350px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        
        {/* Neon Question Card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255,0,127,0.1), rgba(0,240,255,0.05))",
          border: "2px dashed rgba(255, 255, 255, 0.15)",
          padding: "30px",
          borderRadius: "16px",
          marginBottom: "40px",
          boxShadow: "inset 0 0 20px rgba(255,0,127,0.05)"
        }}>
          <h1 className="font-orbitron glow-text-cyan" style={{ fontSize: "24px", marginBottom: "15px", fontWeight: "bold" }}>CAMPUS STATEMENT:</h1>
          <p style={{ fontSize: "22px", color: "#fff", lineHeight: "1.6", fontWeight: "bold" }}>
            "{activeCard.text}"
          </p>
        </div>

        {/* Players voting cards */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap", marginBottom: "20px" }}>
          {activePlayers.map(p => {
            const hasVoted = votes[p.playerIndex] !== undefined;
            const voteVal = votes[p.playerIndex];
            const isRevealed = gameState === "revealed";

            return (
              <div 
                key={p.playerIndex}
                style={{
                  width: "150px",
                  height: "170px",
                  borderRadius: "12px",
                  background: isRevealed 
                    ? (voteVal === "have" ? "rgba(255,0,127,0.15)" : "rgba(0,240,255,0.15)")
                    : "rgba(255,255,255,0.03)",
                  border: `2px solid ${isRevealed 
                    ? (voteVal === "have" ? "#ff007f" : "#00f0ff") 
                    : (hasVoted ? "#39ff14" : "rgba(255,255,255,0.1)")}`,
                  boxShadow: isRevealed 
                    ? (voteVal === "have" ? "0 0 15px rgba(255,0,127,0.2)" : "0 0 15px rgba(0,240,255,0.2)")
                    : (hasVoted ? "0 0 10px rgba(57,255,20,0.1)" : "none"),
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "15px",
                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  transform: hasVoted ? "translateY(-5px)" : "translateY(0)"
                }}
              >
                <span className="font-orbitron" style={{ fontSize: "13px", color: p.playerColor, fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span>{p.playerAvatar || "🎓"}</span>
                  <span>{p.playerName}</span>
                </span>
                
                {/* Visual Status */}
                <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
                  {!hasVoted && (
                    <span className="font-press-start animate-pulse-slow" style={{ color: "#8b92b6", fontSize: "16px" }}>?</span>
                  )}
                  {hasVoted && !isRevealed && (
                    <span className="font-press-start" style={{ color: "#39ff14", fontSize: "14px" }}>READY</span>
                  )}
                  {isRevealed && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px" }}>
                      <span className="font-press-start" style={{ 
                        color: voteVal === "have" ? "#ff007f" : "#00f0ff",
                        fontSize: "12px",
                        textAlign: "center"
                      }}>
                        {voteVal === "have" ? "GUILTY 😈" : "INNOCENT 😇"}
                      </span>
                    </div>
                  )}
                </div>

                <span style={{ fontSize: "11px", color: "#8b92b6" }}>
                  {hasVoted ? "Locked In" : "Deciding..."}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action instruction */}
        <div style={{ marginTop: "20px" }} className="font-orbitron">
          {gameState === "voting" ? (
            <p style={{ color: "#8b92b6" }}>
              Controls on Mobile: Press <span style={{ color: "#ff007f" }}>UP / A (HAVE)</span> or <span style={{ color: "#00f0ff" }}>DOWN / B (NEVER)</span>
            </p>
          ) : (
            <p className="animate-pulse-slow" style={{ color: "#39ff14", fontWeight: "bold" }}>
              Press <span style={{ color: "#fff" }}>A / OK</span> on Gamepad for Next Statement
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

export default NeverEver;
