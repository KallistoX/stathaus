# 🚀 StatHaus Quick Start

## Für VSCode + Docker Desktop (empfohlen für Mac)

### 1. Projekt öffnen
```bash
cd stathaus
code .
```

### 2. Docker Container starten
```bash
docker-compose up
```

✅ App läuft auf: http://localhost:5173
✅ Hot-reload aktiv (Änderungen werden sofort sichtbar)

### 3. Development
- Ändere Code in `src/`
- Browser lädt automatisch neu
- Komponenten in `src/components/`
- Views in `src/views/`
- Storage-Logik in `src/storage/`

### 4. Container stoppen
```bash
# Ctrl+C im Terminal
# Oder:
docker-compose down
```

## Wichtige Befehle

```bash
# Container im Hintergrund starten
docker-compose up -d

# Logs anschauen
docker-compose logs -f

# Container neu bauen (nach package.json Änderungen)
docker-compose up --build

# Container aufräumen
docker-compose down -v
```

## Production Build testen

```bash
# Production Image bauen
docker build -t stathaus:latest .

# Production Container starten
docker run -p 8080:80 stathaus:latest
```

✅ Production App: http://localhost:8080

## Ohne Docker

```bash
# Dependencies installieren
npm install

# Dev Server
npm run dev

# Production Build
npm run build

# Production Preview
npm run preview
```

## Projekt-Struktur verstehen

```
src/
├── storage/              ← 🔑 WICHTIG: Alle Speicher-Logik
│   ├── StorageAdapter.js      # Abstract Base Class
│   ├── IndexedDBAdapter.js    # Browser-Speicher
│   ├── FileSystemAdapter.js   # Dateisystem
│   └── DataManager.js         # Zentrale Datenverwaltung
│
├── stores/               ← Pinia State Management
│   └── dataStore.js           # Globaler State
│
├── views/                ← Seiten
│   ├── DashboardView.vue      # Hauptübersicht
│   ├── MetersView.vue         # Zählerliste
│   ├── MeterDetailView.vue    # Einzelner Zähler + Chart
│   └── SettingsView.vue       # Einstellungen + Storage
│
├── components/           ← Wiederverwendbare Komponenten
│   ├── AddMeterModal.vue
│   ├── AddMeterTypeModal.vue
│   └── QuickAddReadingModal.vue
│
└── router/               ← Vue Router
    └── index.js
```

## Features testen

### 1. IndexedDB (Browser-Speicher)
- ✅ Funktioniert sofort beim ersten Start
- ✅ Daten bleiben erhalten nach Page Reload
- ⚠️ Browser-Cache löschen entfernt Daten!

**Testen:**
1. App öffnen
2. Zählertyp anlegen (Einstellungen)
3. Zähler hinzufügen
4. Ablesung erfassen
5. Seite neu laden → Daten sind noch da

### 2. File System API (Dateisystem)
- ✅ Nur in Chrome/Edge Desktop
- ✅ Datei kann in Cloud-Ordner liegen

**Testen:**
1. Einstellungen → "Neue Datei"
2. Wähle z.B. `~/Documents/test.json`
3. Erfasse Daten
4. Öffne `test.json` in Editor → Daten sind da!
5. Ändere Datei extern → Reload → Änderungen geladen

### 3. Export/Import
**JSON Export testen:**
1. Erfasse einige Daten
2. Einstellungen → "Als JSON exportieren"
3. Datei wird heruntergeladen

**Import testen:**
1. Einstellungen → "JSON importieren"
2. Wähle die exportierte Datei
3. Daten werden wiederhergestellt

## Browser DevTools nutzen

### IndexedDB inspizieren
1. Chrome DevTools öffnen (F12)
2. Tab "Application"
3. Links: "Storage" → "IndexedDB" → "StatHausDB"
4. Siehe gespeicherte Daten

### Service Worker checken
1. Chrome DevTools → "Application"
2. "Service Workers"
3. Siehe PWA Status

## Häufige Probleme

### Port 5173 bereits belegt
```bash
# Container stoppen
docker-compose down

# Oder anderen Port nutzen (docker-compose.yml ändern)
ports:
  - "3000:5173"  # 3000 statt 5173
```

### Änderungen werden nicht geladen
```bash
# Hard Refresh im Browser
Cmd+Shift+R (Mac)
Ctrl+Shift+R (Windows)

# Oder Container neu bauen
docker-compose up --build
```

### "Module not found" Fehler
```bash
# Dependencies neu installieren
docker-compose down
docker volume rm stathaus_node_modules
docker-compose up --build
```

## Nächste Schritte

1. **Icons erstellen**: Siehe `public/ICONS_README.md`
2. **Code anpassen**: Starte mit `src/views/DashboardView.vue`
3. **Styling ändern**: `tailwind.config.js` für Farben
4. **Features erweitern**: Neue Charts in `MeterDetailView.vue`

## Support

Bei Fragen siehe README.md oder:
- Vue 3 Docs: https://vuejs.org
- Tailwind CSS: https://tailwindcss.com
- ECharts: https://echarts.apache.org

Happy Coding! 🎉