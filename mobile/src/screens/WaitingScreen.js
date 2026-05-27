/**
 * SCREEN: WaitingScreen (Mobile)
 * Lobby waiting room — player avatar, editable name, room code, start trigger.
 */

import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

const WaitingScreen = ({ playerName, playerColor, roomCode, onNameChange, onYesStart }) => (
  <View style={styles.screen}>

    {/* Logo */}
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <View style={styles.logoIcon} />
        <Text style={styles.logoText}>Lafda Shooting</Text>
      </View>
    </View>

    {/* Giant avatar bubble */}
    <View style={styles.avatarWrap}>
      <View style={[styles.avatar, { backgroundColor: playerColor, shadowColor: playerColor }]}>
        <Text style={styles.avatarLetter}>
          {playerName ? playerName.trim().slice(0, 1).toUpperCase() : "P"}
        </Text>
      </View>
      <TextInput
        value={playerName}
        onChangeText={onNameChange}
        maxLength={14}
        style={styles.nameInput}
        placeholderTextColor="#484d6b"
      />
      <Text style={styles.nameHint}>✏ Tap to change nickname</Text>
    </View>

    {/* Status */}
    <View style={styles.statusWrap}>
      <Text style={styles.statusTitle}>Sab aagaye kya? 🤔</Text>
      <Text style={styles.statusRoom}>Room Wing: {roomCode}</Text>
    </View>

    {/* Start trigger */}
    <View style={styles.startWrap}>
      <Text style={styles.startHint}>Has everyone joined?</Text>
      <TouchableOpacity style={styles.startBtn} onPress={onYesStart} activeOpacity={0.8}>
        <Text style={styles.startBtnText}>Chalo Shuru Karein! 🎮</Text>
      </TouchableOpacity>
    </View>

  </View>
);

const styles = StyleSheet.create({
  screen:      { flex: 1, paddingHorizontal: 24, paddingVertical: 16, justifyContent: "space-between", alignItems: "center" },
  header:      { width: "100%", alignItems: "center" },
  logoRow:     { flexDirection: "row", alignItems: "center", gap: 6 },
  logoIcon:    { width: 14, height: 14, backgroundColor: COLORS.green, borderRadius: 2 },
  logoText:    { color: "#fff", fontSize: 15, fontWeight: "bold" },
  avatarWrap:  { alignItems: "center" },
  avatar:      { width: 140, height: 140, borderRadius: 70, justifyContent: "center", alignItems: "center", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 },
  avatarLetter:{ color: "#fff", fontSize: 60, fontWeight: "800" },
  nameInput:   { backgroundColor: "transparent", borderBottomWidth: 1.5, borderColor: "rgba(255,255,255,0.15)", color: "#fff", fontWeight: "700", fontSize: 22, textAlign: "center", marginTop: 16, width: 180 },
  nameHint:    { color: COLORS.textSecondary, fontSize: 11, marginTop: 6 },
  statusWrap:  { alignItems: "center" },
  statusTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  statusRoom:  { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  startWrap:   { width: "100%", alignItems: "center", paddingBottom: 8 },
  startHint:   { color: COLORS.textSecondary, fontSize: 12, marginBottom: 10 },
  startBtn:    { width: "100%", backgroundColor: COLORS.green, borderRadius: 30, paddingVertical: 15, alignItems: "center" },
  startBtnText:{ color: "#0c0d10", fontWeight: "700", fontSize: 15 },
});

export default WaitingScreen;
