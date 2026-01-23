'use client';

/**
 * Página de Detalles de Edificio
 * 
 * Muestra información completa de un edificio específico,
 * incluyendo unidades, ocupación e ingresos reales desde la API.
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Calendar,
  Home,
  Users,
  Euro,
  TrendingUp,
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import toast from 'react-hot-toast';

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  superficie: number;
  habitaciones: number;
  banos: number;
  estado: string;
  rentaMensual: number;
  tenant?: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string;
    telefono: string;
  } | null;
  contracts?: {
    id: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
  }[];
}

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  anoConstructor: number;
  numeroUnidades: number;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  units: Unit[];
}

function EdificioDetailContent() {
  const router = useRouter();
  const params = useParams();
  const buildingId = params?.id as string;
  const { data: session, status } = useSession();
  
  const [building, setBuilding] = useState<Building | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBuilding = async () => {
      if (!buildingId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/buildings/${buildingId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Edificio no encontrado');
          }
          throw new Error(`Error ${response.status}: No se pudo cargar el edificio`);
        }
        
        const data = await response.json();
        setBuilding(data);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMsg);
        console.error('Error fetching building:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && buildingId) {
      fetchBuilding();
    }
  }, [status, buildingId]);

  const handleDelete = async () => {
    if (!building) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/buildings/${building.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar el edificio');
      }

      toast.success('Edificio eliminado correctamente');
      router.push('/edificios');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar';
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Calcular métricas reales desde los datos de la API
  const calculateMetrics = () => {
    if (!building || !building.units) {
      return {
        totalUnits: 0,
        occupiedUnits: 0,
        availableUnits: 0,
        ocupacionPct: 0,
        ingresosMensuales: 0,
        ingresosPotenciales: 0,
      };
    }

    const totalUnits = building.units.length;
    const occupiedUnits = building.units.filter(u => u.estado === 'ocupada').length;
    const availableUnits = building.units.filter(u => u.estado === 'disponible').length;
    const ocupacionPct = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
    
    const ingresosMensuales = building.units
      .filter(u => u.estado === 'ocupada')
      .reduce((sum, u) => sum + Number(u.rentaMensual || 0), 0);
    
    const ingresosPotenciales = building.units
      .reduce((sum, u) => sum + Number(u.rentaMensual || 0), 0);

    return {
      totalUnits,
      occupiedUnits,
      availableUnits,
      ocupacionPct,
      ingresosMensuales,
      ingresosPotenciales,
    };
  };

  const metrics = calculateMetrics();

  const getTipoBadge = (tipo: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      residencial: { variant: 'default', label: 'Residencial' },
      comercial: { variant: 'secondary', label: 'Comercial' },
      mixto: { variant: 'outline', label: 'Mixto' },
      industrial: { variant: 'destructive', label: 'Industrial' },
    };
    return badges[tipo?.toLowerCase()] || { variant: 'default', label: tipo };
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'ocupada':
        return <Badge className="bg-green-100 text-green-700">Ocupada</Badge>;
      case 'disponible':
        return <Badge className="bg-blue-100 text-blue-700">Disponible</Badge>;
      case 'mantenimiento':
        return <Badge className="bg-yellow-100 text-yellow-700">Mantenimiento</Badge>;
      case 'reservada':
        return <Badge className="bg-purple-100 text-purple-700">Reservada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building2 className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold mb-2">Error</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => router.push('/edificios')}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver a Edificios
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!building) return null;

  const tipoBadge = getTipoBadge(building.tipo);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navegación */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/edificios')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
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
                <BreadcrumbLink href="/edificios">Edificios</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{building.nombre}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{building.nombre}</h1>
              <Badge variant={tipoBadge.variant}>{tipoBadge.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{building.direccion}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Año: {building.anoConstructor}
              </span>
              <span className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                {building.numeroUnidades} unidades registradas
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/propiedades/nuevo?buildingId=${building.id}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Unidad
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast.info('Función de edición próximamente')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Edificio
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Métricas principales - DATOS REALES */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Unidades</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalUnits}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.availableUnits} disponibles
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.ocupacionPct.toFixed(1)}%</div>
              <Progress value={metrics.ocupacionPct} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.occupiedUnits} de {metrics.totalUnits} ocupadas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{metrics.ingresosMensuales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                De unidades ocupadas
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Potenciales</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                €{metrics.ingresosPotenciales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Si 100% ocupación
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <Tabs defaultValue="unidades" className="space-y-4">
          <TabsList>
            <TabsTrigger value="unidades">
              <Home className="mr-2 h-4 w-4" />
              Unidades ({building.units?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="inquilinos">
              <Users className="mr-2 h-4 w-4" />
              Inquilinos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unidades">
            <Card>
              <CardHeader>
                <CardTitle>Unidades del Edificio</CardTitle>
                <CardDescription>
                  Lista de todas las unidades y su estado actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {building.units && building.units.length > 0 ? (
                  <div className="space-y-4">
                    {building.units.map(unit => (
                      <div
                        key={unit.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-lg">
                            <Home className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">Unidad {unit.numero}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{unit.tipo}</span>
                              <span>•</span>
                              <span>{unit.superficie} m²</span>
                              <span>•</span>
                              <span>{unit.habitaciones} hab.</span>
                              <span>•</span>
                              <span>{unit.banos} baño(s)</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              €{Number(unit.rentaMensual || 0).toLocaleString('es-ES')}/mes
                            </p>
                            {unit.tenant && (
                              <p className="text-sm text-muted-foreground">
                                {unit.tenant.nombre} {unit.tenant.apellidos}
                              </p>
                            )}
                          </div>
                          {getEstadoBadge(unit.estado)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/propiedades/${unit.id}`)}
                          >
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Home className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin unidades</h3>
                    <p className="text-muted-foreground mb-4">
                      Este edificio aún no tiene unidades registradas
                    </p>
                    <Button onClick={() => router.push(`/propiedades/nuevo?buildingId=${building.id}`)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Primera Unidad
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquilinos">
            <Card>
              <CardHeader>
                <CardTitle>Inquilinos Actuales</CardTitle>
                <CardDescription>
                  Inquilinos con contratos activos en este edificio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {building.units?.filter(u => u.tenant).length > 0 ? (
                  <div className="space-y-4">
                    {building.units
                      .filter(u => u.tenant)
                      .map(unit => (
                        <div
                          key={unit.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-muted rounded-full">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {unit.tenant?.nombre} {unit.tenant?.apellidos}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Unidad {unit.numero} • {unit.tenant?.email}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              €{Number(unit.rentaMensual || 0).toLocaleString('es-ES')}/mes
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {unit.tenant?.telefono}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin inquilinos</h3>
                    <p className="text-muted-foreground">
                      No hay inquilinos con contratos activos en este edificio
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar edificio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el edificio &quot;{building.nombre}&quot; y todos sus datos asociados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
}

export default function EdificioDetailPage() {
  return (
    <ErrorBoundary>
      <EdificioDetailContent />
    </ErrorBoundary>
  );
}
