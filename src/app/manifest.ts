import type { MetadataRoute } from 'next';

// Makes the judge/scribe scoring screen installable as its own app so it's
// ready to open even with no signal — see docs/offline-mode-plan.md (Phase 2).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Field & Arena',
    short_name: 'F&A',
    description: 'Judge and scribe scoring — works even when the connection drops.',
    start_url: '/dashboard/judging',
    scope: '/',
    display: 'standalone',
    background_color: '#F5F7F6',
    theme_color: '#0D2C23',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
