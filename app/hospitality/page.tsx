'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Hotel,
  Plus,
  Search,
  BedDouble,
  Users,
  Euro,
  Calendar,
  TrendingUp,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  Star,
  Wifi,
  Coffee,
  Car,
  Waves,
  UtensilsCrossed,
  Dumbbell,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BarChart3,
  CalendarDays,
  Building2,
  DoorOpen,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Habitacion {
  id: string;
  numero: string;
  tipo: 'individual' | 'doble' | 'suite' | 'familiar' | 'deluxe';
  planta: number;
  estado: 'disponible' | 'ocupada' | 'limpieza' | 'mantenimiento' | 'reservada';
  tarifaBase: number;
  capacidad: number;
  amenities: string[];
  vistas?: string;
  ultimaLimpieza?: string;
}

interface Reserva {
  id: string;
  habitacionId: string;
  habitacionNumero: string;
  huesped: string;
  fechaCheckIn: string;
  fechaCheckOut: string;
  noches: number;
  adultos: number;
  ninos: number;
  estado: 'confirmada' | 'pendiente' | 'checkin' | 'checkout' | 'cancelada' | 'noshow';
  canal: 'directo' | 'booking' | 'expedia' | 'airbnb' | 'otro';
  total: number;
  pagado: number;
  serviciosAdicionales: string[];
  notas?: string;
}

interface HousekeepingTask {
  id: string;
  habitacionNumero: string;
  tipo: 'limpieza_salida' | 'limpieza_estancia' | 'preparacion' | 'inspeccion';
  prioridad: 'alta' | 'media' | 'baja';
  estado: 'pendiente' | 'en_progreso' | 'completada';
  asignado?: string;
  horaInicio?: string;
  horaFin?: string;
}

const estadoHabitacionColors: Record<string, string> = {
  disponible: 'bg-green-100 text-green-800',
  ocupada: 'bg-blue-100 text-blue-800',
  limpieza: 'bg-amber-100 text-amber-800',
  mantenimiento: 'bg-red-100 text-red-800',
  reservada: 'bg-purple-100 text-purple-800',
};

const estadoReservaColors: Record<string, string> = {
  confirmada: 'bg-green-100 text-green-800',
  pendiente: 'bg-amber-100 text-amber-800',
  checkin: 'bg-blue-100 text-blue-800',
  checkout: 'bg-purple-100 text-purple-800',
  cancelada: 'bg-red-100 text-red-800',
  noshow: 'bg-gray-100 text-gray-800',
};

const tipoHabitacionLabels: Record<string, string> = {
  individual: 'Individual',
  doble: 'Doble',
  suite: 'Suite',
  familiar: 'Familiar',
  deluxe: 'Deluxe',
};

const canalColors: Record<string, string> = {
  directo: 'bg-green-100 text-green-800',
  booking: 'bg-blue-100 text-blue-800',
  expedia: 'bg-yellow-100 text-yellow-800',
  airbnb: 'bg-red-100 text-red-800',
  otro: 'bg-gray-100 text-gray-800',
};

