'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useSelectedCompany } from '@/lib/hooks/admin/useSelectedCompany';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  ArrowRightLeft,
  Building,
  TrendingUp,
  Euro,
  FileText,
  Home,
  CreditCard,
  PiggyBank,
  Wallet,
  Receipt,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  LineChart,
  RefreshCw,
} from 'lucide-react';

interface FinanceModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
  statsKey?: string;
  statsLabel?: string;
  statsTrend?: 'up' | 'down' | 'neutral';
  available: boolean;
}

interface FinancialSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  pendingPayments: number;
  overduePayments: number;
  reconciliationRate: number;
}

interface ModuleStats {
  pendingReconciliation: number;
  bankConnections: number;
  pendingCollections: number;
  monthlyInvoices: number;
  accountingIntegrations: number;
  rentabilidad: string;
}

interface LatestPeriodSummary {
  periodo: string;
  ingresos: number;
  gastos: number;
  flujoNeto: number;
  totalMovimientos: number;
}

const financeModules: FinanceModule[] = [
  {
    id: 'conciliacion',
    title: 'Conciliacion Bancaria',
    description: 'Vincula movimientos bancarios con facturas y recibos automaticamente',
    icon: <ArrowRightLeft className="h-6 w-6" />,
    href: '/finanzas/conciliacion',
    badge: 'IA',
    statsKey: 'pendingReconciliation',
    statsLabel: 'Pendientes',
    statsTrend: 'down',
    available: true,
  },
  {
    id: 'open-banking',
    title: 'Open Banking',
    description: 'Conecta tus cuentas bancarias para sincronizacion automatica',
    icon: <Building className="h-6 w-6" />,
    href: '/open-banking',
    statsKey: 'bankConnections',
    statsLabel: 'Cuentas',
    available: true,
  },
  {
    id: 'cobros',
    title: 'Gestion de Cobros',
    description: 'Controla pagos de alquileres, cuotas y recibos pendientes',
    icon: <Euro className="h-6 w-6" />,
    href: '/pagos',
    statsKey: 'pendingCollections',
    statsLabel: 'Por cobrar',
    available: true,
  },
  {
    id: 'facturas',
    title: 'Facturacion',
    description: 'Emite y gestiona facturas, recibos y documentos fiscales',
    icon: <Receipt className="h-6 w-6" />,
    href: '/contabilidad',
    statsKey: 'monthlyInvoices',
    statsLabel: 'Este mes',
    statsTrend: 'up',
    available: true,
  },
  {
    id: 'contabilidad',
    title: 'Integraciones Contables',
    description: 'Conecta con Contasimple, Holded, a3ERP y mas herramientas contables',
    icon: <FileText className="h-6 w-6" />,
    href: '/contabilidad/integraciones',
    statsKey: 'accountingIntegrations',
    statsLabel: 'Conectadas',
    available: true,
  },
  {
    id: 'tesoreria',
    title: 'Tesoreria',
    description: 'Prevision de flujo de caja y gestion de liquidez',
    icon: <Wallet className="h-6 w-6" />,
    href: '/finanzas/tesoreria',
    badge: 'Proximamente',
    available: false,
  },
  {
    id: 'presupuestos',
    title: 'Presupuestos',
    description: 'Crea y controla presupuestos anuales por propiedad',
    icon: <PiggyBank className="h-6 w-6" />,
    href: '/finanzas/presupuestos',
    badge: 'Proximamente',
    available: false,
  },
  {
    id: 'informes',
    title: 'Informes Financieros',
    description: 'Reportes de rentabilidad, P&L y balance por propiedad',
    icon: <BarChart3 className="h-6 w-6" />,
    href: '/analytics',
    statsKey: 'rentabilidad',
    statsLabel: 'Rentabilidad',
    statsTrend: 'up',
    available: true,
  },
];

function SummarySkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-6 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function FinanzasPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const { selectedCompany } = useSelectedCompany();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    pendingPayments: 0,
    overduePayments: 0,
    reconciliationRate: 0,
  });
  const [moduleStats, setModuleStats] = useState<ModuleStats>({
    pendingReconciliation: 0,
    bankConnections: 0,
    pendingCollections: 0,
    monthlyInvoices: 0,
    accountingIntegrations: 0,
    rentabilidad: '0',
  });
  const [latestPeriod, setLatestPeriod] = useState<LatestPeriodSummary | null>(null);
  const [meta, setMeta] = useState<any>(null);

  const fetchFinancialData = async () => {
    try {
      // Pasar companyId explícitamente si hay empresa seleccionada
      const params = new URLSearchParams();
      if (selectedCompany?.id) {
        params.set('companyId', selectedCompany.id);
      }
      const url = params.toString() 
        ? `/api/finanzas/summary?${params.toString()}` 
        : '/api/finanzas/summary';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFinancialSummary(data.summary || financialSummary);
        setModuleStats(data.moduleStats || moduleStats);
        setLatestPeriod(data.latestPeriod || null);
        setMeta(data.meta || null);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchFinancialData();
    }
  }, [status, selectedCompany?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFinancialData();
  };

  const getModuleStatValue = (statsKey: string | undefined): string => {
    if (!statsKey) return '';
    const value = moduleStats[statsKey as keyof ModuleStats];
    if (statsKey === 'pendingCollections') {
      return `€${Number(value).toLocaleString('es-ES')}`;
    }
    if (statsKey === 'rentabilidad') {
      return `${value}%`;
    }
    return String(value);
  };

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          Cargando...
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Finanzas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Centro Financiero</h1>
              <p className="text-muted-foreground">
                Control completo de tus finanzas inmobiliarias
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button variant="outline" onClick={() => router.push('/open-banking')}>
              <Building className="h-4 w-4 mr-2" />
              Conectar Banco
            </Button>
            <Button onClick={() => router.push('/finanzas/conciliacion')}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Conciliar
            </Button>
          </div>
        </div>

        {/* Periodo mostrado */}
        {!loading && latestPeriod && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Periodo: <strong>{latestPeriod.periodo}</strong></span>
            {!latestPeriod.isCurrentMonth && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                Ultimo periodo con datos
              </Badge>
            )}
            {meta?.dataSource && (
              <Badge variant="secondary">
                Fuente: {meta.dataSource === 'contabilidad' ? 'Contabilidad' : meta.dataSource === 'banco' ? 'Banco' : meta.dataSource === 'pagos' ? 'Pagos' : 'Sin datos'}
              </Badge>
            )}
            {meta?.totalAccountingRecords > 0 && (
              <span className="text-xs">{meta.totalAccountingRecords.toLocaleString('es-ES')} registros contables</span>
            )}
            {meta?.totalBankRecords > 0 && (
              <span className="text-xs">{meta.totalBankRecords.toLocaleString('es-ES')} mov. bancarios</span>
            )}
          </div>
        )}

        {/* Resumen financiero */}
        {loading ? (
          <SummarySkeleton />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-xs">Saldo Periodo</span>
                </div>
                <p className="text-xl font-bold">
                  {financialSummary.totalBalance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Ingresos</span>
                </div>
                <p className="text-xl font-bold text-green-600">
                  +{financialSummary.monthlyIncome.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-600 mb-1">
                  <LineChart className="h-4 w-4" />
                  <span className="text-xs">Gastos</span>
                </div>
                <p className="text-xl font-bold text-red-600">
                  -{financialSummary.monthlyExpenses.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-amber-600 mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Por Cobrar</span>
                </div>
                <p className="text-xl font-bold text-amber-600">
                  {financialSummary.pendingPayments.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-500 mb-1">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">Vencidos</span>
                </div>
                <p className="text-xl font-bold text-red-500">
                  {financialSummary.overduePayments.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">Conciliacion</span>
                </div>
                <p className="text-xl font-bold">
                  {financialSummary.reconciliationRate}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modulos financieros */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Modulos Financieros</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {financeModules.map((module) => (
              <Card 
                key={module.id} 
                className={`hover:shadow-md transition-all cursor-pointer ${!module.available ? 'opacity-60' : ''}`}
                onClick={() => module.available && router.push(module.href)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      module.available 
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {module.icon}
                    </div>
                    {module.badge && (
                      <Badge variant={module.badge === 'IA' ? 'default' : 'secondary'} className={module.badge === 'IA' ? 'bg-purple-500' : ''}>
                        {module.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {module.statsKey && module.available && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">{module.statsLabel}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{getModuleStatValue(module.statsKey)}</span>
                        {module.statsTrend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                        {module.statsTrend === 'down' && <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />}
                      </div>
                    </div>
                  )}
                  {module.available && (
                    <Button variant="ghost" className="w-full mt-2 justify-between" size="sm">
                      Acceder
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Accesos rapidos */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rapidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => router.push('/finanzas/conciliacion')}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Conciliar movimientos
              </Button>
              <Button variant="outline" onClick={() => router.push('/contabilidad')}>
                <FileText className="h-4 w-4 mr-2" />
                Ver contabilidad
              </Button>
              <Button variant="outline" onClick={() => router.push('/pagos')}>
                <Euro className="h-4 w-4 mr-2" />
                Registrar cobro
              </Button>
              <Button variant="outline" onClick={() => router.push('/open-banking')}>
                <Building className="h-4 w-4 mr-2" />
                Ver cuentas bancarias
              </Button>
              <Button variant="outline" onClick={() => router.push('/contabilidad/integraciones')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Integraciones contables
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
