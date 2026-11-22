import jwt from "jsonwebtoken";
import User from "../models/User.js";

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("username email");

    if (!user) {
      return next(new Error("Authentication required"));
    }

    socket.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
    };

    next();
  } catch (error) {
    return next(new Error("Authentication required"));
  }
};

export default socketAuthMiddleware;
