const CACHE_VERSION = 'v2';
const STATIC_CACHE = `mfms-static-${CACHE_VERSION}`;
const API_CACHE = `mfms-api-${CACHE_VERSION}`;
const ASSET_CACHE = `mfms-assets-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `mfms-dynamic-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/pp-logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-icon-192x192.png',
  '/icons/maskable-icon-512x512.png'
];

const API_PATTERNS = [/\/api\//];

const STATIC_EXTENSIONS = /\.(js|css|woff2?|ttf|otf|eot)$/;

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg|ico|avif)$/;

const MAX_ENTRIES = 80;
const MAX_AGE_DAYS = 30;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return Promise.allSettled(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch(() => console.warn(`[SW] Failed to precache: ${url}`))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name.startsWith('mfms-') && !name.endsWith(CACHE_VERSION);
          })
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

async function isNetworkAvailable() {
  try {
    const response = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

async function getCachedOfflinePage() {
  const cache = await caches.open(STATIC_CACHE);
  return cache.match(OFFLINE_URL);
}

async function networkFirstWithTimeout(request, timeoutMs = 5000) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Network timeout')), timeoutMs)
  );

  try {
    const response = await Promise.race([
      fetch(request.clone()),
      timeoutPromise
    ]);

    if (response && response.ok) {
      const cache = await caches.open(API_CACHE);
      const clonedResponse = response.clone();
      event.waitUntil(cache.put(request, clonedResponse));
      return response;
    }

    throw new Error('Response not OK');
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ success: false, message: 'You are offline. Data may be outdated.', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request.clone());
    if (response && response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      const clonedResponse = response.clone();
      event.waitUntil(cache.put(request, clonedResponse));
    }
    return response;
  } catch {
    if (request.mode === 'navigate') {
      const offlinePage = await getCachedOfflinePage();
      if (offlinePage) return offlinePage;
    }
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    fetch(request.clone())
      .then((response) => {
        if (response && response.ok) {
          event.waitUntil(cache.put(request, response.clone()));
        }
      })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request.clone());
    if (response && response.ok) {
      event.waitUntil(cache.put(request, response.clone()));
    }
    return response;
  } catch {
    const staticCache = await caches.open(STATIC_CACHE);
    const offlinePage = await staticCache.match('/');
    if (offlinePage) return offlinePage;
    return fetch(request);
  }
}

async function imageCacheFirst(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    event.waitUntil(
      fetch(request.clone()).then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
      }).catch(() => {})
    );
    return cached;
  }

  try {
    const response = await fetch(request.clone());
    if (response && response.ok) {
      const clonedResponse = response.clone();
      event.waitUntil(cache.put(request, clonedResponse));
    }
    return response;
  } catch {
    return cached || new Response('', { status: 404 });
  }
}

function getCacheStrategy(url) {
  const pathname = new URL(url).pathname;

  if (API_PATTERNS.some((p) => p.test(pathname))) {
    return 'network-first';
  }

  if (STATIC_EXTENSIONS.test(pathname)) {
    return 'cache-first';
  }

  if (IMAGE_EXTENSIONS.test(pathname)) {
    return 'image-cache-first';
  }

  return 'stale-while-revalidate';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin && !API_PATTERNS.some((p) => p.test(url.pathname))) {
    return;
  }

  if (request.method !== 'GET') return;

  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
    return;
  }

  const strategy = getCacheStrategy(request.url);

  switch (strategy) {
    case 'network-first':
      event.respondWith(networkFirstWithTimeout(request));
      break;
    case 'cache-first':
      event.respondWith(cacheFirst(request));
      break;
    case 'image-cache-first':
      event.respondWith(imageCacheFirst(request));
      break;
    case 'stale-while-revalidate':
    default:
      event.respondWith(staleWhileRevalidate(request));
      break;
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(
          names.filter((n) => n.startsWith('mfms-')).map((n) => caches.delete(n))
        );
      })
    );
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New update available',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Membership Fee System', options)
    );
  } catch {
    const options = {
      body: event.data.text(),
      icon: '/icons/icon-192x192.png'
    };
    event.waitUntil(
      self.registration.showNotification('Membership Fee System', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  }
});

async function syncPayments() {
  try {
    const db = await openDB();
    const pendingPayments = await db.getAll('pendingPayments');
    for (const payment of pendingPayments) {
      try {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payment)
        });
        if (response.ok) {
          await db.delete('pendingPayments', payment.id);
        }
      } catch (err) {
        console.error('[SW] Sync failed for payment:', payment.id, err);
      }
    }
  } catch (err) {
    console.error('[SW] Background sync error:', err);
  }
}

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('mfms-offline', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingPayments')) {
        db.createObjectStore('pendingPayments', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
