'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/lazy-dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Plus,
  Filter,
  X,
  ArrowLeft,
  Home,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  DollarSign,
  Wrench,
  Users,
  ClipboardCheck,
  FileText,
  Bell,
} from 'lucide-react';
import { Calendar, dateFnsLocalizer, View, Views } from '@/components/ui/lazy-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'sonner';
import {
  format as formatDate,
  parse,
  startOfWeek,
  getDay,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
  endOfWeek,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import logger, { logError } from '@/lib/logger';

// Configurar date-fns localizer para react-big-calendar
const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format: formatDate,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  titulo: string;
  descripcion?: string;
  tipo: string;
  prioridad: string;
  fechaInicio: string;
  fechaFin?: string;
  todoElDia: boolean;
  ubicacion?: string;
  color?: string;
  completado: boolean;
  cancelado: boolean;
  building?: { nombre: string };
  unit?: { numero: string };
  tenant?: { nombreCompleto: string };
}

const TIPOS_EVENTO = [
  { value: 'pago', label: 'Pago', icon: DollarSign, color: '#10b981' },
  { value: 'vencimiento', label: 'Vencimiento', icon: FileText, color: '#f59e0b' },
  { value: 'visita', label: 'Visita', icon: Users, color: '#3b82f6' },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: Wrench, color: '#8b5cf6' },
  { value: 'inspeccion', label: 'Inspección', icon: ClipboardCheck, color: '#ec4899' },
  { value: 'reunion', label: 'Reunión', icon: Users, color: '#06b6d4' },
  { value: 'recordatorio', label: 'Recordatorio', icon: Bell, color: '#f59e0b' },
  { value: 'otro', label: 'Otro', icon: CalendarIcon, color: '#6b7280' },
];

const PRIORIDADES = [
  { value: 'baja', label: 'Baja', color: '#10b981' },
  { value: 'media', label: 'Media', color: '#3b82f6' },
  { value: 'alta', label: 'Alta', color: '#f59e0b' },
  { value: 'critica', label: 'Crítica', color: '#dc2626' },
];

