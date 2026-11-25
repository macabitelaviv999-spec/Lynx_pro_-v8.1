// LYNX PRO v9.1 — Service Worker (Cache-First + Stale-While-Revalidate)
const CACHE_NAME = 'lynx-pro-v9.1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './app/',
  './app.html',
  './manifest.json',
  './app-manifest.json',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './app-icon-180.png',
  './app-icon-192.png',
  './app-icon-512.png',
  './preview.jpg',
  './app-preview.jpg',
  './updates.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((u) => cache.add(u)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Network-first for live updates & health endpoints
  if (url.pathname.endsWith('/updates.json') || url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Cache-first with Stale-While-Revalidate for app shell & assets
  event.respondWith(
    caches.match(req, { ignoreSearch: false }).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => null);

      if (cached) {
        event.waitUntil(networkFetch);
        return cached;
      }
      return networkFetch.then((res) => res || caches.match(req, { ignoreSearch: true }) || caches.match('./index.html'));
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'GET_CACHE_STATS') {
    event.waitUntil(
      caches.keys().then(async (keys) => {
        let totalItems = 0;
        for (const k of keys) {
          const c = await caches.open(k);
          const list = await c.keys();
          totalItems += list.length;
        }
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ caches: keys, totalItems });
        }
      })
    );
    return;
  }
  if (data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ cleared: true });
        }
      })
    );
  }
});
