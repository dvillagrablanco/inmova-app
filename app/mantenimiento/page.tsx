'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { ContextualQuickActions } from '@/components/navigation/contextual-quick-actions';

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

function MantenimientoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate } = usePermissions();

  // Estados para Solicitudes (Tab 1)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [prioridadFilter, setPrioridadFilter] = useState<string>('all');

  // Estados para Preventivo (Tab 2)
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterActivo, setFilterActivo] = useState('true');
  const [filterUpcoming, setFilterUpcoming] = useState('all');
  const [buildings, setBuildings] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'inspeccion',
    buildingId: '',
    unitId: '',
    frecuencia: 'mensual',
    proximaFecha: '',
    diasAnticipacion: '15',
    providerId: '',
    costoEstimado: '',
    notas: '',
  });

  // Estado general
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('solicitudes');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch de solicitudes (Tab 1)
  useEffect(() => {
    const fetchRequests = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/maintenance');
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        }
      } catch (error) {
        logger.error('Error fetching maintenance requests:', error);
      }
    };

    if (status === 'authenticated' && activeTab === 'solicitudes') {
      fetchRequests();
    }
  }, [status, activeTab]);

  // Fetch de preventivo (Tab 2)
  useEffect(() => {
    const fetchSchedules = async () => {
      if (status !== 'authenticated') return;

      try {
        const [schedRes, buildRes, provRes] = await Promise.all([
          fetch('/api/maintenance-schedule'),
          fetch('/api/buildings'),
          fetch('/api/providers'),
        ]);

        if (schedRes.ok) setSchedules(await schedRes.json());
        if (buildRes.ok) setBuildings(await buildRes.json());
        if (provRes.ok) setProviders(await provRes.json());
      } catch (error) {
        logger.error('Error fetching schedules:', error);
        toast.error('Error al cargar datos');
      }
    };

    if (status === 'authenticated' && activeTab === 'preventivo') {
      fetchSchedules();
    }
  }, [status, activeTab]);

  // Set loading false cuando se carguen los datos
  useEffect(() => {
    if (
      status === 'authenticated' &&
      (requests.length > 0 || schedules.length > 0 || activeTab === 'calendario')
    ) {
      setIsLoading(false);
    } else if (status === 'authenticated') {
      // Dar tiempo para cargar datos vacíos
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [status, requests, schedules, activeTab]);

  // ========== FUNCIONES PARA TAB SOLICITUDES ==========
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        searchTerm === '' ||
        request.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.unit.numero.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = estadoFilter === 'all' || request.estado === estadoFilter;
      const matchesPrioridad = prioridadFilter === 'all' || request.prioridad === prioridadFilter;

      return matchesSearch && matchesEstado && matchesPrioridad;
    });
  }, [requests, searchTerm, estadoFilter, prioridadFilter]);

  const statsRequests = useMemo(() => {
    return {
      total: requests.length,
      pendientes: requests.filter((r) => r.estado === 'pendiente').length,
      enProgreso: requests.filter((r) => r.estado === 'en_progreso').length,
      completados: requests.filter((r) => r.estado === 'completado').length,
      alta: requests.filter((r) => r.prioridad === 'alta').length,
    };
  }, [requests]);

  const getPrioridadBadgeVariant = (prioridad: string) => {
    const variants: Record<string, string> = {
      alta: 'bg-red-500 text-white hover:bg-red-600',
      media: 'bg-yellow-500 text-white hover:bg-yellow-600',
      baja: 'bg-green-500 text-white hover:bg-green-600',
    };
    return variants[prioridad] || 'bg-muted';
  };

  const getEstadoBadgeVariant = (estado: string) => {
    const variants: Record<string, string> = {
      completado: 'bg-green-500 text-white hover:bg-green-600',
      en_progreso: 'bg-blue-500 text-white hover:bg-blue-600',
      programado: 'bg-yellow-500 text-white hover:bg-yellow-600',
      pendiente: 'bg-gray-500 text-white hover:bg-gray-600',
    };
    return variants[estado] || 'bg-muted';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      completado: 'Completado',
      en_progreso: 'En Progreso',
      programado: 'Programado',
      pendiente: 'Pendiente',
    };
    return labels[estado] || estado;
  };

  const getPrioridadLabel = (prioridad: string) => {
    const labels: Record<string, string> = {
      alta: 'Alta',
      media: 'Media',
      baja: 'Baja',
    };
    return labels[prioridad] || prioridad;
  };

  // ========== FUNCIONES PARA TAB PREVENTIVO ==========
  const filteredSchedules = useMemo(() => {
    let filtered = [...schedules];

    if (filterActivo !== 'all') {
      filtered = filtered.filter((s) => s.activo === (filterActivo === 'true'));
    }

    if (filterUpcoming === 'upcoming') {
      const now = new Date();
      const in30Days = new Date(now);
      in30Days.setDate(in30Days.getDate() + 30);
      filtered = filtered.filter((s) => {
        const fecha = new Date(s.proximaFecha);
        return fecha >= now && fecha <= in30Days;
      });
    }

    return filtered;
  }, [schedules, filterActivo, filterUpcoming]);

  const statsSchedules = useMemo(() => {
    return {
      total: schedules.length,
      activos: schedules.filter((s) => s.activo).length,
      proximos30: schedules.filter((s) => {
        const now = new Date();
        const in30Days = new Date(now);
        in30Days.setDate(in30Days.getDate() + 30);
        const fecha = new Date(s.proximaFecha);
        return fecha >= now && fecha <= in30Days;
      }).length,
      vencidos: schedules.filter((s) => {
        const fecha = new Date(s.proximaFecha);
        return fecha < new Date();
      }).length,
    };
  }, [schedules]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/maintenance-schedule/${editingId}`
        : '/api/maintenance-schedule';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(editingId ? 'Mantenimiento actualizado' : 'Mantenimiento programado creado');
        setShowModal(false);
        resetForm();

        const schedRes = await fetch('/api/maintenance-schedule');
        if (schedRes.ok) setSchedules(await schedRes.json());
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/maintenance-schedule/${id}/complete`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Mantenimiento completado. Próxima fecha calculada.');
        const schedRes = await fetch('/api/maintenance-schedule');
        if (schedRes.ok) setSchedules(await schedRes.json());
      } else {
        toast.error('Error al completar mantenimiento');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al completar mantenimiento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta programación?')) return;

    try {
      const response = await fetch(`/api/maintenance-schedule/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Mantenimiento eliminado');
        setSchedules(schedules.filter((s) => s.id !== id));
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar');
    }
  };

  const handleEdit = (schedule: MaintenanceSchedule) => {
    setEditingId(schedule.id);
    setFormData({
      titulo: schedule.titulo,
      descripcion: schedule.descripcion,
      tipo: schedule.tipo,
      buildingId: schedule.building?.id || '',
      unitId: schedule.unit?.id || '',
      frecuencia: schedule.frecuencia,
      proximaFecha: schedule.proximaFecha.split('T')[0],
      diasAnticipacion: schedule.diasAnticipacion.toString(),
      providerId: schedule.provider?.id || '',
      costoEstimado: schedule.costoEstimado?.toString() || '',
      notas: schedule.notas || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo: 'inspeccion',
      buildingId: '',
      unitId: '',
      frecuencia: 'mensual',
      proximaFecha: '',
      diasAnticipacion: '15',
      providerId: '',
      costoEstimado: '',
      notas: '',
    });
    setEditingId(null);
  };

  const getDaysUntil = (fecha: string) => {
    const now = new Date();
    const target = new Date(fecha);
    const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getPriorityColor = (days: number) => {
    if (days < 0) return 'text-red-600 bg-red-50';
    if (days <= 7) return 'text-orange-600 bg-orange-50';
    if (days <= 15) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  // ========== RENDER PRINCIPAL ==========
  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
            <LoadingState message="Cargando mantenimiento..." />
          </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (<div>
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Smart Breadcrumbs */}
            <SmartBreadcrumbs
              totalCount={requests.length + schedules.length}
              showBackButton={true}
            />

            {/* Header Section con Quick Actions */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Mantenimiento</h1>
                <p className="text-muted-foreground">
                  Gestiona solicitudes correctivas, mantenimiento preventivo y calendario unificado
                </p>
              </div>
              
              {/* Quick Actions */}
              <ContextualQuickActions
                pendingMaintenanceRequests={statsReq.pendientes}
                urgentMaintenanceRequests={statsReq.urgentes}
                upcomingMaintenanceTasks={statsSched.proximos}
              />
            </div>

            {/* Tabs Navigation */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="solicitudes" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  Solicitudes
                </TabsTrigger>
                <TabsTrigger value="preventivo" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Preventivo
                </TabsTrigger>
                <TabsTrigger value="calendario" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Calendario
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: SOLICITUDES */}
              <TabsContent value="solicitudes" className="space-y-6 mt-6">
                {/* Estadísticas */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total
                      </CardTitle>
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsRequests.total}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Pendientes
                      </CardTitle>
                      <Clock className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsRequests.pendientes}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        En Progreso
                      </CardTitle>
                      <Hammer className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsRequests.enProgreso}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Completados
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsRequests.completados}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Prioridad Alta
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsRequests.alta}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Búsqueda y Filtros */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Buscar Solicitudes</CardTitle>
                    {canCreate && (
                      <Button onClick={() => router.push('/mantenimiento/nuevo')} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Solicitud
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por título, descripción, edificio o unidad..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="programado">Programado</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las prioridades</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter Chips */}
                    <FilterChips
                      filters={[
                        ...(searchTerm
                          ? [
                              {
                                id: 'search',
                                label: 'Búsqueda',
                                value: searchTerm,
                              },
                            ]
                          : []),
                        ...(estadoFilter !== 'all'
                          ? [
                              {
                                id: 'estado',
                                label: 'Estado',
                                value: getEstadoLabel(estadoFilter),
                              },
                            ]
                          : []),
                        ...(prioridadFilter !== 'all'
                          ? [
                              {
                                id: 'prioridad',
                                label: 'Prioridad',
                                value: getPrioridadLabel(prioridadFilter),
                              },
                            ]
                          : []),
                      ]}
                      onRemove={(id) => {
                        if (id === 'search') setSearchTerm('');
                        else if (id === 'estado') setEstadoFilter('all');
                        else if (id === 'prioridad') setPrioridadFilter('all');
                      }}
                      onClearAll={() => {
                        setSearchTerm('');
                        setEstadoFilter('all');
                        setPrioridadFilter('all');
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Lista de Solicitudes */}
                <div className="space-y-4">
                  {filteredRequests.length === 0 ? (
                    <EmptyState
                      icon={<Wrench className="h-12 w-12" />}
                      title={
                        searchTerm || estadoFilter !== 'all' || prioridadFilter !== 'all'
                          ? 'No se encontraron solicitudes'
                          : 'No hay solicitudes de mantenimiento'
                      }
                      description={
                        searchTerm || estadoFilter !== 'all' || prioridadFilter !== 'all'
                          ? 'No se encontraron solicitudes con los filtros aplicados. Intenta ajustar tu búsqueda.'
                          : 'Comienza creando tu primera solicitud de mantenimiento correctivo para gestionar incidencias.'
                      }
                      action={
                        canCreate &&
                        !searchTerm &&
                        estadoFilter === 'all' &&
                        prioridadFilter === 'all'
                          ? {
                              label: 'Crear Primera Solicitud',
                              onClick: () => router.push('/mantenimiento/nuevo'),
                              icon: <Plus className="h-4 w-4" />,
                            }
                          : undefined
                      }
                    />
                  ) : (
                    filteredRequests.map((request) => (
                      <Card
                        key={request.id}
                        className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                      >
                        <CardContent className="p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Icono de Prioridad */}
                            <div className="flex-shrink-0">
                              <div
                                className={`p-3 rounded-lg ${
                                  request.prioridad === 'alta'
                                    ? 'bg-red-100'
                                    : request.prioridad === 'media'
                                      ? 'bg-yellow-100'
                                      : 'bg-green-100'
                                }`}
                              >
                                {request.prioridad === 'alta' ? (
                                  <AlertTriangle className="h-6 w-6 text-red-600" />
                                ) : (
                                  <Wrench className="h-6 w-6 text-gray-700" />
                                )}
                              </div>
                            </div>

                            {/* Información Principal */}
                            <div className="flex-1 space-y-3">
                              {/* Título y Badges */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h3 className="text-lg font-semibold break-words flex-1">
                                  {request.titulo}
                                </h3>
                                <div className="flex gap-2">
                                  <Badge className={getPrioridadBadgeVariant(request.prioridad)}>
                                    {getPrioridadLabel(request.prioridad)}
                                  </Badge>
                                  <Badge className={getEstadoBadgeVariant(request.estado)}>
                                    {getEstadoLabel(request.estado)}
                                  </Badge>
                                </div>
                              </div>

                              {/* Descripción */}
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {request.descripcion}
                              </p>

                              {/* Unidad */}
                              <div className="bg-muted/50 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-sm">
                                  <Home className="h-4 w-4 flex-shrink-0 text-primary" />
                                  <span className="font-medium">
                                    {request.unit.building.nombre} - Unidad {request.unit.numero}
                                  </span>
                                </div>
                              </div>

                              {/* Información Adicional */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                {request.proveedorAsignado && (
                                  <div className="space-y-1">
                                    <div className="text-muted-foreground">Proveedor</div>
                                    <div className="font-medium truncate">
                                      {request.proveedorAsignado}
                                    </div>
                                  </div>
                                )}
                                {request.costoEstimado && (
                                  <div className="space-y-1">
                                    <div className="text-muted-foreground flex items-center gap-1">
                                      <Euro className="h-3 w-3" />
                                      Costo Estimado
                                    </div>
                                    <div className="font-bold text-lg">
                                      €{request.costoEstimado.toLocaleString('es-ES')}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Acciones */}
                            <div className="flex sm:flex-col items-center gap-2 self-start">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/mantenimiento/${request.id}`)}
                                className="w-full sm:w-auto"
                              >
                                <Eye className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/mantenimiento/${request.id}`)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Detalles
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* TAB 2: PREVENTIVO */}
              <TabsContent value="preventivo" className="space-y-6 mt-6">
                {/* Estadísticas Preventivo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total
                      </CardTitle>
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsSchedules.total}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Activos
                      </CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsSchedules.activos}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Próximos 30 días
                      </CardTitle>
                      <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsSchedules.proximos30}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Vencidos
                      </CardTitle>
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{statsSchedules.vencidos}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filtros y Acciones */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Programaciones</CardTitle>
                    {canCreate && (
                      <Button
                        onClick={() => {
                          resetForm();
                          setShowModal(true);
                        }}
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Mantenimiento
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Select value={filterActivo} onValueChange={setFilterActivo}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="true">Activos</SelectItem>
                          <SelectItem value="false">Inactivos</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterUpcoming} onValueChange={setFilterUpcoming}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Filtro Temporal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="upcoming">Próximos 30 días</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de Programaciones */}
                <div className="space-y-4">
                  {filteredSchedules.length === 0 ? (
                    <EmptyState
                      icon={<CalendarIcon className="h-12 w-12" />}
                      title="No hay mantenimientos programados"
                      description="Comienza creando tu primera programación de mantenimiento preventivo para mantener tus propiedades en óptimas condiciones."
                      action={
                        canCreate
                          ? {
                              label: 'Crear Primer Mantenimiento',
                              onClick: () => {
                                resetForm();
                                setShowModal(true);
                              },
                              icon: <Plus className="h-4 w-4" />,
                            }
                          : undefined
                      }
                    />
                  ) : (
                    filteredSchedules.map((schedule) => {
                      const daysUntil = getDaysUntil(schedule.proximaFecha);
                      const priorityColor = getPriorityColor(daysUntil);
                      const location = schedule.unit
                        ? `${schedule.unit.building?.nombre || ''} - ${schedule.unit.numero}`
                        : schedule.building?.nombre || 'General';

                      return (
                        <Card
                          key={schedule.id}
                          className={`transition-all ${
                            schedule.activo ? 'border-2' : 'border-2 opacity-60'
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">
                                    {schedule.titulo}
                                  </h3>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColor}`}
                                  >
                                    {daysUntil < 0
                                      ? `Vencido hace ${Math.abs(daysUntil)} días`
                                      : daysUntil === 0
                                        ? 'Hoy'
                                        : `En ${daysUntil} días`}
                                  </span>
                                  {!schedule.activo && (
                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                                      Inactivo
                                    </span>
                                  )}
                                </div>

                                <p className="text-gray-600 mb-3">{schedule.descripcion}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Ubicación:</span>
                                    <p className="font-medium text-gray-900">{location}</p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Tipo:</span>
                                    <p className="font-medium text-gray-900 capitalize">
                                      {schedule.tipo}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Frecuencia:</span>
                                    <p className="font-medium text-gray-900 capitalize">
                                      {schedule.frecuencia}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="text-gray-500">Próxima Fecha:</span>
                                    <p className="font-medium text-gray-900">
                                      {new Date(schedule.proximaFecha).toLocaleDateString('es-ES')}
                                    </p>
                                  </div>
                                  {schedule.ultimaFecha && (
                                    <div>
                                      <span className="text-gray-500">Última Ejecución:</span>
                                      <p className="font-medium text-gray-900">
                                        {new Date(schedule.ultimaFecha).toLocaleDateString('es-ES')}
                                      </p>
                                    </div>
                                  )}
                                  {schedule.provider && (
                                    <div>
                                      <span className="text-gray-500">Proveedor:</span>
                                      <p className="font-medium text-gray-900">
                                        {schedule.provider.nombre}
                                      </p>
                                    </div>
                                  )}
                                  {schedule.costoEstimado && (
                                    <div>
                                      <span className="text-gray-500">Costo Estimado:</span>
                                      <p className="font-medium text-gray-900">
                                        €{schedule.costoEstimado.toLocaleString('es-ES')}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 ml-4">
                                <Button
                                  onClick={() => handleComplete(schedule.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:bg-green-50"
                                  title="Marcar como completado"
                                >
                                  <Check className="h-5 w-5" />
                                </Button>
                                <Button
                                  onClick={() => handleEdit(schedule)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:bg-blue-50"
                                  title="Editar"
                                >
                                  <Edit className="h-5 w-5" />
                                </Button>
                                <Button
                                  onClick={() => handleDelete(schedule.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:bg-red-50"
                                  title="Eliminar"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: CALENDARIO */}
              <TabsContent value="calendario" className="space-y-6 mt-6">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Vista de Calendario</h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Aquí se mostrará una vista de calendario unificada con todas las solicitudes
                      de mantenimiento correctivo y preventivo. Esta funcionalidad estará disponible
                      próximamente.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
          </Tabs>
        </div>
        </AuthenticatedLayout>

    {/* Modal para Crear/Editar Preventivo */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Editar Mantenimiento' : 'Nuevo Mantenimiento Preventivo'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  >
                    <option value="inspeccion">Inspección</option>
                    <option value="limpieza">Limpieza</option>
                    <option value="revision_tecnica">Revisión Técnica</option>
                    <option value="certificacion">Certificación</option>
                    <option value="reparacion">Reparación</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frecuencia *
                  </label>
                  <select
                    value={formData.frecuencia}
                    onChange={(e) => setFormData({ ...formData, frecuencia: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  >
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edificio</label>
                  <select
                    value={formData.buildingId}
                    onChange={(e) =>
                      setFormData({ ...formData, buildingId: e.target.value, unitId: '' })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">General/Todos</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidad (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.unitId}
                    onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="ID de unidad específica"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Próxima Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.proximaFecha}
                    onChange={(e) => setFormData({ ...formData, proximaFecha: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Días de Anticipación
                  </label>
                  <input
                    type="number"
                    value={formData.diasAnticipacion}
                    onChange={(e) => setFormData({ ...formData, diasAnticipacion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    min="1"
                    max="90"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <select
                    value={formData.providerId}
                    onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Sin asignar</option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo Estimado (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costoEstimado}
                    onChange={(e) => setFormData({ ...formData, costoEstimado: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 gradient-primary text-white rounded-lg hover:opacity-90 transition-all shadow-primary font-medium"
                >
                  {editingId ? 'Actualizar' : 'Crear'} Mantenimiento
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MantenimientoPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <MantenimientoPage />
    </ErrorBoundary>
  );
}
