/**
 * COMPONENT: CircularKeypad (Shared)
 * Circular numeric keypad (0–9) with ✕ delete and ✓ confirm buttons.
 * Props:
 *   onKey(val)  — called with "0"–"9", "X" (delete), or "OK" (confirm)
 */

const CircularKeypad = ({ onKey }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px 24px",
        maxWidth: "280px",
        margin: "0 auto",
      }}
    >
      {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
        <button key={k} className="wc-key-circle" onClick={() => onKey(k)}>
          {k}
        </button>
      ))}

      <button className="wc-key-circle wc-key-cross" onClick={() => onKey("X")}>
        ✕
      </button>
      <button className="wc-key-circle" onClick={() => onKey("0")}>
        0
      </button>
      <button className="wc-key-circle wc-key-checkmark" onClick={() => onKey("OK")}>
        ✓
      </button>
    </div>
  );
};

export default CircularKeypad;
