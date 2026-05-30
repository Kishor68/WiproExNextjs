const CACHE_NAME = 'acme-dashboard-v3';
const PRECACHE_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/dashboard/invoices',
  '/dashboard/customers',
  '/dashboard/users',
  '/dashboard/profile',
  '/favicon.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
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
    url.origin === self.location.origin &&
    !url.pathname.startsWith('/api') &&
    !url.pathname.startsWith('/_next/static') &&
    !url.pathname.startsWith('/_next/image') &&
    !url.pathname.includes('webpack-hmr') &&
    url.pathname !== '/sw.js' &&
    url.pathname !== '/manifest.webmanifest' &&
    url.pathname !== '/favicon.ico'
  );
}

function fallbackResponse(request) {
  return caches.match(request, { ignoreSearch: true }).then((cached) => {
    if (cached) return cached;
    return caches.match('/login');
  })
  .then((loginCached) => {
    if (loginCached) return loginCached;
    return caches.match('/');
  })
  .then((rootCached) => rootCached || new Response('Offline', { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'text/plain' } }));
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  if (!shouldHandleRequest(url)) {
    return;
  }

  // Avoid intercepting the app root directly, since '/' may redirect to '/dashboard'
  // and navigation redirect responses can cause a fetch-mode mismatch in Chrome.
  if (event.request.mode === 'navigate' && url.pathname === '/') {
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
          if (!networkResponse || networkResponse.redirected || networkResponse.status >= 400) {
            return networkResponse;
          }
            const clone = networkResponse.clone();
            return caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).then(() => networkResponse);
          })
          .catch(() => fallbackResponse(event.request));
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
        .catch(() => fallbackResponse(event.request))
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
          return caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).then(() => networkResponse);
        })
        .catch(() => fallbackResponse(event.request));
    })
  );
});
