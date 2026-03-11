'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Home,
  Briefcase,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Landmark,
} from 'lucide-react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FondoRentabilidad {
  patrimonioInicio: number;
  patrimonioFin: number;
  desembolsos: number;
  reembolsos: number;
  rentabilidadEur: number;
  rentabilidadPct: number;
}

interface Fondo {
  id: string;
  nombre: string;
  anoCompromiso: number;
  vehiculoInversor: string;
  gestora: string | null;
  compromisoTotal: number;
  valoracionActual: number;
  capitalPendiente: number;
  distribucionesAcumuladas: number;
  capitalLlamado: number;
  valorMasDistribuciones: number;
  tvpi: number;
  dpi: number;
  moic: number;
  irr: number;
  rentabilidad: FondoRentabilidad;
  fechaUltimaValoracion: string | null;
}

interface PEData {
  resumen: {
    fondos: number;
    totalComprometido: number;
    totalLlamado: number;
    capitalPendiente: number;
    totalDistribuido: number;
    valorActual: number;
    tvpiGlobal: number;
    dpiGlobal: number;
    rentabilidadPeriodoEur: number;
    rentabilidadPeriodoPct: number;
  };
  fondos: Fondo[];
  vehiculos: Array<{
    nombre: string;
    fondos: number;
    totalComprometido: number;
    totalValoracion: number;
  }>;
  vintages: Array<{
    year: number;
    count: number;
    comprometido: number;
    valoracion: number;
    tvpiAvg: number;
  }>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);

const fmtK = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M €`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K €`;
  return fmt(n);
};

const pnlColor = (n: number) => (n >= 0 ? 'text-green-600' : 'text-red-600');
const tvpiColor = (n: number) =>
  n >= 1 ? 'text-green-600' : n >= 0.9 ? 'text-yellow-600' : 'text-red-600';
const isViblaVehicle = (value: string) => value.replace(/\s+/g, '_').toUpperCase() === 'VIBLA_SCR';

