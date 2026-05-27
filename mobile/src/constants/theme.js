/**
 * CONSTANTS: Mobile theme tokens
 * Single source of truth for colors, spacing, and typography used across all screens.
 */

import { StyleSheet } from "react-native";

export const COLORS = {
  bg:           "#0c0d10",
  bgCard:       "#17181d",
  bgDeep:       "#08090d",
  green:        "#00e575",
  cyan:         "#00f0ff",
  pink:         "#ff007f",
  lime:         "#39ff14",
  orange:       "#ffae00",
  textPrimary:  "#ffffff",
  textSecondary:"#9ca3af",
  border:       "rgba(255,255,255,0.06)",
  borderCard:   "rgba(255,255,255,0.04)",
};

export const PLAYER_COLORS = ["#00f0ff", "#ff007f", "#39ff14", "#ffae00"];

export const AVATAR_OPTIONS = ["☠️", "😉", "😂", "🤗", "😡", "👻", "🎓", "🔥"];

export const HOSTEL_NICKNAMES = [
  "Proxy King", "Backbencher", "Maggi Lover",
  "All Nighter", "Chai Addict", "Lab Escapee",
];

export const randomNickname = () =>
  HOSTEL_NICKNAMES[Math.floor(Math.random() * HOSTEL_NICKNAMES.length)];

// Base reusable StyleSheet tokens
export const base = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 40,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 15,
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  logoText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: COLORS.pink,
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 4,
    textAlign: "center",
  },
});
