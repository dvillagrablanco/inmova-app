'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, Euro, Landmark, Minus, Home, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface PeriodData {
  label: string;
  description: string;
  months: number;
  ingresos: number;
  gastos: number;
  noi: number;
  amortizaciones: number;
  hipotecas: number;
  impuestos: number;
  beneficioNeto: number;
  cashFlow: number;
}

export default function PYLConsolidadoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Record<string, PeriodData>>({});
  const [activeTab, setActiveTab] = useState('ytd');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/investment/pyl');
      if (res.ok) {
        const data = await res.json();
        setPeriods(data.periods || {});
      }
    } catch { toast.error('Error cargando P&L'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const pctOf = (n: number, total: number) => total > 0 ? Math.round(n / total * 100) : 0;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const renderPYL = (period: PeriodData | undefined) => {
    if (!period) return <div className="text-center text-gray-500 py-8">Sin datos para este periodo.</div>;

    const margenNOI = pctOf(period.noi, period.ingresos);
    const margenNeto = pctOf(period.beneficioNeto, period.ingresos);

    return (
      <div className="space-y-2 max-w-2xl">
        {/* Ingresos */}
        <div className="flex justify-between items-center py-2.5">
          <span className="flex items-center gap-2 text-gray-700">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            Ingresos por alquiler
          </span>
          <span className="font-medium text-green-600">+{fmt(period.ingresos)}</span>
        </div>

        {/* Gastos operativos */}
        <div className="flex justify-between items-center py-2.5">
          <span className="flex items-center gap-2 text-gray-700">
            <ArrowDownRight className="h-4 w-4 text-red-500" />
            Gastos operativos (IBI, comunidad, seguros, mantenim.)
          </span>
          <span className="font-medium text-red-600">-{fmt(period.gastos)}</span>
        </div>

        <div className="flex justify-between items-center py-2.5 border-t font-bold">
          <span>NOI (Net Operating Income)</span>
          <div className="text-right">
            <span className={period.noi >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(period.noi)}</span>
            <span className="text-xs text-gray-400 ml-2">({margenNOI}%)</span>
          </div>
        </div>

        {/* Amortizaciones */}
        <div className="flex justify-between items-center py-2.5">
          <span className="flex items-center gap-2 text-gray-500">
            <Minus className="h-4 w-4" />
            Amortizaciones (3% construcción)
          </span>
          <span className="text-orange-600">-{fmt(period.amortizaciones)}</span>
        </div>

        {/* EBITDA */}
        <div className="flex justify-between items-center py-2.5 border-t font-bold">
          <span>EBITDA</span>
          <span className={(period.noi - period.amortizaciones) >= 0 ? 'text-green-600' : 'text-red-600'}>
            {fmt(period.noi - period.amortizaciones)}
          </span>
        </div>

        {/* Gastos financieros */}
        <div className="flex justify-between items-center py-2.5">
          <span className="flex items-center gap-2 text-gray-500">
            <Landmark className="h-4 w-4" />
            Cuotas hipotecarias (capital + intereses)
          </span>
          <span className="text-red-600">-{fmt(period.hipotecas)}</span>
        </div>

        {/* Impuestos */}
        <div className="flex justify-between items-center py-2.5">
          <span className="flex items-center gap-2 text-gray-500">
            <Euro className="h-4 w-4" />
            Impuesto de Sociedades (25%)
          </span>
          <span className="text-red-600">-{fmt(period.impuestos)}</span>
        </div>

        <div className="flex justify-between items-center py-3 border-t-2 border-gray-900 font-bold text-lg">
          <span>Beneficio Neto</span>
          <div className="text-right">
            <span className={period.beneficioNeto >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(period.beneficioNeto)}</span>
            <span className="text-xs text-gray-400 ml-2">({margenNeto}%)</span>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t mt-4">
          <div className="text-center">
            <div className="text-xs text-gray-500">Margen NOI</div>
            <div className="font-bold text-sm">{margenNOI}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Margen neto</div>
            <div className="font-bold text-sm">{margenNeto}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Cash-flow</div>
            <div className="font-bold text-sm">{fmt(period.cashFlow)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Meses</div>
            <div className="font-bold text-sm">{period.months}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-3.5 w-3.5" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>P&L</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuenta de Resultados</h1>
          <p className="text-gray-500">P&L consolidado del grupo</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="ytd" className="text-xs sm:text-sm">
              <Calendar className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              YTD
            </TabsTrigger>
            <TabsTrigger value="tam" className="text-xs sm:text-sm">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              TAM (12M)
            </TabsTrigger>
            <TabsTrigger value="anual" className="text-xs sm:text-sm">
              <Euro className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />
              Año {new Date().getFullYear() - 1}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ytd">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  P&L — Year to Date
                  <Badge variant="outline" className="text-xs">{periods.ytd?.description || ''}</Badge>
                </CardTitle>
                <CardDescription>Desde el 1 de enero hasta hoy</CardDescription>
              </CardHeader>
              <CardContent>{renderPYL(periods.ytd)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tam">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  P&L — Trailing 12 Months (TAM)
                  <Badge variant="outline" className="text-xs">{periods.tam?.description || ''}</Badge>
                </CardTitle>
                <CardDescription>Últimos 12 meses móviles</CardDescription>
              </CardHeader>
              <CardContent>{renderPYL(periods.tam)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anual">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  P&L — Año Natural {new Date().getFullYear() - 1}
                  <Badge variant="outline" className="text-xs">{periods.anual?.description || ''}</Badge>
                </CardTitle>
                <CardDescription>Año completo cerrado</CardDescription>
              </CardHeader>
              <CardContent>{renderPYL(periods.anual)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
