/**
 * CONTROLLER: inputController
 * Handles socket events related to game input, screen changes, and private payloads.
 */

import { findRoom } from "../services/roomService.js";

/**
 * Register all input-related socket event handlers.
 * @param {import("socket.io").Socket} socket
 * @param {import("socket.io").Server} io
 */
const inputController = (socket, io) => {

  // ── Controller button press forwarded to the whole room ─────────────────────
  socket.on("controller-input", ({ roomCode, type }) => {
    if (!roomCode) return;
    const found = findRoom(roomCode);
    if (!found) return;

    const { room } = found;
    const player = room.players.find((p) => p.socketId === socket.id);

    if (player) {
      console.log(`[Input] ${player.playerName} → ${type} in ${found.roomCode}`);
      io.to(found.roomCode).emit("controller-input", {
        playerId: socket.id,
        playerIndex: player.playerIndex,
        playerName: player.playerName,
        playerColor: player.playerColor,
        type,
      });
    } else {
      // Fallback for legacy / solo controller
      socket.to(found.roomCode).emit("controller-input", {
        playerId: socket.id,
        playerIndex: 0,
        playerName: "Player 1",
        playerColor: "#00f0ff",
        type,
      });
    }
  });

  // ── Console broadcasts its current screen to all mobile controllers ─────────
  socket.on("console-screen-change", ({ roomCode, screen, data }) => {
    if (!roomCode) return;
    const code = roomCode.trim().toUpperCase();
    io.to(code).emit("console-screen-change", { screen, data });
    console.log(`[Screen] Room ${code} → ${screen}`);
  });

  // ── Console sends private role/word payload to a specific player ────────────
  socket.on("send-private-payload", ({ roomCode, targetPlayerId, payload }) => {
    io.to(targetPlayerId).emit("private-payload", payload);
    console.log(`[Payload] Private payload sent to ${targetPlayerId}`);
  });
};

export default inputController;
