'use client';

/**
 * Dashboard del Proveedor de Servicios
 *
 * Vista principal donde el proveedor ve sus estadísticas,
 * reservas recientes y acciones rápidas.
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Calendar,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface ProviderStats {
  serviciosActivos: number;
  reservasEsteMes: number;
  reservasPendientes: number;
  ingresosMes: number;
  valoracionMedia: number;
  totalValoraciones: number;
}

interface RecentBooking {
  id: string;
  servicio: string;
  cliente: string;
  fecha: string;
  hora: string;
  estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
  precio: number;
}

interface ProviderDashboardResponse {
  stats: ProviderStats;
  recentBookings: RecentBooking[];
}

export default function ProveedorDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProviderStats>({
    serviciosActivos: 0,
    reservasEsteMes: 0,
    reservasPendientes: 0,
    ingresosMes: 0,
    valoracionMedia: 0,
    totalValoraciones: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<RecentBooking | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proveedor/dashboard');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar dashboard');
      }

      const data = (await response.json()) as ProviderDashboardResponse;
      setStats(data.stats);
      setRecentBookings(data.recentBookings);
    } catch (error) {
      toast.error('Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        );
      case 'confirmada':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Confirmada
          </Badge>
        );
      case 'completada':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        );
      case 'cancelada':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  const openBookingDetails = (booking: RecentBooking) => {
    setSelectedBooking(booking);
    setIsBookingDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido de vuelta. Aquí tienes un resumen.</p>
        </div>
        <Button onClick={() => router.push('/proveedor/servicios/nuevo')}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Servicios Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{stats.serviciosActivos}</span>
            </div>
            <Button
              variant="link"
              className="p-0 h-auto mt-2 text-sm"
              onClick={() => router.push('/proveedor/servicios')}
            >
              Ver servicios
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reservas Este Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{stats.reservasEsteMes}</span>
            </div>
            {stats.reservasPendientes > 0 && (
              <p className="text-sm text-orange-600 mt-2">
                {stats.reservasPendientes} pendientes de confirmar
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ingresos del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{formatCurrency(stats.ingresosMes)}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <TrendingUp className="h-3 w-3" />
              +12% vs mes anterior
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valoración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <span className="text-2xl font-bold">{stats.valoracionMedia.toFixed(1)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.totalValoraciones} valoraciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Reservas Recientes</CardTitle>
              <CardDescription>Últimas solicitudes de servicio</CardDescription>
            </div>
            <Button variant="outline" onClick={() => router.push('/proveedor/reservas')}>
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay reservas recientes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{booking.servicio}</span>
                      {getStatusBadge(booking.estado)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cliente: {booking.cliente} • {booking.fecha} a las {booking.hora}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-3 sm:mt-0">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(booking.precio)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => openBookingDetails(booking)}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/proveedor/servicios/nuevo')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">Añadir Servicio</h3>
                <p className="text-sm text-muted-foreground">Crea un nuevo servicio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/proveedor/reservas?filter=pendiente')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Reservas Pendientes</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.reservasPendientes} por confirmar
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => router.push('/proveedor/valoraciones')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold">Ver Valoraciones</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.totalValoraciones} opiniones de clientes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalle de Reserva</DialogTitle>
            <DialogDescription>Información completa de la reserva seleccionada</DialogDescription>
          </DialogHeader>
          {selectedBooking ? (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Servicio</p>
                <p className="font-medium">{selectedBooking.servicio}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium">{selectedBooking.cliente}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fecha</p>
                <p className="font-medium">{selectedBooking.fecha}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Hora</p>
                <p className="font-medium">{selectedBooking.hora}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                {getStatusBadge(selectedBooking.estado)}
              </div>
              <div>
                <p className="text-muted-foreground">Precio</p>
                <p className="font-medium">{formatCurrency(selectedBooking.precio)}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay información disponible.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
