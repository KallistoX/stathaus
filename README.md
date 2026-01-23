# StatHaus - Meter Reading Tracker

A Progressive Web App for tracking and managing meter readings for electricity, water, gas, and more. Built with Vue 3, fully client-side by default - your data stays with you!

## Features

### Flexible Meter Management
- **Dynamic Meter Types**: Create custom types (Electricity, Water, Gas, Heating Oil, Solar, etc.)
- **Unlimited Meters**: Manage any number of meters per type
- **Detailed Readings**: Record values with timestamps and notes

### Three Storage Modes

#### Browser Storage (IndexedDB) - Default
- Simple and fast
- No configuration required
- Works offline
- Data stays on this device only

#### File System Mode
- Cross-device synchronization
- Cloud sync possible (Nextcloud, iCloud, Google Drive)
- Full control over your data
- Manual backups

**Example Nextcloud Workflow:**
```
1. On Device 1: Create file at ~/Nextcloud/stathaus-data.json
2. App uses this file directly
3. Nextcloud syncs automatically
4. On Device 2: Open same file → synchronized!
```

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

### Auto-Login & Dashboard Start (v1.2.0)
- Automatic login when cloud sync session is active
- Dashboard as default start page
- Seamless user experience

### Continuous Meter Validation (v1.2.0)
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

## Production Deployment (Kubernetes)

StatHaus can be deployed to Kubernetes with full OAuth2/OIDC support and Redis-backed cloud sync.

### Architecture

```
Frontend (Vue PWA) → Nginx → Backend (Node.js/Express) → Redis
                                  ↓
                           OAuth2/OIDC Provider
                         (Authentik, Keycloak, Auth0, etc.)
```

### Prerequisites
- Kubernetes cluster (K3s, K8s, etc.)
- kubectl configured
- Ansible (for automated deployment)
- cert-manager installed (for TLS certificates)
- Ingress controller (Traefik, nginx)
- Redis instance (can use shared Redis)
- OAuth2/OIDC provider (Authentik recommended, or any OIDC provider)

### Quick Deployment with Ansible

1. **Configure inventory**:
```bash
cp ansible/inventory/hosts.yml.example ansible/inventory/hosts.yml
# Edit hosts.yml with your server IP and domain
```

Example configuration:
```yaml
all:
  hosts:
    your-server:
      stathaus_domain: "stathaus.your-domain.com"

      # Optional: Custom Redis (defaults to shared Redis DB 2)
      # stathaus_redis_host: "custom-redis.namespace.svc.cluster.local"
      # stathaus_redis_port: "6379"
      # stathaus_redis_db: "0"
```

2. **Deploy**:
```bash
ansible-playbook ansible/playbooks/25-stathaus.yml
```

The playbook will:
- Deploy frontend (nginx + Vue PWA)
- Deploy backend (Node.js + Express)
- Configure OAuth with Authentik (if available) or prompt for manual setup
- Connect to Redis for data storage
- Configure Ingress with TLS

3. **OAuth Setup**:

**Automatic (with Authentik):**
If Authentik is detected in your cluster, OAuth is configured automatically.

**Manual (other providers):**
```bash
kubectl create secret generic stathaus-oidc-credentials \
  --namespace stathaus \
  --from-literal=issuer=https://your-oauth-provider.com \
  --from-literal=client_id=your-client-id \
  --from-literal=client_secret=your-client-secret
```

See [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md) for detailed provider-specific instructions.

4. **Access your app**:
```
https://stathaus.your-domain.com
```

### Manual Deployment with Helm

```bash
# Create namespace
kubectl create namespace stathaus

# Install chart
helm install stathaus ./helm \
  --namespace stathaus \
  --set ingress.hosts[0].host=stathaus.your-domain.com \
  --set ingress.tls[0].hosts[0]=stathaus.your-domain.com

# Check status
kubectl get pods -n stathaus
kubectl get ingress -n stathaus
kubectl get certificate -n stathaus
```

### CI/CD Pipeline

GitHub Actions automatically builds and pushes Docker images to GitHub Container Registry (ghcr.io) on every push to main.

**Workflow**: `.github/workflows/build-and-push.yml`

**Images built**:
- `ghcr.io/kallistox/stathaus:latest` - Frontend (nginx + Vue PWA)
- `ghcr.io/kallistox/stathaus-backend:latest` - Backend (Node.js + Express)

**Image tags**:
- `latest` - Latest main branch
- `v1.2.0` - Semantic version tags
- `main-abc123` - Commit SHA

### Updating to New Version

```bash
# With Ansible
ansible-playbook ansible/playbooks/25-stathaus.yml \
  -e image_tag=v1.2.0
```

