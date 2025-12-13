'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Server,
  Database,
  Users,
  Building,
} from 'lucide-react';
import logger from '@/lib/logger';

interface SystemHealth {
  status: string;
  timestamp: string;
  metrics: {
    totalCompanies: number;
    totalUsers: number;
    totalBuildings: number;
    totalUnits: number;
    failedLogins: number;
  };
  companiesWithIssues: any[];
  system: {
    memoryUsage: any;
    uptime: number;
    platform: string;
    nodeVersion: string;
    totalMemory: number;
    freeMemory: number;
    cpuCount: number;
  };
  database: {
    status: string;
  };
}

export default function SystemHealthPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'super_admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  const fetchHealthData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/system-health');

      if (!response.ok) {
        throw new Error('Error al obtener datos de salud');
      }

      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      logger.error('Error al cargar datos de salud:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      fetchHealthData();

      // Auto-refrescar cada 30 segundos
      const interval = setInterval(fetchHealthData, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (session?.user?.role !== 'super_admin') {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>No tienes permisos para acceder a esta página.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Salud del Sistema</h1>
                <p className="text-muted-foreground mt-1">
                  Monitoreo en tiempo real del estado del sistema
                </p>
              </div>
              <Button onClick={fetchHealthData} disabled={refreshing} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>

            {/* Estado General */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Estado General
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {healthData?.status === 'healthy' ? (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold text-green-500">Sistema Saludable</p>
                        <p className="text-sm text-muted-foreground">
                          Última actualización:{' '}
                          {healthData.timestamp && new Date(healthData.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-8 w-8 text-yellow-500" />
                      <div>
                        <p className="text-2xl font-bold text-yellow-500">
                          Advertencias Detectadas
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Última actualización:{' '}
                          {healthData?.timestamp && new Date(healthData.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Métricas Principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Empresas</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthData?.metrics.totalCompanies || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Empresas registradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthData?.metrics.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Usuarios totales</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Edificios</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {healthData?.metrics.totalBuildings || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Edificios gestionados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Unidades</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{healthData?.metrics.totalUnits || 0}</div>
                  <p className="text-xs text-muted-foreground">Unidades totales</p>
                </CardContent>
              </Card>
            </div>

            {/* Empresas con Problemas */}
            {healthData?.companiesWithIssues && healthData.companiesWithIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Empresas con Problemas
                  </CardTitle>
                  <CardDescription>Empresas que requieren atención inmediata</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {healthData.companiesWithIssues.map((company) => (
                      <div
                        key={company.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {company.subscriptionStatus === 'INACTIVE'
                              ? 'Suscripción inactiva'
                              : `Suscripción expira: ${company.subscriptionEndDate ? new Date(company.subscriptionEndDate).toLocaleDateString() : 'N/A'}`}
                          </p>
                        </div>
                        <Badge
                          variant={
                            company.subscriptionStatus === 'INACTIVE' ? 'destructive' : 'secondary'
                          }
                        >
                          {company.subscriptionStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Información del Servidor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Información del Servidor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tiempo de Actividad</p>
                    <p className="text-lg font-semibold">
                      {healthData?.system.uptime ? formatUptime(healthData.system.uptime) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Memoria Usada</p>
                    <p className="text-lg font-semibold">
                      {healthData?.system.memoryUsage
                        ? formatBytes(healthData.system.memoryUsage.heapUsed)
                        : 'N/A'}{' '}
                      /{' '}
                      {healthData?.system.memoryUsage
                        ? formatBytes(healthData.system.memoryUsage.heapTotal)
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Memoria del Sistema</p>
                    <p className="text-lg font-semibold">
                      {healthData?.system.freeMemory && healthData?.system.totalMemory
                        ? `${formatBytes(healthData.system.totalMemory - healthData.system.freeMemory)} / ${formatBytes(healthData.system.totalMemory)}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Plataforma</p>
                    <p className="text-lg font-semibold">{healthData?.system.platform || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Node.js</p>
                    <p className="text-lg font-semibold">
                      {healthData?.system.nodeVersion || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">CPUs</p>
                    <p className="text-lg font-semibold">{healthData?.system.cpuCount || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de la Base de Datos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Base de Datos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  {healthData?.database.status === 'healthy' ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <div>
                        <p className="font-semibold text-green-500">Conectada</p>
                        <p className="text-sm text-muted-foreground">
                          La base de datos está funcionando correctamente
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-500" />
                      <div>
                        <p className="font-semibold text-red-500">Error de Conexión</p>
                        <p className="text-sm text-muted-foreground">
                          No se puede conectar a la base de datos
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alertas de Seguridad */}
            {healthData?.metrics.failedLogins && healthData.metrics.failedLogins > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Alertas de Seguridad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Intentos de Login Fallidos</AlertTitle>
                    <AlertDescription>
                      Se detectaron {healthData.metrics.failedLogins} intentos de login fallidos en
                      las últimas 24 horas.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
