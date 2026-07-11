// Central error handler. Express 5 forwards rejected promises from async
// route handlers here automatically, so controllers don't need try/catch.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(`${req.method} ${req.originalUrl} failed:`, err);
  res.status(500).json({
    success: false,
    message: 'Server error'
  });
};

module.exports = errorHandler;
