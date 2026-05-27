/**
 * VIEW: SplashScreen (Shared)
 * Transition splash shown after arcade starts.
 */

const SplashScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", alignItems: "center", height: "100%" }}>
    <h3 style={{ fontSize: "12px", fontWeight: "bold", color: "#00e575", letterSpacing: "2px", marginBottom: "10px" }}>
      CONNECTED — ENJOY YOUR EXPERIENCE
    </h3>
    <h1 style={{ fontSize: "28px", fontWeight: "900", letterSpacing: "3px", color: "#fff" }}>
      Lafda Shooting
    </h1>
    <div style={{ marginTop: "24px", width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #00e575", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
  </div>
);

export default SplashScreen;
