'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  Bell,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  UserX,
  Globe,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import toast from 'react-hot-toast';

interface SecurityAlert {
  id: string;
  type: 'login_failed' | 'suspicious_activity' | 'ip_blocked' | 'brute_force' | 'data_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  status: 'new' | 'acknowledged' | 'resolved';
  metadata?: Record<string, any>;
}

interface AlertConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold?: number;
  channels: ('email' | 'sms' | 'slack')[];
}

export default function SecurityAlertsPage() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('alerts');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Alertas de ejemplo
      const sampleAlerts: SecurityAlert[] = [];

      const defaultConfigs: AlertConfig[] = [
        {
          id: 'login_failed',
          name: 'Intentos de login fallidos',
          description: 'Alerta cuando un usuario falla múltiples intentos de login',
          enabled: true,
          threshold: 5,
          channels: ['email'],
        },
        {
          id: 'suspicious_location',
          name: 'Ubicación sospechosa',
          description: 'Alerta cuando se detecta login desde un país nuevo',
          enabled: true,
          channels: ['email', 'slack'],
        },
        {
          id: 'brute_force',
          name: 'Ataque de fuerza bruta',
          description: 'Detecta patrones de ataque de fuerza bruta',
          enabled: true,
          threshold: 10,
          channels: ['email', 'sms', 'slack'],
        },
        {
          id: 'data_export',
          name: 'Exportación masiva de datos',
          description: 'Alerta cuando se exporta una cantidad inusual de datos',
          enabled: false,
          channels: ['email'],
        },
      ];

      setAlerts(sampleAlerts);
      setConfigs(defaultConfigs);
    } catch (error) {
      toast.error('Error al cargar datos de seguridad');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">Crítico</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-black">Medio</Badge>;
      case 'low':
        return <Badge variant="outline">Bajo</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'acknowledged':
        return <Eye className="h-5 w-5 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login_failed':
        return <Lock className="h-5 w-5" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-5 w-5" />;
      case 'ip_blocked':
        return <Globe className="h-5 w-5" />;
      case 'brute_force':
        return <UserX className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const handleAcknowledge = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, status: 'acknowledged' } : a
    ));
    toast.success('Alerta marcada como revisada');
  };

  const handleResolve = (id: string) => {
    setAlerts(alerts.map(a => 
      a.id === id ? { ...a, status: 'resolved' } : a
    ));
    toast.success('Alerta resuelta');
  };

  const handleToggleConfig = (id: string) => {
    setConfigs(configs.map(c => 
      c.id === id ? { ...c, enabled: !c.enabled } : c
    ));
  };

  const newAlerts = alerts.filter(a => a.status === 'new').length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alertas de Seguridad</h1>
            <p className="text-muted-foreground">
              Monitorea y configura alertas de seguridad de la plataforma
            </p>
          </div>
          <Button onClick={loadData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{newAlerts}</span>
                <span className="text-muted-foreground">Nuevas</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{criticalAlerts}</span>
                <span className="text-muted-foreground">Críticas</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">
                  {alerts.filter(a => a.status === 'resolved').length}
                </span>
                <span className="text-muted-foreground">Resueltas</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{alerts.length}</span>
                <span className="text-muted-foreground">Total</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="alerts">
              Alertas
              {newAlerts > 0 && (
                <Badge className="ml-2 bg-red-500">{newAlerts}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="config">Configuración</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            {alerts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Todo está seguro</h3>
                  <p className="text-muted-foreground">
                    No hay alertas de seguridad activas
                  </p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card key={alert.id} className={`${
                  alert.status === 'new' && (alert.severity === 'critical' || alert.severity === 'high')
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                    : ''
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {getTypeIcon(alert.type)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{alert.title}</h3>
                            {getSeverityBadge(alert.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(alert.status)}
                              {alert.status === 'new' ? 'Nueva' :
                               alert.status === 'acknowledged' ? 'Revisada' : 'Resuelta'}
                            </span>
                          </div>
                          {alert.metadata && (
                            <div className="mt-2 p-2 bg-muted/50 rounded text-xs font-mono">
                              {JSON.stringify(alert.metadata, null, 2)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {alert.status === 'new' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Revisar
                          </Button>
                        )}
                        {alert.status !== 'resolved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Alertas</CardTitle>
                <CardDescription>
                  Define qué eventos generan alertas y cómo se notifican
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{config.name}</h4>
                          {config.threshold && (
                            <Badge variant="outline">
                              Umbral: {config.threshold}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {config.description}
                        </p>
                        <div className="flex gap-1">
                          {config.channels.map((channel) => (
                            <Badge key={channel} variant="secondary" className="text-xs">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={() => handleToggleConfig(config.id)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
