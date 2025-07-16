let io = null;

function setSocketIO(ioInstance) {
  io = ioInstance;
}

function getSocketIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

module.exports = {
  setSocketIO,
  getSocketIO,
};
