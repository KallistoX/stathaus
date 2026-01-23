# StatHaus Backend API

Production-grade backend API for StatHaus PWA with OAuth2/OIDC authentication and Redis data synchronization.

## Features

- **Generic OAuth2/OIDC Support**: Works with any OAuth2/OIDC-compliant provider (Authentik, Keycloak, Auth0, Google, etc.)
- **PKCE Support**: Secure authorization code flow with Proof Key for Code Exchange
- **Redis Storage**: Fast, scalable key-value storage for user data
- **Production-Ready**: Structured logging, error handling, health checks, graceful shutdown
- **Secure**: Input validation, JWT validation, security headers (rate limiting at ingress level)
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

## API Response Schemas

### Health Responses

**GET /api/health**
```json
{
  "status": "ok",
  "timestamp": "2026-01-23T12:00:00.000Z",
  "version": "1.2.0"
}
```

**GET /api/health/ready**
```json
{
  "status": "ready",
  "checks": {
    "redis": true,
    "oauth": true
  },
  "timestamp": "2026-01-23T12:00:00.000Z"
}
```

### Auth Responses

**GET /api/auth/config**
```json
{
  "issuer": "https://sso.example.com",
  "authorization_endpoint": "https://sso.example.com/authorize",
  "token_endpoint": "https://sso.example.com/token",
  "userinfo_endpoint": "https://sso.example.com/userinfo"
}
```

**POST /api/auth/token**

Request body:
```json
{
  "code": "authorization_code",
  "code_verifier": "pkce_code_verifier",
  "redirect_uri": "https://stathaus.example.com/auth/callback"
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "id_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**POST /api/auth/refresh**

Request body:
```json
{
  "refresh_token": "eyJ..."
}
```

Response:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**GET /api/auth/user** (requires Authorization header)
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "preferred_username": "username"
}
```

### Sync Responses

**POST /api/sync/upload** (requires Authorization header)

Request body:
```json
{
  "version": "1.0",
  "meterTypes": [...],
  "meters": [...],
  "readings": [...],
  "settings": {}
}
```

Response:
```json
{
  "success": true,
  "metadata": {
    "lastUpdated": "2026-01-23T12:00:00.000Z",
    "metersCount": 5,
    "readingsCount": 120,
    "size": 15234
  }
}
```

**GET /api/sync/download** (requires Authorization header)
```json
{
  "version": "1.0",
  "meterTypes": [...],
  "meters": [...],
  "readings": [...],
  "settings": {},
  "lastModified": "2026-01-23T12:00:00.000Z"
}
```

**GET /api/sync/metadata** (requires Authorization header)
```json
{
  "lastUpdated": "2026-01-23T12:00:00.000Z",
  "metersCount": 5,
  "readingsCount": 120,
  "size": 15234
}
```

### Error Responses

All errors follow this format:
```json
{
  "error": "ErrorType",
  "message": "Human-readable error message"
}
```

Common error types:
| Status | Error Type | Description |
|--------|------------|-------------|
| 400 | `BadRequestError` | Invalid request body or parameters |
| 401 | `UnauthorizedError` | Missing or invalid authorization token |
| 404 | `NotFoundError` | Requested resource not found |
| 500 | `InternalServerError` | Server-side error |

## OAuth Provider Setup

See [docs/OAUTH_SETUP.md](../docs/OAUTH_SETUP.md) for detailed instructions on configuring different OAuth providers.

## Security

- **Rate Limiting**: Handled at Traefik ingress level (not in application)
- **JWT Validation**: All protected endpoints validate access tokens via provider's userinfo endpoint
- **Input Validation**: Joi schemas validate all request bodies
- **Security Headers**: Helmet middleware protects against common vulnerabilities
- **CORS**: Configurable allowed origins
- **Non-root User**: Docker container runs as non-root user
- **PKCE Support**: Authorization code flow with Proof Key for Code Exchange

## Logging

Uses Winston for structured logging. Log level can be configured via `LOG_LEVEL` environment variable.

Log levels: `error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`

Default: `info` in production, `debug` in development.

## License

MIT
