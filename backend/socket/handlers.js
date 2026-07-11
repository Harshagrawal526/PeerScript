const Room = require('../models/Room');

// In-memory active rooms
const activeRooms = new Map();

const handleJoinRoom = (io, socket) => async (roomId) => {
  socket.join(roomId);

  if (!activeRooms.has(roomId)) {
    activeRooms.set(roomId, {
      users: new Map(),
      usernames: new Set(),
      code: { html: '', css: '', js: '' }
    });
  }

  const activeRoom = activeRooms.get(roomId);
  
  const username = socket.user ? socket.user.username : null;
  
  activeRoom.users.set(socket.id, { username });
  
  if (username) {
    activeRoom.usernames.add(username);
    socket.emit('username-auto-set', { username });
    socket.to(roomId).emit('user-joined-chat', { username });
  }

  console.log(`User ${socket.id} joined room ${roomId} (${activeRoom.users.size} users)`);

  try {
    const dbRoom = await Room.findOne({ roomId });
    if (dbRoom) {
      activeRoom.code = dbRoom.code;
    }
  } catch (error) {
    console.error('Error loading room:', error);
  }

  socket.emit('load-code', activeRoom.code);
  io.to(roomId).emit('users-in-room', activeRoom.users.size);
};

const handleSetUsername = (io, socket) => ({ roomId, username }) => {
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

const handleSendMessage = (io, socket) => ({ roomId, message }) => {
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

const EDITABLE_LANGUAGES = ['html', 'css', 'js'];

const handleCodeChange = (io, socket) => async ({ roomId, language, code }) => {
  // Reject arbitrary keys so clients can't write outside the three code fields
  if (!EDITABLE_LANGUAGES.includes(language) || typeof code !== 'string') {
    return;
  }

  if (activeRooms.has(roomId)) {
    const activeRoom = activeRooms.get(roomId);
    activeRoom.code[language] = code;

    // socket.to() excludes the sender, so authors don't receive their own edits back
    socket.to(roomId).emit('code-update', { language, code });

    try {
      await Room.findOneAndUpdate(
        { roomId },
        { 
          code: activeRoom.code,
          lastModified: Date.now()
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  }
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
      activeRooms.delete(roomId);
    } else {
      io.to(roomId).emit('users-in-room', usersInRoom);
    }
  }
};

module.exports = {
  handleJoinRoom,
  handleLeaveRoom,
  handleCodeChange,
  handleDisconnect,
  handleSetUsername,
  handleSendMessage,
  activeRooms
};