'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Event {
  id: string;
  titulo: string;
  descripcion?: string;
  categoria: string;
  fecha: string;
  horaInicio: string;
  horaFin?: string;
  ubicacion: string;
  capacidadMaxima?: number;
  asistentesLista: number;
  estado: string;
  building?: {
    id: string;
    nombre: string;
  };
}

const EVENT_CATEGORIES = [
  { value: 'social', label: 'Social' },
  { value: 'formacion', label: 'Formación' },
  { value: 'networking', label: 'Networking' },
  { value: 'asamblea', label: 'Asamblea' },
  { value: 'deporte', label: 'Deporte' },
  { value: 'cultural', label: 'Cultural' },
];

const STATUS_COLORS: Record<string, string> = {
  programado: 'bg-blue-100 text-blue-800',
  en_curso: 'bg-green-100 text-green-800',
  finalizado: 'bg-gray-100 text-gray-800',
  cancelado: 'bg-red-100 text-red-800',
};

export default function CommunityEventsPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filter, setFilter] = useState('all');
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'social',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    ubicacion: '',
    capacidadMaxima: '',
  });

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const res = await fetch(`/api/community/events?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const handleCreateEvent = async () => {
    try {
      const res = await fetch('/api/community/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacidadMaxima: formData.capacidadMaxima ? parseInt(formData.capacidadMaxima) : null,
        }),
      });

      if (res.ok) {
        toast.success('Evento creado correctamente');
        setShowCreateDialog(false);
        setFormData({
          titulo: '',
          descripcion: '',
          categoria: 'social',
          fecha: '',
          horaInicio: '',
          horaFin: '',
          ubicacion: '',
          capacidadMaxima: '',
        });
        fetchEvents();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear evento');
      }
    } catch (error) {
      toast.error('Error al crear evento');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('¿Estás seguro de eliminar este evento?')) return;

    try {
      const res = await fetch(`/api/community/events/${eventId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Evento eliminado');
        fetchEvents();
      } else {
        toast.error('Error al eliminar evento');
      }
    } catch (error) {
      toast.error('Error al eliminar evento');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              <SelectItem value="programado">Programados</SelectItem>
              <SelectItem value="en_curso">En curso</SelectItem>
              <SelectItem value="finalizado">Finalizados</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Evento</DialogTitle>
              <DialogDescription>
                Completa la información del evento para la comunidad.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título del Evento</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Nombre del evento"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el evento..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categoria">Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="fecha">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="horaInicio">Hora Inicio</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="horaFin">Hora Fin</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Lugar del evento"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="capacidadMaxima">Capacidad Máxima</Label>
                  <Input
                    id="capacidadMaxima"
                    type="number"
                    value={formData.capacidadMaxima}
                    onChange={(e) => setFormData({ ...formData, capacidadMaxima: e.target.value })}
                    placeholder="Sin límite"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateEvent} disabled={!formData.titulo || !formData.fecha}>
                Crear Evento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay eventos</h3>
              <p className="text-muted-foreground mb-4">
                Crea el primer evento para tu comunidad.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Evento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">{event.titulo}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      {EVENT_CATEGORIES.find(c => c.value === event.categoria)?.label || event.categoria}
                    </CardDescription>
                  </div>
                  <Badge className={STATUS_COLORS[event.estado] || 'bg-gray-100'}>
                    {event.estado}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(event.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{event.horaInicio}{event.horaFin && ` - ${event.horaFin}`}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{event.ubicacion}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {event.asistentesLista} asistentes
                    {event.capacidadMaxima && ` / ${event.capacidadMaxima} máx`}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
