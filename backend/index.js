import http from "node:http";
import { Server } from "socket.io";
import "dotenv/config";

import app from "./app.js";
import socketAuthMiddleware from "./middleware/socketAuth.js";
import {
  handleJoinRoom,
  handleLeaveRoom,
  handleDisconnect,
  handleSetUsername,
  handleSendMessage,
  handleYjsRequestSync,
  handleYjsUpdate,
  handleYjsAwareness,
} from "./socket/handlers.js";
import connectDB from "./db/index.js";

const server = http.createServer(app);
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

// Socket.io does not catch rejections from async listeners, and Node exits on
// an unhandled one. A failure in one room must not take down the server.
const guard =
  (handler) =>
  async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error("Socket handler error:", error);
    }
  };

io.on("connection", (socket) => {
  socket.on("join-room", guard(handleJoinRoom(io, socket)));
  socket.on("leave-room", guard(handleLeaveRoom(io, socket)));
  socket.on("yjs-request-sync", guard(handleYjsRequestSync(io, socket)));
  socket.on("yjs-update", guard(handleYjsUpdate(io, socket)));
  socket.on("yjs-awareness", guard(handleYjsAwareness(io, socket)));
  socket.on("set-username", guard(handleSetUsername(io, socket)));
  socket.on("send-message", guard(handleSendMessage(io, socket)));
  socket.on("disconnect", guard(handleDisconnect(io, socket)));
});

const PORT = process.env.PORT || 3001;

await connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
