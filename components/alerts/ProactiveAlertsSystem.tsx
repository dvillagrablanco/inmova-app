'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  AlertTriangle,
  Clock,
  TrendingDown,
  FileText,
  Wrench,
  DollarSign,
  Calendar,
  XCircle,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertType =
  | 'contract_expiring'
  | 'payment_overdue'
  | 'maintenance_due'
  | 'document_expiring'
  | 'occupancy_low'
  | 'revenue_drop'
  | 'inspection_due';

interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  daysUntil?: number;
  amount?: number;
  entityName?: string;
  entityId?: string;
  timestamp: Date;
  dismissed: boolean;
}

const alertConfig = {
  contract_expiring: {
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Contrato Venciendo',
  },
  payment_overdue: {
    icon: DollarSign,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Pago Atrasado',
  },
  maintenance_due: {
    icon: Wrench,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Mantenimiento',
  },
  document_expiring: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Documento Venciendo',
  },
  occupancy_low: {
    icon: TrendingDown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Ocupación Baja',
  },
  revenue_drop: {
    icon: TrendingDown,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Ingresos Bajos',
  },
  inspection_due: {
    icon: Calendar,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Inspección',
  },
};

const severityConfig = {
  critical: { label: 'Crítico', color: 'bg-red-600', textColor: 'text-red-600' },
  high: { label: 'Alto', color: 'bg-orange-500', textColor: 'text-orange-600' },
  medium: { label: 'Medio', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  low: { label: 'Bajo', color: 'bg-blue-500', textColor: 'text-blue-600' },
  info: { label: 'Info', color: 'bg-gray-500', textColor: 'text-gray-600' },
};

export function ProactiveAlertsSystem() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | AlertSeverity>('all');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      // Simulación - En producción, esto vendría de una API
      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'contract_expiring',
          severity: 'high',
          title: 'Contrato próximo a vencer',
          description: 'El contrato de Calle Mayor 45, Apto 3B vence en 15 días',
          actionLabel: 'Renovar Contrato',
          actionUrl: '/contracts/123',
          daysUntil: 15,
          entityName: 'Calle Mayor 45, Apto 3B',
          entityId: '123',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          dismissed: false,
        },
        {
          id: '2',
          type: 'payment_overdue',
          severity: 'critical',
          title: 'Pago atrasado',
          description: 'María García tiene un pago atrasado de €850 desde hace 5 días',
          actionLabel: 'Ver Pago',
          actionUrl: '/payments/456',
          daysUntil: -5,
          amount: 850,
          entityName: 'María García',
          entityId: '456',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          dismissed: false,
        },
        {
          id: '3',
          type: 'maintenance_due',
          severity: 'medium',
          title: 'Mantenimiento programado',
          description: 'Revisión anual de calderas en Edificio Central pendiente',
          actionLabel: 'Programar',
          actionUrl: '/maintenance/789',
          daysUntil: 7,
          entityName: 'Edificio Central',
          entityId: '789',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          dismissed: false,
        },
        {
          id: '4',
          type: 'document_expiring',
          severity: 'high',
          title: 'Certificado energético venciendo',
          description: 'El certificado energético de Residencial Los Pinos vence en 30 días',
          actionLabel: 'Ver Documento',
          actionUrl: '/documents/101',
          daysUntil: 30,
          entityName: 'Residencial Los Pinos',
          entityId: '101',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          dismissed: false,
        },
      ];

      setAlerts(mockAlerts);
      setLoading(false);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, dismissed: true } : alert))
    );
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (!alert.dismissed && (filter === 'all' || alert.severity === filter)) {
      return true;
    }
    return false;
  });

  const activeAlerts = alerts.filter((a) => !a.dismissed);
  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length;

  const getTimeAgo = (timestamp: Date): string => {
    const now = Date.now();
    const diff = now - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
    if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return 'Hace unos minutos';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-l-4 border-l-indigo-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas Proactivas
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Sistema inteligente de notificaciones para gestión proactiva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{criticalCount}</div>
                <div className="text-sm text-muted-foreground">Críticas</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{alerts.filter((a) => a.dismissed).length}</div>
                <div className="text-sm text-muted-foreground">Resueltas</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{alerts.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas ({activeAlerts.length})
        </Button>
        <Button
          variant={filter === 'critical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('critical')}
        >
          <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
          Críticas ({criticalCount})
        </Button>
      </div>

      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">¡Todo en orden!</h3>
              <p className="text-muted-foreground">No hay alertas activas en este momento</p>
            </CardContent>
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const config = alertConfig[alert.type];
            const Icon = config.icon;
            const severity = severityConfig[alert.severity];

            return (
              <Card
                key={alert.id}
                className={cn(
                  'border-l-4 transition-all hover:shadow-md',
                  alert.severity === 'critical' && 'border-l-red-600',
                  alert.severity === 'high' && 'border-l-orange-500',
                  alert.severity === 'medium' && 'border-l-yellow-500'
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-3 rounded-lg', config.bgColor)}>
                      <Icon className={cn('h-6 w-6', config.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge variant="outline" className={severity.textColor}>
                              {severity.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{alert.description}</p>
                          {alert.entityName && (
                            <div className="text-sm font-medium text-indigo-600">
                              {alert.entityName}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          {alert.daysUntil !== undefined && (
                            <div
                              className={cn(
                                'text-sm font-semibold mb-1',
                                alert.daysUntil < 0
                                  ? 'text-red-600'
                                  : alert.daysUntil <= 7
                                    ? 'text-orange-600'
                                    : 'text-blue-600'
                              )}
                            >
                              {alert.daysUntil < 0
                                ? `Hace ${Math.abs(alert.daysUntil)} días`
                                : `En ${alert.daysUntil} días`}
                            </div>
                          )}
                          {alert.amount !== undefined && (
                            <div className="text-lg font-bold text-red-600">€{alert.amount}</div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="h-3 w-3" />
                            {getTimeAgo(alert.timestamp)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        {alert.actionLabel && alert.actionUrl && (
                          <Button size="sm" asChild>
                            <a href={alert.actionUrl}>{alert.actionLabel}</a>
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => dismissAlert(alert.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Descartar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProactiveAlertsSystem;
