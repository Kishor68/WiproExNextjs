const CACHE_NAME = 'acme-dashboard-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/login',
  '/dashboard',
  '/dashboard/invoices',
  '/dashboard/customers',
  '/dashboard/users',
  '/dashboard/profile',
  '/favicon.ico',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

function shouldHandleRequest(url) {
  return (
    !url.pathname.startsWith('/api') &&
    !url.pathname.startsWith('/_next/static') &&
    !url.pathname.startsWith('/_next/image') &&
    !url.pathname.includes('webpack-hmr') &&
    url.pathname !== '/sw.js' &&
    url.pathname !== '/manifest.webmanifest' &&
    url.pathname !== '/favicon.ico'
  );
}

function getCachedResponse(request, url) {
  return caches.match(request, { ignoreSearch: true }).then((response) => {
    if (response) return response;
    return caches.match(url.pathname);
  });
}

function makeOfflineResponse() {
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: { 'Content-Type': 'text/plain' },
  });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (!shouldHandleRequest(url)) {
    return;
  }

  const isRscRequest = url.searchParams.has('_rsc');
  const isDataRequest = url.pathname.startsWith('/_next/data');

  if (isRscRequest || isDataRequest) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request, { redirect: 'follow' })
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status >= 400) {
              return networkResponse;
            }
            const clone = networkResponse.clone();
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
              return networkResponse;
            });
          })
          .catch(() =>
            getCachedResponse(event.request, url).then((fallbackResponse) => {
              return fallbackResponse || caches.match('/login') || caches.match('/') || makeOfflineResponse();
            })
          );
      })
    );
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { redirect: 'follow' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok && !networkResponse.redirected) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() =>
          getCachedResponse(event.request, url).then((cachedResponse) => {
            return cachedResponse || caches.match('/login') || caches.match('/') || makeOfflineResponse();
          })
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request, { redirect: 'follow' })
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.redirected || networkResponse.status >= 400) {
            return networkResponse;
          }
          const clone = networkResponse.clone();
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
            return networkResponse;
          });
        })
        .catch(() =>
          getCachedResponse(event.request, url).then((fallbackResponse) => {
            return fallbackResponse || makeOfflineResponse();
          })
        );
    })
  );
});
