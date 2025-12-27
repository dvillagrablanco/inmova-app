'use client';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  MessageSquare,
  FileText,
  DollarSign,
  Activity,
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PortalStats {
  summary: {
    totalTenants: number;
    totalProviders: number;
    totalOwners: number;
    totalSalesReps: number;
    totalActiveUsers: number;
  };
  tenantPortal: {
    total: number;
    active: number;
    conversations: number;
    paymentsLast30Days: number;
    recentActivity: number;
    conversionRate: string;
  };
  providerPortal: {
    total: number;
    active: number;
    workOrders: number;
    workOrdersCompleted: number;
    pendingInvoices: number;
    completionRate: string;
  };
  ownerPortal: {
    total: number;
    active: number;
    buildings: number;
    unreadNotifications: number;
    recentActivity: number;
    avgBuildingsPerOwner: string;
  };
  salesTeam: {
    total: number;
    active: number;
    leadsLast30Days: number;
    conversions: number;
    pendingCommissions: number;
    conversionRate: string;
    recentActivity: number;
  };
  recentActivity: Array<{
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    portal: string;
  }>;
  alerts: Array<{
    type: string;
    portal: string;
    message: string;
  }>;
}

export default function PortalesExternosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<PortalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role !== 'super_admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      loadStats();
    }
  }, [session, selectedCompany]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const url =
        selectedCompany === 'all'
          ? '/api/admin/external-portals'
          : `/api/admin/external-portals?companyId=${selectedCompany}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error('Error al cargar estadísticas');
      }
    } catch (error) {
      logger.error('Error loading stats:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
            <LoadingState message="Cargando estadísticas de portales externos..." />
          </AuthenticatedLayout>
    );
  }

  if (!stats) return null;

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold gradient-text">Portales Externos</h1>
                <p className="text-muted-foreground mt-1">
                  Gestión y monitoreo de todos los portales externos de la plataforma
                </p>
              </div>
              <Button onClick={loadStats} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>
            </div>

            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Inquilinos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.summary.totalTenants}</div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.tenantPortal.active} activos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Proveedores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.summary.totalProviders}</div>
                    <Briefcase className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.providerPortal.active} activos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Propietarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.summary.totalOwners}</div>
                    <Building2 className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.ownerPortal.active} activos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Comerciales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{stats.summary.totalSalesReps}</div>
                    <Target className="h-8 w-8 text-orange-500" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.salesTeam.active} activos
                  </p>
                </CardContent>
              </Card>

              <Card className="card-hover gradient-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-white">Total Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-white">
                      {stats.summary.totalActiveUsers}
                    </div>
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-xs text-white/80 mt-2">Usuarios en todos los portales</p>
                </CardContent>
              </Card>
            </div>

            {/* Alertas */}
            {stats.alerts.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-800">
                    <Bell className="mr-2 h-5 w-5" />
                    Notificaciones y Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 p-3 bg-white rounded-lg"
                      >
                        <AlertTriangle
                          className={`h-5 w-5 mt-0.5 ${
                            alert.type === 'warning' ? 'text-orange-500' : 'text-blue-500'
                          }`}
                        />
                        <div className="flex-1">
                          <Badge variant="outline" className="mb-1">
                            {alert.portal}
                          </Badge>
                          <p className="text-sm font-medium">{alert.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tabs de Portales */}
            <Tabs defaultValue="tenants" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="tenants">
                  <Users className="mr-2 h-4 w-4" />
                  Inquilinos
                </TabsTrigger>
                <TabsTrigger value="providers">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Proveedores
                </TabsTrigger>
                <TabsTrigger value="owners">
                  <Building2 className="mr-2 h-4 w-4" />
                  Propietarios
                </TabsTrigger>
                <TabsTrigger value="sales">
                  <Target className="mr-2 h-4 w-4" />
                  Comerciales
                </TabsTrigger>
              </TabsList>

              {/* Portal de Inquilinos */}
              <TabsContent value="tenants" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Inquilinos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.tenantPortal.total}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.tenantPortal.active} activos ({stats.tenantPortal.conversionRate}%)
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Conversaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.tenantPortal.conversations}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.tenantPortal.recentActivity} activas últimos 7 días
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pagos (30 días)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {stats.tenantPortal.paymentsLast30Days}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Vía Stripe</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Button
                      onClick={() => router.push('/portal-inquilino')}
                      className="gradient-primary"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Portal
                    </Button>
                    <Button onClick={() => router.push('/inquilinos')} variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Gestionar Inquilinos
                    </Button>
                    <Button onClick={() => router.push('/chat')} variant="outline">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Ver Conversaciones
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portal de Proveedores */}
              <TabsContent value="providers" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Proveedores</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.providerPortal.total}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.providerPortal.active} activos
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        Órdenes de Trabajo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.providerPortal.workOrders}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.providerPortal.workOrdersCompleted} completadas (
                        {stats.providerPortal.completionRate}%)
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        Facturas Pendientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {stats.providerPortal.pendingInvoices}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Por procesar</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Button
                      onClick={() => router.push('/portal-proveedor')}
                      className="gradient-primary"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Portal
                    </Button>
                    <Button onClick={() => router.push('/proveedores')} variant="outline">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Gestionar Proveedores
                    </Button>
                    <Button onClick={() => router.push('/ordenes-trabajo')} variant="outline">
                      <FileText className="mr-2 h-4 w-4" />
                      Ver Órdenes
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portal de Propietarios */}
              <TabsContent value="owners" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Total Propietarios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.ownerPortal.total}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.ownerPortal.active} activos
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Propiedades
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.ownerPortal.buildings}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ~{stats.ownerPortal.avgBuildingsPerOwner} por propietario
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        Notificaciones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {stats.ownerPortal.unreadNotifications}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">No leídas</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Button
                      onClick={() => router.push('/portal-propietario')}
                      className="gradient-primary"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ver Portal
                    </Button>
                    <Button onClick={() => router.push('/admin/propietarios')} variant="outline">
                      <Building2 className="mr-2 h-4 w-4" />
                      Gestionar Propietarios
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Equipo Comercial */}
              <TabsContent value="sales" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Comerciales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.salesTeam.total}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.salesTeam.active} activos
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Target className="mr-2 h-4 w-4" />
                        Leads (30 días)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.salesTeam.leadsLast30Days}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stats.salesTeam.conversions} conversiones ({stats.salesTeam.conversionRate}
                        %)
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Comisiones
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{stats.salesTeam.pendingCommissions}</div>
                      <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-3">
                    <Button
                      onClick={() => router.push('/admin/sales-team')}
                      className="gradient-primary"
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Gestionar Equipo
                    </Button>
                    <Button onClick={() => router.push('/crm')} variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Ver CRM
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actividad Reciente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'tenant_chat' && (
                          <MessageSquare className="h-5 w-5 text-blue-500" />
                        )}
                        {activity.type === 'provider_order' && (
                          <FileText className="h-5 w-5 text-green-500" />
                        )}
                        {activity.type === 'sales_lead' && (
                          <Target className="h-5 w-5 text-orange-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <Badge variant="outline" className="ml-2 flex-shrink-0">
                            {activity.portal}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.timestamp
                            ? format(new Date(activity.timestamp), "d 'de' MMMM, HH:mm", {
                                locale: es,
                              })
                            : 'Fecha no disponible'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
