const Room = require('../models/Room');
const { generateRoomId } = require('../utils/helpers');

const nextUntitledName = async (creatorId) => {
  const untitledRooms = await Room.find({
    creator: creatorId,
    name: { $regex: /^Untitled Project( \d+)?$/i }
  }).select('name');

  let maxNumber = 0;
  untitledRooms.forEach(room => {
    if (room.name === 'Untitled Project') {
      maxNumber = Math.max(maxNumber, 1);
    } else {
      const match = room.name.match(/^Untitled Project (\d+)$/i);
      if (match) {
        maxNumber = Math.max(maxNumber, parseInt(match[1]));
      }
    }
  });

  return `Untitled Project ${maxNumber + 1}`;
};

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
exports.createRoom = async (req, res) => {
  const roomId = generateRoomId();
  let { name, isPublic = true } = req.body;

  if (!name || name.trim() === '' || name === 'Untitled Project') {
    name = await nextUntitledName(req.user.id);
  }

  const room = await Room.create({
    roomId,
    name,
    creator: req.user.id,
    isPublic,
    code: { html: '', css: '', js: '' }
  });

  res.status(201).json({
    success: true,
    room: {
      id: room._id,
      roomId: room.roomId,
      name: room.name,
      isPublic: room.isPublic,
      createdAt: room.createdAt
    }
  });
};

// @route   GET /api/rooms/my-rooms
// @desc    Get current user's rooms
// @access  Private
exports.getMyRooms = async (req, res) => {
  const rooms = await Room.find({ creator: req.user.id })
    .select('roomId name isPublic lastModified createdAt')
    .sort({ lastModified: -1 });

  res.json({ success: true, rooms });
};

// @route   GET /api/rooms/:roomId
// @desc    Get room details
// @access  Public (with optional auth)
exports.getRoom = async (req, res) => {
  const room = await Room.findOne({ roomId: req.params.roomId })
    .populate('creator', 'username');

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found'
    });
  }

  if (!room.isPublic && (!req.user || room.creator._id.toString() !== req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'This room is private'
    });
  }

  res.json({
    success: true,
    room: {
      id: room._id,
      roomId: room.roomId,
      name: room.name,
      isPublic: room.isPublic,
      creator: room.creator,
      code: room.code,
      lastModified: room.lastModified,
      createdAt: room.createdAt
    }
  });
};

// @route   PUT /api/rooms/:roomId
// @desc    Update room name
// @access  Private (creator only)
exports.updateRoom = async (req, res) => {
  const room = await Room.findOne({ roomId: req.params.roomId });

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found'
    });
  }

  if (room.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this room'
    });
  }

  room.name = req.body.name;
  await room.save();

  res.json({
    success: true,
    room: {
      id: room._id,
      roomId: room.roomId,
      name: room.name
    }
  });
};

// @route   DELETE /api/rooms/:roomId
// @desc    Delete a room
// @access  Private (creator only)
exports.deleteRoom = async (req, res) => {
  const room = await Room.findOne({ roomId: req.params.roomId });

  if (!room) {
    return res.status(404).json({
      success: false,
      message: 'Room not found'
    });
  }

  if (room.creator.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this room'
    });
  }

  await room.deleteOne();

  res.json({
    success: true,
    message: 'Room deleted successfully'
  });
};
