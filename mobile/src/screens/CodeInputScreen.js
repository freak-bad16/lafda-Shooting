/**
 * SCREEN: CodeInputScreen (Mobile)
 * Circular numeric keypad — enter a 6-digit room code to join.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

const KEYS = ["1","2","3","4","5","6","7","8","9","X","0","OK"];

const CodeInputScreen = ({ roomCode, joinError, serverIP, onKey, onSettingsPress }) => (
  <View style={styles.screen}>

    {/* Header */}
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <View style={styles.logoIcon} />
        <Text style={styles.logoText}>Lafda Shooting</Text>
      </View>
      <TouchableOpacity style={styles.ipBtn} onPress={onSettingsPress}>
        <Text style={styles.ipBtnText}>⚙ IP: {serverIP}</Text>
      </TouchableOpacity>
    </View>

    {/* Code display pill */}
    <View style={styles.codePillWrap}>
      <View style={styles.codePill}>
        <View style={styles.ticketDot} />
        <Text style={styles.codeText}>{roomCode.padEnd(6, "_")}</Text>
      </View>
      {joinError ? <Text style={styles.errorText}>{joinError}</Text> : null}
      <Text style={styles.hint}>Enter the code shown on the screen</Text>
    </View>

    {/* Keypad Grid */}
    <View style={styles.keyGrid}>
      {KEYS.map((k) => {
        const isCross = k === "X";
        const isOK    = k === "OK";
        return (
          <TouchableOpacity
            key={k}
            style={[
              styles.key,
              isCross && styles.keyCross,
              isOK    && styles.keyOK,
            ]}
            onPress={() => onKey(k)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.keyText,
              isCross && { color: "#ff3b30" },
              isOK    && { color: COLORS.green },
            ]}>
              {isCross ? "✕" : isOK ? "✓" : k}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>

    <Text style={styles.footer}>❓ Same WiFi as the TV/PC? You're good to go!</Text>
  </View>
);

const SIZE = 68;

const styles = StyleSheet.create({
  screen:      { flex: 1, paddingHorizontal: 24, paddingVertical: 12, justifyContent: "space-between", alignItems: "center" },
  header:      { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoRow:     { flexDirection: "row", alignItems: "center", gap: 6 },
  logoIcon:    { width: 14, height: 14, backgroundColor: COLORS.green, borderRadius: 2 },
  logoText:    { color: "#fff", fontSize: 15, fontWeight: "bold" },
  ipBtn:       { borderWidth: 1, borderColor: "rgba(0,229,117,0.3)", borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  ipBtnText:   { color: COLORS.green, fontSize: 10, fontWeight: "bold" },
  codePillWrap:{ alignItems: "center", width: "100%" },
  codePill:    { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#111215", borderWidth: 2, borderColor: "#292a30", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 40 },
  ticketDot:   { width: 16, height: 16, backgroundColor: COLORS.green, borderRadius: 3 },
  codeText:    { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: 6 },
  errorText:   { color: "#ff007f", fontSize: 12, fontWeight: "bold", marginTop: 8 },
  hint:        { color: COLORS.textSecondary, fontSize: 11, marginTop: 6 },
  keyGrid:     { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 14, maxWidth: 280 },
  key:         { width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: "#17181d", borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", justifyContent: "center", alignItems: "center" },
  keyCross:    { backgroundColor: "rgba(255,59,48,0.05)", borderColor: "rgba(255,59,48,0.1)" },
  keyOK:       { backgroundColor: "rgba(0,229,117,0.05)", borderColor: "rgba(0,229,117,0.1)" },
  keyText:     { color: "#fff", fontSize: 20, fontWeight: "700" },
  footer:      { color: COLORS.textSecondary, fontSize: 11, paddingBottom: 8, textAlign: "center" },
});

export default CodeInputScreen;
