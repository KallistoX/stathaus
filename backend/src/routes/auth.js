/**
 * Authentication Routes
 *
 * Handles OAuth2/OIDC token operations.
 */

const express = require('express');
const { exchangeCode, refreshAccessToken, validateToken } = require('../services/tokenService');
const { getProviderInfo } = require('../oauth');
const { requireAuth } = require('../middleware/auth');
const { validate, tokenExchangeSchema } = require('../utils/validation');
const { BadRequestError } = require('../utils/errors');

const router = express.Router();

/**
 * Get OAuth provider configuration
 * GET /api/auth/config
 */
router.get('/config', (req, res) => {
  try {
    const providerInfo = getProviderInfo();
    res.json(providerInfo);
  } catch (error) {
    res.status(500).json({
      error: 'ConfigurationError',
      message: 'Failed to get OAuth configuration'
    });
  }
});

/**
 * Exchange authorization code for tokens
 * POST /api/auth/token
 * Body: { code, code_verifier }
 */
router.post('/token', async (req, res, next) => {
  try {
    // Validate request body
    const validation = validate(req.body, tokenExchangeSchema);
    if (!validation.valid) {
      throw new BadRequestError(JSON.stringify(validation.errors));
    }

    const { code, code_verifier } = validation.value;

    // Exchange code for tokens
    const tokens = await exchangeCode(code, code_verifier);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh access token
 * POST /api/auth/refresh
 * Body: { refresh_token }
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      throw new BadRequestError('Missing refresh_token');
    }

    const tokens = await refreshAccessToken(refresh_token);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

/**
 * Get current user info
 * GET /api/auth/user
 * Requires: Authorization header with Bearer token
 */
router.get('/user', requireAuth, (req, res) => {
  res.json(req.user);
});

module.exports = router;