### Production Features

**Frontend**:
- **PWA**: Installable, offline-first
- **Static assets**: Nginx with gzip compression
- **Health checks**: Liveness and readiness probes
- **Resource limits**: CPU 100m, Memory 128Mi

**Backend**:
- **OAuth2/OIDC**: Generic support for any provider
- **Redis storage**: Fast, scalable data persistence
- **Token management**: Automatic refresh, JWT validation
- **Security**: Input validation, security headers
- **Logging**: Structured logging with Winston
- **Health checks**: `/api/health` and `/api/health/ready`
- **Resource limits**: CPU 200m, Memory 256Mi

**Infrastructure**:
- **TLS/HTTPS**: Automatic Let's Encrypt certificates via cert-manager
- **Sidecar pattern**: Frontend and backend in same pod
- **Redis**: Shared or dedicated instance
- **Ingress**: Traefik or nginx with proper headers

### Cloud Sync with OAuth

StatHaus provides secure cloud synchronization using OAuth2/OIDC authentication:

1. Deploy StatHaus to production
2. Access app at https://stathaus.your-domain.com
3. Go to Settings → Cloud Sync
4. Click "Sign in"
5. Authenticate with your OAuth provider
6. Data automatically syncs to Redis
7. Use on multiple devices with same account

**Supported Providers**:
- Authentik (self-hosted, recommended)
- Keycloak (self-hosted, enterprise)
- Auth0 (cloud service)
- Google OAuth
- Microsoft Entra ID (Azure AD)
- Any OAuth2/OIDC-compliant provider

See [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md) for provider-specific setup instructions.

### Monitoring

```bash
# View frontend logs
kubectl logs -n stathaus -l app.kubernetes.io/name=stathaus -c stathaus -f

# View backend logs
kubectl logs -n stathaus -l app.kubernetes.io/name=stathaus -c backend -f

# Check pod status
kubectl get pods -n stathaus -w

# Check certificate
kubectl describe certificate -n stathaus stathaus-tls

# Test backend health
curl https://stathaus.your-domain.com/api/health
curl https://stathaus.your-domain.com/api/health/ready
```

### Troubleshooting

**Pod won't start**:
```bash
kubectl describe pod -n stathaus -l app.kubernetes.io/name=stathaus
kubectl logs -n stathaus -l app.kubernetes.io/name=stathaus -c backend
```

**OAuth not working**:
```bash
# Check if secret exists
kubectl get secret -n stathaus stathaus-oidc-credentials

# Check backend logs for OAuth errors
kubectl logs -n stathaus -l app.kubernetes.io/name=stathaus -c backend | grep -i oauth
```

**Redis connection issues**:
```bash
# Check Redis is accessible
kubectl get pods -n shared-services -l app=redis

# Test Redis connection from backend pod
kubectl exec -n stathaus deployment/stathaus -c backend -- redis-cli -h shared-redis-master.shared-services.svc.cluster.local -a <password> ping
```

**Certificate issues**:
```bash
kubectl get certificate -n stathaus
kubectl describe certificate -n stathaus stathaus-tls
kubectl logs -n cert-manager -l app=cert-manager
```

See [backend/README.md](backend/README.md) for detailed backend configuration and [docs/OAUTH_SETUP.md](docs/OAUTH_SETUP.md) for OAuth provider setup.

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

## Project Structure

```
stathaus/
├── src/                      # Frontend (Vue PWA)
│   ├── assets/               # CSS and static assets
│   ├── components/           # Vue Components
│   │   ├── AddMeterModal.vue
│   │   ├── AddMeterTypeModal.vue
│   │   ├── ConflictResolutionModal.vue
│   │   ├── ContinuousMeterWarningModal.vue
│   │   ├── EditMeterModal.vue
│   │   ├── OAuthCallback.vue
│   │   ├── QuickAddReadingModal.vue
│   │   └── SyncStatusIndicator.vue
│   ├── views/                # Page Components
│   │   ├── DashboardView.vue
│   │   ├── LaunchView.vue
│   │   ├── MeterDetailView.vue
│   │   ├── MetersView.vue
│   │   └── SettingsView.vue
│   ├── adapters/             # Cloud Storage Adapter
│   │   └── CloudStorageAdapter.js
│   ├── services/             # Services
│   │   └── OAuthAuthService.js
│   ├── storage/              # Local Storage
│   │   ├── DataManager.js
│   │   ├── IndexedDBAdapter.js
│   │   └── StorageAdapter.js
│   ├── stores/               # Pinia Stores
│   │   └── dataStore.js
│   ├── router/               # Vue Router
│   │   └── index.js
│   ├── App.vue               # Main Component
│   └── main.js               # Entry Point
├── backend/                  # Backend (Node.js + Express)
│   ├── src/
│   │   ├── index.js          # Server entry point
│   │   ├── config.js         # Configuration
│   │   ├── logger.js         # Winston logger
│   │   ├── redis.js          # Redis client
│   │   ├── oauth.js          # OAuth2/OIDC client
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   ├── Dockerfile            # Multi-stage build
│   ├── package.json          # Dependencies
│   └── README.md             # Backend docs
├── ansible/                  # Kubernetes deployment
│   ├── playbooks/
│   │   └── 25-stathaus.yml   # Main playbook
│   └── inventory/
│       └── hosts.yml.example
├── docs/
│   └── OAUTH_SETUP.md        # OAuth provider setup guide
├── public/                   # Public assets (PWA icons, logos)
├── docker-compose.yml        # Development setup
├── Dockerfile                # Frontend production image
├── nginx.conf                # Nginx config with /api proxy
├── vite.config.js            # Vite config
└── package.json              # Frontend dependencies
```

