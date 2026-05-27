/**
 * MODEL: Room
 * Represents an active game room on the Lafda Shooting server.
 */
const createRoom = (consoleId) => ({
  consoleId,
  players: []
});

export default createRoom;
