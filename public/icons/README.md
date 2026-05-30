# App icons

- `icon.svg` — primary vector mark (community + connection + marketplace motif).
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` — PWA / store placeholders.

## Regenerate PNGs from SVG (recommended before store submit)

```bash
# macOS (librsvg)
brew install librsvg
rsvg-convert -w 192 -h 192 public/icons/icon.svg -o public/icons/icon-192.png
rsvg-convert -w 512 -h 512 public/icons/icon.svg -o public/icons/icon-512.png
cp public/icons/icon-192.png public/icons/apple-touch-icon.png

# Or ImageMagick
convert -background none -resize 192x192 public/icons/icon.svg public/icons/icon-192.png
convert -background none -resize 512x512 public/icons/icon.svg public/icons/icon-512.png
```

Native iOS/Android shells (Capacitor / React Native) should import these assets into Xcode and Android `mipmap` folders post–v1.
