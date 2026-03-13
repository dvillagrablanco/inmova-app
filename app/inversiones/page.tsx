'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  TrendingUp,
  Wallet,
  PiggyBank,
  Landmark,
  BarChart3,
  Receipt,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Euro,
  Percent,
  Home,
  Briefcase,
  BanknoteIcon,
  PieChart,
} from 'lucide-react';
import { toast } from 'sonner';

interface PortfolioData {
  totalAssets: number;
  totalInvestment: number;
  totalMarketValue: number;
  totalMortgageDebt: number;
  totalEquity: number;
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  totalMortgagePayments: number;
  monthlyCashFlow: number;
  grossYield: number;
  netYield: number;
  averageOccupancy: number;
  ltv: number;
  totalPrecioCompra: number;
  totalValorMercadoUnidades: number;
  revalorizacion: number;
  revalorizacionPct: number;
  // Patrimonio financiero
  totalTesoreria?: number;
  totalFinanciero?: number;
  totalCosteFinanciero?: number;
  pnlFinanciero?: number;
  totalPE?: number;
  totalCostePE?: number;
  totalCompromisosPE?: number;
  totalCapitalPendientePE?: number;
  patrimonioTotal?: number;
}

interface ConsolidatedData {
  companies: Array<{
    companyId: string;
    companyName: string;
    cif: string;
    portfolio: PortfolioData;
  }>;
  consolidated: PortfolioData;
}

