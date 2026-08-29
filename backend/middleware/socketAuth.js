const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      socket.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('username email');

    if (!user) {
      socket.user = null;
      return next();
    }

    socket.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    console.error('Socket auth error:', error.message);
    // A bad token means anonymous, not rejected: rooms may be public.
    socket.user = null;
    next();
  }
};

module.exports = socketAuthMiddleware;