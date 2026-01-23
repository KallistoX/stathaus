# 🏠 StatHaus - Zählerstand-Erfassung

Eine Progressive Web App zur Erfassung und Verwaltung von Zählerständen für Strom, Wasser, Gas und mehr. Entwickelt mit Vue 3, komplett client-seitig - deine Daten bleiben bei dir!

## ✨ Features

### 📊 Flexible Zählerverwaltung
- **Dynamische Zählertypen**: Erstelle eigene Typen (Strom, Wasser, Gas, Heizöl, Solar, etc.)
- **Unbegrenzte Zähler**: Verwalte beliebig viele Zähler pro Typ
- **Detaillierte Ablesungen**: Erfasse Werte mit Zeitstempel und Notizen

### 💾 Drei Speicher-Modi

#### 🔵 Browser-Speicher (IndexedDB) - Standard
- ✅ Einfach und schnell
- ✅ Keine Konfiguration nötig
- ✅ Funktioniert offline
- ⚠️ Daten nur auf diesem Gerät

#### 📁 Dateisystem-Modus
- ✅ Geräteübergreifende Synchronisation
- ✅ Cloud-Sync möglich (Nextcloud, iCloud, Google Drive)
- ✅ Volle Kontrolle über deine Daten
- ✅ Manuelle Backups

**Beispiel Nextcloud-Workflow:**
```
1. Auf Device 1: Datei in ~/Nextcloud/stathaus-data.json erstellen
2. App nutzt diese Datei direkt
3. Nextcloud synct automatisch
4. Auf Device 2: Gleiche Datei öffnen → synchronisiert!
```

#### ☁️ Cloud-Sync mit OAuth (Empfohlen)
- ✅ Automatische Synchronisation
- ✅ Sichere Authentifizierung (Authentik, Keycloak, Auth0, Google, etc.)
- ✅ Geräteübergreifend verfügbar
- ✅ Keine manuelle Dateiverwaltung
- ✅ Funktioniert auf allen Geräten (iOS, Android, Desktop)

**Workflow:**
```
1. Einstellungen → Cloud-Sync → "Anmelden"
2. Mit OAuth-Provider einloggen (z.B. Authentik)
3. Daten werden automatisch synchronisiert
4. Auf anderem Gerät anmelden → Daten sofort verfügbar!
```

### 📈 Visualisierung
- Interaktive Charts mit ECharts
- Touch-optimiert für Mobile
- Zoom & Pan Support
- Verlaufs-Anzeige

### 📦 Export & Import
- **JSON Export**: Vollständiges Backup
- **CSV Export**: Für Excel/LibreOffice
- **JSON Import**: Backup wiederherstellen

### 🚀 Progressive Web App
- Installierbar auf Desktop & Mobile
- Funktioniert offline
- Native App-Experience

## ☁️ Production Deployment (Kubernetes)

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
- `v1.0.0` - Semantic version tags
- `main-abc123` - Commit SHA

### Updating to New Version

```bash
# With Ansible
ansible-playbook ansible/playbooks/25-stathaus.yml \
  -e image_tag=v1.0.1
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
- **Security**: Rate limiting, input validation, security headers
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
3. Go to Settings → Cloud-Sync
4. Click "Anmelden" (Sign in)
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

## 🛠️ Technologie-Stack

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
- **Security**: Helmet, express-rate-limit
- **Deployment**: Multi-stage Docker builds

## 🚀 Schnellstart mit Docker

### Voraussetzungen
- Docker Desktop (für Mac)
- VSCode (empfohlen)

### Development starten

1. **Repository klonen** (oder Ordner öffnen)
```bash
cd stathaus
```

2. **Docker Container starten**
```bash
docker-compose up
```

3. **App öffnen**
```
http://localhost:5173
```

Die App lädt automatisch neu bei Code-Änderungen (Hot Reload)!

### Production Build

```bash
# Production Image bauen
docker build -t stathaus:latest .

# Container starten
docker run -p 8080:80 stathaus:latest
```

App ist verfügbar unter `http://localhost:8080`

## 💻 Entwicklung ohne Docker

### Installation
```bash
npm install
```

### Dev Server starten
```bash
npm run dev
```

### Production Build erstellen
```bash
npm run build
```

### Production Preview
```bash
npm run preview
```

## 📁 Projekt-Struktur

