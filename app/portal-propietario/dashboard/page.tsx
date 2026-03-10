'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  TrendingUp,
  PieChart,
  Wallet,
  BarChart3,
  Loader2,
  Euro,
  Percent,
} from 'lucide-react';

interface PatrimonioData {
  success?: boolean;
  data?: {
    patrimonio?: { total?: number };
    assetAllocation?: {
      inmobiliario?: number;
      financiero?: number;
      privateEquity?: number;
      liquidez?: number;
    };
    inmobiliario?: { valor?: number; renta?: number };
    financiero?: { valor?: number; pnl?: number };
    privateEquity?: { valor?: number; participaciones?: Array<{ nombre?: string; valor?: number }> };
    tesoreria?: { saldo?: number };
  };
}

interface DashboardData {
  kpis?: {
    ingresosTotalesMensuales?: number;
    tasaOcupacion?: number;
    ingresosNetos?: number;
    gastosTotales?: number;
  };
}

interface TransactionItem {
  id: string;
  tipo: string;
  concepto: string;
  importe: number;
  fecha: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PortalPropietarioDashboardPage() {
  const [patrimonio, setPatrimonio] = useState<PatrimonioData | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [distribuciones, setDistribuciones] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [patRes, dashRes, txRes] = await Promise.all([
          fetch('/api/family-office/dashboard?view=consolidated'),
          fetch('/api/dashboard'),
          fetch('/api/family-office/transactions?tipo=reembolso'),
        ]);

        if (patRes.ok) {
          const data = await patRes.json();
          setPatrimonio(data);
        }
        if (dashRes.ok) {
          const data = await dashRes.json();
          setDashboard(data);
        }
        if (txRes.ok) {
          const data = await txRes.json();
          const txs = Array.isArray(data) ? data : data?.data ?? data?.transactions ?? [];
          setDistribuciones((txs as TransactionItem[]).slice(0, 5));
        }
      } catch (e) {
        setError('Error cargando datos');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const patrim = patrimonio?.data;
  const kpis = dashboard?.kpis;

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portal del Propietario</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            Vista consolidada de patrimonio y operativa
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5" />
                Patrimonio Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {patrim?.patrimonio?.total != null
                  ? formatCurrency(patrim.patrimonio.total)
                  : '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Euro className="h-5 w-5" />
                Rentabilidad mensual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {kpis?.ingresosTotalesMensuales != null
                  ? formatCurrency(kpis.ingresosTotalesMensuales)
                  : patrim?.inmobiliario?.renta != null
                    ? formatCurrency(patrim.inmobiliario.renta)
                    : '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Percent className="h-5 w-5" />
                Ocupación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {kpis?.tasaOcupacion != null ? `${kpis.tasaOcupacion}%` : '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                Cash-flow neto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {kpis?.ingresosNetos != null ? formatCurrency(kpis.ingresosNetos) : '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <PieChart className="h-6 w-6" />
              Distribución por activos
            </CardTitle>
            <CardDescription>Allocation del patrimonio consolidado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {patrim?.assetAllocation?.inmobiliario != null && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base font-medium">Inmobiliario</span>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {patrim.assetAllocation.inmobiliario.toFixed(1)}%
                  </Badge>
                </div>
              )}
              {patrim?.assetAllocation?.financiero != null && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base font-medium">Financiero</span>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {patrim.assetAllocation.financiero.toFixed(1)}%
                  </Badge>
                </div>
              )}
              {patrim?.assetAllocation?.privateEquity != null && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base font-medium">Private Equity</span>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {patrim.assetAllocation.privateEquity.toFixed(1)}%
                  </Badge>
                </div>
              )}
              {patrim?.assetAllocation?.liquidez != null && (
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base font-medium">Liquidez</span>
                  </div>
                  <Badge variant="secondary" className="text-base">
                    {patrim.assetAllocation.liquidez.toFixed(1)}%
                  </Badge>
                </div>
              )}
            </div>
            {!patrim?.assetAllocation && (
              <p className="text-muted-foreground">Sin datos de distribución</p>
            )}
          </CardContent>
        </Card>

        {distribuciones.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Euro className="h-6 w-6" />
                Últimas distribuciones PE
              </CardTitle>
              <CardDescription>Reembolsos recientes de participaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {distribuciones.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-base font-medium">{d.concepto || 'Reembolso'}</span>
                    <span className="text-base font-semibold text-green-600">
                      +{formatCurrency(d.importe)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
