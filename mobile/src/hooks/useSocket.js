/**
 * HOOK: useSocket (Mobile)
 * All socket event listeners and emitters for the Expo controller app.
 * Keeps App.js clean — just call this hook and use the returned state + actions.
 */

import { useState, useEffect, useRef } from "react";
import { Vibration } from "react-native";
import { getSocket, updateSocketIP } from "../socket/socket";
import { randomNickname } from "../constants/theme";

const useSocket = () => {
  const socketRef = useRef(null);

  const [serverIP, setServerIP]           = useState("192.168.1.9");
  const [roomCode, setRoomCode]           = useState("");
  const [isConnected, setIsConnected]     = useState(false);
  const [isJoined, setIsJoined]           = useState(false);
  const [joinError, setJoinError]         = useState("");

  // Phase: 'input' | 'waiting' | 'splash' | 'gamepad'
  const [phase, setPhase]                 = useState("input");

  const [playerIndex, setPlayerIndex]     = useState(0);
  const [playerName, setPlayerName]       = useState(randomNickname);
  const [playerColor, setPlayerColor]     = useState("#00f0ff");
  const [playerAvatar, setPlayerAvatar]   = useState("🎓");

  const [currentScreen, setCurrentScreen] = useState("landing");
  const [privatePayload, setPrivatePayload] = useState(null);
  const [showSecret, setShowSecret]       = useState(false);

  useEffect(() => {
    socketRef.current = getSocket();
    socketRef.current.connect();

    const onConnect    = () => { setIsConnected(true); setJoinError(""); };
    const onDisconnect = () => { setIsConnected(false); setIsJoined(false); setPhase("input"); };

    const onJoinedRoom = (data) => {
      setIsJoined(true);
      setJoinError("");
      if (data.playerIndex !== undefined) {
        setPlayerIndex(data.playerIndex);
        setPlayerName(data.playerName);
        setPlayerColor(data.playerColor);
      }
      setPhase("waiting");
      Vibration.vibrate([0, 50, 50, 50]);
    };

    const onJoinError = (err) => {
      setJoinError(err);
      Vibration.vibrate(150);
    };

    const onPlayerReassigned = (data) => {
      setPlayerIndex(data.playerIndex);
      setPlayerName(data.playerName);
      setPlayerColor(data.playerColor);
    };

    const onConsoleScreenChange = ({ screen, data }) => {
      setCurrentScreen(screen);
      if (screen === "store" || (data && data.phase === "distributing")) {
        setPrivatePayload(null);
        setShowSecret(false);
      }
    };

    const onPrivatePayload = (payload) => {
      setPrivatePayload(payload);
      Vibration.vibrate(80);
    };

    const onArcadeStarted = () => {
      setPhase("splash");
      Vibration.vibrate([0, 100, 100, 100]);
      setTimeout(() => setPhase("gamepad"), 2500);
    };

    const onRoomDestroyed = () => {
      setIsJoined(false);
      setPhase("input");
      alert("Main console disconnected! Lobby closed.");
      Vibration.vibrate(200);
    };

    socketRef.current.on("connect",               onConnect);
    socketRef.current.on("disconnect",            onDisconnect);
    socketRef.current.on("joined-room",           onJoinedRoom);
    socketRef.current.on("join-error",            onJoinError);
    socketRef.current.on("player-reassigned",     onPlayerReassigned);
    socketRef.current.on("console-screen-change", onConsoleScreenChange);
    socketRef.current.on("private-payload",       onPrivatePayload);
    socketRef.current.on("arcade-started",        onArcadeStarted);
    socketRef.current.on("room-destroyed",        onRoomDestroyed);

    if (socketRef.current.connected) setIsConnected(true);

    return () => {
      socketRef.current?.off("connect",               onConnect);
      socketRef.current?.off("disconnect",            onDisconnect);
      socketRef.current?.off("joined-room",           onJoinedRoom);
      socketRef.current?.off("join-error",            onJoinError);
      socketRef.current?.off("player-reassigned",     onPlayerReassigned);
      socketRef.current?.off("console-screen-change", onConsoleScreenChange);
      socketRef.current?.off("private-payload",       onPrivatePayload);
      socketRef.current?.off("arcade-started",        onArcadeStarted);
      socketRef.current?.off("room-destroyed",        onRoomDestroyed);
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleKeyPress = (val) => {
    Vibration.vibrate(25);
    setJoinError("");
    if (val === "X") {
      setRoomCode((prev) => prev.slice(0, -1));
    } else if (val === "OK") {
      if (roomCode.length < 6) {
        setJoinError("Room code must be exactly 6 digits!");
        Vibration.vibrate(150);
        return;
      }
      socketRef.current.emit("join-room", { roomCode, playerName, playerAvatar });
    } else {
      if (roomCode.length < 6) setRoomCode((prev) => prev + val);
    }
  };

  const handleNameChange = (text) => {
    setPlayerName(text);
    if (isJoined) {
      socketRef.current.emit("update-player-name", { roomCode, name: text, avatar: playerAvatar });
    }
  };

  const handleAvatarSelect = (emoji) => {
    Vibration.vibrate(30);
    setPlayerAvatar(emoji);
    if (isJoined) {
      socketRef.current.emit("update-player-name", { roomCode, name: playerName, avatar: emoji });
    }
  };

  const handleYesStart = () => {
    Vibration.vibrate(60);
    socketRef.current.emit("start-arcade", roomCode);
  };

  const sendInput = (type) => {
    if (!isJoined) return;
    Vibration.vibrate(35);
    socketRef.current.emit("controller-input", { roomCode, type });
  };

  const changeServerIP = (newIP) => {
    setServerIP(newIP);
    socketRef.current = updateSocketIP(newIP);
    socketRef.current.once("connect", () => setIsConnected(true));
  };

  return {
    // State
    serverIP, roomCode, isConnected, isJoined, joinError,
    phase, setPhase,
    playerIndex, playerName, playerColor, playerAvatar,
    currentScreen, privatePayload, showSecret, setShowSecret,
    // Actions
    handleKeyPress, handleNameChange, handleAvatarSelect,
    handleYesStart, sendInput, changeServerIP,
  };
};

export default useSocket;
