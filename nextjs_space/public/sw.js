const CACHE_NAME = 'inmova-v1';
const STATIC_CACHE = 'inmova-static-v1';
const DYNAMIC_CACHE = 'inmova-dynamic-v1';
const API_CACHE = 'inmova-api-v1';

// Recursos estáticos para cachear durante la instalación
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
  '/manifest.json',
  '/inmova-logo-icon.jpg',
  '/inmova-logo-cover.jpg',
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Precaching static assets');
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests no HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Estrategia para API calls (Network First con fallback a cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Estrategia para recursos estáticos (Cache First)
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }

  // Estrategia para páginas HTML (Network First con offline fallback)
  if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Por defecto: Network First
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Estrategia Cache First
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  // Solo buscar en cache para peticiones GET
  if (request.method === 'GET') {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
  }

  try {
    const response = await fetch(request);
    // Solo cachear peticiones GET exitosas
    if (response.status === 200 && request.method === 'GET') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Fetch failed for:', request.url);
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Estrategia Network First
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    // Solo cachear peticiones GET exitosas
    if (response.status === 200 && request.method === 'GET') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Solo buscar en cache para peticiones GET
    if (request.method === 'GET') {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
    }
    console.log('[SW] Network failed for:', request.url);
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Estrategia Network First con página offline de respaldo
async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const response = await fetch(request);
    // Solo cachear peticiones GET exitosas
    if (response.status === 200 && request.method === 'GET') {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Solo buscar en cache para peticiones GET
    if (request.method === 'GET') {
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      
      // Si no hay caché, intentar devolver la página offline
      const offlinePage = await cache.match('/offline');
      if (offlinePage) {
        return offlinePage;
      }
    }
    
    // Último recurso: respuesta genérica
    return new Response(
      '<html><body><h1>Sin conexión</h1><p>Por favor, verifica tu conexión a internet.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {};
  
  try {
    notificationData = event.data ? event.data.json() : {};
  } catch (error) {
    notificationData = {
      title: 'INMOVA',
      body: event.data ? event.data.text() : 'Nueva notificación',
    };
  }

  const options = {
    body: notificationData.body || 'Tienes una nueva notificación',
    icon: '/inmova-logo-icon.jpg',
    badge: '/inmova-logo-icon.jpg',
    vibrate: [200, 100, 200],
    tag: notificationData.tag || 'inmova-notification',
    data: notificationData.data || {},
    requireInteraction: notificationData.requireInteraction || false,
    actions: notificationData.actions || [
      { action: 'open', title: 'Ver', icon: '/inmova-logo-icon.jpg' },
      { action: 'close', title: 'Cerrar', icon: '/inmova-logo-icon.jpg' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title || 'INMOVA', options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Obtener URL de la notificación o usar dashboard por defecto
  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Verificar si ya hay una ventana abierta
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      syncData()
    );
  }
});

async function syncData() {
  try {
    // Implementar lógica de sincronización
    console.log('[SW] Syncing data...');
    // Aquí puedes sincronizar datos pendientes cuando vuelva la conexión
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Manejo de mensajes del cliente
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
