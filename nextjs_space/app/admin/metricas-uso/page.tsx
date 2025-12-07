'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from '@/components/ui/lazy-charts-extended';
import { RefreshCw, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import logger from '@/lib/logger';

interface UsageMetrics {
  period: number;
  moduleUsage: Array<{ action: string; count: number }>;
  companyActivity: Array<{ companyId: string | null; _count: { id: number }; company: any }>;
  userActivity: Array<{ userId: string | null; _count: { id: number }; user: any }>;
  modulesByCompany: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function UsageMetricsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [metricsData, setMetricsData] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchMetrics = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/usage-metrics?period=${period}`);
      
      if (!response.ok) {
        throw new Error('Error al obtener métricas');
      }

      const data = await response.json();
      setMetricsData(data);
    } catch (error) {
      logger.error('Error al cargar métricas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      fetchMetrics();
    }
  }, [session, period]);

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
          <AlertDescription>
            No tienes permisos para acceder a esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Métricas de Uso</h1>
          <p className="text-muted-foreground mt-1">
            Análisis de uso por módulo y empresa
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecciona período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={fetchMetrics}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Uso por Módulo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Uso por Módulo
          </CardTitle>
          <CardDescription>
            Acciones más frecuentes en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metricsData?.moduleUsage && metricsData.moduleUsage.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={metricsData.moduleUsage.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="action" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Cantidad de Usos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No hay datos disponibles para el período seleccionado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Empresas Más Activas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Empresas Más Activas
          </CardTitle>
          <CardDescription>
            Top 20 empresas por actividad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metricsData?.companyActivity && metricsData.companyActivity.length > 0 ? (
              metricsData.companyActivity.slice(0, 20).map((activity, index) => (
                <div
                  key={activity.companyId || `no-company-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {activity.company?.name || 'Sin empresa'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Plan: {activity.company?.subscriptionPlan || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{activity._count.id}</p>
                    <p className="text-sm text-muted-foreground">acciones</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay datos disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usuarios Más Activos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Usuarios Más Activos
          </CardTitle>
          <CardDescription>
            Top 20 usuarios por actividad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metricsData?.userActivity && metricsData.userActivity.length > 0 ? (
              metricsData.userActivity.slice(0, 20).map((activity, index) => (
                <div
                  key={activity.userId || `no-user-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {activity.user?.name || 'Usuario desconocido'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.user?.email || 'N/A'} • {activity.user?.role || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{activity._count.id}</p>
                    <p className="text-sm text-muted-foreground">acciones</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No hay datos disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
        </main>
      </div>
    </div>
  );
}
