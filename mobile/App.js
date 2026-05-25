import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  Vibration,
  ActivityIndicator,
  Dimensions
} from "react-native";

import { getSocket, updateSocketIP } from "./src/socket/socket";

// 6 custom college-themed avatars
const AVATAR_OPTIONS = ["☠️", "😉", "😂", "🤗", "😡", "👻"];

export default function App() {
  const [serverIP, setServerIP] = useState("192.168.1.2");
  const [roomCode, setRoomCode] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  
  // Phase management: 'input', 'waiting', 'splash', 'gamepad'
  const [controllerPhase, setControllerPhase] = useState("input");
  const [joinError, setJoinError] = useState("");
  
  // Player credentials assigned by server
  const [playerIndex, setPlayerIndex] = useState(0);
  const [playerName, setPlayerName] = useState("Backbencher");
  const [playerColor, setPlayerColor] = useState("#00f0ff");
  const [selectedAvatar, setSelectedAvatar] = useState("🎓");
  
  // Game states forwarded from console
  const [currentScreen, setCurrentScreen] = useState("landing");
  const [privatePayload, setPrivatePayload] = useState(null);
  const [showSecret, setShowSecret] = useState(false);

  // Modals
  const [ipModalVisible, setIpModalVisible] = useState(false);
  const [ipInput, setIpInput] = useState("192.168.1.2");
  const [scanModalVisible, setScanModalVisible] = useState(false);

  // Dynamic orientation detection
  const [isPortrait, setIsPortrait] = useState(true);

  const socketRef = useRef(null);

  // Initialize socket & orientation listener
  useEffect(() => {
    socketRef.current = getSocket();
    socketRef.current.connect();

    const onConnect = () => {
      setIsConnected(true);
      setJoinError("");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setIsJoined(false);
      setControllerPhase("input");
    };

    const onJoinedRoom = (data) => {
      setIsJoined(true);
      setJoinError("");
      if (data.playerIndex !== undefined) {
        setPlayerIndex(data.playerIndex);
        setPlayerName(data.playerName);
        setPlayerColor(data.playerColor);
      }
      setControllerPhase("waiting");
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
      setControllerPhase("splash");
      Vibration.vibrate([0, 100, 100, 100]);
      setTimeout(() => {
        setControllerPhase("gamepad");
      }, 2500);
    };

    const onRoomDestroyed = () => {
      setIsJoined(false);
      setControllerPhase("input");
      alert("Main console disconnected! Lobby closed.");
      Vibration.vibrate(200);
    };

    socketRef.current.on("connect", onConnect);
    socketRef.current.on("disconnect", onDisconnect);
    socketRef.current.on("joined-room", onJoinedRoom);
    socketRef.current.on("join-error", onJoinError);
    socketRef.current.on("player-reassigned", onPlayerReassigned);
    socketRef.current.on("console-screen-change", onConsoleScreenChange);
    socketRef.current.on("private-payload", onPrivatePayload);
    socketRef.current.on("arcade-started", onArcadeStarted);
    socketRef.current.on("room-destroyed", onRoomDestroyed);

    if (socketRef.current.connected) {
      setIsConnected(true);
    }

    const { width, height } = Dimensions.get("window");
    setIsPortrait(height > width);

    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setIsPortrait(window.height > window.width);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect", onConnect);
        socketRef.current.off("disconnect", onDisconnect);
        socketRef.current.off("joined-room", onJoinedRoom);
        socketRef.current.off("join-error", onJoinError);
        socketRef.current.off("player-reassigned", onPlayerReassigned);
        socketRef.current.off("console-screen-change", onConsoleScreenChange);
        socketRef.current.off("private-payload", onPrivatePayload);
        socketRef.current.off("arcade-started", onArcadeStarted);
        socketRef.current.off("room-destroyed", onRoomDestroyed);
      }
      subscription?.remove();
    };
  }, []);

  const handleSaveIP = () => {
    setIpModalVisible(false);
    setServerIP(ipInput);
    socketRef.current = updateSocketIP(ipInput);
    socketRef.current.once("connect", () => {
      setIsConnected(true);
    });
  };

  const handleKeyPress = (val) => {
    Vibration.vibrate(25);
    setJoinError("");

    if (val === "X") {
      setRoomCode((prev) => prev.slice(0, -1));
    } else if (val === "OK") {
      if (roomCode.length < 4) {
        setJoinError("Room code must be exactly 4 digits!");
        Vibration.vibrate(150);
        return;
      }
      // Pass player index payload robustly to enable custom name and avatar values
      socketRef.current.emit("join-room", {
        roomCode,
        playerName,
        playerAvatar: selectedAvatar
      });
    } else {
      if (roomCode.length < 4) {
        setRoomCode((prev) => prev + val);
      }
    }
  };

  const handleNameChange = (text) => {
    setPlayerName(text);
    if (isJoined) {
      socketRef.current.emit("update-player-name", {
        roomCode,
        name: text,
        avatar: selectedAvatar
      });
    }
  };

  const handleAvatarSelect = (emoji) => {
    Vibration.vibrate(30);
    setSelectedAvatar(emoji);
    if (isJoined) {
      socketRef.current.emit("update-player-name", {
        roomCode,
        name: playerName,
        avatar: emoji
      });
    }
  };

  const handleYesStart = () => {
    Vibration.vibrate(60);
    socketRef.current.emit("start-arcade", roomCode);
  };

  const sendInput = (type) => {
    if (!isJoined) return;
    Vibration.vibrate(35);
    socketRef.current.emit("controller-input", {
      roomCode,
      type
    });
  };

  return (
    <View style={styles.container}>
      {/* ==================== STATE 1: NUMERIC KEYBOARD ENTRY (PORTRAIT) ==================== */}
      {controllerPhase === "input" && (
        <View style={styles.portraitContainer}>
          
          {/* Header Name & Avatar selectors */}
          <View style={styles.topNameSection}>
            <Text style={styles.nameHeaderLabel}>CHOOSE YOUR NICKNAME:</Text>
            <TextInput
              value={playerName}
              onChangeText={handleNameChange}
              placeholder="Enter name"
              placeholderTextColor="#484d6b"
              maxLength={14}
              style={styles.nameInputBox}
            />

            {/* Custom Emoji Selector Grid */}
            <Text style={[styles.nameHeaderLabel, { marginTop: 10 }]}>SELECT YOUR AVATAR:</Text>
            <View style={styles.avatarSelectionRow}>
              {AVATAR_OPTIONS.map((emoji) => {
                const isActive = selectedAvatar === emoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => handleAvatarSelect(emoji)}
                    style={[
                      styles.avatarBubble,
                      isActive && styles.avatarBubbleActive
                    ]}
                  >
                    <Text style={styles.avatarTextIcon}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            
            <TouchableOpacity 
              style={styles.miniSettingsBtn}
              onPress={() => setIpModalVisible(true)}
            >
              <Text style={{ fontSize: 9, color: "#00f0ff", fontWeight: "bold" }}>
                ⚙ IP: {serverIP}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Code input slot display */}
          <View style={styles.codePromptBox}>
            <Text style={styles.codePromptLabel}>ENTER THE CODE</Text>
            <Text style={styles.codeDisplayText}>{roomCode.padEnd(4, "_")}</Text>
            {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}
          </View>

          {/* Keypad Grid */}
          <View style={styles.keypadGrid}>
            <View style={styles.keypadRow}>
              {["1", "2", "3"].map((k) => (
                <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleKeyPress(k)}>
                  <Text style={styles.keypadText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {["4", "5", "6"].map((k) => (
                <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleKeyPress(k)}>
                  <Text style={styles.keypadText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              {["7", "8", "9"].map((k) => (
                <TouchableOpacity key={k} style={styles.keypadBtn} onPress={() => handleKeyPress(k)}>
                  <Text style={styles.keypadText}>{k}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.keypadRow}>
              <TouchableOpacity style={[styles.keypadBtn, styles.keypadBtnClear]} onPress={() => handleKeyPress("X")}>
                <Text style={[styles.keypadText, { color: "#ff007f" }]}>X</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.keypadBtn} onPress={() => handleKeyPress("0")}>
                <Text style={styles.keypadText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.keypadBtn, styles.keypadBtnOk]} onPress={() => handleKeyPress("OK")}>
                <Text style={[styles.keypadText, { color: "#39ff14", fontSize: 18 }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom triggers */}
          <View style={{ width: "100%", alignItems: "center" }}>
            <Text style={styles.portraitFooter}>AETHER ARCADE • PLAY SYSTEM</Text>
          </View>
        </View>
      )}

      {/* ==================== STATE 2: JOINED & WAITING (PORTRAIT) ==================== */}
      {controllerPhase === "waiting" && (
        <View style={[styles.portraitContainer, { justifyContent: "space-between", paddingVertical: 40 }]}>
          
          {/* Dynamic Nickname & Avatar Updates */}
          <View style={styles.topNameSection}>
            <Text style={styles.nameHeaderLabel}>PLAYER NICKNAME (EDITABLE IN LOBBY):</Text>
            <TextInput
              value={playerName}
              onChangeText={handleNameChange}
              placeholder="Enter name"
              placeholderTextColor="#484d6b"
              maxLength={14}
              style={[styles.nameInputBox, { borderColor: playerColor, width: "100%" }]}
            />

            <Text style={[styles.nameHeaderLabel, { marginTop: 10 }]}>UPDATE AVATAR:</Text>
            <View style={styles.avatarSelectionRow}>
              {AVATAR_OPTIONS.map((emoji) => {
                const isActive = selectedAvatar === emoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    onPress={() => handleAvatarSelect(emoji)}
                    style={[
                      styles.avatarBubble,
                      isActive && { borderColor: playerColor, shadowColor: playerColor, shadowRadius: 5 }
                    ]}
                  >
                    <Text style={styles.avatarTextIcon}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Lobby waiting state */}
          <View style={styles.waitingMainArea}>
            <View style={[styles.glowingDot, { backgroundColor: playerColor, shadowColor: playerColor }]} />
            <Text style={styles.waitingTitle}>LOBBY JOINED SUCCESS!</Text>
            <Text style={styles.waitingPulseText}>Waiting for more players to join?...</Text>
          </View>

          <View style={styles.startTriggerDrawer}>
            <Text style={styles.drawerConfirmLabel}>HAS EVERYONE JOINED?</Text>
            <TouchableOpacity style={styles.yesStartBtn} onPress={handleYesStart}>
              <Text style={styles.yesStartBtnText}>YES, START PLAYING!</Text>
            </TouchableOpacity>
          </View>

        </View>
      )}

      {/* ==================== STATE 3: TRANSITION SPLASH SCREEN ==================== */}
      {controllerPhase === "splash" && (
        <View style={styles.splashContainer}>
          <Text style={styles.splashWelcome}>CONNECTED ENJOY YOUR EXPERIENCE</Text>
          <Text style={styles.splashLogo}>AETHER ARCADE</Text>
          <ActivityIndicator size="large" color="#00f0ff" style={{ marginTop: 20 }} />
        </View>
      )}

      {/* ==================== STATE 4: DYNAMIC HANDHELD GAMEPAD CONTROLLER (WITH SOFTWARE AUTO-ROTATION) ==================== */}
      {controllerPhase === "gamepad" && (
        (() => {
          // Dynamic button configuration based on active game screen
          const isSnake = currentScreen === "game_snake";
          const isGuess = currentScreen === "game_guess";
          const isNever = currentScreen === "game_never";
          const isImposter = currentScreen === "game_imposter";

          const showUP = !isGuess;
          const showDOWN = !isGuess;
          const showLEFT = isSnake || isGuess;
          const showRIGHT = isSnake || isGuess;
          const showOK = !isSnake && !isNever;

          const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

          return (
            <View style={
              isPortrait ? {
                position: 'absolute',
                width: screenHeight - 56,
                height: screenWidth,
                top: (screenHeight - screenWidth) / 2 - 28,
                left: (screenWidth - screenHeight) / 2 + 28,
                transform: [{ rotate: '90deg' }],
                flexDirection: 'row',
                padding: 15,
                backgroundColor: '#06070a',
                borderColor: playerColor,
                borderWidth: 2.5,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'space-between'
              } : {
                flex: 1,
                width: '100%',
                height: '100%',
                flexDirection: 'row',
                padding: 15,
                backgroundColor: '#06070a',
                borderColor: playerColor,
                borderWidth: 2.5,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'space-between'
              }
            }>
              
              {/* LEFT PANE: Profile details, clue drawer, and BACK button */}
              <View style={{
                width: '40%',
                height: '100%',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 5
              }}>
                {/* Profile Card */}
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <View style={{
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    backgroundColor: '#121420',
                    borderWidth: 2.5,
                    borderColor: playerColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 5,
                    shadowColor: playerColor,
                    shadowRadius: 10,
                    shadowOpacity: 0.6
                  }}>
                    <Text style={{ fontSize: 32 }}>{selectedAvatar}</Text>
                  </View>
                  <Text style={{ color: playerColor, fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' }}>
                    {playerName}
                  </Text>
                  <Text style={{ fontSize: 8, color: '#8b92b6', marginTop: 1 }}>ROOM: {roomCode}</Text>
                </View>

                {/* Private Clue Drawer */}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%', marginVertical: 6 }}>
                  {privatePayload ? (
                    <View style={{ borderWidth: 1.5, borderColor: playerColor, backgroundColor: '#0d0f17', padding: 6, borderRadius: 8, width: '100%', alignItems: 'center' }}>
                      <Text style={{ fontSize: 7, color: '#8b92b6', fontWeight: 'bold', letterSpacing: 0.8, marginBottom: 2 }}>CLUE CABINET</Text>
                      {showSecret ? (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: '#8b92b6', fontSize: 7 }}>Category: {privatePayload.category}</Text>
                          <Text style={{ fontSize: 11, fontWeight: '900', color: privatePayload.role === 'imposter' ? '#ff007f' : '#00f0ff', marginVertical: 1 }}>{privatePayload.word}</Text>
                          <TouchableOpacity onPress={() => setShowSecret(false)} style={{ backgroundColor: '#161824', borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6 }}>
                            <Text style={{ color: '#8b92b6', fontSize: 7 }}>HIDE</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => setShowSecret(true)} style={{ width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 4, borderRadius: 4, alignItems: 'center' }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 8 }}>REVEAL WORD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ color: '#484d6b', fontSize: 7, fontWeight: 'bold', letterSpacing: 1 }}>
                        PHASE: {currentScreen.replace("game_", "").toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* B / BACK Button */}
                <TouchableOpacity 
                  onPressIn={() => sendInput("BACK")}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#2e121e',
                    borderWidth: 1.5,
                    borderColor: '#ff007f',
                    justifyContent: 'center',
                    alignItems: 'center',
                    shadowColor: '#ff007f',
                    shadowRadius: 5,
                    shadowOpacity: 0.4
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: 'white' }}>B</Text>
                  <Text style={{ fontSize: 6, color: '#ff007f', marginTop: -2, fontWeight: 'bold' }}>BACK</Text>
                </TouchableOpacity>
              </View>

              {/* RIGHT PANE: Unified Circular Console D-pad Controller */}
              <View style={{
                width: '60%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <View style={{
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: '#10111a',
                  borderWidth: 1.5,
                  borderColor: 'rgba(255,255,255,0.06)',
                  position: 'relative',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowRadius: 8,
                  shadowOpacity: 0.5
                }}>
                  
                  {/* UP Button (Top edge) */}
                  {showUP && (
                    <TouchableOpacity
                      onPressIn={() => sendInput("UP")}
                      style={{
                        position: 'absolute',
                        top: 5,
                        left: 65,
                        width: 70,
                        height: 50,
                        borderTopLeftRadius: 15,
                        borderTopRightRadius: 15,
                        borderWidth: isNever ? 1.5 : 1,
                        borderColor: isNever ? '#39ff14' : '#30344d',
                        backgroundColor: isNever ? '#10261f' : '#1f2233',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      {isNever ? (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: '#39ff14', fontSize: 7, fontWeight: 'bold' }}>HAVE</Text>
                          <Text style={{ fontSize: 8 }}>😈</Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#8b92b6', fontSize: 14 }}>▲</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* DOWN Button (Bottom edge) */}
                  {showDOWN && (
                    <TouchableOpacity
                      onPressIn={() => sendInput("DOWN")}
                      style={{
                        position: 'absolute',
                        bottom: 5,
                        left: 65,
                        width: 70,
                        height: 50,
                        borderBottomLeftRadius: 15,
                        borderBottomRightRadius: 15,
                        borderWidth: isNever ? 1.5 : 1,
                        borderColor: isNever ? '#ff007f' : '#30344d',
                        backgroundColor: isNever ? '#2e121e' : '#1f2233',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      {isNever ? (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={{ color: '#ff007f', fontSize: 7, fontWeight: 'bold' }}>NEVER</Text>
                          <Text style={{ fontSize: 8 }}>😇</Text>
                        </View>
                      ) : (
                        <Text style={{ color: '#8b92b6', fontSize: 14 }}>▼</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* LEFT Button (Left edge) */}
                  {showLEFT && (
                    <TouchableOpacity
                      onPressIn={() => sendInput("LEFT")}
                      style={{
                        position: 'absolute',
                        left: 5,
                        top: 65,
                        width: 50,
                        height: 70,
                        borderTopLeftRadius: 15,
                        borderBottomLeftRadius: 15,
                        borderWidth: 1,
                        borderColor: '#30344d',
                        backgroundColor: '#1f2233',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#8b92b6', fontSize: 14 }}>◀</Text>
                    </TouchableOpacity>
                  )}

                  {/* RIGHT Button (Right edge) */}
                  {showRIGHT && (
                    <TouchableOpacity
                      onPressIn={() => sendInput("RIGHT")}
                      style={{
                        position: 'absolute',
                        right: 5,
                        top: 65,
                        width: 50,
                        height: 70,
                        borderTopRightRadius: 15,
                        borderBottomRightRadius: 15,
                        borderWidth: 1,
                        borderColor: '#30344d',
                        backgroundColor: '#1f2233',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#8b92b6', fontSize: 14 }}>▶</Text>
                    </TouchableOpacity>
                  )}

                  {/* OK/A Button (Nested core center) */}
                  {showOK && (
                    <TouchableOpacity
                      onPressIn={() => sendInput("OK")}
                      style={{
                        position: 'absolute',
                        top: 65,
                        left: 65,
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        borderWidth: 2,
                        borderColor: '#39ff14',
                        backgroundColor: '#10261f',
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#39ff14',
                        shadowRadius: 5,
                        shadowOpacity: 0.4
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: 'white' }}>A</Text>
                      <Text style={{ fontSize: 6, color: '#39ff14', marginTop: -2, fontWeight: 'bold' }}>OK</Text>
                    </TouchableOpacity>
                  )}
                  
                </View>
              </View>

            </View>
          );
        })()
      )}

      {/* QR guide modal removed */}

      {/* SERVER IP CONNECTION CONFIG MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={ipModalVisible}
        onRequestClose={() => setIpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>SERVER CONNECTION SETTINGS</Text>
            <TextInput
              value={ipInput}
              onChangeText={setIpInput}
              keyboardType="numeric"
              placeholder="e.g. 192.168.1.15"
              placeholderTextColor="#484d6b"
              style={styles.modalInput}
            />
            <Text style={styles.modalTip}>Enter host computer IP address. Must be on same local WiFi.</Text>
            <View style={styles.modalBtnsRow}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setIpModalVisible(false)}>
                <Text style={styles.modalBtnCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSaveIP}>
                <Text style={styles.modalBtnSaveText}>SAVE</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0b10",
    paddingTop: 28 // Warning-free safe top margin
  },
  portraitContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
    alignItems: "center"
  },
  topNameSection: {
    width: "100%",
    backgroundColor: "#121420",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 14,
    position: "relative"
  },
  nameHeaderLabel: {
    color: "#8b92b6",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 5
  },
  nameInputBox: {
    borderWidth: 1,
    borderColor: "#1a1e36",
    backgroundColor: "#08090d",
    color: "#fff",
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "bold",
    width: "70%"
  },
  miniSettingsBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  avatarSelectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    width: "100%"
  },
  avatarBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#161824",
    borderWidth: 1.5,
    borderColor: "#2a2d3d",
    justifyContent: "center",
    alignItems: "center"
  },
  avatarBubbleActive: {
    borderColor: "#00f0ff",
    backgroundColor: "rgba(0, 240, 255, 0.08)",
    shadowColor: "#00f0ff",
    shadowRadius: 5,
    transform: [{ scale: 1.1 }]
  },
  avatarTextIcon: {
    fontSize: 20
  },
  codePromptBox: {
    alignItems: "center",
    marginVertical: 10
  },
  codePromptLabel: {
    color: "#8b92b6",
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 3
  },
  codeDisplayText: {
    color: "#00f0ff",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 8,
    textShadowColor: "rgba(0,240,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  errorText: {
    color: "#ff007f",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8
  },
  keypadGrid: {
    width: "100%",
    gap: 10,
    marginVertical: 5
  },
  keypadRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  keypadBtn: {
    flex: 1,
    height: 48,
    backgroundColor: "#161824",
    borderWidth: 1,
    borderColor: "#2a2d3d",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center"
  },
  keypadBtnClear: {
    backgroundColor: "rgba(255,0,127,0.06)",
    borderColor: "#ff007f33"
  },
  keypadBtnOk: {
    backgroundColor: "rgba(57,255,20,0.06)",
    borderColor: "#39ff1433"
  },
  keypadText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900"
  },
  scanCodeTriggerBtn: {
    backgroundColor: "rgba(0, 240, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(0, 240, 255, 0.3)",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 8
  },
  scanCodeTriggerText: {
    color: "#00f0ff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1
  },
  portraitFooter: {
    color: "#484d6b",
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 2
  },
  waitingMainArea: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1
  },
  glowingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 20
  },
  waitingTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 5
  },
  waitingPulseText: {
    color: "#8b92b6",
    fontSize: 12,
    fontStyle: "italic"
  },
  startTriggerDrawer: {
    width: "100%",
    backgroundColor: "#121420",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: 20,
    borderRadius: 16,
    alignItems: "center"
  },
  drawerConfirmLabel: {
    color: "#8b92b6",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1.5,
    marginBottom: 12
  },
  yesStartBtn: {
    backgroundColor: "#39ff14",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center"
  },
  yesStartBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1
  },
  rotateContainer: {
    flex: 1,
    backgroundColor: "#06070a",
    justifyContent: "center",
    alignItems: "center",
    padding: 35
  },
  rotateIcon: {
    fontSize: 64,
    color: "#00f0ff",
    marginBottom: 20
  },
  rotateTitle: {
    color: "#ff007f",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 10
  },
  rotateDesc: {
    color: "#8b92b6",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 20
  },
  rotateTip: {
    color: "#484d6b",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center"
  },
  splashContainer: {
    flex: 1,
    backgroundColor: "#06070a",
    justifyContent: "center",
    alignItems: "center",
    padding: 30
  },
  splashWelcome: {
    color: "#00f0ff",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 10
  },
  splashLogo: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 4
  },
  gamepadContainer: {
    flex: 1,
    backgroundColor: "#06070a",
    margin: 8,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: "row",
    padding: 10
  },
  gamepadLeftCol: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  gamepadCenterCol: {
    flex: 1.3,
    justifyContent: "space-between",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12
  },
  gamepadRightCol: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  gamepadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 6,
    borderBottomWidth: 1
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  playerLed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  playerNameText: {
    fontWeight: "bold",
    fontSize: 12
  },
  headerRoomText: {
    color: "#8b92b6",
    fontSize: 10
  },
  centerArena: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  lobbyDisplay: {
    alignItems: "center"
  },
  lobbyWelcome: {
    color: "#8b92b6",
    fontSize: 10,
    marginTop: 2
  },
  gamePhaseText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1
  },
  dpadCross: {
    width: 130,
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    position: "relative"
  },
  dpadHorizontalRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  dpadCenter: {
    width: 38,
    height: 38,
    backgroundColor: "#121420",
    zIndex: 2
  },
  dirBtn: {
    backgroundColor: "#1c1e2e",
    borderWidth: 1,
    borderColor: "#2f334a",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8
  },
  dirBtnUP: {
    width: 38,
    height: 42,
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0
  },
  dirBtnDOWN: {
    width: 38,
    height: 42,
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0
  },
  dirBtnLEFT: {
    width: 42,
    height: 38,
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0
  },
  dirBtnRIGHT: {
    width: 42,
    height: 38,
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0
  },
  dirBtnText: {
    color: "#8b92b6",
    fontSize: 13,
    fontWeight: "bold"
  },
  actionBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15
  },
  actionBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5
  },
  actionBtnOK: {
    backgroundColor: "#10261f",
    borderColor: "#39ff14"
  },
  actionBtnBACK: {
    backgroundColor: "#2e121e",
    borderColor: "#ff007f",
    transform: [{ translateY: -10 }]
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold"
  },
  actionBtnSubtext: {
    color: "#8b92b6",
    fontSize: 7,
    fontWeight: "bold",
    marginTop: -2
  },
  secretDrawer: {
    borderWidth: 1,
    backgroundColor: "#0d0f17",
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
    maxHeight: 100
  },
  secretDrawerLabel: {
    color: "#8b92b6",
    fontSize: 7,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4
  },
  revealSecretBtn: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    alignItems: "center",
    width: "100%"
  },
  revealSecretText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 9,
    letterSpacing: 0.5
  },
  secretBoxRevealed: {
    alignItems: "center",
    width: "100%"
  },
  secretCategory: {
    color: "#8b92b6",
    fontSize: 8
  },
  secretWordText: {
    fontSize: 14,
    fontWeight: "bold",
    marginVertical: 2
  },
  hideSecretBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "#161824"
  },
  hideSecretBtnText: {
    color: "#8b92b6",
    fontSize: 8,
    fontWeight: "bold"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 15
  },
  modalCard: {
    width: "80%",
    backgroundColor: "#121420",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1.5,
    borderColor: "#1a1e36"
  },
  modalTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: "center"
  },
  modalTipText: {
    color: "#8b92b6",
    fontSize: 11,
    lineHeight: 16
  },
  modalInput: {
    backgroundColor: "#08090d",
    borderWidth: 1,
    borderColor: "#1a1e36",
    color: "#fff",
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    marginBottom: 8
  },
  modalTip: {
    color: "#484d6b",
    fontSize: 9,
    lineHeight: 12,
    marginBottom: 12
  },
  modalBtnsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center"
  },
  modalBtnCancel: {
    backgroundColor: "#161824",
    borderWidth: 1,
    borderColor: "#30344d"
  },
  modalBtnCancelText: {
    color: "#8b92b6",
    fontWeight: "bold",
    fontSize: 11
  },
  modalBtnSave: {
    backgroundColor: "#00f0ff"
  },
  modalBtnSaveText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 11
  }
});