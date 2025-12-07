'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  FileText,
  Plus,
  Calendar,
  Euro,
  Home,
  ArrowLeft,
  MoreVertical,
  Eye,
  AlertTriangle,
  Clock,
  Trash2,
} from 'lucide-react';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import { SkeletonList, SkeletonCard } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchInput } from '@/components/ui/search-input';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { IconButton } from '@/components/ui/icon-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import toast from 'react-hot-toast';
import logger, { logError } from '@/lib/logger';

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  estado: string;
  tipo: string;
  tenant: {
    nombreCompleto: string;
  };
  unit: {
    numero: string;
    building: {
      nombre: string;
    };
  };
  diasHastaVencimiento?: number;
}

function ContratosPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate, canDelete } = usePermissions();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setError(null);
        const response = await fetch('/api/contracts');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron cargar los contratos`);
        }
        const data = await response.json();
        setContracts(data);
        setFilteredContracts(data);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMsg);
        logError(error instanceof Error ? error : new Error(errorMsg), {
          context: 'fetchContracts',
          page: 'contratos',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchContracts();
    }
  }, [status]);

  const handleDeleteClick = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contractToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/contracts/${contractToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el contrato');
      }

      setContracts((prev) => prev.filter((c) => c.id !== contractToDelete.id));
      toast.success(`Contrato eliminado correctamente`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar';
      toast.error(errorMsg);
      logError(error instanceof Error ? error : new Error(errorMsg), {
        context: 'deleteContract',
        contractId: contractToDelete.id,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setContractToDelete(null);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      const filtered = contracts.filter(
        (contract) =>
          contract.tenant.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.unit.numero.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContracts(filtered);
    } else {
      setFilteredContracts(contracts);
    }
  }, [searchTerm, contracts]);

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

    setActiveFilters(filters);
  }, [searchTerm]);

  const clearFilter = (id: string) => {
    if (id === 'search') {
      setSearchTerm('');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
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

              {/* Skeleton for search bar */}
              <SkeletonCard showHeader={false} />

              {/* Skeleton for stats */}
              <div className="grid gap-4 md:grid-cols-3">
                <SkeletonCard showHeader={true} linesCount={1} />
                <SkeletonCard showHeader={true} linesCount={1} />
                <SkeletonCard showHeader={true} linesCount={1} />
              </div>

              {/* Skeleton for contracts list */}
              <SkeletonList count={3} />

              {/* Loading message */}
              <LoadingState message="Cargando contratos..." size="sm" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string; icon: any }> = {
      activo: { variant: 'default', label: 'Activo', icon: Clock },
      finalizado: { variant: 'secondary', label: 'Finalizado', icon: FileText },
      cancelado: { variant: 'destructive', label: 'Cancelado', icon: AlertTriangle },
      pendiente: { variant: 'outline', label: 'Pendiente', icon: Clock },
    };
    return badges[estado.toLowerCase()] || { variant: 'default', label: estado, icon: FileText };
  };

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      alquiler: { variant: 'default', label: 'Alquiler' },
      compraventa: { variant: 'secondary', label: 'Compraventa' },
      temporal: { variant: 'outline', label: 'Temporal' },
    };
    return badges[tipo.toLowerCase()] || { variant: 'default', label: tipo };
  };

  const activosCount = contracts.filter((c) => c.estado.toLowerCase() === 'activo').length;
  const finalizadosCount = contracts.filter((c) => c.estado.toLowerCase() === 'finalizado').length;
  const totalIngresos = contracts
    .filter((c) => c.estado.toLowerCase() === 'activo')
    .reduce((acc, c) => acc + c.rentaMensual, 0);

  const getDaysUntilExpiry = (fechaFin: string) => {
    const today = new Date();
    const endDate = new Date(fechaFin);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
                    <BreadcrumbPage>Contratos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contratos</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Gestiona los contratos de arrendamiento
                  </p>
                </div>
                <ContextualHelp
                  module={helpData.contratos.module}
                  title={helpData.contratos.title}
                  description={helpData.contratos.description}
                  sections={helpData.contratos.sections}
                  quickActions={
                    canCreate
                      ? [
                          {
                            label: 'Crear nuevo contrato',
                            action: () => router.push('/contratos/nuevo'),
                          },
                        ]
                      : undefined
                  }
                />
              </div>
              {canCreate && (
                <Button
                  onClick={() => router.push('/contratos/nuevo')}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Contrato
                </Button>
              )}
            </div>

            {/* Error Alert */}
            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p className="font-medium">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por inquilino, edificio o unidad..."
                  aria-label="Buscar contratos por inquilino, edificio o unidad"
                />
              </CardContent>
            </Card>

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
                  <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
                  <FileText className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activosCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {contracts.length > 0 ? Math.round((activosCount / contracts.length) * 100) : 0}
                    % del total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{totalIngresos.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">De contratos activos</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Finalizados</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{finalizadosCount}</div>
                  <p className="text-xs text-muted-foreground">Historial</p>
                </CardContent>
              </Card>
            </div>

            {/* Contracts List */}
            <div className="grid gap-4">
              {filteredContracts.map((contract) => {
                const estadoBadge = getEstadoBadge(contract.estado);
                const tipoBadge = getTipoBadge(contract.tipo);
                const daysUntilExpiry = getDaysUntilExpiry(contract.fechaFin);
                const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                const IconComponent = estadoBadge.icon;

                return (
                  <Card key={contract.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 space-y-4 min-w-0">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base sm:text-lg font-semibold break-words">
                                  {contract.tenant.nombreCompleto}
                                </h3>
                                <Badge
                                  variant={estadoBadge.variant}
                                  className="flex items-center gap-1"
                                >
                                  <IconComponent className="h-3 w-3" />
                                  {estadoBadge.label}
                                </Badge>
                                <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
                              </div>
                              <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded-md">
                                <Home className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                                <span className="break-words">
                                  {contract.unit.building.nombre} - Unidad {contract.unit.numero}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detalles */}
                          <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Fecha Inicio</p>
                              <p className="text-sm font-medium">
                                {format(new Date(contract.fechaInicio), 'dd MMM yyyy', {
                                  locale: es,
                                })}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Fecha Fin</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-medium">
                                  {format(new Date(contract.fechaFin), 'dd MMM yyyy', {
                                    locale: es,
                                  })}
                                </p>
                                {isExpiringSoon && (
                                  <Badge variant="destructive" className="text-[10px]">
                                    {daysUntilExpiry}d
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Monto Mensual</p>
                              <p className="text-base sm:text-lg font-bold text-green-600">
                                €{contract.rentaMensual.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Alertas */}
                          {isExpiringSoon && contract.estado.toLowerCase() === 'activo' && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs sm:text-sm text-red-600 font-medium">
                                Vence en {daysUntilExpiry} días - Renovar pronto
                              </p>
                            </div>
                          )}

                          <Button
                            onClick={() => router.push(`/contratos/${contract.id}`)}
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles
                          </Button>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconButton
                              variant="ghost"
                              size="icon"
                              icon={<MoreVertical className="h-4 w-4" />}
                              aria-label={`Opciones para contrato de ${contract.tenant.nombreCompleto}`}
                              className="self-start"
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/contratos/${contract.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(contract)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredContracts.length === 0 &&
              (searchTerm ? (
                <EmptyState
                  icon={<FileText className="h-16 w-16 text-gray-400" />}
                  title="No se encontraron resultados"
                  description={`No hay contratos que coincidan con "${searchTerm}"`}
                  action={{
                    label: 'Limpiar búsqueda',
                    onClick: () => setSearchTerm(''),
                  }}
                />
              ) : (
                <EmptyState
                  icon={<FileText className="h-16 w-16 text-gray-400" />}
                  title="No hay contratos registrados"
                  description="Comienza creando tu primer contrato de arrendamiento"
                  action={
                    canCreate
                      ? {
                          label: 'Crear Primer Contrato',
                          onClick: () => router.push('/contratos/nuevo'),
                          icon: <Plus className="h-4 w-4" />,
                        }
                      : undefined
                  }
                />
              ))}
          </div>
        </main>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar contrato?"
        description={
          contractToDelete
            ? `Se eliminará el contrato de ${contractToDelete.tenant.nombreCompleto} para la unidad ${contractToDelete.unit.numero}. Esta acción no se puede deshacer.`
            : 'Se eliminará el contrato y todos sus datos asociados.'
        }
      />
    </div>
  );
}

// Export with Error Boundary
export default function ContratosPage() {
  return (
    <ErrorBoundary>
      <ContratosPageContent />
    </ErrorBoundary>
  );
}
