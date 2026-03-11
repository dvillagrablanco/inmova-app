'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  TrendingUp,
  Briefcase,
  Wallet,
  Loader2,
  RefreshCw,
  Home,
  ToggleLeft,
  ToggleRight,
  Info,
  FileText,
} from 'lucide-react';
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
import { SuggestionsWidget } from '@/components/smart-suggestions/SuggestionsWidget';

interface EdificioData {
  id: string;
  nombre: string;
  direccion: string;
  unidades: number;
  ocupadas: number;
  valor: number;
  renta: number;
}

interface CuentaData {
  id: string;
  entidad: string;
  alias: string;
  divisa: string;
  valor: number;
  pnl: number;
  saldo: number;
  posiciones: number;
}

interface ParticipacionData {
  id: string;
  nombre: string;
  cif: string;
  tipo: string;
  porcentaje: number;
  valor: number;
  coste: number;
}

interface EvolutionPoint {
  date: string;
  total: number;
  af: number;
  pe: number;
  ar: number;
  amper: number;
}

interface PerformanceByYear {
  return2023: number | null;
  return2024: number | null;
  return2025: number | null;
  returnYtd: number | null;
  sinceInception: number | null;
  annualized: number | null;
  volatility12m: number | null;
  sharpeRatio: number | null;
}

interface CustodianData {
  custodian: string;
  total: number;
  pnl: number;
  deposits: number;
  previousValue: number;
}

interface AllocationVsTarget {
  name: string;
  value: number;
  weight: number;
  target: number | null;
  deviation: number | null;
}

interface DashboardData {
  inmobiliario: { valor: number; renta: number; rentaAnual: number; edificios: EdificioData[] };
  financiero: { valor: number; pnl: number; cuentas: CuentaData[] };
  privateEquity: { valor: number; participaciones: ParticipacionData[] };
  tesoreria: { saldo: number; porEntidad: { entidad: string; saldo: number }[] };
  assetAllocation: Record<string, number>;
  patrimonio: { total: number };
  patrimonioEvolution?: EvolutionPoint[];
  performanceByYear?: PerformanceByYear;
  custodianBreakdown?: CustodianData[];
  allocationVsTarget?: AllocationVsTarget[];
  feesSummary?: { totalFees: number; breakdown: any; reportDate: string };
  snapshotCount?: number;
}

