'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';

export function PushNotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verificar si el navegador soporta notificaciones
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      logger.error('Error checking subscription:', error);
    }
  };

  const subscribeToPush = async () => {
    try {
      setIsLoading(true);

      // Solicitar permiso de notificaciones
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast.error('Permiso de notificaciones denegado');
        return;
      }

      // Obtener service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Usar VAPID public key por defecto (en producción, obtenerlo del servidor)
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 
        'BEl62iUYgUivxIkv69yViEuiBIa-Ib37J8xYdLMPL4c';

      // Crear suscripción
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Guardar suscripción en el servidor
      const saveResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (saveResponse.ok) {
        setIsSubscribed(true);
        toast.success('Notificaciones activadas exitosamente');
      } else {
        toast.error('Error al activar notificaciones');
      }
    } catch (error: any) {
      logger.error('Error subscribing to push:', error);
      toast.error(error.message || 'Error al activar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    try {
      setIsLoading(true);

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Cancelar suscripción en el servidor
        await fetch('/api/push-notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        // Cancelar suscripción local
        await subscription.unsubscribe();
        setIsSubscribed(false);
        toast.success('Notificaciones desactivadas');
      }
    } catch (error: any) {
      logger.error('Error unsubscribing from push:', error);
      toast.error(error.message || 'Error al desactivar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Tu navegador no soporta notificaciones push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones Push del Navegador
        </CardTitle>
        <CardDescription>
          Recibe notificaciones importantes directamente en tu dispositivo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Estado</p>
            <div className="flex items-center gap-2">
              {isSubscribed ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <Badge variant="default">Activas</Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="secondary">Inactivas</Badge>
                </>
              )}
            </div>
          </div>
          <div>
            {isSubscribed ? (
              <Button
                variant="outline"
                onClick={unsubscribeFromPush}
                disabled={isLoading}
              >
                <BellOff className="h-4 w-4 mr-2" />
                Desactivar
              </Button>
            ) : (
              <Button onClick={subscribeToPush} disabled={isLoading}>
                <Bell className="h-4 w-4 mr-2" />
                Activar
              </Button>
            )}
          </div>
        </div>

        {permission === 'denied' && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              Has bloqueado las notificaciones. Para activarlas, debes permitirlas en la
              configuración de tu navegador.
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p>• Alertas de pagos pendientes</p>
          <p>• Solicitudes de mantenimiento</p>
          <p>• Vencimiento de contratos</p>
          <p>• Mensajes del chat</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Utility function para convertir VAPID key
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
