/**
 * CONTROLLER: roomController
 * Handles socket events related to room lifecycle and player management.
 */

import {
  createNewRoom,
  findRoom,
  addPlayer,
  updatePlayerProfile,
  deleteRoom,
  findSocketRoom,
  removePlayer,
} from "../services/roomService.js";

/**
 * Register all room-related socket event handlers.
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
const roomController = (socket, io) => {

  // ── Console creates a room ──────────────────────────────────────────────────
  socket.on("create-room", () => {
    const { roomCode } = createNewRoom(socket.id);
    socket.join(roomCode);
    socket.emit("room-created", roomCode);
    console.log(`[Room] Created: ${roomCode}`);
  });

  // ── Player joins a room ─────────────────────────────────────────────────────
  socket.on("join-room", (payload) => {
    if (!payload) return;

    let rawCode, customName, customAvatar;

    if (typeof payload === "object") {
      rawCode = payload.roomCode;
      customName = payload.playerName;
      customAvatar = payload.playerAvatar;
    } else {
      rawCode = payload;
    }

    const found = findRoom(rawCode);
    if (!found) {
      socket.emit("join-error", "Room not found. Check the code on the screen!");
      return;
    }

    const { roomCode, room } = found;
    const result = addPlayer(room, socket.id, customName, customAvatar);

    if (result.error === "already_joined") {
      socket.emit("joined-room", { roomCode });
      return;
    }

    if (result.error) {
      socket.emit("join-error", result.error);
      return;
    }

    const { player } = result;
    socket.join(roomCode);

    socket.emit("joined-room", {
      roomCode,
      playerIndex: player.playerIndex,
      playerName: player.playerName,
      playerColor: player.playerColor,
    });

    io.to(roomCode).emit("player-list-update", room.players);
    socket.to(roomCode).emit("controller-connected");

    console.log(`[Room] ${player.playerName} joined ${roomCode}`);
  });

  // ── Player updates name / avatar in lobby ───────────────────────────────────
  socket.on("update-player-name", ({ roomCode, name, avatar }) => {
    if (!roomCode || !name) return;
    const found = findRoom(roomCode);
    if (!found) return;

    const updated = updatePlayerProfile(found.room, socket.id, name, avatar);
    if (updated) {
      io.to(found.roomCode).emit("player-list-update", found.room.players);
      console.log(`[Room] Profile updated in ${found.roomCode}: ${name}`);
    }
  });

  // ── Any player / console triggers arcade start ──────────────────────────────
  socket.on("start-arcade", (rawCode) => {
    if (!rawCode) return;
    const found = findRoom(rawCode);
    if (!found) return;
    console.log(`[Room] Arcade starting in ${found.roomCode}`);
    io.to(found.roomCode).emit("arcade-started");
  });

  // ── Disconnect — clean up room or player ────────────────────────────────────
  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    const search = findSocketRoom(socket.id);
    if (!search) return;

    const { roomCode, role, room, playerIndex } = search;

    if (role === "console") {
      io.to(roomCode).emit("room-destroyed");
      deleteRoom(roomCode);
      console.log(`[Room] Console left. Room destroyed: ${roomCode}`);
    } else {
      const { removedPlayer, updatedPlayers } = removePlayer(room, playerIndex);

      // Notify each remaining player of their new index/color
      updatedPlayers.forEach((p) => {
        io.to(p.socketId).emit("player-reassigned", {
          playerIndex: p.playerIndex,
          playerName: p.playerName,
          playerColor: p.playerColor,
        });
      });

      io.to(roomCode).emit("player-list-update", updatedPlayers);
      console.log(`[Room] ${removedPlayer.playerName} left ${roomCode}`);
    }
  });
};

export default roomController;
