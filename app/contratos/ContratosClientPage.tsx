'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import {
  FileText,
  Plus,
  Calendar,
  Euro,
  Home,
  MoreVertical,
  Eye,
  AlertTriangle,
  Clock,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { SearchInput } from '@/components/ui/search-input';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import toast from 'react-hot-toast';
import logger from '@/lib/logger';

interface Contract {
  id: string;
  fechaInicio: string | Date;
  fechaFin: string | Date;
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

interface ContratosClientPageProps {
  initialContracts: Contract[];
  session: any;
}

export default function ContratosClientPage({
  initialContracts,
  session,
}: ContratosClientPageProps) {
  const router = useRouter();
  const { canCreate, canDelete } = usePermissions();
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>(initialContracts);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);

  // Apply search filter
  useEffect(() => {
    let filtered = initialContracts;

    if (searchTerm) {
      filtered = filtered.filter(
        (contract) =>
          contract.tenant.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.unit.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContracts(filtered);
  }, [searchTerm, initialContracts]);

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

  const handleDeleteConfirm = () => {
    if (!contractToDelete) return;

    setIsDeleting(true);
    fetch(`/api/contracts/${contractToDelete.id}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo eliminar el contrato');
        }
        toast.success('Contrato eliminado correctamente');
        setDeleteDialogOpen(false);
        // Refresh the page
        setTimeout(() => router.refresh(), 300);
      })
      .catch((error) => {
        logger.error('Error deleting contract:', error);
        toast.error('Error al eliminar el contrato');
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'default';
      case 'vencido':
        return 'destructive';
      case 'finalizado':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), 'dd MMM yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getContractsByStatus = (status: string) => {
    return initialContracts.filter((c) => c.estado === status).length;
  };

  const getExpiringSoonCount = () => {
    return initialContracts.filter(
      (c) =>
        c.estado === 'activo' &&
        c.diasHastaVencimiento !== undefined &&
        c.diasHastaVencimiento > 0 &&
        c.diasHastaVencimiento <= 30
    ).length;
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
                <BreadcrumbPage>Contratos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
              <p className="text-muted-foreground mt-2">Gestiona todos los contratos de alquiler</p>
            </div>
            {canCreate && (
              <Button onClick={() => router.push('/contratos/nuevo')}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Contrato
              </Button>
            )}
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{initialContracts.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getContractsByStatus('activo')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Por Vencer</CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{getExpiringSoonCount()}</div>
                <p className="text-xs text-muted-foreground">En los próximos 30 días</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                <Euro className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    initialContracts
                      .filter((c) => c.estado === 'activo')
                      .reduce((sum, c) => sum + c.rentaMensual, 0)
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Buscar por inquilino, unidad o edificio..."
                  className="flex-1"
                />

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

          {/* Contracts list */}
          {filteredContracts.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-12 w-12" />}
              title="No hay contratos"
              description={
                activeFilters.length > 0
                  ? 'No se encontraron contratos con los filtros aplicados'
                  : 'Comienza creando tu primer contrato'
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
                          label: 'Crear Contrato',
                          onClick: () => router.push('/contratos/nuevo'),
                          variant: 'default' as const,
                        },
                      ]
                    : undefined
              }
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredContracts.map((contract) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/contratos/${contract.id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{contract.tenant.nombreCompleto}</p>
                            <Badge variant={getEstadoBadgeVariant(contract.estado)}>
                              {contract.estado}
                            </Badge>
                            {contract.diasHastaVencimiento !== undefined &&
                              contract.diasHastaVencimiento > 0 &&
                              contract.diasHastaVencimiento <= 30 &&
                              contract.estado === 'activo' && (
                                <Badge variant="outline" className="gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Vence en {contract.diasHastaVencimiento} días
                                </Badge>
                              )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {contract.unit.building.nombre} - Unidad {contract.unit.numero}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(contract.fechaInicio)} - {formatDate(contract.fechaFin)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Euro className="h-3 w-3" />
                              {formatCurrency(contract.rentaMensual)}/mes
                            </span>
                          </div>
                        </div>
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
                              router.push(`/contratos/${contract.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/contratos/${contract.id}/editar`);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {canDelete && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(contract);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar contrato?"
        description={`¿Estás seguro de que deseas eliminar el contrato de ${contractToDelete?.tenant.nombreCompleto}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
