const Y = require('yjs');
const Room = require('../models/Room');

const LANGUAGES = ['html', 'css', 'js'];
const SAVE_DEBOUNCE_MS = 2000;

// Client-supplied values: not necessarily strings, bounded, or present.
const MAX_ROOM_ID_LENGTH = 64;
const MAX_USERNAME_LENGTH = 20;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_UPDATE_BYTES = 1024 * 1024;

// join-room allocates a Y.Doc per unseen id, so without a cap a client could
// loop over fresh ids and grow activeRooms for as long as it stays connected.
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

// roomId -> room state; see ensureRoom for the shape
const activeRooms = new Map();

// Seeds the shared doc from MongoDB. Reports whether the read succeeded: a doc
// empty because the room is new and one empty because the read failed look the
// same afterwards, and only the first is safe to save.
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
    return true;
  } catch (error) {
    console.error('Error loading room:', error);
    return false;
  }
};

const startLoad = (room, roomId) => {
  room.initPromise = loadRoomIntoDoc(roomId, room.ydoc).then((loaded) => {
    room.loaded = loaded;
  });
  return room.initPromise;
};

const ensureRoom = (roomId) => {
  if (!activeRooms.has(roomId)) {
    const room = {
      users: new Map(),
      usernames: new Set(),
      ydoc: new Y.Doc(),
      loaded: false,
      initPromise: null,
      saveTimer: null,
      dirty: false
    };
    startLoad(room, roomId);
    activeRooms.set(roomId, room);
  }
  return activeRooms.get(roomId);
};

// Retries once, so a transient read error does not strand the room empty.
const ensureLoaded = async (roomId) => {
  const room = activeRooms.get(roomId);
  if (!room) return false;

  await room.initPromise;
  if (!room.loaded) await startLoad(room, roomId);

  return room.loaded;
};

const persistRoom = async (roomId) => {
  const room = activeRooms.get(roomId);
  if (!room || !room.dirty) return;

  // The load failed, so this doc is empty for the wrong reason and the upsert
  // below would replace the room's saved code with nothing.
  if (!room.loaded) return;

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

  if (!(await ensureLoaded(roomId))) {
    socket.emit('room-unavailable');
    return;
  }

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
