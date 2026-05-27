/**
 * APP ROUTER
 * Single responsibility: detect whether this is a controller or console session
 * and render the correct page. All logic lives in hooks and page components.
 */

import { useEffect, useState } from "react";
import ConsolePage    from "./pages/ConsolePage";
import ControllerPage from "./pages/ControllerPage";

function App() {
  const [isWebController, setIsWebController] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isController =
      params.get("mode") === "controller" ||
      !!params.get("room") ||
      /Mobi|Android|iPhone/i.test(navigator.userAgent);

    setIsWebController(isController);
  }, []);

  return isWebController ? <ControllerPage /> : <ConsolePage />;
}

export default App;