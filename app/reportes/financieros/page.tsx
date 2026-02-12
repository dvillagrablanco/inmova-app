'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Euro, TrendingUp, TrendingDown, Home, ArrowLeft, Download, Building2, ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';

interface ProfitLossData {
  periodo: string;
  ingresos: { total: number; categorias: Record<string, number> };
  gastos: { total: number; categorias: Record<string, number> };
  beneficioNeto: number;
  ebitda: number;
  margenes: { neto: number; operativo: number };
  isConsolidated?: boolean;
}

interface LatestPeriodData {
  periodo: string;
  ingresos: number;
  gastos: number;
  flujoNeto: number;
  totalMovimientos: number;
}

export default function ReportesFinancierosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [periodo, setPeriodo] = useState(() => format(new Date(), 'yyyy-MM'));
  const [profitLoss, setProfitLoss] = useState<ProfitLossData | null>(null);
  const [latestPeriod, setLatestPeriod] = useState<LatestPeriodData | null>(null);
  const [previousPL, setPreviousPL] = useState<ProfitLossData | null>(null);

  const loadData = useCallback(async (selectedPeriodo?: string) => {
    try {
      const p = selectedPeriodo || periodo;
      
      // Cargar P&G del periodo seleccionado
      const plRes = await fetch(`/api/accounting/profit-loss?periodo=${p}`);
      if (plRes.ok) {
        const data = await plRes.json();
        setProfitLoss(data.data);
      }

      // Cargar último periodo con datos
      const latestRes = await fetch('/api/accounting/latest-period');
      if (latestRes.ok) {
        const data = await latestRes.json();
        setLatestPeriod(data.data || null);

        // Auto-navegar al último periodo con datos si el actual está vacío
        if (data.data?.periodo && data.data.periodo !== p) {
          const autoRes = await fetch(`/api/accounting/profit-loss?periodo=${data.data.periodo}`);
          if (autoRes.ok) {
            const autoData = await autoRes.json();
            if (autoData.data?.ingresos?.total > 0 || autoData.data?.gastos?.total > 0) {
              if (!profitLoss?.ingresos?.total && !profitLoss?.gastos?.total) {
                setProfitLoss(autoData.data);
                setPeriodo(data.data.periodo);
              }
            }
          }
        }
      }

      // Cargar mes anterior para comparaciones
      const prevMonth = format(subMonths(new Date(p + '-01'), 1), 'yyyy-MM');
      const prevRes = await fetch(`/api/accounting/profit-loss?periodo=${prevMonth}`);
      if (prevRes.ok) {
        const prevData = await prevRes.json();
        setPreviousPL(prevData.data);
      }
    } catch (error) {
      console.error('Error cargando datos financieros:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periodo]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(periodo);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriodo(newPeriod);
    setLoading(true);
    loadData(newPeriod);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const ingresosChange = previousPL
    ? calcChange(profitLoss?.ingresos?.total || 0, previousPL.ingresos?.total || 0)
    : 0;
  const gastosChange = previousPL
    ? calcChange(profitLoss?.gastos?.total || 0, previousPL.gastos?.total || 0)
    : 0;

  // Generar lista de periodos disponibles (últimos 24 meses)
  const periodos = Array.from({ length: 24 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return format(d, 'yyyy-MM');
  });

  // Desglose por categoría de ingreso
  const ingresosCategorias = profitLoss?.ingresos?.categorias
    ? Object.entries(profitLoss.ingresos.categorias)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    : [];

  const gastosCategorias = profitLoss?.gastos?.categorias
    ? Object.entries(profitLoss.gastos.categorias)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
    : [];

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/finanzas')}>
            <ArrowLeft className="h-4 w-4 mr-2" />Finanzas
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/finanzas">Finanzas</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Reportes Financieros</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Euro className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Reportes Financieros</h1>
              <p className="text-muted-foreground">
                {profitLoss?.isConsolidated ? 'Vista consolidada (grupo)' : 'Analisis de ingresos, gastos y rentabilidad'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={periodo}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm"
            >
              {periodos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />Exportar
            </Button>
          </div>
        </div>

        {/* Banner: último periodo con datos */}
        {latestPeriod && latestPeriod.periodo !== periodo && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Ultimo periodo con datos contables: <strong>{latestPeriod.periodo}</strong> ({latestPeriod.totalMovimientos} movimientos)
                </p>
                <Button size="sm" variant="outline" onClick={() => handlePeriodChange(latestPeriod.periodo)}>
                  Ir a {latestPeriod.periodo}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs Principales */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}><CardContent className="pt-4"><Skeleton className="h-6 w-20 mb-2" /><Skeleton className="h-8 w-24" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" /> Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">{formatCurrency(profitLoss?.ingresos?.total || 0)}</div>
                {ingresosChange !== 0 && (
                  <p className={`text-xs flex items-center ${ingresosChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ingresosChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {ingresosChange.toFixed(1)}% vs mes anterior
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-600" /> Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">{formatCurrency(profitLoss?.gastos?.total || 0)}</div>
                {gastosChange !== 0 && (
                  <p className={`text-xs flex items-center ${gastosChange < 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {gastosChange < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                    {gastosChange.toFixed(1)}% vs mes anterior
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Wallet className="h-3 w-3" /> Beneficio Neto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${(profitLoss?.beneficioNeto || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(profitLoss?.beneficioNeto || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <BarChart3 className="h-3 w-3 text-purple-600" /> EBITDA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-purple-600">{formatCurrency(profitLoss?.ebitda || 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Margen Neto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-blue-600">
                  {((profitLoss?.margenes?.neto || 0) * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Periodo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{profitLoss?.periodo || periodo}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Desglose por categoría */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Ingresos por categoría */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Ingresos por Categoria
              </CardTitle>
              <CardDescription>Desglose de ingresos del periodo {profitLoss?.periodo || periodo}</CardDescription>
            </CardHeader>
            <CardContent>
              {ingresosCategorias.length > 0 ? (
                <div className="space-y-3">
                  {ingresosCategorias.map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span className="text-sm font-medium capitalize">
                        {cat.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-green-600">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin ingresos registrados en este periodo
                </p>
              )}
            </CardContent>
          </Card>

          {/* Gastos por categoría */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Gastos por Categoria
              </CardTitle>
              <CardDescription>Desglose de gastos del periodo {profitLoss?.periodo || periodo}</CardDescription>
            </CardHeader>
            <CardContent>
              {gastosCategorias.length > 0 ? (
                <div className="space-y-3">
                  {gastosCategorias.map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                      <span className="text-sm font-medium capitalize">
                        {cat.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-red-600">{formatCurrency(amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Sin gastos registrados en este periodo
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Accesos rapidos */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push('/contabilidad')}>
                <BarChart3 className="h-4 w-4 mr-2" />Dashboard Contable
              </Button>
              <Button variant="outline" onClick={() => router.push('/finanzas/conciliacion')}>
                <Euro className="h-4 w-4 mr-2" />Conciliacion Bancaria
              </Button>
              <Button variant="outline" onClick={() => router.push('/finanzas')}>
                <Building2 className="h-4 w-4 mr-2" />Centro Financiero
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
