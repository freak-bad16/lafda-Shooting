/**
 * SCREEN: SplashScreen (Mobile)
 * Transition animation shown after arcade starts.
 */

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";

const SplashScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.connected}>CONNECTED — ENJOY YOUR EXPERIENCE</Text>
    <Text style={styles.brand}>Lafda Shooting</Text>
    <ActivityIndicator size="large" color={COLORS.green} style={{ marginTop: 24 }} />
  </View>
);

const styles = StyleSheet.create({
  screen:    { flex: 1, backgroundColor: COLORS.bgDeep, justifyContent: "center", alignItems: "center", padding: 30 },
  connected: { color: COLORS.cyan, fontSize: 13, fontWeight: "bold", letterSpacing: 2, textAlign: "center", marginBottom: 12 },
  brand:     { color: "#fff", fontSize: 30, fontWeight: "900", letterSpacing: 4 },
});

export default SplashScreen;
