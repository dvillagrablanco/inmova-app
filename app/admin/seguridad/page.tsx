'use client';
export const dynamic = 'force-dynamic';


import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Shield, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import logger from '@/lib/logger';


interface SecurityAlert {
  type: string;
  severity: string;
  data: any;
}

interface SecurityData {
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  alerts: SecurityAlert[];
  period: number;
}

export default function SecurityAlertsPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');
  const [severity, setSeverity] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'super_admin') {
      router.push('/unauthorized');
    }
  }, [status, session, router]);

  const fetchSecurityAlerts = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({ period });
      if (severity !== 'all') {
        params.append('severity', severity);
      }

      const response = await fetch(`/api/admin/security-alerts?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Error al obtener alertas de seguridad');
      }

      const data = await response.json();
      setSecurityData(data);
    } catch (error) {
      logger.error('Error al cargar alertas de seguridad:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'super_admin') {
      fetchSecurityAlerts();
    }
  }, [session, period, severity]);

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

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getSeverityVariant = (sev: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (sev) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAlertTitle = (alert: SecurityAlert) => {
    switch (alert.type) {
      case 'FAILED_LOGINS':
        return `Múltiples intentos de login fallidos: ${alert.data.userId}`;
      case 'PERMISSION_CHANGE':
        return `Cambio de permisos: ${alert.data.user?.name || 'Usuario desconocido'}`;
      case 'UNUSUAL_ACCESS':
        return `Acceso desde ubicación inusual: ${alert.data.userId}`;
      case 'UNAUTHORIZED_ACCESS':
        return `Intento de acceso no autorizado: ${alert.data.user?.name || 'Usuario desconocido'}`;
      default:
        return 'Alerta de seguridad';
    }
  };

  const getAlertDescription = (alert: SecurityAlert) => {
    switch (alert.type) {
      case 'FAILED_LOGINS':
        return `${alert.data.failedAttempts} intentos fallidos. Último intento: ${new Date(alert.data.lastAttempt).toLocaleString()}`;
      case 'PERMISSION_CHANGE':
        return `Acción: ${alert.data.action} - ${new Date(alert.data.createdAt).toLocaleString()}`;
      case 'UNUSUAL_ACCESS':
        return `Acceso detectado desde una ubicación no habitual - ${new Date(alert.data.createdAt).toLocaleString()}`;
      case 'UNAUTHORIZED_ACCESS':
        return `Intento de acceso a recursos no autorizados - ${new Date(alert.data.createdAt).toLocaleString()}`;
      default:
        return 'Sin descripción disponible';
    }
  };

  const totalAlerts = securityData?.summary
    ? securityData.summary.critical +
      securityData.summary.high +
      securityData.summary.medium +
      securityData.summary.low
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Alertas de Seguridad</h1>
                <p className="text-muted-foreground mt-1">
                  Monitoreo de eventos de seguridad y accesos sospechosos
                </p>
              </div>
              <div className="flex gap-2">
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Severidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las severidades</SelectItem>
                    <SelectItem value="critical">Críticas</SelectItem>
                    <SelectItem value="high">Altas</SelectItem>
                    <SelectItem value="medium">Medias</SelectItem>
                    <SelectItem value="low">Bajas</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Último día</SelectItem>
                    <SelectItem value="7">Últimos 7 días</SelectItem>
                    <SelectItem value="30">Últimos 30 días</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={fetchSecurityAlerts} disabled={refreshing} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Resumen de Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Críticas</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">
                    {securityData?.summary.critical || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Requieren atención inmediata</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Altas</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">
                    {securityData?.summary.high || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Prioridad alta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Medias</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">
                    {securityData?.summary.medium || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Prioridad media</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Bajas</CardTitle>
                  <Info className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">
                    {securityData?.summary.low || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Prioridad baja</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Alertas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Alertas Detectadas ({securityData?.alerts?.length || 0})
                </CardTitle>
                <CardDescription>
                  Últimas {period} días {severity !== 'all' && `- Severidad: ${severity}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {securityData?.alerts && securityData.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {securityData.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent"
                      >
                        {getSeverityIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{getAlertTitle(alert)}</h4>
                            <Badge variant={getSeverityVariant(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getAlertDescription(alert)}
                          </p>
                          {alert.data.company && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Empresa: {alert.data.company.name}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold text-muted-foreground">
                      No se detectaron alertas de seguridad
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      El sistema está funcionando con normalidad
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recomendaciones */}
            {totalAlerts > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recomendaciones de Seguridad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(securityData?.summary?.critical || 0) > 0 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Alertas Críticas Detectadas</AlertTitle>
                        <AlertDescription>
                          Se recomienda revisar inmediatamente las alertas críticas y tomar medidas
                          correctivas.
                        </AlertDescription>
                      </Alert>
                    )}
                    {(securityData?.summary?.high || 0) > 5 && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Múltiples Alertas de Alta Prioridad</AlertTitle>
                        <AlertDescription>
                          Considera implementar controles de seguridad adicionales o revisar las
                          políticas de acceso.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
