'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Home,
  ArrowLeft,
  Calendar,
  Plus,
  Search,
  User,
  Bed,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Reservation {
  id: string;
  huespedNombre: string;
  huespedEmail: string;
  habitacionNumero: string;
  propiedad: string;
  fechaEntrada: string;
  fechaSalida: string;
  estado: string;
  precioTotal: number;
  paqueteId?: string;
  paqueteNombre?: string;
}

export default function ColivingReservationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchReservations();
    }
  }, [status, router]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coliving/reservations');
      if (res.ok) {
        const data = await res.json();
        setReservations(Array.isArray(data) ? data : data.reservations || []);
      }
    } catch (error) {
      logger.error('Error fetching reservations:', error);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = reservations.filter((r) => {
    const matchesSearch =
      r.huespedNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.huespedEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.habitacionNumero?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || r.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (estado: string) => {
    const badges: Record<string, { variant: any; icon: any; label: string }> = {
      pendiente: { variant: 'secondary', icon: Clock, label: 'Pendiente' },
      confirmada: { variant: 'default', icon: CheckCircle, label: 'Confirmada' },
      cancelada: { variant: 'destructive', icon: XCircle, label: 'Cancelada' },
      completada: { variant: 'outline', icon: CheckCircle, label: 'Completada' },
    };
    return badges[estado] || badges.pendiente;
  };

  const pendingCount = reservations.filter((r) => r.estado === 'pendiente').length;
  const confirmedCount = reservations.filter((r) => r.estado === 'confirmada').length;
  const totalRevenue = reservations
    .filter((r) => r.estado === 'confirmada' || r.estado === 'completada')
    .reduce((sum, r) => sum + (r.precioTotal || 0), 0);

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
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/coliving">Coliving</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Sistema de Reservas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-3xl font-bold mt-2">Sistema de Reservas Coliving</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona las reservas de habitaciones coliving
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/coliving')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button onClick={() => toast.info('Funcionalidad de nueva reserva próximamente')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservations.length}</div>
              <p className="text-xs text-muted-foreground">Todas las reservas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Por confirmar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
              <p className="text-xs text-muted-foreground">Reservas activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Confirmados + completados</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por huésped, email o habitación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="confirmada">Confirmada</SelectItem>
              <SelectItem value="completada">Completada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservations Table */}
        {filteredReservations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? 'No se encontraron resultados con los filtros aplicados'
                  : 'Las reservas de coliving aparecerán aquí cuando se registren'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Huésped</TableHead>
                    <TableHead>Habitación</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead>Paquete</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReservations.map((reservation) => {
                    const statusBadge = getStatusBadge(reservation.estado);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{reservation.huespedNombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {reservation.huespedEmail}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Bed className="h-3 w-3" />
                            {reservation.habitacionNumero}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {reservation.propiedad}
                          </p>
                        </TableCell>
                        <TableCell>
                          {format(new Date(reservation.fechaEntrada), 'dd MMM yyyy', {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(reservation.fechaSalida), 'dd MMM yyyy', {
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell>
                          {reservation.paqueteNombre || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          €{reservation.precioTotal?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost">
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
