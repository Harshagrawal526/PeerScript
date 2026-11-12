import { validationResult } from "express-validator";

// Runs after express-validator checks; short-circuits with 400 on failure
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

export default validateRequest;
