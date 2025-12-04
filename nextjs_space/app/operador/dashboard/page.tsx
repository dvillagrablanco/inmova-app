'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  Camera,
  FileText,
  TrendingUp,
  Calendar,
  Building2,
  PlayCircle,
  StopCircle,
  History,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';

interface WorkOrder {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  fechaInicio: string;
  fechaFin?: string;
  checkInTime?: string;
  checkOutTime?: string;
  building?: {
    id: string;
    nombre: string;
    direccion: string;
  };
  unit?: {
    id: string;
    numero: string;
  };
}

interface OperatorStats {
  completedToday: number;
  completedThisMonth: number;
  pending: number;
  inProgress: number;
  totalTimeSpent: number;
}

export default function OperadorDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [stats, setStats] = useState<OperatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user && (session.user as any).role !== 'operador') {
      router.push('/unauthorized');
      return;
    }

    if (session) {
      loadData();
    }
  }, [session, status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/operador/work-orders'),
        fetch('/api/operador/stats'),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setWorkOrders(ordersData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al cargar datos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      const response = await fetch(`/api/operador/work-orders/${orderId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: 'Check-in desde dashboard',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Check-in registrado correctamente',
        });
        loadData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al hacer check-in');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al hacer check-in',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (orderId: string) => {
    try {
      setActionLoading(orderId);
      const response = await fetch(`/api/operador/work-orders/${orderId}/check-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workCompleted: false, // Por defecto, no completado
          completionNotes: 'Check-out desde dashboard',
        }),
      });

      if (response.ok) {
        toast({
          title: 'Éxito',
          description: 'Check-out registrado correctamente',
        });
        loadData();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Error al hacer check-out');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al hacer check-out',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'alta':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'asignada':
        return <Badge className="bg-blue-100 text-blue-700">Asignada</Badge>;
      case 'en_progreso':
        return <Badge className="bg-yellow-100 text-yellow-700">En Progreso</Badge>;
      case 'completada':
        return <Badge className="bg-green-100 text-green-700">Completada</Badge>;
      case 'pausada':
        return <Badge className="bg-gray-100 text-gray-700">Pausada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Panel de Operador</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold">{stats.completedToday}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Progreso</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Botones de acceso rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => router.push('/operador/work-orders/history')}
        >
          <History className="h-6 w-6" />
          <span className="text-sm">Historial</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => router.push('/operador/maintenance-history')}
        >
          <FileText className="h-6 w-6" />
          <span className="text-sm">Mantenimiento</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => router.push('/calendario')}
        >
          <Calendar className="h-6 w-6" />
          <span className="text-sm">Calendario</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-4 flex flex-col gap-2"
          onClick={() => router.push('/edificios')}
        >
          <Building2 className="h-6 w-6" />
          <span className="text-sm">Edificios</span>
        </Button>
      </div>

      {/* Órdenes del día */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Asignaciones del Día
        </h2>

        {workOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium mb-2">No hay órdenes pendientes</p>
            <p className="text-muted-foreground">¡Buen trabajo! Todas las órdenes están completadas.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {workOrders.map((order) => (
              <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{order.titulo}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {order.descripcion}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getStatusBadge(order.estado)}
                      <Badge className={getPriorityColor(order.prioridad)}>
                        {order.prioridad}
                      </Badge>
                    </div>
                  </div>

                  {/* Ubicación */}
                  {order.building && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {order.building.nombre}
                        {order.unit && ` - Unidad ${order.unit.numero}`}
                      </span>
                    </div>
                  )}

                  {/* Horario */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>
                      {format(new Date(order.fechaInicio), 'HH:mm', { locale: es })}
                      {order.fechaFin && ` - ${format(new Date(order.fechaFin), 'HH:mm', { locale: es })}`}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {order.estado === 'asignada' && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex-1 min-w-[120px]"
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Check-In
                      </Button>
                    )}

                    {order.estado === 'en_progreso' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCheckOut(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex-1 min-w-[120px]"
                      >
                        <StopCircle className="h-4 w-4 mr-1" />
                        Check-Out
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/operador/work-orders/${order.id}`)}
                      className="flex-1 min-w-[120px]"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>

                    {order.estado !== 'completada' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/operador/work-orders/${order.id}/photos`)}
                        className="flex-1 min-w-[120px]"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Fotos
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
