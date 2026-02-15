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
  Sparkles,
  Package,
  Car,
  Utensils,
  Shirt,
  Wrench,
  Home,
  DollarSign,
  Plus,
  Search,
  RefreshCw,
  Calendar,
  CheckCircle,
  Clock,
  Star,
  ShoppingBag,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

interface Service {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  icono?: string;
  precioBase: number;
  unidad: string;
  duracion?: number;
  disponible: boolean;
  proveedorExterno?: string;
  _count?: { reservas: number };
}

interface Booking {
  id: string;
  serviceId: string;
  fechaServicio: string;
  horaInicio: string;
  duracion: number;
  ubicacion: string;
  precioTotal: number;
  estado: string;
  notas?: string;
  service?: { nombre: string };
  tenant?: { nombreCompleto: string };
}

interface Stats {
  totalServicios: number;
  serviciosActivos: number;
  categorias: number;
  reservasTotal: number;
}

const CATEGORIAS = [
  { id: 'limpieza', label: 'Limpieza', icon: Home },
  { id: 'lavanderia', label: 'Lavandería', icon: Shirt },
  { id: 'catering', label: 'Catering', icon: Utensils },
  { id: 'transporte', label: 'Transporte', icon: Car },
  { id: 'reparaciones', label: 'Reparaciones', icon: Wrench },
  { id: 'compras', label: 'Compras', icon: ShoppingBag },
  { id: 'paqueteria', label: 'Paquetería', icon: Package },
  { id: 'premium', label: 'Premium', icon: Star },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ServiciosConciergePage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('servicios');
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Form state - Nuevo Servicio
  const [newService, setNewService] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'limpieza',
    precioBase: 0,
    unidad: 'servicio',
    duracion: 60,
    proveedorExterno: '',
    contactoProveedor: '',
  });

  // Form state - Nueva Reserva
  const [newBooking, setNewBooking] = useState({
    serviceId: '',
    fechaServicio: '',
    horaInicio: '09:00',
    duracion: 60,
    ubicacion: '',
    notas: '',
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
      await Promise.all([loadServices(), loadBookings()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      let url = '/api/concierge';
      if (filterCategoria !== 'all') {
        url += `?categoria=${filterCategoria}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
        setStats(data.stats || null);
        setCategorias(data.categorias || []);
      }
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadBookings = async () => {
    try {
      const response = await fetch('/api/concierge?tipo=bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.data || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  // Crear servicio
  const handleCreateService = async () => {
    if (!newService.nombre || !newService.precioBase) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService),
      });

      if (response.ok) {
        toast.success('Servicio creado');
        setShowNewServiceDialog(false);
        resetServiceForm();
        loadServices();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear servicio');
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error('Error al crear servicio');
    }
  };

  // Reservar servicio
  const handleBookService = async () => {
    if (!newBooking.serviceId || !newBooking.fechaServicio || !newBooking.ubicacion) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking),
      });

      if (response.ok) {
        toast.success('Reserva creada');
        setShowBookingDialog(false);
        resetBookingForm();
        loadBookings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear reserva');
      }
    } catch (error) {
      console.error('Error booking service:', error);
      toast.error('Error al crear reserva');
    }
  };

  const resetServiceForm = () => {
    setNewService({
      nombre: '',
      descripcion: '',
      categoria: 'limpieza',
      precioBase: 0,
      unidad: 'servicio',
      duracion: 60,
      proveedorExterno: '',
      contactoProveedor: '',
    });
  };

  const resetBookingForm = () => {
    setNewBooking({
      serviceId: '',
      fechaServicio: '',
      horaInicio: '09:00',
      duracion: 60,
      ubicacion: '',
      notas: '',
    });
    setSelectedService(null);
  };

  // Obtener ícono de categoría
  const getCategoriaIcon = (categoria: string) => {
    const cat = CATEGORIAS.find(c => c.id === categoria);
    return cat?.icon || Sparkles;
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-700';
      case 'pendiente': return 'bg-yellow-100 text-yellow-700';
      case 'confirmado': return 'bg-blue-100 text-blue-700';
      case 'cancelado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Filtrar servicios
  const filteredServices = services.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
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
            <div className="p-3 bg-pink-100 rounded-xl">
              <Sparkles className="h-8 w-8 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Servicios de Concierge</h1>
              <p className="text-muted-foreground">
                Servicios premium para residentes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { resetServiceForm(); setShowNewServiceDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalServicios || 0}</p>
                  <p className="text-xs text-muted-foreground">Servicios</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.serviciosActivos || 0}</p>
                  <p className="text-xs text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.categorias || 0}</p>
                  <p className="text-xs text-muted-foreground">Categorías</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.reservasTotal || 0}</p>
                  <p className="text-xs text-muted-foreground">Reservas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="servicios" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Servicios ({services.length})
            </TabsTrigger>
            <TabsTrigger value="reservas" className="gap-2">
              <Calendar className="h-4 w-4" />
              Reservas ({bookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Servicios */}
          <TabsContent value="servicios" className="mt-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar servicios..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterCategoria} onValueChange={v => { setFilterCategoria(v); loadServices(); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadServices}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {filteredServices.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No hay servicios</h3>
                  <p className="text-muted-foreground">Crea tu primer servicio de concierge</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredServices.map(service => {
                  const Icon = getCategoriaIcon(service.categoria);
                  return (
                    <Card key={service.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-lg">
                              <Icon className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{service.nombre}</CardTitle>
                              <CardDescription className="capitalize">{service.categoria}</CardDescription>
                            </div>
                          </div>
                          <Badge variant={service.disponible ? 'default' : 'secondary'}>
                            {service.disponible ? 'Disponible' : 'No disponible'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.descripcion}
                        </p>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Precio</span>
                          <span className="font-bold text-green-600">
                            €{service.precioBase}/{service.unidad}
                          </span>
                        </div>
                        {service.duracion && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Duración</span>
                            <span>{service.duracion} min</span>
                          </div>
                        )}
                        {service._count?.reservas !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Reservas</span>
                            <span>{service._count.reservas}</span>
                          </div>
                        )}
                        {service.proveedorExterno && (
                          <p className="text-xs text-muted-foreground pt-2 border-t">
                            Proveedor: {service.proveedorExterno}
                          </p>
                        )}
                        <Button
                          className="w-full mt-2"
                          disabled={!service.disponible}
                          onClick={() => {
                            setSelectedService(service);
                            setNewBooking(prev => ({ ...prev, serviceId: service.id }));
                            setShowBookingDialog(true);
                          }}
                        >
                          Reservar Servicio
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Reservas */}
          <TabsContent value="reservas" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-0">
                {bookings.length === 0 ? (
                  <div className="py-16 text-center">
                    <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No hay reservas</h3>
                    <p className="text-muted-foreground">Las reservas aparecerán aquí</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Hora</TableHead>
                        <TableHead>Ubicación</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Precio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map(booking => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.service?.nombre || 'Servicio'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.fechaServicio), "dd MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell>{booking.horaInicio}</TableCell>
                          <TableCell>{booking.ubicacion}</TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(booking.estado)}>
                              {booking.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold">€{booking.precioTotal}</TableCell>
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

      {/* Dialog: Nuevo Servicio */}
      <Dialog open={showNewServiceDialog} onOpenChange={setShowNewServiceDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Servicio</DialogTitle>
            <DialogDescription>Añade un nuevo servicio de concierge</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nombre *</Label>
                <Input
                  placeholder="Limpieza profunda"
                  value={newService.nombre}
                  onChange={e => setNewService(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Descripción del servicio..."
                  value={newService.descripcion}
                  onChange={e => setNewService(prev => ({ ...prev, descripcion: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={newService.categoria}
                  onValueChange={v => setNewService(prev => ({ ...prev, categoria: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Precio Base (€) *</Label>
                <Input
                  type="number"
                  min="0"
                  value={newService.precioBase}
                  onChange={e => setNewService(prev => ({ ...prev, precioBase: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select
                  value={newService.unidad}
                  onValueChange={v => setNewService(prev => ({ ...prev, unidad: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servicio">Por servicio</SelectItem>
                    <SelectItem value="hora">Por hora</SelectItem>
                    <SelectItem value="dia">Por día</SelectItem>
                    <SelectItem value="m2">Por m²</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  min="0"
                  value={newService.duracion}
                  onChange={e => setNewService(prev => ({ ...prev, duracion: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Proveedor Externo</Label>
                <Input
                  placeholder="Nombre del proveedor (opcional)"
                  value={newService.proveedorExterno}
                  onChange={e => setNewService(prev => ({ ...prev, proveedorExterno: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewServiceDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateService}>Crear Servicio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reservar Servicio */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reservar Servicio</DialogTitle>
            <DialogDescription>
              {selectedService?.nombre} - €{selectedService?.precioBase}/{selectedService?.unidad}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={newBooking.fechaServicio}
                  onChange={e => setNewBooking(prev => ({ ...prev, fechaServicio: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora *</Label>
                <Input
                  type="time"
                  value={newBooking.horaInicio}
                  onChange={e => setNewBooking(prev => ({ ...prev, horaInicio: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Ubicación *</Label>
                <Input
                  placeholder="Apartamento 4B, Edificio Central"
                  value={newBooking.ubicacion}
                  onChange={e => setNewBooking(prev => ({ ...prev, ubicacion: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Instrucciones adicionales</Label>
                <Textarea
                  placeholder="Instrucciones especiales para el servicio..."
                  value={newBooking.notas}
                  onChange={e => setNewBooking(prev => ({ ...prev, notas: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBookService}>Confirmar Reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
