'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

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
  };
  subscriptionBreakdown: Array<{
    planId: string | null;
    planName: string;
    count: number;
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

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
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
      console.error('Error:', error);
      toast.error('Error al cargar estadísticas del dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        fetchStats();
      }
    }
  }, [status, session, router]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { overview } = stats;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
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

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-indigo-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Empresas
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalCompanies}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    {overview.activeCompanies} activas
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1 text-yellow-600" />
                    {overview.trialCompanies} en prueba
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-violet-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuarios Totales
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalUsers}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview.activeUsers} activos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-pink-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Propiedades
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalBuildings}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {overview.totalUnits} unidades
                  </p>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Ocupación</span>
                      <span className="font-semibold">
                        {overview.occupancyRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos del Mes
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    €{overview.monthlyRevenue.toLocaleString('es-ES')}
                  </div>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {overview.newCompaniesLast30Days} nuevas empresas (30 días)
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="subscriptions">Suscripciones</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
                <TabsTrigger value="attention">Requieren Atención</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Top Empresas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Top 5 Empresas por Propiedades
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.topCompaniesByProperties.map((company, index) => (
                        <div
                          key={company.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{company.nombre}</p>
                              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                                <span>{company._count.buildings} edificios</span>
                                <span>•</span>
                                <span>{company._count.users} usuarios</span>
                                <span>•</span>
                                <span>{company._count.tenants} inquilinos</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/clientes/${company.id}`)}
                          >
                            Ver Detalles
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Métricas Adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Inquilinos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {overview.totalTenants}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {overview.activeTenants} con contratos activos
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Contratos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {overview.totalContracts}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {overview.activeContracts} activos
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Tasa de Ocupación</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {overview.occupancyRate.toFixed(1)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {overview.totalUnits - Math.round((overview.occupancyRate / 100) * overview.totalUnits)} unidades disponibles
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="subscriptions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <PieChart className="h-5 w-5 mr-2" />
                      Distribución de Suscripciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.subscriptionBreakdown.map((sub) => (
                        <div
                          key={sub.planId || 'no-plan'}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{sub.planName}</p>
                            <p className="text-sm text-gray-500">
                              {sub.count} {sub.count === 1 ? 'empresa' : 'empresas'}
                            </p>
                          </div>
                          <Badge variant="secondary">
                            {((sub.count / overview.totalCompanies) * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Actividad Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-start space-x-3 p-3 border-l-2 border-indigo-600 bg-gray-50 rounded"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{activity.action}</Badge>
                              <span className="text-sm text-gray-600">
                                {activity.entityType}
                              </span>
                            </div>
                            <p className="text-sm mt-1">
                              <span className="font-medium">{activity.user.name || activity.user.email}</span>
                              {' en '}
                              <span className="font-medium">{activity.company.nombre}</span>
                            </p>
                            {activity.entityName && (
                              <p className="text-xs text-gray-500 mt-1">
                                {activity.entityName}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {format(new Date(activity.createdAt), "d 'de' MMMM 'a las' HH:mm", {
                                locale: es,
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="attention">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-orange-600">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Empresas que Requieren Atención
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.companiesNeedingAttention.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
                        <p>¡Todas las empresas están funcionando correctamente!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats.companiesNeedingAttention.map((company) => (
                          <div
                            key={company.id}
                            className="flex items-center justify-between p-3 border border-orange-200 bg-orange-50 rounded-lg"
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-medium">{company.nombre}</p>
                                <Badge variant="destructive">
                                  {company.estadoCliente}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {company._count.buildings} edificios • {company._count.users} usuarios
                              </p>
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
