'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Home,
  ArrowLeft,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Building2,
  Home as HomeIcon,
  User,
  Euro,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import logger, { logError } from '@/lib/logger';

interface WorkOrder {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  prioridad: string;
  provider: { id: string; nombre: string };
  building: { id: string; nombre: string };
  unit?: { id: string; numero: string };
  fechaAsignacion: string;
  fechaEstimada?: string;
  costoTotal?: number;
}

function OrdenesTrabajoPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermissions();

  // Estados principales
  const [ordenes, setOrdenes] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  // Estados de diálogo
  const [openDialog, setOpenDialog] = useState(false);
  const [editingOrden, setEditingOrden] = useState<WorkOrder | null>(null);

  // Estados del formulario
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'instalacion',
    estado: 'asignada',
    prioridad: 'media',
    providerId: '',
    buildingId: '',
    unitId: 'no-unit',
    fechaAsignacion: '',
    fechaEstimada: '',
    costoTotal: '',
    notas: '',
  });

  // Datos auxiliares
  const [providers, setProviders] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
      fetchAuxData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/ordenes-trabajo');
      const data = await res.json();
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar órdenes de trabajo');
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [provRes, buildRes] = await Promise.all([
        fetch('/api/providers'),
        fetch('/api/buildings'),
      ]);

      if (provRes.ok) setProviders(await provRes.json());
      if (buildRes.ok) {
        const buildingsData = await buildRes.json();
        setBuildings(buildingsData);

        // Cargar unidades del primer edificio si existe
        if (buildingsData.length > 0 && buildingsData[0].units) {
          setUnits(buildingsData[0].units);
        }
      }
    } catch (error) {
      logger.error('Error loading aux data:', error);
    }
  };

  const handleBuildingChange = (buildingId: string) => {
    setFormData({ ...formData, buildingId, unitId: 'no-unit' });
    const building = buildings.find((b) => b.id === buildingId);
    setUnits(building?.units || []);
  };

  const handleOpenDialog = (orden?: WorkOrder) => {
    if (orden) {
      setEditingOrden(orden);
      setFormData({
        titulo: orden.titulo,
        descripcion: orden.descripcion,
        tipo: orden.tipo,
        estado: orden.estado,
        prioridad: orden.prioridad,
        providerId: (orden.provider as any)?.id || '',
        buildingId: (orden.building as any)?.id || '',
        unitId: orden.unit?.id || 'no-unit',
        fechaAsignacion: orden.fechaAsignacion.split('T')[0],
        fechaEstimada: orden.fechaEstimada ? orden.fechaEstimada.split('T')[0] : '',
        costoTotal: orden.costoTotal?.toString() || '',
        notas: '',
      });

      // Cargar unidades del edificio
      if ((orden.building as any)?.id) {
        const building = buildings.find((b) => b.id === (orden.building as any).id);
        setUnits(building?.units || []);
      }
    } else {
      setEditingOrden(null);
      setFormData({
        titulo: '',
        descripcion: '',
        tipo: 'instalacion',
        estado: 'asignada',
        prioridad: 'media',
        providerId: '',
        buildingId: '',
        unitId: 'no-unit',
        fechaAsignacion: '',
        fechaEstimada: '',
        costoTotal: '',
        notas: '',
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.titulo || !formData.providerId || !formData.buildingId) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const url = editingOrden ? `/api/ordenes-trabajo/${editingOrden.id}` : '/api/ordenes-trabajo';
      const method = editingOrden ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          unitId: formData.unitId === 'no-unit' ? null : formData.unitId,
          costoTotal: formData.costoTotal ? parseFloat(formData.costoTotal) : null,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar orden');

      toast.success(editingOrden ? 'Orden actualizada' : 'Orden creada correctamente');
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al guardar la orden');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta orden de trabajo?')) return;

    try {
      const res = await fetch(`/api/ordenes-trabajo/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar orden');

      toast.success('Orden eliminada correctamente');
      fetchData();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al eliminar la orden');
    }
  };

  // Filtros
  const filteredOrdenes = useMemo(() => {
    return ordenes.filter((orden) => {
      const matchesSearch =
        searchTerm === '' ||
        orden.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        orden.building.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = estadoFilter === 'all' || orden.estado === estadoFilter;
      const matchesTipo = tipoFilter === 'all' || orden.tipo === tipoFilter;

      return matchesSearch && matchesEstado && matchesTipo;
    });
  }, [ordenes, searchTerm, estadoFilter, tipoFilter]);

  // Estadísticas
  const stats = useMemo(() => {
    return {
      total: ordenes.length,
      asignadas: ordenes.filter((o) => o.estado === 'asignada').length,
      enProceso: ordenes.filter((o) => o.estado === 'en_progreso').length,
      completadas: ordenes.filter((o) => o.estado === 'completada').length,
    };
  }, [ordenes]);

  const getEstadoBadgeVariant = (estado: string) => {
    const variants: Record<string, string> = {
      asignada: 'bg-blue-500 text-white hover:bg-blue-600',
      en_progreso: 'bg-yellow-500 text-white hover:bg-yellow-600',
      completada: 'bg-green-500 text-white hover:bg-green-600',
      cancelada: 'bg-red-500 text-white hover:bg-red-600',
    };
    return variants[estado] || 'bg-muted';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: Record<string, string> = {
      asignada: 'Asignada',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      cancelada: 'Cancelada',
    };
    return labels[estado] || estado;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      instalacion: 'Instalación',
      reparacion: 'Reparación',
      mantenimiento: 'Mantenimiento',
      inspeccion: 'Inspección',
      limpieza: 'Limpieza',
      otro: 'Otro',
    };
    return labels[tipo] || tipo;
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
            <LoadingState message="Cargando órdenes de trabajo..." />
          </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <div>
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
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
                    <BreadcrumbPage>Órdenes de Trabajo</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Órdenes de Trabajo</h1>
                <p className="text-muted-foreground">Gestiona trabajos asignados a proveedores</p>
              </div>
              {canCreate && (
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Orden
                </Button>
              )}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Asignadas
                  </CardTitle>
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.asignadas}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    En Proceso
                  </CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enProceso}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completadas
                  </CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completadas}</div>
                </CardContent>
              </Card>
            </div>

            {/* Búsqueda y Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Buscar Órdenes</CardTitle>
                <CardDescription>
                  Filtra órdenes por título, proveedor, estado o tipo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título, descripción, proveedor o edificio..."
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
                      <SelectItem value="asignada">Asignada</SelectItem>
                      <SelectItem value="en_progreso">En Progreso</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="instalacion">Instalación</SelectItem>
                      <SelectItem value="reparacion">Reparación</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="inspeccion">Inspección</SelectItem>
                      <SelectItem value="limpieza">Limpieza</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
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
                    ...(tipoFilter !== 'all'
                      ? [
                          {
                            id: 'tipo',
                            label: 'Tipo',
                            value: getTipoLabel(tipoFilter),
                          },
                        ]
                      : []),
                  ]}
                  onRemove={(id) => {
                    if (id === 'search') setSearchTerm('');
                    else if (id === 'estado') setEstadoFilter('all');
                    else if (id === 'tipo') setTipoFilter('all');
                  }}
                  onClearAll={() => {
                    setSearchTerm('');
                    setEstadoFilter('all');
                    setTipoFilter('all');
                  }}
                />
              </CardContent>
            </Card>

            {/* Lista de Órdenes */}
            <div className="space-y-4">
              {filteredOrdenes.length === 0 ? (
                <EmptyState
                  icon={<ClipboardList className="h-12 w-12" />}
                  title={
                    searchTerm || estadoFilter !== 'all' || tipoFilter !== 'all'
                      ? 'No se encontraron órdenes'
                      : 'No hay órdenes de trabajo'
                  }
                  description={
                    searchTerm || estadoFilter !== 'all' || tipoFilter !== 'all'
                      ? 'No se encontraron órdenes con los filtros aplicados. Intenta ajustar tu búsqueda.'
                      : 'Comienza creando tu primera orden de trabajo para gestionar trabajos asignados a proveedores.'
                  }
                  action={
                    canCreate && !searchTerm && estadoFilter === 'all' && tipoFilter === 'all'
                      ? {
                          label: 'Crear Primera Orden',
                          onClick: () => handleOpenDialog(),
                          icon: <Plus className="h-4 w-4" />,
                        }
                      : undefined
                  }
                />
              ) : (
                filteredOrdenes.map((orden) => (
                  <Card key={orden.id} className="hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Icono */}
                        <div className="flex-shrink-0">
                          <div className="p-3 bg-primary/10 rounded-lg">
                            <ClipboardList className="h-6 w-6 text-primary" />
                          </div>
                        </div>

                        {/* Información Principal */}
                        <div className="flex-1 space-y-3">
                          {/* Título y Badges */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="text-lg font-semibold break-words flex-1">
                              {orden.titulo}
                            </h3>
                            <div className="flex gap-2">
                              <Badge className={getEstadoBadgeVariant(orden.estado)}>
                                {getEstadoLabel(orden.estado)}
                              </Badge>
                              <Badge variant="outline">{getTipoLabel(orden.tipo)}</Badge>
                            </div>
                          </div>

                          {/* Descripción */}
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {orden.descripcion}
                          </p>

                          {/* Información del trabajo */}
                          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                Proveedor: {orden.provider.nombre}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-primary" />
                              <span className="font-medium">
                                {orden.building.nombre}
                                {orden.unit && ` - Unidad ${orden.unit.numero}`}
                              </span>
                            </div>
                          </div>

                          {/* Información Adicional */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {orden.fechaEstimada && (
                              <div className="space-y-1">
                                <div className="text-muted-foreground">Fecha Estimada</div>
                                <div className="font-medium">
                                  {new Date(orden.fechaEstimada).toLocaleDateString('es-ES')}
                                </div>
                              </div>
                            )}
                            {orden.costoTotal && (
                              <div className="space-y-1">
                                <div className="text-muted-foreground flex items-center gap-1">
                                  <Euro className="h-3 w-3" />
                                  Costo Total
                                </div>
                                <div className="font-bold text-lg">
                                  €{orden.costoTotal.toLocaleString('es-ES')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex sm:flex-col items-center gap-2 self-start">
                          {canUpdate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDialog(orden)}
                              className="w-full sm:w-auto"
                            >
                              <Edit className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenDialog(orden)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem
                                  onClick={() => handleDelete(orden.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
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

      {/* Dialog para Crear/Editar */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOrden ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
            </DialogTitle>
            <DialogDescription>
              {editingOrden
                ? 'Modifica los detalles de la orden'
                : 'Crea una nueva orden de trabajo'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título de la orden"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada del trabajo"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalacion">Instalación</SelectItem>
                    <SelectItem value="reparacion">Reparación</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="inspeccion">Inspección</SelectItem>
                    <SelectItem value="limpieza">Limpieza</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="estado">Estado *</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asignada">Asignada</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="providerId">Proveedor *</Label>
                <Select
                  value={formData.providerId}
                  onValueChange={(value) => setFormData({ ...formData, providerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id}>
                        {prov.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="buildingId">Edificio *</Label>
                <Select value={formData.buildingId} onValueChange={handleBuildingChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona edificio" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map((build) => (
                      <SelectItem key={build.id} value={build.id}>
                        {build.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unitId">Unidad (Opcional)</Label>
                <Select
                  value={formData.unitId}
                  onValueChange={(value) => setFormData({ ...formData, unitId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-unit">Sin unidad</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unidad {unit.numero}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="fechaAsignacion">Fecha Asignación</Label>
                <Input
                  id="fechaAsignacion"
                  type="date"
                  value={formData.fechaAsignacion}
                  onChange={(e) => setFormData({ ...formData, fechaAsignacion: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="fechaEstimada">Fecha Estimada</Label>
                <Input
                  id="fechaEstimada"
                  type="date"
                  value={formData.fechaEstimada}
                  onChange={(e) => setFormData({ ...formData, fechaEstimada: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="costoTotal">Costo Total (€)</Label>
              <Input
                id="costoTotal"
                type="number"
                step="0.01"
                value={formData.costoTotal}
                onChange={(e) => setFormData({ ...formData, costoTotal: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{editingOrden ? 'Actualizar' : 'Crear'} Orden</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrdenesTrabajoPageWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <OrdenesTrabajoPage />
    </ErrorBoundary>
  );
}
