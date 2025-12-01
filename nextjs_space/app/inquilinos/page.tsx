'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Users, Plus, Mail, Phone, Home, ArrowLeft, MoreVertical, Eye, Search, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
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
import { FilterChips } from '@/components/ui/filter-chips';
import { ButtonWithLoading } from '@/components/ui/button-with-loading';
import { ViewModeToggle, ViewMode } from '@/components/ui/view-mode-toggle';

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

export default function InquilinosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate } = usePermissions();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Load view preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('inquilinos-view-mode') as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('inquilinos-view-mode', mode);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/tenants');
        if (response.ok) {
          const data = await response.json();
          setTenants(data);
          setFilteredTenants(data);
        }
      } catch (error) {
        console.error('Error fetching tenants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchTenants();
    }
  }, [status]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tenants.filter((tenant) =>
        tenant.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.dni.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTenants(filtered);
    } else {
      setFilteredTenants(tenants);
    }
  }, [searchTerm, tenants]);

  const [activeFilters, setActiveFilters] = useState<Array<{id: string; label: string; value: string}>>([]);

  // Update active filters when search term changes
  useEffect(() => {
    const filters = [];
    if (searchTerm) {
      filters.push({ id: 'search', label: 'Búsqueda', value: searchTerm });
    }
    setActiveFilters(filters);
  }, [searchTerm]);

  const clearFilter = (filterId: string) => {
    if (filterId === 'search') {
      setSearchTerm('');
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
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
              <Skeleton className="h-10 w-full max-w-md mb-6" />
              <SkeletonList count={5} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const getTenantEstado = (tenant: Tenant): string => {
    // Si tiene contratos activos, está activo
    if (tenant.contracts && tenant.contracts.some((c) => c.estado === 'activo')) {
      return 'activo';
    }
    // Si no tiene contratos activos, está inactivo
    return 'inactivo';
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      activo: { variant: 'default', label: 'Activo' },
      inactivo: { variant: 'secondary', label: 'Inactivo' },
      moroso: { variant: 'destructive', label: 'Moroso' },
      pendiente: { variant: 'outline', label: 'Pendiente' },
    };
    return badges[estado.toLowerCase()] || { variant: 'default', label: estado };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const activeTenants = tenants.filter((t) => getTenantEstado(t) === 'activo').length;
  const morosoTenants = 0; // Por ahora, sin lógica de morosidad

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
                    <BreadcrumbPage>Inquilinos</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Inquilinos</h1>
                <p className="text-muted-foreground">
                  Gestiona los inquilinos de tus propiedades
                </p>
              </div>
              {canCreate && (
                <Button onClick={() => router.push('/inquilinos/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Inquilino
                </Button>
              )}
            </div>

            {/* Search Bar and View Mode */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre, email o DNI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
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
                  <CardTitle className="text-sm font-medium">Total Inquilinos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tenants.length}</div>
                  <p className="text-xs text-muted-foreground">Registrados</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Inquilinos Activos</CardTitle>
                  <Users className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{activeTenants}</div>
                  <p className="text-xs text-muted-foreground">
                    {tenants.length > 0 ? Math.round((activeTenants / tenants.length) * 100) : 0}% del total
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Morosos</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{morosoTenants}</div>
                  <p className="text-xs text-muted-foreground">Requieren atención</p>
                </CardContent>
              </Card>
            </div>

            {/* Tenants Display - Grid View */}
            {viewMode === 'grid' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTenants.map((tenant) => {
                  const estado = getTenantEstado(tenant);
                  const estadoBadge = getEstadoBadge(estado);
                  const primeraUnidad = tenant.units?.[0];
                  
                  return (
                    <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(tenant.nombreCompleto)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{tenant.nombreCompleto}</CardTitle>
                            <Badge variant={estadoBadge.variant} className="mt-1">{estadoBadge.label}</Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{tenant.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{tenant.telefono}</span>
                          </div>
                          {primeraUnidad && (
                            <div className="border-t pt-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {primeraUnidad.building.nombre} - {primeraUnidad.numero}
                                </span>
                              </div>
                            </div>
                          )}
                          <Button
                            onClick={() => router.push(`/inquilinos/${tenant.id}`)}
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

            {/* Tenants Display - List View (Detailed) */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredTenants.map((tenant) => {
                  const estado = getTenantEstado(tenant);
                  const estadoBadge = getEstadoBadge(estado);
                  const primeraUnidad = tenant.units?.[0];
                  
                  return (
                    <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-16 w-16">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                  {getInitials(tenant.nombreCompleto)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="text-xl font-bold">{tenant.nombreCompleto}</h3>
                                <Badge variant={estadoBadge.variant} className="mt-1">{estadoBadge.label}</Badge>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Email</p>
                                  <p className="font-medium">{tenant.email}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Teléfono</p>
                                  <p className="font-medium">{tenant.telefono}</p>
                                </div>
                              </div>
                            </div>

                            {primeraUnidad && (
                              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                <Home className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm text-muted-foreground">Unidad actual</p>
                                  <p className="font-medium">
                                    {primeraUnidad.building.nombre} - Unidad {primeraUnidad.numero}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex lg:flex-col gap-2">
                            <Button
                              onClick={() => router.push(`/inquilinos/${tenant.id}`)}
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

            {/* Tenants Display - Compact View */}
            {viewMode === 'compact' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {filteredTenants.map((tenant) => {
                      const estado = getTenantEstado(tenant);
                      const estadoBadge = getEstadoBadge(estado);
                      const primeraUnidad = tenant.units?.[0];
                      
                      return (
                        <div
                          key={tenant.id}
                          className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/inquilinos/${tenant.id}`)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getInitials(tenant.nombreCompleto)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{tenant.nombreCompleto}</p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {tenant.email}
                                </span>
                                <Badge variant={estadoBadge.variant} className="text-xs">
                                  {estadoBadge.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-center max-w-[150px]">
                              <p className="text-muted-foreground">Teléfono</p>
                              <p className="font-semibold">{tenant.telefono}</p>
                            </div>
                            {primeraUnidad && (
                              <div className="text-center max-w-[200px]">
                                <p className="text-muted-foreground">Unidad</p>
                                <p className="font-semibold truncate">
                                  {primeraUnidad.building.nombre} - {primeraUnidad.numero}
                                </p>
                              </div>
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

            {filteredTenants.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron inquilinos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Comienza agregando tu primer inquilino'}
                  </p>
                  {canCreate && !searchTerm && (
                    <Button onClick={() => router.push('/inquilinos/nuevo')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Inquilino
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
