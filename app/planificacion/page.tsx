'use client';

export const dynamic = 'force-dynamic';

/**
 * Planificación
 * 
 * Sistema de planificación y scheduling de tareas
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Plus,
  Clock,
  User,
  Building2,
  Wrench,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, addWeeks, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScheduledEvent {
  id: string;
  titulo: string;
  tipo: 'visita' | 'mantenimiento' | 'reunion' | 'contrato' | 'otro';
  fecha: Date;
  hora: string;
  duracion: number;
  descripcion?: string;
  propiedad?: string;
  asignado?: string;
  completado: boolean;
}

// Datos cargados desde API /api/planificacion

const EVENT_TYPES = [
  { id: 'visita', nombre: 'Visita', icon: Building2, color: 'bg-blue-500' },
  { id: 'mantenimiento', nombre: 'Mantenimiento', icon: Wrench, color: 'bg-orange-500' },
  { id: 'reunion', nombre: 'Reunión', icon: User, color: 'bg-purple-500' },
  { id: 'contrato', nombre: 'Contrato', icon: FileText, color: 'bg-green-500' },
  { id: 'otro', nombre: 'Otro', icon: CalendarDays, color: 'bg-gray-500' },
];

export default function PlanificacionPage() {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [view, setView] = useState<'week' | 'month'>('week');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Cargar eventos desde API
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/planificacion');
        if (response.ok) {
          const result = await response.json();
          // Convertir strings de fecha a Date objects
          const eventsWithDates = (result.data || []).map((e: ScheduledEvent) => ({
            ...e,
            fecha: new Date(e.fecha),
          }));
          setEvents(eventsWithDates);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.fecha, date));
  };

  const getEventTypeConfig = (tipo: string) => {
    return EVENT_TYPES.find(t => t.id === tipo) || EVENT_TYPES[4];
  };

  const handlePrevWeek = () => {
    setWeekStart(addWeeks(weekStart, -1));
  };

  const handleNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1));
  };

  const handleToggleComplete = (eventId: string) => {
    setEvents(events.map(e =>
      e.id === eventId ? { ...e, completado: !e.completado } : e
    ));
    toast.success('Estado actualizado');
  };

  const todayEvents = getEventsForDate(new Date());
  const upcomingEvents = events
    .filter(e => e.fecha >= new Date() && !e.completado)
    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Planificación</h1>
          <p className="text-muted-foreground">
            Gestiona visitas, mantenimientos y reuniones
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold">{todayEvents.length}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Esta semana</p>
                <p className="text-2xl font-bold">
                  {weekDays.reduce((sum, day) => sum + getEventsForDate(day).length, 0)}
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => !e.completado).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completados</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.completado).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Weekly Calendar */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vista Semanal</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium min-w-[150px] text-center">
                  {format(weekStart, "d MMM", { locale: es })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: es })}
                </span>
                <Button variant="outline" size="icon" onClick={handleNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Header */}
              {weekDays.map((day) => (
                <div
                  key={day.toISOString()}
                  className={`text-center p-2 rounded-lg ${
                    isSameDay(day, new Date())
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-xs font-medium">
                    {format(day, 'EEE', { locale: es })}
                  </p>
                  <p className="text-lg font-bold">{format(day, 'd')}</p>
                </div>
              ))}

              {/* Events */}
              {weekDays.map((day) => {
                const dayEvents = getEventsForDate(day);
                return (
                  <div
                    key={`events-${day.toISOString()}`}
                    className="min-h-[120px] border rounded-lg p-1 space-y-1"
                  >
                    {dayEvents.slice(0, 3).map((event) => {
                      const typeConfig = getEventTypeConfig(event.tipo);
                      return (
                        <div
                          key={event.id}
                          className={`${typeConfig.color} text-white text-xs p-1 rounded truncate cursor-pointer ${
                            event.completado ? 'opacity-50 line-through' : ''
                          }`}
                          onClick={() => handleToggleComplete(event.id)}
                          title={event.titulo}
                        >
                          {event.hora} {event.titulo}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - 3} más
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próximas Tareas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay tareas pendientes
              </p>
            ) : (
              upcomingEvents.map((event) => {
                const typeConfig = getEventTypeConfig(event.tipo);
                const Icon = typeConfig.icon;
                
                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 border rounded-lg"
                  >
                    <div className={`${typeConfig.color} text-white p-2 rounded-lg`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.fecha, "d MMM", { locale: es })} · {event.hora}
                      </p>
                      {event.propiedad && (
                        <p className="text-xs text-muted-foreground truncate">
                          📍 {event.propiedad}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda de Hoy - {format(new Date(), "d 'de' MMMM", { locale: es })}</CardTitle>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay tareas programadas para hoy</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((event) => {
                  const typeConfig = getEventTypeConfig(event.tipo);
                  const Icon = typeConfig.icon;
                  
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        event.completado ? 'bg-muted/50 opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`${typeConfig.color} text-white p-3 rounded-lg`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${event.completado ? 'line-through' : ''}`}>
                              {event.titulo}
                            </h4>
                            <Badge variant="outline" className="capitalize">
                              {event.tipo}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.hora} ({event.duracion} min)
                            </span>
                            {event.propiedad && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {event.propiedad}
                              </span>
                            )}
                            {event.asignado && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.asignado}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={event.completado ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleComplete(event.id)}
                      >
                        {event.completado ? 'Reabrir' : 'Completar'}
                      </Button>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Event Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              Programa una nueva tarea en el calendario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input placeholder="Ej: Visita propiedad Centro" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select defaultValue="visita">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Duración (min)</label>
                <Input type="number" defaultValue="30" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha</label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Hora</label>
                <Input type="time" defaultValue="10:00" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              toast.success('Tarea creada');
              setIsDialogOpen(false);
            }}>
              Crear Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
