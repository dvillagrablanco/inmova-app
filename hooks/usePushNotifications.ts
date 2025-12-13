/**
 * Hook para gestionar notificaciones push en el cliente
 */

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { data: session } = useSession() || {};
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  // Verificar si las notificaciones push están soportadas
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setIsSupported(supported);

      if (supported && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  // Verificar estado de suscripción
  const checkSubscription = useCallback(async () => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  useEffect(() => {
    if (session?.user && isSupported) {
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, [session, isSupported, checkSubscription]);

  // Registrar service worker
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  };

  // Solicitar permiso de notificaciones
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Las notificaciones push no están soportadas en este navegador');
      return false;
    }

    if (!('Notification' in window)) {
      toast.error('Las notificaciones no están soportadas en este navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Permisos de notificaciones concedidos');
        return true;
      } else if (result === 'denied') {
        toast.error('Permisos de notificaciones denegados');
        return false;
      } else {
        toast.info('Permisos de notificaciones no concedidos');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Error solicitando permisos');
      return false;
    }
  };

  // Suscribirse a notificaciones push
  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Las notificaciones push no están soportadas');
      return false;
    }

    if (!session?.user) {
      toast.error('Debes iniciar sesión para habilitar notificaciones');
      return false;
    }

    try {
      // Verificar permisos
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          return false;
        }
      }

      // Registrar service worker si no está registrado
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await registerServiceWorker();
        if (!registration) {
          toast.error('No se pudo registrar el Service Worker');
          return false;
        }
      }

      await navigator.serviceWorker.ready;

      // Verificar si ya hay una suscripción
      let subscription = await registration.pushManager.getSubscription();

      // Si no hay suscripción, crear una nueva
      if (!subscription) {
        // Obtener la clave pública VAPID
        const response = await fetch('/api/push/vapid-keys');
        if (!response.ok) {
          throw new Error('No se pudo obtener la clave VAPID');
        }

        const { publicKey } = await response.json();

        // Convertir la clave pública de base64 a Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(publicKey);

        // Crear suscripción
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Enviar suscripción al servidor
      const saveResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscription })
      });

      if (!saveResponse.ok) {
        throw new Error('No se pudo guardar la suscripción');
      }

      setIsSubscribed(true);
      toast.success('Notificaciones push activadas');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Error al activar notificaciones push');
      return false;
    }
  };

  // Desuscribirse de notificaciones push
  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Desuscribir en el navegador
        await subscription.unsubscribe();

        // Eliminar del servidor
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        setIsSubscribed(false);
        toast.success('Notificaciones push desactivadas');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Error al desactivar notificaciones push');
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    requestPermission
  };
}

/**
 * Convierte una clave VAPID de base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