export default function InversionesPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consolidated, setConsolidated] = useState<ConsolidatedData | null>(null);
  const [fiscal, setFiscal] = useState<any>(null);
  const [fiscalAlerts, setFiscalAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      const [consolidatedRes, fiscalRes, alertsRes] = await Promise.all([
        fetch('/api/investment/consolidated'),
        fetch(`/api/investment/fiscal?year=${new Date().getFullYear()}`),
        fetch('/api/investment/fiscal/alerts'),
      ]);

      if (consolidatedRes.ok) {
        const data = await consolidatedRes.json();
        setConsolidated(data.data);
      }
      if (fiscalRes.ok) {
        const data = await fiscalRes.json();
        setFiscal(data.data);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setFiscalAlerts(data.data || []);
      }
    } catch (error) {
      toast.error('Error cargando datos de inversion');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const p = consolidated?.consolidated || null;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n || 0);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio de Inversiones</h1>
            <p className="text-gray-500">
              Vista consolidada del grupo societario
              {consolidated &&
                consolidated.companies.length > 1 &&
                ` (${consolidated.companies.length} sociedades)`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/inversiones/activos')}>
              <Building2 className="h-4 w-4 mr-2" />
              Activos
            </Button>
            <Button variant="outline" onClick={() => router.push('/inversiones/hipotecas')}>
              <Landmark className="h-4 w-4 mr-2" />
              Hipotecas
            </Button>
          </div>
        </div>

        {/* Alertas fiscales */}
        {fiscalAlerts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-600" />
                Alertas Fiscales ({fiscalAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fiscalAlerts.slice(0, 5).map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        alert.urgencia === 'critica'
                          ? 'destructive'
                          : alert.urgencia === 'alta'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {alert.urgencia}
                    </Badge>
                    <span>{alert.titulo}</span>
                  </div>
                  <span className="text-muted-foreground text-xs">{alert.diasRestantes}d</span>
                </div>
              ))}
              {fiscalAlerts.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => router.push('/inversiones/fiscal/modelos')}
                >
                  Ver todas ({fiscalAlerts.length})
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* KPIs principales */}
        {p &&
          (() => {
            const hasFinancialData =
              (p.totalTesoreria || 0) > 0 || (p.totalFinanciero || 0) > 0 || (p.totalPE || 0) > 0;
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className={hasFinancialData ? 'border-2 border-blue-200' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      {hasFinancialData ? (
                        <PieChart className="h-4 w-4" />
                      ) : (
                        <Wallet className="h-4 w-4" />
                      )}
                      {hasFinancialData ? 'Patrimonio Total' : 'Patrimonio Neto'}
                    </div>
                    <div
                      className={`text-2xl font-bold ${hasFinancialData ? 'text-blue-700' : 'text-gray-900'}`}
                    >
                      {formatCurrency(
                        hasFinancialData ? p.patrimonioTotal || p.totalEquity : p.totalEquity
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {hasFinancialData
                        ? 'Inmobiliario + Financiero + PE + Tesorería'
                        : 'Valor mercado - Deuda hipotecaria'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Euro className="h-4 w-4" />
                      Cash-Flow Mensual
                    </div>
                    <div
                      className={`text-2xl font-bold ${p.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {formatCurrency(p.monthlyCashFlow)}
                    </div>
                    <div className="text-xs text-gray-400">Ingresos - Gastos - Hipotecas</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <TrendingUp className="h-4 w-4" />
                      Rentabilidad Neta
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{p.netYield}%</div>
                    <div className="text-xs text-gray-400">Bruta: {p.grossYield}%</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Percent className="h-4 w-4" />
                      Ocupación / LTV
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{p.averageOccupancy}%</div>
                    <div className="text-xs text-gray-400">LTV: {p.ltv}%</div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

        {/* Revalorización patrimonial */}
        {p && p.totalPrecioCompra > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Precio compra (escrituras)</div>
                <div className="text-lg font-bold">{formatCurrency(p.totalPrecioCompra)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Valor mercado estimado</div>
                <div className="text-lg font-bold text-blue-600">
                  {formatCurrency(p.totalValorMercadoUnidades)}
                </div>
              </CardContent>
            </Card>
            <Card className={p.revalorizacion >= 0 ? 'border-green-200' : 'border-red-200'}>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Revalorización</div>
                <div
                  className={`text-lg font-bold ${p.revalorizacion >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {p.revalorizacion >= 0 ? '+' : ''}
                  {formatCurrency(p.revalorizacion)}
                </div>
                <div
                  className={`text-xs ${p.revalorizacionPct >= 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {p.revalorizacionPct >= 0 ? '+' : ''}
                  {p.revalorizacionPct}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Renta mensual</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(p.totalMonthlyIncome)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatCurrency(p.totalMonthlyIncome * 12)}/ano
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-xs text-gray-500 mb-1">Yield s/compra</div>
                <div className="text-lg font-bold text-purple-600">
                  {p.totalPrecioCompra > 0
                    ? (((p.totalMonthlyIncome * 12) / p.totalPrecioCompra) * 100).toFixed(1)
                    : '0'}
                  %
                </div>
                <div className="text-xs text-gray-400">
                  PER{' '}
                  {p.totalMonthlyIncome > 0
                    ? (p.totalPrecioCompra / (p.totalMonthlyIncome * 12)).toFixed(1)
                    : 'N/A'}
                  x
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Desglose Patrimonial (si hay datos financieros/PE) */}
        {p &&
          ((p.totalTesoreria || 0) > 0 || (p.totalFinanciero || 0) > 0 || (p.totalPE || 0) > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-blue-600" />
                  Desglose Patrimonial
                </CardTitle>
                <CardDescription>
                  Patrimonio total del grupo: inmobiliario + financiero + PE + tesorería
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-1">
                      <Building2 className="h-3.5 w-3.5" />
                      Inmobiliario
                    </div>
                    <div className="text-lg font-bold text-blue-800">
                      {formatCurrency(p.totalEquity)}
                    </div>
                    <div className="text-[10px] text-blue-500">Valor mercado - Deuda</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-1.5 text-xs text-green-600 mb-1">
                      <BanknoteIcon className="h-3.5 w-3.5" />
                      Tesorería
                    </div>
                    <div className="text-lg font-bold text-green-800">
                      {formatCurrency(p.totalTesoreria || 0)}
                    </div>
                    <div className="text-[10px] text-green-500">Saldos bancarios</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-center gap-1.5 text-xs text-purple-600 mb-1">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Financiero
                    </div>
                    <div className="text-lg font-bold text-purple-800">
                      {formatCurrency(p.totalFinanciero || 0)}
                    </div>
                    <div
                      className={`text-[10px] ${(p.pnlFinanciero || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                    >
                      P&L: {(p.pnlFinanciero || 0) >= 0 ? '+' : ''}
                      {formatCurrency(p.pnlFinanciero || 0)}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 mb-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      Private Equity
                    </div>
                    <div className="text-lg font-bold text-amber-800">
                      {formatCurrency(p.totalPE || 0)}
                    </div>
                    <div className="text-[10px] text-amber-500">
                      {(p.totalCapitalPendientePE || 0) > 0
                        ? `Pendiente: ${formatCurrency(p.totalCapitalPendientePE || 0)}`
                        : `Coste: ${formatCurrency(p.totalCostePE || 0)}`}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1">
                      <PieChart className="h-3.5 w-3.5" />
                      TOTAL
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(p.patrimonioTotal || p.totalEquity)}
                    </div>
                    <div className="text-[10px] text-gray-500">Patrimonio neto total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        <Tabs defaultValue="consolidado" className="space-y-4">
          <TabsList>
            <TabsTrigger value="consolidado">Consolidado</TabsTrigger>
            <TabsTrigger value="sociedades">Por Sociedad</TabsTrigger>
            <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
          </TabsList>

          {/* Tab Consolidado */}
          <TabsContent value="consolidado">
            {p && (
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patrimonio</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Patrimonio inmobiliario */}
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Inmobiliario
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Inversión total</span>
                      <span className="font-medium">{formatCurrency(p.totalInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor de mercado</span>
                      <span className="font-medium">{formatCurrency(p.totalMarketValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Deuda hipotecaria</span>
                      <span className="font-medium text-red-600">
                        {p.totalMortgageDebt > 0
                          ? `-${formatCurrency(p.totalMortgageDebt)}`
                          : formatCurrency(0)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Neto inmobiliario</span>
                      <span className="text-green-600">{formatCurrency(p.totalEquity)}</span>
                    </div>

                    {/* Otros patrimonios */}
                    {((p.totalTesoreria || 0) > 0 ||
                      (p.totalFinanciero || 0) > 0 ||
                      (p.totalPE || 0) > 0) && (
                      <>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-3">
                          Financiero y PE
                        </div>
                        {(p.totalTesoreria || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tesorería (saldos bancarios)</span>
                            <span className="font-medium text-green-600">
                              +{formatCurrency(p.totalTesoreria || 0)}
                            </span>
                          </div>
                        )}
                        {(p.totalFinanciero || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Posiciones financieras</span>
                            <span className="font-medium text-purple-600">
                              +{formatCurrency(p.totalFinanciero || 0)}
                            </span>
                          </div>
                        )}
                        {(p.totalPE || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Private Equity / Participaciones</span>
                            <span className="font-medium text-amber-600">
                              +{formatCurrency(p.totalPE || 0)}
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-bold text-lg">
                          <span>PATRIMONIO TOTAL</span>
                          <span className="text-blue-700">
                            {formatCurrency(p.patrimonioTotal || p.totalEquity)}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cash-Flow Mensual</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3 text-green-500" /> Ingresos alquiler
                      </span>
                      <span className="font-medium text-green-600">
                        +{formatCurrency(p.totalMonthlyIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3 text-red-500" /> Gastos operativos
                      </span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(p.totalMonthlyExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Landmark className="h-3 w-3 text-orange-500" /> Cuotas hipotecas
                      </span>
                      <span className="font-medium text-orange-600">
                        {p.totalMortgagePayments > 0
                          ? `-${formatCurrency(p.totalMortgagePayments)}`
                          : formatCurrency(0)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold gap-2">
                      <span className="shrink-0">Cash-flow neto</span>
                      <span
                        className={`whitespace-nowrap ${p.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {formatCurrency(p.monthlyCashFlow)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab Por Sociedad */}
          <TabsContent value="sociedades">
            <div className="space-y-4">
              {consolidated?.companies.map((company) => (
                <Card key={company.companyId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{company.companyName}</CardTitle>
                        <CardDescription>{company.cif}</CardDescription>
                      </div>
                      <Badge variant="outline">{company.portfolio.totalAssets} activos</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Precio compra</span>
                        <div className="font-medium">
                          {formatCurrency(company.portfolio.totalPrecioCompra || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Valor mercado</span>
                        <div className="font-medium text-blue-600">
                          {formatCurrency(company.portfolio.totalValorMercadoUnidades || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Revalorización</span>
                        <div
                          className={`font-medium ${(company.portfolio.revalorizacion || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {(company.portfolio.revalorizacion || 0) >= 0 ? '+' : ''}
                          {formatCurrency(company.portfolio.revalorizacion || 0)}
                          <span className="text-xs ml-1">
                            ({(company.portfolio.revalorizacionPct || 0) >= 0 ? '+' : ''}
                            {company.portfolio.revalorizacionPct || 0}%)
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Renta mensual</span>
                        <div className="font-medium text-green-600">
                          {formatCurrency(company.portfolio.totalMonthlyIncome)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Yield s/compra</span>
                        <div className="font-medium text-purple-600">
                          {company.portfolio.totalPrecioCompra > 0
                            ? (
                                ((company.portfolio.totalMonthlyIncome * 12) /
                                  company.portfolio.totalPrecioCompra) *
                                100
                              ).toFixed(1)
                            : '0'}
                          %
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Ocupación</span>
                        <div className="font-medium">{company.portfolio.averageOccupancy}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!consolidated?.companies || consolidated.companies.length === 0) && (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No hay sociedades configuradas. Configura el grupo en Configuración &gt;
                    Empresas.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Tab Fiscal */}
          <TabsContent value="fiscal">
            {fiscal ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5" />
                    Simulacion IS {fiscal.year} - {fiscal.companyName}
                  </CardTitle>
                  <CardDescription>Impuesto de Sociedades (tipo general 25%)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ingresos brutos</span>
                    <span className="font-medium">{formatCurrency(fiscal.ingresosBrutos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">(-) Gastos deducibles</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(fiscal.gastosDeducibles)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">(-) Amortizaciones</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(fiscal.amortizaciones)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">(-) Intereses hipoteca</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(fiscal.interesesHipoteca)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Base imponible</span>
                    <span>{formatCurrency(fiscal.baseImponible)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Cuota IS (25%)</span>
                    <span className="text-red-600">{formatCurrency(fiscal.cuotaIS)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tipo efectivo</span>
                    <span>{fiscal.tipoEfectivo}%</span>
                  </div>

                  {fiscal.pagosFraccionados.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <h4 className="font-medium mb-2">Pagos fraccionados (Modelo 202)</h4>
                      <div className="space-y-1">
                        {fiscal.pagosFraccionados.map((pf: any) => (
                          <div key={pf.trimestre} className="flex justify-between text-sm">
                            <span className="text-gray-500">
                              {pf.trimestre === 1
                                ? 'Abril'
                                : pf.trimestre === 2
                                  ? 'Octubre'
                                  : 'Diciembre'}
                            </span>
                            <span>{formatCurrency(pf.importe)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  Registra activos y gastos para ver la simulacion fiscal.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