```
stathaus/
├── src/                      # Frontend (Vue PWA)
│   ├── assets/               # CSS und statische Assets
│   ├── components/           # Vue Komponenten
│   │   ├── AddMeterModal.vue
│   │   ├── AddMeterTypeModal.vue
│   │   ├── OAuthCallback.vue
│   │   └── QuickAddReadingModal.vue
│   ├── views/                # Seiten-Komponenten
│   │   ├── DashboardView.vue
│   │   ├── MetersView.vue
│   │   ├── MeterDetailView.vue
│   │   └── SettingsView.vue
│   ├── adapters/             # Storage Adapters
│   │   ├── IndexedDBAdapter.js
│   │   ├── FileSystemAdapter.js
│   │   └── CloudStorageAdapter.js
│   ├── services/             # Services
│   │   ├── OAuthAuthService.js
│   │   └── StorageService.js
│   ├── stores/               # Pinia Stores
│   │   └── dataStore.js
│   ├── router/               # Vue Router
│   │   └── index.js
│   ├── App.vue               # Haupt-Komponente
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
├── public/                   # Public assets
├── docker-compose.yml        # Development setup
├── Dockerfile                # Frontend production image
├── nginx.conf                # Nginx config with /api proxy
├── vite.config.js            # Vite config
└── package.json              # Frontend dependencies
```

## 🎯 Verwendung

### Erste Schritte

1. **Zählertyp anlegen**
   - Gehe zu Einstellungen
   - Klicke auf "+ Typ hinzufügen"
   - Z.B. "Strom" mit Einheit "kWh" und Icon "⚡"

2. **Zähler hinzufügen**
   - Gehe zu "Zähler"
   - Klicke auf "+ Zähler hinzufügen"
   - Wähle Typ, gib Name und optional Zählernummer ein

3. **Ablesung erfassen**
   - Dashboard: Klicke auf "+ Ablesung erfassen"
   - Oder: Zählerdetails → "+ Ablesung"

4. **Charts anschauen**
   - Klicke auf einen Zähler
   - Siehe Verlaufs-Chart und alle Ablesungen

### Speicher-Modi wechseln

#### Von Browser → Datei
1. Einstellungen → Datenspeicherung
2. "Neue Datei" oder "Datei öffnen"
3. Wähle Speicherort (z.B. Nextcloud-Ordner)
4. Daten werden automatisch übernommen

#### Von Datei → Browser
1. Einstellungen → Browser-Speicher
2. "Wechseln" klicken
3. Daten werden übernommen

## 🔒 Privacy & Datenschutz

- ✅ **Keine Server-Kommunikation**: Alle Daten bleiben lokal
- ✅ **Kein Tracking**: Keine Analytics, keine Cookies
- ✅ **Open Source**: Code ist einsehbar
- ✅ **DSGVO-konform**: Keine personenbezogenen Daten auf Servern

## 🌐 Browser-Kompatibilität

| Feature | Chrome/Edge | Safari | Firefox |
|---------|-------------|--------|---------|
| IndexedDB | ✅ | ✅ | ✅ |
| File System API | ✅ Desktop | ❌ | ❌ |
| PWA Install | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ |

**Empfehlung**: Chrome/Edge Desktop für File System API Support

## 🔧 VSCode Setup (Optional)

### Empfohlene Extensions
- Vue Language Features (Volar)
- Tailwind CSS IntelliSense
- Docker

### Dev Container nutzen
```json
// .devcontainer/devcontainer.json
{
  "name": "StatHaus",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/app"
}
```

## 📦 Deployment

### Als Static Website
Nach `npm run build` ist die App in `dist/` bereit für:
- Netlify
- Vercel
- GitHub Pages
- Nginx
- Apache

### Mit Docker
```bash
# Image bauen
docker build -t stathaus:v1.0.0 .

# Auf Server deployen
docker run -d -p 80:80 stathaus:v1.0.0
```

## 🐛 Troubleshooting

### Docker läuft nicht auf Mac
```bash
# Docker Desktop installieren
brew install --cask docker

# Docker Desktop starten
open -a Docker
```

### Hot Reload funktioniert nicht
```bash
# In docker-compose.yml ist CHOKIDAR_USEPOLLING=true gesetzt
# Falls es trotzdem nicht funktioniert:
docker-compose down
docker-compose up --build
```

### Browser unterstützt File System API nicht
- Nutze Chrome oder Edge (Desktop)
- Oder nutze IndexedDB + manuelle Exports

## 🚀 Roadmap

- [ ] Dark Mode
- [ ] Mehrere Kostenberechnung (Tarife)
- [ ] Verbrauchsprognose
- [ ] Foto-Upload für Ablesungen
- [ ] PDF-Export für Berichte
- [ ] Multi-Immobilien Support
- [ ] Backup-Erinnerungen

## 📝 Lizenz

MIT License - nutze es wie du möchtest!

## 🤝 Beitragen

PRs sind willkommen! Bei Fragen oder Problemen öffne ein Issue.

---

**Happy Metering! 🎉**