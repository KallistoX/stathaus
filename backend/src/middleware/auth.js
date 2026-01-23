/**
 * Authentication Middleware
 *
 * Validates OAuth2/OIDC access tokens for protected routes.
 */

const logger = require('../logger');
const { validateToken } = require('../services/tokenService');

/**
 * Authentication middleware
 * Validates Bearer token and adds user info to request
 *
 * @param {Request} req Express request
 * @param {Response} res Express response
 * @param {Function} next Express next function
 */
async function requireAuth(req, res, next) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No access token provided'
      });
    }

    // Validate token and get user info
    const user = await validateToken(token);

    // Add user info to request object
    req.user = user;

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid or expired access token'
    });
  }
}

/**
 * Optional authentication middleware
 * Like requireAuth but doesn't fail if no token is present
 *
 * @param {Request} req Express request
 * @param {Response} res Express response
 * @param {Function} next Express next function
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token) {
        const user = await validateToken(token);
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Token validation failed, but that's okay for optional auth
    logger.debug('Optional auth failed', { error: error.message });
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth
};
