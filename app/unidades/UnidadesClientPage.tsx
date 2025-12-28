'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  Home,
  Plus,
  Building2,
  User,
  ArrowLeft,
  MoreVertical,
  Eye,
  Search,
  Square,
  Maximize,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ViewModeToggle, ViewMode } from '@/components/ui/view-mode-toggle';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  estado: string;
  superficie: number;
  habitaciones?: number;
  banos?: number;
  rentaMensual: number;
  building: {
    nombre: string;
  };
  tenant?: {
    nombreCompleto: string;
  };
}

interface UnidadesClientPageProps {
  initialUnits: Unit[];
  session: any;
}

export default function UnidadesClientPage({
  initialUnits,
  session,
}: UnidadesClientPageProps) {
  const router = useRouter();
  const { canCreate } = usePermissions();
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>(initialUnits);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load view preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('unidades-view-mode') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('unidades-view-mode', mode);
  };

  // Apply filters
  useEffect(() => {
    let filtered = initialUnits;

    if (searchTerm) {
      filtered = filtered.filter(
        (unit) =>
          unit.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          unit.tenant?.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (estadoFilter && estadoFilter !== 'all') {
      filtered = filtered.filter((unit) => unit.estado === estadoFilter);
    }

    if (tipoFilter && tipoFilter !== 'all') {
      filtered = filtered.filter((unit) => unit.tipo === tipoFilter);
    }

    setFilteredUnits(filtered);
  }, [searchTerm, estadoFilter, tipoFilter, initialUnits]);

  // Update active filters
  useEffect(() => {
    const filters: Array<{ id: string; label: string; value: string }> = [];

    if (searchTerm) {
      filters.push({
        id: 'search',
        label: 'Búsqueda',
        value: searchTerm,
      });
    }

    if (estadoFilter && estadoFilter !== 'all') {
      const estadoLabels: Record<string, string> = {
        disponible: 'Disponible',
        ocupada: 'Ocupada',
        mantenimiento: 'En Mantenimiento',
      };
      filters.push({
        id: 'estado',
        label: 'Estado',
        value: estadoLabels[estadoFilter] || estadoFilter,
      });
    }

    if (tipoFilter && tipoFilter !== 'all') {
      const tipoLabels: Record<string, string> = {
        vivienda: 'Vivienda',
        local: 'Local',
        oficina: 'Oficina',
        estudio: 'Estudio',
      };
      filters.push({
        id: 'tipo',
        label: 'Tipo',
        value: tipoLabels[tipoFilter] || tipoFilter,
      });
    }

    setActiveFilters(filters);
  }, [searchTerm, estadoFilter, tipoFilter]);

  const clearFilter = (id: string) => {
    if (id === 'search') {
      setSearchTerm('');
    } else if (id === 'estado') {
      setEstadoFilter('all');
    } else if (id === 'tipo') {
      setTipoFilter('all');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setEstadoFilter('all');
    setTipoFilter('all');
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return 'default';
      case 'ocupada':
        return 'secondary';
      case 'mantenimiento':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'vivienda':
        return 'default';
      case 'local':
        return 'secondary';
      case 'oficina':
        return 'outline';
      default:
        return 'default';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const handleDeleteClick = (unit: Unit, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setUnitToDelete(unit);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!unitToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/units/${unitToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFilteredUnits((prev) => prev.filter((u) => u.id !== unitToDelete.id));
        toast.success('Unidad eliminada exitosamente');
        setDeleteDialogOpen(false);
        setUnitToDelete(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar la unidad');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al eliminar';
      toast.error(errorMsg);
      logger.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6 space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/home">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Unidades</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header con título y acciones */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Unidades</h1>
              <p className="text-muted-foreground mt-2">
                Gestiona todas las unidades de alquiler
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => router.push('/unidades/nueva')}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Unidad
              </Button>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{initialUnits.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                <Square className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialUnits.filter((u) => u.estado === 'disponible').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
                <User className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialUnits.filter((u) => u.estado === 'ocupada').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ingresos Potenciales
                </CardTitle>
                <Maximize className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    initialUnits.reduce((sum, u) => sum + u.rentaMensual, 0)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros y búsqueda */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por número, edificio o inquilino..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFilter} onValueChange={setTipoFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="vivienda">Vivienda</SelectItem>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="estudio">Estudio</SelectItem>
                    </SelectContent>
                  </Select>
                  <ViewModeToggle
                    value={viewMode}
                    onChange={handleViewModeChange}
                  />
                </div>

                {activeFilters.length > 0 && (
                  <FilterChips
                    filters={activeFilters}
                    onRemove={clearFilter}
                    onClearAll={clearAllFilters}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lista de unidades */}
          {filteredUnits.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-12 w-12" />}
              title="No hay unidades"
              description={
                activeFilters.length > 0
                  ? 'No se encontraron unidades con los filtros aplicados'
                  : 'Comienza creando tu primera unidad'
              }
              actions={
                activeFilters.length > 0
                  ? [
                      {
                        label: 'Limpiar Filtros',
                        onClick: clearAllFilters,
                        variant: 'outline' as const,
                      },
                    ]
                  : canCreate
                  ? [
                      {
                        label: 'Crear Unidad',
                        onClick: () => router.push('/unidades/nueva'),
                        variant: 'default' as const,
                      },
                    ]
                  : undefined
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredUnits.map((unit) => (
                <Card
                  key={unit.id}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => router.push(`/unidades/${unit.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Unidad {unit.numero}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {unit.building.nombre}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/unidades/${unit.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/unidades/${unit.id}/editar`);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(unit, e)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Badge variant={getEstadoBadgeVariant(unit.estado)}>
                          {unit.estado}
                        </Badge>
                        <Badge variant={getTipoBadgeVariant(unit.tipo)}>
                          {unit.tipo}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Superficie</p>
                          <p className="font-medium">{Number(unit.superficie || 0)} m²</p>
                        </div>
                        {unit.habitaciones && (
                          <div>
                            <p className="text-muted-foreground">Habitaciones</p>
                            <p className="font-medium">{unit.habitaciones}</p>
                          </div>
                        )}
                        {unit.banos && (
                          <div>
                            <p className="text-muted-foreground">Baños</p>
                            <p className="font-medium">{unit.banos}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Renta</p>
                          <p className="font-medium">
                            {formatCurrency(Number(unit.rentaMensual || 0))}
                          </p>
                        </div>
                      </div>

                      {unit.tenant && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground">Inquilino</p>
                                <p className="font-medium">{String(unit.tenant?.nombreCompleto || '')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/unidades/${unit.id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Unidad {unit.numero}</p>
                            <Badge variant={getEstadoBadgeVariant(unit.estado)}>
                              {unit.estado}
                            </Badge>
                            <Badge variant={getTipoBadgeVariant(unit.tipo)}>
                              {unit.tipo}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {String(unit.building?.nombre || '')}
                          </p>
                          {unit.tenant && (
                          <p className="text-sm text-muted-foreground">
                            Inquilino: {String(unit.tenant?.nombreCompleto || '')}
                          </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm text-muted-foreground">Renta mensual</p>
                          <p className="font-medium">
                            {formatCurrency(Number(unit.rentaMensual || 0))}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/unidades/${unit.id}`);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalle
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/unidades/${unit.id}/editar`);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleDeleteClick(unit, e)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Unidad"
        description={
          unitToDelete
            ? `¿Estás seguro de que deseas eliminar la unidad ${unitToDelete.numero} del edificio ${unitToDelete.building.nombre}?`
            : ''
        }
      />
    </div>
  );
}
