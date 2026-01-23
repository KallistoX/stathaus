# PWA Icons - StatHaus

This directory contains all icons and logos for the StatHaus PWA.

## Current Icons (Production-Ready)

| File | Size | Purpose | Status |
|------|------|---------|--------|
| `favicon.ico` | 32x32 | Browser tab icon | Present |
| `pwa-192x192.png` | 192x192 | Standard PWA icon, also used as apple-touch-icon | Present |
| `pwa-384x384.png` | 384x384 | High-resolution icon | Present |
| `pwa-512x512.png` | 512x512 | Splash screen, store listing | Present |

## Logo Files

| File | Purpose |
|------|---------|
| `logo_with_text_blue.png` | Header logo (light mode) |
| `logo_with_text_white.png` | Header logo (dark mode / alternative) |

## Apple Touch Icon

The apple-touch-icon is configured in `index.html` to use `pwa-192x192.png`:

```html
<link rel="apple-touch-icon" href="/pwa-192x192.png">
```

## Regenerating Icons

If you need to create new icons:

### Option 1: Online Tool
Use https://realfavicongenerator.net/
- Upload your base logo
- Generate all sizes automatically

### Option 2: ImageMagick
```bash
# From existing 512x512 icon:
convert pwa-512x512.png -resize 192x192 pwa-192x192.png
convert pwa-512x512.png -resize 384x384 pwa-384x384.png
```

## Design Guidelines

- **Background color**: #3b82f6 (Tailwind blue-500)
- **Icon style**: Minimalist house symbol
- **Format**: PNG (except favicon.ico)

## PWA Manifest Configuration

Icons are configured in `vite.config.js` (vite-plugin-pwa):

```javascript
icons: [
  { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
  { src: 'pwa-384x384.png', sizes: '384x384', type: 'image/png' },
  { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
]
```
