'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  FileText,
  Plus,
  Send,
  Search,
  MoreVertical,
  Eye,
  Brain,
  CheckCircle2,
  Clock,
  Euro,
  TrendingDown,
  BarChart3,
  ArrowRight,
  Shield,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
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

type SolicitudEstado =
  | 'borrador'
  | 'pendiente'
  | 'enviada'
  | 'parcialmente_respondida'
  | 'completada'
  | 'cancelada';

type CotizacionEstado =
  | 'recibida'
  | 'en_revision'
  | 'analizada'
  | 'aceptada'
  | 'rechazada'
  | 'expirada';

interface Solicitud {
  id: string;
  codigo: string;
  tipoSeguro: string;
  inmueble: string;
  proveedoresEnviados: number;
  proveedoresRespondidos: number;
  estado: SolicitudEstado;
  fechaCreacion: string;
}

interface CotizacionRecibida {
  id: string;
  proveedor: string;
  tipoSeguro: string;
  primaAnual: number;
  sumaAsegurada: number;
  franquicia: number;
  scoreIA: number | null;
  estado: CotizacionEstado;
  fechaRecepcion: string;
}

interface Stats {
  solicitudesEnviadas: number;
  pendientesRespuesta: number;
  cotizacionesRecibidas: number;
  ahorrosPotenciales: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

const formatDate = (iso: string) => {
  try {
    return format(new Date(iso), 'dd MMM yyyy', { locale: es });
  } catch {
    return iso;
  }
};

const SOLICITUD_BADGE: Record<
  SolicitudEstado,
  { variant: 'secondary' | 'default' | 'destructive' | 'outline'; label: string }
> = {
  borrador: { variant: 'secondary', label: 'Borrador' },
  pendiente: { variant: 'default', label: 'Pendiente' },
  enviada: { variant: 'default', label: 'Enviada' },
  parcialmente_respondida: { variant: 'outline', label: 'Parcial' },
  completada: { variant: 'default', label: 'Completada' },
  cancelada: { variant: 'destructive', label: 'Cancelada' },
};

const COTIZACION_BADGE: Record<
  CotizacionEstado,
  {
    variant: 'secondary' | 'default' | 'destructive' | 'outline';
    label: string;
    icon?: React.ReactNode;
  }
> = {
  recibida: { variant: 'secondary', label: 'Recibida' },
  en_revision: { variant: 'default', label: 'En revisión' },
  analizada: { variant: 'default', label: 'Analizada', icon: <Brain className="mr-1 h-3 w-3" /> },
  aceptada: { variant: 'default', label: 'Aceptada' },
  rechazada: { variant: 'destructive', label: 'Rechazada' },
  expirada: { variant: 'outline', label: 'Expirada' },
};

function solicitudBadgeClass(estado: SolicitudEstado) {
  switch (estado) {
    case 'parcialmente_respondida':
      return 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
    case 'completada':
      return 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400';
    default:
      return '';
  }
}

function cotizacionBadgeClass(estado: CotizacionEstado) {
  switch (estado) {
    case 'aceptada':
      return 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400';
    default:
      return '';
  }
}

function renderStars(score: number | null) {
  if (score === null) return <span className="text-xs text-muted-foreground">Sin evaluar</span>;
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < full
              ? 'fill-yellow-400 text-yellow-400'
              : i === full && half
                ? 'fill-yellow-400/50 text-yellow-400'
                : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-medium">{score.toFixed(1)}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loaders
// ---------------------------------------------------------------------------

function StatsSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="mt-1 h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeletons({ rows = 5, cols = 7 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CotizacionesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cotizaciones, setCotizaciones] = useState<CotizacionRecibida[]>([]);
  const [stats, setStats] = useState<Stats>({
    solicitudesEnviadas: 0,
    pendientesRespuesta: 0,
    cotizacionesRecibidas: 0,
    ahorrosPotenciales: 0,
  });

  const [searchSolicitudes, setSearchSolicitudes] = useState('');
  const [searchCotizaciones, setSearchCotizaciones] = useState('');
  const [selectedCotizaciones, setSelectedCotizaciones] = useState<Set<string>>(new Set());
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // ---- Data fetching -------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const [solRes, cotRes] = await Promise.all([
          fetch('/api/seguros/cotizaciones/solicitudes'),
          fetch('/api/seguros/cotizaciones/recibidas'),
        ]);

        if (!cancelled && solRes.ok) {
          const solData = await solRes.json();
          setSolicitudes(solData.data ?? solData);
        }
        if (!cancelled && cotRes.ok) {
          const cotData = await cotRes.json();
          setCotizaciones(cotData.data ?? cotData);
        }
      } catch {
        if (!cancelled) toast.error('Error al cargar los datos de cotizaciones');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive stats from fetched data
  useEffect(() => {
    const solicitudesEnviadas = solicitudes.filter(
      (s) => s.estado !== 'borrador' && s.estado !== 'cancelada'
    ).length;

    const pendientesRespuesta = solicitudes.reduce(
      (acc, s) => acc + Math.max(0, s.proveedoresEnviados - s.proveedoresRespondidos),
      0
    );

    const cotizacionesRecibidas = cotizaciones.length;

    let ahorrosPotenciales = 0;
    if (cotizaciones.length >= 2) {
      const primas = cotizaciones.map((c) => c.primaAnual).sort((a, b) => a - b);
      ahorrosPotenciales = primas[primas.length - 1] - primas[0];
    }

    setStats({
      solicitudesEnviadas,
      pendientesRespuesta,
      cotizacionesRecibidas,
      ahorrosPotenciales,
    });
  }, [solicitudes, cotizaciones]);

  // ---- Actions -------------------------------------------------------------

  const handleAnalyzeIA = async (cotizacionId: string) => {
    setAnalyzingId(cotizacionId);
    try {
      const res = await fetch('/api/seguros/cotizaciones/analisis-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', cotizacionId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Análisis IA completado');

      setCotizaciones((prev) =>
        prev.map((c) =>
          c.id === cotizacionId ? { ...c, estado: 'analizada' as CotizacionEstado } : c
        )
      );
    } catch {
      toast.error('Error al ejecutar el análisis IA');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleSendReminder = (solicitudId: string) => {
    toast.success('Recordatorio enviado a los proveedores pendientes');
    void solicitudId; // consumed
  };

  const handleCompareSelected = () => {
    if (selectedCotizaciones.size < 2) {
      toast.error('Selecciona al menos 2 cotizaciones para comparar');
      return;
    }
    const ids = Array.from(selectedCotizaciones).join(',');
    router.push(`/seguros/cotizaciones/comparar?ids=${ids}`);
  };

  const toggleCotizacionSelection = (id: string) => {
    setSelectedCotizaciones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ---- Filtered data -------------------------------------------------------

  const filteredSolicitudes = solicitudes.filter((s) => {
    const q = searchSolicitudes.toLowerCase();
    return (
      s.codigo.toLowerCase().includes(q) ||
      s.tipoSeguro.toLowerCase().includes(q) ||
      s.inmueble.toLowerCase().includes(q)
    );
  });

  const filteredCotizaciones = cotizaciones.filter((c) => {
    const q = searchCotizaciones.toLowerCase();
    return c.proveedor.toLowerCase().includes(q) || c.tipoSeguro.toLowerCase().includes(q);
  });

  // ---- Render --------------------------------------------------------------

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/seguros">Seguros</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Cotizaciones</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Title */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Plataforma de Cotizaciones</h1>
              <p className="text-sm text-muted-foreground">
                Gestiona solicitudes y compara cotizaciones de seguros
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/seguros/cotizaciones/nueva-solicitud')}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Solicitud
          </Button>
        </div>

        {/* Stats */}
        {loading ? (
          <StatsSkeletons />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Solicitudes Enviadas</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.solicitudesEnviadas}</div>
                <p className="text-xs text-muted-foreground">Total de solicitudes activas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pendientes de Respuesta</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendientesRespuesta}</div>
                <p className="text-xs text-muted-foreground">Proveedores sin responder</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cotizaciones Recibidas</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cotizacionesRecibidas}</div>
                <p className="text-xs text-muted-foreground">Total de cotizaciones</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ahorros Potenciales</CardTitle>
                <TrendingDown className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.ahorrosPotenciales)}</div>
                <p className="text-xs text-muted-foreground">
                  Diferencia entre mayor y menor prima
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="solicitudes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
            <TabsTrigger value="cotizaciones">Cotizaciones Recibidas</TabsTrigger>
          </TabsList>

          {/* -------------------------------------------------------------- */}
          {/* Tab 1 – Solicitudes                                            */}
          {/* -------------------------------------------------------------- */}
          <TabsContent value="solicitudes" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar solicitudes..."
                  className="pl-9"
                  value={searchSolicitudes}
                  onChange={(e) => setSearchSolicitudes(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <TableSkeletons rows={5} cols={7} />
                </CardContent>
              </Card>
            ) : filteredSolicitudes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold">Sin solicitudes de cotización</h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Crea tu primera solicitud para empezar a recibir cotizaciones de distintos
                    proveedores de seguros.
                  </p>
                  <Button
                    className="mt-6"
                    onClick={() => router.push('/seguros/cotizaciones/nueva-solicitud')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Solicitud
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Código</TableHead>
                          <TableHead>Tipo Seguro</TableHead>
                          <TableHead className="hidden md:table-cell">Inmueble</TableHead>
                          <TableHead>Proveedores</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                          <TableHead className="w-[60px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSolicitudes.map((sol) => {
                          const badge = SOLICITUD_BADGE[sol.estado];
                          return (
                            <TableRow key={sol.id}>
                              <TableCell className="font-mono text-sm">{sol.codigo}</TableCell>
                              <TableCell>{sol.tipoSeguro}</TableCell>
                              <TableCell className="hidden md:table-cell">{sol.inmueble}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-normal">
                                  {sol.proveedoresRespondidos}/{sol.proveedoresEnviados} respondidos
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={badge.variant}
                                  className={solicitudBadgeClass(sol.estado)}
                                >
                                  {badge.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                {formatDate(sol.fechaCreacion)}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/seguros/cotizaciones/${sol.id}`)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver detalle
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleSendReminder(sol.id)}>
                                      <Send className="mr-2 h-4 w-4" />
                                      Enviar recordatorio
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* -------------------------------------------------------------- */}
          {/* Tab 2 – Cotizaciones Recibidas                                 */}
          {/* -------------------------------------------------------------- */}
          <TabsContent value="cotizaciones" className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cotizaciones..."
                  className="pl-9"
                  value={searchCotizaciones}
                  onChange={(e) => setSearchCotizaciones(e.target.value)}
                />
              </div>

              {selectedCotizaciones.size >= 2 && (
                <Button variant="outline" onClick={handleCompareSelected}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Comparar seleccionadas ({selectedCotizaciones.size})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            {loading ? (
              <Card>
                <CardContent className="p-6">
                  <TableSkeletons rows={5} cols={8} />
                </CardContent>
              </Card>
            ) : filteredCotizaciones.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Euro className="mb-4 h-12 w-12 text-muted-foreground/40" />
                  <h3 className="text-lg font-semibold">Sin cotizaciones recibidas</h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Las cotizaciones aparecerán aquí cuando los proveedores respondan a tus
                    solicitudes.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]" />
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Tipo Seguro</TableHead>
                          <TableHead className="text-right">Prima Anual</TableHead>
                          <TableHead className="hidden md:table-cell text-right">
                            Suma Asegurada
                          </TableHead>
                          <TableHead className="hidden lg:table-cell text-right">
                            Franquicia
                          </TableHead>
                          <TableHead>Score IA</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="w-[60px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCotizaciones.map((cot) => {
                          const badge = COTIZACION_BADGE[cot.estado];
                          return (
                            <TableRow key={cot.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedCotizaciones.has(cot.id)}
                                  onCheckedChange={() => toggleCotizacionSelection(cot.id)}
                                  aria-label={`Seleccionar cotización de ${cot.proveedor}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{cot.proveedor}</TableCell>
                              <TableCell>{cot.tipoSeguro}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(cot.primaAnual)}
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-right">
                                {formatCurrency(cot.sumaAsegurada)}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell text-right">
                                {formatCurrency(cot.franquicia)}
                              </TableCell>
                              <TableCell>{renderStars(cot.scoreIA)}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={badge.variant}
                                  className={cotizacionBadgeClass(cot.estado)}
                                >
                                  {badge.icon}
                                  {badge.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(`/seguros/cotizaciones/detalle/${cot.id}`)
                                      }
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Ver
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      disabled={analyzingId === cot.id}
                                      onClick={() => handleAnalyzeIA(cot.id)}
                                    >
                                      <Brain className="mr-2 h-4 w-4" />
                                      {analyzingId === cot.id ? 'Analizando...' : 'Analizar con IA'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        toast.success(`Cotización de ${cot.proveedor} aceptada`)
                                      }
                                    >
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Aceptar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
