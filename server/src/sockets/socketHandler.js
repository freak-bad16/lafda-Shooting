/**
 * SOCKET HANDLER
 * Central registration point for all socket controllers.
 * Keeps server.js clean — just call registerAll(io) once.
 */

import roomController from "../controllers/roomController.js";
import inputController from "../controllers/inputController.js";

/**
 * Register all socket event controllers on a new connection.
 * @param {import("socket.io").Server} io
 */
const registerAll = (io) => {
  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Mount controllers
    roomController(socket, io);
    inputController(socket, io);
  });
};

export default { registerAll };
