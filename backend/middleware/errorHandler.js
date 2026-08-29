// Central error handler. Express 5 forwards rejected promises from async
// route handlers here automatically, so controllers don't need try/catch.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Two simultaneous registrations both pass the existence check; the loser
  // hits the unique index. That is the client's situation, not a server fault.
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({
      success: false,
      message: field ? `That ${field} is already taken` : 'Already exists'
    });
  }

  // Schema rules the request validators do not cover.
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors).map((detail) => detail.message).join(', ')
    });
  }

  // A malformed id in the path, e.g. an ObjectId that isn't one.
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid identifier' });
  }

  console.error(`${req.method} ${req.originalUrl} failed:`, err);
  res.status(500).json({
    success: false,
    message: 'Server error'
  });
};

module.exports = errorHandler;
