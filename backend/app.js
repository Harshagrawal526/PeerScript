import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";
import errorHandler from "./middleware/errorHandler.js";
import { expressCorsOptions } from "./config/cors.js";

const app = express();


// Render terminates TLS at a proxy; required for rate limiting to see real client IPs
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors(expressCorsOptions));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit on credential endpoints to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts, please try again later",
  },
});

app.use("/api", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.get("/", (req, res) => {
  res.json({
    message: "PeerScript Backend is running!",
    version: "4.0.0",
    status: "healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use(errorHandler);

export default app;
