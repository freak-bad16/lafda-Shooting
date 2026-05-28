/**
 * VIEW: LandingScreen (Console)
 * TV landing hero page — shown when the console first loads.
 */

const LandingScreen = ({ onStart }) => (
  <div style={{ width: "100%", height: "100%", position: "relative" }}>

    {/* Navbar */}
    <nav className="ac-navbar">
      <div className="ac-logo">
        <div className="ac-logo-icon" />
        <span>Lafda Shooting</span>
      </div>
      <ul className="ac-nav-links">
        <li className="ac-nav-link">Hostel Wing</li>
        <li className="ac-nav-link">Tournament</li>
        <li className="ac-nav-link">FAQ</li>
        <li className="ac-nav-link">Rules</li>
      </ul>
    </nav>

    {/* Hero */}
    <div className="ac-hero-container">
      <h1 className="ac-hero-title">
        Ultimate college multiplayer lafda!
      </h1>
      <p className="ac-hero-subtitle">
        Turn any screen in your wing into a social multiplayer hub. Made for students.
      </p>
      <button className="ac-green-btn" onClick={onStart}>
        Start Lafda Now
      </button>
      <div className="ac-hero-footer-text">
        Zero hardware cost. Scan to play with your friends instantly!
      </div>
    </div>

  </div>
);

export default LandingScreen;
