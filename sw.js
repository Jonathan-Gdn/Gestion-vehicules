const CACHE_NAME = 'mongarage-v3.3.6';
const ASSETS = [
  './app.html',
  './manifest.json',
  './icon-180.png',
  './icon-512.png'
];
const MAX_CACHE_ENTRIES = 50;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // Skip caching for API calls (Firebase, Google APIs, auth, CDN)
  if (url.includes('googleapis.com') || url.includes('firebaseio.com') ||
      url.includes('identitytoolkit') || url.includes('securetoken') ||
      url.includes('firebasestorage') || url.includes('accounts.google.com') ||
      url.includes('apis.google.com') || url.includes('www.gstatic.com') ||
      url.includes('/__/auth/') || url.includes('/__/firebase/') || url.includes('cdn.jsdelivr.net') ||
      url.includes('tessdata.projectnaptha.com') || url.includes('rapidapi.com') ||
      url.includes('unpkg.com') || url.includes('tile.openstreetmap.org') ||
      url.includes('cloudfunctions.net') || url.includes('data.economie.gouv.fr')) {
    return;
  }
  // Only cache same-origin requests
  if (new URL(url).origin !== self.location.origin) return;
  // Network first, fallback to cache (for offline support)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(async c => {
            await c.put(e.request, clone);
            // Evict oldest entries if cache exceeds limit
            const keys = await c.keys();
            const excess = keys.length - MAX_CACHE_ENTRIES;
            if (excess > 0) {
              await Promise.all(keys.slice(0, excess).map(k => c.delete(k)));
            }
          });
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
