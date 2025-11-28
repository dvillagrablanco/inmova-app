'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
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
} from 'lucide-react';

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

export default function MantenimientoPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate } = usePermissions();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [prioridadFilter, setPrioridadFilter] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('/api/maintenance');
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        }
      } catch (error) {
        console.error('Error fetching maintenance requests:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchRequests();
    }
  }, [status]);

  // Filtrado de solicitudes
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      // Filtro por búsqueda
      const matchesSearch =
        searchTerm === '' ||
        request.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.unit.numero.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro por estado
      const matchesEstado = estadoFilter === 'all' || request.estado === estadoFilter;

      // Filtro por prioridad
      const matchesPrioridad = prioridadFilter === 'all' || request.prioridad === prioridadFilter;

      return matchesSearch && matchesEstado && matchesPrioridad;
    });
  }, [requests, searchTerm, estadoFilter, prioridadFilter]);

  // Cálculo de estadísticas
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pendientes: requests.filter((r) => r.estado === 'pendiente').length,
      enProgreso: requests.filter((r) => r.estado === 'en_progreso').length,
      completados: requests.filter((r) => r.estado === 'completado').length,
      alta: requests.filter((r) => r.prioridad === 'alta').length,
    };
  }, [requests]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

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

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al Dashboard
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

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Mantenimiento</h1>
                <p className="text-muted-foreground">
                  Gestiona las solicitudes de mantenimiento de tus propiedades
                </p>
              </div>
              {canCreate && (
                <Button onClick={() => router.push('/mantenimiento/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Solicitud
                </Button>
              )}
            </div>

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
                  <div className="text-2xl font-bold">{stats.total}</div>
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
                  <div className="text-2xl font-bold">{stats.pendientes}</div>
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
                  <div className="text-2xl font-bold">{stats.enProgreso}</div>
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
                  <div className="text-2xl font-bold">{stats.completados}</div>
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
                  <div className="text-2xl font-bold">{stats.alta}</div>
                </CardContent>
              </Card>
            </div>

            {/* Búsqueda y Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Buscar Solicitudes</CardTitle>
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
              </CardContent>
            </Card>

            {/* Lista de Solicitudes */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center mb-2">
                      {searchTerm || estadoFilter !== 'all' || prioridadFilter !== 'all'
                        ? 'No se encontraron solicitudes con los filtros aplicados'
                        : 'No hay solicitudes de mantenimiento'}
                    </p>
                    {canCreate && !searchTerm && estadoFilter === 'all' && prioridadFilter === 'all' && (
                      <Button
                        onClick={() => router.push('/mantenimiento/nuevo')}
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Primera Solicitud
                      </Button>
                    )}
                  </CardContent>
                </Card>
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
          </div>
        </main>
      </div>
    </div>
  );
}