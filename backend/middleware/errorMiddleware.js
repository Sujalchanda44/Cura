/**
 * Centralized Error & 404 Handling Middleware
 */

const ResponseHandler = require('../utils/responseHandler');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

const notFoundHandler = (req, res) => {
  return ResponseHandler.error(
    res,
    `Route ${req.method} ${req.originalUrl} not found on this server.`,
    HTTP_STATUS.NOT_FOUND
  );
};

const errorHandler = (err, req, res, next) => {
  logger.error(`[Unhandled Error] ${err.message}`, err.stack);

  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'An unexpected internal server error occurred.';

  return ResponseHandler.error(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

module.exports = {
  notFoundHandler,
  errorHandler
};
