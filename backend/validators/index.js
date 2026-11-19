import { body } from "express-validator";

const registerValidator = [
  body("username")
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const createRoomValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Room name must be less than 50 characters"),
];

const updateRoomValidator = [
  body("name")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Room name must be 1-50 characters"),
];

export {
  registerValidator,
  loginValidator,
  createRoomValidator,
  updateRoomValidator,
};
