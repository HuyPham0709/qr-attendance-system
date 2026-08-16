// Simple service worker skeleton for Scanner PWA
// Caches app shell and serves from cache with network-fallback. Adjust ASSETS as needed.
const CACHE_NAME = 'scanner-pwa-v1';
const ASSETS = [
  '/',
  '/index.html'
  // add other static assets (icons, CSS, JS bundles) if desired
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => {
        if (k !== CACHE_NAME) return caches.delete(k);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        // put a copy in cache
        return caches.open(CACHE_NAME).then(cache => {
          try { cache.put(event.request, res.clone()); } catch (e) { /* opaque responses may fail */ }
          return res;
        });
      }).catch(() => caches.match('/index.html'));
    })
  );
});