export default function HospitalityPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [housekeeping, setHousekeeping] = useState<HousekeepingTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [showCreateHabitacion, setShowCreateHabitacion] = useState(false);
  const [showCreateReserva, setShowCreateReserva] = useState(false);
  const [activeTab, setActiveTab] = useState('habitaciones');
  
  const [newHabitacion, setNewHabitacion] = useState({
    numero: '',
    tipo: 'doble' as const,
    planta: 1,
    tarifaBase: 0,
    capacidad: 2,
    amenities: [] as string[],
    vistas: '',
  });

  const [newReserva, setNewReserva] = useState({
    habitacionId: '',
    huesped: '',
    fechaCheckIn: '',
    fechaCheckOut: '',
    adultos: 2,
    ninos: 0,
    canal: 'directo' as const,
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/hospitality');
      // const data = await response.json();
      // setHabitaciones(data.habitaciones);
      // setReservas(data.reservas);
      // setHousekeeping(data.housekeeping);
      
      // Estado vacío inicial
      setHabitaciones([]);
      setReservas([]);
      setHousekeeping([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHabitacion = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Habitación creada correctamente');
      setShowCreateHabitacion(false);
      setNewHabitacion({
        numero: '',
        tipo: 'doble',
        planta: 1,
        tarifaBase: 0,
        capacidad: 2,
        amenities: [],
        vistas: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear la habitación');
    }
  };

  const handleCreateReserva = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Reserva creada correctamente');
      setShowCreateReserva(false);
      setNewReserva({
        habitacionId: '',
        huesped: '',
        fechaCheckIn: '',
        fechaCheckOut: '',
        adultos: 2,
        ninos: 0,
        canal: 'directo',
        notas: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear la reserva');
    }
  };

  const filteredHabitaciones = habitaciones.filter((hab) => {
    const matchesSearch = hab.numero.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || hab.estado === estadoFilter;
    const matchesTipo = tipoFilter === 'todos' || hab.tipo === tipoFilter;
    return matchesSearch && matchesEstado && matchesTipo;
  });

  // KPIs
  const totalHabitaciones = habitaciones.length;
  const habitacionesDisponibles = habitaciones.filter(h => h.estado === 'disponible').length;
  const habitacionesOcupadas = habitaciones.filter(h => h.estado === 'ocupada').length;
  const tasaOcupacion = totalHabitaciones > 0 ? (habitacionesOcupadas / totalHabitaciones) * 100 : 0;
  const checkinHoy = reservas.filter(r => {
    const hoy = new Date().toISOString().split('T')[0];
    return r.fechaCheckIn === hoy && r.estado === 'confirmada';
  }).length;
  const checkoutHoy = reservas.filter(r => {
    const hoy = new Date().toISOString().split('T')[0];
    return r.fechaCheckOut === hoy && r.estado === 'checkin';
  }).length;
  const tareasHousekeeping = housekeeping.filter(t => t.estado === 'pendiente').length;

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Hotel className="h-8 w-8 text-purple-600" />
                Hospitality & Hotel Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestión hotelera integral: PMS, Channel Manager, Housekeeping
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCreateReserva} onOpenChange={setShowCreateReserva}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Nueva Reserva
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nueva Reserva</DialogTitle>
                  <DialogDescription>
                    Crear una reserva directa
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Habitación</Label>
                    <Select value={newReserva.habitacionId} onValueChange={(v) => setNewReserva({...newReserva, habitacionId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar habitación" />
                      </SelectTrigger>
                      <SelectContent>
                        {habitaciones.filter(h => h.estado === 'disponible').map(hab => (
                          <SelectItem key={hab.id} value={hab.id}>
                            {hab.numero} - {tipoHabitacionLabels[hab.tipo]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Nombre del Huésped</Label>
                    <Input
                      value={newReserva.huesped}
                      onChange={(e) => setNewReserva({...newReserva, huesped: e.target.value})}
                      placeholder="Nombre completo"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Check-in</Label>
                      <Input
                        type="date"
                        value={newReserva.fechaCheckIn}
                        onChange={(e) => setNewReserva({...newReserva, fechaCheckIn: e.target.value})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Check-out</Label>
                      <Input
                        type="date"
                        value={newReserva.fechaCheckOut}
                        onChange={(e) => setNewReserva({...newReserva, fechaCheckOut: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Adultos</Label>
                      <Input
                        type="number"
                        value={newReserva.adultos}
                        onChange={(e) => setNewReserva({...newReserva, adultos: parseInt(e.target.value) || 1})}
                        min={1}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Niños</Label>
                      <Input
                        type="number"
                        value={newReserva.ninos}
                        onChange={(e) => setNewReserva({...newReserva, ninos: parseInt(e.target.value) || 0})}
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Canal de Reserva</Label>
                    <Select value={newReserva.canal} onValueChange={(v: any) => setNewReserva({...newReserva, canal: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="directo">Directo</SelectItem>
                        <SelectItem value="booking">Booking.com</SelectItem>
                        <SelectItem value="expedia">Expedia</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Notas</Label>
                    <Textarea
                      value={newReserva.notas}
                      onChange={(e) => setNewReserva({...newReserva, notas: e.target.value})}
                      placeholder="Peticiones especiales..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateReserva(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateReserva}>
                    Crear Reserva
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showCreateHabitacion} onOpenChange={setShowCreateHabitacion}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Habitación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nueva Habitación</DialogTitle>
                  <DialogDescription>
                    Añade una nueva habitación al inventario
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Número</Label>
                      <Input
                        value={newHabitacion.numero}
                        onChange={(e) => setNewHabitacion({...newHabitacion, numero: e.target.value})}
                        placeholder="Ej: 101"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Tipo</Label>
                      <Select value={newHabitacion.tipo} onValueChange={(v: any) => setNewHabitacion({...newHabitacion, tipo: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="doble">Doble</SelectItem>
                          <SelectItem value="suite">Suite</SelectItem>
                          <SelectItem value="familiar">Familiar</SelectItem>
                          <SelectItem value="deluxe">Deluxe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Planta</Label>
                      <Input
                        type="number"
                        value={newHabitacion.planta}
                        onChange={(e) => setNewHabitacion({...newHabitacion, planta: parseInt(e.target.value) || 1})}
                        min={1}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tarifa Base (€/noche)</Label>
                      <Input
                        type="number"
                        value={newHabitacion.tarifaBase || ''}
                        onChange={(e) => setNewHabitacion({...newHabitacion, tarifaBase: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Capacidad (personas)</Label>
                      <Input
                        type="number"
                        value={newHabitacion.capacidad}
                        onChange={(e) => setNewHabitacion({...newHabitacion, capacidad: parseInt(e.target.value) || 1})}
                        min={1}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Vistas</Label>
                    <Input
                      value={newHabitacion.vistas}
                      onChange={(e) => setNewHabitacion({...newHabitacion, vistas: e.target.value})}
                      placeholder="Ej: Mar, Montaña, Ciudad, Interior"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Amenities</Label>
                    <div className="flex flex-wrap gap-2">
                      {['WiFi', 'TV', 'Minibar', 'Caja Fuerte', 'Aire Acondicionado', 'Balcón', 'Bañera', 'Cafetera', 'Secador'].map((amenity) => (
                        <Badge
                          key={amenity}
                          variant={newHabitacion.amenities.includes(amenity) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => {
                            if (newHabitacion.amenities.includes(amenity)) {
                              setNewHabitacion({...newHabitacion, amenities: newHabitacion.amenities.filter(a => a !== amenity)});
                            } else {
                              setNewHabitacion({...newHabitacion, amenities: [...newHabitacion.amenities, amenity]});
                            }
                          }}
                        >
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateHabitacion(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateHabitacion}>
                    Crear Habitación
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Habitaciones</p>
                  <p className="text-2xl font-bold">{totalHabitaciones}</p>
                </div>
                <BedDouble className="h-8 w-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ocupación</p>
                  <p className="text-2xl font-bold">{tasaOcupacion.toFixed(0)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
              </div>
              <Progress value={tasaOcupacion} className="h-1 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{habitacionesDisponibles}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Check-in Hoy</p>
                  <p className="text-2xl font-bold text-blue-600">{checkinHoy}</p>
                </div>
                <DoorOpen className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Check-out Hoy</p>
                  <p className="text-2xl font-bold text-amber-600">{checkoutHoy}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Housekeeping</p>
                  <p className="text-2xl font-bold text-red-600">{tareasHousekeeping}</p>
                </div>
                <Sparkles className="h-8 w-8 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="habitaciones">Habitaciones</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
            <TabsTrigger value="channels">Channel Manager</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          <TabsContent value="habitaciones" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar habitación..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="disponible">Disponibles</SelectItem>
                      <SelectItem value="ocupada">Ocupadas</SelectItem>
                      <SelectItem value="limpieza">En limpieza</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="reservada">Reservadas</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="doble">Doble</SelectItem>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="familiar">Familiar</SelectItem>
                      <SelectItem value="deluxe">Deluxe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Grid de Habitaciones */}
            {filteredHabitaciones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BedDouble className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay habitaciones</h3>
                  <p className="text-muted-foreground mb-4">
                    Añade habitaciones para gestionar tu hotel
                  </p>
                  <Button onClick={() => setShowCreateHabitacion(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Habitación
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredHabitaciones.map((hab) => (
                  <Card 
                    key={hab.id} 
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${
                      hab.estado === 'ocupada' ? 'border-blue-200' :
                      hab.estado === 'disponible' ? 'border-green-200' :
                      hab.estado === 'limpieza' ? 'border-amber-200' :
                      hab.estado === 'mantenimiento' ? 'border-red-200' : ''
                    }`}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold mb-2">{hab.numero}</div>
                      <Badge className={estadoHabitacionColors[hab.estado]} variant="secondary">
                        {hab.estado}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-2">
                        {tipoHabitacionLabels[hab.tipo]}
                      </div>
                      <div className="text-sm font-medium mt-1">
                        {hab.tarifaBase}€/noche
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {hab.capacidad}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservas" className="space-y-4">
            {reservas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
                  <p className="text-muted-foreground mb-4">
                    Las reservas aparecerán aquí
                  </p>
                  <Button onClick={() => setShowCreateReserva(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Reserva
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium">Hab.</th>
                          <th className="text-left p-4 font-medium">Huésped</th>
                          <th className="text-left p-4 font-medium">Check-in</th>
                          <th className="text-left p-4 font-medium">Check-out</th>
                          <th className="text-left p-4 font-medium">Noches</th>
                          <th className="text-left p-4 font-medium">Canal</th>
                          <th className="text-left p-4 font-medium">Estado</th>
                          <th className="text-left p-4 font-medium">Total</th>
                          <th className="text-right p-4 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservas.map((reserva) => (
                          <tr key={reserva.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{reserva.habitacionNumero}</td>
                            <td className="p-4">{reserva.huesped}</td>
                            <td className="p-4">{reserva.fechaCheckIn}</td>
                            <td className="p-4">{reserva.fechaCheckOut}</td>
                            <td className="p-4">{reserva.noches}</td>
                            <td className="p-4">
                              <Badge className={canalColors[reserva.canal]} variant="outline">
                                {reserva.canal}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge className={estadoReservaColors[reserva.estado]}>
                                {reserva.estado}
                              </Badge>
                            </td>
                            <td className="p-4">{reserva.total}€</td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="housekeeping" className="space-y-4">
            {housekeeping.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay tareas de housekeeping</h3>
                  <p className="text-muted-foreground">
                    Las tareas de limpieza aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pendientes */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      Pendientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {housekeeping.filter(t => t.estado === 'pendiente').length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay tareas pendientes
                      </p>
                    ) : (
                      housekeeping.filter(t => t.estado === 'pendiente').map((tarea) => (
                        <div key={tarea.id} className="p-3 border rounded-lg mb-2">
                          <div className="font-medium">Hab. {tarea.habitacionNumero}</div>
                          <div className="text-sm text-muted-foreground">{tarea.tipo}</div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
                
                {/* En Progreso */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      En Progreso
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {housekeeping.filter(t => t.estado === 'en_progreso').length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay tareas en progreso
                      </p>
                    ) : (
                      housekeeping.filter(t => t.estado === 'en_progreso').map((tarea) => (
                        <div key={tarea.id} className="p-3 border rounded-lg mb-2">
                          <div className="font-medium">Hab. {tarea.habitacionNumero}</div>
                          <div className="text-sm text-muted-foreground">{tarea.tipo}</div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
                
                {/* Completadas */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Completadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {housekeeping.filter(t => t.estado === 'completada').length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay tareas completadas
                      </p>
                    ) : (
                      housekeeping.filter(t => t.estado === 'completada').map((tarea) => (
                        <div key={tarea.id} className="p-3 border rounded-lg mb-2">
                          <div className="font-medium">Hab. {tarea.habitacionNumero}</div>
                          <div className="text-sm text-muted-foreground">{tarea.tipo}</div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Channel Manager</h3>
                <p className="text-muted-foreground mb-4">
                  Conecta con OTAs: Booking.com, Expedia, Airbnb...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Revenue Management</h3>
                <p className="text-muted-foreground mb-4">
                  Gestión de tarifas dinámicas y optimización de ingresos
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
