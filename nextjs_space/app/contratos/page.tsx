'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { FileText, Plus, Calendar, Euro, Home, ArrowLeft, MoreVertical, Eye, Search, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Contract {
  id: string;
  fechaInicio: string;
  fechaFin: string;
  montoMensual: number;
  estado: string;
  tipoContrato: string;
  inquilino: {
    nombre: string;
  };
  unidad: {
    numero: string;
    edificio: {
      nombre: string;
    };
  };
}

export default function ContratosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate } = usePermissions();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch('/api/contracts');
        if (response.ok) {
          const data = await response.json();
          setContracts(data);
          setFilteredContracts(data);
        }
      } catch (error) {
        console.error('Error fetching contracts:', error);
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
      const filtered = contracts.filter((contract) =>
        contract.inquilino.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.unidad.edificio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.unidad.numero.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContracts(filtered);
    } else {
      setFilteredContracts(contracts);
    }
  }, [searchTerm, contracts]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
    .reduce((acc, c) => acc + c.montoMensual, 0);

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
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Breadcrumbs y Botón Volver */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                    className="-ml-2"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Volver
                  </Button>
                </div>
              </div>
            </div>

            {/* Header Section */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
                <p className="text-muted-foreground">
                  Gestiona los contratos de arrendamiento
                </p>
              </div>
              {canCreate && (
                <Button onClick={() => router.push('/contratos/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Contrato
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por inquilino, edificio o unidad..."
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
                  <p className="text-xs text-muted-foreground">Historial</p>
                </CardContent>
              </Card>
            </div>

            {/* Contracts List */}
            <div className="grid gap-4">
              {filteredContracts.map((contract) => {
                const estadoBadge = getEstadoBadge(contract.estado);
                const tipoBadge = getTipoBadge(contract.tipoContrato);
                const daysUntilExpiry = getDaysUntilExpiry(contract.fechaFin);
                const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                const IconComponent = estadoBadge.icon;

                return (
                  <Card key={contract.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-lg font-semibold">{contract.inquilino.nombre}</h3>
                                <Badge variant={estadoBadge.variant}>
                                  <IconComponent className="h-3 w-3 mr-1" />
                                  {estadoBadge.label}
                                </Badge>
                                <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Home className="h-4 w-4" />
                                <span>
                                  {contract.unidad.edificio.nombre} - Unidad {contract.unidad.numero}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Detalles */}
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Fecha Inicio</p>
                              <p className="text-sm font-medium">
                                {format(new Date(contract.fechaInicio), 'dd MMM yyyy', { locale: es })}
                              </p>
                            </div>
                            <div className="space-y-1">
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
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Monto Mensual</p>
                              <p className="text-lg font-bold text-green-600">
                                €{contract.montoMensual.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Alertas */}
                          {isExpiringSoon && contract.estado.toLowerCase() === 'activo' && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <p className="text-sm text-red-600 font-medium">
                                Vence en {daysUntilExpiry} días - Renovar pronto
                              </p>
                            </div>
                          )}

                          <Button
                            onClick={() => router.push(`/contratos/${contract.id}`)}
                            variant="outline"
                            size="sm"
                          >
                            Ver Detalles
                          </Button>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/contratos/${contract.id}`)}>
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

            {filteredContracts.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron contratos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Comienza creando tu primer contrato'}
                  </p>
                  {canCreate && !searchTerm && (
                    <Button onClick={() => router.push('/contratos/nuevo')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Contrato
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
