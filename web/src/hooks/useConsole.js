/**
 * HOOK: useConsole
 * Manages all console (TV screen) socket logic.
 * Returns state + handlers needed by ConsolePage.
 */

import { useState, useEffect, useRef } from "react";
import socket from "../socket/socket";
import sound from "../services/sound";
import GAMES from "../constants/gamesList";

const useConsole = () => {
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState([]);
  const [screen, setScreen] = useState("landing");
  const [selectedGame, setSelectedGame] = useState(0);
  const [lastInput, setLastInput] = useState(null);
  const [lobbyLeftView, setLobbyLeftView] = useState("guide");
  const [activeButtons, setActiveButtons] = useState({});

  // FIX 1: Track real fullscreen state via browser event
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  // Refs to avoid stale closures inside socket callbacks
  const screenRef = useRef(screen);
  const selectedGameRef = useRef(selectedGame);
  const playersRef = useRef(players);
  const roomCodeRef = useRef(roomCode);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { selectedGameRef.current = selectedGame; }, [selectedGame]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  // Auto-switch lobby left view based on connected players
  useEffect(() => {
    setLobbyLeftView(players.length > 0 ? "players" : "guide");
  }, [players.length]);

  // FIX 1: Listen to real fullscreenchange events so state stays in sync
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  useEffect(() => {
    socket.emit("create-room");

    const onRoomCreated = (code) => setRoomCode(code);

    const onPlayerListUpdate = (playerList) => {
      setPlayers(playerList);
      if (playerList.length > 0) sound.playStart();
    };

    const onArcadeStarted = () => {
      sound.playStart();
      setScreen("splash");
      setTimeout(() => {
        setScreen("store");
        socket.emit("console-screen-change", {
          roomCode: roomCodeRef.current,
          screen: "store",
        });
      }, 2500);
    };

    const onControllerInput = (inputData) => {
      // Flash the button highlight on the guide mockup
      setActiveButtons((prev) => ({ ...prev, [inputData.playerIndex]: inputData.type }));
      setTimeout(() => {
        setActiveButtons((prev) => ({ ...prev, [inputData.playerIndex]: null }));
      }, 150);

      setLastInput({
        playerIndex: inputData.playerIndex,
        playerColor: inputData.playerColor,
        playerName: inputData.playerName,
        type: inputData.type,
        timestamp: Date.now(),
      });

      const activeScreen = screenRef.current;
      const currentSelected = selectedGameRef.current;
      const connectedCount = playersRef.current.length;

      if (activeScreen === "store") {
        if (inputData.type === "DOWN") {
          sound.playMove();
          setSelectedGame((prev) => (prev < GAMES.length - 1 ? prev + 1 : 0));
        }
        if (inputData.type === "UP") {
          sound.playMove();
          setSelectedGame((prev) => (prev > 0 ? prev - 1 : GAMES.length - 1));
        }
        // FIX 2: BACK from store → lobby (not landing). Landing is unreachable via controller.
        if (inputData.type === "BACK") {
          sound.playBack();
          setScreen("lobby");
          socket.emit("console-screen-change", { roomCode: roomCodeRef.current, screen: "lobby" });
        }
        if (inputData.type === "OK") {
          const selectedId = GAMES[currentSelected].id;
          if (selectedId === "game_imposter" && connectedCount < 2) {
            alert("Guess the Imposter requires at least 2 players!");
            return;
          }
          sound.playSelect();
          sound.playStart();
          setScreen(selectedId);
          socket.emit("console-screen-change", { roomCode: roomCodeRef.current, screen: selectedId });
        }
      }

      // SEARCH from any active game → return to store
      const gameScreens = ["game_snake", "game_guess", "game_never", "game_imposter"];
      if (gameScreens.includes(activeScreen) && inputData.type === "SEARCH") {
        sound.playBack();
        setScreen("store");
        socket.emit("console-screen-change", { roomCode: roomCodeRef.current, screen: "store" });
      }

      // FIX 2: Lobby screen ignores all controller BACK presses — no way to go past lobby via controller

    };

    socket.on("room-created", onRoomCreated);
    socket.on("player-list-update", onPlayerListUpdate);
    socket.on("arcade-started", onArcadeStarted);
    socket.on("controller-input", onControllerInput);

    return () => {
      socket.off("room-created", onRoomCreated);
      socket.off("player-list-update", onPlayerListUpdate);
      socket.off("arcade-started", onArcadeStarted);
      socket.off("controller-input", onControllerInput);
    };
  }, []);

  const handleGameExit = (action) => {
    if (action === "store") {
      setScreen("store");
      socket.emit("console-screen-change", { roomCode, screen: "store" });
    } else if (action === "restart") {
      const cur = screen;
      setScreen("store");
      setTimeout(() => {
        setScreen(cur);
        socket.emit("console-screen-change", { roomCode, screen: cur });
      }, 50);
    }
  };

  // FIX 1: Enter fullscreen once and stay — only toggles if user explicitly calls this
  const enterFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleLobbyView = () =>
    setLobbyLeftView((prev) => (prev === "guide" ? "players" : "guide"));

  return {
    roomCode,
    players,
    screen,
    setScreen,
    selectedGame,
    lastInput,
    lobbyLeftView,
    activeButtons,
    isFullscreen,
    handleGameExit,
    enterFullscreen,
    toggleLobbyView,
  };
};

export default useConsole;
