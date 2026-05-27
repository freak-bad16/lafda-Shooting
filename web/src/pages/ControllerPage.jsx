/**
 * PAGE: ControllerPage
 * Assembles all controller screens using the useController hook.
 * This is the View for the phone/browser controller.
 */

import useController from "../hooks/useController";
import CodeInputScreen  from "../components/controller/CodeInputScreen";
import WaitingScreen    from "../components/controller/WaitingScreen";
import GamepadScreen    from "../components/controller/GamepadScreen";
import SplashScreen     from "../components/controller/SplashScreen";

const ControllerPage = () => {
  const ctrl = useController();

  return (
    <div className="wc-container">
      <div className="scanline-light" />

      {ctrl.phase === "input" && (
        <CodeInputScreen
          roomCode={ctrl.controllerRoom}
          error={ctrl.controllerError}
          serverIP="(auto)"
          onKey={ctrl.handleKeyPress}
          onSettingsPress={() => {}}
        />
      )}

      {ctrl.phase === "waiting" && (
        <WaitingScreen
          playerName={ctrl.playerName}
          playerColor={ctrl.playerColor}
          roomCode={ctrl.controllerRoom}
          onNameChange={ctrl.handleNameChange}
          onYesStart={ctrl.handleYesStart}
        />
      )}

      {ctrl.phase === "splash" && <SplashScreen />}

      {ctrl.phase === "gamepad" && (
        <GamepadScreen
          playerName={ctrl.playerName}
          playerColor={ctrl.playerColor}
          roomCode={ctrl.controllerRoom}
          activeScreen={ctrl.activeScreen}
          privatePayload={ctrl.privatePayload}
          showSecret={ctrl.showSecret}
          setShowSecret={ctrl.setShowSecret}
          onInput={ctrl.sendInput}
          onEditNickname={() => ctrl.setPhase("waiting")}
          onExit={() => {
            // Reset local controller back to input phase
            ctrl.setPhase("input");
          }}
        />
      )}
    </div>
  );
};

export default ControllerPage;
