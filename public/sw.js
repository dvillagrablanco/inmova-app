/**
 * Service Worker - Inmova App
 * 
 * Features:
 * - Offline support con cache strategies
 * - Background sync para peticiones fallidas
 * - Push notifications
 * - Precaching de assets críticos
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `inmova-${CACHE_VERSION}`;
const RUNTIME_CACHE = `inmova-runtime-${CACHE_VERSION}`;
const IMAGES_CACHE = `inmova-images-${CACHE_VERSION}`;
const API_CACHE = `inmova-api-${CACHE_VERSION}`;

// Assets críticos para precache
const PRECACHE_URLS = [
  '/',
  '/login',
  '/dashboard',
  '/offline',
  '/manifest.json',
  '/_next/static/css/*.css', // Will be matched by pattern
];

// Estrategias de cache
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',       // Cache first, network fallback
  NETWORK_FIRST: 'network-first',   // Network first, cache fallback
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate', // Cache immediately, update in background
  NETWORK_ONLY: 'network-only',     // Always network
  CACHE_ONLY: 'cache-only',         // Always cache
};

// ============================================================================
// INSTALL EVENT - Precache critical assets
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching critical assets');
      return cache.addAll(PRECACHE_URLS.filter(url => !url.includes('*')));
    }).then(() => {
      // Force activation immediately
      return self.skipWaiting();
    })
  );
});

// ============================================================================
// ACTIVATE EVENT - Clean old caches
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Delete old cache versions
            return cacheName.startsWith('inmova-') && cacheName !== CACHE_NAME;
          })
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// ============================================================================
// FETCH EVENT - Handle requests with cache strategies
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Determine strategy based on request type
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;

  if (request.destination === 'image') {
    strategy = CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  } else if (request.destination === 'script' || request.destination === 'style') {
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  } else if (url.pathname.startsWith('/api/')) {
    // API requests: network first with timeout
    strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  } else if (url.pathname.startsWith('/_next/static/')) {
    // Next.js static assets: cache first (immutable)
    strategy = CACHE_STRATEGIES.CACHE_FIRST;
  }

  event.respondWith(handleRequest(request, strategy));
});

// ============================================================================
// REQUEST HANDLERS BY STRATEGY
// ============================================================================

async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);
    default:
      return networkFirst(request);
  }
}

// Cache First: Check cache, then network
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network request failed, no cache available');
    return offlineResponse(request);
  }
}

// Network First: Try network, fallback to cache
async function networkFirst(request, timeout = 3000) {
  try {
    const networkPromise = fetch(request);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    );

    const response = await Promise.race([networkPromise, timeoutPromise]);

    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache...');
    const cached = await caches.match(request);
    return cached || offlineResponse(request);
  }
}

// Stale While Revalidate: Return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(IMAGES_CACHE);
      cache.then((c) => c.put(request, response.clone()));
    }
    return response;
  });

  // Return cached immediately if available
  return cached || fetchPromise;
}

// Offline response
function offlineResponse(request) {
  const url = new URL(request.url);

  // HTML pages: redirect to offline page
  if (request.headers.get('accept').includes('text/html')) {
    return caches.match('/offline') || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/html',
      }),
    });
  }

  // Images: return placeholder
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><text x="10" y="100">Offline</text></svg>',
      {
        headers: { 'Content-Type': 'image/svg+xml' },
      }
    );
  }

  // JSON: return error
  return new Response(JSON.stringify({ error: 'Offline' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================================================
// BACKGROUND SYNC - Retry failed requests
// ============================================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-failed-requests') {
    console.log('[SW] Syncing failed requests...');
    event.waitUntil(syncFailedRequests());
  }
});

async function syncFailedRequests() {
  const failedRequests = await getFailedRequests();

  for (const request of failedRequests) {
    try {
      await fetch(request);
      console.log('[SW] Synced request:', request.url);
    } catch (error) {
      console.log('[SW] Sync failed for:', request.url);
    }
  }
}

async function getFailedRequests() {
  // Implementation depends on IndexedDB storage
  return [];
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Inmova';
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    const url = event.notification.data || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// ============================================================================
// MESSAGE HANDLER - Communication with app
// ============================================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
