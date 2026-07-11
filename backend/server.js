const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
require('dotenv').config();

const socketAuthMiddleware = require('./middleware/socketAuth');

const {
  handleJoinRoom,
  handleLeaveRoom,
  handleDisconnect,
  handleSetUsername,
  handleSendMessage,
  handleYjsRequestSync,
  handleYjsUpdate,
  handleYjsAwareness
} = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

// Comma-separated list, e.g. "http://localhost:5173,https://peer-script.vercel.app"
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Render terminates TLS at a proxy; required for rate limiting to see real client IPs
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limit on credential endpoints to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' }
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check route
app.get('/', (req, res) => {
  res.json({
    message: 'PeerScript Backend is running!',
    version: '4.0.0',
    status: 'healthy'
  });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));

// Socket authentication middleware
io.use(socketAuthMiddleware);

// Socket.io connection handling
io.on('connection', (socket) => {
  socket.on('join-room', handleJoinRoom(io, socket));
  socket.on('leave-room', handleLeaveRoom(io, socket));
  socket.on('yjs-request-sync', handleYjsRequestSync(io, socket));
  socket.on('yjs-update', handleYjsUpdate(io, socket));
  socket.on('yjs-awareness', handleYjsAwareness(io, socket));
  socket.on('set-username', handleSetUsername(io, socket));
  socket.on('send-message', handleSendMessage(io, socket));
  socket.on('disconnect', handleDisconnect(io, socket));
});

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
