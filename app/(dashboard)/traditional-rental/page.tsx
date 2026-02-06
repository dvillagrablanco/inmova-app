'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  TrendingUp,
  FileText,
  RefreshCw,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Euro,
  Home,
  Clock,
  Calendar,
  Percent,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface DashboardStats {
  totalPropiedades: number;
  propiedadesOcupadas: number;
  propiedadesDisponibles: number;
  tasaOcupacion: number;
  ingresosMensuales: number;
  ingresosProyectados: number;
  impagos: number;
  importeImpagos: number;
  contratosActivos: number;
  contratosProximosVencer: number;
  inquilinosActivos: number;
  rentaMediaMensual: number;
  duracionMediaContrato: number;
  rotacionAnual: number;
  morosidadPorcentaje: number;
  rentabilidadMedia: number;
}

export default function TraditionalRentalDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPropiedades: 0,
    propiedadesOcupadas: 0,
    propiedadesDisponibles: 0,
    tasaOcupacion: 0,
    ingresosMensuales: 0,
    ingresosProyectados: 0,
    impagos: 0,
    importeImpagos: 0,
    contratosActivos: 0,
    contratosProximosVencer: 0,
    inquilinosActivos: 0,
    rentaMediaMensual: 0,
    duracionMediaContrato: 0,
    rotacionAnual: 0,
    morosidadPorcentaje: 0,
    rentabilidadMedia: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [unitsRes, contractsRes, paymentsRes, tenantsRes] = await Promise.all([
          fetch('/api/units').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/contracts').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/payments').then((r) => (r.ok ? r.json() : [])),
          fetch('/api/tenants').then((r) => (r.ok ? r.json() : [])),
        ]);

        const units = Array.isArray(unitsRes) ? unitsRes : unitsRes.data || [];
        const contracts = Array.isArray(contractsRes) ? contractsRes : contractsRes.data || [];
        const payments = Array.isArray(paymentsRes) ? paymentsRes : paymentsRes.data || [];
        const tenants = Array.isArray(tenantsRes) ? tenantsRes : tenantsRes.data || [];

        // Calcular KPIs
        const activeContracts = contracts.filter((c: any) => c.estado?.toLowerCase() === 'activo');
        const occupiedUnits = units.filter((u: any) => u.estado?.toLowerCase() === 'ocupada').length;
        const availableUnits = units.filter((u: any) => u.estado?.toLowerCase() === 'disponible')
          .length;
        const totalUnits = units.length;
        const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

        const monthlyIncome = activeContracts.reduce(
          (acc: number, c: any) => acc + (Number(c.rentaMensual) || 0),
          0
        );

        const pendingPayments = payments.filter((p: any) => p.estado === 'pendiente');
        const overduePendingAmount = pendingPayments.reduce(
          (acc: number, p: any) => acc + (Number(p.monto) || 0),
          0
        );

        // Contratos próximos a vencer (30 días)
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const expiringContracts = activeContracts.filter((c: any) => {
          const endDate = new Date(c.fechaFin);
          return endDate >= now && endDate <= thirtyDaysFromNow;
        });

        // Renta media
        const avgRent = activeContracts.length > 0 ? monthlyIncome / activeContracts.length : 0;

        // Morosidad (pagos pendientes vs total esperado)
        const expectedPayments = payments.filter((p: any) => new Date(p.fechaVencimiento) <= now);
        const paidPayments = expectedPayments.filter((p: any) => p.estado === 'pagado');
        const morosidadRate =
          expectedPayments.length > 0
            ? ((expectedPayments.length - paidPayments.length) / expectedPayments.length) * 100
            : 0;

        setStats({
          totalPropiedades: totalUnits,
          propiedadesOcupadas: occupiedUnits,
          propiedadesDisponibles: availableUnits,
          tasaOcupacion: occupancyRate,
          ingresosMensuales: monthlyIncome,
          ingresosProyectados: monthlyIncome * 12,
          impagos: pendingPayments.length,
          importeImpagos: overduePendingAmount,
          contratosActivos: activeContracts.length,
          contratosProximosVencer: expiringContracts.length,
          inquilinosActivos: tenants.filter((t: any) => t.activo !== false).length,
          rentaMediaMensual: avgRent,
          duracionMediaContrato: 12, // Aproximado
          rotacionAnual: 15, // Aproximado (%)
          morosidadPorcentaje: morosidadRate,
          rentabilidadMedia: 5.2, // Aproximado (%)
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  // KPIs principales para alquiler larga/media estancia
  const kpis = [
    {
      title: 'Tasa de Ocupación',
      value: `${stats.tasaOcupacion.toFixed(1)}%`,
      subValue: `${stats.propiedadesOcupadas}/${stats.totalPropiedades} propiedades`,
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: stats.tasaOcupacion > 80 ? 'up' : 'down',
      trendValue: stats.tasaOcupacion > 80 ? '+5%' : '-3%',
    },
    {
      title: 'Ingresos Mensuales',
      value: formatCurrency(stats.ingresosMensuales),
      subValue: `Proyectado anual: ${formatCurrency(stats.ingresosProyectados)}`,
      icon: Euro,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up',
      trendValue: '+8.2%',
    },
    {
      title: 'Contratos Activos',
      value: stats.contratosActivos.toString(),
      subValue: `${stats.contratosProximosVencer} próximos a renovar`,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'neutral',
      trendValue: '',
    },
    {
      title: 'Renta Media',
      value: formatCurrency(stats.rentaMediaMensual),
      subValue: 'Por propiedad ocupada',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: 'up',
      trendValue: '+2.3%',
    },
    {
      title: 'Morosidad',
      value: `${stats.morosidadPorcentaje.toFixed(1)}%`,
      subValue:
        stats.impagos > 0
          ? `${stats.impagos} pagos pendientes (${formatCurrency(stats.importeImpagos)})`
          : 'Sin impagos',
      icon: AlertTriangle,
      color: stats.morosidadPorcentaje > 5 ? 'text-red-600' : 'text-green-600',
      bgColor: stats.morosidadPorcentaje > 5 ? 'bg-red-50' : 'bg-green-50',
      trend: stats.morosidadPorcentaje > 5 ? 'up' : 'down',
      trendValue: stats.morosidadPorcentaje > 5 ? '+1.2%' : '-0.5%',
    },
    {
      title: 'Inquilinos Activos',
      value: stats.inquilinosActivos.toString(),
      subValue: 'Total registrados',
      icon: Users,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      trend: 'up',
      trendValue: '+3',
    },
  ];

  // Acciones rápidas
  const quickActions = [
    { label: 'Nueva Propiedad', href: '/propiedades/nuevo', icon: Building2 },
    { label: 'Nuevo Inquilino', href: '/inquilinos/nuevo', icon: Users },
    { label: 'Nuevo Contrato', href: '/contratos/nuevo', icon: FileText },
    { label: 'Registrar Pago', href: '/pagos', icon: Euro },
  ];

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Alquiler Residencial
            </h1>
            <p className="text-gray-600">KPIs clave para alquiler de larga y media estancia</p>
          </div>
          <div className="flex gap-2">
            {quickActions.slice(0, 2).map((action) => (
              <Link key={action.href} href={action.href}>
                <Button variant="outline" size="sm" className="gap-2">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    {kpi.trend && kpi.trendValue && (
                      <Badge
                        variant={
                          kpi.trend === 'up' && kpi.title !== 'Morosidad'
                            ? 'default'
                            : kpi.trend === 'down' && kpi.title !== 'Morosidad'
                              ? 'destructive'
                              : kpi.trend === 'up' && kpi.title === 'Morosidad'
                                ? 'destructive'
                                : 'default'
                        }
                        className="flex items-center gap-1"
                      >
                        {kpi.trend === 'up' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {kpi.trendValue}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                    <p className={`text-2xl font-bold mt-1 ${kpi.color}`}>
                      {loading ? '...' : kpi.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{kpi.subValue}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Progress indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ocupación visual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Estado de Ocupación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Propiedades ocupadas</span>
                  <span className="text-sm text-gray-500">
                    {stats.propiedadesOcupadas}/{stats.totalPropiedades}
                  </span>
                </div>
                <Progress value={stats.tasaOcupacion} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium">Ocupadas</p>
                  <p className="text-xl font-bold text-green-700">{stats.propiedadesOcupadas}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-600 font-medium">Disponibles</p>
                  <p className="text-xl font-bold text-amber-700">{stats.propiedadesDisponibles}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contratos a renovar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-orange-600" />
                Contratos Próximos a Renovar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.contratosProximosVencer > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-orange-900">
                          {stats.contratosProximosVencer} contratos vencen en 30 días
                        </p>
                        <p className="text-xs text-orange-600">Requieren acción inmediata</p>
                      </div>
                    </div>
                    <Link href="/contratos?filter=expiring">
                      <Button size="sm" variant="outline">
                        Ver
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-500">
                    Gestiona las renovaciones con anticipación para mantener la ocupación
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Sin vencimientos próximos</p>
                    <p className="text-xs text-green-600">Todos los contratos están al día</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alertas y acciones rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Alertas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Alertas y Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.impagos > 0 && (
                <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">
                      {stats.impagos} pagos pendientes
                    </p>
                    <p className="text-xs text-red-600">
                      Importe total: {formatCurrency(stats.importeImpagos)}
                    </p>
                  </div>
                  <Link href="/pagos?filter=pending">
                    <Button size="sm" variant="outline">
                      Gestionar
                    </Button>
                  </Link>
                </div>
              )}
              {stats.contratosProximosVencer > 0 && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900">
                      {stats.contratosProximosVencer} renovaciones pendientes
                    </p>
                    <p className="text-xs text-yellow-600">Vencen en los próximos 30 días</p>
                  </div>
                  <Link href="/contratos?filter=expiring">
                    <Button size="sm" variant="outline">
                      Ver
                    </Button>
                  </Link>
                </div>
              )}
              {stats.propiedadesDisponibles > 0 && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Building2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      {stats.propiedadesDisponibles} propiedades disponibles
                    </p>
                    <p className="text-xs text-blue-600">Listas para nuevos inquilinos</p>
                  </div>
                  <Link href="/propiedades?filter=available">
                    <Button size="sm" variant="outline">
                      Ver
                    </Button>
                  </Link>
                </div>
              )}
              {stats.impagos === 0 && stats.contratosProximosVencer === 0 && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Todo al día</p>
                    <p className="text-xs text-green-600">No hay alertas pendientes</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full h-auto py-4 flex flex-col items-center gap-2 hover:bg-indigo-50 hover:border-indigo-200"
                    >
                      <action.icon className="h-5 w-5 text-indigo-600" />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
