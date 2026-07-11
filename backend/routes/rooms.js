const express = require('express');
const { body } = require('express-validator');
const { protect, optionalAuth } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  createRoom,
  getMyRooms,
  getRoom,
  updateRoom,
  deleteRoom
} = require('../controllers/roomController');

const router = express.Router();

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
router.post(
  '/',
  protect,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Room name must be less than 50 characters')
  ],
  validateRequest,
  createRoom
);

// @route   GET /api/rooms/my-rooms
// @desc    Get current user's rooms
// @access  Private
router.get('/my-rooms', protect, getMyRooms);

// @route   GET /api/rooms/:roomId
// @desc    Get room details
// @access  Public (with optional auth)
router.get('/:roomId', optionalAuth, getRoom);

// @route   PUT /api/rooms/:roomId
// @desc    Update room name
// @access  Private (creator only)
router.put(
  '/:roomId',
  protect,
  [
    body('name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Room name must be 1-50 characters')
  ],
  validateRequest,
  updateRoom
);

// @route   DELETE /api/rooms/:roomId
// @desc    Delete a room
// @access  Private (creator only)
router.delete('/:roomId', protect, deleteRoom);

module.exports = router;
