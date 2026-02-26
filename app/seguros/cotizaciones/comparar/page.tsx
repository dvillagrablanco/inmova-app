'use client';

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Shield,
  Euro,
  CheckCircle2,
  XCircle,
  Star,
  Award,
  TrendingDown,
  ArrowLeft,
  Brain,
  Download,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Cobertura {
  nombre: string;
  incluida: boolean;
  limite?: number;
  detalle?: string;
}

interface Exclusion {
  descripcion: string;
}

interface AnalisisIA {
  ranking?: number;
  pros?: string[];
  contras?: string[];
  recomendacion?: string;
  score?: number;
}

interface CotizacionDetalle {
  id: string;
  proveedor: string;
  tipoSeguro: string;
  primaAnual: number;
  primaMensual: number;
  sumaAsegurada: number;
  franquicia: number;
  scoreIA: number | null;
  estado: string;
  fechaRecepcion: string;
  fechaValidez?: string;
  coberturas: Cobertura[];
  exclusiones: Exclusion[];
  analisisIA?: AnalisisIA;
  condicionesEspeciales?: string;
}

interface IAComparisonResult {
  ranking: { cotizacionId: string; posicion: number; razon: string }[];
  recomendacionFinal: string;
  analisisPorCotizacion: Record<string, { pros: string[]; contras: string[]; valoracion: string }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

const formatDate = (iso: string) => {
  try {
    return format(new Date(iso), 'dd/MM/yyyy', { locale: es });
  } catch {
    return iso;
  }
};

function ScoreIAIndicator({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-sm text-muted-foreground">N/A</span>;
  }

  let colorClass: string;
  let emoji: string;
  if (score >= 80) {
    colorClass = 'text-green-600 dark:text-green-400';
    emoji = '🟢';
  } else if (score >= 60) {
    colorClass = 'text-yellow-600 dark:text-yellow-400';
    emoji = '🟡';
  } else {
    colorClass = 'text-red-600 dark:text-red-400';
    emoji = '🔴';
  }

  return (
    <span className={`font-semibold ${colorClass}`}>
      {score} {emoji}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ComparisonSkeleton() {
  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <Skeleton className="h-4 w-64" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-7 w-72" />
            <Skeleton className="mt-1 h-4 w-40" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-28" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-32" />
                <Skeleton className="mt-1 h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, r) => (
                <div key={r} className="flex gap-4">
                  {Array.from({ length: 4 }).map((_, c) => (
                    <Skeleton key={c} className="h-5 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

// ---------------------------------------------------------------------------
// Inner component that uses useSearchParams
// ---------------------------------------------------------------------------

function CompararCotizacionesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: _session, status: sessionStatus } = useSession();

  const [loading, setLoading] = useState(true);
  const [cotizaciones, setCotizaciones] = useState<CotizacionDetalle[]>([]);
  const [iaComparison, setIaComparison] = useState<IAComparisonResult | null>(null);
  const [analyzingIA, setAnalyzingIA] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const ids = useMemo(() => {
    const raw = searchParams.get('ids') || '';
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [searchParams]);

  // ---- Data fetching -------------------------------------------------------

  const fetchCotizaciones = useCallback(async () => {
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await fetch(`/api/seguros/cotizaciones/recibidas/${id}`);
          if (!res.ok) return null;
          const data = await res.json();
          return (data.data ?? data) as CotizacionDetalle;
        })
      );

      const valid = results.filter((r): r is CotizacionDetalle => r !== null);
      if (valid.length === 0) {
        toast.error('No se encontraron cotizaciones válidas');
      } else if (valid.length < ids.length) {
        toast.warning(`Se cargaron ${valid.length} de ${ids.length} cotizaciones`);
      }

      setCotizaciones(valid);
    } catch {
      toast.error('Error al cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    fetchCotizaciones();
  }, [sessionStatus, fetchCotizaciones]);

  // ---- Derived summary data ------------------------------------------------

  const summary = useMemo(() => {
    if (cotizaciones.length === 0) return null;

    const cheapest = [...cotizaciones].sort((a, b) => a.primaAnual - b.primaAnual)[0];

    const mostCoverage = [...cotizaciones].sort(
      (a, b) =>
        b.coberturas.filter((c) => c.incluida).length -
        a.coberturas.filter((c) => c.incluida).length
    )[0];

    const bestRatio = [...cotizaciones].sort((a, b) => {
      const ratioA = a.coberturas.filter((c) => c.incluida).length / (a.primaAnual || 1);
      const ratioB = b.coberturas.filter((c) => c.incluida).length / (b.primaAnual || 1);
      return ratioB - ratioA;
    })[0];

    const avgPrima = cotizaciones.reduce((sum, c) => sum + c.primaAnual, 0) / cotizaciones.length;

    return { cheapest, mostCoverage, bestRatio, avgPrima };
  }, [cotizaciones]);

  // ---- All unique coverage names -------------------------------------------

  const allCoverageNames = useMemo(() => {
    const names = new Set<string>();
    cotizaciones.forEach((c) => c.coberturas.forEach((cob) => names.add(cob.nombre)));
    return Array.from(names).sort();
  }, [cotizaciones]);

  // ---- Best value helpers --------------------------------------------------

  const bestValues = useMemo(() => {
    if (cotizaciones.length === 0) return {} as Record<string, string>;
    const map: Record<string, string> = {};

    const minPrima = Math.min(...cotizaciones.map((c) => c.primaAnual));
    const bestPrimaId = cotizaciones.find((c) => c.primaAnual === minPrima)?.id;
    if (bestPrimaId) map.primaAnual = bestPrimaId;

    const maxSuma = Math.max(...cotizaciones.map((c) => c.sumaAsegurada));
    const bestSumaId = cotizaciones.find((c) => c.sumaAsegurada === maxSuma)?.id;
    if (bestSumaId) map.sumaAsegurada = bestSumaId;

    const minFranquicia = Math.min(...cotizaciones.map((c) => c.franquicia));
    const bestFranqId = cotizaciones.find((c) => c.franquicia === minFranquicia)?.id;
    if (bestFranqId) map.franquicia = bestFranqId;

    const scores = cotizaciones.filter((c) => c.scoreIA !== null);
    if (scores.length > 0) {
      const maxScore = Math.max(...scores.map((c) => c.scoreIA!));
      const bestScoreId = scores.find((c) => c.scoreIA === maxScore)?.id;
      if (bestScoreId) map.scoreIA = bestScoreId;
    }

    return map;
  }, [cotizaciones]);

  // ---- Actions -------------------------------------------------------------

  const handleRequestIAAnalysis = async () => {
    if (cotizaciones.length < 2) {
      toast.error('Se necesitan al menos 2 cotizaciones para comparar con IA');
      return;
    }

    setAnalyzingIA(true);
    try {
      const res = await fetch('/api/seguros/cotizaciones/analisis-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare',
          cotizacionIds: cotizaciones.map((c) => c.id),
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();
      setIaComparison(data.data ?? data);
      toast.success('Análisis IA completado');
    } catch {
      toast.error('Error al solicitar análisis IA');
    } finally {
      setAnalyzingIA(false);
    }
  };

  const handleAccept = async (cotizacion: CotizacionDetalle) => {
    setAcceptingId(cotizacion.id);
    try {
      const res = await fetch(`/api/seguros/cotizaciones/recibidas/${cotizacion.id}/aceptar`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      toast.success(`Cotización de ${cotizacion.proveedor} aceptada`);
      setCotizaciones((prev) =>
        prev.map((c) => (c.id === cotizacion.id ? { ...c, estado: 'aceptada' } : c))
      );
    } catch {
      toast.error('Error al aceptar la cotización');
    } finally {
      setAcceptingId(null);
    }
  };

  const handleExport = () => {
    toast.info('Generando exportación...');
    // Placeholder – would generate a PDF/CSV
  };

  // ---- Render: edge cases --------------------------------------------------

  if (sessionStatus === 'loading' || loading) {
    return <ComparisonSkeleton />;
  }

  if (ids.length === 0) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <BreadcrumbNav />
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">No se han seleccionado cotizaciones</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Vuelve a la plataforma de cotizaciones y selecciona al menos 2 cotizaciones para
                comparar.
              </p>
              <Button className="mt-6" onClick={() => router.push('/seguros/cotizaciones')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Cotizaciones
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (ids.length === 1) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <BreadcrumbNav />
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-lg font-semibold">Se necesitan al menos 2 cotizaciones</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Selecciona una cotización adicional para poder hacer la comparativa lado a lado.
              </p>
              <Button className="mt-6" onClick={() => router.push('/seguros/cotizaciones')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Cotizaciones
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (cotizaciones.length === 0) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <BreadcrumbNav />
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <XCircle className="mb-4 h-12 w-12 text-destructive/60" />
              <h3 className="text-lg font-semibold">No se pudieron cargar las cotizaciones</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Los IDs proporcionados no corresponden a cotizaciones válidas o hubo un error de
                red.
              </p>
              <Button className="mt-6" onClick={() => router.push('/seguros/cotizaciones')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Cotizaciones
              </Button>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  // ---- Render: main comparison ---------------------------------------------

  const highlightCell = (cotId: string, field: string) =>
    bestValues[field] === cotId ? 'bg-green-50 dark:bg-green-950/30' : '';

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <BreadcrumbNav />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/seguros/cotizaciones')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Comparativa de Cotizaciones</h1>
              <p className="text-sm text-muted-foreground">
                Comparando {cotizaciones.length} cotizaciones
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRequestIAAnalysis} disabled={analyzingIA}>
              <Brain className="mr-2 h-4 w-4" />
              {analyzingIA ? 'Analizando...' : 'Análisis IA'}
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-green-200 dark:border-green-900">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Más Económica</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.cheapest.primaAnual)}
                </div>
                <p className="text-xs text-muted-foreground">{summary.cheapest.proveedor}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Mayor Cobertura</CardTitle>
                <Shield className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.mostCoverage.coberturas.filter((c) => c.incluida).length} coberturas
                </div>
                <p className="text-xs text-muted-foreground">{summary.mostCoverage.proveedor}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Mejor Calidad-Precio</CardTitle>
                <Award className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.bestRatio.proveedor}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.bestRatio.coberturas.filter((c) => c.incluida).length} cob. /{' '}
                  {formatCurrency(summary.bestRatio.primaAnual)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Prima Promedio</CardTitle>
                <Euro className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.avgPrima)}</div>
                <p className="text-xs text-muted-foreground">
                  Promedio de {cotizaciones.length} cotizaciones
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Comparativa General
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Atributo
                    </th>
                    {cotizaciones.map((cot) => (
                      <th key={cot.id} className="px-4 py-3 text-center text-sm font-medium">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline">{cot.proveedor}</Badge>
                          <span className="text-xs font-normal text-muted-foreground">
                            {cot.tipoSeguro}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Prima Anual */}
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">Prima Anual</td>
                    {cotizaciones.map((cot) => (
                      <td
                        key={cot.id}
                        className={`px-4 py-3 text-center text-sm font-semibold ${highlightCell(cot.id, 'primaAnual')}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(cot.primaAnual)}
                          {bestValues.primaAnual === cot.id && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Prima Mensual */}
                  <tr className="bg-muted/20">
                    <td className="px-4 py-3 text-sm font-medium">Prima Mensual</td>
                    {cotizaciones.map((cot) => {
                      const mensual = cot.primaMensual || cot.primaAnual / 12;
                      return (
                        <td key={cot.id} className="px-4 py-3 text-center text-sm">
                          {formatCurrency(mensual)}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Suma Asegurada */}
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">Suma Asegurada</td>
                    {cotizaciones.map((cot) => (
                      <td
                        key={cot.id}
                        className={`px-4 py-3 text-center text-sm font-semibold ${highlightCell(cot.id, 'sumaAsegurada')}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(cot.sumaAsegurada)}
                          {bestValues.sumaAsegurada === cot.id && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Franquicia */}
                  <tr className="bg-muted/20">
                    <td className="px-4 py-3 text-sm font-medium">Franquicia</td>
                    {cotizaciones.map((cot) => (
                      <td
                        key={cot.id}
                        className={`px-4 py-3 text-center text-sm ${highlightCell(cot.id, 'franquicia')}`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {formatCurrency(cot.franquicia)}
                          {bestValues.franquicia === cot.id && (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Score IA */}
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Score IA
                      </div>
                    </td>
                    {cotizaciones.map((cot) => (
                      <td
                        key={cot.id}
                        className={`px-4 py-3 text-center text-sm ${highlightCell(cot.id, 'scoreIA')}`}
                      >
                        <ScoreIAIndicator score={cot.scoreIA} />
                      </td>
                    ))}
                  </tr>

                  {/* Válida hasta */}
                  <tr className="bg-muted/20">
                    <td className="px-4 py-3 text-sm font-medium">Válida hasta</td>
                    {cotizaciones.map((cot) => (
                      <td
                        key={cot.id}
                        className="px-4 py-3 text-center text-sm text-muted-foreground"
                      >
                        {cot.fechaValidez ? formatDate(cot.fechaValidez) : '—'}
                      </td>
                    ))}
                  </tr>

                  {/* Estado */}
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium">Estado</td>
                    {cotizaciones.map((cot) => (
                      <td key={cot.id} className="px-4 py-3 text-center text-sm">
                        <Badge variant="outline" className="capitalize">
                          {cot.estado.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Coverage Matrix */}
        {allCoverageNames.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Matriz de Coberturas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        Cobertura
                      </th>
                      {cotizaciones.map((cot) => (
                        <th key={cot.id} className="px-4 py-3 text-center text-sm font-medium">
                          {cot.proveedor}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allCoverageNames.map((nombre, idx) => (
                      <tr key={nombre} className={idx % 2 === 1 ? 'bg-muted/20' : ''}>
                        <td className="px-4 py-2.5 text-sm">{nombre}</td>
                        {cotizaciones.map((cot) => {
                          const cob = cot.coberturas.find((c) => c.nombre === nombre);
                          const included = cob?.incluida ?? false;
                          return (
                            <td key={cot.id} className="px-4 py-2.5 text-center">
                              {included ? (
                                <div className="flex flex-col items-center">
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  {cob?.limite && (
                                    <span className="mt-0.5 text-[10px] text-muted-foreground">
                                      {formatCurrency(cob.limite)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <XCircle className="mx-auto h-5 w-5 text-muted-foreground/40" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="border-t-2 bg-muted/40 font-medium">
                      <td className="px-4 py-3 text-sm font-semibold">
                        Total coberturas incluidas
                      </td>
                      {cotizaciones.map((cot) => {
                        const total = cot.coberturas.filter((c) => c.incluida).length;
                        const max = Math.max(
                          ...cotizaciones.map(
                            (c) => c.coberturas.filter((cb) => cb.incluida).length
                          )
                        );
                        return (
                          <td
                            key={cot.id}
                            className={`px-4 py-3 text-center text-sm font-semibold ${
                              total === max ? 'text-green-600 dark:text-green-400' : ''
                            }`}
                          >
                            {total} / {allCoverageNames.length}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exclusions Section */}
        {cotizaciones.some((c) => c.exclusiones.length > 0) && (
          <>
            <Separator />
            <div>
              <h2 className="mb-4 text-lg font-semibold">Exclusiones</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cotizaciones.map((cot) => (
                  <Card key={cot.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{cot.proveedor}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {cot.exclusiones.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin exclusiones informadas</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {cot.exclusiones.map((exc, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                              <span className="text-muted-foreground">{exc.descripcion}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {/* IA Analysis Section */}
        {iaComparison && (
          <>
            <Separator />
            <Card className="border-purple-200 dark:border-purple-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Análisis Comparativo IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ranking */}
                {iaComparison.ranking && iaComparison.ranking.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Ranking</h3>
                    <div className="space-y-2">
                      {iaComparison.ranking
                        .sort((a, b) => a.posicion - b.posicion)
                        .map((item) => {
                          const cot = cotizaciones.find((c) => c.id === item.cotizacionId);
                          return (
                            <div
                              key={item.cotizacionId}
                              className="flex items-center gap-3 rounded-lg border p-3"
                            >
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                                  item.posicion === 1
                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
                                    : item.posicion === 2
                                      ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                      : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
                                }`}
                              >
                                {item.posicion}
                              </div>
                              <div className="flex-1">
                                <span className="font-medium">
                                  {cot?.proveedor ?? item.cotizacionId}
                                </span>
                                <p className="text-sm text-muted-foreground">{item.razon}</p>
                              </div>
                              {cot && (
                                <span className="text-sm font-semibold">
                                  {formatCurrency(cot.primaAnual)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Pros / Cons per quotation */}
                {iaComparison.analisisPorCotizacion && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Análisis por Cotización</h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {cotizaciones.map((cot) => {
                        const analysis = iaComparison.analisisPorCotizacion[cot.id];
                        if (!analysis) return null;
                        return (
                          <Card key={cot.id} className="shadow-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">{cot.proveedor}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              {analysis.pros.length > 0 && (
                                <div>
                                  <span className="font-medium text-green-600">Ventajas</span>
                                  <ul className="mt-1 space-y-1">
                                    {analysis.pros.map((pro, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                                        <span className="text-muted-foreground">{pro}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.contras.length > 0 && (
                                <div>
                                  <span className="font-medium text-red-600">Desventajas</span>
                                  <ul className="mt-1 space-y-1">
                                    {analysis.contras.map((con, i) => (
                                      <li key={i} className="flex items-start gap-1.5">
                                        <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                                        <span className="text-muted-foreground">{con}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.valoracion && (
                                <p className="rounded-md bg-muted/50 p-2 text-xs italic text-muted-foreground">
                                  {analysis.valoracion}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Final recommendation */}
                {iaComparison.recomendacionFinal && (
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/50">
                    <h3 className="mb-1 text-sm font-semibold text-purple-800 dark:text-purple-300">
                      Recomendación Final
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      {iaComparison.recomendacionFinal}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Action Buttons */}
        <Separator />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => router.push('/seguros/cotizaciones')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Cotizaciones
          </Button>

          <div className="flex flex-wrap gap-2">
            {!iaComparison && (
              <Button variant="outline" onClick={handleRequestIAAnalysis} disabled={analyzingIA}>
                <Brain className="mr-2 h-4 w-4" />
                {analyzingIA ? 'Analizando...' : 'Solicitar Análisis IA'}
              </Button>
            )}

            {cotizaciones.map((cot) => (
              <Button
                key={cot.id}
                onClick={() => handleAccept(cot)}
                disabled={acceptingId === cot.id || cot.estado === 'aceptada'}
                variant={cot.estado === 'aceptada' ? 'outline' : 'default'}
              >
                {cot.estado === 'aceptada' ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                    Aceptada
                  </>
                ) : acceptingId === cot.id ? (
                  'Procesando...'
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aceptar {cot.proveedor}
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// ---------------------------------------------------------------------------
// Breadcrumb sub-component
// ---------------------------------------------------------------------------

function BreadcrumbNav() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <Home className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/seguros">Seguros</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/seguros/cotizaciones">Cotizaciones</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Comparativa</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// ---------------------------------------------------------------------------
// Page export (Suspense boundary for useSearchParams)
// ---------------------------------------------------------------------------

export default function CompararCotizacionesPage() {
  return (
    <Suspense fallback={<ComparisonSkeleton />}>
      <CompararCotizacionesInner />
    </Suspense>
  );
}
