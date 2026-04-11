const { isProd } = require('../config/security.config');

const notFoundHandler = (req, res) => {
  return res.status(404).json({
    error: 'Route not found',
    requestId: req.requestId
  });
};

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const publicMessage = statusCode >= 500 ? 'Internal server error' : err.message;

  return res.status(statusCode).json({
    error: publicMessage,
    requestId: req.requestId,
    ...(isProd ? {} : { details: err.message })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
