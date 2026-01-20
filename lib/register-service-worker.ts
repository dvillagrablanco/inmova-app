/**
 * Utilidad para Registrar Service Worker y Suscribirse a Push
 * 
 * Cliente-side only.
 */

/**
 * Registra el service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    logger.warn('Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('✅ Service Worker registered:', registration);
    return registration;
  } catch (error) {
    logger.error('❌ Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Solicita permiso para notificaciones push
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    logger.warn('Notifications not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  // Solicitar permiso
  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Suscribe al usuario a notificaciones push
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    // 1. Registrar service worker si no está registrado
    let registration = await navigator.serviceWorker.ready;
    if (!registration) {
      registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('Failed to register service worker');
      }
    }

    // 2. Solicitar permiso
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      logger.warn('Notification permission denied');
      return false;
    }

    // 3. Obtener VAPID public key
    const response = await fetch('/api/v1/push/vapid-public-key');
    if (!response.ok) {
      throw new Error('Failed to get VAPID public key');
    }
    const { publicKey } = await response.json();

    // 4. Suscribirse a push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // 5. Enviar suscripción al servidor
    const subResponse = await fetch('/api/v1/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!subResponse.ok) {
      throw new Error('Failed to save subscription on server');
    }

    console.log('✅ Subscribed to push notifications');
    return true;

  } catch (error) {
    logger.error('❌ Error subscribing to push:', error);
    return false;
  }
}

/**
 * Desuscribe de notificaciones push
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('No subscription found');
      return true;
    }

    // Desuscribirse
    await subscription.unsubscribe();

    // Notificar al servidor
    await fetch('/api/v1/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    console.log('✅ Unsubscribed from push notifications');
    return true;

  } catch (error) {
    logger.error('❌ Error unsubscribing from push:', error);
    return false;
  }
}

/**
 * Verifica si el usuario está suscrito
 */
export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;

  } catch (error) {
    logger.error('Error checking push subscription:', error);
    return false;
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Convierte base64 URL a Uint8Array para VAPID key
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
