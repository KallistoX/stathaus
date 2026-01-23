/**
 * Token Service
 *
 * Handles OAuth2/OIDC token operations (validation, exchange, refresh).
 */

const { getClient } = require('../oauth');
const logger = require('../logger');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Validate access token with OAuth provider
 * @param {string} accessToken Access token to validate
 * @returns {Promise<Object>} User information
 */
async function validateToken(accessToken) {
  try {
    const client = getClient();

    // Call userinfo endpoint to validate token and get user data
    const userinfo = await client.userinfo(accessToken);

    return {
      id: userinfo.sub,
      email: userinfo.email,
      name: userinfo.name || userinfo.preferred_username || userinfo.email,
      emailVerified: userinfo.email_verified
    };
  } catch (error) {
    logger.warn('Token validation failed', { error: error.message });
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

/**
 * Exchange authorization code for tokens (with PKCE support)
 * @param {string} code Authorization code
 * @param {string} codeVerifier PKCE code verifier
 * @returns {Promise<Object>} Token set
 */
async function exchangeCode(code, codeVerifier) {
  try {
    const client = getClient();

    // Exchange code for tokens
    const tokenSet = await client.callback(
      client.redirect_uris[0],
      { code },
      { code_verifier: codeVerifier }
    );

    logger.info('Authorization code exchanged successfully');

    // Debug: Log what tokens we received
    logger.debug('Token exchange response', {
      hasAccessToken: !!tokenSet.access_token,
      hasRefreshToken: !!tokenSet.refresh_token,
      hasIdToken: !!tokenSet.id_token,
      expiresIn: tokenSet.expires_in,
      tokenType: tokenSet.token_type
    });

    return {
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token,
      expiresIn: tokenSet.expires_in,
      idToken: tokenSet.id_token,
      tokenType: tokenSet.token_type || 'Bearer'
    };
  } catch (error) {
    logger.error('Code exchange failed', { error: error.message });
    throw new Error('Failed to exchange authorization code for tokens');
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken Refresh token
 * @returns {Promise<Object>} New token set
 */
async function refreshAccessToken(refreshToken) {
  try {
    const client = getClient();

    const tokenSet = await client.refresh(refreshToken);

    logger.info('Access token refreshed successfully');

    return {
      accessToken: tokenSet.access_token,
      refreshToken: tokenSet.refresh_token || refreshToken,
      expiresIn: tokenSet.expires_in,
      tokenType: tokenSet.token_type || 'Bearer'
    };
  } catch (error) {
    // Log detailed error info for debugging
    logger.error('Token refresh failed', {
      error: error.message,
      errorName: error.name,
      // openid-client OPError properties
      oauthError: error.error,
      oauthErrorDescription: error.error_description,
      // HTTP response details if available
      statusCode: error.statusCode || error.response?.statusCode,
      responseBody: error.response?.body
    });
    throw new UnauthorizedError('Failed to refresh access token');
  }
}

module.exports = {
  validateToken,
  exchangeCode,
  refreshAccessToken
};
