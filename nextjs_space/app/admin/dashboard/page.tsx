'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  PieChart,
  RefreshCw,
  TrendingDown,
  Euro,
  Percent,
  UserPlus,
  Home,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
} from 'recharts';

interface DashboardStats {
  overview: {
    totalCompanies: number;
    activeCompanies: number;
    trialCompanies: number;
    suspendedCompanies: number;
    totalUsers: number;
    activeUsers: number;
    totalBuildings: number;
    totalUnits: number;
    totalTenants: number;
    activeTenants: number;
    totalContracts: number;
    activeContracts: number;
    monthlyRevenue: number;
    occupancyRate: number;
    newCompaniesLast30Days: number;
    newCompaniesLast90Days: number;
    newUsersLast30Days: number;
    newBuildingsLast30Days: number;
    churnRate: number;
    churnedCompanies: number;
  };
  financial: {
    mrr: number;
    arr: number;
    monthlyRevenue: number;
    lastMonthRevenue: number;
    revenueGrowth: number;
  };
  growth: {
    newCompaniesLast30Days: number;
    newCompaniesLast90Days: number;
    newUsersLast30Days: number;
    newBuildingsLast30Days: number;
    trialToActiveRate: number;
  };
  subscriptionBreakdown: Array<{
    planId: string | null;
    planName: string;
    count: number;
  }>;
  historicalData: Array<{
    month: string;
    companies: number;
    users: number;
    buildings: number;
    revenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityName: string | null;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
    company: {
      nombre: string;
    };
  }>;
  topCompaniesByProperties: Array<{
    id: string;
    nombre: string;
    _count: {
      buildings: number;
      users: number;
      tenants: number;
    };
  }>;
  companiesNeedingAttention: Array<{
    id: string;
    nombre: string;
    estadoCliente: string;
    _count: {
      users: number;
      buildings: number;
    };
  }>;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard-stats');
      if (!response.ok) throw new Error('Error al cargar estadísticas');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar estadísticas del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    toast.success('Dashboard actualizado');
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (session?.user?.role !== 'super_admin') {
      router.push('/unauthorized');
      return;
    }
    fetchStats();
  }, [status, session, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="mt-2 text-sm text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview, financial, growth, subscriptionBreakdown, historicalData, recentActivity, topCompaniesByProperties, companiesNeedingAttention } = stats;

  // Formatear números
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);
  
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  Dashboard de Superadministrador
                </h1>
                <p className="text-gray-600 mt-1">
                  Vista global de todas las empresas en INMOVA
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                />
                Actualizar
              </Button>
            </div>

            {/* KPIs Financieros Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-emerald-600 bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">MRR</CardTitle>
                  <Euro className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-700">
                    {formatCurrency(financial.mrr)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ingresos recurrentes mensuales
                  </p>
                  <div className="mt-2 flex items-center text-xs">
                    <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">
                      ARR: {formatCurrency(financial.arr)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-600 bg-gradient-to-br from-blue-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos del Mes
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    {formatCurrency(financial.monthlyRevenue)}
                  </div>
                  <div className="flex items-center mt-2">
                    {financial.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1 text-red-600" />
                    )}
                    <span
                      className={`text-xs font-semibold ${
                        financial.revenueGrowth >= 0
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {formatPercent(Math.abs(financial.revenueGrowth))}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      vs mes anterior
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-indigo-600 bg-gradient-to-br from-indigo-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Empresas Activas
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-700">
                    {overview.activeCompanies}
                  </div>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center text-xs">
                      <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                      <span className="text-muted-foreground">
                        {overview.trialCompanies} en prueba
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1 text-red-600" />
                      <span className="text-muted-foreground">
                        {overview.suspendedCompanies} suspendidas
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tasa de Conversión
                  </CardTitle>
                  <Percent className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">
                    {formatPercent(growth.trialToActiveRate)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trial → Activo
                  </p>
                  <div className="mt-2 flex items-center text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" />
                    <span className="text-muted-foreground">
                      Churn: {formatPercent(overview.churnRate)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* KPIs de Crecimiento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nuevas Empresas (30d)
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{growth.newCompaniesLast30Days}</div>
                  <p className="text-xs text-muted-foreground">
                    {growth.newCompaniesLast90Days} en 90 días
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nuevos Usuarios (30d)
                  </CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{growth.newUsersLast30Days}</div>
                  <p className="text-xs text-muted-foreground">
                    Total: {overview.totalUsers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Nuevas Propiedades (30d)
                  </CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{growth.newBuildingsLast30Days}</div>
                  <p className="text-xs text-muted-foreground">
                    Total: {overview.totalBuildings}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tasa de Ocupación
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPercent(overview.occupancyRate)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {overview.activeTenants} inquilinos activos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs con Gráficos y Datos */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="growth">Crecimiento</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
                <TabsTrigger value="companies">Empresas</TabsTrigger>
              </TabsList>

              {/* Tab: Resumen con Gráficos */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Gráfico de Ingresos */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Evolución de Ingresos</CardTitle>
                      <CardDescription>Últimos 12 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              formatter={(value: any) => formatCurrency(Number(value))}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              name="Ingresos"
                              stroke="#10b981"
                              fill="#10b981"
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráfico de Empresas */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Crecimiento de Empresas</CardTitle>
                      <CardDescription>Últimos 12 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historicalData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="companies"
                              name="Empresas"
                              stroke="#6366f1"
                              strokeWidth={2}
                            />
                            <Line
                              type="monotone"
                              dataKey="users"
                              name="Usuarios"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Distribución de Planes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Planes de Suscripción</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                          <Pie
                            data={subscriptionBreakdown}
                            dataKey="count"
                            nameKey="planName"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={(entry) => `${entry.planName}: ${entry.count}`}
                          >
                            {subscriptionBreakdown.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Crecimiento */}
              <TabsContent value="growth" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Crecimiento Multi-Métrica</CardTitle>
                    <CardDescription>Evolución de usuarios, edificios y empresas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historicalData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="companies" name="Empresas" fill="#6366f1" />
                          <Bar dataKey="buildings" name="Edificios" fill="#8b5cf6" />
                          <Bar dataKey="users" name="Usuarios" fill="#ec4899" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Actividad Reciente */}
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                    <CardDescription>Últimas acciones en el sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentActivity && recentActivity.length > 0 ? (
                      <div className="space-y-3">
                        {recentActivity.map((activity) => (
                          <div
                            key={activity.id}
                            className="flex items-start space-x-3 p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition"
                          >
                            <Activity className="h-5 w-5 text-indigo-600 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.action}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {activity.entityType}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {activity.entityName || 'Sin nombre'}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <span>{activity.user.name || activity.user.email}</span>
                                <span className="mx-2">•</span>
                                <span>{activity.company.nombre}</span>
                                <span className="mx-2">•</span>
                                <span>
                                  {format(new Date(activity.createdAt), 'dd MMM yyyy HH:mm', {
                                    locale: es,
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No hay actividad reciente
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Empresas */}
              <TabsContent value="companies" className="space-y-4">
                {/* Top Empresas */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Empresas por Propiedades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topCompaniesByProperties && topCompaniesByProperties.length > 0 ? (
                      <div className="space-y-3">
                        {topCompaniesByProperties.map((company, index) => (
                          <div
                            key={company.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:border-indigo-300 transition cursor-pointer"
                            onClick={() => router.push(`/admin/clientes/${company.id}`)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium">{company.nombre}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                  <span>{company._count.buildings} edificios</span>
                                  <span>•</span>
                                  <span>{company._count.users} usuarios</span>
                                  <span>•</span>
                                  <span>{company._count.tenants} inquilinos</span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              Ver detalles
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No hay datos disponibles
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Empresas que Requieren Atención */}
                <Card>
                  <CardHeader>
                    <CardTitle>Empresas que Requieren Atención</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {companiesNeedingAttention && companiesNeedingAttention.length > 0 ? (
                      <div className="space-y-3">
                        {companiesNeedingAttention.map((company) => (
                          <div
                            key={company.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50"
                          >
                            <div className="flex items-center space-x-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                              <div>
                                <p className="font-medium">{company.nombre}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={
                                      company.estadoCliente === 'suspendido'
                                        ? 'destructive'
                                        : 'secondary'
                                    }
                                  >
                                    {company.estadoCliente}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {company._count.users} usuarios • {company._count.buildings}{' '}
                                    edificios
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/clientes/${company.id}`)}
                            >
                              Revisar
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No hay empresas que requieran atención
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
