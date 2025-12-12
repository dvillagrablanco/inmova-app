'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Home,
  ArrowLeft,
  Hotel,
  TrendingUp,
  DollarSign,
  Calendar,
  Star,
  Users,
  Building2,
  Activity,
  TrendingDown,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingState } from '@/components/ui/loading-state';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';
import logger, { logError } from '@/lib/logger';;


interface DashboardStats {
  totalListings: number;
  activeListings: number;
  totalBookings: number;
  bookingsThisMonth: number;
  totalRevenue: number;
  revenueThisMonth: number;
  averageRating: number;
  occupancyRate: number;
  totalReviews: number;
  confirmedBookings: number;
  checkInTodayBookings: number;
  checkOutTodayBookings: number;
  revenueByMonth: Array<{ mes: string; ingresos: number }>;
  bookingsByChannel: Array<{ canal: string; reservas: number }>;
  topListings: Array<{
    id: string;
    titulo: string;
    totalReservas: number;
    ingresoTotal: number;
    ratingPromedio: number;
  }>;
}

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];

export default function STRDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'month', 'quarter', 'year'

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadDashboardStats();
    }
  }, [status, router, selectedPeriod]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/str/dashboard?period=${selectedPeriod}`);
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto">
            <LoadingState message="Cargando dashboard STR..." />
          </main>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center">
              <p className="text-gray-500">No hay datos disponibles</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/home">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>STR & Alquileres Vacacionales</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                  Dashboard STR
                </h1>
                <p className="text-gray-600 mt-2">
                  Gestiona tus alquileres vacacionales y sincroniza con plataformas OTA
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/str/listings')}>
                  <Hotel className="h-4 w-4 mr-2" />
                  Anuncios
                </Button>
                <Button variant="outline" onClick={() => router.push('/str/bookings')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reservas
                </Button>
                <Button variant="outline" onClick={() => router.push('/str/channels')}>
                  <Activity className="h-4 w-4 mr-2" />
                  Canales
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Anuncios Activos</CardTitle>
                  <Hotel className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeListings}</div>
                  <p className="text-xs text-gray-500">{stats.totalListings} anuncios totales</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reservas Este Mes</CardTitle>
                  <Calendar className="h-4 w-4 text-violet-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.bookingsThisMonth}</div>
                  <p className="text-xs text-gray-500">{stats.totalBookings} reservas totales</p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Este Mes</CardTitle>
                  <DollarSign className="h-4 w-4 text-pink-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{stats.revenueThisMonth.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500">
                    €{stats.totalRevenue.toLocaleString()} total
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
                  <p className="text-xs text-gray-500">
                    {stats.averageRating.toFixed(1)}⭐ rating promedio
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.confirmedBookings}</div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Check-ins Hoy</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.checkInTodayBookings}</div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Check-outs Hoy</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{stats.checkOutTodayBookings}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs with Charts */}
            <Tabs defaultValue="revenue" className="space-y-4">
              <TabsList>
                <TabsTrigger value="revenue">Ingresos</TabsTrigger>
                <TabsTrigger value="channels">Canales</TabsTrigger>
                <TabsTrigger value="listings">Top Anuncios</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={stats.revenueByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ingresos"
                          stroke="#4F46E5"
                          strokeWidth={2}
                          name="Ingresos (€)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="channels" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Reservas por Canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.bookingsByChannel}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) => `${entry.canal}: ${entry.reservas}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="reservas"
                        >
                          {stats.bookingsByChannel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="listings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Anuncios con Mejor Rendimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.topListings.map((listing, index) => (
                        <div
                          key={listing.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{listing.titulo}</p>
                              <p className="text-sm text-gray-500">
                                {listing.totalReservas} reservas • €
                                {listing.ingresoTotal.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold">
                              {listing.ratingPromedio.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    className="gradient-primary text-white h-auto py-4 justify-start"
                    onClick={() => router.push('/str/listings/nuevo')}
                  >
                    <Hotel className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Crear Anuncio</div>
                      <div className="text-xs opacity-90">Publica una nueva propiedad</div>
                    </div>
                  </Button>

                  <Button
                    className="gradient-primary text-white h-auto py-4 justify-start"
                    onClick={() => router.push('/str/bookings/nueva')}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Nueva Reserva</div>
                      <div className="text-xs opacity-90">Registra una reserva directa</div>
                    </div>
                  </Button>

                  <Button
                    className="gradient-primary text-white h-auto py-4 justify-start"
                    onClick={() => router.push('/str/channels')}
                  >
                    <Activity className="h-5 w-5 mr-2" />
                    <div className="text-left">
                      <div className="font-semibold">Sincronizar Canales</div>
                      <div className="text-xs opacity-90">Conecta con OTAs</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
