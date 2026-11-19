import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const production = process.env.NODE_ENV === "production";
const options = {
  httpOnly: true,
  secure: production,
  sameSite: production ? "none" : "strict",
  maxAge: Number(process.env.JWT_COOKIE_MAX_AGE) || 7 * 24 * 60 * 60 * 1000,
};

export const logout = (_req, res) => {
  res.clearCookie("token", options);
  res.json({ success: true });
};

// POST /api/auth/register
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  let user = await User.findOne({ $or: [{ email }, { username }] });

  if (user) {
    return res.status(400).json({
      success: false,
      message:
        user.email === email
          ? "Email already registered"
          : "Username already taken",
    });
  }

  user = await User.create({ username, email, password });

  const token = generateToken(user._id);
  res.cookie("token", token, options);

  res.status(201).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  const isMatch = await user?.comparePassword(password);

  if (!user || !isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  const token = generateToken(user._id);
  res.cookie("token", token, options);

  res.json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
};

// GET /api/auth/me
// requireAuth loads the user from the HttpOnly cookie. Return the token in
// memory for the frontend's Socket.IO authentication; HTTP requests use the cookie.
export const getMe = async (req, res) => {
  res.json({
    success: true,
    token: req.cookies.token,
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
    },
  });
};
