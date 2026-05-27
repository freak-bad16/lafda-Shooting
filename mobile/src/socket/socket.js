import { io } from "socket.io-client";

// Default IP for standard setups
let serverIP = "192.168.1.6";
let socket = io(`http://${serverIP}:5000`, { autoConnect: false });

export const getSocket = () => socket;

export const updateSocketIP = (newIP) => {
  if (socket) {
    socket.disconnect();
  }
  serverIP = newIP.trim();
  socket = io(`http://${serverIP}:5000`, {
    transports: ["websocket"],
    forceNew: true
  });
  socket.connect();
  return socket;
};

export default socket;
