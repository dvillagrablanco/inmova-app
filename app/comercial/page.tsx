'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Store,
  Warehouse,
  Laptop,
  FileText,
  Users,
  TrendingUp,
  Euro,
  Calendar,
  ChevronRight,
  Plus,
  BarChart3,
  ArrowUpRight,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

interface DashboardStats {
  totalEspacios: number;
  espaciosOcupados: number;
  espaciosDisponibles: number;
  tasaOcupacion: number;
  ingresosRecurrentes: number;
  ingresosPendientes: number;
  contratosPorVencer: number;
  visitasProgramadas: number;
}

interface SpaceType {
  id: string;
  name: string;
  count: number;
  occupied: number;
}

interface RecentActivity {
  id: string;
  type: string;
  text: string;
  date: string;
  status: string;
}

interface UpcomingExpiration {
  id: string;
  space: string;
  tenant: string;
  date: string;
  daysLeft: number;
}

const spaceTypeIcons: Record<string, any> = {
  oficinas: Building2,
  oficina: Building2,
  locales: Store,
  local: Store,
  naves: Warehouse,
  nave: Warehouse,
  coworking: Laptop,
  almacen: Warehouse,
  parking: Building2,
};

const spaceTypeColors: Record<string, string> = {
  oficinas: 'bg-blue-500',
  oficina: 'bg-blue-500',
  locales: 'bg-green-500',
  local: 'bg-green-500',
  naves: 'bg-amber-500',
  nave: 'bg-amber-500',
  coworking: 'bg-purple-500',
  almacen: 'bg-gray-500',
  parking: 'bg-indigo-500',
};

export default function ComercialDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalEspacios: 0,
    espaciosOcupados: 0,
    espaciosDisponibles: 0,
    tasaOcupacion: 0,
    ingresosRecurrentes: 0,
    ingresosPendientes: 0,
    contratosPorVencer: 0,
    visitasProgramadas: 0,
  });
  const [spaceTypes, setSpaceTypes] = useState<SpaceType[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingExpirations, setUpcomingExpirations] = useState<UpcomingExpiration[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/comercial/dashboard');
        
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || {
            totalEspacios: 0,
            espaciosOcupados: 0,
            espaciosDisponibles: 0,
            tasaOcupacion: 0,
            ingresosRecurrentes: 0,
            ingresosPendientes: 0,
            contratosPorVencer: 0,
            visitasProgramadas: 0,
          });
          setSpaceTypes(data.spaceTypes || []);
          setRecentActivity(data.recentActivity || []);
          setUpcomingExpirations(data.upcomingExpirations || []);
        }
      } catch (error) {
        console.error('Error loading comercial dashboard:', error);
        toast.error('Error al cargar datos del dashboard comercial');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const ocupacionColor = stats.tasaOcupacion >= 80 
    ? 'text-green-600' 
    : stats.tasaOcupacion >= 60 
    ? 'text-amber-600' 
    : 'text-red-600';

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-9 w-64 mb-2" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Alquiler Comercial
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión integral de oficinas, locales, naves industriales y espacios coworking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/comercial/leads">
              <Users className="h-4 w-4 mr-2" />
              Leads
            </Link>
          </Button>
          <Button asChild>
            <Link href="/comercial/espacios/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Espacio
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espacios Totales</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEspacios}</div>
            <p className="text-xs text-muted-foreground">
              {stats.espaciosOcupados} ocupados · {stats.espaciosDisponibles} disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${ocupacionColor}`}>
              {stats.tasaOcupacion}%
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Objetivo: 85%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Recurrentes</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.ingresosRecurrentes.toLocaleString('es-ES')}€
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.ingresosPendientes.toLocaleString('es-ES')}€ pendientes de cobro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas Acciones</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contratosPorVencer + stats.visitasProgramadas}</div>
            <p className="text-xs text-muted-foreground">
              {stats.contratosPorVencer} renovaciones · {stats.visitasProgramadas} visitas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de espacio */}
      {spaceTypes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {spaceTypes.map((type) => {
            const Icon = spaceTypeIcons[type.id] || Building2;
            const color = spaceTypeColors[type.id] || 'bg-gray-500';
            const ocupacion = type.count > 0 ? Math.round((type.occupied / type.count) * 100) : 0;
            
            return (
              <Link key={type.id} href={`/comercial/${type.id}`}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow hover:border-blue-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{type.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{type.count} espacios</span>
                          <Badge variant={ocupacion >= 80 ? 'default' : ocupacion >= 60 ? 'secondary' : 'destructive'}>
                            {ocupacion}% ocupado
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Mensaje cuando no hay espacios */}
      {spaceTypes.length === 0 && stats.totalEspacios === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay espacios comerciales</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comienza agregando tu primer espacio comercial para gestionar tu cartera.
            </p>
            <Button asChild>
              <Link href="/comercial/espacios/nuevo">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Espacio
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad reciente */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos movimientos en tu cartera comercial</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-100 text-green-600' :
                      activity.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                      activity.status === 'pending' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'contrato' && <FileText className="h-4 w-4" />}
                      {activity.type === 'pago' && <Euro className="h-4 w-4" />}
                      {activity.type === 'visita' && <Calendar className="h-4 w-4" />}
                      {activity.type === 'alerta' && <AlertCircle className="h-4 w-4" />}
                      {activity.type === 'lead' && <Users className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay actividad reciente</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contratos por vencer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              Próximos Vencimientos
            </CardTitle>
            <CardDescription>Contratos que requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExpirations.length > 0 ? (
              <div className="space-y-4">
                {upcomingExpirations.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{item.space}</h4>
                      <Badge variant={item.daysLeft <= 30 ? 'destructive' : item.daysLeft <= 60 ? 'secondary' : 'outline'}>
                        {item.daysLeft} días
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.tenant}</p>
                    <p className="text-xs text-gray-400">Vence: {item.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay contratos próximos a vencer</p>
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/comercial/contratos?filter=por_vencer">
                Ver todos los vencimientos
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Accesos rápidos */}
      <Card>
        <CardHeader>
          <CardTitle>Accesos Rápidos</CardTitle>
          <CardDescription>Gestiona tu cartera comercial de forma eficiente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/comercial/espacios">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <Building2 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <span className="text-sm font-medium">Todos los Espacios</span>
              </div>
            </Link>
            <Link href="/comercial/contratos">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <span className="text-sm font-medium">Contratos</span>
              </div>
            </Link>
            <Link href="/comercial/pagos">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <Euro className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                <span className="text-sm font-medium">Pagos</span>
              </div>
            </Link>
            <Link href="/comercial/leads">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <Users className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <span className="text-sm font-medium">Leads</span>
              </div>
            </Link>
            <Link href="/comercial/visitas">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <Calendar className="h-8 w-8 mx-auto text-indigo-600 mb-2" />
                <span className="text-sm font-medium">Visitas</span>
              </div>
            </Link>
            <Link href="/comercial/analytics">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-center">
                <BarChart3 className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <span className="text-sm font-medium">Analíticas</span>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
    </AuthenticatedLayout>
  );
}
