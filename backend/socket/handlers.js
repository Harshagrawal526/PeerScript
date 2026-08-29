const Y = require('yjs');
const Room = require('../models/Room');

const LANGUAGES = ['html', 'css', 'js'];
const SAVE_DEBOUNCE_MS = 2000;

// Everything below arrives straight from a client, so none of it can be
// trusted to be a string, to be a sane length, or to be present at all.
const MAX_ROOM_ID_LENGTH = 64;
const MAX_USERNAME_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_UPDATE_BYTES = 1024 * 1024;

// One socket only ever needs the room it has open. The cap stops a client
// looping join-room over fresh ids, which would otherwise allocate a Y.Doc per
// id and grow activeRooms for as long as the connection lives.
const MAX_ROOMS_PER_SOCKET = 5;

const asRoomId = (value) =>
  typeof value === 'string' && value.length > 0 && value.length <= MAX_ROOM_ID_LENGTH
    ? value
    : null;

const asText = (value, maxLength) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
};

// socket.rooms always contains the socket's own id alongside any joined rooms.
const joinedRoomCount = (socket) => socket.rooms.size - 1;

// In-memory active rooms: roomId -> { users, usernames, ydoc, initPromise, saveTimer, dirty }
const activeRooms = new Map();

// Seed the shared doc from MongoDB the first time a room becomes active
const loadRoomIntoDoc = async (roomId, ydoc) => {
  try {
    const dbRoom = await Room.findOne({ roomId });
    if (dbRoom) {
      ydoc.transact(() => {
        LANGUAGES.forEach((language) => {
          const ytext = ydoc.getText(language);
          if (ytext.length === 0 && dbRoom.code[language]) {
            ytext.insert(0, dbRoom.code[language]);
          }
        });
      });
    }
  } catch (error) {
    console.error('Error loading room:', error);
  }
};

const ensureRoom = (roomId) => {
  if (!activeRooms.has(roomId)) {
    const ydoc = new Y.Doc();
    activeRooms.set(roomId, {
      users: new Map(),
      usernames: new Set(),
      ydoc,
      initPromise: loadRoomIntoDoc(roomId, ydoc),
      saveTimer: null,
      dirty: false
    });
  }
  return activeRooms.get(roomId);
};

const persistRoom = async (roomId) => {
  const room = activeRooms.get(roomId);
  if (!room || !room.dirty) return;

  const code = {};
  LANGUAGES.forEach((language) => {
    code[language] = room.ydoc.getText(language).toString();
  });

  try {
    await Room.findOneAndUpdate(
      { roomId },
      { code, lastModified: Date.now() },
      { upsert: true, new: true }
    );
    room.dirty = false;
  } catch (error) {
    console.error('Error saving to database:', error);
  }
};

const schedulePersist = (roomId) => {
  const room = activeRooms.get(roomId);
  if (!room) return;
  if (room.saveTimer) clearTimeout(room.saveTimer);
  room.saveTimer = setTimeout(() => {
    room.saveTimer = null;
    persistRoom(roomId);
  }, SAVE_DEBOUNCE_MS);
};

// Private rooms are only accessible to their creator; rooms not in the DB
// (anonymous quick-rooms) are treated as public. Fails closed on DB errors.
const canAccessRoom = async (roomId, socket) => {
  try {
    const dbRoom = await Room.findOne({ roomId }).select('isPublic creator');
    if (!dbRoom || dbRoom.isPublic) return true;
    return !!(socket.user && dbRoom.creator && dbRoom.creator.toString() === socket.user.id);
  } catch (error) {
    console.error('Error checking room access:', error);
    return false;
  }
};

const handleJoinRoom = (io, socket) => async (rawRoomId) => {
  const roomId = asRoomId(rawRoomId);
  if (!roomId) return;

  if (!socket.rooms.has(roomId) && joinedRoomCount(socket) >= MAX_ROOMS_PER_SOCKET) return;

  if (!(await canAccessRoom(roomId, socket))) {
    socket.emit('room-access-denied');
    return;
  }

  socket.join(roomId);

  const activeRoom = ensureRoom(roomId);
  const username = socket.user ? socket.user.username : null;

  activeRoom.users.set(socket.id, { username });

  if (username) {
    activeRoom.usernames.add(username);
    socket.emit('username-auto-set', { username });
    socket.to(roomId).emit('user-joined-chat', { username });
  }

  console.log(`User ${socket.id} joined room ${roomId} (${activeRoom.users.size} users)`);

  io.to(roomId).emit('users-in-room', activeRoom.users.size);
};

