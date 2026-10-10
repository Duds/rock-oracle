// Generated into dist/sw.js by scripts/generate-sw.js — do not edit by hand.
//
// Fetch strategy (ADR-0003):
//   HTML  -> network-first, cache fallback. A returning visitor gets the new
//            deploy; offline still works.
//   other -> cache-first, then network. Static assets are safe to serve stale
//            because the cache name is a content hash, so any change to any
//            file produces a new cache and drops the old one on activate.
//
// Weather API calls are never intercepted: a stale forecast is worse than none,
// and the app already has its own cache tiers for that (ADR-0004 in
// docs/persistence-contract.md).

const CACHE = '__CACHE_NAME__';
const PRECACHE = __PRECACHE__;

const NEVER_CACHE = [
  'api.open-meteo.com',
  'marine-api.open-meteo.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isHtml(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;
  if (NEVER_CACHE.some((host) => url.includes(host))) return;

  // Only handle same-origin requests. Anything else is the browser's business.
  if (new URL(url).origin !== self.location.origin) return;

  if (isHtml(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request, { ignoreSearch: true })
          .then((cached) => cached || caches.match('/', { ignoreSearch: true })))
    );
    return;
  }

  // ignoreSearch is load-bearing: the app imports `./src/pools.js?v=6`, and
  // caches.match does exact URL matching by default, so a query string would
  // otherwise never match the precached `src/pools.js` and offline would fail.
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetch(request))
  );
});