export default function FamilyOfficeDashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [view, setView] = useState<'holding' | 'consolidated'>('holding');
  const [viewLabel, setViewLabel] = useState('');
  const [viewDescription, setViewDescription] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData(view);
  }, [status, router, view]);

  const loadData = async (v: 'holding' | 'consolidated' = view) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/family-office/dashboard?view=${v}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json);
        setViewLabel(json.viewLabel || '');
        setViewDescription(json.viewDescription || '');
      }
    } catch {
      toast.error('Error cargando dashboard patrimonial');
    } finally {
      setLoading(false);
    }
  };

  const toggleView = () => {
    const next = view === 'holding' ? 'consolidated' : 'holding';
    setView(next);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const d = data;
  const patrimonio = d?.patrimonio?.total || 0;
  const alloc = d?.assetAllocation || {};

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Family Office</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Patrimonial 360°</h1>
            <p className="text-gray-500">{viewLabel || 'Visión patrimonial'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'holding' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('holding')}
              className="text-xs"
            >
              {view === 'holding' ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
              Holding
            </Button>
            <Button
              variant={view === 'consolidated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setView('consolidated')}
              className="text-xs"
            >
              {view === 'consolidated' ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
              Consolidado
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/family-office/report?view=${view}`);
                  if (res.ok) {
                    const { html } = await res.json();
                    const w = window.open('', '_blank');
                    if (w) { w.document.write(html); w.document.close(); w.print(); }
                  } else {
                    toast.error('Error generando informe');
                  }
                } catch { toast.error('Error de conexión'); }
              }}
            >
              <FileText className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="ghost" onClick={() => loadData()} size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View explanation */}
        {viewDescription && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{viewDescription}</span>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { label: 'Private Equity', href: '/family-office/pe', icon: Briefcase, color: 'text-purple-600 bg-purple-50' },
            { label: 'Cuentas', href: '/family-office/cuentas', icon: Building2, color: 'text-blue-600 bg-blue-50' },
            { label: 'Carteras P&L', href: '/family-office/cartera', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
            { label: 'Tesorería', href: '/family-office/tesoreria', icon: Wallet, color: 'text-amber-600 bg-amber-50' },
            { label: 'Cuadro Mandos', href: '/finanzas/cuadro-de-mandos', icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Reportes', href: '/reportes/financieros', icon: Building2, color: 'text-gray-600 bg-gray-50' },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:shadow-md transition-shadow cursor-pointer text-center">
                <div className={`w-8 h-8 rounded-lg ${item.color.split(' ')[1]} flex items-center justify-center`}>
                  <item.icon className={`h-4 w-4 ${item.color.split(' ')[0]}`} />
                </div>
                <span className="text-[10px] font-medium text-gray-700">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Patrimonio Total */}
        <Card className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white">
          <CardContent className="pt-6 pb-4">
            <div className="text-center">
              <div className="text-sm opacity-80 mb-1">Patrimonio Total del Grupo</div>
              <div className="text-5xl font-black">{fmt(patrimonio)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Allocation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-xs text-gray-500">Inmobiliario</div>
              </div>
              <div className="text-xl font-bold">{fmt(d?.inmobiliario?.valor ?? 0)}</div>
              <div className="text-xs text-gray-400">{(alloc.inmobiliario ?? 0).toFixed(0)}% del total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="text-xs text-gray-500">Financiero</div>
              </div>
              <div className="text-xl font-bold">{fmt(d?.financiero?.valor ?? 0)}</div>
              <div className={`text-xs ${(d?.financiero?.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {fmt(d?.financiero?.pnl ?? 0)} P&L
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                </div>
                <div className="text-xs text-gray-500">Private Equity</div>
              </div>
              <div className="text-xl font-bold">{fmt(d?.privateEquity?.valor ?? 0)}</div>
              <div className="text-xs text-gray-400">{d?.privateEquity?.participaciones?.length ?? 0} participaciones</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-amber-600" />
                </div>
                <div className="text-xs text-gray-500">Tesorería</div>
              </div>
              <div className="text-xl font-bold">{fmt(d?.tesoreria?.saldo ?? 0)}</div>
              <div className="text-xs text-gray-400">{d?.tesoreria?.porEntidad?.length ?? 0} entidades</div>
            </CardContent>
          </Card>
        </div>

        {/* G1: Evolución Patrimonial Real */}
        {d?.patrimonioEvolution && d.patrimonioEvolution.length > 2 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Evolución Patrimonial</CardTitle>
              <p className="text-xs text-gray-500">{d.patrimonioEvolution.length} meses de datos reales</p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {(() => {
                  const evo = d.patrimonioEvolution!;
                  const maxVal = Math.max(...evo.map(e => e.total));
                  const minVal = Math.min(...evo.map(e => e.total)) * 0.95;
                  const range = maxVal - minVal || 1;
                  return evo.map((point, i) => {
                    const height = ((point.total - minVal) / range) * 100;
                    const isLast = i === evo.length - 1;
                    return (
                      <div key={point.date} className="flex-1 flex flex-col items-center gap-1" title={`${point.date}: ${fmt(point.total)}`}>
                        <div className="w-full flex flex-col justify-end" style={{ height: '220px' }}>
                          <div
                            className={`w-full rounded-t ${isLast ? 'bg-indigo-600' : 'bg-indigo-200 hover:bg-indigo-300'} transition-colors`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                        </div>
                        {i % Math.ceil(evo.length / 8) === 0 && (
                          <span className="text-[8px] text-gray-400 -rotate-45 origin-left whitespace-nowrap">
                            {point.date.slice(2)}
                          </span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{d.patrimonioEvolution[0]?.date}</span>
                <span className="font-medium text-indigo-600">
                  {fmt(d.patrimonioEvolution[d.patrimonioEvolution.length - 1]?.total ?? 0)}
                </span>
                <span>{d.patrimonioEvolution[d.patrimonioEvolution.length - 1]?.date}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* G2 + G3 + G4 row */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* G2: Performance por Año */}
          {d?.performanceByYear && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" /> Rentabilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {[
                    { label: '2023', value: d.performanceByYear.return2023 },
                    { label: '2024', value: d.performanceByYear.return2024 },
                    { label: '2025', value: d.performanceByYear.return2025 },
                    { label: 'YTD 2026', value: d.performanceByYear.returnYtd },
                    { label: 'Desde inicio', value: d.performanceByYear.sinceInception },
                    { label: 'Anualizada', value: d.performanceByYear.annualized },
                  ].map(row => row.value != null && (
                    <div key={row.label} className="flex justify-between items-center">
                      <span className="text-gray-500">{row.label}</span>
                      <span className={`font-semibold ${(row.value ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {row.value! >= 0 ? '+' : ''}{row.value!.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                  {d.performanceByYear.volatility12m != null && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Volatilidad 12M</span>
                        <span className="font-medium">{d.performanceByYear.volatility12m.toFixed(2)}%</span>
                      </div>
                      {d.performanceByYear.sharpeRatio != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Sharpe Ratio</span>
                          <span className="font-medium">{d.performanceByYear.sharpeRatio.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* G3: Desglose por Custodio */}
          {d?.custodianBreakdown && Array.isArray(d.custodianBreakdown) && d.custodianBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" /> Por Custodio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(() => {
                    const items = d.custodianBreakdown as CustodianData[];
                    const total = items.reduce((s, c) => s + c.total, 0) || 1;
                    const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500'];
                    return (
                      <>
                        <div className="flex h-3 rounded-full overflow-hidden">
                          {items.map((c, i) => (
                            <div
                              key={c.custodian}
                              className={`${colors[i % colors.length]} transition-all`}
                              style={{ width: `${(c.total / total) * 100}%` }}
                              title={`${c.custodian}: ${fmt(c.total)}`}
                            />
                          ))}
                        </div>
                        <div className="space-y-1.5 text-sm">
                          {items.map((c, i) => (
                            <div key={c.custodian} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2.5 h-2.5 rounded-full ${colors[i % colors.length]}`} />
                                <span className="text-gray-600">{c.custodian}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-medium">{fmt(c.total)}</span>
                                <span className="text-gray-400 text-xs ml-1">
                                  ({((c.total / total) * 100).toFixed(0)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* G4: Asset Allocation vs Target */}
          {d?.allocationVsTarget && d.allocationVsTarget.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-purple-600" /> Allocation vs Objetivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {d.allocationVsTarget.map(a => (
                    <div key={a.name}>
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-gray-600 text-xs">{a.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{a.weight.toFixed(1)}%</span>
                          {a.target != null && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 ${
                                Math.abs(a.deviation ?? 0) <= 2
                                  ? 'border-green-300 text-green-700 bg-green-50'
                                  : Math.abs(a.deviation ?? 0) <= 5
                                  ? 'border-yellow-300 text-yellow-700 bg-yellow-50'
                                  : 'border-red-300 text-red-700 bg-red-50'
                              }`}
                            >
                              {(a.deviation ?? 0) >= 0 ? '+' : ''}{a.deviation?.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 rounded-full"
                          style={{ width: `${Math.min(a.weight, 100)}%` }}
                        />
                      </div>
                      {a.target != null && (
                        <div className="text-[10px] text-gray-400 text-right">
                          objetivo: {a.target}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* G7: Comisiones */}
        {d?.feesSummary && d.feesSummary.totalFees !== 0 && (
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">Comisiones último mes</span>
                </div>
                <span className="text-sm font-bold text-amber-700">{fmt(Math.abs(d.feesSummary.totalFees))}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sugerencias inteligentes */}
        <SuggestionsWidget limit={3} />

        {/* Detalle por bloque */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Inmobiliario */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" /> Inmobiliario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Edificios</span>
                  <span className="font-medium">{d?.inmobiliario?.edificios?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unidades</span>
                  <span className="font-medium">{d?.inmobiliario?.edificios?.reduce((sum, e) => sum + e.unidades, 0) ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ocupación</span>
                  <span className="font-medium">
                    {(() => {
                      const eds = d?.inmobiliario?.edificios ?? [];
                      const totalU = eds.reduce((s, e) => s + e.unidades, 0);
                      const totalO = eds.reduce((s, e) => s + e.ocupadas, 0);
                      return totalU > 0 ? ((totalO / totalU) * 100).toFixed(1) : '0.0';
                    })()}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Renta mensual</span>
                  <span className="font-bold text-blue-600">{fmt(d?.inmobiliario?.renta ?? 0)}</span>
                </div>
              </div>
              <Link href="/inversiones">
                <Button variant="outline" size="sm" className="w-full mt-4">Ver detalle inmobiliario</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Financiero */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" /> Carteras Financieras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Cuentas</span>
                  <span className="font-medium">{d?.financiero?.cuentas?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Posiciones</span>
                  <span className="font-medium">{d?.financiero?.cuentas?.reduce((s, c) => s + c.posiciones, 0) ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">P&L total</span>
                  <span className={`font-bold ${(d?.financiero?.pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(d?.financiero?.pnl ?? 0)}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4" onClick={() => toast.info('Gestión de cuentas disponible próximamente')}>
                Gestionar cuentas
              </Button>
            </CardContent>
          </Card>

          {/* Private Equity */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-purple-600" /> Private Equity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Participaciones</span>
                  <span className="font-medium">{d?.privateEquity?.participaciones?.length ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Coste adquisición</span>
                  <span className="font-medium">{fmt(d?.privateEquity?.participaciones?.reduce((s, p) => s + (p.coste ?? 0), 0) ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valor actual</span>
                  <span className="font-bold text-purple-600">{fmt(d?.privateEquity?.valor ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tesorería */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-amber-600" /> Tesorería
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 text-sm">
                {(d?.tesoreria?.porEntidad ?? []).map((item) => (
                  <div key={item.entidad} className="flex justify-between">
                    <span className="text-gray-500">{item.entidad}</span>
                    <span className="font-medium">{fmt(item.saldo)}</span>
                  </div>
                ))}
                {(d?.tesoreria?.porEntidad ?? []).length === 0 && (
                  <div className="text-center text-gray-400 py-4">
                    Sin cuentas registradas. Añade tu primera cuenta.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
