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
      const [consolidatedRes, fiscalRes] = await Promise.all([
        fetch('/api/investment/consolidated'),
        fetch(`/api/investment/fiscal?year=${new Date().getFullYear()}`),
      ]);

      if (consolidatedRes.ok) {
        const data = await consolidatedRes.json();
        setConsolidated(data.data);
      }
      if (fiscalRes.ok) {
        const data = await fiscalRes.json();
        setFiscal(data.data);
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

  const p = consolidated?.consolidated;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio de Inversiones</h1>
            <p className="text-gray-500">
              Vista consolidada del grupo societario
              {consolidated && consolidated.companies.length > 1 &&
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

        {/* KPIs principales */}
        {p && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Wallet className="h-4 w-4" />
                  Patrimonio Neto
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(p.totalEquity)}</div>
                <div className="text-xs text-gray-400">
                  Valor mercado - Deuda hipotecaria
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Euro className="h-4 w-4" />
                  Cash-Flow Mensual
                </div>
                <div className={`text-2xl font-bold ${p.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(p.monthlyCashFlow)}
                </div>
                <div className="text-xs text-gray-400">
                  Ingresos - Gastos - Hipotecas
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <TrendingUp className="h-4 w-4" />
                  Rentabilidad Neta
                </div>
                <div className="text-2xl font-bold text-blue-600">{p.netYield}%</div>
                <div className="text-xs text-gray-400">
                  Bruta: {p.grossYield}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Percent className="h-4 w-4" />
                  Ocupacion / LTV
                </div>
                <div className="text-2xl font-bold text-gray-900">{p.averageOccupancy}%</div>
                <div className="text-xs text-gray-400">
                  LTV: {p.ltv}%
                </div>
              </CardContent>
            </Card>
          </div>
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
                    <div className="flex justify-between">
                      <span className="text-gray-500">Inversion total</span>
                      <span className="font-medium">{formatCurrency(p.totalInvestment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Valor de mercado</span>
                      <span className="font-medium">{formatCurrency(p.totalMarketValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Deuda hipotecaria</span>
                      <span className="font-medium text-red-600">-{formatCurrency(p.totalMortgageDebt)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Patrimonio neto</span>
                      <span className="text-green-600">{formatCurrency(p.totalEquity)}</span>
                    </div>
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
                      <span className="font-medium text-green-600">+{formatCurrency(p.totalMonthlyIncome)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3 text-red-500" /> Gastos operativos
                      </span>
                      <span className="font-medium text-red-600">-{formatCurrency(p.totalMonthlyExpenses)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 flex items-center gap-1">
                        <Landmark className="h-3 w-3 text-orange-500" /> Cuotas hipotecas
                      </span>
                      <span className="font-medium text-orange-600">-{formatCurrency(p.totalMortgagePayments)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Cash-flow neto</span>
                      <span className={p.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Patrimonio neto</span>
                        <div className="font-medium">{formatCurrency(company.portfolio.totalEquity)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Cash-flow mensual</span>
                        <div className={`font-medium ${company.portfolio.monthlyCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(company.portfolio.monthlyCashFlow)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Rentabilidad neta</span>
                        <div className="font-medium">{company.portfolio.netYield}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Ocupacion</span>
                        <div className="font-medium">{company.portfolio.averageOccupancy}%</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!consolidated?.companies || consolidated.companies.length === 0) && (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    No hay sociedades configuradas. Configura el grupo en Configuracion &gt; Empresas.
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
                    <span className="font-medium text-red-600">-{formatCurrency(fiscal.gastosDeducibles)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">(-) Amortizaciones</span>
                    <span className="font-medium text-red-600">-{formatCurrency(fiscal.amortizaciones)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">(-) Intereses hipoteca</span>
                    <span className="font-medium text-red-600">-{formatCurrency(fiscal.interesesHipoteca)}</span>
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
                              {pf.trimestre === 1 ? 'Abril' : pf.trimestre === 2 ? 'Octubre' : 'Diciembre'}
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
