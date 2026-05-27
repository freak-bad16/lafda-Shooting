/**
 * CONSTANTS: player config
 * Shared avatar options, player colors, and hostel nicknames.
 */

export const AVATAR_OPTIONS = ["☠️", "😉", "😂", "🤗", "😡", "👻", "🎓", "🔥"];

export const PLAYER_COLORS = ["#00f0ff", "#ff007f", "#39ff14", "#ffae00"];

export const HOSTEL_NICKNAMES = [
  "Proxy King",
  "Backbencher",
  "Maggi Lover",
  "All Nighter",
  "Chai Addict",
  "Lab Escapee",
];

export const randomNickname = () =>
  HOSTEL_NICKNAMES[Math.floor(Math.random() * HOSTEL_NICKNAMES.length)];
