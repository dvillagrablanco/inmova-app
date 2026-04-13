'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { KPICard } from '@/components/ui/kpi-card';
import {
  Building2,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Percent,
  Euro,
  ArrowRight,
  RefreshCw,
  Landmark,
  BarChart3,
  Home,
  FileText,
  CreditCard,
  Wrench,
} from 'lucide-react';
import Link from 'next/link';
import { PortfolioHealthBar } from '@/components/dashboard/PortfolioHealthBar';

interface ExecutiveDashboardData {
  patrimonio: {
    total: number;
    inmobiliario: number;
    inmobLibros: number;
    inmobMercado: number;
    inmobRevalorizacion: number;
    inmobRevalorizacionPct: number;
    financiero: number;
    pe: number;
  };
  operativo: {
    ingresosMensuales: number;
    gastosTotales: number;
    ingresosNetos: number;
    margenNeto: number;
    totalUnidades: number;
    totalEdificios: number;
    tasaOcupacion: number;
    tasaMorosidad: number;
  };
  alertas: {
    total: number;
    high: number;
    medium: number;
    low: number;
    topAlerts: Array<{
      id: string;
      type: string;
      priority: string;
      title: string;
      description: string;
    }>;
  };
}

export default function DashboardEjecutivoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExecutiveDashboardData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, foRes, alertsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/family-office/dashboard?view=consolidated'),
        fetch('/api/dashboard/alerts'),
      ]);

      const dashData = dashRes.ok ? await dashRes.json() : null;
      const foData = foRes.ok ? await foRes.json() : null;
      const alertsData = alertsRes.ok ? await alertsRes.json() : null;

      const fo = foData?.data || foData;

      setData({
        patrimonio: {
          total: fo?.patrimonio?.total || 0,
          inmobiliario: fo?.inmobiliario?.valor || 0,
          inmobLibros: fo?.inmobiliario?.valorLibros || 0,
          inmobMercado: fo?.inmobiliario?.valorMercado || 0,
          inmobRevalorizacion: fo?.inmobiliario?.revalorizacion || 0,
          inmobRevalorizacionPct: fo?.inmobiliario?.revalorizacionPct || 0,
          financiero: fo?.financiero?.valor || 0,
          pe: fo?.privateEquity?.valor || 0,
        },
        operativo: {
          ingresosMensuales: dashData?.kpis?.ingresosTotalesMensuales || 0,
          gastosTotales: dashData?.kpis?.gastosTotales || 0,
          ingresosNetos: dashData?.kpis?.ingresosNetos || 0,
          margenNeto: dashData?.kpis?.margenNeto || 0,
          totalUnidades: dashData?.kpis?.numeroPropiedades || 0,
          totalEdificios: dashData?.kpis?.totalEdificios || 0,
          tasaOcupacion: dashData?.kpis?.tasaOcupacionCore || dashData?.kpis?.tasaOcupacion || 0,
          tasaMorosidad: dashData?.kpis?.tasaMorosidad || 0,
        },
        alertas: {
          total: alertsData?.summary?.total || 0,
          high: alertsData?.summary?.high || 0,
          medium: alertsData?.summary?.medium || 0,
          low: alertsData?.summary?.low || 0,
          topAlerts: (alertsData?.alerts || []).slice(0, 5),
        },
      });
    } catch (error) {
      console.error('Error loading executive dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  const d = data;

  return (
    <AuthenticatedLayout maxWidth="7xl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vista Ejecutiva</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Resumen consolidado del grupo ·{' '}
              {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Patrimonio KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard title="Patrimonio Total" value={fmt(d?.patrimonio.total || 0)} icon={Wallet} />
          <KPICard
            title="Ingresos Netos/mes"
            value={fmt(d?.operativo.ingresosNetos || 0)}
            icon={TrendingUp}
            subtitle={`Margen ${d?.operativo.margenNeto?.toFixed(1) || 0}%`}
          />
          <KPICard
            title="Ocupación"
            value={`${d?.operativo.tasaOcupacion?.toFixed(1) || 0}`}
            suffix="%"
            icon={Percent}
            subtitle={`${d?.operativo.totalUnidades || 0} unidades · ${d?.operativo.totalEdificios || 0} edificios`}
          />
          <KPICard
            title="Alertas Activas"
            value={d?.alertas.total || 0}
            icon={AlertTriangle}
            subtitle={d?.alertas.high ? `${d.alertas.high} críticas` : 'Sin alertas críticas'}
          />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Asset Allocation */}
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribución Patrimonial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Inmobiliario — con desglose libros vs mercado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Inmobiliario</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">
                      {fmt(d?.patrimonio.inmobiliario || 0)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      (
                      {(
                        ((d?.patrimonio.inmobiliario || 0) / (d?.patrimonio.total || 1)) *
                        100
                      ).toFixed(0)}
                      %)
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{
                      width: `${Math.min(((d?.patrimonio.inmobiliario || 0) / (d?.patrimonio.total || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
                {/* Libros vs Mercado sub-detail */}
                <div className="grid grid-cols-2 gap-2 ml-6">
                  <div className="text-xs">
                    <span className="text-gray-400">Libros (escritura): </span>
                    <span className="font-medium">{fmt(d?.patrimonio.inmobLibros || 0)}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-400">Mercado (estimado): </span>
                    <span className="font-medium">{fmt(d?.patrimonio.inmobMercado || 0)}</span>
                  </div>
                </div>
                {(d?.patrimonio.inmobRevalorizacion || 0) !== 0 && (
                  <div className="ml-6 text-xs">
                    <span
                      className={
                        d!.patrimonio.inmobRevalorizacion >= 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      Revalorización: {d!.patrimonio.inmobRevalorizacion >= 0 ? '+' : ''}
                      {fmt(d!.patrimonio.inmobRevalorizacion)} (
                      {d!.patrimonio.inmobRevalorizacionPct >= 0 ? '+' : ''}
                      {d!.patrimonio.inmobRevalorizacionPct.toFixed(1)}%)
                    </span>
                  </div>
                )}
              </div>

              {/* Financiero + PE */}
              {[
                {
                  label: 'Financiero',
                  value: d?.patrimonio.financiero || 0,
                  color: 'bg-green-500',
                  icon: TrendingUp,
                },
                {
                  label: 'Private Equity',
                  value: d?.patrimonio.pe || 0,
                  color: 'bg-purple-500',
                  icon: Landmark,
                },
              ].map((item) => {
                const total = d?.patrimonio.total || 1;
                const pct = (item.value / total) * 100;
                return (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{fmt(item.value)}</span>
                        <span className="text-xs text-gray-400 ml-2">({pct.toFixed(0)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              <div className="pt-4 border-t dark:border-gray-800">
                <Link href="/family-office/dashboard">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Patrimonio 360° <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Alertas Urgentes */}
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas Urgentes
                </CardTitle>
                <div className="flex gap-1">
                  {(d?.alertas.high || 0) > 0 && (
                    <Badge className="bg-red-600 text-white">{d?.alertas.high} críticas</Badge>
                  )}
                  {(d?.alertas.medium || 0) > 0 && (
                    <Badge className="bg-amber-500 text-white">{d?.alertas.medium} medias</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {d?.alertas.topAlerts && d.alertas.topAlerts.length > 0 ? (
                <div className="space-y-3">
                  {d.alertas.topAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div
                        className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                          alert.priority === 'alto'
                            ? 'bg-red-500'
                            : alert.priority === 'medio'
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.title}</p>
                        <p className="text-xs text-gray-500 truncate">{alert.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {alert.type === 'payment'
                          ? 'Pago'
                          : alert.type === 'contract'
                            ? 'Contrato'
                            : alert.type === 'maintenance'
                              ? 'Mant.'
                              : 'Doc.'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Sin alertas activas</p>
                </div>
              )}

              <div className="pt-4">
                <Link href="/alertas">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todas las alertas <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Health */}
        <PortfolioHealthBar
          ok={Math.max(0, (d?.operativo.totalEdificios || 0) - 3)}
          warning={Math.min(2, d?.operativo.totalEdificios || 0)}
          critical={d?.operativo.tasaMorosidad && d.operativo.tasaMorosidad > 15 ? 1 : 0}
        />

        {/* Operations Summary */}
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader>
            <CardTitle>Resumen Operativo</CardTitle>
            <CardDescription>KPIs inmobiliarios consolidados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Euro className="h-3 w-3" /> Ingresos/mes{' '}
                  <span className="text-[10px] text-gray-400">(contractual)</span>
                </p>
                <p className="text-xl font-bold text-green-600">
                  {fmt(d?.operativo.ingresosMensuales || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Gastos/mes
                </p>
                <p className="text-xl font-bold text-red-500">
                  {fmt(d?.operativo.gastosTotales || 0)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Unidades
                </p>
                <p className="text-xl font-bold">{d?.operativo.totalUnidades || 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Morosidad
                </p>
                <p className="text-xl font-bold text-amber-600">
                  {d?.operativo.tasaMorosidad?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Propiedades',
              href: '/propiedades',
              icon: Home,
              desc: `${d?.operativo.totalUnidades || 0} unidades`,
            },
            { label: 'Pagos', href: '/pagos', icon: CreditCard, desc: 'Gestión de cobros' },
            { label: 'Contratos', href: '/contratos', icon: FileText, desc: 'Alquileres activos' },
            { label: 'Mantenimiento', href: '/mantenimiento', icon: Wrench, desc: 'Incidencias' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full dark:bg-gray-900 dark:border-gray-800">
                <CardContent className="pt-6 flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <item.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
