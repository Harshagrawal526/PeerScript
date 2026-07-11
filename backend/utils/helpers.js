const crypto = require('crypto');

// Generate a unique, unguessable room ID
const generateRoomId = () => crypto.randomUUID();

module.exports = {
  generateRoomId
};
