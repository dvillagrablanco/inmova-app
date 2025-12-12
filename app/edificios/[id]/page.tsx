export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhotoGallery } from '@/components/ui/photo-gallery';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  Building2,
  Home,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Euro,
  Wrench,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePermissions } from '@/lib/hooks/usePermissions';
import logger, { logError } from '@/lib/logger';


interface Building {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  anoConstructor: number;
  numeroUnidades: number;
  estadoConservacion?: string | null;
  certificadoEnergetico?: string | null;
  ascensor: boolean;
  garaje: boolean;
  trastero: boolean;
  piscina: boolean;
  jardin: boolean;
  gastosComunidad?: number | null;
  ibiAnual?: number | null;
  imagenes: string[];
  units?: any[];
  expenses?: any[];
  maintenanceSchedules?: any[];
}

export default function EdificioDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const { canUpdate, canDelete } = usePermissions();
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session && params?.id) {
      fetchBuilding();
    }
  }, [session, params?.id]);

  const fetchBuilding = async () => {
    if (!params?.id) return;

    try {
      const res = await fetch(`/api/buildings/${params.id}`);
      if (!res.ok) throw new Error('Error al cargar edificio');
      const data = await res.json();
      setBuilding(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar el edificio');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Edificio no encontrado</div>
          <Button onClick={() => router.push('/edificios')}>Volver a Edificios</Button>
        </div>
      </div>
    );
  }

  // Calcular estadísticas
  const unitsStats = {
    total: building.units?.length || 0,
    ocupadas: building.units?.filter((u) => u.estado === 'ocupada').length || 0,
    disponibles: building.units?.filter((u) => u.estado === 'disponible').length || 0,
    mantenimiento: building.units?.filter((u) => u.estado === 'mantenimiento').length || 0,
  };

  const ocupacionRate =
    unitsStats.total > 0 ? ((unitsStats.ocupadas / unitsStats.total) * 100).toFixed(1) : 0;

  const totalExpenses = building.expenses?.reduce((sum, exp) => sum + exp.monto, 0) || 0;
  const monthlyIncome = building.units?.reduce((sum, u) => sum + (u.rentaMensual || 0), 0) || 0;

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Breadcrumbs y Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/edificios">Edificios</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink>{building.nombre}</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => router.push('/edificios')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Edificios
                </Button>
                <h1 className="text-2xl font-bold sm:text-3xl">{building.nombre}</h1>
              </div>
            </div>
            {canUpdate && (
              <Button onClick={() => router.push(`/edificios/${building.id}/editar`)}>
                Editar Edificio
              </Button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unidades Totales</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unitsStats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {unitsStats.ocupadas} ocupadas, {unitsStats.disponibles} disponibles
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa Ocupación</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ocupacionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {unitsStats.ocupadas} de {unitsStats.total} unidades
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{monthlyIncome.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Potencial mensual</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{totalExpenses.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">
                  {building.expenses?.length || 0} gastos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs con Detalles */}
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="unidades">Unidades</TabsTrigger>
              <TabsTrigger value="gastos">Gastos</TabsTrigger>
              <TabsTrigger value="mantenimiento">Mantenimiento</TabsTrigger>
              <TabsTrigger value="galeria">Galería</TabsTrigger>
            </TabsList>

            {/* Tab General */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                  <CardDescription>Datos básicos del edificio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>Dirección</span>
                      </div>
                      <p className="mt-1 font-medium">{building.direccion}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>Tipo</span>
                      </div>
                      <p className="mt-1 font-medium capitalize">{building.tipo}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Año Construcción</span>
                      </div>
                      <p className="mt-1 font-medium">{building.anoConstructor}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Número de Unidades</span>
                      </div>
                      <p className="mt-1 font-medium">{building.numeroUnidades}</p>
                    </div>
                    {building.estadoConservacion && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Estado de Conservación</span>
                        </div>
                        <p className="mt-1 font-medium capitalize">{building.estadoConservacion}</p>
                      </div>
                    )}
                    {building.certificadoEnergetico && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Certificado Energético</span>
                        </div>
                        <Badge className="mt-1">{building.certificadoEnergetico}</Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Características</CardTitle>
                  <CardDescription>Servicios y comodidades</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      {building.ascensor ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Ascensor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {building.garaje ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Garaje</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {building.trastero ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Trastero</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {building.piscina ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Piscina</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {building.jardin ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">Jardín</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {(building.gastosComunidad || building.ibiAnual) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Gastos Fijos</CardTitle>
                    <CardDescription>Gastos recurrentes del edificio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {building.gastosComunidad && (
                        <div>
                          <p className="text-sm text-muted-foreground">Gastos Comunidad</p>
                          <p className="text-2xl font-bold">
                            €{building.gastosComunidad.toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">Mensuales</p>
                        </div>
                      )}
                      {building.ibiAnual && (
                        <div>
                          <p className="text-sm text-muted-foreground">IBI Anual</p>
                          <p className="text-2xl font-bold">€{building.ibiAnual.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">Anuales</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab Unidades */}
            <TabsContent value="unidades" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Unidades del Edificio</CardTitle>
                  <CardDescription>{unitsStats.total} unidades en total</CardDescription>
                </CardHeader>
                <CardContent>
                  {building.units && building.units.length > 0 ? (
                    <div className="space-y-2">
                      {building.units.map((unit: any) => (
                        <Card
                          key={unit.id}
                          className="cursor-pointer transition-shadow hover:shadow-md"
                          onClick={() => router.push(`/unidades/${unit.id}`)}
                        >
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Unidad {unit.numero}</span>
                                <Badge
                                  variant={
                                    unit.estado === 'disponible'
                                      ? 'default'
                                      : unit.estado === 'ocupada'
                                        ? 'secondary'
                                        : 'destructive'
                                  }
                                >
                                  {unit.estado}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {unit.habitaciones} hab, {unit.banos} baños - {unit.superficie}m²
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">€{unit.rentaMensual}</p>
                              <p className="text-xs text-muted-foreground">Mensual</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      No hay unidades registradas
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Gastos */}
            <TabsContent value="gastos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gastos del Edificio</CardTitle>
                  <CardDescription>Historial de gastos y mantenimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  {building.expenses && building.expenses.length > 0 ? (
                    <div className="space-y-2">
                      {building.expenses.map((expense: any) => (
                        <Card key={expense.id}>
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="flex-1">
                              <p className="font-semibold">{expense.concepto}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(expense.fecha), "d 'de' MMMM, yyyy", {
                                  locale: es,
                                })}
                              </p>
                              {expense.categoria && (
                                <Badge variant="outline" className="mt-1">
                                  {expense.categoria}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-red-500">€{expense.monto}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      No hay gastos registrados
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Mantenimiento */}
            <TabsContent value="mantenimiento" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Mantenimiento Programado</CardTitle>
                  <CardDescription>Tareas de mantenimiento preventivo</CardDescription>
                </CardHeader>
                <CardContent>
                  {building.maintenanceSchedules && building.maintenanceSchedules.length > 0 ? (
                    <div className="space-y-2">
                      {building.maintenanceSchedules.map((schedule: any) => (
                        <Card key={schedule.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold">{schedule.titulo}</p>
                                <p className="text-sm text-muted-foreground">
                                  {schedule.descripcion}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="outline">{schedule.tipo}</Badge>
                                  <Badge variant="outline">{schedule.frecuencia}</Badge>
                                  {schedule.activo ? (
                                    <Badge className="bg-green-500">Activo</Badge>
                                  ) : (
                                    <Badge variant="secondary">Inactivo</Badge>
                                  )}
                                </div>
                              </div>
                              {schedule.costoEstimado && (
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Costo Estimado</p>
                                  <p className="font-bold">€{schedule.costoEstimado}</p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground">
                      No hay mantenimientos programados
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab Galería */}
            <TabsContent value="galeria" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Galería de Fotos</CardTitle>
                  <CardDescription>Fotos del edificio</CardDescription>
                </CardHeader>
                <CardContent>
                  <PhotoGallery entityType="building" entityId={building.id} canEdit={canUpdate} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
