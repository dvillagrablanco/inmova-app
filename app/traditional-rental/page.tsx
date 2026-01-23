'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Building2,
  Home,
  Users,
  FileText,
  TrendingUp,
  Percent,
  DoorOpen,
  AlertTriangle,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardData {
  edificios: number;
  unidades: number;
  unidadesOcupadas: number;
  unidadesDisponibles: number;
  unidadesMantenimiento: number;
  inquilinos: number;
  contratosActivos: number;
  tasaOcupacion: number;
  ingresosMensuales: number;
  ocupacionPorTipo: Array<{
    tipo: string;
    ocupadas: number;
    disponibles: number;
    total: number;
  }>;
  edificiosResumen: Array<{
    id: string;
    nombre: string;
    unidades: number;
    ocupadas: number;
    ingresos: number;
  }>;
  contratosProximosVencer: Array<{
    id: string;
    inquilino: string;
    unidad: string;
    fechaFin: string;
  }>;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function TraditionalRentalDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/traditional-rental/dashboard');
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!data) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No hay datos disponibles</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Comienza añadiendo edificios y unidades para ver el dashboard.
            </p>
            <Button className="mt-4" onClick={() => router.push('/edificios/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Edificio
            </Button>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const ocupacionData = [
    { name: 'Ocupadas', value: data.unidadesOcupadas, color: '#4F46E5' },
    { name: 'Disponibles', value: data.unidadesDisponibles, color: '#10B981' },
    { name: 'Mantenimiento', value: data.unidadesMantenimiento, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Living Residencial</h1>
            <p className="text-muted-foreground">
              Dashboard de alquiler tradicional y gestión de propiedades
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/edificios')}>
              <Building2 className="mr-2 h-4 w-4" />
              Edificios
            </Button>
            <Button onClick={() => router.push('/contratos/nuevo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Contrato
            </Button>
          </div>
        </div>

        {/* KPIs principales */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Edificios</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.edificios}</div>
              <Link href="/edificios" className="text-xs text-primary hover:underline">
                Ver todos →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unidades</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.unidades}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="default" className="text-xs">
                  {data.unidadesOcupadas} ocupadas
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {data.unidadesDisponibles} disponibles
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.tasaOcupacion.toFixed(1)}%</div>
              <Progress value={data.tasaOcupacion} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{data.ingresosMensuales.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.contratosActivos} contratos activos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Segunda fila de KPIs */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inquilinos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.inquilinos}</div>
              <Link href="/inquilinos" className="text-xs text-primary hover:underline">
                Gestionar inquilinos →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.contratosActivos}</div>
              <Link href="/contratos" className="text-xs text-primary hover:underline">
                Ver contratos →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Mantenimiento</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.unidadesMantenimiento}</div>
              <Link href="/mantenimiento" className="text-xs text-primary hover:underline">
                Ver mantenimiento →
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Ocupación por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Ocupación por Tipo de Unidad</CardTitle>
              <CardDescription>Distribución de ocupación por tipo de propiedad</CardDescription>
            </CardHeader>
            <CardContent>
              {data.ocupacionPorTipo && data.ocupacionPorTipo.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.ocupacionPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ocupadas" fill="#4F46E5" name="Ocupadas" stackId="a" />
                    <Bar dataKey="disponibles" fill="#10B981" name="Disponibles" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No hay datos de ocupación por tipo
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado de Unidades */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de Unidades</CardTitle>
              <CardDescription>Distribución por estado actual</CardDescription>
            </CardHeader>
            <CardContent>
              {ocupacionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ocupacionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ocupacionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No hay datos de estado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Resumen por Edificio y Contratos próximos a vencer */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Resumen por Edificio */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Edificio</CardTitle>
              <CardDescription>Ocupación e ingresos por edificio</CardDescription>
            </CardHeader>
            <CardContent>
              {data.edificiosResumen && data.edificiosResumen.length > 0 ? (
                <div className="space-y-4">
                  {data.edificiosResumen.slice(0, 5).map((edificio) => (
                    <div key={edificio.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <Link href={`/edificios/${edificio.id}`} className="font-medium hover:underline">
                          {edificio.nombre}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {edificio.ocupadas}/{edificio.unidades} unidades ocupadas
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          €{edificio.ingresos.toLocaleString('es-ES')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {edificio.unidades > 0 ? ((edificio.ocupadas / edificio.unidades) * 100).toFixed(0) : 0}% ocupación
                        </div>
                      </div>
                    </div>
                  ))}
                  <Link href="/edificios">
                    <Button variant="outline" className="w-full">
                      Ver todos los edificios
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay edificios registrados
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contratos próximos a vencer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Contratos Próximos a Vencer
              </CardTitle>
              <CardDescription>Contratos que vencen en los próximos 30 días</CardDescription>
            </CardHeader>
            <CardContent>
              {data.contratosProximosVencer && data.contratosProximosVencer.length > 0 ? (
                <div className="space-y-3">
                  {data.contratosProximosVencer.slice(0, 5).map((contrato) => (
                    <div key={contrato.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                      <div>
                        <div className="font-medium">{contrato.inquilino}</div>
                        <div className="text-sm text-muted-foreground">{contrato.unidad}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {new Date(contrato.fechaFin).toLocaleDateString('es-ES')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Link href="/contratos?filter=expiring">
                    <Button variant="outline" className="w-full">
                      Ver todos
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No hay contratos próximos a vencer
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/edificios/nuevo')}>
                <Building2 className="h-6 w-6 mb-2" />
                Nuevo Edificio
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/unidades/nuevo')}>
                <DoorOpen className="h-6 w-6 mb-2" />
                Nueva Unidad
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/inquilinos/nuevo')}>
                <Users className="h-6 w-6 mb-2" />
                Nuevo Inquilino
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => router.push('/contratos/nuevo')}>
                <FileText className="h-6 w-6 mb-2" />
                Nuevo Contrato
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
