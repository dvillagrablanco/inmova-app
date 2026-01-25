'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  DoorOpen, Plus, Calendar, Clock, Users, Wifi, 
  Monitor, Coffee, CheckCircle2, MapPin, Euro, CalendarPlus
} from 'lucide-react';

interface MeetingRoom {
  id: string;
  nombre: string;
  descripcion?: string;
  capacidad: number;
  equipamiento: string[];
  tarifaHora?: number;
  tarifaMediodia?: number;
  tarifaDia?: number;
  disponibleDesde: string;
  disponibleHasta: string;
  diasDisponibles: number[];
  imagenes: string[];
  activo: boolean;
  disponibleHoy: boolean;
  proximasReservas: number;
  building?: {
    id: string;
    nombre: string;
    direccion: string;
  };
  bookings: Array<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
  }>;
}

interface Stats {
  total: number;
  disponiblesHoy: number;
  capacidadTotal: number;
}

export default function SalasReunionesPage() {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);

  // Form state for creating room
  const [roomForm, setRoomForm] = useState({
    nombre: '',
    descripcion: '',
    capacidad: 10,
    equipamiento: [] as string[],
    tarifaHora: 0,
    disponibleDesde: '08:00',
    disponibleHasta: '20:00',
  });

  // Form state for booking
  const [bookingForm, setBookingForm] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    asistentes: [] as string[],
  });

  const equipamientoOptions = [
    { value: 'proyector', label: 'Proyector', icon: Monitor },
    { value: 'videoconferencia', label: 'Videoconferencia', icon: Monitor },
    { value: 'wifi', label: 'WiFi', icon: Wifi },
    { value: 'pizarra', label: 'Pizarra', icon: Monitor },
    { value: 'catering', label: 'Servicio Catering', icon: Coffee },
    { value: 'aire_acondicionado', label: 'Aire Acondicionado', icon: Monitor },
  ];

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    try {
      setLoading(true);
      const response = await fetch('/api/salas-reuniones');
      if (!response.ok) throw new Error('Error al cargar salas');
      
      const data = await response.json();
      setRooms(data.data || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las salas de reuniones');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRoom() {
    try {
      if (!roomForm.nombre || roomForm.capacidad <= 0) {
        toast.error('Completa los campos obligatorios');
        return;
      }

      const response = await fetch('/api/salas-reuniones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear sala');
      }

      toast.success('Sala de reuniones creada');
      setDialogOpen(false);
      setRoomForm({
        nombre: '',
        descripcion: '',
        capacidad: 10,
        equipamiento: [],
        tarifaHora: 0,
        disponibleDesde: '08:00',
        disponibleHasta: '20:00',
      });
      loadRooms();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function handleBookRoom() {
    try {
      if (!selectedRoom || !bookingForm.titulo || !bookingForm.fechaInicio || !bookingForm.fechaFin) {
        toast.error('Completa los campos obligatorios');
        return;
      }

      const response = await fetch('/api/salas-reuniones/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId: selectedRoom.id,
          ...bookingForm,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al reservar');
      }

      toast.success('Reserva confirmada');
      setBookingDialogOpen(false);
      setSelectedRoom(null);
      setBookingForm({
        titulo: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        asistentes: [],
      });
      loadRooms();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  function openBookingDialog(room: MeetingRoom) {
    setSelectedRoom(room);
    setBookingDialogOpen(true);
  }

  const toggleEquipamiento = (value: string) => {
    setRoomForm(prev => ({
      ...prev,
      equipamiento: prev.equipamiento.includes(value)
        ? prev.equipamiento.filter(e => e !== value)
        : [...prev.equipamiento, value],
    }));
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64" />)}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Salas de Reuniones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <DoorOpen className="h-6 w-6 text-purple-500" />
              Salas de Reuniones
            </h1>
            <p className="text-muted-foreground">
              Reserva y gestión de salas de reuniones
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Sala
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Sala de Reuniones</DialogTitle>
                <DialogDescription>
                  Configura una nueva sala de reuniones
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={roomForm.nombre}
                    onChange={(e) => setRoomForm({ ...roomForm, nombre: e.target.value })}
                    placeholder="Sala principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={roomForm.descripcion}
                    onChange={(e) => setRoomForm({ ...roomForm, descripcion: e.target.value })}
                    placeholder="Descripción de la sala..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Capacidad *</Label>
                    <Input
                      type="number"
                      value={roomForm.capacidad}
                      onChange={(e) => setRoomForm({ ...roomForm, capacidad: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tarifa/hora (€)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={roomForm.tarifaHora}
                      onChange={(e) => setRoomForm({ ...roomForm, tarifaHora: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Disponible desde</Label>
                    <Input
                      type="time"
                      value={roomForm.disponibleDesde}
                      onChange={(e) => setRoomForm({ ...roomForm, disponibleDesde: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Disponible hasta</Label>
                    <Input
                      type="time"
                      value={roomForm.disponibleHasta}
                      onChange={(e) => setRoomForm({ ...roomForm, disponibleHasta: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Equipamiento</Label>
                  <div className="flex flex-wrap gap-2">
                    {equipamientoOptions.map(opt => (
                      <Badge
                        key={opt.value}
                        variant={roomForm.equipamiento.includes(opt.value) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleEquipamiento(opt.value)}
                      >
                        {opt.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRoom}>
                  Crear Sala
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Salas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.disponiblesHoy}</div>
                <div className="text-sm text-muted-foreground">Disponibles Hoy</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.capacidadTotal}</div>
                <div className="text-sm text-muted-foreground">Capacidad Total</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <DoorOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay salas de reuniones</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera sala para empezar
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Sala
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <DoorOpen className="h-16 w-16 text-white/50" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{room.nombre}</CardTitle>
                      {room.building && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {room.building.direccion}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={room.disponibleHoy ? 'default' : 'secondary'}>
                      {room.disponibleHoy ? 'Disponible' : 'Ocupada'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {room.capacidad} personas
                    </span>
                    {room.tarifaHora && room.tarifaHora > 0 && (
                      <span className="flex items-center gap-1 font-medium">
                        <Euro className="h-4 w-4" />
                        {room.tarifaHora}/hora
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {room.disponibleDesde} - {room.disponibleHasta}
                  </div>

                  {room.equipamiento && room.equipamiento.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.equipamiento.slice(0, 3).map((eq) => (
                        <Badge key={eq} variant="outline" className="text-xs">
                          {eq}
                        </Badge>
                      ))}
                      {room.equipamiento.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{room.equipamiento.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {room.proximasReservas > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {room.proximasReservas} reserva(s) próxima(s)
                    </p>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={() => openBookingDialog(room)}
                    disabled={!room.disponibleHoy}
                  >
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Reservar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Booking Dialog */}
        <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reservar Sala</DialogTitle>
              <DialogDescription>
                {selectedRoom?.nombre}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título de la reunión *</Label>
                <Input
                  value={bookingForm.titulo}
                  onChange={(e) => setBookingForm({ ...bookingForm, titulo: e.target.value })}
                  placeholder="Reunión de equipo"
                />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={bookingForm.descripcion}
                  onChange={(e) => setBookingForm({ ...bookingForm, descripcion: e.target.value })}
                  placeholder="Detalles de la reunión..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Inicio *</Label>
                  <Input
                    type="datetime-local"
                    value={bookingForm.fechaInicio}
                    onChange={(e) => setBookingForm({ ...bookingForm, fechaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin *</Label>
                  <Input
                    type="datetime-local"
                    value={bookingForm.fechaFin}
                    onChange={(e) => setBookingForm({ ...bookingForm, fechaFin: e.target.value })}
                  />
                </div>
              </div>
              {selectedRoom?.tarifaHora && selectedRoom.tarifaHora > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Tarifa: <strong>{selectedRoom.tarifaHora}€/hora</strong>
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleBookRoom}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Confirmar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
