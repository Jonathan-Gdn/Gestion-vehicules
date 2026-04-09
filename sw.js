const CACHE_NAME = 'mongarage-v1';
const ASSETS = [
  './app.html',
  './manifest.json',
  './icon-180.png',
  './icon-512.png'
];

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
  // Skip caching for API calls (Firebase, Google APIs, auth)
  if (url.includes('googleapis.com') || url.includes('firebaseio.com') ||
      url.includes('identitytoolkit') || url.includes('securetoken') ||
      url.includes('firebasestorage') || url.includes('accounts.google.com') ||
      url.includes('/__/auth/') || url.includes('cdn.jsdelivr.net') ||
      url.includes('tessdata.projectnaptha.com')) {
    return;
  }
  // Network first, fallback to cache (for offline support)
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put(e.request, clone)); }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
