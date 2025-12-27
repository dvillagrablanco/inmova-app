'use client';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Hotel,
  Calendar,
  DollarSign,
  TrendingUp,
  Star,
  Users,
  BarChart3,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface STRMetrics {
  totalListings: number;
  activeListings: number;
  occupancyRate: number;
  avgNightlyRate: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
  avgRating: number;
  revenueGrowth: number;
  occupancyTrend: string;
}

interface ChannelPerformance {
  channel: string;
  bookings: number;
  revenue: number;
  avgRate: number;
  commission: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

const COLORS = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'];

export default function STRDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<STRMetrics | null>(null);
  const [channelPerformance, setChannelPerformance] = useState<ChannelPerformance[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadDashboardData();
    }
  }, [status, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Cargar métricas STR
      const metricsRes = await fetch('/api/str/metrics');
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      // Cargar rendimiento por canal
      const channelsRes = await fetch('/api/str/channel-performance');
      if (channelsRes.ok) {
        const channelsData = await channelsRes.json();
        setChannelPerformance(channelsData);
      }

      // Cargar datos de ingresos históricos
      const revenueRes = await fetch('/api/str/revenue-history');
      if (revenueRes.ok) {
        const revenueDataRes = await revenueRes.json();
        setRevenueData(revenueDataRes);
      }
    } catch (error) {
      logger.error('Error loading STR dashboard:', error);
      toast.error('Error al cargar el dashboard STR');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        
        
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      
      
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Dashboard STR (Alquiler Vacacional)
                </h1>
                <p className="text-gray-600 mt-1">Gestión y análisis de propiedades vacacionales</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={loadDashboardData} variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={() => router.push('/str/listings')} className="gradient-primary">
                  <Hotel className="h-4 w-4 mr-2" />
                  Ver Anuncios
                </Button>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Anuncios Activos</CardTitle>
                  <Hotel className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.activeListings || 0}</div>
                  <p className="text-xs text-gray-500">de {metrics?.totalListings || 0} totales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.occupancyRate || 0}%</div>
                  <div className="flex items-center text-xs text-gray-500">
                    {metrics?.occupancyTrend === 'up' ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-600 mr-1" /> Aumentando
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-600 mr-1" /> Disminuyendo
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{metrics?.monthlyRevenue?.toLocaleString() || 0}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    {metrics?.revenueGrowth && metrics.revenueGrowth > 0 ? (
                      <>
                        <ArrowUp className="h-3 w-3 text-green-600 mr-1" /> +{metrics.revenueGrowth}
                        %
                      </>
                    ) : (
                      <>
                        <ArrowDown className="h-3 w-3 text-red-600 mr-1" /> {metrics?.revenueGrowth}
                        %
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valoración Media</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.avgRating || 0}</div>
                  <p className="text-xs text-gray-500">
                    {metrics?.totalBookings || 0} reservas totales
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="revenue" className="space-y-4">
              <TabsList>
                <TabsTrigger value="revenue">Ingresos</TabsTrigger>
                <TabsTrigger value="channels">Canales</TabsTrigger>
                <TabsTrigger value="performance">Rendimiento</TabsTrigger>
              </TabsList>

              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de Ingresos</CardTitle>
                    <CardDescription>Ingresos y reservas por mes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="revenue"
                          stroke="#4F46E5"
                          name="Ingresos (€)"
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="bookings"
                          stroke="#10B981"
                          name="Reservas"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Channels Tab */}
              <TabsContent value="channels" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento por Canal</CardTitle>
                    <CardDescription>Comparativa de canales de distribución</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={channelPerformance as any}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="channel" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" fill="#4F46E5" name="Ingresos (€)" />
                        <Bar dataKey="bookings" fill="#10B981" name="Reservas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Channel Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {channelPerformance.map((channel, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base">{channel.channel}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Reservas:</span>
                          <span className="font-semibold">{channel.bookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Ingresos:</span>
                          <span className="font-semibold">€{channel.revenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tarifa Media:</span>
                          <span className="font-semibold">€{channel.avgRate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Comisión:</span>
                          <span className="text-sm text-red-600">-€{channel.commission}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Distribución de Reservas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={channelPerformance as any}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry: any) => `${entry.channel}: ${entry.bookings}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="bookings"
                          >
                            {channelPerformance.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Métricas Clave</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Tarifa Promedio Noche</span>
                          <span className="font-semibold text-lg">
                            €{metrics?.avgNightlyRate || 0}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: '75%' }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Ocupación Anual</span>
                          <span className="font-semibold text-lg">
                            {metrics?.occupancyRate || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${metrics?.occupancyRate || 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Ingresos Totales:</span>
                          <span className="font-bold text-green-600">
                            €{metrics?.totalRevenue?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
