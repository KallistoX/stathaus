# PWA Icons erstellen

Für eine vollständige PWA benötigst du Icons in verschiedenen Größen.
Platziere diese im `/public` Verzeichnis.

## Benötigte Icons:

1. **favicon.svg** (32x32)
   - Wird in der Browser-Tab angezeigt

2. **pwa-192x192.png** (192x192)
   - Standard PWA Icon
   - Wird beim "Add to Home Screen" verwendet

3. **pwa-512x512.png** (512x512)
   - Hochauflösendes Icon
   - Für moderne Devices

4. **apple-touch-icon.png** (180x180)
   - Für iOS "Add to Home Screen"

## Schnell Icons erstellen:

### Option 1: Online Tool
Nutze https://realfavicongenerator.net/
- Lade dein Logo hoch
- Generiere alle Größen automatisch

### Option 2: Figma/Photoshop
1. Erstelle ein 512x512 Design mit dem 🏠 Emoji
2. Nutze blauen Hintergrund (#3b82f6)
3. Exportiere in allen benötigten Größen

### Option 3: Placeholder
Für Development kannst du auch einfach farbige Quadrate nutzen:

```bash
# Mit ImageMagick (falls installiert):
convert -size 192x192 xc:#3b82f6 public/pwa-192x192.png
convert -size 512x512 xc:#3b82f6 public/pwa-512x512.png
convert -size 180x180 xc:#3b82f6 public/apple-touch-icon.png
```

## Aktuelle Placeholder

Im Moment hat das Projekt Placeholder-Referenzen.
Die App funktioniert auch ohne die tatsächlichen Icon-Dateien,
zeigt aber Warnungen in der Console.

Für Production: Erstelle echte Icons!