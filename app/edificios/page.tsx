'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
import { SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ViewModeToggle, ViewMode } from '@/components/ui/view-mode-toggle';
import { SearchInput } from '@/components/ui/search-input';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { IconButton } from '@/components/ui/icon-button';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import toast from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
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
    if (!searchTerm) {
      setFilteredBuildings(buildings);
      return;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = buildings.filter(
      (building) =>
        building.nombre.toLowerCase().includes(lowercasedTerm) ||
        building.direccion.toLowerCase().includes(lowercasedTerm) ||
        building.tipo.toLowerCase().includes(lowercasedTerm)
    );

    setFilteredBuildings(filtered);
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

      setBuildings((prev) => prev.filter((b) => b.id !== buildingToDelete.id));
      setFilteredBuildings((prev) => prev.filter((b) => b.id !== buildingToDelete.id));
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

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      residencial: { variant: 'default', label: 'Residencial' },
      comercial: { variant: 'secondary', label: 'Comercial' },
      mixto: { variant: 'outline', label: 'Mixto' },
      industrial: { variant: 'destructive', label: 'Industrial' },
    };
    return badges[tipo.toLowerCase()] || { variant: 'default', label: tipo };
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  const activeFilters = searchTerm
    ? [{ id: 'search', label: 'Búsqueda', value: searchTerm }]
    : [];

  const clearFilter = (id: string) => {
    if (id === 'search') setSearchTerm('');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header con Breadcrumbs */}
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edificios</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Gestiona tu cartera de propiedades
                </p>
              </div>
              <ContextualHelp
                module={helpData.edificios.module}
                topic={helpData.edificios.topic}
              />
            </div>
            <div className="flex items-center gap-2">
              {viewModeLoaded && (
                <ViewModeToggle currentMode={viewMode} onModeChange={handleViewModeChange} />
              )}
              {canCreate && (
                <Button onClick={() => router.push('/edificios/nuevo')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Edificio
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <SearchInput
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Buscar por nombre, dirección o tipo..."
          />

          {/* Buildings List */}
          {filteredBuildings.length === 0 ? (
            searchTerm ? (
              <EmptyState
                icon={<Building2 className="h-16 w-16 text-gray-400" />}
                title="No se encontraron resultados"
                description={`No hay edificios que coincidan con "${searchTerm}"`}
                action={{
                  label: 'Limpiar búsqueda',
                  onClick: () => setSearchTerm(''),
                }}
              />
            ) : (
              <EmptyState
                icon={<Building2 className="h-16 w-16 text-gray-400" />}
                title="No hay edificios registrados"
                description="Comienza agregando tu primer edificio"
                action={
                  canCreate
                    ? {
                        label: 'Agregar Primer Edificio',
                        onClick: () => router.push('/edificios/nuevo'),
                        icon: <Plus className="h-4 w-4" />,
                      }
                    : undefined
                }
              />
            )
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredBuildings.map((building) => {
                const tipoBadge = getTipoBadge(building.tipo);

                return (
                  <Card key={building.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                            <CardTitle className="text-lg truncate">{building.nombre}</CardTitle>
                          </div>
                          <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
                        </div>
                        {(canUpdate || canDelete) && (
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
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalles
                              </DropdownMenuItem>
                              {canDelete && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(building)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="break-words">{building.direccion}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground">Unidades</p>
                            <p className="text-lg font-semibold">{building.numeroUnidades}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Año</p>
                            <p className="text-lg font-semibold">{building.anoConstructor}</p>
                          </div>
                        </div>
                        {building.metrics && (
                          <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Ocupación</p>
                              <p className="text-lg font-semibold text-green-600">
                                {building.metrics.ocupacionPct}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Ingresos</p>
                              <p className="text-lg font-semibold text-blue-600">
                                €{building.metrics.ingresosMensuales.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => router.push(`/edificios/${building.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalles
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar edificio?"
        description={
          buildingToDelete
            ? `Se eliminará "${buildingToDelete.nombre}" y todas sus unidades asociadas. Esta acción no se puede deshacer.`
            : 'Se eliminará el edificio y toda su información.'
        }
      />
    </AuthenticatedLayout>
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
