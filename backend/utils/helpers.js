import crypto from 'node:crypto';

// Generate a unique, unguessable room ID
const generateRoomId = () => crypto.randomUUID();

export {
  generateRoomId
};
