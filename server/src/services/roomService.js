/**
 * SERVICE: roomService
 * Pure business logic for room and player management.
 * No socket.io dependencies — just operates on the in-memory rooms map.
 */

import createRoom from "../models/Room.js";
import createPlayer, { PLAYER_COLORS, DEFAULT_NICKNAMES } from "../models/Player.js";
import generateRoomCode from "../utils/generateRoomCode.js";

// In-memory store: roomCode → Room
const rooms = {};

/**
 * Create a new room for a console socket.
 * @param {string} consoleId - The socket ID of the console.
 * @returns {{ roomCode: string, room: Room }}
 */
export const createNewRoom = (consoleId) => {
  const roomCode = generateRoomCode();
  rooms[roomCode] = createRoom(consoleId);
  return { roomCode, room: rooms[roomCode] };
};

/**
 * Find a room by a raw code input (strips whitespace, case-insensitive).
 * @param {string} rawCode
 * @returns {{ roomCode: string, room: Room } | null}
 */
export const findRoom = (rawCode) => {
  const normalised = rawCode.toString().replace(/\s+/g, "").toUpperCase();
  const roomCode = Object.keys(rooms).find(
    (key) => key.replace(/\s+/g, "").toUpperCase() === normalised
  );
  return roomCode ? { roomCode, room: rooms[roomCode] } : null;
};

/**
 * Find which room a socket belongs to (as console or player).
 * @param {string} socketId
 * @returns {{ roomCode, role, room, player?, playerIndex? } | null}
 */
export const findSocketRoom = (socketId) => {
  for (const roomCode in rooms) {
    const room = rooms[roomCode];
    if (room.consoleId === socketId) {
      return { roomCode, role: "console", room };
    }
    const playerIndex = room.players.findIndex((p) => p.socketId === socketId);
    if (playerIndex !== -1) {
      return { roomCode, role: "player", room, player: room.players[playerIndex], playerIndex };
    }
  }
  return null;
};

/**
 * Add a player to a room.
 * @returns {{ player: Player } | { error: string }}
 */
export const addPlayer = (room, socketId, customName, customAvatar) => {
  if (room.players.length >= 4) {
    return { error: "Room is full! Maximum 4 players allowed." };
  }
  if (room.players.some((p) => p.socketId === socketId)) {
    return { error: "already_joined" };
  }

  const playerIndex = room.players.length;
  const playerName = customName?.trim() ||
    `${DEFAULT_NICKNAMES[Math.floor(Math.random() * DEFAULT_NICKNAMES.length)]} (P${playerIndex + 1})`;

  const player = createPlayer({
    socketId,
    playerIndex,
    playerName,
    playerAvatar: customAvatar || "🎓",
  });

  room.players.push(player);
  return { player };
};

/**
 * Update a player's name and avatar inside a room.
 */
export const updatePlayerProfile = (room, socketId, name, avatar) => {
  const player = room.players.find((p) => p.socketId === socketId);
  if (!player) return false;
  player.playerName = name.trim();
  if (avatar) player.playerAvatar = avatar;
  return true;
};

/**
 * Remove a player and reassign indexes/colors continuously.
 * @returns {{ removedPlayer, updatedPlayers }}
 */
export const removePlayer = (room, playerIndex) => {
  const [removedPlayer] = room.players.splice(playerIndex, 1);
  room.players.forEach((p, idx) => {
    p.playerIndex = idx;
    p.playerColor = PLAYER_COLORS[idx] ?? "#ffffff";
  });
  return { removedPlayer, updatedPlayers: room.players };
};

/**
 * Delete a room entirely.
 */
export const deleteRoom = (roomCode) => {
  delete rooms[roomCode];
};

export default rooms;
