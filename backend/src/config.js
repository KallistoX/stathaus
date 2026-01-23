/**
 * Configuration Module
 *
 * Centralized configuration management for StatHaus Backend.
 * All settings are loaded from environment variables.
 */

const config = {
  // Server Configuration
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'production',

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 2,
    // Enable TLS if REDIS_TLS is set to 'true'
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    // Retry strategy: exponential backoff with max 2 seconds
    retryStrategy: (times) => Math.min(times * 50, 2000),
    // Connection settings
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true, // Allow queuing commands while connecting
    lazyConnect: false // Connect immediately when Redis instance is created
  },

  // OAuth2/OIDC Configuration
  oauth: {
    issuer: process.env.OAUTH_ISSUER,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    redirectUri: process.env.OAUTH_REDIRECT_URI,
    scopes: process.env.OAUTH_SCOPES || 'openid profile email offline_access',
    // Auto-discover endpoints via .well-known/openid-configuration
    discoveryUrl: process.env.OAUTH_DISCOVERY_URL ||
                   (process.env.OAUTH_ISSUER ? `${process.env.OAUTH_ISSUER}/.well-known/openid-configuration` : null)
  },

  // Security Configuration
  security: {
    // Supported JWT algorithms (including HS256 for Authentik compatibility)
    jwtAlgorithms: ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'HS256', 'HS384', 'HS512'],
    // Maximum request payload size
    maxPayloadSize: '10mb',
    // Rate limiting
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100 // requests per window
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },

  // Application Configuration
  app: {
    name: 'StatHaus API',
    version: process.env.APP_VERSION || '1.0.0'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: process.env.LOG_FORMAT || 'json' // 'json' or 'simple'
  }
};

// Validation: Ensure required configuration is present
function validateConfig() {
  const required = [
    'REDIS_HOST',
    'OAUTH_ISSUER',
    'OAUTH_CLIENT_ID',
    'OAUTH_CLIENT_SECRET',
    'OAUTH_REDIRECT_URI'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate URLs
  try {
    new URL(config.oauth.issuer);
    new URL(config.oauth.redirectUri);
  } catch (error) {
    throw new Error(`Invalid URL in configuration: ${error.message}`);
  }
}

// Only validate in production mode (allow missing vars in development)
if (config.nodeEnv === 'production') {
  validateConfig();
}

module.exports = config;
