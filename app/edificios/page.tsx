'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  Building2,
  Plus,
  MapPin,
  TrendingUp,
  Home,
  ArrowLeft,
  MoreVertical,
  Eye,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ContextualHelp } from '@/components/ui/contextual-help';
import { helpData } from '@/lib/contextual-help-data';
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
import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { EnhancedEmptyState } from '@/components/ui/enhanced-empty-state';
import { ViewModeToggle, ViewMode } from '@/components/ui/view-mode-toggle';
import { SearchInput } from '@/components/ui/search-input';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { IconButton } from '@/components/ui/icon-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import toast from 'react-hot-toast';
import logger, { logError } from '@/lib/logger';


interface Building {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  anoConstructor: number;
  numeroUnidades: number;
  metrics?: {
    totalUnits: number;
    occupiedUnits: number;
    ocupacionPct: number;
    ingresosMensuales: number;
  };
}

function EdificiosPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode, viewModeLoaded] = useLocalStorage<ViewMode>(
    'edificios-view-mode',
    'grid'
  );

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<Building | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        setError(null);
        const response = await fetch('/api/buildings');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron cargar los edificios`);
        }
        const data = await response.json();
        setBuildings(data);
        setFilteredBuildings(data);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMsg);
        logError(error instanceof Error ? error : new Error(errorMsg), {
          context: 'fetchBuildings',
          page: 'edificios',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchBuildings();
    }
  }, [status]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = buildings.filter(
        (building) =>
          building.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          building.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          building.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBuildings(filtered);
    } else {
      setFilteredBuildings(buildings);
    }
  }, [searchTerm, buildings]);

  const handleDeleteClick = (building: Building) => {
    setBuildingToDelete(building);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!buildingToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/buildings/${buildingToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el edificio');
      }

      // Remove from local state
      setBuildings((prev) => prev.filter((b) => b.id !== buildingToDelete.id));
      toast.success(`Edificio "${buildingToDelete.nombre}" eliminado correctamente`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar';
      toast.error(errorMsg);
      logError(error instanceof Error ? error : new Error(errorMsg), {
        context: 'deleteBuilding',
        buildingId: buildingToDelete.id,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setBuildingToDelete(null);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Skeleton className="h-8 w-48 mb-6" />
              <SkeletonList
                count={6}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      residencial: { variant: 'default', label: 'Residencial' },
      comercial: { variant: 'secondary', label: 'Comercial' },
      mixto: { variant: 'outline', label: 'Mixto' },
      industrial: { variant: 'destructive', label: 'Industrial' },
    };
    return badges[tipo.toLowerCase()] || { variant: 'default', label: tipo };
  };

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
                    <BreadcrumbPage>Edificios</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Edificios</h1>
                  <p className="text-muted-foreground">
                    Gestiona los edificios de tu cartera inmobiliaria
                  </p>
                </div>
                <ContextualHelp
                  module={helpData.edificios.module}
                  title={helpData.edificios.title}
                  description={helpData.edificios.description}
                  sections={helpData.edificios.sections}
                  quickActions={
                    canCreate
                      ? [
                          {
                            label: 'Crear nuevo edificio',
                            action: () => router.push('/edificios/nuevo'),
                          },
                        ]
                      : undefined
                  }
                />
              </div>
              {canCreate && (
                <Button onClick={() => router.push('/edificios/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Edificio
                </Button>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <Building2 className="h-5 w-5" />
                    <p className="font-medium">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Bar and View Mode */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por nombre, dirección o tipo..."
                    className="flex-1"
                    aria-label="Buscar edificios por nombre, dirección o tipo"
                  />
                  {viewModeLoaded && (
                    <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Edificios</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{buildings.length}</div>
                  <p className="text-xs text-muted-foreground">En cartera</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {buildings.reduce((acc, b) => acc + (b.metrics?.totalUnits || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Sumando todos los edificios</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {buildings.length > 0
                      ? Math.round(
                          buildings.reduce((acc, b) => acc + (b.metrics?.ocupacionPct || 0), 0) /
                            buildings.length
                        )
                      : 0}
                    %
                  </div>
                  <p className="text-xs text-muted-foreground">De todas las unidades</p>
                </CardContent>
              </Card>
            </div>

            {/* Buildings Display - Grid View */}
            {viewMode === 'grid' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBuildings.map((building) => {
                  const tipoBadge = getTipoBadge(building.tipo);
                  return (
                    <Card key={building.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg">{building.nombre}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{building.direccion}</span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <IconButton
                                variant="ghost"
                                size="icon"
                                icon={<MoreVertical className="h-4 w-4" />}
                                aria-label={`Opciones para ${building.nombre}`}
                              />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/edificios/${building.id}`)}
                              >
                                <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                                Ver Detalles
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(building)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tipo</span>
                            <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Año</span>
                            <span className="text-sm font-medium">{building.anoConstructor}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Unidades</span>
                            <span className="text-sm font-medium">{building.numeroUnidades}</span>
                          </div>
                          {building.metrics && (
                            <>
                              <div className="border-t pt-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Ocupación</span>
                                  <span className="text-sm font-bold">
                                    {building.metrics.ocupacionPct}%
                                  </span>
                                </div>
                                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                                  <div
                                    className="h-2 rounded-full bg-primary transition-all"
                                    style={{ width: `${building.metrics.ocupacionPct}%` }}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Ingresos/mes</span>
                                <span className="text-sm font-bold text-green-600">
                                  €{building.metrics.ingresosMensuales.toLocaleString()}
                                </span>
                              </div>
                            </>
                          )}
                          <Button
                            onClick={() => router.push(`/edificios/${building.id}`)}
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

            {/* Buildings Display - List View (Detailed) */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredBuildings.map((building) => {
                  const tipoBadge = getTipoBadge(building.tipo);
                  return (
                    <Card key={building.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="text-xl font-bold">{building.nombre}</h3>
                                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{building.direccion}</span>
                                </div>
                              </div>
                              <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Año construcción</p>
                                <p className="text-lg font-semibold">{building.anoConstructor}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Unidades</p>
                                <p className="text-lg font-semibold">{building.numeroUnidades}</p>
                              </div>
                              {building.metrics && (
                                <>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Ocupación</p>
                                    <p className="text-lg font-semibold">
                                      {building.metrics.ocupacionPct}%
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Ingresos/mes</p>
                                    <p className="text-lg font-semibold text-green-600">
                                      €{building.metrics.ingresosMensuales.toLocaleString()}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>

                            {building.metrics && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium">Tasa de ocupación</span>
                                  <span className="text-sm font-medium">
                                    {building.metrics.ocupacionPct}%
                                  </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted">
                                  <div
                                    className="h-2 rounded-full bg-primary transition-all"
                                    style={{ width: `${building.metrics.ocupacionPct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex lg:flex-col gap-2">
                            <Button
                              onClick={() => router.push(`/edificios/${building.id}`)}
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

            {/* Buildings Display - Compact View */}
            {viewMode === 'compact' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {filteredBuildings.map((building) => {
                      const tipoBadge = getTipoBadge(building.tipo);
                      return (
                        <div
                          key={building.id}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/edificios/${building.id}`)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-semibold">{building.nombre}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {building.direccion}
                                </span>
                                <Badge variant={tipoBadge.variant} className="text-xs">
                                  {tipoBadge.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center">
                              <p className="text-muted-foreground">Unidades</p>
                              <p className="font-semibold">{building.numeroUnidades}</p>
                            </div>
                            {building.metrics && (
                              <>
                                <div className="text-center">
                                  <p className="text-muted-foreground">Ocupación</p>
                                  <p className="font-semibold">{building.metrics.ocupacionPct}%</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-muted-foreground">Ingresos/mes</p>
                                  <p className="font-semibold text-green-600">
                                    €{building.metrics.ingresosMensuales.toLocaleString()}
                                  </p>
                                </div>
                              </>
                            )}
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

            {filteredBuildings.length === 0 && !searchTerm && (
              <EnhancedEmptyState
                preset="buildings"
                primaryAction={
                  canCreate
                    ? {
                        label: 'Crear Primer Edificio',
                        onClick: () => router.push('/edificios/nuevo'),
                        icon: <Plus className="h-4 w-4" aria-hidden="true" />,
                      }
                    : undefined
                }
                chatSupport={!canCreate}
              />
            )}

            {filteredBuildings.length === 0 && searchTerm && (
              <EnhancedEmptyState
                preset="buildingsFiltered"
                primaryAction={{
                  label: 'Limpiar búsqueda',
                  onClick: () => setSearchTerm(''),
                  variant: 'outline',
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar edificio?"
        itemName={buildingToDelete?.nombre}
        description={
          buildingToDelete
            ? `Se eliminará el edificio "${buildingToDelete.nombre}" y todos sus datos asociados. Esta acción no se puede deshacer.`
            : undefined
        }
      />
    </div>
  );
}

// Export with Error Boundary
export default function EdificiosPage() {
  return (
    <ErrorBoundary>
      <EdificiosPageContent />
    </ErrorBoundary>
  );
}
