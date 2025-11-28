/**
 * Servicio de Notificaciones Push del Navegador
 */

export const isPushNotificationSupported = () => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const registerServiceWorker = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error('Las notificaciones push no están soportadas en este navegador');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registrado:', registration);
    return registration;
  } catch (error) {
    console.error('Error al registrar Service Worker:', error);
    throw error;
  }
};

export const askUserPermission = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error('Las notificaciones push no están soportadas en este navegador');
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error al solicitar permisos de notificación:', error);
    throw error;
  }
};

export const getUserNotificationPermission = () => {
  if (!isPushNotificationSupported()) return 'default';
  return Notification.permission;
};

export const showLocalNotification = (
  title: string,
  body: string,
  url?: string
) => {
  if (!isPushNotificationSupported()) {
    console.warn('Las notificaciones no están soportadas');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body,
      icon: '/vidaro-logo-icon.jpg',
      badge: '/vidaro-logo-icon.jpg',
      vibrate: [200, 100, 200],
    });

    if (url) {
      notification.onclick = () => {
        window.open(url, '_blank');
      };
    }
  }
};

export const createNotificationSubscription = async () => {
  if (!isPushNotificationSupported()) {
    throw new Error('Las notificaciones push no están soportadas');
  }

  const registration = await navigator.serviceWorker.ready;
  
  // Verificar si ya existe una suscripción
  let subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
    // Crear nueva suscripción
    // Nota: En producción se necesitaría una VAPID key
    // Para este MVP, solo registramos el service worker
    console.log('Suscripción de notificaciones lista');
  }
  
  return subscription;
};

export const initializePushNotifications = async () => {
  try {
    if (!isPushNotificationSupported()) {
      console.warn('Las notificaciones push no están soportadas en este navegador');
      return null;
    }

    // Registrar service worker
    const registration = await registerServiceWorker();
    
    // Solicitar permisos si es necesario
    const permission = getUserNotificationPermission();
    
    if (permission === 'default') {
      await askUserPermission();
    }
    
    if (Notification.permission === 'granted') {
      // Crear suscripción
      const subscription = await createNotificationSubscription();
      return { registration, subscription };
    }
    
    return { registration, subscription: null };
  } catch (error) {
    console.error('Error al inicializar notificaciones push:', error);
    return null;
  }
};
