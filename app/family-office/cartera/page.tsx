// @ts-nocheck
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Home, TrendingUp, PieChart, LayoutDashboard, FileBarChart } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import Link from 'next/link';

interface PnlData {
  consolidado: {
    valorTotal: number;
    costeTotal: number;
    pnlTotal: number;
    pnlPct: number;
    totalPosiciones: number;
    totalCuentas: number;
  };
  porGestora: Array<{
    entidad: string;
    cuentas: number;
    posiciones: number;
    costeTotal: number;
    valorActual: number;
    pnlTotal: number;
    pnlPct: number;
    peso: number;
  }>;
  topPosiciones: Array<{
    id: string;
    nombre: string;
    entidad: string;
    valorActual: number;
    pnlTotal: number;
    pnlPct: number;
    tipo?: string;
  }>;
}

export default function CarteraPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PnlData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const res = await fetch('/api/family-office/pnl');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error('Error cargando P&L');
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

  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  const pnlColor = (n: number) => (n >= 0 ? 'text-green-600' : 'text-red-600');

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const c = data?.consolidado || {};
  const gestoras = data?.porGestora || [];
  const topPos = data?.topPosiciones || [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/family-office/dashboard">Family Office</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cartera</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carteras Financieras — P&L</h1>
            <p className="text-gray-500">Rendimiento consolidado por gestora y posiciones</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/finanzas/cuadro-de-mandos">
              <Button variant="ghost" size="sm">
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Cuadro de Mandos
              </Button>
            </Link>
            <Link href="/inversiones/modelo-720">
              <Button variant="ghost" size="sm">
                <FileBarChart className="h-4 w-4 mr-1.5" />
                Modelo 720
              </Button>
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-indigo-50 to-white">
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Valor Total Cartera</div>
              <div className="text-xl font-bold text-indigo-700">
                {fmt((c as any).valorTotalConSaldo || c.valorTotal || 0)}
              </div>
              <div className="text-[10px] text-gray-400">
                {c.totalCuentas || 0} cuentas · {c.totalPosiciones || 0} posiciones
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Posiciones (valor mercado)</div>
              <div className="text-xl font-bold">{fmt(c.valorTotal || 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Saldo en cuentas</div>
              <div className="text-xl font-bold text-blue-600">
                {fmt((c as any).saldoCuentas || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">P&L total</div>
              <div className={`text-xl font-bold ${pnlColor(c.pnlTotal || 0)}`}>
                {c.pnlTotal ? fmt(c.pnlTotal) : 'Sin datos coste'}
              </div>
              <div className="text-[10px] text-gray-400">
                {c.costeTotal ? fmtPct(c.pnlPct || 0) : 'Coste adquisición pendiente'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-gray-500 mb-1">Posiciones</div>
              <div className="text-xl font-bold">{c.totalPosiciones || 0}</div>
              <div className="text-[10px] text-gray-400">en {c.totalCuentas || 0} cuentas</div>
            </CardContent>
          </Card>
        </div>

        {/* P&L consolidado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" /> P&L consolidado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-gray-500">Coste total: </span>
                <span className="font-medium">{fmt(c.costeTotal || 0)}</span>
              </div>
              <div>
                <span className="text-gray-500">Valor actual: </span>
                <span className="font-medium">{fmt(c.valorTotal || 0)}</span>
              </div>
              <div>
                <span className="text-gray-500">P&L: </span>
                <span className={`font-bold ${pnlColor(c.pnlTotal || 0)}`}>
                  {fmt(c.pnlTotal || 0)} ({fmtPct(c.pnlPct || 0)})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Por gestora */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por gestora / entidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Entidad</th>
                    <th className="text-right py-2 font-medium">Posiciones</th>
                    <th className="text-right py-2 font-medium">Valor Posiciones</th>
                    <th className="text-right py-2 font-medium">Saldo Cuenta</th>
                    <th className="text-right py-2 font-medium">Total</th>
                    <th className="text-right py-2 font-medium">Peso</th>
                  </tr>
                </thead>
                <tbody>
                  {gestoras.map((g: any) => (
                    <tr key={g.entidad} className="border-b last:border-0">
                      <td className="py-2 font-medium">{g.entidad}</td>
                      <td className="text-right py-2 text-gray-500">{g.posiciones}</td>
                      <td className="text-right py-2">{fmt(g.valorActual)}</td>
                      <td className="text-right py-2 text-blue-600">{fmt(g.saldoCuenta || 0)}</td>
                      <td className="text-right py-2 font-bold">
                        {fmt(g.valorTotalConSaldo || g.valorActual)}
                      </td>
                      <td className="text-right py-2 text-gray-500">{g.peso}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {gestoras.length === 0 && (
                <div className="text-center text-gray-400 py-8">Sin datos de gestoras.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top 20 posiciones */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-indigo-600" /> Top 20 posiciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Instrumento</th>
                    <th className="text-left py-2 font-medium">Entidad</th>
                    <th className="text-right py-2 font-medium">Valor</th>
                    <th className="text-right py-2 font-medium">P&L</th>
                    <th className="text-right py-2 font-medium">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {topPos.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">{p.nombre || p.tipo || '—'}</td>
                      <td className="py-2 text-gray-500">{p.entidad}</td>
                      <td className="text-right py-2">{fmt(p.valorActual)}</td>
                      <td className={`text-right py-2 font-medium ${pnlColor(p.pnlTotal)}`}>
                        {fmt(p.pnlTotal)}
                      </td>
                      <td className={`text-right py-2 font-medium ${pnlColor(p.pnlPct)}`}>
                        {fmtPct(p.pnlPct)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {topPos.length === 0 && (
                <div className="text-center text-gray-400 py-8">Sin posiciones.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
