'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2, TrendingUp, Euro, Percent, Landmark, Receipt, Shield, Trophy,
} from 'lucide-react';
import { toast } from 'sonner';

interface CompanyComparison {
  companyId: string;
  companyName: string;
  cif: string;
  isHolding: boolean;
  // Portfolio
  totalAssets: number;
  totalInvestment: number;
  totalMarketValue: number;
  totalDebt: number;
  equity: number;
  ltv: number;
  // Rentabilidad
  grossYield: number;
  netYield: number;
  // Fiscal
  ingresosBrutos: number;
  gastosDeducibles: number;
  baseImponible: number;
  cuotaIS: number;
  tipoEfectivo: number;
  // Cash-flow
  cashFlowPreTax: number;
  cashFlowPostTax: number;
  // Ratios
  roe: number;
  rentabilidadPostImpuestos: number;
  cashOnCash: number;
}

interface CompareData {
  year: number;
  companies: CompanyComparison[];
  best: {
    highestYield: string;
    highestCashFlow: string;
    lowestTax: string;
    highestROE: string;
  };
}

export default function ComparativaPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<CompareData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') loadData();
  }, [status, router, year]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/investment/consolidated/compare?year=${year}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch { toast.error('Error cargando comparativa'); }
    finally { setLoading(false); }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const pct = (n: number) => `${n}%`;

  const isBest = (companyName: string, category: keyof CompareData['best']) =>
    data?.best?.[category] === companyName;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const companies = data?.companies || [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Comparativa de Sociedades</h1>
            <p className="text-muted-foreground">Rendimiento pre y post-impuestos de cada sociedad del grupo</p>
          </div>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Highlights */}
        {data?.best && companies.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Mayor Yield', value: data.best.highestYield, icon: TrendingUp, color: 'text-green-600' },
              { label: 'Mayor Cash-flow', value: data.best.highestCashFlow, icon: Euro, color: 'text-blue-600' },
              { label: 'Menor Presión Fiscal', value: data.best.lowestTax, icon: Shield, color: 'text-purple-600' },
              { label: 'Mayor ROE', value: data.best.highestROE, icon: Trophy, color: 'text-amber-600' },
            ].map(h => (
              <Card key={h.label}>
                <CardContent className="p-3 flex items-center gap-2">
                  <h.icon className={`h-4 w-4 ${h.color}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">{h.label}</p>
                    <p className="text-sm font-semibold">{h.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tabla comparativa completa */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Métrica</th>
                    {companies.map(c => (
                      <th key={c.companyId} className="text-right p-4 font-medium">
                        <div>{c.companyName}</div>
                        <div className="text-xs text-muted-foreground font-normal">{c.cif}</div>
                        {c.isHolding && <Badge variant="secondary" className="text-xs mt-1">Holding</Badge>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* PATRIMONIO */}
                  <tr className="bg-muted/30"><td colSpan={companies.length + 1} className="p-2 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Patrimonio</td></tr>
                  <Row label="Activos" icon={Building2} values={companies.map(c => String(c.totalAssets))} />
                  <Row label="Inversión total" values={companies.map(c => fmt(c.totalInvestment))} bg />
                  <Row label="Valor de mercado" values={companies.map(c => fmt(c.totalMarketValue))} />
                  <Row label="Deuda hipotecaria" icon={Landmark} values={companies.map(c => fmt(c.totalDebt))} className="text-red-600" bg />
                  <Row label="Patrimonio neto" values={companies.map(c => fmt(c.equity))} className="text-green-600 font-bold" />
                  <Row label="LTV" values={companies.map(c => pct(c.ltv))} colorFn={(v) => {
                    const n = parseFloat(v); return n > 70 ? 'text-red-600' : n > 50 ? 'text-orange-500' : 'text-green-600';
                  }} bg />

                  {/* RENTABILIDAD */}
                  <tr className="bg-muted/30"><td colSpan={companies.length + 1} className="p-2 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Rentabilidad</td></tr>
                  <Row label="Yield bruto" icon={TrendingUp} values={companies.map(c => pct(c.grossYield))} />
                  <Row label="Yield neto" values={companies.map(c => pct(c.netYield))} highlight={companies.map(c => isBest(c.companyName, 'highestYield'))} bg />
                  <Row label="Rent. post-impuestos" values={companies.map(c => pct(c.rentabilidadPostImpuestos))} className="font-bold" />
                  <Row label="Cash-on-cash" values={companies.map(c => pct(c.cashOnCash))} bg />
                  <Row label="ROE" icon={Trophy} values={companies.map(c => pct(c.roe))} highlight={companies.map(c => isBest(c.companyName, 'highestROE'))} />

                  {/* FISCAL */}
                  <tr className="bg-muted/30"><td colSpan={companies.length + 1} className="p-2 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Fiscal (IS)</td></tr>
                  <Row label="Ingresos brutos" icon={Receipt} values={companies.map(c => fmt(c.ingresosBrutos))} />
                  <Row label="Gastos deducibles" values={companies.map(c => fmt(c.gastosDeducibles))} className="text-red-500" bg />
                  <Row label="Base imponible" values={companies.map(c => fmt(c.baseImponible))} />
                  <Row label="Cuota IS (25%)" values={companies.map(c => fmt(c.cuotaIS))} className="text-red-600" bg />
                  <Row label="Tipo efectivo" icon={Shield} values={companies.map(c => pct(c.tipoEfectivo))} highlight={companies.map(c => isBest(c.companyName, 'lowestTax'))} />

                  {/* CASH-FLOW */}
                  <tr className="bg-muted/30"><td colSpan={companies.length + 1} className="p-2 px-4 font-semibold text-xs text-muted-foreground uppercase tracking-wide">Cash-flow anual</td></tr>
                  <Row label="Cash-flow pre-impuestos" icon={Euro} values={companies.map(c => fmt(c.cashFlowPreTax))} colorFn={(v) => parseFloat(v.replace(/[^-\d]/g, '')) >= 0 ? 'text-green-600' : 'text-red-600'} />
                  <Row label="Cash-flow post-impuestos" values={companies.map(c => fmt(c.cashFlowPostTax))} highlight={companies.map(c => isBest(c.companyName, 'highestCashFlow'))} colorFn={(v) => parseFloat(v.replace(/[^-\d]/g, '')) >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'} bg />
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {companies.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No hay sociedades filiales. Configura Viroda y Rovida como filiales de Vidaro en Configuración &gt; Empresas.
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}

/** Helper row component */
function Row({ label, icon: Icon, values, className, bg, highlight, colorFn }: {
  label: string;
  icon?: any;
  values: string[];
  className?: string;
  bg?: boolean;
  highlight?: boolean[];
  colorFn?: (v: string) => string;
}) {
  return (
    <tr className={bg ? 'bg-muted/20' : ''}>
      <td className="p-3 px-4 text-muted-foreground flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className={`p-3 px-4 text-right ${colorFn ? colorFn(v) : className || 'font-medium'}`}>
          {v}
          {highlight?.[i] && values.length > 1 && (
            <Badge className="ml-1 text-xs" variant="default">Mejor</Badge>
          )}
        </td>
      ))}
    </tr>
  );
}
