/**
 * COMPONENT: PlayerAvatar (Shared)
 * Circular player initial bubble.
 * Props: name, color, size (px, default 48)
 */

const PlayerAvatar = ({ name, color, size = 48 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: color || "#00f0ff",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: size * 0.4,
      fontWeight: 800,
      color: "#ffffff",
      boxShadow: `0 4px 18px ${color}55`,
      flexShrink: 0,
    }}
  >
    {name ? name.trim().slice(0, 1).toUpperCase() : "P"}
  </div>
);

export default PlayerAvatar;
