'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Hotel,
  BedDouble,
  CalendarCheck,
  Users,
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Star,
  Wifi,
  Coffee,
  Tv,
  Bath,
  Eye,
  Edit,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

interface Room {
  id: string;
  numero: string;
  tipo: string;
  capacidad: number;
  precioMensual: number; // Usado como precio por noche
  amenidades: string[];
  descripcion?: string;
  superficie?: number;
  estado: string;
  building?: { id: string; nombre: string; direccion: string };
}

interface Booking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  precioTotal: number;
  estado: string;
  notas?: string;
  plataforma?: string;
  listing?: { titulo: string };
}

interface Stats {
  total: number;
  disponibles: number;
  ocupadas: number;
  mantenimiento: number;
  reservadas: number;
}

interface BookingStats {
  total: number;
  confirmadas: number;
  pendientes: number;
  checkinHoy: number;
  checkoutHoy: number;
  ingresosMes: number;
}

// Amenidades disponibles
const AMENIDADES = [];

// Tipos de habitación
const TIPOS_HABITACION = [
  { value: 'standard', label: 'Standard' },
  { value: 'superior', label: 'Superior' },
  { value: 'deluxe', label: 'Deluxe' },
  { value: 'suite', label: 'Suite' },
  { value: 'suite_junior', label: 'Junior Suite' },
  { value: 'suite_presidencial', label: 'Suite Presidencial' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function HospitalityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [buildings, setBuildings] = useState<{ id: string; nombre: string }[]>([]);
  const [roomStats, setRoomStats] = useState<Stats | null>(null);
  const [bookingStats, setBookingStats] = useState<BookingStats | null>(null);
  const [activeTab, setActiveTab] = useState('habitaciones');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  
  // Dialogs
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [showNewBookingDialog, setShowNewBookingDialog] = useState(false);

  // Form states
  const [newRoom, setNewRoom] = useState({
    buildingId: '',
    numero: '',
    tipo: 'standard',
    capacidad: 2,
    precioPorNoche: 0,
    amenidades: [] as string[],
    descripcion: '',
    superficie: 0,
  });

  const [newBooking, setNewBooking] = useState({
    roomId: '',
    buildingId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    numGuests: 1,
    precioTotal: 0,
    notas: '',
    origen: 'directo',
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar edificios
      const buildingsRes = await fetch('/api/buildings?limit=100');
      if (buildingsRes.ok) {
        const data = await buildingsRes.json();
        setBuildings(Array.isArray(data) ? data : data.data || []);
      }

      // Cargar habitaciones
      await loadRooms();

      // Cargar reservas
      await loadBookings();

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      let url = '/api/hospitality/rooms';
      const params = new URLSearchParams();
      if (selectedBuilding !== 'all') params.append('buildingId', selectedBuilding);
      if (filterEstado !== 'all') params.append('estado', filterEstado);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.data || []);
        setRoomStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
    }
  };

  const loadBookings = async () => {
    try {
      let url = '/api/hospitality/bookings';
      const params = new URLSearchParams();
      if (selectedBuilding !== 'all') params.append('buildingId', selectedBuilding);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
        setBookingStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  // Crear habitación
  const handleCreateRoom = async () => {
    if (!newRoom.buildingId || !newRoom.numero) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/hospitality/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRoom),
      });

      if (response.ok) {
        toast.success('Habitación creada exitosamente');
        setShowNewRoomDialog(false);
        resetRoomForm();
        loadRooms();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear habitación');
      }
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Error al crear habitación');
    }
  };

  // Crear reserva
  const handleCreateBooking = async () => {
    if (!newBooking.guestName || !newBooking.guestEmail || !newBooking.checkIn || !newBooking.checkOut) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/hospitality/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });

      if (response.ok) {
        toast.success('Reserva creada exitosamente');
        setShowNewBookingDialog(false);
        resetBookingForm();
        loadBookings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear reserva');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Error al crear reserva');
    }
  };

  // Reset forms
  const resetRoomForm = () => {
    setNewRoom({
      buildingId: selectedBuilding !== 'all' ? selectedBuilding : '',
      numero: '',
      tipo: 'standard',
      capacidad: 2,
      precioPorNoche: 0,
      amenidades: [],
      descripcion: '',
      superficie: 0,
    });
  };

  const resetBookingForm = () => {
    setNewBooking({
      roomId: '',
      buildingId: selectedBuilding !== 'all' ? selectedBuilding : '',
      guestName: '',
      guestEmail: '',
      guestPhone: '',
      checkIn: '',
      checkOut: '',
      numGuests: 1,
      precioTotal: 0,
      notas: '',
      origen: 'directo',
    });
  };

  // Toggle amenidad
  const toggleAmenidad = (amenidad: string) => {
    setNewRoom(prev => ({
      ...prev,
      amenidades: prev.amenidades.includes(amenidad)
        ? prev.amenidades.filter(a => a !== amenidad)
        : [...prev.amenidades, amenidad],
    }));
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'disponible': return 'bg-green-100 text-green-700';
      case 'ocupada': return 'bg-red-100 text-red-700';
      case 'mantenimiento': return 'bg-yellow-100 text-yellow-700';
      case 'reservada': return 'bg-blue-100 text-blue-700';
      case 'confirmada': return 'bg-green-100 text-green-700';
      case 'pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'cancelada': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filtrar habitaciones
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.tipo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Loading
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Hotel className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Hospitality Management</h1>
              <p className="text-muted-foreground">
                Gestión hotelera y reservas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos los hoteles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los hoteles</SelectItem>
                {buildings.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <BedDouble className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{roomStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Habitaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{roomStats?.disponibles || 0}</p>
                  <p className="text-xs text-muted-foreground">Disponibles</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{roomStats?.ocupadas || 0}</p>
                  <p className="text-xs text-muted-foreground">Ocupadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <LogIn className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{bookingStats?.checkinHoy || 0}</p>
                  <p className="text-xs text-muted-foreground">Check-in hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <LogOut className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{bookingStats?.checkoutHoy || 0}</p>
                  <p className="text-xs text-muted-foreground">Check-out hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-emerald-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">€{(bookingStats?.ingresosMes || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Ingresos mes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="habitaciones" className="gap-2">
              <BedDouble className="h-4 w-4" />
              Habitaciones ({rooms.length})
            </TabsTrigger>
            <TabsTrigger value="reservas" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              Reservas ({bookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Habitaciones */}
          <TabsContent value="habitaciones" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar habitación..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="disponible">Disponibles</SelectItem>
                  <SelectItem value="ocupada">Ocupadas</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => { resetRoomForm(); setShowNewRoomDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Habitación
              </Button>
            </div>

            {filteredRooms.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <BedDouble className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No hay habitaciones</h3>
                  <p className="text-muted-foreground">Crea tu primera habitación</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map(room => (
                  <Card key={room.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">Habitación {room.numero}</CardTitle>
                          <CardDescription className="capitalize">{room.tipo}</CardDescription>
                        </div>
                        <Badge className={getEstadoColor(room.estado)}>
                          {room.estado}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Capacidad</span>
                          <span className="font-medium">{room.capacidad} personas</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Precio/noche</span>
                          <span className="font-bold text-green-600">€{room.precioMensual}</span>
                        </div>
                        {room.superficie && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Superficie</span>
                            <span>{room.superficie} m²</span>
                          </div>
                        )}
                        {room.amenidades.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-2">
                            {room.amenidades.slice(0, 4).map(a => (
                              <Badge key={a} variant="outline" className="text-xs">
                                {a}
                              </Badge>
                            ))}
                            {room.amenidades.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{room.amenidades.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                        {room.building && (
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            {room.building.nombre}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Reservas */}
          <TabsContent value="reservas" className="mt-4 space-y-4">
            <div className="flex justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar reserva..." className="pl-10" />
              </div>
              <Button onClick={() => { resetBookingForm(); setShowNewBookingDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Reserva
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {bookings.length === 0 ? (
                  <div className="py-16 text-center">
                    <CalendarCheck className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No hay reservas</h3>
                    <p className="text-muted-foreground">Crea tu primera reserva</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Huésped</TableHead>
                        <TableHead>Check-in</TableHead>
                        <TableHead>Check-out</TableHead>
                        <TableHead>Noches</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Origen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map(booking => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.guestName}</p>
                              <p className="text-xs text-muted-foreground">{booking.guestEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.checkIn), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.checkOut), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>
                            {differenceInDays(new Date(booking.checkOut), new Date(booking.checkIn))}
                          </TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(booking.estado)}>
                              {booking.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">€{booking.precioTotal}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{booking.plataforma || 'directo'}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Nueva Habitación */}
      <Dialog open={showNewRoomDialog} onOpenChange={setShowNewRoomDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Habitación</DialogTitle>
            <DialogDescription>Añade una habitación al inventario</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Hotel/Edificio *</Label>
                <Select
                  value={newRoom.buildingId}
                  onValueChange={v => setNewRoom(prev => ({ ...prev, buildingId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número *</Label>
                <Input
                  placeholder="101"
                  value={newRoom.numero}
                  onChange={e => setNewRoom(prev => ({ ...prev, numero: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newRoom.tipo}
                  onValueChange={v => setNewRoom(prev => ({ ...prev, tipo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_HABITACION.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Capacidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={newRoom.capacidad}
                  onChange={e => setNewRoom(prev => ({ ...prev, capacidad: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio/noche (€)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newRoom.precioPorNoche}
                  onChange={e => setNewRoom(prev => ({ ...prev, precioPorNoche: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Superficie (m²)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newRoom.superficie}
                  onChange={e => setNewRoom(prev => ({ ...prev, superficie: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Amenidades</Label>
              <div className="flex flex-wrap gap-2">
                {AMENIDADES.map(a => (
                  <Badge
                    key={a.id}
                    variant={newRoom.amenidades.includes(a.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleAmenidad(a.id)}
                  >
                    {a.label}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción de la habitación..."
                value={newRoom.descripcion}
                onChange={e => setNewRoom(prev => ({ ...prev, descripcion: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRoomDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRoom}>Crear Habitación</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Nueva Reserva */}
      <Dialog open={showNewBookingDialog} onOpenChange={setShowNewBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
            <DialogDescription>Crear una nueva reserva</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Hotel *</Label>
                <Select
                  value={newBooking.buildingId}
                  onValueChange={v => setNewBooking(prev => ({ ...prev, buildingId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Nombre del huésped *</Label>
                <Input
                  placeholder="Juan García"
                  value={newBooking.guestName}
                  onChange={e => setNewBooking(prev => ({ ...prev, guestName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={newBooking.guestEmail}
                  onChange={e => setNewBooking(prev => ({ ...prev, guestEmail: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  placeholder="+34 600 000 000"
                  value={newBooking.guestPhone}
                  onChange={e => setNewBooking(prev => ({ ...prev, guestPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-in *</Label>
                <Input
                  type="date"
                  value={newBooking.checkIn}
                  onChange={e => setNewBooking(prev => ({ ...prev, checkIn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Check-out *</Label>
                <Input
                  type="date"
                  value={newBooking.checkOut}
                  onChange={e => setNewBooking(prev => ({ ...prev, checkOut: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Huéspedes</Label>
                <Input
                  type="number"
                  min="1"
                  value={newBooking.numGuests}
                  onChange={e => setNewBooking(prev => ({ ...prev, numGuests: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Total (€)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newBooking.precioTotal}
                  onChange={e => setNewBooking(prev => ({ ...prev, precioTotal: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Notas adicionales..."
                  value={newBooking.notas}
                  onChange={e => setNewBooking(prev => ({ ...prev, notas: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewBookingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateBooking}>Crear Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
