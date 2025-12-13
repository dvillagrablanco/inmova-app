/**
 * Service Worker para notificaciones push
 */

const CACHE_NAME = 'inmova-push-v1';

// Instalación del service worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker instalado');
  self.skipWaiting();
});

// Activación del service worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  event.waitUntil(clients.claim());
});

// Manejo de notificaciones push
self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notificación', body: event.data.text() };
    }
  }

  const title = data.title || 'INMOVA';
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-72x72.png',
    image: data.image,
    data: {
      url: data.url || '/',
      notificationId: data.notificationId,
      ...data.metadata
    },
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Buscar si ya hay una ventana abierta
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
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

// Manejo de cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
});
