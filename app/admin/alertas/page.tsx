'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  X,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import logger, { logError } from '@/lib/logger';


interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  companyId?: string;
  companyName?: string;
  action?: string;
  actionUrl?: string;
}

interface AlertsData {
  alerts: Alert[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

export default function AlertsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [alertsData, setAlertsData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/alerts');
      if (!response.ok) throw new Error('Error al cargar alertas');
      const data = await response.json();
      setAlertsData(data);
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al cargar alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'super_admin') {
        router.push('/unauthorized');
      } else {
        fetchAlerts();
      }
    }
  }, [status, session, router]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchAlerts();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    toast.success('Alerta desestimada');
  };

  const filteredAlerts =
    alertsData?.alerts.filter((alert) => {
      if (dismissedAlerts.has(alert.id)) return false;
      if (filterType === 'all') return true;
      return alert.type === filterType;
    }) || [];

  if (loading || status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-bg">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  if (!alertsData) return null;

  const { alerts, summary } = alertsData;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-3xl font-bold gradient-text flex items-center">
                  <AlertTriangle className="h-8 w-8 mr-3" />
                  Centro de Alertas
                </h1>
                <p className="text-gray-600 mt-1">
                  Notificaciones automáticas de eventos importantes
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="error">Errores</SelectItem>
                    <SelectItem value="warning">Advertencias</SelectItem>
                    <SelectItem value="info">Informativas</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  variant={autoRefresh ? 'default' : 'outline'}
                  size="sm"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto
                </Button>
                <Button onClick={fetchAlerts} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-l-4 border-l-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.total}</div>
                  <p className="text-xs text-muted-foreground">alertas activas</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Errores</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
                  <p className="text-xs text-muted-foreground">críticas</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{summary.warnings}</div>
                  <p className="text-xs text-muted-foreground">requieren atención</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Informativas</CardTitle>
                  <Info className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
                  <p className="text-xs text-muted-foreground">para revisar</p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts List */}
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {filterType === 'all' ? '¡Todo en orden!' : 'Sin alertas de este tipo'}
                    </h3>
                    <p className="text-gray-600">
                      {filterType === 'all'
                        ? 'No hay alertas activas en este momento'
                        : `No hay alertas de tipo "${filterType}" en este momento`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => (
                  <Card key={alert.id} className={`border ${getAlertBgColor(alert.type)}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          <div className="mt-1">{getAlertIcon(alert.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                              <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                                {alert.type.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-2">{alert.description}</p>
                            {alert.companyName && (
                              <p className="text-sm text-gray-600">
                                Empresa: <span className="font-medium">{alert.companyName}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {alert.actionUrl && (
                            <Button size="sm" onClick={() => router.push(alert.actionUrl!)}>
                              {alert.action || 'Ver'}
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismissAlert(alert.id)}
                            title="Desestimar alerta"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
