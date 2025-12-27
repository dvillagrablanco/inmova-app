'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
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
      if (status !== 'authenticated') return;

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/contracts');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setContracts(data);
        setFilteredContracts(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMessage);
        logError(error instanceof Error ? error : new Error(errorMessage), {
          context: 'fetchContracts',
          userId: session?.user?.id,
        });
        toast.error('Error al cargar los contratos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, [status, session]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredContracts(contracts);
      return;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = contracts.filter(
      (contract) =>
        contract.tenant.nombreCompleto.toLowerCase().includes(lowercasedTerm) ||
        contract.unit.building.nombre.toLowerCase().includes(lowercasedTerm) ||
        contract.unit.numero.toLowerCase().includes(lowercasedTerm) ||
        contract.estado.toLowerCase().includes(lowercasedTerm)
    );

    setFilteredContracts(filtered);
  }, [searchTerm, contracts]);

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
      setFilteredContracts((prev) => prev.filter((c) => c.id !== contractToDelete.id));
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

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                topic={helpData.contratos.topic}
              />
            </div>
            {canCreate && (
              <Button
                onClick={() => router.push('/contratos/nuevo')}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Nuevo Contrato
              </Button>
            )}
          </div>

          {/* Search */}
          <SearchInput
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Buscar por inquilino, edificio o unidad..."
          />

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <FilterChips
              filters={activeFilters}
              onRemove={clearFilter}
              onClearAll={clearAllFilters}
            />
          )}

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
                  {contracts.length > 0 ? Math.round((activosCount / contracts.length) * 100) : 0}% del total
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
                <p className="text-xs text-muted-foreground">Contratos completados</p>
              </CardContent>
            </Card>
          </div>

          {/* Contracts List */}
          <div className="grid gap-4">
            {filteredContracts.length === 0 ? (
              searchTerm ? (
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
              )
            ) : (
              filteredContracts.map((contract) => {
                const estadoBadge = getEstadoBadge(contract.estado);
                const tipoBadge = getTipoBadge(contract.tipo);
                const IconComponent = estadoBadge.icon;
                const daysUntilExpiry = getDaysUntilExpiry(contract.fechaFin);
                const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

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
              })
            )}
          </div>
        </div>
      </main>

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
    </AuthenticatedLayout>
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
