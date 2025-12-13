"use client";

import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-5 h-5" />
            Notificaciones Push
          </CardTitle>
          <CardDescription>
            Recibe notificaciones en tiempo real incluso cuando no estás en la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tu navegador no soporta notificaciones push. Considera usar Chrome, Firefox, Edge o Safari.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Concedido
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive">
            <BellOff className="w-3 h-3 mr-1" />
            Denegado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Sin configurar
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificaciones Push
            </CardTitle>
            <CardDescription>
              Recibe notificaciones en tiempo real incluso cuando no estás en la aplicación
            </CardDescription>
          </div>
          {getPermissionBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado de suscripción */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="push-toggle" className="font-medium">
              Activar notificaciones push
            </Label>
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'Recibirás notificaciones en este dispositivo'
                : 'No recibirás notificaciones en este dispositivo'}
            </p>
          </div>
          <Switch
            id="push-toggle"
            checked={isSubscribed}
            onCheckedChange={handleToggle}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {/* Información adicional */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Qué notificaciones recibirás:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Nuevas solicitudes de mantenimiento</li>
            <li>Actualizaciones de tareas asignadas</li>
            <li>Recordatorios de pagos</li>
            <li>Mensajes importantes del sistema</li>
            <li>Alertas de incidencias urgentes</li>
          </ul>
        </div>

        {/* Ayuda si los permisos están denegados */}
        {permission === 'denied' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Has denegado los permisos de notificaciones. Para habilitarlos:
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Haz clic en el icono de candado o información en la barra de direcciones</li>
                <li>Busca la configuración de "Notificaciones"</li>
                <li>Cambia el permiso a "Permitir"</li>
                <li>Recarga esta página</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Botón de prueba (solo visible si está suscrito) */}
        {isSubscribed && (
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              // Enviar notificación de prueba
              const response = await fetch('/api/push/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  userIds: ['current'], // Se puede implementar para enviar solo al usuario actual
                  title: '👋 Notificación de prueba',
                  body: 'Esta es una notificación de prueba de INMOVA',
                  url: '/dashboard',
                  tag: 'test'
                })
              });

              if (response.ok) {
                // La notificación se enviará a través del service worker
              }
            }}
          >
            <Bell className="w-4 h-4 mr-2" />
            Enviar notificación de prueba
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
