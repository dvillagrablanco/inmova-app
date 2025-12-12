'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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
import { LoadingState } from '@/components/ui/loading-state';
import { SkeletonList, SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { EnhancedEmptyState } from '@/components/ui/enhanced-empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import logger from '@/lib/logger';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewModeToggle, ViewMode } from '@/components/ui/view-mode-toggle';


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

export default function UnidadesPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate } = usePermissions();
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units');
        if (response.ok) {
          const data = await response.json();
          setUnits(data);
          setFilteredUnits(data);
        }
      } catch (error) {
        logger.error('Error fetching units:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchUnits();
    }
  }, [status]);

  useEffect(() => {
    let filtered = units;

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
  }, [searchTerm, estadoFilter, tipoFilter, units]);

  // Actualizar filtros activos
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Skeleton for breadcrumbs */}
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-6 w-48" />
              </div>

              {/* Skeleton for header */}
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
              </div>

              {/* Skeleton for search/filters */}
              <div className="grid gap-4 md:grid-cols-3">
                <SkeletonCard showHeader={false} linesCount={1} />
                <SkeletonCard showHeader={false} linesCount={1} />
                <SkeletonCard showHeader={false} linesCount={1} />
              </div>

              {/* Skeleton for stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <SkeletonCard showHeader={true} linesCount={1} />
                <SkeletonCard showHeader={true} linesCount={1} />
                <SkeletonCard showHeader={true} linesCount={1} />
                <SkeletonCard showHeader={true} linesCount={1} />
              </div>

              {/* Skeleton for units list */}
              <SkeletonList count={4} />

              {/* Loading message */}
              <LoadingState message="Cargando unidades..." size="sm" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      ocupada: { variant: 'default', label: 'Ocupada' },
      disponible: { variant: 'secondary', label: 'Disponible' },
      en_mantenimiento: { variant: 'outline', label: 'En Mantenimiento' },
    };
    return badges[estado] || { variant: 'default', label: estado };
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      vivienda: 'Vivienda',
      local: 'Local',
      garaje: 'Garaje',
      trastero: 'Trastero',
    };
    return tipos[tipo] || tipo;
  };

  const unitsOcupadas = units.filter((u) => u.estado === 'ocupada').length;
  const unitsDisponibles = units.filter((u) => u.estado === 'disponible').length;
  const ocupacionRate = units.length > 0 ? Math.round((unitsOcupadas / units.length) * 100) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
                    <BreadcrumbPage>Unidades</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Unidades</h1>
                <p className="text-muted-foreground">Gestiona las unidades de tus propiedades</p>
              </div>
              {canCreate && (
                <Button onClick={() => router.push('/unidades/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Unidad
                </Button>
              )}
            </div>

            {/* Search and Filters */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-3">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por número, edificio o inquilino..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
                  </div>
                </CardContent>
              </Card>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="ocupada">Ocupada</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="vivienda">Vivienda</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="garaje">Garaje</SelectItem>
                  <SelectItem value="trastero">Trastero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters */}
            <FilterChips
              filters={activeFilters}
              onRemove={clearFilter}
              onClearAll={clearAllFilters}
            />

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                  <Square className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{units.length}</div>
                  <p className="text-xs text-muted-foreground">Registradas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unidades Ocupadas</CardTitle>
                  <Home className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{unitsOcupadas}</div>
                  <p className="text-xs text-muted-foreground">{ocupacionRate}% de ocupación</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
                  <Maximize className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{unitsDisponibles}</div>
                  <p className="text-xs text-muted-foreground">Listas para alquilar</p>
                </CardContent>
              </Card>
            </div>

            {/* Units Display - Grid View */}
            {viewMode === 'grid' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredUnits.map((unit) => {
                  const estadoBadge = getEstadoBadge(unit.estado);
                  return (
                    <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg">Unidad {unit.numero}</CardTitle>
                            <p className="text-sm text-muted-foreground">{unit.building.nombre}</p>
                          </div>
                          <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tipo</span>
                            <span className="text-sm font-medium">{getTipoLabel(unit.tipo)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Superficie</span>
                            <span className="text-sm font-medium">{unit.superficie}m²</span>
                          </div>
                          {unit.habitaciones && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Habitaciones</span>
                              <span className="text-sm font-medium">{unit.habitaciones}</span>
                            </div>
                          )}
                          {unit.tenant && (
                            <div className="border-t pt-3">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{unit.tenant.nombreCompleto}</span>
                              </div>
                            </div>
                          )}
                          <div className="border-t pt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Renta mensual</span>
                              <span className="text-lg font-bold text-green-600">
                                €{unit.rentaMensual.toLocaleString('es-ES')}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => router.push(`/unidades/${unit.id}`)}
                            className="w-full mt-2"
                            variant="outline"
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Units Display - List View (Detailed) */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredUnits.map((unit) => {
                  const estadoBadge = getEstadoBadge(unit.estado);
                  return (
                    <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-bold">
                                  {unit.building.nombre} - Unidad {unit.numero}
                                </h3>
                                <p className="text-muted-foreground mt-1">
                                  {getTipoLabel(unit.tipo)}
                                </p>
                              </div>
                              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Superficie</p>
                                <p className="text-lg font-semibold">{unit.superficie}m²</p>
                              </div>
                              {unit.habitaciones && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Habitaciones</p>
                                  <p className="text-lg font-semibold">{unit.habitaciones}</p>
                                </div>
                              )}
                              {unit.banos && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Baños</p>
                                  <p className="text-lg font-semibold">{unit.banos}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-muted-foreground">Renta/mes</p>
                                <p className="text-lg font-semibold text-green-600">
                                  €{unit.rentaMensual.toLocaleString('es-ES')}
                                </p>
                              </div>
                            </div>

                            {unit.tenant && (
                              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">
                                    {unit.tenant.nombreCompleto}
                                  </p>
                                  <p className="text-xs text-muted-foreground">Inquilino actual</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex lg:flex-col gap-2">
                            <Button
                              onClick={() => router.push(`/unidades/${unit.id}`)}
                              className="flex-1 lg:flex-none"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Units Display - Compact View */}
            {viewMode === 'compact' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {filteredUnits.map((unit) => {
                      const estadoBadge = getEstadoBadge(unit.estado);
                      return (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/unidades/${unit.id}`)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Home className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-semibold">
                                {unit.building.nombre} - Unidad {unit.numero}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span>{getTipoLabel(unit.tipo)}</span>
                                <span>•</span>
                                <span>{unit.superficie}m²</span>
                                {unit.habitaciones && (
                                  <>
                                    <span>•</span>
                                    <span>{unit.habitaciones} hab.</span>
                                  </>
                                )}
                                <Badge variant={estadoBadge.variant} className="text-xs">
                                  {estadoBadge.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            {unit.tenant && (
                              <div className="text-center max-w-[120px]">
                                <p className="text-muted-foreground">Inquilino</p>
                                <p className="font-semibold truncate">
                                  {unit.tenant.nombreCompleto}
                                </p>
                              </div>
                            )}
                            <div className="text-center">
                              <p className="text-muted-foreground">Renta/mes</p>
                              <p className="font-semibold text-green-600">
                                €{unit.rentaMensual.toLocaleString('es-ES')}
                              </p>
                            </div>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {filteredUnits.length === 0 &&
              (searchTerm || estadoFilter !== 'all' || tipoFilter !== 'all' ? (
                <EnhancedEmptyState
                  preset="unitsFiltered"
                  primaryAction={{
                    label: 'Limpiar filtros',
                    onClick: clearAllFilters,
                    variant: 'outline',
                  }}
                />
              ) : (
                <EnhancedEmptyState
                  preset="units"
                  primaryAction={
                    canCreate
                      ? {
                          label: 'Crear Primera Unidad',
                          onClick: () => router.push('/unidades/nuevo'),
                          icon: <Plus className="h-4 w-4" aria-hidden="true" />,
                        }
                      : undefined
                  }
                  chatSupport={!canCreate}
                />
              ))}
          </div>
        </main>
      </div>
    </div>
  );
}
