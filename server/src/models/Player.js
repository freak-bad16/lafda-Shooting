/**
 * MODEL: Player
 * Represents a connected player inside a Lafda Shooting room.
 */

export const PLAYER_COLORS = [
  "#00f0ff", // Neon Cyan   — P1
  "#ff007f", // Neon Magenta — P2
  "#39ff14", // Neon Lime   — P3
  "#ffae00", // Neon Orange — P4
];

export const DEFAULT_NICKNAMES = [
  "Chai Addict",
  "Proxy King",
  "Backbencher",
  "Maggi Lover",
  "All Nighter",
  "Lab Escapee",
];

const createPlayer = ({ socketId, playerIndex, playerName, playerAvatar = "🎓" }) => ({
  socketId,
  playerIndex,
  playerName,
  playerAvatar,
  playerColor: PLAYER_COLORS[playerIndex] ?? "#ffffff",
});

export default createPlayer;
