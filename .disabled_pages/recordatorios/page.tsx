'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Home, ArrowLeft, Bell, Plus, Mail, MessageSquare, Calendar, Clock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import logger, { logError } from '@/lib/logger';

interface Reminder {
  id: string;
  nombre: string;
  descripcion?: string;
  tipo: string;
  channel: string;
  frequency: string;
  diasAnticipacion: number;
  horaEnvio: string;
  activo: boolean;
  totalEnviados: number;
  ultimoEnvio?: string;
  proximoEnvio?: string;
}

function RecordatoriosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'pago_vencimiento',
    channel: 'email',
    frequency: 'once',
    diasAnticipacion: 7,
    horaEnvio: '09:00',
    tituloPlantilla: '',
    mensajePlantilla: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchReminders();
    }
  }, [status, router]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recordatorios');
      if (res.ok) {
        const data = await res.json();
        setReminders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar recordatorios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/recordatorios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Error al crear');

      toast.success('Recordatorio creado');
      setOpenDialog(false);
      fetchReminders();
      setForm({
        nombre: '',
        descripcion: '',
        tipo: 'pago_vencimiento',
        channel: 'email',
        frequency: 'once',
        diasAnticipacion: 7,
        horaEnvio: '09:00',
        tituloPlantilla: '',
        mensajePlantilla: '',
      });
    } catch (error) {
      toast.error('Error al crear recordatorio');
    }
  };

  const toggleActive = async (id: string, activo: boolean) => {
    try {
      await fetch('/api/recordatorios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, activo: !activo }),
      });
      toast.success('Recordatorio actualizado');
      fetchReminders();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-bg items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="gap-2 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Recordatorios Automáticos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Recordatorios</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reminders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reminders.filter((r) => r.activo).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reminders.reduce((sum, r) => sum + r.totalEnviados, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Próximos Envíos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reminders.filter((r) => r.activo && r.proximoEnvio).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Recordatorios Automáticos</h1>
              <p className="text-muted-foreground">
                Configura notificaciones automáticas para eventos importantes
              </p>
            </div>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Recordatorio
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Recordatorio Automático</DialogTitle>
                  <DialogDescription>
                    Configura un recordatorio automático para eventos importantes
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Nombre del Recordatorio</Label>
                      <Input
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        placeholder="Ej: Recordatorio de Pago"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        placeholder="Descripción opcional"
                      />
                    </div>

                    <div>
                      <Label>Tipo de Recordatorio</Label>
                      <Select
                        value={form.tipo}
                        onValueChange={(value) => setForm({ ...form, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pago_vencimiento">Pago Vencimiento</SelectItem>
                          <SelectItem value="contrato_expiracion">
                            Expiración de Contrato
                          </SelectItem>
                          <SelectItem value="mantenimiento_programado">
                            Mantenimiento Programado
                          </SelectItem>
                          <SelectItem value="inspeccion_pendiente">Inspección Pendiente</SelectItem>
                          <SelectItem value="documento_vencimiento">
                            Documento por Vencer
                          </SelectItem>
                          <SelectItem value="renovacion_seguro">Renovación de Seguro</SelectItem>
                          <SelectItem value="certificacion_expiracion">
                            Certificación por Expirar
                          </SelectItem>
                          <SelectItem value="reunion_proxima">Reunión Próxima</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Canal de Envío</Label>
                      <Select
                        value={form.channel}
                        onValueChange={(value) => setForm({ ...form, channel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="notification">Notificación</SelectItem>
                          <SelectItem value="all">Todos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Frecuencia</Label>
                      <Select
                        value={form.frequency}
                        onValueChange={(value) => setForm({ ...form, frequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="once">Una vez</SelectItem>
                          <SelectItem value="daily">Diario</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Días de Anticipación</Label>
                      <Input
                        type="number"
                        value={form.diasAnticipacion}
                        onChange={(e) =>
                          setForm({ ...form, diasAnticipacion: parseInt(e.target.value) })
                        }
                        min="1"
                        max="30"
                      />
                    </div>

                    <div>
                      <Label>Hora de Envío</Label>
                      <Input
                        type="time"
                        value={form.horaEnvio}
                        onChange={(e) => setForm({ ...form, horaEnvio: e.target.value })}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Título de la Plantilla</Label>
                      <Input
                        value={form.tituloPlantilla}
                        onChange={(e) => setForm({ ...form, tituloPlantilla: e.target.value })}
                        placeholder="Ej: Recordatorio de Pago Pendiente"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Mensaje de la Plantilla</Label>
                      <Textarea
                        value={form.mensajePlantilla}
                        onChange={(e) => setForm({ ...form, mensajePlantilla: e.target.value })}
                        placeholder="Mensaje del recordatorio (puedes usar variables como {{nombre}}, {{monto}}, {{fecha}})"
                        rows={4}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Recordatorio</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de Recordatorios */}
          <div className="grid grid-cols-1 gap-4">
            {reminders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No hay recordatorios configurados
                </CardContent>
              </Card>
            ) : (
              reminders.map((reminder) => (
                <Card key={reminder.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Bell className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-lg">{reminder.nombre}</h3>
                          {reminder.activo ? (
                            <Badge className="bg-green-500">Activo</Badge>
                          ) : (
                            <Badge variant="secondary">Inactivo</Badge>
                          )}
                        </div>

                        {reminder.descripcion && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {reminder.descripcion}
                          </p>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Canal</p>
                            <div className="flex items-center gap-1">
                              {reminder.channel === 'email' && <Mail className="h-4 w-4" />}
                              {reminder.channel === 'sms' && <MessageSquare className="h-4 w-4" />}
                              {reminder.channel === 'notification' && <Bell className="h-4 w-4" />}
                              <span className="font-medium capitalize">{reminder.channel}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Frecuencia</p>
                            <p className="font-medium capitalize">{reminder.frequency}</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Anticipación</p>
                            <p className="font-medium">{reminder.diasAnticipacion} días</p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Hora</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{reminder.horaEnvio}</span>
                            </div>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Total Enviados</p>
                            <p className="font-medium">{reminder.totalEnviados}</p>
                          </div>

                          {reminder.proximoEnvio && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Próximo Envío</p>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className="font-medium">
                                  {new Date(reminder.proximoEnvio).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={reminder.activo}
                          onCheckedChange={() => toggleActive(reminder.id, reminder.activo)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </AuthenticatedLayout>
  );
}

export default function RecordatoriosPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <RecordatoriosPage />
    </ErrorBoundary>
  );
}
