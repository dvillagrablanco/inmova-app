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

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
      <div className="flex flex-1 flex-col overflow-hidden">
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

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o DNI..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

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

            {/* Tenants List */}
            <div className="grid gap-4">
              {filteredTenants.map((tenant) => {
                const estado = getTenantEstado(tenant);
                const estadoBadge = getEstadoBadge(estado);
                const primeraUnidad = tenant.units?.[0];
                
                return (
                  <Card key={tenant.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(tenant.nombreCompleto)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-semibold break-words">{tenant.nombreCompleto}</h3>
                              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2 min-w-0">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{tenant.email}</span>
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{tenant.telefono}</span>
                              </div>
                            </div>
                            {primeraUnidad && (
                              <div className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded-md">
                                <Home className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                <span className="font-medium break-words">
                                  {primeraUnidad.building.nombre} - Unidad {primeraUnidad.numero}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="self-start">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/inquilinos/${tenant.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

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
