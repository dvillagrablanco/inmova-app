'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile, getDashboardDetailLevel } from '@/lib/ui-mode-service';
import { Building2, Users, FileText, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalBuildings: number;
  totalUnits: number;
  totalTenants: number;
  activeContracts: number;
  monthlyRevenue: number;
  occupancyRate: number;
  pendingPayments: number;
  maintenanceIssues: number;
}

interface AdaptiveDashboardProps {
  userProfile: UserProfile;
  stats: DashboardStats;
  vertical: string;
}

/**
 * ADAPTIVE DASHBOARD - Dashboard que se adapta al nivel de experiencia
 *
 * Modos:
 * - Basic (Simple UI Mode): Solo 4 métricas principales, sin gráficos
 * - Standard: 6-8 métricas + gráficos básicos
 * - Detailed (Advanced UI Mode): Todas las métricas + gráficos avanzados
 */
export function AdaptiveDashboard({ userProfile, stats, vertical }: AdaptiveDashboardProps) {
  const detailLevel = getDashboardDetailLevel(userProfile);

  // Métricas básicas (siempre visibles)
  const basicMetrics = [
    {
      id: 'buildings',
      label: 'Propiedades',
      value: stats.totalBuildings,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'tenants',
      label: 'Inquilinos',
      value: stats.totalTenants,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'contracts',
      label: 'Contratos Activos',
      value: stats.activeContracts,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'revenue',
      label: 'Ingresos Mensuales',
      value: `€${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  // Métricas estándar (visible en Standard y Advanced)
  const standardMetrics = [
    {
      id: 'occupancy',
      label: 'Tasa de Ocupación',
      value: `${stats.occupancyRate}%`,
      icon: CheckCircle2,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      id: 'units',
      label: 'Unidades Totales',
      value: stats.totalUnits,
      icon: Building2,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
  ];

  // Métricas avanzadas (solo en Advanced)
  const advancedMetrics = [
    {
      id: 'pending_payments',
      label: 'Pagos Pendientes',
      value: stats.pendingPayments,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      alert: stats.pendingPayments > 0,
    },
    {
      id: 'maintenance',
      label: 'Incidencias Abiertas',
      value: stats.maintenanceIssues,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      alert: stats.maintenanceIssues > 5,
    },
  ];

  // Determinar qué métricas mostrar
  let metricsToShow = [...basicMetrics];
  if (detailLevel === 'standard' || detailLevel === 'detailed') {
    metricsToShow = [...metricsToShow, ...standardMetrics];
  }
  if (detailLevel === 'detailed') {
    metricsToShow = [...metricsToShow, ...advancedMetrics];
  }

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {detailLevel === 'basic' && 'Vista simplificada de tus métricas principales'}
          {detailLevel === 'standard' && 'Resumen de tu negocio inmobiliario'}
          {detailLevel === 'detailed' && 'Panel completo de análisis y KPIs'}
        </p>
      </div>

      {/* Grid de Métricas */}
      <div
        className={cn(
          'grid gap-4',
          detailLevel === 'basic' && 'grid-cols-1 md:grid-cols-2',
          detailLevel === 'standard' && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          detailLevel === 'detailed' && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {metricsToShow.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.id}
              className={cn(
                'transition-all hover:shadow-md',
                (metric as any).alert && 'border-orange-300'
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <div className={cn('p-2 rounded-lg', metric.bgColor)}>
                  <Icon className={cn('h-4 w-4', metric.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {(metric as any).alert && (
                  <p className="text-xs text-orange-600 mt-2">⚠️ Requiere atención</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensaje de ayuda para principiantes */}
      {detailLevel === 'basic' && userProfile.experienceLevel === 'principiante' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">💡 ¿Primeros pasos?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>Este es tu dashboard simplificado. Aquí verás tus métricas más importantes.</p>
            <p className="text-muted-foreground">
              A medida que uses INMOVA, podrás activar más métricas y gráficos avanzados desde
              Configuración → Modo de Interfaz.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Acciones Rápidas (solo en modo Basic) */}
      {detailLevel === 'basic' && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Las tareas más comunes al alcance de un clic</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <button className="px-4 py-3 text-left border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium">➕ Nueva Propiedad</div>
              <div className="text-xs text-muted-foreground mt-1">
                Añade una propiedad a tu cartera
              </div>
            </button>
            <button className="px-4 py-3 text-left border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium">📝 Nuevo Contrato</div>
              <div className="text-xs text-muted-foreground mt-1">Crea un contrato de alquiler</div>
            </button>
            <button className="px-4 py-3 text-left border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium">👤 Añadir Inquilino</div>
              <div className="text-xs text-muted-foreground mt-1">Registra un nuevo inquilino</div>
            </button>
            <button className="px-4 py-3 text-left border rounded-lg hover:bg-accent transition-colors">
              <div className="font-medium">💰 Registrar Pago</div>
              <div className="text-xs text-muted-foreground mt-1">Añade un pago recibido</div>
            </button>
          </CardContent>
        </Card>
      )}

      {/* Placeholder para gráficos (Standard y Advanced) */}
      {(detailLevel === 'standard' || detailLevel === 'detailed') && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ingresos Mensuales</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Gráfico de ingresos</p>
                <p className="text-xs mt-1">(Por implementar)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ocupación</CardTitle>
              <CardDescription>Distribución actual</CardDescription>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Gráfico de ocupación</p>
                <p className="text-xs mt-1">(Por implementar)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Iconos placeholder para gráficos
function BarChart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function PieChart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
      />
    </svg>
  );
}
