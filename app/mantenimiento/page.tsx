'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/lib/hooks/usePermissions';
import {
  Wrench,
  Plus,
  AlertTriangle,
  ArrowLeft,
  Home,
  Search,
  MoreVertical,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Hammer,
  Euro,
  Calendar as CalendarIcon,
  Check,
  X,
  Edit,
  Trash2,
  Building2,
  Home as HomeIcon,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import logger, { logError } from '@/lib/logger';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MaintenanceRequest {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  costoEstimado: number | null;
  proveedorAsignado: string | null;
  fechaSolicitud: string;
  fechaCompletado: string | null;
  unit: {
    id: string;
    numero: string;
    building: {
      id: string;
      nombre: string;
    };
  };
}

interface MaintenanceSchedule {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  building?: any;
  unit?: any;
  frecuencia: string;
  proximaFecha: string;
  ultimaFecha?: string;
  diasAnticipacion: number;
  activo: boolean;
  provider?: any;
  costoEstimado?: number;
  notas?: string;
  createdAt: string;
}

function MantenimientoPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate, canUpdate } = usePermissions();
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [filterPrioridad, setFilterPrioridad] = useState('all');

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
      setIsLoading(true);
      const [reqRes, schedRes] = await Promise.all([
        fetch('/api/maintenance'),
        fetch('/api/maintenance-schedule'),
      ]);

      if (reqRes.ok) {
        const data = await reqRes.json();
        setRequests(data);
      }

      if (schedRes.ok) {
        const data = await schedRes.json();
        setSchedules(data);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error loading data'), {
        context: 'loadData',
      });
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'all' || req.estado === filterEstado;
      const matchesPrioridad = filterPrioridad === 'all' || req.prioridad === filterPrioridad;
      return matchesSearch && matchesEstado && matchesPrioridad;
    });
  }, [requests, searchTerm, filterEstado, filterPrioridad]);

  const getPrioridadBadge = (prioridad: string) => {
    const variants: Record<string, any> = {
      baja: 'secondary',
      media: 'default',
      alta: 'destructive',
      urgente: 'destructive',
    };
    return variants[prioridad.toLowerCase()] || 'default';
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      pendiente: 'secondary',
      'en-progreso': 'default',
      completado: 'default',
      cancelado: 'outline',
    };
    return variants[estado.toLowerCase()] || 'default';
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <LoadingState message="Cargando datos de mantenimiento..." />
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Mantenimiento</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Wrench className="h-8 w-8 text-primary" />
                Mantenimiento
              </h1>
              <p className="text-muted-foreground">Gestiona solicitudes y programaciones</p>
            </div>
            {canCreate && (
              <Button onClick={() => router.push('/mantenimiento/nuevo')}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Solicitud
              </Button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Solicitudes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{requests.length}</div>
                <p className="text-xs text-muted-foreground">registradas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {requests.filter((r) => r.estado === 'pendiente').length}
                </div>
                <p className="text-xs text-muted-foreground">por atender</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {requests.filter((r) => r.estado === 'en-progreso').length}
                </div>
                <p className="text-xs text-muted-foreground">activas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Programaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {schedules.filter((s) => s.activo).length}
                </div>
                <p className="text-xs text-muted-foreground">activas</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="requests">Solicitudes</TabsTrigger>
              <TabsTrigger value="schedules">Programaciones</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4 mt-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar solicitudes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en-progreso">En Progreso</SelectItem>
                    <SelectItem value="completado">Completado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {filteredRequests.length === 0 ? (
                <EmptyState
                  icon={<Wrench className="h-16 w-16 text-gray-400" />}
                  title="No hay solicitudes"
                  description={
                    searchTerm
                      ? `Sin resultados para "${searchTerm}"`
                      : 'Crea tu primera solicitud de mantenimiento'
                  }
                />
              ) : (
                <div className="grid gap-4">
                  {filteredRequests.map((req) => (
                    <Card key={req.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{req.titulo}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{req.descripcion}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getPrioridadBadge(req.prioridad)}>{req.prioridad}</Badge>
                            <Badge variant={getEstadoBadge(req.estado)}>{req.estado}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Ubicación</p>
                            <p className="font-medium">
                              {req.unit.building.nombre} - {req.unit.numero}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Solicitud</p>
                            <p className="font-medium">
                              {format(new Date(req.fechaSolicitud), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Costo Estimado</p>
                            <p className="font-medium">
                              {req.costoEstimado ? `€${req.costoEstimado}` : 'No estimado'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Proveedor</p>
                            <p className="font-medium">{req.proveedorAsignado || 'Sin asignar'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="schedules" className="space-y-4 mt-4">
              {schedules.length === 0 ? (
                <EmptyState
                  icon={<CalendarIcon className="h-16 w-16 text-gray-400" />}
                  title="No hay programaciones"
                  description="Configura programaciones de mantenimiento preventivo"
                />
              ) : (
                <div className="grid gap-4">
                  {schedules.map((schedule) => (
                    <Card key={schedule.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{schedule.titulo}</CardTitle>
                            <p className="text-sm text-muted-foreground">{schedule.descripcion}</p>
                          </div>
                          <Badge variant={schedule.activo ? 'default' : 'secondary'}>
                            {schedule.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Tipo</p>
                            <p className="font-medium">{schedule.tipo}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Frecuencia</p>
                            <p className="font-medium">{schedule.frecuencia}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Próxima Fecha</p>
                            <p className="font-medium">
                              {format(new Date(schedule.proximaFecha), 'dd MMM yyyy', { locale: es })}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Costo Est.</p>
                            <p className="font-medium">
                              {schedule.costoEstimado ? `€${schedule.costoEstimado}` : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}

export default function MantenimientoPage() {
  return (
    <ErrorBoundary>
      <MantenimientoPageContent />
    </ErrorBoundary>
  );
}
