'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Bell,
  FileText,
  Wrench,
  Shield,
  CreditCard,
  Filter,
  ChevronRight,
  Inbox,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Alert {
  id: string;
  type: 'payment' | 'contract' | 'maintenance' | 'document';
  priority: 'alto' | 'medio' | 'bajo';
  title: string;
  description: string;
  date?: string;
  daysRemaining?: number;
  entityId: string;
  entityType: string;
}

interface AlertsResponse {
  alerts: Alert[];
  summary: { total: number; high: number; medium: number; low: number };
}

type FilterType = 'todos' | 'payment' | 'contract' | 'maintenance' | 'insurance';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'payment', label: 'Pagos' },
  { value: 'contract', label: 'Contratos' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'insurance', label: 'Seguros' },
];

function getEntityHref(alert: Alert): string {
  switch (alert.entityType) {
    case 'payment':
      return `/pagos/${alert.entityId}`;
    case 'contract':
      return `/contratos/${alert.entityId}`;
    case 'maintenancerequest':
      return `/mantenimiento/${alert.entityId}`;
    case 'document':
      return '/dashboard/documents';
    case 'insurance':
      return `/seguros/${alert.entityId}`;
    case 'unit':
      return '/dashboard/properties';
    default:
      return '/dashboard';
  }
}

function getEntityLabel(alert: Alert): string {
  switch (alert.entityType) {
    case 'payment':
      return 'Ver pago';
    case 'contract':
      return 'Ver contrato';
    case 'maintenancerequest':
      return 'Ver mantenimiento';
    case 'document':
      return 'Ver documentos';
    case 'insurance':
      return 'Ver seguro';
    case 'unit':
      return 'Ver propiedad';
    default:
      return 'Ver detalles';
  }
}

function getTypeIcon(type: string, entityType: string) {
  if (entityType === 'insurance') return Shield;
  switch (type) {
    case 'payment':
      return CreditCard;
    case 'contract':
      return FileText;
    case 'maintenance':
      return Wrench;
    case 'document':
      return FileText;
    default:
      return AlertTriangle;
  }
}

export default function AlertasPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<AlertsResponse['summary'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/dashboard/alerts');
        if (!res.ok) throw new Error('Error al cargar alertas');
        const data: AlertsResponse = await res.json();
        setAlerts(data.alerts || []);
        setSummary(data.summary || null);
      } catch {
        setAlerts([]);
        setSummary(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'todos') return alerts;
    if (activeFilter === 'insurance') {
      return alerts.filter((a) => a.entityType === 'insurance');
    }
    return alerts.filter((a) => a.type === activeFilter);
  }, [alerts, activeFilter]);

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-7 w-7" />
            Centro de Alertas
          </h1>
          <p className="text-muted-foreground mt-1">
            Revisa y gestiona las alertas de tu portfolio
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {isLoading ? (
            <>
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </>
          ) : (
            <>
              <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        Alertas Críticas
                      </p>
                      <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                        {summary?.high ?? 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Alertas Medias
                      </p>
                      <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                        {summary?.medium ?? 0}
                      </p>
                    </div>
                    <AlertTriangle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-400">
                        Alertas Bajas
                      </p>
                      <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {summary?.low ?? 0}
                      </p>
                    </div>
                    <Bell className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={activeFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Alerts List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Inbox className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No hay alertas</h3>
              <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
                {activeFilter === 'todos'
                  ? 'No tienes alertas pendientes. Todo está bajo control.'
                  : `No hay alertas de tipo "${FILTER_OPTIONS.find((f) => f.value === activeFilter)?.label}".`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => {
              const href = getEntityHref(alert);
              const Icon = getTypeIcon(alert.type, alert.entityType);
              const priorityStyles = {
                alto: 'bg-red-600 text-white border-red-700 hover:bg-red-700',
                medio:
                  'bg-amber-500 text-amber-950 border-amber-600 hover:bg-amber-600',
                bajo:
                  'bg-green-600 text-white border-green-700 hover:bg-green-700',
              };

              return (
                <Card
                  key={alert.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(href)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              className={`font-semibold ${priorityStyles[alert.priority]}`}
                            >
                              {alert.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <CardTitle className="text-base mt-2">
                            {alert.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(href);
                        }}
                      >
                        {getEntityLabel(alert)}
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  {(alert.date || alert.daysRemaining !== undefined) && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">
                        {alert.date &&
                          format(new Date(alert.date), "dd 'de' MMMM, yyyy", {
                            locale: es,
                          })}
                        {alert.daysRemaining !== undefined && (
                          <span className="ml-2 font-medium">
                            {alert.daysRemaining === 0
                              ? '• Vence hoy'
                              : alert.daysRemaining === 1
                                ? '• Vence mañana'
                                : `• ${alert.daysRemaining} días restantes`}
                          </span>
                        )}
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
