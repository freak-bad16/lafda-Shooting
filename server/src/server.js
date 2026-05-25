import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import generateRoomCode from "./utils/generateRoomCode.js";

const PORT = 5000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

// Track rooms in-memory: roomCode -> { consoleId, players: [{ socketId, playerIndex, playerName, playerColor }] }
const rooms = {};

// Helper to find a room and player by socket ID
const findSocketRoomAndPlayer = (socketId) => {
    for (const roomCode in rooms) {
        const room = rooms[roomCode];
        if (room.consoleId === socketId) {
            return { roomCode, role: "console", room };
        }
        const playerIndex = room.players.findIndex(p => p.socketId === socketId);
        if (playerIndex !== -1) {
            return { roomCode, role: "player", player: room.players[playerIndex], playerIndex, room };
        }
    }
    return null;
};

io.on("connection", (socket) => {

    console.log("User Connected:", socket.id);

    // Console creates a room
    socket.on("create-room", () => {
        const roomCode = generateRoomCode();
        
        rooms[roomCode] = {
            consoleId: socket.id,
            players: []
        };

        socket.join(roomCode);
        socket.emit("room-created", roomCode);
        console.log("Room Created:", roomCode);
    });

    // Mobile app joins a room
    socket.on("join-room", (payload) => {
        if (!payload) return;

        let roomCode = "";
        let customName = "";
        let customAvatar = "🎓";

        if (payload && typeof payload === "object") {
            roomCode = payload.roomCode;
            customName = payload.playerName;
            customAvatar = payload.playerAvatar || "🎓";
        } else {
            roomCode = payload;
        }

        const formattedInput = roomCode.toString().replace(/\s+/g, "").toUpperCase();
        const actualRoomCode = Object.keys(rooms).find(key => key.replace(/\s+/g, "") === formattedInput);
        const room = rooms[actualRoomCode];

        if (!room) {
            socket.emit("join-error", "Room not found. Check the code on the screen!");
            return;
        }

        // Limit to e.g. 4 players for hosteling games
        if (room.players.length >= 4) {
            socket.emit("join-error", "Room is full! Maximum 4 players allowed.");
            return;
        }

        // Avoid duplicate socket joins
        if (room.players.some(p => p.socketId === socket.id)) {
            socket.emit("joined-room", { roomCode: actualRoomCode });
            return;
        }

        const colors = [
            "#00f0ff", // Neon Cyan
            "#ff007f", // Neon Magenta
            "#39ff14", // Neon Lime Green
            "#ffae00"  // Neon Orange
        ];

        const playerIndex = room.players.length;
        const playerColor = colors[playerIndex] || "#ffffff";
        
        // Random college nickname default
        const nicknames = ["Chai Addict", "Proxy King", "Backbencher", "Maggi Lover", "All Nighter", "Lab Escapee"];
        const playerName = customName ? customName.trim() : (nicknames[Math.floor(Math.random() * nicknames.length)] + ` (P${playerIndex + 1})`);

        const newPlayer = {
            socketId: socket.id,
            playerIndex,
            playerName,
            playerAvatar: customAvatar,
            playerColor
        };

        room.players.push(newPlayer);
        socket.join(actualRoomCode);

        // Acknowledge the player joining
        socket.emit("joined-room", {
            roomCode: actualRoomCode,
            playerIndex,
            playerName,
            playerColor
        });

        // Notify console and other room members of the update
        io.to(actualRoomCode).emit("player-list-update", room.players);
        
        // Backward compatibility
        socket.to(actualRoomCode).emit("controller-connected");

        console.log(`${playerName} joined room ${actualRoomCode}`);
    });

    // Real-time update player name & avatar inside the lobby
    socket.on("update-player-name", ({ roomCode, name, avatar }) => {
        if (!roomCode || !name) return;
        const formattedInput = roomCode.toString().replace(/\s+/g, "").toUpperCase();
        const actualRoomCode = Object.keys(rooms).find(key => key.replace(/\s+/g, "") === formattedInput);
        const room = rooms[actualRoomCode];

        if (room) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                player.playerName = name.trim();
                if (avatar) player.playerAvatar = avatar;
                io.to(actualRoomCode).emit("player-list-update", room.players);
                console.log(`Updated player profile: ${player.playerName} ${player.playerAvatar}`);
            }
        }
    });

    // Trigger start arcade transition
    socket.on("start-arcade", (roomCode) => {
        if (!roomCode) return;
        const formattedInput = roomCode.toString().replace(/\s+/g, "").toUpperCase();
        const actualRoomCode = Object.keys(rooms).find(key => key.replace(/\s+/g, "") === formattedInput);
        
        if (actualRoomCode) {
            console.log(`Arcade starting for room: ${actualRoomCode}`);
            io.to(actualRoomCode).emit("arcade-started");
        }
    });

    // Forward controller buttons with complete player info
    socket.on("controller-input", ({ roomCode, type }) => {
        if (!roomCode) return;
        const formattedInput = roomCode.toString().replace(/\s+/g, "").toUpperCase();
        const actualRoomCode = Object.keys(rooms).find(key => key.replace(/\s+/g, "") === formattedInput);
        const room = rooms[actualRoomCode];
        
        if (room) {
            const player = room.players.find(p => p.socketId === socket.id);
            if (player) {
                console.log(`Input from ${player.playerName} in room ${actualRoomCode}: ${type}`);
                io.to(actualRoomCode).emit("controller-input", {
                    playerId: socket.id,
                    playerIndex: player.playerIndex,
                    playerName: player.playerName,
                    playerColor: player.playerColor,
                    type
                });
            } else {
                // Fallback for single player/legacy
                socket.to(actualRoomCode).emit("controller-input", {
                    playerId: socket.id,
                    playerIndex: 0,
                    playerName: "Player 1",
                    playerColor: "#00f0ff",
                    type
                });
            }
        }
    });

    // Console broadcasts current screen state to mobile devices (so gamepads change layout)
    socket.on("console-screen-change", ({ roomCode, screen, data }) => {
        const uppercaseCode = roomCode.trim().toUpperCase();
        io.to(uppercaseCode).emit("console-screen-change", { screen, data });
    });

    // Console sends private game info (e.g. secret role/word) to specific player
    socket.on("send-private-payload", ({ roomCode, targetPlayerId, payload }) => {
        io.to(targetPlayerId).emit("private-payload", payload);
    });

    // Disconnect handling
    socket.on("disconnect", () => {
        console.log("User Disconnected:", socket.id);
        const search = findSocketRoomAndPlayer(socket.id);

        if (search) {
            const { roomCode, role, room, playerIndex } = search;

            if (role === "console") {
                // Clean up the room if console disconnects
                console.log(`Console disconnected. Cleaning up room: ${roomCode}`);
                io.to(roomCode).emit("room-destroyed");
                delete rooms[roomCode];
            } else if (role === "player") {
                // Remove player
                const p = room.players.splice(playerIndex, 1)[0];
                
                // Re-adjust player indexes to be continuous (0, 1, 2...)
                const colors = ["#00f0ff", "#ff007f", "#39ff14", "#ffae00"];
                room.players.forEach((player, idx) => {
                    player.playerIndex = idx;
                    player.playerName = `Player ${idx + 1}`;
                    player.playerColor = colors[idx] || "#ffffff";
                    
                    // Notify the player of their new ID/color
                    io.to(player.socketId).emit("player-reassigned", {
                        playerIndex: player.playerIndex,
                        playerName: player.playerName,
                        playerColor: player.playerColor
                    });
                });

                console.log(`${p.playerName} disconnected from room ${roomCode}`);
                io.to(roomCode).emit("player-list-update", room.players);
            }
        }
    });

});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});