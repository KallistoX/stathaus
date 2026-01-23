# StatHaus Quick Start

## For VSCode + Docker Desktop (Recommended for Mac)

### 1. Open Project
```bash
cd stathaus
code .
```

### 2. Start Docker Container
```bash
docker-compose up
```

App runs at: http://localhost:5173
Hot-reload active (changes are visible immediately)

### 3. Development
- Edit code in `src/`
- Browser reloads automatically
- Components in `src/components/`
- Views in `src/views/`
- Local storage logic in `src/storage/`
- Cloud storage in `src/adapters/`
- Services in `src/services/`

### 4. Stop Container
```bash
# Ctrl+C in terminal
# Or:
docker-compose down
```

## Common Commands

```bash
# Start container in background
docker-compose up -d

# View logs
docker-compose logs -f

# Rebuild container (after package.json changes)
docker-compose up --build

# Clean up containers
docker-compose down -v
```

## Test Production Build

```bash
# Build production image
docker build -t stathaus:latest .

# Start production container
docker run -p 8080:80 stathaus:latest
```

Production app: http://localhost:8080

## Without Docker

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Production build
npm run build

# Production preview
npm run preview
```

## Backend Development

### Start Redis Locally
```bash
# With Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# Test connection
redis-cli ping
```

### Start Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
npm install
npm run dev
```

Backend runs at: http://localhost:3000

### Test Backend Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Readiness (Redis + OAuth)
curl http://localhost:3000/api/health/ready
```

## Project Structure

```
src/
├── storage/              # Local Storage Logic
│   ├── StorageAdapter.js      # Abstract base class
│   ├── IndexedDBAdapter.js    # Browser storage
│   └── DataManager.js         # Central data management
│
├── adapters/             # Cloud Storage
│   └── CloudStorageAdapter.js # Cloud sync adapter
│
├── services/             # Services
│   └── OAuthAuthService.js    # OAuth2/OIDC service
│
├── stores/               # Pinia State Management
│   └── dataStore.js           # Global state
│
├── views/                # Pages
│   ├── DashboardView.vue      # Main overview (start page)
│   ├── LaunchView.vue         # Launch/Loading screen
│   ├── MetersView.vue         # Meter list
│   ├── MeterDetailView.vue    # Single meter + chart
│   └── SettingsView.vue       # Settings + storage
│
├── components/           # Reusable Components
│   ├── AddMeterModal.vue
│   ├── AddMeterTypeModal.vue
│   ├── ConflictResolutionModal.vue
│   ├── ContinuousMeterWarningModal.vue
│   ├── EditMeterModal.vue
│   ├── OAuthCallback.vue
│   ├── QuickAddReadingModal.vue
│   └── SyncStatusIndicator.vue
│
└── router/               # Vue Router
    └── index.js
```

## Testing Features

### 1. IndexedDB (Browser Storage)
- Works immediately on first start
- Data persists after page reload
- Clearing browser cache removes data!

**Test:**
1. Open app
2. Create meter type (Settings)
3. Add meter
4. Record reading
5. Reload page → Data still there

### 2. File System API
- Chrome/Edge Desktop only
- File can be in cloud folder

**Test:**
1. Settings → "New File"
2. Select e.g. `~/Documents/test.json`
3. Record data
4. Open `test.json` in editor → Data is there!
5. Modify file externally → Reload → Changes loaded

### 3. Export/Import

**JSON Export:**
1. Record some data
2. Settings → "Export as JSON"
3. File downloads

**Import:**
1. Settings → "Import JSON"
2. Select exported file
3. Data restored

### 4. Cloud Sync
- Requires OAuth provider setup (see docs/OAUTH_SETUP.md)
- Requires backend deployment

**Test locally (with backend):**
1. Start backend (see above)
2. Configure OAuth provider
3. Settings → Cloud Sync → Sign in
4. Data syncs automatically
5. Sign in on another browser/device → Data synchronized

**Cloud Sync Features:**
- Automatic sync on changes
- Conflict detection and resolution
- Auto-login when authenticated (v1.2.0)

## Browser DevTools

### Inspect IndexedDB
1. Open Chrome DevTools (F12)
2. Tab "Application"
3. Left: "Storage" → "IndexedDB" → "StatHausDB"
4. View stored data

### Check Service Worker
1. Chrome DevTools → "Application"
2. "Service Workers"
3. See PWA status

## Common Issues

### Port 5173 already in use
```bash
# Stop container
docker-compose down

# Or use different port (edit docker-compose.yml)
ports:
  - "3000:5173"  # 3000 instead of 5173
```

### Changes not loading
```bash
# Hard refresh in browser
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows)

# Or rebuild container
docker-compose up --build
```

### "Module not found" error
```bash
# Reinstall dependencies
docker-compose down
docker volume rm stathaus_node_modules
docker-compose up --build
```

## Next Steps

1. **Create icons**: See `public/ICONS_README.md`
2. **Customize code**: Start with `src/views/DashboardView.vue`
3. **Change styling**: `tailwind.config.js` for colors
4. **Add features**: New charts in `MeterDetailView.vue`

## Resources

- Vue 3 Docs: https://vuejs.org
- Tailwind CSS: https://tailwindcss.com
- ECharts: https://echarts.apache.org
- Backend API: See `backend/README.md`
- OAuth Setup: See `docs/OAUTH_SETUP.md`

Happy Coding!
