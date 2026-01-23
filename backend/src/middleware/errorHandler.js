/**
 * Global Error Handler Middleware
 *
 * Catches and formats all errors in a consistent format.
 */

const logger = require('../logger');
const config = require('../config');

/**
 * Error handler middleware
 * @param {Error} err Error object
 * @param {Request} req Express request
 * @param {Response} res Express response
 * @param {Function} next Express next function
 */
function errorHandler(err, req, res, next) {
  // Log error
  logger.error('Request error', {
    error: err.message,
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
    method: req.method,
    path: req.path,
    ip: req.ip
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Build error response
  const errorResponse = {
    error: err.name || 'Error',
    message: err.message || 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;
