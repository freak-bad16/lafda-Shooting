/**
 * SCREEN: GamepadScreen (Mobile)
 * Active controller — profile header, clue cabinet (imposter),
 * shelf bar, snake controls + circular D-pad.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { COLORS } from "../constants/theme";

// Functional shelf actions
const SHELF = [
  { icon: "✖️", label: "EXIT", type: "exit" },
  { icon: "↩", label: "BACK", type: "BACK" },
  { icon: "🔍", label: "GAMES", type: "SEARCH" },
];

const GamepadScreen = ({
  playerName,
  playerColor,
  roomCode,
  currentScreen,
  privatePayload,
  showSecret,
  setShowSecret,
  onInput,
  onEditNickname,
  onExit,
}) => {
  const isSnake = currentScreen === "game_snake";
  const isGuess = currentScreen === "game_guess";
  const isNever = currentScreen === "game_never";

  const showUP = !isGuess;
  const showDOWN = !isGuess;
  const showLEFT = isSnake || isGuess;
  const showRIGHT = isSnake || isGuess;
  const showOK = !isSnake && !isNever;

  return (
    <View style={styles.screen}>

      {/* HEADER */}
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            { backgroundColor: playerColor },
          ]}
        >
          <Text style={styles.avatarText}>
            {playerName
              ? playerName.trim().slice(0, 1).toUpperCase()
              : "P"}
          </Text>
        </View>

        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={styles.playerName}>
            {playerName}
          </Text>

          <Text style={styles.roomLabel}>
            Wing: {roomCode}
          </Text>
        </View>

        <TouchableOpacity onPress={onEditNickname}>
          <Text style={styles.editBtn}>
            Edit ✏
          </Text>
        </TouchableOpacity>
      </View>

      {/* CLUE CABINET */}
      {privatePayload && (
        <View
          style={[
            styles.clueCabinet,
            { borderColor: playerColor },
          ]}
        >
          <Text style={styles.clueLabel}>
            CLUE CABINET
          </Text>

          {showSecret ? (
            <View style={{ alignItems: "center" }}>
              <Text style={styles.clueCategory}>
                Category: {privatePayload.category}
              </Text>

              <Text
                style={[
                  styles.clueWord,
                  {
                    color:
                      privatePayload.role === "imposter"
                        ? COLORS.pink
                        : COLORS.green,
                  },
                ]}
              >
                {privatePayload.word}
              </Text>

              <TouchableOpacity
                onPress={() => setShowSecret(false)}
                style={styles.clueHideBtn}
              >
                <Text style={styles.clueHideText}>
                  HIDE
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowSecret(true)}
              style={styles.clueRevealBtn}
            >
              <Text style={styles.clueRevealText}>
                REVEAL WORD
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* SHELF BAR */}
      <View style={styles.shelfBar}>
        {SHELF.map(({ icon, label, type }) => (
          <TouchableOpacity
            key={label}
            style={styles.shelfBtn}
            onPress={() => {
              if (type === "exit") {
                onExit();
              } else {
                onInput(type);
              }
            }}
          >
            <Text
              style={{
                fontSize: type === "exit" ? 20 : 18,
              }}
            >
              {icon}
            </Text>

            <Text style={styles.shelfBtnLabel}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTROLS */}
      <View style={styles.controlsWrapper}>

        {/* SNAKE CONTROLS */}
        {isSnake ? (
          <View style={styles.snakeControls}>

            {/* UP */}
            <TouchableOpacity
              style={[
                styles.snakeBtn,
                styles.snakeVertical,
              ]}
              onPressIn={() => onInput("UP")}
            >
              <Text style={styles.snakeBtnText}>
                ▲
              </Text>
            </TouchableOpacity>

            {/* LEFT + RIGHT */}
            <View style={styles.snakeMiddleRow}>
              <TouchableOpacity
                style={[
                  styles.snakeBtn,
                  styles.snakeHorizontal,
                ]}
                onPressIn={() => onInput("LEFT")}
              >
                <Text style={styles.snakeBtnText}>
                  ◀
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.snakeBtn,
                  styles.snakeHorizontal,
                ]}
                onPressIn={() => onInput("RIGHT")}
              >
                <Text style={styles.snakeBtnText}>
                  ▶
                </Text>
              </TouchableOpacity>
            </View>

            {/* DOWN */}
            <TouchableOpacity
              style={[
                styles.snakeBtn,
                styles.snakeVertical,
              ]}
              onPressIn={() => onInput("DOWN")}
            >
              <Text style={styles.snakeBtnText}>
                ▼
              </Text>
            </TouchableOpacity>

          </View>
        ) : (
          /* NORMAL D-PAD */
          <View style={styles.dpadOuter}>
            <View style={styles.dpadWheel}>

              {showUP && (
                <TouchableOpacity
                  style={[
                    styles.wedge,
                    styles.wedgeUp,
                  ]}
                  onPressIn={() => onInput("UP")}
                >
                  <Text style={styles.wedgeText}>
                    {isNever ? "HAVE 😈" : "▲"}
                  </Text>
                </TouchableOpacity>
              )}

              {showLEFT && (
                <TouchableOpacity
                  style={[
                    styles.wedge,
                    styles.wedgeLeft,
                  ]}
                  onPressIn={() => onInput("LEFT")}
                >
                  <Text style={styles.wedgeText}>
                    ◀
                  </Text>
                </TouchableOpacity>
              )}

              {showRIGHT && (
                <TouchableOpacity
                  style={[
                    styles.wedge,
                    styles.wedgeRight,
                  ]}
                  onPressIn={() => onInput("RIGHT")}
                >
                  <Text style={styles.wedgeText}>
                    ▶
                  </Text>
                </TouchableOpacity>
              )}

              {showDOWN && (
                <TouchableOpacity
                  style={[
                    styles.wedge,
                    styles.wedgeDown,
                  ]}
                  onPressIn={() => onInput("DOWN")}
                >
                  <Text style={styles.wedgeText}>
                    {isNever ? "NEVER 😇" : "▼"}
                  </Text>
                </TouchableOpacity>
              )}

              {showOK && (
                <TouchableOpacity
                  style={styles.dpadCenter}
                  onPressIn={() => onInput("OK")}
                >
                  <Text
                    style={{
                      color: COLORS.green,
                      fontSize: 26,
                      fontWeight: "bold",
                    }}
                  >
                    ↵
                  </Text>
                </TouchableOpacity>
              )}

            </View>
          </View>
        )}

      </View>
    </View>
  );
};

