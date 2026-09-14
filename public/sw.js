// Minimal offline shell for the judge/scribe scoring screens.
// Scope: only /dashboard/scoring, /dashboard/judging, and their static assets —
// see docs/offline-mode-plan.md (Phase 2). The rest of the app (payments, live
// results, organizer tools) is deliberately left untouched by this cache.

const CACHE_NAME = 'fa-scoring-shell-v1';
const OFFLINE_SCOPES = ['/dashboard/scoring', '/dashboard/judging'];

function inScope(url) {
  return OFFLINE_SCOPES.some((p) => url.pathname.startsWith(p));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  const isStaticAsset = url.pathname.startsWith('/_next/static/');
  const isScoringNav = event.request.mode === 'navigate' && inScope(url);
  const isScoringApi = url.pathname.startsWith('/api/scoring/');

  if (!isStaticAsset && !isScoringNav && !isScoringApi) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const fresh = await fetch(event.request);
        if (fresh.ok) cache.put(event.request, fresh.clone());
        return fresh;
      } catch {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        throw new Error('offline and no cached response');
      }
    })(),
  );
});
