/**
 * OAuth2/OIDC Client Module
 *
 * Manages OAuth2/OIDC client with automatic endpoint discovery.
 * Supports any OAuth2/OIDC-compliant provider (Authentik, Keycloak, Auth0, etc.)
 */

const { Issuer } = require('openid-client');
const config = require('./config');
const logger = require('./logger');

let oauthClient = null;
let oauthIssuer = null;

/**
 * Setup OAuth2/OIDC client with auto-discovery
 * @returns {Promise<Client>} OAuth client instance
 */
async function setupOAuth() {
  try {
    logger.info('Discovering OAuth2/OIDC provider', { issuer: config.oauth.issuer });

    // Auto-discover OAuth2/OIDC endpoints
    oauthIssuer = await Issuer.discover(config.oauth.issuer);

    logger.info('OAuth2/OIDC provider discovered successfully', {
      issuer: oauthIssuer.issuer,
      authorizationEndpoint: oauthIssuer.authorization_endpoint,
      tokenEndpoint: oauthIssuer.token_endpoint,
      userinfoEndpoint: oauthIssuer.userinfo_endpoint,
      jwksUri: oauthIssuer.jwks_uri,
      endSessionEndpoint: oauthIssuer.end_session_endpoint
    });

    // Create OAuth client
    oauthClient = new oauthIssuer.Client({
      client_id: config.oauth.clientId,
      client_secret: config.oauth.clientSecret,
      redirect_uris: [config.oauth.redirectUri],
      response_types: ['code'],
      // Use client_secret_post for token endpoint authentication
      token_endpoint_auth_method: 'client_secret_post',
      // Allow HS256 for ID token signature (Authentik compatibility)
      id_token_signed_response_alg: 'HS256'
    });

    logger.info('OAuth2/OIDC client configured successfully', {
      clientId: config.oauth.clientId,
      redirectUri: config.oauth.redirectUri,
      scopes: config.oauth.scopes
    });

    return oauthClient;
  } catch (error) {
    logger.error('Failed to setup OAuth2/OIDC client', {
      error: error.message,
      issuer: config.oauth.issuer
    });
    throw error;
  }
}

/**
 * Get the OAuth client instance
 * @returns {Client} OAuth client
 */
function getClient() {
  if (!oauthClient) {
    throw new Error('OAuth client not initialized. Call setupOAuth() first.');
  }
  return oauthClient;
}

/**
 * Get the OAuth issuer instance
 * @returns {Issuer} OAuth issuer
 */
function getIssuer() {
  if (!oauthIssuer) {
    throw new Error('OAuth issuer not initialized. Call setupOAuth() first.');
  }
  return oauthIssuer;
}

/**
 * Get OAuth provider information for frontend
 * @returns {Object} Provider information
 */
function getProviderInfo() {
  if (!oauthIssuer || !oauthClient) {
    throw new Error('OAuth not initialized');
  }

  return {
    issuer: oauthIssuer.issuer,
    authorizationEndpoint: oauthIssuer.authorization_endpoint,
    tokenEndpoint: oauthIssuer.token_endpoint,
    userinfoEndpoint: oauthIssuer.userinfo_endpoint,
    endSessionEndpoint: oauthIssuer.end_session_endpoint,
    clientId: config.oauth.clientId,
    redirectUri: config.oauth.redirectUri,
    scopes: config.oauth.scopes
  };
}

module.exports = {
  setupOAuth,
  getClient,
  getIssuer,
  getProviderInfo
};