export default function CalendarioPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  // Estados principales
  const [eventos, setEventos] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  // Initialize currentDate on client to avoid hydration errors
  useEffect(() => {
    if (!currentDate) {
      setCurrentDate(new Date());
    }
  }, [currentDate]);

  // Estados de filtros
  const [tiposFiltrados, setTiposFiltrados] = useState<string[]>([]);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estados de diálogos
  const [eventoSeleccionado, setEventoSeleccionado] = useState<CalendarEvent | null>(null);
  const [mostrarDialogoDetalles, setMostrarDialogoDetalles] = useState(false);
  const [mostrarDialogoNuevo, setMostrarDialogoNuevo] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'recordatorio',
    prioridad: 'media',
    fechaInicio: '',
    horaInicio: '09:00',
    fechaFin: '',
    horaFin: '10:00',
    todoElDia: false,
    ubicacion: '',
    color: '#3b82f6',
    notas: '',
    recordatorioActivo: false,
    recordatorioMinutos: '60',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      cargarEventos();
    }
  }, [session, currentDate, currentView]);

  const cargarEventos = async () => {
    if (!currentDate) return; // Wait for currentDate to be initialized

    try {
      setLoading(true);

      // Calcular el rango de fechas basado en la vista actual
      let start: Date, end: Date;

      if (currentView === Views.MONTH) {
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
      } else if (currentView === Views.WEEK) {
        start = startOfWeek(currentDate, { locale: es });
        end = endOfWeek(currentDate, { locale: es });
      } else {
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
      }

      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString(),
      });

      if (tiposFiltrados.length > 0) {
        params.append('tipo', tiposFiltrados.join(','));
      }

      const response = await fetch(`/api/calendar?${params}`);
      if (!response.ok) throw new Error('Error cargando eventos');

      const data = await response.json();
      setEventos(data);
    } catch (error) {
      logger.error('Error cargando eventos:', error);
      toast.error('Error al cargar los eventos');
    } finally {
      setLoading(false);
    }
  };

  const sincronizarEventos = async () => {
    try {
      setSincronizando(true);
      toast.info('Sincronizando eventos...');

      const response = await fetch('/api/calendar/sync', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Error en la sincronización');

      toast.success('Eventos sincronizados correctamente');
      cargarEventos();
    } catch (error) {
      logger.error('Error sincronizando:', error);
      toast.error('Error al sincronizar eventos');
    } finally {
      setSincronizando(false);
    }
  };

  const crearEvento = async () => {
    try {
      const fechaInicioCompleta = formData.todoElDia
        ? new Date(formData.fechaInicio)
        : new Date(`${formData.fechaInicio}T${formData.horaInicio}`);

      const fechaFinCompleta = formData.fechaFin
        ? formData.todoElDia
          ? new Date(formData.fechaFin)
          : new Date(`${formData.fechaFin}T${formData.horaFin}`)
        : undefined;

      const payload = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo: formData.tipo,
        prioridad: formData.prioridad,
        fechaInicio: fechaInicioCompleta.toISOString(),
        fechaFin: fechaFinCompleta?.toISOString(),
        todoElDia: formData.todoElDia,
        ubicacion: formData.ubicacion,
        color: formData.color,
        notas: formData.notas,
        recordatorioActivo: formData.recordatorioActivo,
        recordatorioMinutos: formData.recordatorioActivo
          ? parseInt(formData.recordatorioMinutos)
          : undefined,
      };

      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Error creando evento');

      toast.success('Evento creado correctamente');
      setMostrarDialogoNuevo(false);
      resetFormData();
      cargarEventos();
    } catch (error) {
      logger.error('Error creando evento:', error);
      toast.error('Error al crear el evento');
    }
  };

  const marcarEventoCompletado = async (eventoId: string) => {
    try {
      const response = await fetch(`/api/calendar/${eventoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completado: true }),
      });

      if (!response.ok) throw new Error('Error actualizando evento');

      toast.success('Evento marcado como completado');
      setMostrarDialogoDetalles(false);
      cargarEventos();
    } catch (error) {
      logger.error('Error actualizando evento:', error);
      toast.error('Error al actualizar el evento');
    }
  };

  const cancelarEvento = async (eventoId: string) => {
    try {
      const response = await fetch(`/api/calendar/${eventoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelado: true }),
      });

      if (!response.ok) throw new Error('Error cancelando evento');

      toast.success('Evento cancelado');
      setMostrarDialogoDetalles(false);
      cargarEventos();
    } catch (error) {
      logger.error('Error cancelando evento:', error);
      toast.error('Error al cancelar el evento');
    }
  };

  const resetFormData = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'recordatorio',
      prioridad: 'media',
      fechaInicio: '',
      horaInicio: '09:00',
      fechaFin: '',
      horaFin: '10:00',
      todoElDia: false,
      ubicacion: '',
      color: '#3b82f6',
      notas: '',
      recordatorioActivo: false,
      recordatorioMinutos: '60',
    });
  };

  // Convertir eventos al formato de react-big-calendar
  const eventosCalendario = useMemo(() => {
    return eventos.map((evento) => ({
      id: evento.id,
      title: evento.titulo,
      start: new Date(evento.fechaInicio),
      end: evento.fechaFin ? new Date(evento.fechaFin) : new Date(evento.fechaInicio),
      allDay: evento.todoElDia,
      resource: evento,
    }));
  }, [eventos]);

  // Personalizar el estilo de los eventos
  const eventStyleGetter = useCallback((event: any) => {
    const recurso = event.resource as CalendarEvent;

    let backgroundColor = recurso.color || '#3b82f6';
    let opacity = 1;

    if (recurso.completado) {
      opacity = 0.5;
      backgroundColor = '#10b981';
    } else if (recurso.cancelado) {
      opacity = 0.3;
      backgroundColor = '#6b7280';
    }

    return {
      style: {
        backgroundColor,
        opacity,
        borderRadius: '4px',
        border: 'none',
        color: 'white',
        fontSize: '0.875rem',
        padding: '2px 4px',
      },
    };
  }, []);

  const toggleTipoFiltro = (tipo: string) => {
    setTiposFiltrados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  // Calcular KPIs
  const kpis = useMemo(() => {
    const hoy = new Date();
    const proximasHoras = new Date(hoy.getTime() + 24 * 60 * 60 * 1000);

    return {
      total: eventos.length,
      pendientes: eventos.filter((e) => !e.completado && !e.cancelado).length,
      completados: eventos.filter((e) => e.completado).length,
      proximas24h: eventos.filter((e) => {
        const fecha = new Date(e.fechaInicio);
        return fecha >= hoy && fecha <= proximasHoras && !e.completado && !e.cancelado;
      }).length,
    };
  }, [eventos]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-muted/30">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <LoadingState message="Cargando calendario..." />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al Dashboard
                  </Button>
                </div>

                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">
                        <Home className="h-4 w-4" />
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Calendario Unificado</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                <h1 className="mt-2 text-2xl font-bold md:text-3xl">📅 Calendario Unificado</h1>
                <p className="text-muted-foreground">
                  Todos los eventos del sistema en un solo lugar
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarFiltros(!mostrarFiltros)}
                  className="gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  {tiposFiltrados.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {tiposFiltrados.length}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={sincronizarEventos}
                  disabled={sincronizando}
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${sincronizando ? 'animate-spin' : ''}`} />
                  Sincronizar
                </Button>

                <Button size="sm" onClick={() => setMostrarDialogoNuevo(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Evento
                </Button>
              </div>
            </div>

            {/* KPIs */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Eventos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpis.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{kpis.pendientes}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Próximas 24h
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{kpis.proximas24h}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{kpis.completados}</div>
                </CardContent>
              </Card>
            </div>

            {/* Panel de filtros */}
            {mostrarFiltros && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Filtros</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setMostrarFiltros(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="mb-3 block text-sm font-medium">Tipos de Evento</Label>
                      <div className="flex flex-wrap gap-2">
                        {TIPOS_EVENTO.map((tipo) => {
                          const Icon = tipo.icon;
                          const activo = tiposFiltrados.includes(tipo.value);

                          return (
                            <Button
                              key={tipo.value}
                              variant={activo ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleTipoFiltro(tipo.value)}
                              className="gap-2"
                              style={activo ? { backgroundColor: tipo.color } : undefined}
                            >
                              <Icon className="h-4 w-4" />
                              {tipo.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {tiposFiltrados.length > 0 && (
                      <div className="flex items-center justify-between border-t pt-4">
                        <span className="text-sm text-muted-foreground">
                          {tiposFiltrados.length} filtro(s) activo(s)
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setTiposFiltrados([])}>
                          Limpiar filtros
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendario */}
            <Card>
              <CardContent className="p-4">
                <div style={{ height: 'calc(100vh - 450px)', minHeight: '500px' }}>
                  {/* @ts-ignore */}
                  <Calendar
                    localizer={localizer}
                    events={eventosCalendario}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    onSelectEvent={(event) => {
                      setEventoSeleccionado(event.resource);
                      setMostrarDialogoDetalles(true);
                    }}
                    onView={(view) => setCurrentView(view)}
                    onNavigate={(date) => setCurrentDate(date)}
                    view={currentView}
                    views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                    eventPropGetter={eventStyleGetter}
                    messages={{
                      next: 'Siguiente',
                      previous: 'Anterior',
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día',
                      agenda: 'Agenda',
                      date: 'Fecha',
                      time: 'Hora',
                      event: 'Evento',
                      noEventsInRange: 'No hay eventos en este rango',
                      showMore: (total) => `+ Ver más (${total})`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Diálogo de detalles del evento */}
            <Dialog open={mostrarDialogoDetalles} onOpenChange={setMostrarDialogoDetalles}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {eventoSeleccionado && (
                      <>
                        {TIPOS_EVENTO.find((t) => t.value === eventoSeleccionado.tipo)?.icon &&
                          (() => {
                            const Icon = TIPOS_EVENTO.find(
                              (t) => t.value === eventoSeleccionado.tipo
                            )!.icon;
                            return <Icon className="h-5 w-5" />;
                          })()}
                        {eventoSeleccionado.titulo}
                      </>
                    )}
                  </DialogTitle>
                </DialogHeader>

                {eventoSeleccionado && (
                  <div className="space-y-4">
                    {/* Estado */}
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={eventoSeleccionado.completado ? 'default' : 'secondary'}
                        className="gap-1"
                      >
                        {eventoSeleccionado.completado ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Completado
                          </>
                        ) : eventoSeleccionado.cancelado ? (
                          <>
                            <XCircle className="h-3 w-3" />
                            Cancelado
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </>
                        )}
                      </Badge>

                      <Badge variant="outline">
                        {TIPOS_EVENTO.find((t) => t.value === eventoSeleccionado.tipo)?.label}
                      </Badge>

                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: PRIORIDADES.find(
                            (p) => p.value === eventoSeleccionado.prioridad
                          )?.color,
                          color: 'white',
                          borderColor: PRIORIDADES.find(
                            (p) => p.value === eventoSeleccionado.prioridad
                          )?.color,
                        }}
                      >
                        Prioridad:{' '}
                        {PRIORIDADES.find((p) => p.value === eventoSeleccionado.prioridad)?.label}
                      </Badge>
                    </div>

                    {/* Descripción */}
                    {eventoSeleccionado.descripcion && (
                      <div>
                        <Label className="text-sm font-medium">Descripción</Label>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                          {eventoSeleccionado.descripcion}
                        </p>
                      </div>
                    )}

                    {/* Fecha y hora */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-sm font-medium">Inicio</Label>
                        <p className="mt-1 text-sm">
                          {formatDate(
                            new Date(eventoSeleccionado.fechaInicio),
                            eventoSeleccionado.todoElDia ? 'PPP' : 'PPP p',
                            { locale: es }
                          )}
                        </p>
                      </div>

                      {eventoSeleccionado.fechaFin && (
                        <div>
                          <Label className="text-sm font-medium">Fin</Label>
                          <p className="mt-1 text-sm">
                            {formatDate(
                              new Date(eventoSeleccionado.fechaFin),
                              eventoSeleccionado.todoElDia ? 'PPP' : 'PPP p',
                              { locale: es }
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ubicación */}
                    {eventoSeleccionado.ubicacion && (
                      <div>
                        <Label className="flex items-center gap-2 text-sm font-medium">
                          <MapPin className="h-4 w-4" />
                          Ubicación
                        </Label>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {eventoSeleccionado.ubicacion}
                        </p>
                      </div>
                    )}

                    {/* Entidades relacionadas */}
                    {(eventoSeleccionado.building ||
                      eventoSeleccionado.unit ||
                      eventoSeleccionado.tenant) && (
                      <div className="rounded-lg border p-3">
                        <Label className="mb-2 block text-sm font-medium">
                          Información Relacionada
                        </Label>
                        <div className="space-y-1 text-sm">
                          {eventoSeleccionado.building && (
                            <p>
                              <strong>Edificio:</strong> {eventoSeleccionado.building.nombre}
                            </p>
                          )}
                          {eventoSeleccionado.unit && (
                            <p>
                              <strong>Unidad:</strong> {eventoSeleccionado.unit.numero}
                            </p>
                          )}
                          {eventoSeleccionado.tenant && (
                            <p>
                              <strong>Inquilino:</strong> {eventoSeleccionado.tenant.nombreCompleto}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    {!eventoSeleccionado.completado && !eventoSeleccionado.cancelado && (
                      <div className="flex gap-2 border-t pt-4">
                        <Button
                          onClick={() => marcarEventoCompletado(eventoSeleccionado.id)}
                          className="flex-1 gap-2"
                          variant="default"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Marcar Completado
                        </Button>

                        <Button
                          onClick={() => cancelarEvento(eventoSeleccionado.id)}
                          className="flex-1 gap-2"
                          variant="outline"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancelar Evento
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Diálogo para crear nuevo evento */}
            <Dialog open={mostrarDialogoNuevo} onOpenChange={setMostrarDialogoNuevo}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Crear Nuevo Evento
                  </DialogTitle>
                  <DialogDescription>
                    Completa los datos para crear un nuevo evento en el calendario
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Título */}
                  <div>
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Ej: Reunión con propietario"
                    />
                  </div>

                  {/* Tipo y Prioridad */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="tipo">Tipo de Evento *</Label>
                      <Select
                        value={formData.tipo}
                        onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_EVENTO.map((tipo) => (
                            <SelectItem key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="prioridad">Prioridad *</Label>
                      <Select
                        value={formData.prioridad}
                        onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORIDADES.map((prioridad) => (
                            <SelectItem key={prioridad.value} value={prioridad.value}>
                              {prioridad.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Todo el día */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="todoElDia"
                      checked={formData.todoElDia}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, todoElDia: checked as boolean })
                      }
                    />
                    <Label htmlFor="todoElDia" className="cursor-pointer">
                      Evento de todo el día
                    </Label>
                  </div>

                  {/* Fecha y hora de inicio */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="fechaInicio">Fecha de Inicio *</Label>
                      <Input
                        id="fechaInicio"
                        type="date"
                        value={formData.fechaInicio}
                        onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      />
                    </div>

                    {!formData.todoElDia && (
                      <div>
                        <Label htmlFor="horaInicio">Hora de Inicio</Label>
                        <Input
                          id="horaInicio"
                          type="time"
                          value={formData.horaInicio}
                          onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Fecha y hora de fin */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="fechaFin">Fecha de Fin (opcional)</Label>
                      <Input
                        id="fechaFin"
                        type="date"
                        value={formData.fechaFin}
                        onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      />
                    </div>

                    {!formData.todoElDia && formData.fechaFin && (
                      <div>
                        <Label htmlFor="horaFin">Hora de Fin</Label>
                        <Input
                          id="horaFin"
                          type="time"
                          value={formData.horaFin}
                          onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Ubicación */}
                  <div>
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input
                      id="ubicacion"
                      value={formData.ubicacion}
                      onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                      placeholder="Ej: Edificio Central - Unidad 101"
                    />
                  </div>

                  {/* Descripción */}
                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Describe el evento..."
                      rows={3}
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <Label htmlFor="color">Color del Evento</Label>
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="h-10 w-20"
                    />
                  </div>

                  {/* Recordatorio */}
                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="recordatorioActivo"
                        checked={formData.recordatorioActivo}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, recordatorioActivo: checked as boolean })
                        }
                      />
                      <Label htmlFor="recordatorioActivo" className="cursor-pointer">
                        Activar recordatorio
                      </Label>
                    </div>

                    {formData.recordatorioActivo && (
                      <div>
                        <Label htmlFor="recordatorioMinutos">Recordar</Label>
                        <Select
                          value={formData.recordatorioMinutos}
                          onValueChange={(value) =>
                            setFormData({ ...formData, recordatorioMinutos: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutos antes</SelectItem>
                            <SelectItem value="30">30 minutos antes</SelectItem>
                            <SelectItem value="60">1 hora antes</SelectItem>
                            <SelectItem value="180">3 horas antes</SelectItem>
                            <SelectItem value="1440">1 día antes</SelectItem>
                            <SelectItem value="10080">1 semana antes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Notas */}
                  <div>
                    <Label htmlFor="notas">Notas adicionales</Label>
                    <Textarea
                      id="notas"
                      value={formData.notas}
                      onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                      placeholder="Notas internas..."
                      rows={2}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMostrarDialogoNuevo(false);
                      resetFormData();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={crearEvento}
                    disabled={!formData.titulo || !formData.tipo || !formData.fechaInicio}
                  >
                    Crear Evento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
