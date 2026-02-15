'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Bell, Mail, MessageSquare, AlertCircle, CheckCircle, Save, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { PageHeader, PageContainer } from '@/components/layout/page-header';
import logger, { logError } from '@/lib/logger';

interface NotificationPreferences {
  // Notificaciones Push
  pushEnabled: boolean;
  pushPayments: boolean;
  pushContracts: boolean;
  pushMaintenance: boolean;
  pushMessages: boolean;

  // Notificaciones Email
  emailEnabled: boolean;
  emailPayments: boolean;
  emailContracts: boolean;
  emailMaintenance: boolean;
  emailMessages: boolean;
  emailDigest: 'none' | 'daily' | 'weekly';

  // Notificaciones SMS
  smsEnabled: boolean;
  smsPayments: boolean;
  smsContracts: boolean;
  smsMaintenance: boolean;
  smsUrgentOnly: boolean;

  // Configuración general
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  pushPayments: true,
  pushContracts: true,
  pushMaintenance: true,
  pushMessages: true,

  emailEnabled: true,
  emailPayments: true,
  emailContracts: true,
  emailMaintenance: true,
  emailMessages: true,
  emailDigest: 'daily',

  smsEnabled: false,
  smsPayments: false,
  smsContracts: false,
  smsMaintenance: false,
  smsUrgentOnly: true,

  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

export default function ConfiguracionNotificacionesPage() {
  const { data: _session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchPreferences();
      checkPushSupport();
    }
  }, [status, router]);

  const checkPushSupport = () => {
    if ('Notification' in window) {
      setPushSupported(true);
      setPushPermission(Notification.permission);
    }
  };

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notification-preferences');
      if (response.ok) {
        const data = await response.json();
        setPreferences({ ...defaultPreferences, ...data });
      }
    } catch (error) {
      logger.error('Error fetching preferences:', error);
      toast.error('Error al cargar preferencias');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast.success('Preferencias guardadas exitosamente');
      } else {
        toast.error('Error al guardar preferencias');
      }
    } catch (error) {
      logger.error('Error saving preferences:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setSaving(false);
    }
  };

  const requestPushPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        toast.success('¡Notificaciones push habilitadas!');
        // Suscribir al servicio push
        await subscribeToPush();
      } else {
        toast.error('Permisos de notificaciones denegados');
      }
    } catch (error) {
      logger.error('Error requesting push permission:', error);
      toast.error('Error al solicitar permisos');
    }
  };

  const subscribeToPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Obtener clave pública VAPID
      const vapidResponse = await fetch('/api/push/public-key');
      const { publicKey } = await vapidResponse.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: publicKey,
      });

      // Enviar suscripción al servidor
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      logger.error('Error subscribing to push:', error);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: any) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <PageContainer maxWidth="4xl">
          <Skeleton className="h-10 w-full max-w-xs mb-4" />
          <Skeleton className="h-8 w-full max-w-md mb-2" />
          <Skeleton className="h-5 w-full max-w-lg mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </PageContainer>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <PageContainer maxWidth="4xl">
        <PageHeader
          title="Notificaciones"
          description="Personaliza cómo y cuándo quieres recibir notificaciones sobre tu actividad"
          icon={Bell}
          breadcrumbs={[
            { label: 'Configuración', href: '/configuracion' },
            { label: 'Notificaciones' },
          ]}
          showBackButton
          gradient
        />

            {/* Notificaciones Push */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <div>
                    <CardTitle>Notificaciones Push</CardTitle>
                    <CardDescription>
                      Recibe notificaciones en tiempo real en tu navegador
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!pushSupported ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Tu navegador no soporta notificaciones push</AlertDescription>
                  </Alert>
                ) : pushPermission === 'denied' ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Has bloqueado las notificaciones. Debes habilitarlas desde la configuración de
                      tu navegador.
                    </AlertDescription>
                  </Alert>
                ) : pushPermission === 'default' ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        Necesitas habilitar las notificaciones push para recibir alertas en tiempo
                        real
                      </span>
                      <Button size="sm" onClick={requestPushPermission}>
                        Habilitar
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>¡Notificaciones push habilitadas!</AlertDescription>
                  </Alert>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activar notificaciones push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones instantáneas
                    </p>
                  </div>
                  <Switch
                    checked={preferences.pushEnabled}
                    onCheckedChange={(checked) => updatePreference('pushEnabled', checked)}
                    disabled={pushPermission !== 'granted'}
                  />
                </div>

                {preferences.pushEnabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Nuevos pagos</Label>
                        <Switch
                          checked={preferences.pushPayments}
                          onCheckedChange={(checked) => updatePreference('pushPayments', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Contratos y renovaciones</Label>
                        <Switch
                          checked={preferences.pushContracts}
                          onCheckedChange={(checked) => updatePreference('pushContracts', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Mantenimiento e incidencias</Label>
                        <Switch
                          checked={preferences.pushMaintenance}
                          onCheckedChange={(checked) =>
                            updatePreference('pushMaintenance', checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Mensajes y chat</Label>
                        <Switch
                          checked={preferences.pushMessages}
                          onCheckedChange={(checked) => updatePreference('pushMessages', checked)}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notificaciones Email */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <div>
                    <CardTitle>Notificaciones por Email</CardTitle>
                    <CardDescription>
                      Recibe un resumen de tu actividad por correo electrónico
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activar notificaciones por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe actualizaciones por correo
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailEnabled}
                    onCheckedChange={(checked) => updatePreference('emailEnabled', checked)}
                  />
                </div>

                {preferences.emailEnabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Nuevos pagos</Label>
                        <Switch
                          checked={preferences.emailPayments}
                          onCheckedChange={(checked) => updatePreference('emailPayments', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Contratos y renovaciones</Label>
                        <Switch
                          checked={preferences.emailContracts}
                          onCheckedChange={(checked) => updatePreference('emailContracts', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Mantenimiento e incidencias</Label>
                        <Switch
                          checked={preferences.emailMaintenance}
                          onCheckedChange={(checked) =>
                            updatePreference('emailMaintenance', checked)
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Mensajes y chat</Label>
                        <Switch
                          checked={preferences.emailMessages}
                          onCheckedChange={(checked) => updatePreference('emailMessages', checked)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Resumen por email</Label>
                      <Select
                        value={preferences.emailDigest}
                        onValueChange={(value) => updatePreference('emailDigest', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nunca</SelectItem>
                          <SelectItem value="daily">Diariamente</SelectItem>
                          <SelectItem value="weekly">Semanalmente</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Recibe un resumen consolidado de tu actividad
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notificaciones SMS */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <div>
                    <CardTitle>Notificaciones SMS</CardTitle>
                    <CardDescription>
                      Recibe alertas importantes por mensaje de texto
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Los mensajes SMS pueden tener costo adicional según tu plan
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activar notificaciones SMS</Label>
                    <p className="text-sm text-muted-foreground">Solo para alertas importantes</p>
                  </div>
                  <Switch
                    checked={preferences.smsEnabled}
                    onCheckedChange={(checked) => updatePreference('smsEnabled', checked)}
                  />
                </div>

                {preferences.smsEnabled && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Solo notificaciones urgentes</Label>
                        <Switch
                          checked={preferences.smsUrgentOnly}
                          onCheckedChange={(checked) => updatePreference('smsUrgentOnly', checked)}
                        />
                      </div>
                      {!preferences.smsUrgentOnly && (
                        <>
                          <div className="flex items-center justify-between">
                            <Label>Pagos importantes</Label>
                            <Switch
                              checked={preferences.smsPayments}
                              onCheckedChange={(checked) =>
                                updatePreference('smsPayments', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Vencimientos de contratos</Label>
                            <Switch
                              checked={preferences.smsContracts}
                              onCheckedChange={(checked) =>
                                updatePreference('smsContracts', checked)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Mantenimiento urgente</Label>
                            <Switch
                              checked={preferences.smsMaintenance}
                              onCheckedChange={(checked) =>
                                updatePreference('smsMaintenance', checked)
                              }
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Horario silencioso */}
            <Card>
              <CardHeader>
                <CardTitle>Horario Silencioso</CardTitle>
                <CardDescription>Pausa las notificaciones durante ciertas horas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activar horario silencioso</Label>
                    <p className="text-sm text-muted-foreground">
                      No recibirás notificaciones en este horario
                    </p>
                  </div>
                  <Switch
                    checked={preferences.quietHoursEnabled}
                    onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
                  />
                </div>

                {preferences.quietHoursEnabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Desde</Label>
                        <input
                          type="time"
                          value={preferences.quietHoursStart}
                          onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hasta</Label>
                        <input
                          type="time"
                          value={preferences.quietHoursEnd}
                          onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

        {/* Botones de acción sticky en móvil */}
        <div className="sticky bottom-20 sm:bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 -mx-4 sm:mx-0 sm:p-0 sm:bg-transparent sm:backdrop-blur-none border-t sm:border-0">
          <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={fetchPreferences} 
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <span className="animate-spin mr-2">⧖</span>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AuthenticatedLayout>
  );
}
