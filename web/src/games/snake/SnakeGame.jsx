import { useEffect, useRef, useState } from "react";
import sound from "../../services/sound";

function SnakeGame({ lastInput, players, onExit }) {
  const canvasRef = useRef(null);
  
  // Game states: 'waiting', 'playing', 'gameover'
  const [gameState, setGameState] = useState("playing");
  const [scores, setScores] = useState({});
  const [winner, setWinner] = useState(null);

  const GRID_SIZE = 20;
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 450;
  const COLS = CANVAS_WIDTH / GRID_SIZE;
  const ROWS = CANVAS_HEIGHT / GRID_SIZE;

  // Keep references to active state for the loop to avoid stale values
  const stateRef = useRef({
    gameState: "playing",
    players: [],
    snakes: {},
    directions: {},
    food: [],
    particles: [],
    scores: {}
  });

  // Initialize game
  useEffect(() => {
    // Determine playing players
    const activePlayers = players.length > 0 ? players : [
      { playerIndex: 0, playerName: "Player 1", playerColor: "#00f0ff" }
    ];

    const initialSnakes = {};
    const initialDirections = {};
    const initialScores = {};

    // Spawn players in different corners/sides
    const spawnPoints = [
      { x: 5, y: 5, dir: "RIGHT" },
      { x: COLS - 6, y: ROWS - 6, dir: "LEFT" },
      { x: COLS - 6, y: 5, dir: "DOWN" },
      { x: 5, y: ROWS - 6, dir: "UP" }
    ];

    activePlayers.forEach((p, idx) => {
      const spawn = spawnPoints[idx] || spawnPoints[0];
      initialSnakes[p.playerIndex] = [
        { x: spawn.x, y: spawn.y },
        { x: spawn.x - (spawn.dir === "RIGHT" ? 1 : spawn.dir === "LEFT" ? -1 : 0), y: spawn.y - (spawn.dir === "DOWN" ? 1 : spawn.dir === "UP" ? -1 : 0) }
      ];
      initialDirections[p.playerIndex] = spawn.dir;
      initialScores[p.playerIndex] = 0;
    });

    // Spawn initial food (3 items)
    const initialFood = [];
    for (let i = 0; i < Math.max(activePlayers.length, 2); i++) {
      initialFood.push(getRandomFoodPosition(initialSnakes));
    }

    stateRef.current = {
      gameState: "playing",
      players: activePlayers,
      snakes: initialSnakes,
      directions: initialDirections,
      food: initialFood,
      particles: [],
      scores: initialScores
    };

    setScores(initialScores);
    setGameState("playing");
    setWinner(null);
    sound.playStart();
  }, [players]);

  // Handle inputs
  useEffect(() => {
    if (!lastInput) return;
    const { playerIndex, type } = lastInput;
    const currentDirections = stateRef.current.directions;
    const currentDir = currentDirections[playerIndex];

    if (stateRef.current.gameState === "playing") {
      if (type === "UP" && currentDir !== "DOWN") currentDirections[playerIndex] = "UP";
      if (type === "DOWN" && currentDir !== "UP") currentDirections[playerIndex] = "DOWN";
      if (type === "LEFT" && currentDir !== "RIGHT") currentDirections[playerIndex] = "LEFT";
      if (type === "RIGHT" && currentDir !== "LEFT") currentDirections[playerIndex] = "RIGHT";
    } else if (stateRef.current.gameState === "gameover") {
      if (type === "OK") {
        // Restart game
        sound.playSelect();
        onExit("restart");
      }
      if (type === "BACK") {
        sound.playBack();
        onExit("store");
      }
    }
  }, [lastInput]);

  function getRandomFoodPosition(snakes) {
    let position;
    let collision = true;
    while (collision) {
      position = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
        color: ["#ff00ff", "#00ffff", "#ffff00", "#ff007f", "#39ff14"][Math.floor(Math.random() * 5)]
      };
      
      collision = false;
      // Check collision with all snakes
      for (const pId in snakes) {
        if (snakes[pId].some(part => part.x === position.x && part.y === position.y)) {
          collision = true;
          break;
        }
      }
    }
    return position;
  }

  // Physics and Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animationFrameId;

    const updatePhysics = () => {
      const state = stateRef.current;
      if (state.gameState !== "playing") return;

      const snakes = state.snakes;
      const directions = state.directions;
      const food = state.food;
      const alivePlayers = state.players.filter(p => snakes[p.playerIndex] !== null);

      if (alivePlayers.length === 0) {
        // All players eliminated
        state.gameState = "gameover";
        setGameState("gameover");
        setWinner("No one! It's a draw.");
        sound.playExplosion();
        return;
      }

      // If multiplayer, check if only one survivor remains
      if (state.players.length > 1 && alivePlayers.length === 1) {
        state.gameState = "gameover";
        setGameState("gameover");
        setWinner(alivePlayers[0].playerName);
        sound.playStart();
        return;
      }

      const nextSnakes = { ...snakes };

      // 1. Move active snakes
      state.players.forEach(p => {
        const pId = p.playerIndex;
        const snake = snakes[pId];
        if (!snake) return;

        const dir = directions[pId];
        const head = { ...snake[0] };

        if (dir === "UP") head.y -= 1;
        if (dir === "DOWN") head.y += 1;
        if (dir === "LEFT") head.x -= 1;
        if (dir === "RIGHT") head.x += 1;

        // Check food collision
        let ateFood = -1;
        for (let i = 0; i < food.length; i++) {
          if (food[i].x === head.x && food[i].y === head.y) {
            ateFood = i;
            break;
          }
        }

        const newSnake = [head, ...snake];
        if (ateFood !== -1) {
          // Increase score
          state.scores[pId] += 10;
          sound.playScore();
          
          // Spawn particle sparks
          for (let pIdx = 0; pIdx < 8; pIdx++) {
            state.particles.push({
              x: head.x * GRID_SIZE + GRID_SIZE/2,
              y: head.y * GRID_SIZE + GRID_SIZE/2,
              vx: (Math.random() - 0.5) * 5,
              vy: (Math.random() - 0.5) * 5,
              color: food[ateFood].color,
              life: 1.0
            });
          }

          // Replace food
          food[ateFood] = getRandomFoodPosition(snakes);
        } else {
          newSnake.pop();
        }

        nextSnakes[pId] = newSnake;
      });

      // Update score state
      setScores({ ...state.scores });

      // 2. Collision checking
      const toEliminate = new Set();

      state.players.forEach(p => {
        const pId = p.playerIndex;
        const snake = nextSnakes[pId];
        if (!snake) return;

        const head = snake[0];

        // Wall collision
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
          toEliminate.add(pId);
          return;
        }

        // Self-collision
        for (let i = 1; i < snake.length; i++) {
          if (snake[i].x === head.x && snake[i].y === head.y) {
            toEliminate.add(pId);
            return;
          }
        }

        // Collision with other snakes
        state.players.forEach(otherP => {
          const otherPId = otherP.playerIndex;
          if (otherPId === pId) return;

          const otherSnake = nextSnakes[otherPId];
          if (!otherSnake) return;

          if (otherSnake.some(part => part.x === head.x && part.y === head.y)) {
            toEliminate.add(pId);
          }
        });
      });

      // 3. Eliminate crashed snakes and spawn particles
      toEliminate.forEach(pId => {
        const snake = snakes[pId];
        if (snake) {
          sound.playExplosion();
          // Create particle explosion
          snake.forEach(part => {
            for (let i = 0; i < 3; i++) {
              state.particles.push({
                x: part.x * GRID_SIZE + GRID_SIZE/2,
                y: part.y * GRID_SIZE + GRID_SIZE/2,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: state.players.find(p => p.playerIndex === pId)?.playerColor || "#ff0000",
                life: 1.0
              });
            }
          });
        }
        nextSnakes[pId] = null;
      });

      state.snakes = nextSnakes;
    };

    // Physics ticker (independent of draw rate to keep game slow/controllable)
    let lastPhysicsTime = 0;
    const physicsInterval = 140; // 140ms step rate (smooth but controllable)

    // Render loop
    const render = (time) => {
      if (!lastPhysicsTime) lastPhysicsTime = time;
      const elapsed = time - lastPhysicsTime;

      if (elapsed > physicsInterval) {
        updatePhysics();
        lastPhysicsTime = time;
      }

      // Draw everything
      ctx.fillStyle = "#0c0d14";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Grid mesh (subtle)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let c = 0; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * GRID_SIZE, 0);
        ctx.lineTo(c * GRID_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let r = 0; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * GRID_SIZE);
        ctx.lineTo(CANVAS_WIDTH, r * GRID_SIZE);
        ctx.stroke();
      }

      const state = stateRef.current;

      // Draw Food (glowing dots)
      state.food.forEach(f => {
        ctx.shadowColor = f.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x * GRID_SIZE + GRID_SIZE/2, f.y * GRID_SIZE + GRID_SIZE/2, GRID_SIZE/3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset glow
      });

      // Draw Snakes
      state.players.forEach(p => {
        const snake = state.snakes[p.playerIndex];
        if (!snake) return;

        ctx.shadowColor = p.playerColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = p.playerColor;

        snake.forEach((part, partIdx) => {
          const isHead = partIdx === 0;
          ctx.beginPath();
          if (isHead) {
            ctx.roundRect(
              part.x * GRID_SIZE + 1,
              part.y * GRID_SIZE + 1,
              GRID_SIZE - 2,
              GRID_SIZE - 2,
              6
            );
          } else {
            ctx.roundRect(
              part.x * GRID_SIZE + 2,
              part.y * GRID_SIZE + 2,
              GRID_SIZE - 4,
              GRID_SIZE - 4,
              4
            );
          }
          ctx.fill();
        });
        ctx.shadowBlur = 0; // reset
      });

      // Draw and Update Particles
      state.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
      });
      ctx.globalAlpha = 1.0;
      state.particles = state.particles.filter(p => p.life > 0);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Title & Live Scores */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        width: "800px", 
        marginBottom: "15px",
        alignItems: "center"
      }}>
        <h2 className="font-orbitron glow-text-cyan" style={{ fontSize: "28px" }}>NEON SNAKE DUEL</h2>
        
        <div style={{ display: "flex", gap: "20px" }}>
          {stateRef.current.players.map(p => (
            <div 
              key={p.playerIndex} 
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                padding: "8px 16px",
                borderRadius: "8px",
                borderLeft: `4px solid ${p.playerColor}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                opacity: stateRef.current.snakes[p.playerIndex] ? 1 : 0.4
              }}
            >
              <span style={{ fontSize: "12px", color: "#8b92b6", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{p.playerAvatar || "🎓"}</span>
                <span>{p.playerName}</span>
              </span>
              <span className="font-orbitron" style={{ fontSize: "18px", color: "#fff", fontWeight: "bold" }}>
                {scores[p.playerIndex] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "3px solid #1a1e36", boxShadow: "0 0 25px rgba(0,240,255,0.15)" }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />

        {/* Game Over Screen Overlay */}
        {gameState === "gameover" && (
          <div className="flex-center" style={{
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(10, 11, 16, 0.9)",
            flexDirection: "column",
            zIndex: 100
          }}>
            <h1 className="font-press-start glow-text-pink" style={{ fontSize: "24px", marginBottom: "20px" }}>GAME OVER</h1>
            
            <h2 className="font-orbitron" style={{ color: "#fff", marginBottom: "30px", fontSize: "22px" }}>
              Winner: <span style={{ color: "#00f0ff", fontWeight: "bold", textShadow: "0 0 10px rgba(0, 240, 255, 0.5)" }}>{winner}</span>
            </h2>

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

export default SnakeGame;