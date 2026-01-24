# StatHaus - Meter Reading Tracker

A Progressive Web App for tracking and managing meter readings for electricity, water, gas, and more. Built with Vue 3, fully client-side by default - your data stays with you!

## Features

### Flexible Meter Management
- **Dynamic Meter Types**: Create custom types (Electricity, Water, Gas, Heating Oil, Solar, etc.)
- **Unlimited Meters**: Manage any number of meters per type
- **Detailed Readings**: Record values with timestamps and notes

### Two Storage Modes

#### Browser Storage (IndexedDB) - Default
- Simple and fast
- No configuration required
- Works offline
- Data stays on this device only

#### Cloud Sync with OAuth (Recommended)
- Automatic synchronization
- Secure authentication (Authentik, Keycloak, Auth0, Google, etc.)
- Available across devices
- No manual file management
- Works on all devices (iOS, Android, Desktop)

**Workflow:**
```
1. Settings → Cloud Sync → "Sign in"
2. Log in with OAuth provider (e.g., Authentik)
3. Data syncs automatically
4. Sign in on another device → Data instantly available!
```

### Auto-Login & Dashboard Start
- Automatic login when cloud sync session is active
- Dashboard as default start page
- Seamless user experience

### Continuous Meter Validation
- Warning on decreasing meter values
- Prevents accidental incorrect entries
- Confirmation dialog for unusual values

### Visualization
- Interactive charts with ECharts
- Touch-optimized for mobile
- Zoom & Pan support
- History display

### Export & Import
- **JSON Export**: Complete backup
- **CSV Export**: For Excel/LibreOffice
- **JSON Import**: Restore backup

### Progressive Web App
- Installable on desktop & mobile
- Works offline
- Native app experience

## Deployment Configuration

For production deployment with OAuth and cloud sync, configure these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `OIDC_ISSUER` | OAuth provider URL (e.g., `https://auth.example.com`) | Yes |
| `OIDC_CLIENT_ID` | OAuth client ID | Yes |
| `OIDC_CLIENT_SECRET` | OAuth client secret | Yes |
| `REDIS_HOST` | Redis server hostname | Yes |
| `REDIS_PORT` | Redis port (default: `6379`) | No |
| `REDIS_DB` | Redis database number (default: `0`) | No |

See [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md) for provider-specific setup instructions and [backend/README.md](backend/README.md) for detailed backend configuration.

### Docker Images

Images are automatically built via GitHub Actions:

- `ghcr.io/kallistox/stathaus:latest` - Frontend (nginx + Vue PWA)
- `ghcr.io/kallistox/stathaus-backend:latest` - Backend (Node.js + Express)

**Available tags:**
- `latest` - Latest main branch
- `v1.x.x` - Semantic version tags
- `main-abc123` - Commit SHA

## Quick Start with Docker

### Prerequisites
- Docker Desktop (for Mac)
- VSCode (recommended)

### Start Development

1. **Clone repository** (or open folder)
```bash
cd stathaus
```

2. **Start Docker container**
```bash
docker-compose up
```

3. **Open app**
```
http://localhost:5173
```

The app automatically reloads on code changes (Hot Reload)!

### Production Build

```bash
# Build production image
docker build -t stathaus:latest .

# Start container
docker run -p 8080:80 stathaus:latest
```

App available at `http://localhost:8080`

## Development without Docker

### Installation
```bash
npm install
```

### Start Dev Server
```bash
npm run dev
```

### Create Production Build
```bash
npm run build
```

### Production Preview
```bash
npm run preview
```

## Technology Stack

**Frontend**:
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS
- **Charts**: Apache ECharts
- **PWA**: vite-plugin-pwa
- **Storage**: IndexedDB + File System Access API + Cloud Sync

**Backend**:
- **Runtime**: Node.js 20 (Alpine)
- **Framework**: Express.js
- **Authentication**: openid-client (OAuth2/OIDC)
- **Database**: Redis (ioredis client)
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet
- **Deployment**: Multi-stage Docker builds

## Roadmap

### Completed (v1.0 - v1.7)
- [x] OAuth2/OIDC Cloud Sync
- [x] Auto-Login
- [x] Dashboard Entrypoint
- [x] Continuous Meter Validation
- [x] Conflict Resolution
- [x] Logo Header
- [x] PWA Icons
- [x] Dark Mode
- [x] PDF Reports
- [x] Dashboard Widgets

### Planned
- [ ] Cost Calculation (Tariff management)
- [ ] Usage Predictions (Consumption forecasting)
- [ ] Meter Grouping (Group by location/property)

## License

MIT License - use it however you want!

## Contributing

PRs are welcome! For questions or issues, open an issue.

---

**Happy Metering!**
