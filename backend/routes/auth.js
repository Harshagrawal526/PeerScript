import express from "express";
import { requireAuth } from "../middleware/auth.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/authController.js";
import { loginValidator, registerValidator } from "../validators/index.js";

const router = express.Router();

router.post("/register", registerValidator, validateRequest, register);

router.post("/login", loginValidator, validateRequest, login);

router.get("/me", requireAuth, getMe);
router.post("/logout", logout);

export default router;
