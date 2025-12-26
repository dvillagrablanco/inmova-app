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
  TrendingUp,
  Home,
  DollarSign,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Percent,
  PieChart as PieChartIcon,
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

interface FlippingMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalInvestment: number;
  totalRevenue: number;
  avgROI: number;
  avgProjectDuration: number;
  profitMargin: number;
}

interface ProjectStatus {
  status: string;
  count: number;
  value: number;
}

interface ROIData {
  project: string;
  investment: number;
  revenue: number;
  profit: number;
  roi: number;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function FlippingDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<FlippingMetrics | null>(null);
  const [projectStatus, setProjectStatus] = useState<ProjectStatus[]>([]);
  const [roiData, setRoiData] = useState<ROIData[]>([]);

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

      // Cargar métricas de flipping
      const metricsRes = await fetch('/api/flipping/metrics');
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      // Cargar estado de proyectos
      const statusRes = await fetch('/api/flipping/project-status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setProjectStatus(statusData);
      }

      // Cargar datos de ROI
      const roiRes = await fetch('/api/flipping/roi-analysis');
      if (roiRes.ok) {
        const roiDataRes = await roiRes.json();
        setRoiData(roiDataRes);
      }
    } catch (error) {
      logger.error('Error loading flipping dashboard:', error);
      toast.error('Error al cargar el dashboard de House Flipping');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Dashboard House Flipping
            </h1>
            <p className="text-gray-600 mt-1">Gestión y análisis de proyectos de renovación</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadDashboardData} variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => router.push('/flipping/projects')} className="gradient-primary">
              <Home className="h-4 w-4 mr-2" />
              Ver Proyectos
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.activeProjects || 0}</div>
              <p className="text-xs text-gray-500">de {metrics?.totalProjects || 0} totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROI Promedio</CardTitle>
              <Percent className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{metrics?.avgROI || 0}%</div>
              <p className="text-xs text-gray-500">Retorno de inversión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inversión Total</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{metrics?.totalInvestment?.toLocaleString() || 0}
              </div>
              <p className="text-xs text-gray-500">En proyectos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duración Media</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.avgProjectDuration || 0}</div>
              <p className="text-xs text-gray-500">días por proyecto</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="roi">Análisis ROI</TabsTrigger>
            <TabsTrigger value="status">Estado Proyectos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ingresos vs Inversión</CardTitle>
                  <CardDescription>Comparativa financiera</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={[
                        { name: 'Inversión', value: metrics?.totalInvestment || 0 },
                        { name: 'Ingresos', value: metrics?.totalRevenue || 0 },
                        {
                          name: 'Beneficio',
                          value: (metrics?.totalRevenue || 0) - (metrics?.totalInvestment || 0),
                        },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#4F46E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Proyectos</CardTitle>
                  <CardDescription>Por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={projectStatus as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.status}: ${entry.count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {projectStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Clave</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Proyectos Completados</div>
                    <div className="text-2xl font-bold text-green-600">
                      {metrics?.completedProjects || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Finalizados con éxito</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Margen de Beneficio</div>
                    <div className="text-2xl font-bold text-indigo-600">
                      {metrics?.profitMargin || 0}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Promedio</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Ingresos Totales</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      €{metrics?.totalRevenue?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Acumulado</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI Analysis Tab */}
          <TabsContent value="roi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Rentabilidad</CardTitle>
                <CardDescription>ROI por proyecto</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roiData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="project" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="investment" fill="#EF4444" name="Inversión (€)" />
                    <Bar dataKey="revenue" fill="#10B981" name="Ingresos (€)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ROI Details */}
            <div className="grid grid-cols-1 gap-4">
              {roiData.map((project, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{project.project}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Inversión</div>
                        <div className="text-lg font-semibold text-red-600">
                          €{project.investment.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Ingresos</div>
                        <div className="text-lg font-semibold text-green-600">
                          €{project.revenue.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Beneficio</div>
                        <div className="text-lg font-semibold text-blue-600">
                          €{project.profit.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">ROI</div>
                        <div
                          className={`text-lg font-bold ${
                            project.roi > 20
                              ? 'text-green-600'
                              : project.roi > 10
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {project.roi}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectStatus.map((status, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-base">{status.status}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Proyectos:</span>
                        <span className="font-semibold">{status.count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Valor:</span>
                        <span className="font-semibold">€{status.value.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
