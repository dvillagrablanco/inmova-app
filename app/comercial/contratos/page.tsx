'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FileText,
  Plus,
  Calendar,
  Euro,
  Building2,
  ArrowLeft,
  Eye,
  AlertTriangle,
  Clock,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { SmartBreadcrumbs } from '@/components/navigation/smart-breadcrumbs';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchInput } from '@/components/ui/search-input';
import { FilterChips } from '@/components/ui/filter-chips';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { usePermissions } from '@/lib/hooks/usePermissions';
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
    tipo: string;
    building: {
      nombre: string;
    };
  };
}

function ContratosComercialContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { canCreate } = usePermissions();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setError(null);
        const response = await fetch('/api/contracts?tipo=comercial');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron cargar los contratos`);
        }
        const data = await response.json();
        // Filtrar solo contratos comerciales
        const comercialContracts = Array.isArray(data) 
          ? data.filter((c: Contract) => 
              c.tipo?.toLowerCase() === 'comercial' || 
              c.unit?.tipo?.toLowerCase()?.includes('local') ||
              c.unit?.tipo?.toLowerCase()?.includes('oficina') ||
              c.unit?.tipo?.toLowerCase()?.includes('nave')
            )
          : [];
        setContracts(comercialContracts);
        setFilteredContracts(comercialContracts);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMsg);
        logError(error instanceof Error ? error : new Error(errorMsg), {
          context: 'fetchContratosComerciales',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchContracts();
    }
  }, [status]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = contracts.filter(
        (contract) =>
          contract.tenant?.nombreCompleto?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.unit?.building?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contract.unit?.numero?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContracts(filtered);
    } else {
      setFilteredContracts(contracts);
    }
  }, [searchTerm, contracts]);

  useEffect(() => {
    const filters: Array<{ id: string; label: string; value: string }> = [];
    if (searchTerm) {
      filters.push({ id: 'search', label: 'Búsqueda', value: searchTerm });
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

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      activo: { variant: 'default', label: 'Activo' },
      finalizado: { variant: 'secondary', label: 'Finalizado' },
      cancelado: { variant: 'destructive', label: 'Cancelado' },
      pendiente: { variant: 'outline', label: 'Pendiente' },
    };
    return badges[estado?.toLowerCase()] || { variant: 'default', label: estado };
  };

  const getDaysUntilExpiry = (fechaFin: string) => {
    const today = new Date();
    const endDate = new Date(fechaFin);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto">
          <LoadingState message="Cargando contratos comerciales..." />
        </div>
      </AuthenticatedLayout>
    );
  }

  const activosCount = contracts.filter((c) => c.estado?.toLowerCase() === 'activo').length;
  const totalIngresos = contracts
    .filter((c) => c.estado?.toLowerCase() === 'activo')
    .reduce((acc, c) => acc + Number(c.rentaMensual || 0), 0);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <SmartBreadcrumbs showBackButton={true} />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Contratos Comerciales
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Gestiona contratos de locales, oficinas y naves industriales
            </p>
          </div>
          {canCreate && (
            <Button onClick={() => router.push('/contratos/nuevo?tipo=comercial')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contrato
            </Button>
          )}
        </div>

        {/* Error */}
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

        {/* Búsqueda */}
        <Card>
          <CardContent className="pt-6">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por empresa, edificio o unidad..."
            />
          </CardContent>
        </Card>

        <FilterChips
          filters={activeFilters}
          onRemove={clearFilter}
          onClearAll={clearAllFilters}
        />

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activosCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contratos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{contracts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de contratos */}
        <div className="grid gap-4">
          {filteredContracts.map((contract) => {
            const estadoBadge = getEstadoBadge(contract.estado);
            const daysUntilExpiry = getDaysUntilExpiry(contract.fechaFin);
            const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 60;

            return (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-semibold">
                          {contract.tenant?.nombreCompleto || 'Sin inquilino'}
                        </h3>
                        <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {contract.unit?.building?.nombre || 'Sin edificio'} - {contract.unit?.numero || 'Sin unidad'}
                        </span>
                        {contract.unit?.tipo && (
                          <Badge variant="outline" className="capitalize">
                            {contract.unit.tipo}
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Fecha Inicio</p>
                          <p className="text-sm font-medium">
                            {format(new Date(contract.fechaInicio), 'dd MMM yyyy', { locale: es })}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Fecha Fin</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">
                              {format(new Date(contract.fechaFin), 'dd MMM yyyy', { locale: es })}
                            </p>
                            {isExpiringSoon && (
                              <Badge variant="destructive" className="text-[10px]">
                                {daysUntilExpiry}d
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Renta Mensual</p>
                          <p className="text-lg font-bold text-green-600">
                            €{Number(contract.rentaMensual || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      {isExpiringSoon && contract.estado?.toLowerCase() === 'activo' && (
                        <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                          <p className="text-sm text-orange-600 font-medium">
                            Vence en {daysUntilExpiry} días - Renovar pronto
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="outline"
                      className="self-start"
                      onClick={() => router.push(`/contratos/${contract.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredContracts.length === 0 && (
          searchTerm ? (
            <EmptyState
              icon={<FileText className="h-16 w-16 text-gray-400" />}
              title="No se encontraron resultados"
              description={`No hay contratos comerciales que coincidan con "${searchTerm}"`}
              action={{
                label: 'Limpiar búsqueda',
                onClick: clearAllFilters,
              }}
            />
          ) : (
            <EmptyState
              icon={<Briefcase className="h-16 w-16 text-gray-400" />}
              title="No hay contratos comerciales"
              description="Comienza creando tu primer contrato comercial para locales, oficinas o naves"
              action={
                canCreate
                  ? {
                      label: 'Crear Contrato Comercial',
                      onClick: () => router.push('/contratos/nuevo?tipo=comercial'),
                      icon: <Plus className="h-4 w-4" />,
                    }
                  : undefined
              }
            />
          )
        )}
      </div>
    </AuthenticatedLayout>
  );
}

export default function ContratosComercialPage() {
  return (
    <ErrorBoundary>
      <ContratosComercialContent />
    </ErrorBoundary>
  );
}
