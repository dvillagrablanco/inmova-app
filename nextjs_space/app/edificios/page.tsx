'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Building2, Plus, MapPin, TrendingUp, Home, ArrowLeft, MoreVertical, Eye, Search } from 'lucide-react';
import Link from 'next/link';
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

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  anoConstructor: number;
  numeroUnidades: number;
  metrics?: {
    totalUnits: number;
    occupiedUnits: number;
    ocupacionPct: number;
    ingresosMensuales: number;
  };
}

export default function EdificiosPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch('/api/buildings');
        if (response.ok) {
          const data = await response.json();
          setBuildings(data);
          setFilteredBuildings(data);
        }
      } catch (error) {
        console.error('Error fetching buildings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchBuildings();
    }
  }, [status]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = buildings.filter((building) =>
        building.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        building.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        building.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBuildings(filtered);
    } else {
      setFilteredBuildings(buildings);
    }
  }, [searchTerm, buildings]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) return null;

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      residencial: { variant: 'default', label: 'Residencial' },
      comercial: { variant: 'secondary', label: 'Comercial' },
      mixto: { variant: 'outline', label: 'Mixto' },
      industrial: { variant: 'destructive', label: 'Industrial' },
    };
    return badges[tipo.toLowerCase()] || { variant: 'default', label: tipo };
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
                      <BreadcrumbPage>Edificios</BreadcrumbPage>
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
                <h1 className="text-3xl font-bold tracking-tight">Edificios</h1>
                <p className="text-muted-foreground">
                  Gestiona los edificios de tu cartera inmobiliaria
                </p>
              </div>
              {canCreate && (
                <Button onClick={() => router.push('/edificios/nuevo')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo Edificio
                </Button>
              )}
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, dirección o tipo..."
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
                  <CardTitle className="text-sm font-medium">Total Edificios</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{buildings.length}</div>
                  <p className="text-xs text-muted-foreground">En cartera</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {buildings.reduce((acc, b) => acc + (b.metrics?.totalUnits || 0), 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Sumando todos los edificios</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {buildings.length > 0
                      ? Math.round(
                          buildings.reduce((acc, b) => acc + (b.metrics?.ocupacionPct || 0), 0) /
                            buildings.length
                        )
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">De todas las unidades</p>
                </CardContent>
              </Card>
            </div>

            {/* Buildings Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBuildings.map((building) => {
                const tipoBadge = getTipoBadge(building.tipo);
                return (
                  <Card key={building.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle className="text-lg">{building.nombre}</CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{building.direccion}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/edificios/${building.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalles
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Tipo</span>
                          <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Año</span>
                          <span className="text-sm font-medium">{building.anoConstructor}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Unidades</span>
                          <span className="text-sm font-medium">{building.numeroUnidades}</span>
                        </div>
                        {building.metrics && (
                          <>
                            <div className="border-t pt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Ocupación</span>
                                <span className="text-sm font-bold">
                                  {building.metrics.ocupacionPct}%
                                </span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                                <div
                                  className="h-2 rounded-full bg-primary transition-all"
                                  style={{ width: `${building.metrics.ocupacionPct}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Ingresos/mes</span>
                              <span className="text-sm font-bold text-green-600">
                                €{building.metrics.ingresosMensuales.toLocaleString()}
                              </span>
                            </div>
                          </>
                        )}
                        <Button
                          onClick={() => router.push(`/edificios/${building.id}`)}
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

            {filteredBuildings.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No se encontraron edificios</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Comienza agregando tu primer edificio'}
                  </p>
                  {canCreate && !searchTerm && (
                    <Button onClick={() => router.push('/edificios/nuevo')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Nuevo Edificio
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
