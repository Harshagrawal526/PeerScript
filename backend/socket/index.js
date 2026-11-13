import { Server } from "socket.io";
import { socketCorsOptions } from "../config/cors.js";
import socketAuthMiddleware from "../middleware/socketAuth.js";
import {
  handleJoinRoom,
  handleLeaveRoom,
  handleDisconnect,
  handleSetUsername,
  handleSendMessage,
  handleYjsRequestSync,
  handleYjsUpdate,
  handleYjsAwareness,
} from "./handlers.js";

// Async listener rejections crash Node; one room's failure shouldn't kill the server
const guard =
  (handler) =>
  async (...args) => {
    try {
      await handler(...args);
    } catch (error) {
      console.error("Socket handler error:", error);
    }
  };

export default function initSocket(server) {
  const io = new Server(server, { cors: socketCorsOptions });

  io.use(socketAuthMiddleware);

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

  return io;
}
