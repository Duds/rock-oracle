const CACHE = 'oracle-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/src/lib.js',
  '/src/pools.js',
];

self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  )
);

self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener('fetch', e => {
  // Always fetch API and font requests from the network — never cache them
  const url = e.request.url;
  if (url.includes('api.open-meteo.com') ||
      url.includes('marine-api.open-meteo.com') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