## Usage

### Getting Started

1. **Create Meter Type**
   - Go to Settings
   - Click "+ Add Type"
   - E.g., "Electricity" with unit "kWh" and icon "⚡"

2. **Add Meter**
   - Go to "Meters"
   - Click "+ Add Meter"
   - Select type, enter name and optionally meter number

3. **Record Reading**
   - Dashboard: Click "+ Add Reading"
   - Or: Meter details → "+ Reading"

4. **View Charts**
   - Click on a meter
   - See history chart and all readings

### Switch Storage Modes

#### From Browser → File
1. Settings → Data Storage
2. "New File" or "Open File"
3. Select location (e.g., Nextcloud folder)
4. Data is automatically transferred

#### From File → Browser
1. Settings → Browser Storage
2. Click "Switch"
3. Data is transferred

## Privacy & Data Protection

**Local Mode (IndexedDB / File System):**
- No server communication: All data stays local
- No tracking: No analytics, no cookies
- GDPR compliant: No personal data on servers

**Cloud Sync Mode (Optional):**
- Opt-in: Cloud sync only when actively chosen
- Secure authentication: OAuth2/OIDC with PKCE
- Minimal data: Only meter and reading data is synchronized
- Self-hosted option: Can run on your own infrastructure

**General:**
- Open Source: Code is fully visible
- No tracking: No analytics, no cookies (even in cloud mode)

## Browser Compatibility

| Feature | Chrome/Edge | Safari | Firefox |
|---------|-------------|--------|---------|
| IndexedDB | Yes | Yes | Yes |
| File System API | Yes (Desktop) | No | No |
| PWA Install | Yes | Yes | Yes |
| Service Worker | Yes | Yes | Yes |

**Recommendation**: Chrome/Edge Desktop for File System API support

## VSCode Setup (Optional)

### Recommended Extensions
- Vue Language Features (Volar)
- Tailwind CSS IntelliSense
- Docker

### Use Dev Container
```json
// .devcontainer/devcontainer.json
{
  "name": "StatHaus",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/app"
}
```

## Deployment

### As Static Website
After `npm run build` the app in `dist/` is ready for:
- Netlify
- Vercel
- GitHub Pages
- Nginx
- Apache

### With Docker
```bash
# Build image
docker build -t stathaus:v1.2.0 .

# Deploy to server
docker run -d -p 80:80 stathaus:v1.2.0
```

## Troubleshooting

### Docker not running on Mac
```bash
# Install Docker Desktop
brew install --cask docker

# Start Docker Desktop
open -a Docker
```

### Hot Reload not working
```bash
# CHOKIDAR_USEPOLLING=true is set in docker-compose.yml
# If still not working:
docker-compose down
docker-compose up --build
```

### Browser doesn't support File System API
- Use Chrome or Edge (Desktop)
- Or use IndexedDB + manual exports

## Roadmap

### Completed (v1.0 - v1.2)
- [x] OAuth2/OIDC Cloud Sync
- [x] Auto-Login
- [x] Dashboard Entrypoint
- [x] Continuous Meter Validation
- [x] Conflict Resolution
- [x] Logo Header
- [x] PWA Icons
- [x] Dark Mode

### Planned
- [ ] Cost Calculation (Tariff management)
- [ ] Usage Predictions (Consumption forecasting)
- [ ] PDF Reports (Exportable reports with charts)
- [ ] Dashboard Widgets (Customizable dashboard)
- [ ] Meter Grouping (Group by location/property)

## License

MIT License - use it however you want!

## Contributing

PRs are welcome! For questions or issues, open an issue.

---

**Happy Metering!**
