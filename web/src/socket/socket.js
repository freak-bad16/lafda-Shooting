import { io } from "socket.io-client";

// Resolve host dynamically (if open on mobile phone, it connects to PC's IP; if localhost, it uses localhost)
const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
const socket = io(`http://${host}:5000`);

export default socket;