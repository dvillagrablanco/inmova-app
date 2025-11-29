'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Calendar, TrendingUp, DollarSign, CheckCircle, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface STRBooking {
  id: string;
  canal: string;
  reservaExternaId?: string;
  guestNombre: string;
  guestEmail: string;
  guestTelefono?: string;
  guestPais?: string;
  numHuespedes: number;
  checkInDate: string;
  checkOutDate: string;
  numNoches: number;
  precioTotal: number;
  tarifaNocturna: number;
  tarifaLimpieza: number;
  tasasImpuestos: number;
  comisionCanal: number;
  ingresoNeto: number;
  metodoPago?: string;
  estadoPago: string;
  pagado: boolean;
  estado: string;
  confirmadaEn?: string;
  checkInRealizado?: string;
  checkOutRealizado?: string;
  canceladaEn?: string;
  motivoCancelacion?: string;
  notasEspeciales?: string;
  requiereLimpieza: boolean;
  limpiezaRealizada: boolean;
  listing: {
    titulo: string;
    unit: {
      numero: string;
      building: {
        nombre: string;
      };
    };
  };
}

export default function STRBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<STRBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterCanal, setFilterCanal] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchBookings();
    }
  }, [session]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/str/bookings');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Error al cargar las reservas');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const matchesEstado = filterEstado === 'all' || booking.estado === filterEstado;
    const matchesCanal = filterCanal === 'all' || booking.canal === filterCanal;
    return matchesEstado && matchesCanal;
  });

  const totalIngresosNetos = bookings.reduce((sum, b) => sum + b.ingresoNeto, 0);
  const totalComisiones = bookings.reduce((sum, b) => sum + b.comisionCanal, 0);
  const totalNoches = bookings.reduce((sum, b) => sum + b.numNoches, 0);
  const totalConfirmadas = bookings.filter(b => b.estado === 'CONFIRMADA').length;

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PENDIENTE: 'bg-yellow-500',
      CONFIRMADA: 'bg-green-500',
      CHECK_IN: 'bg-blue-500',
      CHECK_OUT: 'bg-gray-500',
      CANCELADA: 'bg-red-500',
      NO_SHOW: 'bg-orange-500'
    };
    return colors[estado] || 'bg-gray-500';
  };

  const getCanalColor = (canal: string) => {
    const colors: Record<string, string> = {
      AIRBNB: 'bg-pink-100 text-pink-800',
      BOOKING: 'bg-blue-100 text-blue-800',
      VRBO: 'bg-purple-100 text-purple-800',
      WEB_PROPIA: 'bg-green-100 text-green-800'
    };
    return colors[canal] || 'bg-gray-100 text-gray-800';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando reservas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-6">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Inicio
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Reservas STR</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Dashboard
            </Button>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              Reservas Turísticas
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona las reservas de tus propiedades de alquiler temporal
            </p>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{bookings.length}</div>
                <p className="text-xs text-muted-foreground">
                  {totalConfirmadas} confirmadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Netos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{totalIngresosNetos.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Después de comisiones
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Noches</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalNoches}</div>
                <p className="text-xs text-muted-foreground">
                  Noches reservadas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comisiones</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{totalComisiones.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Pagadas a plataformas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
                <SelectItem value="CHECK_IN">Check-in</SelectItem>
                <SelectItem value="CHECK_OUT">Check-out</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCanal} onValueChange={setFilterCanal}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los canales</SelectItem>
                <SelectItem value="AIRBNB">Airbnb</SelectItem>
                <SelectItem value="BOOKING">Booking</SelectItem>
                <SelectItem value="VRBO">VRBO</SelectItem>
                <SelectItem value="WEB_PROPIA">Web Propia</SelectItem>
                <SelectItem value="OTROS">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Reservas */}
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
                <p className="text-muted-foreground text-center">
                  No se encontraron reservas con los filtros aplicados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      {/* Columna 1: Info Principal */}
                      <div className="md:col-span-5 space-y-2">
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-1" />
                          <div>
                            <h3 className="font-semibold text-lg">{booking.guestNombre}</h3>
                            <p className="text-sm text-muted-foreground">{booking.guestEmail}</p>
                            {booking.guestPais && (
                              <p className="text-xs text-muted-foreground">País: {booking.guestPais}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 text-muted-foreground mt-1" />
                          <div>
                            <p className="font-medium">{booking.listing.titulo}</p>
                            <p className="text-sm text-muted-foreground">
                              {booking.listing.unit.building.nombre} - Unidad {booking.listing.unit.numero}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Columna 2: Fechas */}
                      <div className="md:col-span-3 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Check-in</p>
                          <p className="font-medium">
                            {format(new Date(booking.checkInDate), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Check-out</p>
                          <p className="font-medium">
                            {format(new Date(booking.checkOutDate), "dd MMM yyyy", { locale: es })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duración</p>
                          <p className="font-medium">{booking.numNoches} noches</p>
                        </div>
                      </div>

                      {/* Columna 3: Financiero */}
                      <div className="md:col-span-2 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="text-lg font-bold">€{booking.precioTotal}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Comisión</p>
                          <p className="text-sm font-medium text-red-600">-€{booking.comisionCanal}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Neto</p>
                          <p className="text-sm font-semibold text-green-600">€{booking.ingresoNeto}</p>
                        </div>
                      </div>

                      {/* Columna 4: Estado */}
                      <div className="md:col-span-2 space-y-3">
                        <div className="flex flex-col gap-2">
                          <Badge className={`${getEstadoColor(booking.estado)} text-white`}>
                            {booking.estado}
                          </Badge>
                          <Badge className={getCanalColor(booking.canal)}>
                            {booking.canal}
                          </Badge>
                          {booking.pagado && (
                            <Badge className="bg-green-100 text-green-800">
                              Pagado
                            </Badge>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="w-full">
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
