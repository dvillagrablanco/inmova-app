'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// Contextual help removed for ISR compatibility
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

interface EdificiosClientPageProps {
  initialBuildings: Building[];
}

export function EdificiosClientPage({ initialBuildings }: EdificiosClientPageProps) {
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [buildings, setBuildings] = useState<Building[]>(initialBuildings);
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>(initialBuildings);
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
        const error = await response.json();
        throw new Error(error.message || 'Error al eliminar el edificio');
      }

      // Actualizar estado local
      setBuildings((prev) => prev.filter((b) => b.id !== buildingToDelete.id));
      toast.success('Edificio eliminado exitosamente');
      setDeleteDialogOpen(false);
      setBuildingToDelete(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido al eliminar';
      toast.error(errorMsg);
      logError(error instanceof Error ? error : new Error(errorMsg), {
        context: 'deleteBuilding',
        buildingId: buildingToDelete.id,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Edificios</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-8 w-8 text-indigo-600" />
                  Gestión de Edificios
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Administra tus propiedades y edificios
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canCreate && (
                  <Link href="/edificios/nuevo">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nuevo Edificio
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Edificios</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{buildings.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {buildings.reduce((acc, b) => acc + (b.metrics?.totalUnits || b.numeroUnidades || 0), 0)}
                  </div>
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
                          buildings.reduce((acc, b) => acc + (b.metrics?.ocupacionPct || 0), 0) / buildings.length
                        )
                      : 0}
                    %
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{buildings.reduce((acc, b) => acc + (b.metrics?.ingresosMensuales || 0), 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and View Mode */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="w-full sm:w-96">
                <SearchInput
                  placeholder="Buscar edificios..."
                  value={searchTerm}
                  onChange={(value) => setSearchTerm(value)}
                />
              </div>
              <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
            </div>

            {/* Buildings Grid/List */}
            {filteredBuildings.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuildings.map((building) => (
                  <Card key={building.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-indigo-600" />
                          <CardTitle className="text-lg">{building.nombre}</CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/edificios/${building.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalles
                            </DropdownMenuItem>
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => router.push(`/edificios/${building.id}/editar`)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(building)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{building.direccion}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{building.tipo}</Badge>
                          {building.anoConstructor && (
                            <span className="text-xs text-gray-500">Año: {building.anoConstructor}</span>
                          )}
                        </div>

                        {building.metrics && (
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="text-xs text-gray-500">Unidades</p>
                              <p className="text-sm font-semibold">
                                {building.metrics.occupiedUnits}/{building.metrics.totalUnits}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Ocupación</p>
                              <p className="text-sm font-semibold">{Number(building.metrics.ocupacionPct || 0).toFixed(1)}%</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-xs text-gray-500">Ingresos Mensuales</p>
                              <p className="text-sm font-semibold">
                                €{Number(building.metrics.ingresosMensuales || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="pt-3">
                          <Link href={`/edificios/${building.id}`}>
                            <Button variant="outline" size="sm" className="w-full">
                              Ver Detalles
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredBuildings.length > 0 && viewMode === 'list' && (
              <div className="space-y-4">
                {filteredBuildings.map((building) => (
                  <Card key={building.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <Building2 className="h-8 w-8 text-indigo-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {building.nombre}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{building.direccion}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 ml-4">
                          {building.metrics && (
                            <>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Unidades</p>
                                <p className="text-sm font-semibold">
                                  {building.metrics.occupiedUnits}/{building.metrics.totalUnits}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Ocupación</p>
                                <p className="text-sm font-semibold">{Number(building.metrics.ocupacionPct || 0).toFixed(1)}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500">Ingresos</p>
                                <p className="text-sm font-semibold">
                                  €{Number(building.metrics.ingresosMensuales || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                              </div>
                            </>
                          )}

                          <div className="flex items-center gap-2">
                            <Link href={`/edificios/${building.id}`}>
                              <Button variant="outline" size="sm">
                                Ver
                              </Button>
                            </Link>
                            {canUpdate && (
                              <Link href={`/edificios/${building.id}/editar`}>
                                <Button variant="outline" size="sm">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(building)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty States */}
            {filteredBuildings.length === 0 && !searchTerm && (
              <EnhancedEmptyState
                preset="buildings"
                primaryAction={canCreate ? {
                  label: 'Crear Primer Edificio',
                  onClick: () => router.push('/edificios/nuevo'),
                  icon: <Plus className="h-4 w-4" />,
                } : undefined}
                secondaryActions={canCreate ? [
                  {
                    label: 'Ver Guía',
                    onClick: () => router.push('/ayuda/edificios'),
                    variant: 'outline',
                  },
                  {
                    label: 'Ver Video Tutorial',
                    onClick: () => window.open('https://youtube.com/inmova-edificios', '_blank'),
                    variant: 'ghost',
                  },
                ] : undefined}
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