export default function PEPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PEData | null>(null);
  const [showRentabilidad, setShowRentabilidad] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') loadData();
  }, [status, router]);

  const loadData = async () => {
    try {
      const companyId = searchParams.get('companyId');
      const url = companyId
        ? `/api/family-office/pe-module?companyId=${companyId}`
        : '/api/family-office/pe-module';
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      toast.error('Error cargando módulo Private Equity');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const r = data?.resumen;
  const fondos = data?.fondos ?? [];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-4 md:p-6">
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
              <BreadcrumbLink href="/family-office/dashboard">Family Office</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Private Equity</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Private Equity — Activos en Crecimiento
            </h1>
            <p className="text-gray-500">
              Reporting estilo MdF Family Partners · BALDOMERO PE GRUPO
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/family-office/dashboard">
              <Button variant="ghost" size="sm">
                <Landmark className="h-4 w-4 mr-1.5" />
                Patrimonio 360°
              </Button>
            </Link>
            <Button variant="outline" onClick={loadData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-gray-500 mb-0.5">Fondos</div>
              <div className="text-lg font-bold">{r?.fondos ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-gray-500 mb-0.5">Comprometido</div>
              <div className="text-lg font-bold">{fmtK(r?.totalComprometido ?? 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-gray-500 mb-0.5">Llamado</div>
              <div className="text-lg font-bold">{fmtK(r?.totalLlamado ?? 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-gray-500 mb-0.5">Pendiente</div>
              <div className="text-lg font-bold text-amber-600">
                {fmtK(r?.capitalPendiente ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-gray-500 mb-0.5">Distribuido</div>
              <div className="text-lg font-bold text-blue-600">
                {fmtK(r?.totalDistribuido ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-gray-500 mb-0.5">Valor Actual</div>
              <div className="text-lg font-bold">{fmtK(r?.valorActual ?? 0)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-gray-500 mb-0.5">TVPI</div>
              <div className={cn('text-lg font-bold', tvpiColor(r?.tvpiGlobal ?? 0))}>
                {(r?.tvpiGlobal ?? 0).toFixed(2)}x
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-2 px-3">
              <div className="text-[10px] text-gray-500 mb-0.5">DPI</div>
              <div className="text-lg font-bold">{(r?.dpiGlobal ?? 0).toFixed(2)}x</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabla "Activos en Crecimiento" — estilo MdF */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-purple-600" />
              Activos en Crecimiento (1149.04)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50/80">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Fondos</th>
                    <th className="text-center px-2 py-2 font-semibold text-gray-600">Año</th>
                    <th className="text-right px-2 py-2 font-semibold text-gray-600">
                      Patrimonio
                      <br />
                      comprometido
                    </th>
                    <th className="text-right px-2 py-2 font-semibold text-gray-600">Valoración</th>
                    <th className="text-right px-2 py-2 font-semibold text-gray-600">
                      Desembolsos
                      <br />
                      pendientes
                    </th>
                    <th className="text-right px-2 py-2 font-semibold text-gray-600">
                      Distribuciones
                      <br />
                      acumuladas
                    </th>
                    <th className="text-right px-2 py-2 font-semibold text-gray-600">
                      Val+Dist /<br />
                      Desemb
                    </th>
                    <th className="text-right px-2 py-2 font-semibold text-gray-600">
                      Desemb.
                      <br />
                      acum.
                    </th>
                    <th className="text-center px-2 py-2 font-semibold text-gray-600">Vehículo</th>
                  </tr>
                </thead>
                <tbody>
                  {fondos.map((f) => (
                    <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{f.nombre}</td>
                      <td className="text-center px-2 py-2 text-gray-500">{f.anoCompromiso}</td>
                      <td className="text-right px-2 py-2 tabular-nums">
                        {fmt(f.compromisoTotal)}
                      </td>
                      <td className="text-right px-2 py-2 tabular-nums font-medium">
                        {fmt(f.valoracionActual)}
                      </td>
                      <td className="text-right px-2 py-2 tabular-nums text-amber-600">
                        {f.capitalPendiente > 0 ? fmt(f.capitalPendiente) : '—'}
                      </td>
                      <td className="text-right px-2 py-2 tabular-nums text-blue-600">
                        {f.distribucionesAcumuladas > 0 ? fmt(f.distribucionesAcumuladas) : '—'}
                      </td>
                      <td
                        className={cn(
                          'text-right px-2 py-2 tabular-nums font-bold',
                          tvpiColor(f.tvpi)
                        )}
                      >
                        {f.tvpi.toFixed(2)}x
                      </td>
                      <td className="text-right px-2 py-2 tabular-nums">{fmt(f.capitalLlamado)}</td>
                      <td className="text-center px-2 py-2">
                        <Badge
                          variant={isViblaVehicle(f.vehiculoInversor) ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {isViblaVehicle(f.vehiculoInversor) ? 'VIBLA SCR' : 'Directo'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {/* Total row */}
                  {fondos.length > 0 && (
                    <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                      <td className="px-3 py-2">TOTAL</td>
                      <td></td>
                      <td className="text-right px-2 py-2 tabular-nums">
                        {fmt(r?.totalComprometido ?? 0)}
                      </td>
                      <td className="text-right px-2 py-2 tabular-nums">
                        {fmt(r?.valorActual ?? 0)}
                      </td>
                      <td className="text-right px-2 py-2 tabular-nums text-amber-600">
                        {fmt(r?.capitalPendiente ?? 0)}
                      </td>
                      <td className="text-right px-2 py-2 tabular-nums text-blue-600">
                        {fmt(r?.totalDistribuido ?? 0)}
                      </td>
                      <td
                        className={cn(
                          'text-right px-2 py-2 tabular-nums',
                          tvpiColor(r?.tvpiGlobal ?? 0)
                        )}
                      >
                        {(r?.tvpiGlobal ?? 0).toFixed(2)}x
                      </td>
                      <td className="text-right px-2 py-2 tabular-nums">
                        {fmt(r?.totalLlamado ?? 0)}
                      </td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
              {fondos.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  Sin participaciones PE registradas.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Rentabilidad PE Mensual */}
        <Card>
          <CardHeader
            className="pb-2 cursor-pointer"
            onClick={() => setShowRentabilidad(!showRentabilidad)}
          >
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Rentabilidad PE Mensual (1149.04)
              </span>
              {showRentabilidad ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
          {showRentabilidad && (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[800px]">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50/80">
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Fondos</th>
                      <th className="text-center px-2 py-2 font-semibold text-gray-600">Año</th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-600">
                        Patrimonio
                        <br />
                        inicial
                      </th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-600">
                        Patrimonio
                        <br />
                        final
                      </th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-600">
                        Desembolsos
                        <br />
                        realizados
                      </th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-600">
                        Reembolsos
                        <br />
                        recibidos
                      </th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-600">
                        Rentabilidad
                      </th>
                      <th className="text-right px-2 py-2 font-semibold text-gray-600">
                        Rent. (%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {fondos.map((f) => (
                      <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-3 py-2 font-medium whitespace-nowrap">{f.nombre}</td>
                        <td className="text-center px-2 py-2 text-gray-500">{f.anoCompromiso}</td>
                        <td className="text-right px-2 py-2 tabular-nums">
                          {fmt(f.rentabilidad.patrimonioInicio)}
                        </td>
                        <td className="text-right px-2 py-2 tabular-nums">
                          {fmt(f.rentabilidad.patrimonioFin)}
                        </td>
                        <td className="text-right px-2 py-2 tabular-nums">
                          {f.rentabilidad.desembolsos > 0 ? fmt(f.rentabilidad.desembolsos) : '—'}
                        </td>
                        <td className="text-right px-2 py-2 tabular-nums">
                          {f.rentabilidad.reembolsos > 0 ? fmt(f.rentabilidad.reembolsos) : '—'}
                        </td>
                        <td
                          className={cn(
                            'text-right px-2 py-2 tabular-nums font-medium',
                            pnlColor(f.rentabilidad.rentabilidadEur)
                          )}
                        >
                          {f.rentabilidad.rentabilidadEur !== 0
                            ? fmt(f.rentabilidad.rentabilidadEur)
                            : '—'}
                        </td>
                        <td
                          className={cn(
                            'text-right px-2 py-2 tabular-nums',
                            pnlColor(f.rentabilidad.rentabilidadPct)
                          )}
                        >
                          {f.rentabilidad.rentabilidadPct !== 0
                            ? `${f.rentabilidad.rentabilidadPct.toFixed(2)}%`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                    {/* Total */}
                    {fondos.length > 0 && (
                      <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                        <td className="px-3 py-2">Total</td>
                        <td></td>
                        <td className="text-right px-2 py-2 tabular-nums">
                          {fmt(fondos.reduce((s, f) => s + f.rentabilidad.patrimonioInicio, 0))}
                        </td>
                        <td className="text-right px-2 py-2 tabular-nums">
                          {fmt(r?.valorActual ?? 0)}
                        </td>
                        <td className="text-right px-2 py-2 tabular-nums">
                          {fmt(fondos.reduce((s, f) => s + f.rentabilidad.desembolsos, 0))}
                        </td>
                        <td className="text-right px-2 py-2 tabular-nums">
                          {fmt(fondos.reduce((s, f) => s + f.rentabilidad.reembolsos, 0))}
                        </td>
                        <td
                          className={cn(
                            'text-right px-2 py-2 tabular-nums',
                            pnlColor(r?.rentabilidadPeriodoEur ?? 0)
                          )}
                        >
                          {fmt(r?.rentabilidadPeriodoEur ?? 0)}
                        </td>
                        <td
                          className={cn(
                            'text-right px-2 py-2 tabular-nums',
                            pnlColor(r?.rentabilidadPeriodoPct ?? 0)
                          )}
                        >
                          {(r?.rentabilidadPeriodoPct ?? 0).toFixed(2)}%
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Vintage Year Analysis + Vehículos */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Vintage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Análisis por Vintage Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(data?.vintages ?? []).map((v) => (
                  <div
                    key={v.year}
                    className="flex items-center justify-between py-1.5 border-b last:border-0"
                  >
                    <div>
                      <span className="font-bold text-sm">{v.year}</span>
                      <span className="text-xs text-gray-500 ml-2">{v.count} fondos</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="text-gray-500">Comprometido</div>
                        <div className="font-medium">{fmtK(v.comprometido)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500">Valoración</div>
                        <div className="font-medium">{fmtK(v.valoracion)}</div>
                      </div>
                      <div className={cn('font-bold', tvpiColor(v.tvpiAvg))}>
                        {v.tvpiAvg.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vehículos inversores */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Vehículos Inversores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(data?.vehiculos ?? []).map((v) => (
                  <div key={v.nombre} className="p-3 rounded-lg bg-gray-50 border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={isViblaVehicle(v.nombre) ? 'default' : 'secondary'}>
                        {isViblaVehicle(v.nombre) ? 'VIBLA SCR' : v.nombre}
                      </Badge>
                      <span className="text-xs text-gray-500">{v.fondos} fondos</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-gray-500">Comprometido</div>
                        <div className="font-bold">{fmtK(v.totalComprometido)}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Valoración</div>
                        <div className="font-bold">{fmtK(v.totalValoracion)}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {(data?.vehiculos ?? []).length === 0 && (
                  <div className="text-center text-gray-400 py-4">Sin datos de vehículos.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
