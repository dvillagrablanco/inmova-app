'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Users, Plus, Mail, Phone, Home, MoreVertical, Eye, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChips } from '@/components/ui/filter-chips';
import { ViewModeToggle, ViewMode } from '@/components/ui/view-mode-toggle';
import { SearchInput } from '@/components/ui/search-input';
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog';
import toast from 'react-hot-toast';
import logger from '@/lib/logger';

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

interface InquilinosClientPageProps {
  initialTenants: Tenant[];
}

export default function InquilinosClientPage({ initialTenants }: InquilinosClientPageProps) {
  const router = useRouter();
  const { canCreate, canDelete } = usePermissions();
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>(initialTenants);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeFilters, setActiveFilters] = useState<
    Array<{ id: string; label: string; value: string }>
  >([]);

  // Load view preference
  useEffect(() => {
    const savedViewMode = localStorage.getItem('inquilinos-view-mode') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('inquilinos-view-mode', mode);
  };

  // Apply search filter
  useEffect(() => {
    let filtered = initialTenants;

    if (searchTerm) {
      filtered = filtered.filter(
        (tenant) =>
          tenant.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.dni.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTenants(filtered);
  }, [searchTerm, initialTenants]);

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
        throw new Error('delete_failed');
      }

      toast.success('Inquilino eliminado correctamente');
      setDeleteDialogOpen(false);
      setTimeout(() => router.refresh(), 300);
    } catch (error) {
      logger.error('Error deleting tenant:', error);
      toast.error('Error de conexión');
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getTenantStatus = (tenant: Tenant) => {
    const hasActiveContract = tenant.contracts && tenant.contracts.length > 0;
    return hasActiveContract ? 'activo' : 'inactivo';
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

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Inquilinos</h1>
              <p className="text-muted-foreground mt-2">
                Gestiona todos los inquilinos de tu cartera
              </p>
            </div>
            {canCreate && (
              <Button onClick={() => router.push('/inquilinos/nuevo')}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Inquilino
              </Button>
            )}
          </div>

          {/* Statistics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Inquilinos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{initialTenants.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Activos</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialTenants.filter((t) => getTenantStatus(t) === 'activo').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialTenants.filter((t) => getTenantStatus(t) === 'inactivo').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar por nombre, email o DNI..."
                    className="flex-1"
                  />
                  <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
                </div>

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

          {/* Tenants list */}
          {filteredTenants.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="No hay inquilinos"
              description={
                activeFilters.length > 0
                  ? 'No se encontraron inquilinos con los filtros aplicados'
                  : 'Comienza agregando tu primer inquilino'
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
                          label: 'Agregar Inquilino',
                          onClick: () => router.push('/inquilinos/nuevo'),
                          variant: 'default' as const,
                        },
                      ]
                    : undefined
              }
            />
          ) : viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTenants.map((tenant) => (
                <Card
                  key={tenant.id}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => router.push(`/inquilinos/${tenant.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getInitials(tenant.nombreCompleto)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{tenant.nombreCompleto}</CardTitle>
                          <Badge
                            variant={getTenantStatus(tenant) === 'activo' ? 'default' : 'secondary'}
                          >
                            {getTenantStatus(tenant)}
                          </Badge>
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
                              router.push(`/inquilinos/${tenant.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/inquilinos/${tenant.id}/editar`);
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
                                handleDeleteClick(tenant);
                              }}
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
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{tenant.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{tenant.telefono}</span>
                      </div>
                      {tenant.units && tenant.units.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm text-muted-foreground mb-1">Unidad</p>
                          <p className="font-medium">
                            {tenant.units[0].building.nombre} - {tenant.units[0].numero}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/inquilinos/${tenant.id}`)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar>
                          <AvatarFallback>{getInitials(tenant.nombreCompleto)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{tenant.nombreCompleto}</p>
                            <Badge
                              variant={
                                getTenantStatus(tenant) === 'activo' ? 'default' : 'secondary'
                              }
                            >
                              {getTenantStatus(tenant)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {tenant.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {tenant.telefono}
                            </span>
                          </div>
                          {tenant.units && tenant.units.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {tenant.units[0].building.nombre} - {tenant.units[0].numero}
                            </p>
                          )}
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
                              router.push(`/inquilinos/${tenant.id}`);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalle
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/inquilinos/${tenant.id}/editar`);
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
                                handleDeleteClick(tenant);
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
        isLoading={isDeleting}
        title="¿Eliminar inquilino?"
        description={`¿Estás seguro de que deseas eliminar a ${tenantToDelete?.nombreCompleto}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