// Client asks for the current doc state; reply with a full Yjs update.
// Joins the socket.io room before encoding so no update is missed in between.
const handleYjsRequestSync = (io, socket) => async (rawRoomId) => {
  const roomId = asRoomId(rawRoomId);
  if (!roomId) return;

  if (!socket.rooms.has(roomId) && joinedRoomCount(socket) >= MAX_ROOMS_PER_SOCKET) return;

  if (!(await canAccessRoom(roomId, socket))) {
    socket.emit('room-access-denied');
    return;
  }

  socket.join(roomId);
  const room = ensureRoom(roomId);
  await room.initPromise;
  socket.emit('yjs-sync', Y.encodeStateAsUpdate(room.ydoc));
};

const handleYjsUpdate = (io, socket) => async ({ roomId, update }) => {
  // Only sockets that passed the join gate may write
  if (!socket.rooms.has(roomId)) return;

  const room = activeRooms.get(roomId);
  if (!room || !update) return;

  // Reject oversized payloads before allocating a typed array for them
  const size = update.byteLength ?? update.length;
  if (typeof size !== 'number' || size > MAX_UPDATE_BYTES) return;

  await room.initPromise;

  try {
    Y.applyUpdate(room.ydoc, new Uint8Array(update));
  } catch (error) {
    console.error('Invalid Yjs update:', error.message);
    return;
  }

  socket.to(roomId).emit('yjs-update', update);
  room.dirty = true;
  schedulePersist(roomId);
};

// Cursor/selection presence: pure relay, clients own the awareness protocol
const handleYjsAwareness = (io, socket) => ({ roomId, update }) => {
  if (!update || !socket.rooms.has(roomId)) return;
  socket.to(roomId).emit('yjs-awareness', update);
};

const handleSetUsername = (io, socket) => ({ roomId, username: rawUsername }) => {
  const username = asText(rawUsername, MAX_USERNAME_LENGTH);
  if (!username || !socket.rooms.has(roomId)) return;

  if (activeRooms.has(roomId)) {
    const room = activeRooms.get(roomId);

    if (room.usernames.has(username)) {
      socket.emit('username-taken');
      return;
    }

    const user = room.users.get(socket.id);

    if (user) {
      if (user.username) {
        room.usernames.delete(user.username);
      }

      user.username = username;
      room.usernames.add(username);
      socket.emit('username-accepted');
      socket.to(roomId).emit('user-joined-chat', { username });
    }
  }
};

const handleSendMessage = (io, socket) => ({ roomId, message: rawMessage }) => {
  const message = asText(rawMessage, MAX_MESSAGE_LENGTH);
  if (!message || !socket.rooms.has(roomId)) return;

  if (activeRooms.has(roomId)) {
    const room = activeRooms.get(roomId);
    const user = room.users.get(socket.id);

    if (user && user.username) {
      const messageData = {
        username: user.username,
        message,
        timestamp: Date.now(),
        socketId: socket.id
      };

      io.to(roomId).emit('chat-message', messageData);
    }
  }
};

const handleLeaveRoom = (io, socket) => (roomId) => {
  handleUserLeave(io, socket.id, roomId);
};

const handleDisconnect = (io, socket) => () => {
  activeRooms.forEach((room, roomId) => {
    if (room.users.has(socket.id)) {
      handleUserLeave(io, socket.id, roomId);
    }
  });
};

const handleUserLeave = (io, socketId, roomId) => {
  if (activeRooms.has(roomId)) {
    const room = activeRooms.get(roomId);
    const user = room.users.get(socketId);

    if (user && user.username) {
      room.usernames.delete(user.username);
      io.to(roomId).emit('user-left-chat', { username: user.username });
    }

    room.users.delete(socketId);
    const usersInRoom = room.users.size;

    console.log(`User ${socketId} left room ${roomId} (${usersInRoom} users remaining)`);

    if (usersInRoom === 0) {
      if (room.saveTimer) {
        clearTimeout(room.saveTimer);
        room.saveTimer = null;
      }
      // Save final state, then drop the doc unless someone rejoined meanwhile
      persistRoom(roomId).finally(() => {
        const current = activeRooms.get(roomId);
        if (current && current.users.size === 0) {
          current.ydoc.destroy();
          activeRooms.delete(roomId);
        }
      });
    } else {
      io.to(roomId).emit('users-in-room', usersInRoom);
    }
  }
};

module.exports = {
  handleJoinRoom,
  handleLeaveRoom,
  handleDisconnect,
  handleSetUsername,
  handleSendMessage,
  handleYjsRequestSync,
  handleYjsUpdate,
  handleYjsAwareness,
  activeRooms
};
