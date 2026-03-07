'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { ArrowUpRight, ArrowDownRight, Home, Minus, TrendingUp, Building2, Landmark, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface CashFlowPeriod {
  label: string;
  months: number;
  operativo: { cobrosAlquiler: number; cobrosCount: number; gastosOperativos: number; gastosCount: number; flujoOperativo: number };
  inversion: { comprasActivos: number; comprasCount: number; flujoInversion: number };
  financiacion: { cuotasHipotecas: number; flujoFinanciacion: number };
  variacionNeta: number;
  flujoOperativoMensual: number;
}

export default function CashFlowPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Record<string, CashFlowPeriod>>({});

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      fetch('/api/investment/cashflow').then(r => r.ok ? r.json() : null).then(data => {
        if (data?.periods) setPeriods(data.periods);
      }).catch(() => toast.error('Error cargando cash-flow')).finally(() => setLoading(false));
    }
  }, [status, router]);

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const renderCF = (cf: CashFlowPeriod | undefined) => {
    if (!cf) return <div className="text-center text-gray-500 py-8">Sin datos.</div>;
    return (
      <div className="space-y-1 max-w-2xl">
        {/* OPERATIVO */}
        <div className="bg-blue-50/50 rounded-lg p-3 space-y-2">
          <h4 className="font-semibold text-sm text-blue-800 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Flujo Operativo</h4>
          <div className="flex justify-between py-1.5">
            <span className="flex items-center gap-2 text-sm"><ArrowUpRight className="h-3.5 w-3.5 text-green-500" /> Cobros alquiler ({cf.operativo.cobrosCount})</span>
            <span className="font-medium text-green-600">+{fmt(cf.operativo.cobrosAlquiler)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="flex items-center gap-2 text-sm"><ArrowDownRight className="h-3.5 w-3.5 text-red-500" /> Gastos operativos ({cf.operativo.gastosCount})</span>
            <span className="font-medium text-red-600">-{fmt(cf.operativo.gastosOperativos)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-blue-200 font-bold">
            <span>= Flujo Operativo</span>
            <span className={cf.operativo.flujoOperativo >= 0 ? 'text-green-700' : 'text-red-700'}>{fmt(cf.operativo.flujoOperativo)}</span>
          </div>
        </div>

        {/* INVERSIÓN */}
        <div className="bg-purple-50/50 rounded-lg p-3 space-y-2">
          <h4 className="font-semibold text-sm text-purple-800 flex items-center gap-2"><Building2 className="h-4 w-4" /> Flujo de Inversión</h4>
          <div className="flex justify-between py-1.5">
            <span className="flex items-center gap-2 text-sm"><Minus className="h-3.5 w-3.5" /> Compras de activos ({cf.inversion.comprasCount})</span>
            <span className="font-medium text-red-600">{cf.inversion.comprasActivos > 0 ? '-' : ''}{fmt(cf.inversion.comprasActivos)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-purple-200 font-bold">
            <span>= Flujo Inversión</span>
            <span className={cf.inversion.flujoInversion >= 0 ? 'text-green-700' : 'text-red-700'}>{fmt(cf.inversion.flujoInversion)}</span>
          </div>
        </div>

        {/* FINANCIACIÓN */}
        <div className="bg-amber-50/50 rounded-lg p-3 space-y-2">
          <h4 className="font-semibold text-sm text-amber-800 flex items-center gap-2"><Landmark className="h-4 w-4" /> Flujo de Financiación</h4>
          <div className="flex justify-between py-1.5">
            <span className="flex items-center gap-2 text-sm"><ArrowDownRight className="h-3.5 w-3.5 text-red-500" /> Cuotas hipotecarias</span>
            <span className="font-medium text-red-600">-{fmt(cf.financiacion.cuotasHipotecas)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-amber-200 font-bold">
            <span>= Flujo Financiación</span>
            <span className={cf.financiacion.flujoFinanciacion >= 0 ? 'text-green-700' : 'text-red-700'}>{fmt(cf.financiacion.flujoFinanciacion)}</span>
          </div>
        </div>

        {/* VARIACIÓN NETA */}
        <div className={`rounded-lg p-4 ${cf.variacionNeta >= 0 ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
          <div className="flex justify-between items-center">
            <span className="font-bold text-lg flex items-center gap-2">
              <Wallet className="h-5 w-5" /> Variación Neta de Tesorería
            </span>
            <span className={`text-xl font-bold ${cf.variacionNeta >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(cf.variacionNeta)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Flujo operativo mensual medio: {fmt(cf.flujoOperativoMensual)}/mes · Periodo: {cf.months} meses
          </p>
        </div>
      </div>
    );
  };

  if (loading) return <AuthenticatedLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div></AuthenticatedLayout>;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <Breadcrumb><BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-3.5 w-3.5" /></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/inversiones">Inversiones</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Cash-Flow</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList></Breadcrumb>

        <div>
          <h1 className="text-2xl font-bold">Estado de Flujos de Efectivo</h1>
          <p className="text-gray-500">Cash-flow consolidado del grupo</p>
        </div>

        <Tabs defaultValue="ytd">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="ytd">YTD</TabsTrigger>
            <TabsTrigger value="tam">TAM (12M)</TabsTrigger>
            <TabsTrigger value="anual">Año {new Date().getFullYear() - 1}</TabsTrigger>
          </TabsList>
          {['ytd', 'tam', 'anual'].map(key => (
            <TabsContent key={key} value={key}>
              <Card>
                <CardHeader>
                  <CardTitle>Cash-Flow — {periods[key]?.label || key.toUpperCase()}</CardTitle>
                  <CardDescription>Operativo + Inversión + Financiación = Variación Neta</CardDescription>
                </CardHeader>
                <CardContent>{renderCF(periods[key])}</CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
