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

router.get('/my-rooms', protect, getMyRooms);

router.get('/:roomId', optionalAuth, getRoom);

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

router.delete('/:roomId', protect, deleteRoom);

module.exports = router;
