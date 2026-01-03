/**
 * Service Worker para Push Notifications
 * 
 * Maneja notificaciones push y acciones offline.
 */

// Versión del service worker (incrementar cuando hay cambios)
const CACHE_VERSION = 'v1';
const CACHE_NAME = `inmova-${CACHE_VERSION}`;

// Recursos para cachear
const urlsToCache = [
  '/',
  '/dashboard',
  '/offline.html',
];

// ============================================================================
// INSTALACIÓN
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(urlsToCache);
    })
  );
  
  // Activar inmediatamente
  self.skipWaiting();
});

// ============================================================================
// ACTIVACIÓN
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Tomar control inmediatamente
  return self.clients.claim();
});

// ============================================================================
// FETCH (ESTRATEGIA: Network First, Cache Fallback)
// ============================================================================

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar response
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Si falla, intentar desde cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          
          // Si no está en cache, mostrar página offline
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        });
      })
  );
});

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Inmova',
    body: 'Nueva notificación',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    data: data.data || {},
    actions: data.actions || [],
    tag: data.type || 'general',
    requireInteraction: data.type === 'CRITICAL',
    vibrate: [200, 100, 200],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ============================================================================
// NOTIFICATION CLICK
// ============================================================================

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const url = data.url || '/dashboard';
  
  // Manejar acciones
  if (event.action) {
    console.log('[SW] Action clicked:', event.action);
    
    switch (event.action) {
      case 'view':
        // Abrir URL
        event.waitUntil(clients.openWindow(url));
        break;
      case 'dismiss':
        // Solo cerrar
        break;
      case 'pay':
        event.waitUntil(clients.openWindow('/dashboard/payments'));
        break;
      default:
        event.waitUntil(clients.openWindow(url));
    }
  } else {
    // Click en la notificación (no en acción)
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Buscar ventana ya abierta
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// ============================================================================
// NOTIFICATION CLOSE
// ============================================================================

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
  
  // Opcional: Enviar evento de analytics
  // fetch('/api/analytics/notification-closed', {
  //   method: 'POST',
  //   body: JSON.stringify({ tag: event.notification.tag }),
  // });
});

// ============================================================================
// SYNC (BACKGROUND SYNC)
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  // Implementar sincronización de acciones pendientes offline
  console.log('[SW] Syncing pending actions...');
}

// ============================================================================
// MESSAGE (COMUNICACIÓN CON EL CLIENTE)
// ============================================================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
