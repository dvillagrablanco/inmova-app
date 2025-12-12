/**
 * Hook personalizado para gestionar notificaciones push
 */

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones push
    const checkSupport = () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        checkSubscription();
      }
    };

    checkSupport();
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(subscription !== null);
    } catch (error) {
      logger.error('Error verificando suscripción push', { error });
    }
  };

  const subscribe = async () => {
    try {
      setIsLoading(true);

      // Solicitar permiso
      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        toast.error('Permiso de notificaciones denegado');
        return;
      }

      // Registrar service worker si no está registrado
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
      }

      // Obtener la clave pública VAPID
      const response = await fetch('/api/push/subscribe');
      const { publicKey } = await response.json();

      // Suscribirse a push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Enviar suscripción al servidor
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!subscribeResponse.ok) {
        throw new Error('Error al suscribirse en el servidor');
      }

      setIsSubscribed(true);
      toast.success('Notificaciones activadas correctamente');
      logger.info('Usuario suscrito a push notifications');
    } catch (error) {
      logger.error('Error suscribiendo a push notifications', { error });
      toast.error('No se pudo activar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.success('Notificaciones desactivadas');
        logger.info('Usuario desuscrito de push notifications');
      }
    } catch (error) {
      logger.error('Error desuscribiendo de push notifications', { error });
      toast.error('No se pudo desactivar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  };
}

/**
 * Convierte una clave VAPID de Base64 URL a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
