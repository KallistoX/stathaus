/**
 * Rate Limiting Middleware
 *
 * Protects API from abuse by limiting request rate per IP.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../logger');

/**
 * Create rate limiter middleware
 */
const rateLimiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    res.status(429).json({
      error: 'TooManyRequests',
      message: 'Too many requests from this IP, please try again later'
    });
  }
});

module.exports = rateLimiter;
