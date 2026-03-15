'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  BellOff,
  Mail,
  Users,
  UserCheck,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle,
  Calendar,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { PageHeader, PageContainer } from '@/components/layout/page-header';

interface PaymentReminderConfig {
  paymentRemindersEnabled: boolean;
  paymentRemindersOverdueEnabled: boolean;
  paymentRemindersPreventiveEnabled: boolean;
  paymentRemindersSendToTenant: boolean;
  paymentRemindersSendToAdmin: boolean;
  paymentRemindersMinDaysOverdue: number;
  paymentRemindersPreventiveDays: number[];
}

const defaultConfig: PaymentReminderConfig = {
  paymentRemindersEnabled: false,
  paymentRemindersOverdueEnabled: true,
  paymentRemindersPreventiveEnabled: true,
  paymentRemindersSendToTenant: true,
  paymentRemindersSendToAdmin: true,
  paymentRemindersMinDaysOverdue: 3,
  paymentRemindersPreventiveDays: [7, 3, 1],
};

const AVAILABLE_DAYS = [1, 2, 3, 5, 7, 10, 14, 21, 30];

export default function ConfiguracionRecordatoriosPagoPage() {
  const { data: _session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<PaymentReminderConfig>(defaultConfig);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings/payment-reminders');
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setConfig({ ...defaultConfig, ...result.data });
        }
      }
    } catch {
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchConfig();
    }
  }, [status, router, fetchConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/settings/payment-reminders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success('Configuración guardada');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Error al guardar');
      }
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const togglePreventiveDay = (day: number) => {
    setConfig((prev) => {
      const days = prev.paymentRemindersPreventiveDays.includes(day)
        ? prev.paymentRemindersPreventiveDays.filter((d) => d !== day)
        : [...prev.paymentRemindersPreventiveDays, day].sort((a, b) => b - a);
      return { ...prev, paymentRemindersPreventiveDays: days };
    });
  };

  const removePreventiveDay = (day: number) => {
    setConfig((prev) => ({
      ...prev,
      paymentRemindersPreventiveDays: prev.paymentRemindersPreventiveDays.filter((d) => d !== day),
    }));
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <PageContainer>
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </PageContainer>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <PageContainer>
        <PageHeader
          title="Recordatorios de Pago"
          description="Configura el envío automático de recordatorios de pago a inquilinos y administradores"
        />

        <div className="space-y-6 max-w-3xl">
          {/* Control maestro */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {config.paymentRemindersEnabled ? (
                    <Bell className="h-5 w-5 text-primary" />
                  ) : (
                    <BellOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <CardTitle>Envío automático de recordatorios</CardTitle>
                    <CardDescription>
                      Activa o desactiva todos los recordatorios de pago automáticos
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={config.paymentRemindersEnabled}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({ ...prev, paymentRemindersEnabled: checked }))
                  }
                />
              </div>
            </CardHeader>
            {!config.paymentRemindersEnabled && (
              <CardContent>
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm">
                    Los recordatorios automáticos están desactivados. No se enviarán emails ni
                    notificaciones de pago a inquilinos ni administradores.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {config.paymentRemindersEnabled && (
            <>
              {/* Recordatorios de pagos atrasados */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <CardTitle className="text-lg">Pagos atrasados</CardTitle>
                        <CardDescription>
                          Recordatorios para pagos que ya superaron la fecha de vencimiento
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config.paymentRemindersOverdueEnabled}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, paymentRemindersOverdueEnabled: checked }))
                      }
                    />
                  </div>
                </CardHeader>
                {config.paymentRemindersOverdueEnabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="minDaysOverdue" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Días mínimos de atraso para enviar recordatorio
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="minDaysOverdue"
                          type="number"
                          min={1}
                          max={90}
                          value={config.paymentRemindersMinDaysOverdue}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              paymentRemindersMinDaysOverdue: parseInt(e.target.value) || 3,
                            }))
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">días</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Se enviarán recordatorios progresivos (amistoso, firme, urgente, legal) a
                        partir de este número de días.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Recordatorios preventivos */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <CardTitle className="text-lg">Recordatorios preventivos</CardTitle>
                        <CardDescription>Recordatorios antes de que el pago venza</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config.paymentRemindersPreventiveEnabled}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({
                          ...prev,
                          paymentRemindersPreventiveEnabled: checked,
                        }))
                      }
                    />
                  </div>
                </CardHeader>
                {config.paymentRemindersPreventiveEnabled && (
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Enviar recordatorio X días antes del vencimiento
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {config.paymentRemindersPreventiveDays
                          .sort((a, b) => b - a)
                          .map((day) => (
                            <Badge key={day} variant="default" className="gap-1 px-3 py-1">
                              {day} {day === 1 ? 'día' : 'días'}
                              <button
                                onClick={() => removePreventiveDay(day)}
                                className="ml-1 hover:text-red-300"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {AVAILABLE_DAYS.filter(
                          (d) => !config.paymentRemindersPreventiveDays.includes(d)
                        ).map((day) => (
                          <Badge
                            key={day}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary/10 px-3 py-1"
                            onClick={() => togglePreventiveDay(day)}
                          >
                            + {day} {day === 1 ? 'día' : 'días'}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Selecciona cuántos días antes del vencimiento se envía un recordatorio al
                        inquilino.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Destinatarios */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-green-500" />
                    <div>
                      <CardTitle className="text-lg">Destinatarios</CardTitle>
                      <CardDescription>
                        Controla quién recibe los recordatorios por email
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label>Enviar al inquilino</Label>
                        <p className="text-xs text-muted-foreground">
                          El inquilino recibe un email con los detalles del pago pendiente
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config.paymentRemindersSendToTenant}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, paymentRemindersSendToTenant: checked }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <Label>Enviar al administrador</Label>
                        <p className="text-xs text-muted-foreground">
                          Los administradores reciben una alerta con el resumen del pago atrasado
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={config.paymentRemindersSendToAdmin}
                      onCheckedChange={(checked) =>
                        setConfig((prev) => ({ ...prev, paymentRemindersSendToAdmin: checked }))
                      }
                    />
                  </div>

                  {!config.paymentRemindersSendToTenant && !config.paymentRemindersSendToAdmin && (
                    <>
                      <Separator />
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                        <p className="text-sm">
                          Ambos destinatarios están desactivados. Los recordatorios solo generarán
                          notificaciones internas en la plataforma.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Botón de guardar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              Los cambios se aplican inmediatamente al siguiente ciclo de recordatorios
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AuthenticatedLayout>
  );
}
