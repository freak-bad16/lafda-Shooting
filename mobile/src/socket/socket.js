import { io } from "socket.io-client";

/**
 * SOCKET CONNECTION (Mobile / Expo Go)
 * Connects to the Railway-deployed server.
 * Replace SERVER_URL with your actual Railway URL once deployed.
 * For local dev swap it back to `http://<YOUR_LOCAL_IP>:5000`.
 */
export const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:5000";

let socket = io(SERVER_URL, {
  transports: ["websocket"],
  autoConnect: false,
});

export const getSocket = () => socket;

/** @deprecated No longer needed — server is on Railway. Kept for backwards compat. */
export const updateSocketIP = (_newIP) => {
  // No-op: IP switching is no longer needed with a cloud server.
  return socket;
};

export default socket;