const WHEEL = 260;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  playerName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  roomLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },

  editBtn: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },

  clueCabinet: {
    borderWidth: 1.5,
    backgroundColor: "#111215",
    padding: 10,
    borderRadius: 14,
    alignItems: "center",
  },

  clueLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: "bold",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  clueCategory: {
    color: COLORS.textSecondary,
    fontSize: 9,
  },

  clueWord: {
    fontSize: 14,
    fontWeight: "900",
    marginVertical: 4,
  },

  clueHideBtn: {
    backgroundColor: "#161824",
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },

  clueHideText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "bold",
  },

  clueRevealBtn: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    backgroundColor: "rgba(255,255,255,0.02)",
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },

  clueRevealText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 10,
  },

  shelfBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#14151b",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },

  shelfBtn: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    paddingVertical: 4,
  },

  shelfBtnLabel: {
    fontSize: 8,
    color: COLORS.textSecondary,
    fontWeight: "700",
    marginTop: 3,
    letterSpacing: 0.5,
  },

  controlsWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
  },

  /* SNAKE CONTROLS */

  snakeControls: {
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },

  snakeMiddleRow: {
    flexDirection: "row",
    gap: 30,
  },

  snakeBtn: {
    backgroundColor: "#1b1c24",
    borderWidth: 2,
    borderColor: "#2c2f3a",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  snakeVertical: {
    width: 90,
    height: 70,
    borderRadius: 20,
  },

  snakeHorizontal: {
    width: 110,
    height: 80,
    borderRadius: 20,
  },

  snakeBtnText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
  },

  /* NORMAL D-PAD */

  dpadOuter: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
  },

  dpadWheel: {
    width: WHEEL,
    height: WHEEL,
    borderRadius: WHEEL / 2,
    backgroundColor: "#14151a",
    borderWidth: 4,
    borderColor: "#232530",
    position: "relative",
  },

  wedge: {
    position: "absolute",
    backgroundColor: "#1b1c24",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
    justifyContent: "center",
    alignItems: "center",
  },

  wedgeText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "bold",
  },

  wedgeUp: {
    top: 8,
    left: "50%",
    marginLeft: -40,
    width: 80,
    height: 62,
    borderRadius: 40,
  },

  wedgeDown: {
    bottom: 8,
    left: "50%",
    marginLeft: -40,
    width: 80,
    height: 62,
    borderRadius: 40,
  },

  wedgeLeft: {
    left: 8,
    top: "50%",
    marginTop: -40,
    width: 62,
    height: 80,
    borderRadius: 40,
  },

  wedgeRight: {
    right: 8,
    top: "50%",
    marginTop: -40,
    width: 62,
    height: 80,
    borderRadius: 40,
  },

  dpadCenter: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -42,
    marginLeft: -42,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#0b0c0f",
    borderWidth: 4,
    borderColor: "#232530",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default GamepadScreen;