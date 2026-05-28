import { io } from "socket.io-client";

// In production (Vercel): set VITE_SERVER_URL to your Railway server URL.
// In local dev: falls back to localhost:5000.
const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

const socket = io(SERVER_URL);

export default socket;