import express from "express";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  createRoomValidator,
  updateRoomValidator,
} from "../validators/index.js";
import {
  createRoom,
  getMyRooms,
  getRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController.js";

const router = express.Router();

router.post("/", requireAuth, createRoomValidator, validateRequest, createRoom);

router.get("/my-rooms", requireAuth, getMyRooms);

router.get("/:roomId", optionalAuth, getRoom);

router.put(
  "/:roomId",
  requireAuth,
  updateRoomValidator,
  validateRequest,
  updateRoom,
);

router.delete("/:roomId", requireAuth, deleteRoom);

export default router;
