# 🏠 StatHaus - Zählerstand-Erfassung

Eine Progressive Web App zur Erfassung und Verwaltung von Zählerständen für Strom, Wasser, Gas und mehr. Entwickelt mit Vue 3, komplett client-seitig - deine Daten bleiben bei dir!

## ✨ Features

### 📊 Flexible Zählerverwaltung
- **Dynamische Zählertypen**: Erstelle eigene Typen (Strom, Wasser, Gas, Heizöl, Solar, etc.)
- **Unbegrenzte Zähler**: Verwalte beliebig viele Zähler pro Typ
- **Detaillierte Ablesungen**: Erfasse Werte mit Zeitstempel und Notizen

### 💾 Zwei Speicher-Modi

#### 🔵 Browser-Speicher (IndexedDB)
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

##☁️ Production Deployment (Kubernetes)

StatHaus can be deployed to Kubernetes using Helm and automated with Ansible.

### Prerequisites
- Kubernetes cluster (K3s, K8s, etc.)
- Helm 3.x
- kubectl configured
- Ansible (for automated deployment)
- cert-manager installed (for TLS certificates)
- Ingress controller (nginx)

### Quick Deployment with Ansible

1. **Configure inventory**:
```bash
cp ansible/inventory/hosts.yml.example ansible/inventory/hosts.yml
# Edit hosts.yml with your server IP and domain
```

2. **Deploy**:
```bash
ansible-playbook ansible/playbooks/25-stathaus.yml -i ansible/inventory/hosts.yml
```

3. **Access your app**:
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

**Image tags**:
- `latest` - Latest main branch
- `v1.0.0` - Semantic version tags
- `main-abc123` - Commit SHA

### Updating to New Version

```bash
# With Ansible
ansible-playbook ansible/playbooks/25-stathaus.yml \
  -e image_tag=v1.0.1

# With Helm
helm upgrade stathaus ./helm \
  --namespace stathaus \
  --set image.tag=v1.0.1
```

### Production Features
- **Auto-scaling**: Ready for horizontal scaling (though single pod is sufficient)
- **Health checks**: Liveness and readiness probes configured
- **TLS/HTTPS**: Automatic Let's Encrypt certificates via cert-manager
- **Resource limits**: Conservative CPU (100m) and memory (128Mi) limits
- **Security**: Non-root nginx, read-only filesystem

### WebDAV Cloud Sync (Nextcloud)

The primary reason for production deployment is to enable WebDAV sync without CORS issues:

1. Deploy StatHaus to production (HTTPS required)
2. Access app at https://stathaus.your-domain.com
3. Go to Settings → Storage → Cloud-Sync (WebDAV)
4. Enter your Nextcloud URL
5. Click "Sign in with Nextcloud"
6. Complete Nextcloud login (MFA supported)
7. Data automatically syncs to `/StatHaus/stathaus-data.json`

**Why production?**: WebDAV Login Flow v2 requires HTTPS for both app and Nextcloud. Localhost development triggers CORS errors.

### Monitoring

```bash
# View logs
kubectl logs -n stathaus -l app.kubernetes.io/name=stathaus -f

# Check pod status
kubectl get pods -n stathaus -w

# Check certificate
kubectl describe certificate -n stathaus stathaus-tls
```

### Troubleshooting

**Pod won't start**:
```bash
kubectl describe pod -n stathaus -l app.kubernetes.io/name=stathaus
kubectl logs -n stathaus -l app.kubernetes.io/name=stathaus
```

**Certificate issues**:
```bash
kubectl get certificate -n stathaus
kubectl describe certificate -n stathaus stathaus-tls
kubectl logs -n cert-manager -l app=cert-manager
```

**WebDAV CORS errors** (shouldn't happen in production):
- Verify both StatHaus and Nextcloud use HTTPS
- Check Nextcloud config.php CORS settings
- Try manual authentication instead of Login Flow v2

## 🛠️ Technologie-Stack

- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **Styling**: Tailwind CSS
- **Charts**: Apache ECharts
- **PWA**: vite-plugin-pwa
- **Storage**: IndexedDB + File System Access API

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
├── src/
│   ├── assets/          # CSS und statische Assets
│   ├── components/      # Vue Komponenten
│   │   ├── AddMeterModal.vue
│   │   ├── AddMeterTypeModal.vue
│   │   └── QuickAddReadingModal.vue
│   ├── views/           # Seiten-Komponenten
│   │   ├── DashboardView.vue
│   │   ├── MetersView.vue
│   │   ├── MeterDetailView.vue
│   │   └── SettingsView.vue
│   ├── storage/         # Storage Layer
│   │   ├── StorageAdapter.js
│   │   ├── IndexedDBAdapter.js
│   │   ├── FileSystemAdapter.js
│   │   └── DataManager.js
│   ├── stores/          # Pinia Stores
│   │   └── dataStore.js
│   ├── router/          # Vue Router
│   │   └── index.js
│   ├── App.vue          # Haupt-Komponente
│   └── main.js          # Entry Point
├── public/              # Öffentliche Assets
├── docker-compose.yml   # Docker Development Setup
├── Dockerfile.dev       # Development Dockerfile
├── Dockerfile           # Production Dockerfile
├── vite.config.js       # Vite Konfiguration
├── tailwind.config.js   # Tailwind Konfiguration
└── package.json         # Dependencies
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