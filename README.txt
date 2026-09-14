DH Manager AI - Full upload pack

Upload the included app and public folders to your GitHub repository root.

This pack does two things:
1. Replaces public/dh-agency-logo.jpeg with the exact image you uploaded.
2. Adds the PWA manifest and Android app icons.

Files:
- app/manifest.ts
- public/dh-agency-logo.jpeg
- public/icon-192.png
- public/icon-512.png
- public/icon-maskable-512.png

After Vercel redeploys, the website header logo will use the new uploaded logo because app/page.tsx already references /dh-agency-logo.jpeg.
