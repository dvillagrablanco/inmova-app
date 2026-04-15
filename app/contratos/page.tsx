'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AiInsightPanel } from '@/components/ai/AiInsightPanel';

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
  PenTool,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { ContextualQuickActions } from '@/components/navigation/contextual-quick-actions';
import logger, { logError } from '@/lib/logger';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  ivaPorcentaje?: number;
  estado: string;
  tipo: string;
  tenant: {
    nombreCompleto: string;
  };
  unit: {
    numero: string;
    tipo?: string;
    building: {
      nombre: string;
    };
  };
  diasHastaVencimiento?: number;
}

interface BuildingUnit {
  id: string;
  numero: string;
  buildingNombre: string;
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
  const [edificioFilter, setEdificioFilter] = useState<string>('all');
  const [unidadFilter, setUnidadFilter] = useState<string>('all');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);
  const [externalDocs, setExternalDocs] = useState<any[]>([]);
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [allUnits, setAllUnits] = useState<BuildingUnit[]>([]);

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
        const response = await fetch('/api/contracts?limit=500');
        const json = await response.json();
        const data = Array.isArray(json) ? json : (json.data || json.contracts || []);
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

    const fetchUnits = async () => {
      try {
        const response = await fetch('/api/units');
        if (response.ok) {
          const json = await response.json();
          const data = Array.isArray(json) ? json : (json.data || json.units || []);
          setAllUnits(
            data.map((u: any) => ({
              id: u.id,
              numero: u.numero,
              buildingNombre: u.building?.nombre || '',
            }))
          );
        }
      } catch (error) {
        logger.error('Error fetching units for filter:', error);
      }
    };

    if (status === 'authenticated') {
      fetchContracts();
      fetchUnits();
      loadExternalContractDocs();
    }
  }, [status]);

  const loadExternalContractDocs = async () => {
    try {
      const res = await fetch('/api/documents?tipo=contrato');
      if (res.ok) {
        const data = await res.json();
        const external = (Array.isArray(data) ? data : []).filter(
          (doc: any) =>
            doc.cloudStoragePath?.startsWith('https://') &&
            (doc.tags?.includes('contratos') || doc.tipo === 'contrato')
        );
        setExternalDocs(external);
      }
    } catch (error) {
      logger.error('Error cargando docs externos contratos:', error);
    }
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

  // Extraer edificios únicos de TODAS las unidades (no solo contratos)
  const edificiosUnicos = Array.from(
    new Set([
      ...allUnits.map((u) => u.buildingNombre),
      ...contracts.map((c) => c.unit?.building?.nombre).filter(Boolean),
    ].filter(Boolean))
  ).sort();

  // Unidades del edificio seleccionado — de TODAS las unidades, no solo las con contrato
  const unidadesPorEdificio = edificioFilter !== 'all'
    ? Array.from(
        new Set([
          ...allUnits
            .filter((u) => u.buildingNombre === edificioFilter)
            .map((u) => u.numero),
          ...contracts
            .filter((c) => c.unit?.building?.nombre === edificioFilter)
            .map((c) => c.unit?.numero)
            .filter(Boolean),
        ])
      ).sort()
    : [];

  // Reset unidad filter cuando cambia edificio
  useEffect(() => {
    setUnidadFilter('all');
  }, [edificioFilter]);

  // Filtrado combinado
  useEffect(() => {
    let filtered = contracts;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (contract) =>
          (contract.tenant?.nombreCompleto || '').toLowerCase().includes(term) ||
          (contract.unit?.building?.nombre || '').toLowerCase().includes(term) ||
          (contract.unit?.numero || '').toLowerCase().includes(term)
      );
    }

    if (edificioFilter !== 'all') {
      filtered = filtered.filter((c) => c.unit?.building?.nombre === edificioFilter);
    }

    if (unidadFilter !== 'all') {
      filtered = filtered.filter((c) => c.unit?.numero === unidadFilter);
    }

    if (estadoFilter !== 'all') {
      filtered = filtered.filter((c) => (c.estado || '').toLowerCase() === estadoFilter);
    }

    setFilteredContracts(filtered);
  }, [searchTerm, edificioFilter, unidadFilter, estadoFilter, contracts]);

  // Actualizar filtros activos
  useEffect(() => {
    const filters: Array<{ id: string; label: string; value: string }> = [];

    if (searchTerm) {
      filters.push({ id: 'search', label: 'Búsqueda', value: searchTerm });
    }
    if (edificioFilter !== 'all') {
      filters.push({ id: 'edificio', label: 'Edificio', value: edificioFilter });
    }
    if (unidadFilter !== 'all') {
      filters.push({ id: 'unidad', label: 'Unidad', value: unidadFilter });
    }
    if (estadoFilter !== 'all') {
      const estadoLabels: Record<string, string> = {
        activo: 'Activo', finalizado: 'Finalizado', cancelado: 'Cancelado', pendiente: 'Pendiente',
      };
      filters.push({ id: 'estado', label: 'Estado', value: estadoLabels[estadoFilter] || estadoFilter });
    }

    setActiveFilters(filters);
  }, [searchTerm, edificioFilter, unidadFilter, estadoFilter]);

  const clearFilter = (id: string) => {
    if (id === 'search') setSearchTerm('');
    if (id === 'edificio') { setEdificioFilter('all'); setUnidadFilter('all'); }
    if (id === 'unidad') setUnidadFilter('all');
    if (id === 'estado') setEstadoFilter('all');
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setEdificioFilter('all');
    setUnidadFilter('all');
    setEstadoFilter('all');
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
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
        <SkeletonCard showHeader={true} lines={1} />
        <SkeletonCard showHeader={true} lines={1} />
        <SkeletonCard showHeader={true} lines={1} />
      </div>

      {/* Skeleton for contracts list */}
      <SkeletonList items={3} />

      {/* Loading message */}
      <LoadingState message="Cargando contratos..." size="sm" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string; icon: any; className?: string }> = {
      activo: { variant: 'default', label: 'Activo', icon: Clock, className: 'bg-black text-white border-black hover:bg-black/90' },
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

  const activosCount = contracts.filter((c) => (c.estado || '').toLowerCase() === 'activo').length;
  const finalizadosCount = contracts.filter((c) => (c.estado || '').toLowerCase() === 'finalizado').length;
  const totalIngresos = contracts
    .filter((c) => c.estado.toLowerCase() === 'activo')
    .reduce((acc, c) => acc + Number(c.rentaMensual || 0), 0);

  const getDaysUntilExpiry = (fechaFin: string | null | undefined) => {
    if (!fechaFin) return 999;
    try {
      const today = new Date();
      const endDate = new Date(fechaFin);
      if (isNaN(endDate.getTime())) return 999;
      const diffTime = endDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Smart Breadcrumbs */}
        <SmartBreadcrumbs
          totalCount={contracts.length}
          showBackButton={true}
        />

        {/* Header Section con Quick Actions */}
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
      
      {/* Quick Actions */}
      {canCreate && (
        <ContextualQuickActions
          expiringContracts={contracts.filter(c => {
            const days = getDaysUntilExpiry(c.fechaFin);
            return days > 0 && days <= 30;
          }).length}
        />
      )}
        </div>

        {/* Panel IA: Asistente de Contratos */}
        <AiInsightPanel
          apiUrl="/api/ai/contract-risk-detector"
          mode="chat"
          title="Asistente IA de Contratos"
          chatContext="Módulo de gestión de contratos de arrendamiento. El usuario puede preguntar sobre cláusulas, riesgos legales, vencimientos, renovaciones o cualquier aspecto contractual."
        />

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

        {/* Search Bar and Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por inquilino, edificio o unidad..."
              aria-label="Buscar contratos por inquilino, edificio o unidad"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <Select value={edificioFilter} onValueChange={setEdificioFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por edificio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los edificios</SelectItem>
                  {edificiosUnicos.map((nombre) => (
                    <SelectItem key={nombre} value={nombre}>
                      {nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={unidadFilter}
                onValueChange={setUnidadFilter}
                disabled={edificioFilter === 'all'}
              >
                <SelectTrigger>
                  <SelectValue placeholder={edificioFilter === 'all' ? 'Selecciona edificio primero' : 'Filtrar por unidad'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las unidades</SelectItem>
                  {unidadesPorEdificio.map((numero) => {
                    const hasContract = contracts.some(
                      (c) => c.unit?.building?.nombre === edificioFilter && c.unit?.numero === numero
                    );
                    return (
                      <SelectItem key={numero} value={numero}>
                        Unidad {numero}{hasContract ? '' : ' (sin contrato)'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
        <div className="text-2xl font-bold">€{Number(totalIngresos || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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

        {/* Documentación de Contratos Externa (Google Drive) */}
        {externalDocs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                Documentación de Contratos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Contratos y documentación legal enlazados desde Google Drive
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(showAllDocs ? externalDocs : externalDocs.slice(0, 6)).map((doc: any) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3"
                    onClick={() => window.open(doc.cloudStoragePath, '_blank')}
                  >
                    <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{doc.nombre}</h4>
                      {doc.descripcion && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {doc.descripcion}
                        </p>
                      )}
                      <Badge variant="outline" className="text-xs mt-2 text-blue-600 border-blue-300 bg-blue-50">
                        Google Drive
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {externalDocs.length > 6 && !showAllDocs && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowAllDocs(true)}
                >
                  Ver todos ({externalDocs.length})
                </Button>
              )}
            </CardContent>
          </Card>
        )}

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
        {contract.tenant?.nombreCompleto || 'Sin inquilino asignado'}
        </h3>
        <Badge
        variant={estadoBadge.variant}
        className={`flex items-center gap-1 ${estadoBadge.className || ''}`}
        >
        <IconComponent className="h-3 w-3" />
        {estadoBadge.label}
        </Badge>
        <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
        </div>
        <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded-md">
        <Home className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
        <span className="break-words">
        {contract.unit?.building?.nombre || '—'} - Unidad {contract.unit?.numero || '—'}
        </span>
        </div>
        </div>
        </div>

        {/* Detalles */}
        <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Fecha Inicio</p>
        <p className="text-sm font-medium">
        {contract.fechaInicio ? format(new Date(contract.fechaInicio), 'dd MMM yyyy', {
        locale: es,
        }) : '—'}
        </p>
        </div>
        <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Fecha Fin</p>
        <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-medium">
        {contract.fechaFin ? format(new Date(contract.fechaFin), 'dd MMM yyyy', {
        locale: es,
        }) : '—'}
        </p>
        {isExpiringSoon && (
        <Badge variant="destructive" className="text-[10px]">
        {daysUntilExpiry}d
        </Badge>
        )}
        </div>
        </div>
        <div className="space-y-1">
        <p className="text-xs text-muted-foreground">Importe Mensual</p>
                        {contract.ivaPorcentaje && contract.ivaPorcentaje > 0 ? (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Base: €{Number(contract.rentaMensual || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {' + IVA '}{contract.ivaPorcentaje}%: €{(Number(contract.rentaMensual || 0) * contract.ivaPorcentaje / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-base sm:text-lg font-bold text-green-600">
                              €{(Number(contract.rentaMensual || 0) * (1 + contract.ivaPorcentaje / 100)).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        ) : (
                          <p className="text-base sm:text-lg font-bold text-green-600">
                            €{Number(contract.rentaMensual || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        )}
        </div>
        </div>

        {/* Alertas */}
        {isExpiringSoon && (contract.estado || '').toLowerCase() === 'activo' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs sm:text-sm text-red-600 font-medium">
        Vence en {daysUntilExpiry} días - Renovar pronto
        </p>
        </div>
        )}

        <div className="flex flex-wrap gap-2">
        <Button
        onClick={() => router.push(`/contratos/${contract.id}`)}
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        >
        <Eye className="mr-2 h-4 w-4" />
        Ver Detalles
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          onClick={() => toast.info('Firma digital en preparación - próximamente con Signaturit')}
        >
          <PenTool className="mr-2 h-4 w-4" />
          Firma Digital
        </Button>
        </div>
        </div>

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <IconButton
        variant="ghost"
        size="icon"
        icon={<MoreVertical className="h-4 w-4" />}
        aria-label={`Opciones para contrato de ${contract.tenant?.nombreCompleto || 'desconocido'}`}
        className="self-start"
        />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
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
          icon={FileText}
          title="No se encontraron resultados"
          description={`No hay contratos que coincidan con "${searchTerm}"`}
          action={{
            label: 'Limpiar búsqueda',
            onClick: () => setSearchTerm(''),
          }}
        />
        ) : (
        <EmptyState
          icon={FileText}
          title="Crea tu primer contrato"
          description="Genera contratos de alquiler con plantillas, firma digital y actualización automática de IPC."
          action={
            canCreate
              ? {
                  label: 'Nuevo contrato',
                  onClick: () => router.push('/contratos/nuevo'),
                }
              : undefined
          }
        />
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="¿Eliminar contrato?"
        description={
      contractToDelete
        ? `Se eliminará el contrato de ${contractToDelete.tenant?.nombreCompleto || 'este inquilino'} para la unidad ${contractToDelete.unit?.numero || '—'}. Esta acción no se puede deshacer.`
        : 'Se eliminará el contrato y todos sus datos asociados.'
        }
      />

      {/* Asistente IA de Documentos */}
      <AIDocumentAssistant 
        context="contratos"
        variant="floating"
        position="bottom-right"
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
