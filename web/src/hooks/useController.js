/**
 * HOOK: useController
 * Manages all web controller socket logic.
 * Returns state + action handlers for ControllerPage.
 */

import { useState, useEffect } from "react";
import socket from "../socket/socket";
import { randomNickname } from "../constants/playerConfig";

const useController = () => {
  const [controllerRoom, setControllerRoom] = useState("");
  const [controllerJoined, setControllerJoined] = useState(false);
  const [controllerError, setControllerError] = useState("");

  // Phase: 'input' | 'waiting' | 'splash' | 'gamepad'
  const [phase, setPhase] = useState("input");

  const [playerIndex, setPlayerIndex] = useState(0);
  const [playerName, setPlayerName] = useState(randomNickname);
  const [playerColor, setPlayerColor] = useState("#00f0ff");
  const [playerAvatar, setPlayerAvatar] = useState("🎓");

  const [activeScreen, setActiveScreen] = useState("landing");
  const [privatePayload, setPrivatePayload] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    // Auto-fill room from URL ?room=XXXXXX
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get("room");
    if (room) {
      const code = room.replace(/\s+/g, "").toUpperCase();
      setControllerRoom(code);
      socket.emit("join-room", { roomCode: code, playerName, playerAvatar });
    }

    const onJoinedRoom = (data) => {
      setControllerJoined(true);
      setControllerError("");
      if (data.playerIndex !== undefined) {
        setPlayerIndex(data.playerIndex);
        setPlayerName(data.playerName);
        setPlayerColor(data.playerColor);
        if (data.playerAvatar) setPlayerAvatar(data.playerAvatar);
      }
      setPhase("waiting");
      if (navigator.vibrate) navigator.vibrate([0, 50, 50, 50]);
    };

    const onJoinError = (err) => {
      setControllerError(err);
      if (navigator.vibrate) navigator.vibrate(150);
    };

    const onPlayerReassigned = (data) => {
      setPlayerIndex(data.playerIndex);
      setPlayerName(data.playerName);
      setPlayerColor(data.playerColor);
    };

    const onConsoleScreenChange = ({ screen, data }) => {
      setActiveScreen(screen);
      if (screen === "store" || (data && data.phase === "distributing")) {
        setPrivatePayload(null);
        setShowSecret(false);
      }
    };

    const onPrivatePayload = (payload) => {
      setPrivatePayload(payload);
      if (navigator.vibrate) navigator.vibrate(80);
    };

    const onArcadeStarted = () => {
      setPhase("splash");
      if (navigator.vibrate) navigator.vibrate([0, 100, 100, 100]);
      setTimeout(() => setPhase("gamepad"), 2500);
    };

    const onRoomDestroyed = () => {
      setControllerJoined(false);
      setPhase("input");
      alert("Main console disconnected! Lobby closed.");
    };

    socket.on("joined-room", onJoinedRoom);
    socket.on("join-error", onJoinError);
    socket.on("player-reassigned", onPlayerReassigned);
    socket.on("console-screen-change", onConsoleScreenChange);
    socket.on("private-payload", onPrivatePayload);
    socket.on("arcade-started", onArcadeStarted);
    socket.on("room-destroyed", onRoomDestroyed);

    return () => {
      socket.off("joined-room", onJoinedRoom);
      socket.off("join-error", onJoinError);
      socket.off("player-reassigned", onPlayerReassigned);
      socket.off("console-screen-change", onConsoleScreenChange);
      socket.off("private-payload", onPrivatePayload);
      socket.off("arcade-started", onArcadeStarted);
      socket.off("room-destroyed", onRoomDestroyed);
    };
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleKeyPress = (val) => {
    if (navigator.vibrate) navigator.vibrate(25);
    setControllerError("");

    if (val === "X") {
      setControllerRoom((prev) => prev.slice(0, -1));
    } else if (val === "OK") {
      if (controllerRoom.length < 6) {
        setControllerError("Room code must be exactly 6 digits!");
        return;
      }
      socket.emit("join-room", { roomCode: controllerRoom, playerName, playerAvatar });
    } else {
      if (controllerRoom.length < 6) {
        setControllerRoom((prev) => prev + val);
      }
    }
  };

  const handleNameChange = (val) => {
    setPlayerName(val);
    if (controllerJoined) {
      socket.emit("update-player-name", { roomCode: controllerRoom, name: val, avatar: playerAvatar });
    }
  };

  const handleAvatarSelect = (emoji) => {
    if (navigator.vibrate) navigator.vibrate(30);
    setPlayerAvatar(emoji);
    if (controllerJoined) {
      socket.emit("update-player-name", { roomCode: controllerRoom, name: playerName, avatar: emoji });
    }
  };

  const handleYesStart = () => {
    if (navigator.vibrate) navigator.vibrate(60);
    socket.emit("start-arcade", controllerRoom);
  };

  const sendInput = (type) => {
    if (navigator.vibrate) navigator.vibrate(40);
    socket.emit("controller-input", { roomCode: controllerRoom, type });
  };

  return {
    // State
    controllerRoom,
    controllerJoined,
    controllerError,
    phase,
    setPhase,
    playerIndex,
    playerName,
    playerColor,
    playerAvatar,
    activeScreen,
    privatePayload,
    showSecret,
    setShowSecret,
    // Actions
    handleKeyPress,
    handleNameChange,
    handleAvatarSelect,
    handleYesStart,
    sendInput,
  };
};

export default useController;
