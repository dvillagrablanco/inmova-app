'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Home, Plus, Building2, User, ArrowLeft, MoreVertical, Eye, Search, Square, Maximize } from 'lucide-react';
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
import { FilterChips } from '@/components/ui/filter-chips';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [activeFilters, setActiveFilters] = useState<Array<{ label: string; value: string; key: string }>>([]);

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
        console.error('Error fetching units:', error);
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
      filtered = filtered.filter((unit) =>
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
    const filters: Array<{ label: string; value: string; key: string }> = [];
    
    if (searchTerm) {
      filters.push({
        label: 'Búsqueda',
        value: searchTerm,
        key: 'search'
      });
    }
    
    if (estadoFilter && estadoFilter !== 'all') {
      const estadoLabels: Record<string, string> = {
        'disponible': 'Disponible',
        'ocupada': 'Ocupada',
        'mantenimiento': 'En Mantenimiento'
      };
      filters.push({
        label: 'Estado',
        value: estadoLabels[estadoFilter] || estadoFilter,
        key: 'estado'
      });
    }
    
    if (tipoFilter && tipoFilter !== 'all') {
      const tipoLabels: Record<string, string> = {
        'vivienda': 'Vivienda',
        'local': 'Local',
        'oficina': 'Oficina',
        'estudio': 'Estudio'
      };
      filters.push({
        label: 'Tipo',
        value: tipoLabels[tipoFilter] || tipoFilter,
        key: 'tipo'
      });
    }
    
    setActiveFilters(filters);
  }, [searchTerm, estadoFilter, tipoFilter]);

  const clearFilter = (key: string) => {
    if (key === 'search') {
      setSearchTerm('');
    } else if (key === 'estado') {
      setEstadoFilter('all');
    } else if (key === 'tipo') {
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
              <LoadingState 
                message="Cargando unidades..." 
                submessage="Obteniendo información de propiedades y ocupación"
                size="sm"
              />
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
                <p className="text-muted-foreground">
                  Gestiona las unidades de tus propiedades
                </p>
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por número, edificio o inquilino..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
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
                  <p className="text-xs text-muted-foreground">
                    {ocupacionRate}% de ocupación
                  </p>
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

            {/* Units List */}
            <div className="grid gap-4">
              {filteredUnits.map((unit) => {
                const estadoBadge = getEstadoBadge(unit.estado);

                return (
                  <Card key={unit.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                            <Home className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-semibold break-words">
                                {unit.building.nombre} - Unidad {unit.numero}
                              </h3>
                              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <Building2 className="h-4 w-4 flex-shrink-0" />
                                <span>{getTipoLabel(unit.tipo)}</span>
                                <span>•</span>
                                <span>{unit.superficie}m²</span>
                                {unit.habitaciones && (
                                  <>
                                    <span>•</span>
                                    <span>{unit.habitaciones} hab.</span>
                                  </>
                                )}
                                {unit.banos && (
                                  <>
                                    <span>•</span>
                                    <span>{unit.banos} baños</span>
                                  </>
                                )}
                              </div>
                              {unit.tenant && (
                                <div className="flex items-center gap-2 min-w-0">
                                  <User className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{unit.tenant.nombreCompleto}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                              <span className="text-xs text-muted-foreground">Renta mensual:</span>
                              <span className="text-base font-bold text-green-600">
                                €{unit.rentaMensual.toLocaleString('es-ES')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="self-start">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/unidades/${unit.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredUnits.length === 0 && (
              (searchTerm || estadoFilter !== 'all' || tipoFilter !== 'all') ? (
                <EmptyState
                  icon={Search}
                  title="No se encontraron resultados"
                  description="No hay unidades que coincidan con los filtros aplicados"
                  action={{
                    label: 'Limpiar filtros',
                    onClick: clearAllFilters
                  }}
                />
              ) : (
                <EmptyState
                  icon={Home}
                  title="No hay unidades registradas"
                  description="Comienza agregando tu primera unidad al edificio"
                  action={canCreate ? {
                    label: 'Crear Primera Unidad',
                    onClick: () => router.push('/unidades/nuevo'),
                    icon: Plus
                  } : undefined}
                />
              )
            )}
          </div>
        </main>
      </div>
    </div>
  );
}