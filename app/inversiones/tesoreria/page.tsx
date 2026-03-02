'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Euro, TrendingUp, TrendingDown, AlertTriangle, Calendar,
  ArrowUpRight, ArrowDownRight, Wallet, Home,
} from 'lucide-react';
import { toast } from 'sonner';

interface TreasuryMonth {
  label: string;
  totalCobros: number;
  totalPagos: number;
  totalFiscal: number;
  flujoNeto: number;
  saldoAcumulado: number;
  hipotecas: number;
  modelo202: number;
  modelo303: number;
  modelo200: number;
}

interface Forecast {
  companyName: string;
  saldoInicial: number;
  meses: TreasuryMonth[];
  resumen: {
    totalCobros12m: number;
    totalPagos12m: number;
    totalFiscal12m: number;
    flujoNeto12m: number;
    mesMinLiquidez: string;
    mesMaxLiquidez: string;
    saldoFinal: number;
  };
}

export default function TesoreriaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saldoInicial, setSaldoInicial] = useState('50000');
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/investment/treasury?saldoInicial=${saldoInicial}`);
      if (res.ok) {
        const data = await res.json();
        setForecast(data.data);
      }
    } catch { toast.error('Error cargando tesorería'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const r = forecast?.resumen;

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
              <BreadcrumbPage>Tesorería</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Previsión de Tesorería</h1>
            <p className="text-muted-foreground">Calendario de cobros y pagos a 12 meses — {forecast?.companyName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Saldo inicial:</Label>
            <Input className="w-32" type="number" value={saldoInicial} onChange={e => setSaldoInicial(e.target.value)} />
            <Button onClick={loadData} variant="outline" size="sm">Recalcular</Button>
          </div>
        </div>

        {/* KPIs */}
        {r && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Cobros 12m</p>
                <p className="text-xl font-bold text-green-600">{fmt(r.totalCobros12m)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Pagos 12m</p>
                <p className="text-xl font-bold text-red-600">{fmt(r.totalPagos12m)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Fiscal 12m</p>
                <p className="text-xl font-bold text-orange-600">{fmt(r.totalFiscal12m)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Saldo final</p>
                <p className={`text-xl font-bold ${r.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(r.saldoFinal)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alertas */}
        {r && r.saldoFinal < 0 && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Alerta de liquidez</p>
                <p className="text-sm text-red-600">Saldo negativo previsto. Mínima liquidez en {r.mesMinLiquidez}.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabla mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Detalle mensual</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 px-3 font-medium sticky left-0 bg-muted/50">Mes</th>
                    <th className="text-right p-2 font-medium text-green-700">Cobros</th>
                    <th className="text-right p-2 font-medium text-red-700">Pagos</th>
                    <th className="text-right p-2 font-medium text-red-700">Hipotecas</th>
                    <th className="text-right p-2 font-medium text-orange-700">Mod.202</th>
                    <th className="text-right p-2 font-medium text-orange-700">Mod.303</th>
                    <th className="text-right p-2 font-medium text-orange-700">Mod.200</th>
                    <th className="text-right p-2 font-medium">Flujo neto</th>
                    <th className="text-right p-2 px-3 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {forecast?.meses.map((m, i) => (
                    <tr key={i} className={m.saldoAcumulado < 0 ? 'bg-red-50' : ''}>
                      <td className="p-2 px-3 font-medium sticky left-0 bg-white">{m.label}</td>
                      <td className="p-2 text-right text-green-600 font-mono">{fmt(m.totalCobros)}</td>
                      <td className="p-2 text-right text-red-600 font-mono">{fmt(m.totalPagos)}</td>
                      <td className="p-2 text-right text-red-500 font-mono">{fmt(m.hipotecas)}</td>
                      <td className="p-2 text-right text-orange-600 font-mono">{m.modelo202 > 0 ? fmt(m.modelo202) : '-'}</td>
                      <td className="p-2 text-right text-orange-600 font-mono">{m.modelo303 > 0 ? fmt(m.modelo303) : '-'}</td>
                      <td className="p-2 text-right text-orange-600 font-mono">{m.modelo200 > 0 ? fmt(m.modelo200) : '-'}</td>
                      <td className={`p-2 text-right font-mono font-medium ${m.flujoNeto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(m.flujoNeto)}
                      </td>
                      <td className={`p-2 px-3 text-right font-mono font-bold ${m.saldoAcumulado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {fmt(m.saldoAcumulado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
