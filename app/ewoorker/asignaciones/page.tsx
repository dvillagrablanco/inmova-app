'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  Users,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  MapPin,
  HardHat,
  ArrowRight,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Asignacion {
  id: string;
  trabajador: {
    id: string;
    nombre: string;
    especialidad: string;
    avatar: string | null;
    rating: number;
  };
  obra: {
    id: string;
    nombre: string;
    empresa: string;
    direccion: string;
  };
  fechaInicio: string;
  fechaFin: string | null;
  estado: string;
  tarifaDiaria: number;
  diasTrabajados: number;
  diasTotales: number;
}

interface Stats {
  totalAsignaciones: number;
  activas: number;
  completadas: number;
  pendientes: number;
  canceladas?: number;
}

const estadoConfig: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  asignado: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  en_curso: { label: 'Activa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completado: { label: 'Completada', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  cancelado: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  // Aliases for backward compatibility
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  activa: { label: 'Activa', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  completada: { label: 'Completada', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

export default function EwoorkerAsignacionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAsignaciones: 0,
    activas: 0,
    completadas: 0,
    pendientes: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/ewoorker/login');
    } else if (status === 'authenticated') {
      fetchAsignaciones();
    }
  }, [status, router]);

  const fetchAsignaciones = async () => {
    try {
      const response = await fetch('/api/ewoorker/asignaciones');
      if (!response.ok) {
        throw new Error('Error al cargar asignaciones');
      }
      const data = await response.json();
      setAsignaciones(data.asignaciones || []);
      setStats(
        data.stats || {
          totalAsignaciones: 0,
          activas: 0,
          completadas: 0,
          pendientes: 0,
        }
      );
    } catch (error) {
      console.error('Error fetching asignaciones:', error);
      toast.error('Error al cargar las asignaciones');
    } finally {
      setLoading(false);
    }
  };

  // Calcular ingresos del mes y tasa de éxito
  const ingresosMes = asignaciones
    .filter((a) => a.estado === 'en_curso' || a.estado === 'activa')
    .reduce((sum, a) => sum + a.tarifaDiaria * a.diasTrabajados, 0);

  const tasaExito =
    stats.totalAsignaciones > 0
      ? Math.round((stats.completadas / stats.totalAsignaciones) * 100)
      : 0;

  const handleFilter = () => {
    toast.info('Filtros avanzados en desarrollo');
  };

  const handleNewAssignment = () => {
    toast.success('Creacion de asignacion iniciada');
  };

  const handleViewDetails = (nombre: string) => {
    toast.info(`Detalle de asignacion: ${nombre}`);
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="flex justify-between mb-8">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/ewoorker/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Asignaciones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Asignaciones de Trabajadores</h1>
            <p className="text-muted-foreground">
              Gestiona las asignaciones de trabajadores a obras
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleFilter}>
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleNewAssignment}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Asignación
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Asignaciones</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAsignaciones}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-green-100 text-green-800">{stats.activas} activas</Badge>
                <Badge variant="outline">{stats.pendientes} pendientes</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasaExito}%</div>
              <Progress value={tasaExito} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ingresosMes.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">comisiones generadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <Calendar className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completadas}</div>
              <p className="text-xs text-muted-foreground">este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Asignaciones List */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Asignaciones</CardTitle>
            <CardDescription>Todas las asignaciones de trabajadores a obras</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="activa">Activas</TabsTrigger>
                <TabsTrigger value="pendiente">Pendientes</TabsTrigger>
                <TabsTrigger value="completada">Completadas</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <div className="space-y-4">
                  {asignaciones.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No hay asignaciones</h3>
                      <p className="text-muted-foreground mb-4">
                        Aún no tienes asignaciones de trabajadores a obras
                      </p>
                      <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleNewAssignment}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nueva Asignación
                      </Button>
                    </div>
                  ) : (
                    asignaciones
                      .filter((a) => {
                        if (activeTab === 'all') return true;
                        // Map tab values to estado values
                        const estadoMap: Record<string, string[]> = {
                          activa: ['en_curso', 'activa'],
                          pendiente: ['asignado', 'pendiente'],
                          completada: ['completado', 'completada'],
                        };
                        return estadoMap[activeTab]?.includes(a.estado) || a.estado === activeTab;
                      })
                      .map((asignacion) => {
                        const estadoInfo =
                          estadoConfig[asignacion.estado] || estadoConfig['pendiente'];
                        const EstadoIcon = estadoInfo.icon;
                        const progreso =
                          asignacion.diasTotales > 0
                            ? Math.round((asignacion.diasTrabajados / asignacion.diasTotales) * 100)
                            : 0;

                        return (
                          <div
                            key={asignacion.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              {/* Trabajador */}
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                  <AvatarImage src={asignacion.trabajador.avatar || undefined} />
                                  <AvatarFallback className="bg-orange-100 text-orange-600">
                                    {asignacion.trabajador.nombre
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="font-medium">{asignacion.trabajador.nombre}</h3>
                                  <Badge variant="secondary" className="text-xs">
                                    <HardHat className="h-3 w-3 mr-1" />
                                    {asignacion.trabajador.especialidad}
                                  </Badge>
                                </div>
                              </div>

                              <ArrowRight className="h-5 w-5 text-muted-foreground" />

                              {/* Obra */}
                              <div>
                                <h3 className="font-medium">{asignacion.obra.nombre}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {asignacion.obra.empresa}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {asignacion.obra.direccion}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-6">
                              {/* Progreso */}
                              <div className="text-center">
                                <div className="text-sm font-medium">
                                  {asignacion.diasTrabajados}/{asignacion.diasTotales} días
                                </div>
                                <Progress value={progreso} className="w-24 mt-1" />
                              </div>

                              {/* Tarifa */}
                              <div className="text-right">
                                <div className="text-lg font-bold">
                                  {asignacion.tarifaDiaria}€
                                  <span className="text-xs text-muted-foreground font-normal">
                                    /día
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Total: {asignacion.tarifaDiaria * asignacion.diasTotales}€
                                </div>
                              </div>

                              {/* Estado */}
                              <Badge className={estadoInfo.color}>
                                <EstadoIcon className="h-3 w-3 mr-1" />
                                {estadoInfo.label}
                              </Badge>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(asignacion.trabajadorNombre)}
                              >
                                Ver Detalles
                              </Button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
