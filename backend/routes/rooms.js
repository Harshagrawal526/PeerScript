import express from "express";
import { body } from "express-validator";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  createRoom,
  getMyRooms,
  getRoom,
  updateRoom,
  deleteRoom,
} from "../controllers/roomController.js";

const router = express.Router();

router.post(
  "/",
  requireAuth,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("Room name must be less than 50 characters"),
  ],
  validateRequest,
  createRoom,
);

router.get("/my-rooms", requireAuth, getMyRooms);

router.get("/:roomId", optionalAuth, getRoom);

router.put(
  "/:roomId",
  requireAuth,
  [
    body("name")
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage("Room name must be 1-50 characters"),
  ],
  validateRequest,
  updateRoom,
);

router.delete("/:roomId", requireAuth, deleteRoom);

export default router;
