/**
 * MOBILE ROOT — App.js
 * Single responsibility: initialise the socket hook, track phase,
 * and render the correct screen. All logic lives in hooks and screen components.
 */

import React, { useState } from "react";
import { View, StyleSheet } from "react-native";

import useSocket        from "./src/hooks/useSocket";
import CodeInputScreen  from "./src/screens/CodeInputScreen";
import WaitingScreen    from "./src/screens/WaitingScreen";
import GamepadScreen    from "./src/screens/GamepadScreen";
import SplashScreen     from "./src/screens/SplashScreen";
import IPModal          from "./src/components/IPModal";
import { COLORS }       from "./src/constants/theme";

export default function App() {
  const socket = useSocket();
  const [ipModalVisible, setIpModalVisible] = useState(false);

  const handleSaveIP = (newIP) => {
    socket.changeServerIP(newIP);
    setIpModalVisible(false);
  };

  return (
    <View style={styles.container}>

      {socket.phase === "input" && (
        <CodeInputScreen
          roomCode={socket.roomCode}
          joinError={socket.joinError}
          serverIP={socket.serverIP}
          onKey={socket.handleKeyPress}
          onSettingsPress={() => setIpModalVisible(true)}
        />
      )}

      {socket.phase === "waiting" && (
        <WaitingScreen
          playerName={socket.playerName}
          playerColor={socket.playerColor}
          roomCode={socket.roomCode}
          onNameChange={socket.handleNameChange}
          onYesStart={socket.handleYesStart}
        />
      )}

      {socket.phase === "splash" && <SplashScreen />}

      {socket.phase === "gamepad" && (
        <GamepadScreen
          playerName={socket.playerName}
          playerColor={socket.playerColor}
          roomCode={socket.roomCode}
          currentScreen={socket.currentScreen}
          privatePayload={socket.privatePayload}
          showSecret={socket.showSecret}
          setShowSecret={socket.setShowSecret}
          onInput={socket.sendInput}
          onEditNickname={() => socket.setPhase("waiting")}
          onExit={() => socket.setPhase("input")}
        />
      )}

      <IPModal
        visible={ipModalVisible}
        currentIP={socket.serverIP}
        onSave={handleSaveIP}
        onCancel={() => setIpModalVisible(false)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 40,
  },
});