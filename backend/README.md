# StatHaus Backend API

Production-grade backend API for StatHaus PWA with OAuth2/OIDC authentication and Redis data synchronization.

## Features

- **Generic OAuth2/OIDC Support**: Works with any OAuth2/OIDC-compliant provider (Authentik, Keycloak, Auth0, Google, etc.)
- **PKCE Support**: Secure authorization code flow with Proof Key for Code Exchange
- **Redis Storage**: Fast, scalable key-value storage for user data
- **Production-Ready**: Structured logging, error handling, health checks, graceful shutdown
- **Secure**: Rate limiting, input validation, JWT validation, security headers
- **Stateless**: No session management - pure JWT-based authentication
- **Configurable**: All settings via environment variables

## Requirements

- Node.js >= 18.0.0
- Redis server
- OAuth2/OIDC provider (e.g., Authentik, Keycloak, Auth0)

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

### Required Environment Variables

```bash
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=2

# OAuth2/OIDC
OAUTH_ISSUER=https://sso.your-domain.com
OAUTH_CLIENT_ID=stathaus-sso
OAUTH_CLIENT_SECRET=your-client-secret
OAUTH_REDIRECT_URI=https://stathaus.your-domain.com/auth/callback

# CORS
CORS_ORIGIN=https://stathaus.your-domain.com
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## Docker

Build image:

```bash
docker build -t stathaus-backend .
```

Run container:

```bash
docker run -p 3000:3000 \
  -e REDIS_HOST=redis \
  -e REDIS_PASSWORD=password \
  -e OAUTH_ISSUER=https://sso.example.com \
  -e OAUTH_CLIENT_ID=stathaus \
  -e OAUTH_CLIENT_SECRET=secret \
  -e OAUTH_REDIRECT_URI=https://stathaus.example.com/auth/callback \
  -e CORS_ORIGIN=https://stathaus.example.com \
  stathaus-backend
```

## API Endpoints

### Health

- `GET /api/health` - Basic health check
- `GET /api/health/ready` - Readiness check with dependency status

### Auth

- `GET /api/auth/config` - Get OAuth provider configuration
- `POST /api/auth/token` - Exchange authorization code for tokens
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/user` - Get current user info (requires auth)

### Sync

- `POST /api/sync/upload` - Upload user data (requires auth)
- `GET /api/sync/download` - Download user data (requires auth)
- `GET /api/sync/metadata` - Get sync metadata (requires auth)

## OAuth Provider Setup

See [docs/OAUTH_SETUP.md](../docs/OAUTH_SETUP.md) for detailed instructions on configuring different OAuth providers.

## Security

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **JWT Validation**: All protected endpoints validate access tokens via provider's userinfo endpoint
- **Input Validation**: Joi schemas validate all request bodies
- **Security Headers**: Helmet middleware protects against common vulnerabilities
- **CORS**: Configurable allowed origins
- **Non-root User**: Docker container runs as non-root user

## Logging

Uses Winston for structured logging. Log level can be configured via `LOG_LEVEL` environment variable.

## License

MIT
