/**
 * Componente de Alertas Priorizadas
 * Muestra alertas críticas en el dashboard con priorización por urgencia
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Calendar,
  CreditCard,
  Wrench,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'payment' | 'contract' | 'maintenance' | 'document';
  priority: 'alto' | 'medio' | 'bajo';
  title: string;
  description: string;
  date?: Date;
  daysRemaining?: number;
  entityId: string;
  entityType: string;
}

export function PriorityAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboard/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts([...dismissedAlerts, alertId]);
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return CreditCard;
      case 'contract':
        return Calendar;
      case 'maintenance':
        return Wrench;
      case 'document':
        return FileText;
      default:
        return AlertCircle;
    }
  };

  const getAlertColor = (priority: string) => {
    switch (priority) {
      case 'alto':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          badge: 'bg-red-500',
          icon: 'text-red-600',
        };
      case 'medio':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          badge: 'bg-yellow-500',
          icon: 'text-yellow-600',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          badge: 'bg-blue-500',
          icon: 'text-blue-600',
        };
    }
  };

  const getAlertRoute = (alert: Alert) => {
    switch (alert.entityType) {
      case 'payment':
        return `/pagos/${alert.entityId}`;
      case 'contract':
        return `/contratos/${alert.entityId}`;
      case 'maintenancerequest':
        return `/mantenimiento/${alert.entityId}`;
      case 'document':
        return '/documentos';
      default:
        return '/dashboard';
    }
  };

  const visibleAlerts = alerts
    .filter((alert) => !dismissedAlerts.includes(alert.id))
    .sort((a, b) => {
      // Ordenar por prioridad
      const priorityOrder = { alto: 0, medio: 1, bajo: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-gray-400 animate-pulse" />
          <h3 className="text-lg font-semibold">Alertas Críticas</h3>
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
          ))}
        </div>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold">Alertas Críticas</h3>
        </div>
        <div className="mt-4 text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-gray-600">No hay alertas críticas</p>
          <p className="text-sm text-gray-500 mt-1">Todo está bajo control</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h3 className="text-lg font-semibold">Alertas Críticas</h3>
        </div>
        <Badge variant="destructive" className="text-xs">
          {visibleAlerts.length}
        </Badge>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {visibleAlerts.slice(0, 10).map((alert) => {
          const colors = getAlertColor(alert.priority);
          const Icon = getAlertIcon(alert.type);
          const route = getAlertRoute(alert);

          return (
            <div
              key={alert.id}
              className={`relative p-4 rounded-lg border-2 transition-all hover:shadow-md ${colors.bg} ${colors.border}`}
            >
              <button
                onClick={() => dismissAlert(alert.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                aria-label="Descartar alerta"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start space-x-3 pr-6">
                <div className={`flex-shrink-0 ${colors.icon}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-semibold text-sm text-gray-900">
                      {alert.title}
                    </h4>
                    <Badge
                      className={`text-xs text-white ${colors.badge}`}
                    >
                      {alert.priority.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">
                    {alert.description}
                  </p>

                  {alert.date && (
                    <p className="text-xs text-gray-600 mb-2">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {format(new Date(alert.date), "dd 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                      {alert.daysRemaining !== undefined && (
                        <span className="ml-2 font-semibold">
                          {alert.daysRemaining === 0
                            ? 'Vence HOY'
                            : alert.daysRemaining === 1
                            ? 'Vence MAÑANA'
                            : `${alert.daysRemaining} días restantes`}
                        </span>
                      )}
                    </p>
                  )}

                  <Link href={route}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs mt-1 px-2 h-7"
                    >
                      Ver Detalles
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {visibleAlerts.length > 10 && (
        <div className="mt-4 text-center">
          <Link href="/notificaciones">
            <Button variant="outline" size="sm">
              Ver Todas las Alertas ({visibleAlerts.length})
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}
