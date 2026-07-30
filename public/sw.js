const CACHE_NAME = 'axim-static-cache-v1';
const APP_PREFIX = '/games/daily-word-cipher';

const STATIC_ASSETS = [
  `${APP_PREFIX}/`,
  `${APP_PREFIX}/index.html`,
  `${APP_PREFIX}/manifest.json`
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Critical Guardrail: Do NOT cache the /api/ Cloudflare Worker routes
  if (url.pathname.startsWith(`${APP_PREFIX}/api/`)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache dynamic static assets like generated JS/CSS bundles
        if (event.request.method === 'GET' &&
            (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.svg'))) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Offline fallback can go here if needed
    })
  );
});
