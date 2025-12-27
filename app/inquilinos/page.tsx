'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import {
  Users,
  Plus,
  Mail,
  Phone,
  Home,
  ArrowLeft,
  MoreVertical,
  Eye,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { FilterChips } from '@/components/ui/filter-chips';
import { ButtonWithLoading } from '@/components/ui/button-with-loading';
import { ViewModeToggle, ViewMode } from '@/components/ui/view-mode-toggle';
import { SearchInput } from '@/components/ui/search-input';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import { IconButton } from '@/components/ui/icon-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import toast from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import logger, { logError } from '@/lib/logger';

interface Tenant {
  id: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  dni: string;
  estado?: string;
  fechaIngreso?: string;
  units?: Array<{
    numero: string;
    building: {
      nombre: string;
    };
  }>;
  contracts?: Array<{
    estado: string;
  }>;
}

function InquilinosPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate, canDelete } = usePermissions();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode, viewModeLoaded] = useLocalStorage<ViewMode>(
    'inquilinos-view-mode',
    'grid'
  );

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
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
    const fetchTenants = async () => {
      try {
        setError(null);
        const response = await fetch('/api/tenants');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: No se pudieron cargar los inquilinos`);
        }
        const data = await response.json();
        setTenants(data);
        setFilteredTenants(data);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        setError(errorMsg);
        logError(error instanceof Error ? error : new Error(errorMsg), {
          context: 'fetchTenants',
          page: 'inquilinos',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchTenants();
    }
  }, [status]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredTenants(tenants);
      return;
    }

    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = tenants.filter(
      (tenant) =>
        tenant.nombreCompleto.toLowerCase().includes(lowercasedTerm) ||
        tenant.email.toLowerCase().includes(lowercasedTerm) ||
        tenant.telefono.includes(lowercasedTerm) ||
        tenant.dni.includes(lowercasedTerm)
    );

    setFilteredTenants(filtered);
  }, [searchTerm, tenants]);

  const handleDeleteClick = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tenants/${tenantToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el inquilino');
      }

      setTenants((prev) => prev.filter((t) => t.id !== tenantToDelete.id));
      setFilteredTenants((prev) => prev.filter((t) => t.id !== tenantToDelete.id));
      toast.success(`Inquilino "${tenantToDelete.nombreCompleto}" eliminado correctamente`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar';
      toast.error(errorMsg);
      logError(error instanceof Error ? error : new Error(errorMsg), {
        context: 'deleteTenant',
        tenantId: tenantToDelete.id,
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTenantToDelete(null);
    }
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
                  <BreadcrumbPage>Inquilinos</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header Section */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Inquilinos</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Gestiona la información de tus inquilinos
                </p>
              </div>
              <ContextualHelp
                module={helpData.inquilinos.module}
                topic={helpData.inquilinos.topic}
              />
            </div>
            <div className="flex items-center gap-2">
              {viewModeLoaded && (
                <ViewModeToggle currentMode={viewMode} onModeChange={handleViewModeChange} />
              )}
              {canCreate && (
                <Button onClick={() => router.push('/inquilinos/nuevo')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nuevo Inquilino
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          <SearchInput
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder="Buscar por nombre, email, teléfono o DNI..."
          />

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <FilterChips
              filters={activeFilters}
              onRemove={clearFilter}
              onClearAll={clearAllFilters}
            />
          )}

          {/* Tenants List */}
          {filteredTenants.length === 0 ? (
            searchTerm ? (
              <EmptyState
                icon={<Users className="h-16 w-16 text-gray-400" />}
                title="No se encontraron resultados"
                description={`No hay inquilinos que coincidan con "${searchTerm}"`}
                action={{
                  label: 'Limpiar búsqueda',
                  onClick: () => setSearchTerm(''),
                }}
              />
            ) : (
              <EmptyState
                icon={<Users className="h-16 w-16 text-gray-400" />}
                title="No hay inquilinos registrados"
                description="Comienza agregando tu primer inquilino"
                action={
                  canCreate
                    ? {
                        label: 'Agregar Primer Inquilino',
                        onClick: () => router.push('/inquilinos/nuevo'),
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
              {filteredTenants.map((tenant) => {
                const activeContract = tenant.contracts?.find((c) => c.estado === 'activo');
                const tenantUnit = tenant.units?.[0];

                return (
                  <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {tenant.nombreCompleto
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{tenant.nombreCompleto}</CardTitle>
                            {activeContract && (
                              <Badge variant="default" className="mt-1">
                                Activo
                              </Badge>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <IconButton
                              variant="ghost"
                              size="icon"
                              icon={<MoreVertical className="h-4 w-4" />}
                              aria-label={`Opciones para ${tenant.nombreCompleto}`}
                            />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/inquilinos/${tenant.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(tenant)}
                                className="text-destructive focus:text-destructive"
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
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{tenant.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{tenant.telefono}</span>
                        </div>
                        {tenantUnit && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Home className="h-4 w-4" />
                            <span>
                              {tenantUnit.building.nombre} - Unidad {tenantUnit.numero}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => router.push(`/inquilinos/${tenant.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Perfil Completo
                      </Button>
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
        title="¿Eliminar inquilino?"
        description={
          tenantToDelete
            ? `Se eliminará a ${tenantToDelete.nombreCompleto}. Esta acción no se puede deshacer.`
            : 'Se eliminará el inquilino y toda su información.'
        }
      />
    </AuthenticatedLayout>
  );
}

// Export with Error Boundary
export default function InquilinosPage() {
  return (
    <ErrorBoundary>
      <InquilinosPageContent />
    </ErrorBoundary>
  );
}
