'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Calendar,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Euro,
  Percent,
  ArrowUpRight,
  Plus,
  CalendarDays,
  Home,
  UserCheck,
  FileSignature,
  BarChart3,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

// ==========================================
// TIPOS
// ==========================================

interface KPIData {
  occupancyRate: number;
  averageStayDuration: number;
  totalRevenue: number;
  averageRent: number;
  activeContracts: number;
  expiringContracts: number;
  renewalRate: number;
  collectionRate: number;
  revenueChange: number;
  occupancyChange: number;
}

interface ContractSummary {
  id: string;
  propertyAddress: string;
  tenantName: string;
  status: string;
  startDate: string;
  endDate: string;
  rent: number;
  daysRemaining: number;
}

// ==========================================
// COMPONENTES
// ==========================================

function KPICard({
  title,
  value,
  change,
  icon: Icon,
  format = 'number',
  trend = 'neutral',
}: {
  title: string;
  value: number;
  change?: number;
  icon: any;
  format?: 'number' | 'currency' | 'percent' | 'months';
  trend?: 'up' | 'down' | 'neutral';
}) {
  const formatValue = (v: number) => {
    switch (format) {
      case 'currency':
        return `${v.toLocaleString('es-ES')}€`;
      case 'percent':
        return `${v}%`;
      case 'months':
        return `${v} meses`;
      default:
        return v.toLocaleString('es-ES');
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{formatValue(value)}</p>
            {change !== undefined && (
              <div
                className={`flex items-center mt-1 text-sm ${
                  change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {change > 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : change < 0 ? (
                  <TrendingDown className="h-4 w-4 mr-1" />
                ) : null}
                <span>
                  {change > 0 ? '+' : ''}
                  {change}% vs. año anterior
                </span>
              </div>
            )}
          </div>
          <div
            className={`p-3 rounded-full ${
              trend === 'up' ? 'bg-green-100' : trend === 'down' ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            <Icon
              className={`h-6 w-6 ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                    ? 'text-red-600'
                    : 'text-blue-600'
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: 'Nuevo Contrato',
      href: '/contratos/media-estancia/nuevo',
      color: 'bg-blue-500',
    },
    {
      icon: CalendarDays,
      label: 'Calendario',
      href: '/media-estancia/calendario',
      color: 'bg-purple-500',
    },
    {
      icon: UserCheck,
      label: 'Scoring IA',
      href: '/media-estancia/scoring',
      color: 'bg-emerald-500',
    },
    {
      icon: FileSignature,
      label: 'Firmas Pendientes',
      href: '/firma-digital',
      color: 'bg-orange-500',
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      href: '/media-estancia/analytics',
      color: 'bg-indigo-500',
    },
    {
      icon: Settings,
      label: 'Configuración',
      href: '/media-estancia/configuracion',
      color: 'bg-gray-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-sm">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContractsList({ contracts }: { contracts: ContractSummary[] }) {
  const getStatusBadge = (status: string, daysRemaining: number) => {
    if (daysRemaining <= 7) {
      return <Badge variant="destructive">Vence en {daysRemaining}d</Badge>;
    } else if (daysRemaining <= 30) {
      return (
        <Badge variant="outline" className="bg-orange-100 text-orange-800">
          Vence en {daysRemaining}d
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Activo
        </Badge>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Contratos Activos</CardTitle>
          <CardDescription>Contratos de media estancia en curso</CardDescription>
        </div>
        <Link href="/media-estancia/contratos">
          <Button variant="outline" size="sm">
            Ver todos
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Home className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{contract.propertyAddress}</p>
                  <p className="text-sm text-muted-foreground">{contract.tenantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">{contract.rent}€/mes</p>
                  <p className="text-sm text-muted-foreground">
                    {contract.startDate} - {contract.endDate}
                  </p>
                </div>
                {getStatusBadge(contract.status, contract.daysRemaining)}
              </div>
            </div>
          ))}

          {contracts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay contratos activos</p>
              <Link href="/media-estancia/contratos/nuevo">
                <Button variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primer contrato
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPanel({
  alerts,
}: {
  alerts: Array<{ type: string; message: string; action: string }>;
}) {
  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'info':
        return <Clock className="h-5 w-5" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Alertas y Pendientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Sin alertas pendientes</p>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${getAlertStyle(alert.type)}`}
              >
                <div className="flex items-center gap-3">
                  {getAlertIcon(alert.type)}
                  <span className="text-sm font-medium">{alert.message}</span>
                </div>
                <Button variant="ghost" size="sm">
                  {alert.action}
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OccupancyChart({
  monthlyData,
}: {
  monthlyData: Array<{ month: string; occupancy: number }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ocupación Mensual</CardTitle>
        <CardDescription>Tasa de ocupación últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        {monthlyData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Sin datos de ocupación disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center gap-4">
                <span className="w-10 text-sm font-medium">{data.month}</span>
                <Progress value={data.occupancy} className="flex-1" />
                <span className="w-12 text-sm text-right">{data.occupancy}%</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

const DEFAULT_KPIS: KPIData = {
  occupancyRate: 0,
  averageStayDuration: 0,
  totalRevenue: 0,
  averageRent: 0,
  activeContracts: 0,
  expiringContracts: 0,
  renewalRate: 0,
  collectionRate: 0,
  revenueChange: 0,
  occupancyChange: 0,
};

export default function MediaEstanciaPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIData>(DEFAULT_KPIS);
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [alerts, setAlerts] = useState<Array<{ type: string; message: string; action: string }>>(
    []
  );
  const [monthlyOccupancy, setMonthlyOccupancy] = useState<
    Array<{ month: string; occupancy: number }>
  >([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [contractsRes, paymentsRes] = await Promise.all([
          fetch('/api/contracts/medium-term?limit=10'),
          fetch('/api/payments'),
        ]);

        const contractsData = contractsRes.ok ? await contractsRes.json() : null;
        const paymentsData = paymentsRes.ok ? await paymentsRes.json() : null;

        const stats = contractsData?.estadisticas;
        const contractsList = contractsData?.data ?? [];
        const payments = Array.isArray(paymentsData) ? paymentsData : (paymentsData?.data ?? []);

        const mediaEstanciaPayments = payments.filter(
          (p: { contract?: { tipoArrendamiento?: string } }) =>
            p.contract?.tipoArrendamiento === 'temporada'
        );
        const paidCount = mediaEstanciaPayments.filter(
          (p: { estado?: string }) => p.estado === 'PAGADO'
        ).length;
        const collectionRate =
          mediaEstanciaPayments.length > 0
            ? Math.round((paidCount / mediaEstanciaPayments.length) * 100)
            : 0;

        const now = new Date();
        const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        let expiringCount = 0;
        const formattedContracts: ContractSummary[] = contractsList.map(
          (c: {
            id: string;
            unit?: { building?: { direccion?: string } };
            tenant?: { nombreCompleto?: string };
            estado?: string;
            fechaInicio?: string;
            fechaFin?: string;
            rentaMensual?: number;
          }) => {
            const endDate = c.fechaFin ? new Date(c.fechaFin) : null;
            const daysRemaining = endDate
              ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
              : 0;
            if (endDate && endDate <= in30Days && c.estado === 'activo') expiringCount++;
            return {
              id: c.id,
              propertyAddress: c.unit?.building?.direccion ?? 'Sin dirección',
              tenantName: c.tenant?.nombreCompleto ?? 'Sin inquilino',
              status: c.estado ?? 'activo',
              startDate: c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString('es-ES') : '-',
              endDate: c.fechaFin ? new Date(c.fechaFin).toLocaleDateString('es-ES') : '-',
              rent: Number(c.rentaMensual ?? 0),
              daysRemaining,
            };
          }
        );

        setKpis({
          occupancyRate: 0,
          averageStayDuration: stats?.duracionPromedio ?? 0,
          totalRevenue: (stats?.ingresosMensualesEstimados ?? 0) * 12,
          averageRent:
            (stats?.contratosActivos ?? 0) > 0
              ? Math.round((stats?.ingresosMensualesEstimados ?? 0) / stats.contratosActivos)
              : 0,
          activeContracts: stats?.contratosActivos ?? 0,
          expiringContracts: expiringCount,
          renewalRate: 0,
          collectionRate,
          revenueChange: 0,
          occupancyChange: 0,
        });
        setContracts(formattedContracts);
        setAlerts([]);
        setMonthlyOccupancy([]);
      } catch {
        setKpis(DEFAULT_KPIS);
        setContracts([]);
        setAlerts([]);
        setMonthlyOccupancy([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Media Estancia</h1>
          <p className="text-muted-foreground">Gestión de alquileres temporales (1-11 meses)</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Estancia</h1>
          <p className="text-muted-foreground">Gestión de alquileres temporales (1-11 meses)</p>
        </div>
        <div className="flex gap-3">
          <Link href="/media-estancia/contratos/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contrato
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tasa de Ocupación"
          value={kpis.occupancyRate}
          change={kpis.occupancyChange}
          icon={Building2}
          format="percent"
          trend="up"
        />
        <KPICard
          title="Ingresos (Año)"
          value={kpis.totalRevenue}
          change={kpis.revenueChange}
          icon={Euro}
          format="currency"
          trend="up"
        />
        <KPICard title="Contratos Activos" value={kpis.activeContracts} icon={FileText} />
        <KPICard
          title="Tasa de Cobro"
          value={kpis.collectionRate}
          icon={CreditCard}
          format="percent"
          trend="up"
        />
      </div>

      {/* Segunda fila de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Estancia Media"
          value={kpis.averageStayDuration}
          icon={Calendar}
          format="months"
        />
        <KPICard title="Renta Media" value={kpis.averageRent} icon={Euro} format="currency" />
        <KPICard
          title="Tasa de Renovación"
          value={kpis.renewalRate}
          icon={Percent}
          format="percent"
        />
        <KPICard
          title="Próximos a Vencer"
          value={kpis.expiringContracts}
          icon={AlertTriangle}
          trend={kpis.expiringContracts > 2 ? 'down' : 'neutral'}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          <ContractsList contracts={contracts} />
          <OccupancyChart monthlyData={monthlyOccupancy} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <QuickActions />
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}
