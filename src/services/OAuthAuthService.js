/**
 * OAuthAuthService
 *
 * Generic OAuth2/OIDC authentication service with PKCE support.
 * Works with any OAuth2/OIDC-compliant provider (Authentik, Keycloak, Auth0, Google, etc.)
 */

/**
 * Generate a random string for PKCE
 * @param {number} length Length of the string
 * @returns {string} Random string
 */
function generateRandomString(length) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map(v => charset[v % charset.length])
    .join('');
}

/**
 * Generate SHA-256 hash
 * @param {string} plain Plain text
 * @returns {Promise<string>} Base64URL encoded hash
 */
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(hash);
}

/**
 * Base64URL encode
 * @param {ArrayBuffer} buffer Buffer to encode
 * @returns {string} Base64URL encoded string
 */
function base64URLEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export default class OAuthAuthService {
  constructor() {
    this.apiBaseUrl = window.location.origin;
    this.config = null;
    this.initialized = false;
  }

  /**
   * Initialize OAuth service by fetching provider configuration
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/config`);
      if (!response.ok) {
        throw new Error('Failed to fetch OAuth configuration');
      }

      this.config = await response.json();
      this.initialized = true;

      console.log('OAuth configuration loaded:', {
        issuer: this.config.issuer,
        clientId: this.config.clientId
      });
    } catch (error) {
      console.error('Failed to initialize OAuth service:', error);
      throw new Error('OAuth service initialization failed. Please check backend configuration.');
    }
  }

  /**
   * Start OAuth login flow
   * Redirects user to OAuth provider for authentication
   * @returns {Promise<void>}
   */
  async login() {
    await this.initialize();

    // Generate PKCE parameters
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await sha256(codeVerifier);

    // Generate state for CSRF protection
    const state = generateRandomString(32);

    // Store PKCE verifier and state in localStorage
    localStorage.setItem('oauth_code_verifier', codeVerifier);
    localStorage.setItem('oauth_state', state);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const authUrl = `${this.config.authorizationEndpoint}?${params.toString()}`;

    // Redirect to OAuth provider
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback after user authentication
   * Exchanges authorization code for tokens
   * @param {string} code Authorization code
   * @param {string} state State parameter
   * @returns {Promise<Object>} Token set
   */
  async handleCallback(code, state) {
    await this.initialize();

    // Verify state parameter (CSRF protection)
    const storedState = localStorage.getItem('oauth_state');
    if (!storedState || storedState !== state) {
      throw new Error('Invalid state parameter - possible CSRF attack');
    }

    // Get PKCE code verifier
    const codeVerifier = localStorage.getItem('oauth_code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found - login flow was not properly initiated');
    }

    try {
      // Exchange code for tokens
      const response = await fetch(`${this.apiBaseUrl}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Token exchange failed');
      }

      const tokens = await response.json();

      // Store tokens
      this.storeTokens(tokens);

      // Clean up temporary storage
      localStorage.removeItem('oauth_code_verifier');
      localStorage.removeItem('oauth_state');

      return tokens;
    } catch (error) {
      // Clean up on error
      localStorage.removeItem('oauth_code_verifier');
      localStorage.removeItem('oauth_state');
      throw error;
    }
  }

  /**
   * Store tokens in localStorage
   * @param {Object} tokens Token set
   */
  storeTokens(tokens) {
    localStorage.setItem('oauth_access_token', tokens.accessToken);

    if (tokens.refreshToken) {
      localStorage.setItem('oauth_refresh_token', tokens.refreshToken);
    }

    if (tokens.expiresIn) {
      const expiresAt = Date.now() + (tokens.expiresIn * 1000);
      localStorage.setItem('oauth_expires_at', expiresAt.toString());
    }

    if (tokens.idToken) {
      localStorage.setItem('oauth_id_token', tokens.idToken);
    }
  }

  /**
   * Get stored access token
   * @returns {string|null} Access token or null if not logged in
   */
  getAccessToken() {
    return localStorage.getItem('oauth_access_token');
  }

  /**
   * Check if user is logged in
   * @returns {boolean} True if logged in
   */
  isLoggedIn() {
    const token = this.getAccessToken();
    if (!token) {
      return false;
    }

    // Check if token is expired
    const expiresAt = localStorage.getItem('oauth_expires_at');
    if (expiresAt) {
      const expiresAtTime = parseInt(expiresAt);
      if (Date.now() >= expiresAtTime) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if token needs refresh (expires in less than 5 minutes)
   * @returns {boolean} True if refresh needed
   */
  needsRefresh() {
    const expiresAt = localStorage.getItem('oauth_expires_at');
    if (!expiresAt) {
      return false;
    }

    const expiresAtTime = parseInt(expiresAt);
    const fiveMinutes = 5 * 60 * 1000;

    return Date.now() >= (expiresAtTime - fiveMinutes);
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<Object>} New token set
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem('oauth_refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokens = await response.json();
      this.storeTokens(tokens);

      return tokens;
    } catch (error) {
      // If refresh fails, user needs to log in again
      this.logout();
      throw error;
    }
  }

  /**
   * Get current user information
   * @returns {Promise<Object>} User information
   */
  async getUserInfo() {
    await this.initialize();

    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not logged in');
    }

    // Refresh token if needed
    if (this.needsRefresh()) {
      await this.refreshToken();
    }

    const response = await fetch(`${this.apiBaseUrl}/api/auth/user`, {
      headers: {
        'Authorization': `Bearer ${this.getAccessToken()}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token invalid, try to refresh
        try {
          await this.refreshToken();
          // Retry request with new token
          return this.getUserInfo();
        } catch {
          throw new Error('Authentication failed - please log in again');
        }
      }
      throw new Error('Failed to fetch user information');
    }

    return response.json();
  }

  /**
   * Logout user
   * Clears all stored tokens and redirects to logout endpoint if available
   */
  async logout() {
    // Clear tokens
    localStorage.removeItem('oauth_access_token');
    localStorage.removeItem('oauth_refresh_token');
    localStorage.removeItem('oauth_expires_at');
    localStorage.removeItem('oauth_id_token');

    // If provider has end session endpoint, redirect there
    if (this.config?.endSessionEndpoint) {
      const params = new URLSearchParams({
        post_logout_redirect_uri: window.location.origin
      });

      const idToken = localStorage.getItem('oauth_id_token');
      if (idToken) {
        params.append('id_token_hint', idToken);
      }

      window.location.href = `${this.config.endSessionEndpoint}?${params.toString()}`;
    }
  }

  /**
   * Make authenticated API request
   * Automatically handles token refresh
   * @param {string} url API URL
   * @param {Object} options Fetch options
   * @returns {Promise<Response>} Fetch response
   */
  async authenticatedFetch(url, options = {}) {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('Not logged in');
    }

    // Refresh token if needed
    if (this.needsRefresh()) {
      await this.refreshToken();
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.getAccessToken()}`
      }
    });

    // If unauthorized, try to refresh token and retry
    if (response.status === 401) {
      try {
        await this.refreshToken();
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${this.getAccessToken()}`
          }
        });
      } catch {
        this.logout();
        throw new Error('Authentication failed - please log in again');
      }
    }

    return response;
  }
}
