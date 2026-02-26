'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  ArrowLeft,
  Send,
  BarChart3,
  Brain,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Building2,
  MapPin,
  Ruler,
  Calendar,
  Euro,
  Star,
  Plus,
  Mail,
  Home,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface ProviderEntry {
  id: string;
  providerId: string;
  provider: {
    id: string;
    nombre: string;
    email: string | null;
    contactoEmail: string | null;
    contactoNombre: string | null;
  };
  emailEnviado: boolean;
  fechaEnvioEmail: string | null;
  emailDestinatario: string | null;
  respondido: boolean;
  fechaRespuesta: string | null;
}

interface Quotation {
  id: string;
  providerId: string;
  provider: {
    id: string;
    nombre: string;
    email: string | null;
    logoUrl: string | null;
  };
  codigo: string | null;
  tipoSeguro: string;
  primaAnual: number;
  primaMensual: number | null;
  sumaAsegurada: number;
  franquicia: number | null;
  coberturas: string[];
  exclusiones: string[];
  condicionesEspeciales: string | null;
  validaHasta: string | null;
  estado: CotizacionEstado;
  scoreIA: number | null;
  analisisIA: AnalisisIA | null;
  notas: string | null;
  createdAt: string;
}

interface BuildingInfo {
  id: string;
  nombre: string;
  direccion: string;
}

interface Solicitud {
  id: string;
  codigo: string;
  tipoSeguro: string;
  descripcion: string;
  estado: SolicitudEstado;
  sumaAsegurada: number | null;
  coberturasSolicitadas: string[];
  direccionInmueble: string | null;
  superficieM2: number | null;
  anoConstruccion: number | null;
  usoPrincipal: string | null;
  buildingId: string | null;
  building: BuildingInfo | null;
  fechaEnvio: string | null;
  fechaLimiteRespuesta: string | null;
  analisisIA: AnalisisComparativo | null;
  proveedores: ProviderEntry[];
  quotations: Quotation[];
  createdAt: string;
  updatedAt: string;
}

interface AnalisisIA {
  score: number;
  pros: string[];
  cons: string[];
  recomendacion: string;
  riesgos?: string[];
}

interface AnalisisComparativo {
  resumen: string;
  recomendacion: string;
  cotizaciones: Array<{
    quotationId: string;
    proveedorNombre: string;
    score: number;
    pros: string[];
    cons: string[];
  }>;
}

interface QuotationFormData {
  primaAnual: string;
  primaMensual: string;
  sumaAsegurada: string;
  franquicia: string;
  coberturas: string;
  exclusiones: string;
  condicionesEspeciales: string;
  validaHasta: string;
  notas: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIPOS_SEGURO_LABELS: Record<string, string> = {
  incendio: 'Incendio',
  robo: 'Robo',
  responsabilidad_civil: 'Responsabilidad Civil',
  hogar: 'Hogar',
  comunidad: 'Comunidad / Edificio',
  vida: 'Vida',
  accidentes: 'Accidentes',
  impago_alquiler: 'Impago de Alquiler',
  otro: 'Otro',
};

const USOS_LABELS: Record<string, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  mixto: 'Mixto',
};

const ESTADO_BANNER: Record<
  SolicitudEstado,
  { icon: React.ElementType; label: string; className: string }
> = {
  borrador: {
    icon: FileText,
    label: 'Borrador - Pendiente de envío',
    className: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
  },
  pendiente: {
    icon: Clock,
    label: 'Pendiente - Preparada para envío',
    className: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
  },
  enviada: {
    icon: Send,
    label: 'Enviada - Esperando respuestas de proveedores',
    className:
      'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-400',
  },
  parcialmente_respondida: {
    icon: Clock,
    label: 'Respuestas parciales',
    className:
      'border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400',
  },
  completada: {
    icon: CheckCircle2,
    label: 'Completada - Todas las respuestas recibidas',
    className:
      'border-green-300 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400',
  },
  cancelada: {
    icon: XCircle,
    label: 'Cancelada',
    className:
      'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400',
  },
};

const COTIZACION_BADGE: Record<CotizacionEstado, { label: string; className: string }> = {
  recibida: {
    label: 'Recibida',
    className: 'border-transparent bg-secondary text-secondary-foreground',
  },
  en_revision: {
    label: 'En revisión',
    className: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  },
  analizada: {
    label: 'Analizada',
    className:
      'border-transparent bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400',
  },
  aceptada: {
    label: 'Aceptada',
    className: 'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
  },
  rechazada: {
    label: 'Rechazada',
    className: 'border-transparent bg-destructive text-destructive-foreground',
  },
  expirada: {
    label: 'Expirada',
    className: 'border-muted-foreground/40 bg-transparent text-muted-foreground',
  },
};

const EMPTY_FORM: QuotationFormData = {
  primaAnual: '',
  primaMensual: '',
  sumaAsegurada: '',
  franquicia: '',
  coberturas: '',
  exclusiones: '',
  condicionesEspeciales: '',
  validaHasta: '',
  notas: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

const formatDate = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    return format(new Date(iso), 'dd MMM yyyy', { locale: es });
  } catch {
    return iso;
  }
};

const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return '—';
  try {
    return format(new Date(iso), "dd MMM yyyy 'a las' HH:mm", { locale: es });
  } catch {
    return iso;
  }
};

const getTipoLabel = (v: string) => TIPOS_SEGURO_LABELS[v] ?? v;
const getUsoLabel = (v: string) => USOS_LABELS[v] ?? v;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreIABadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="text-xs text-muted-foreground">Sin evaluar</span>;
  }

  let colorClass: string;
  if (score >= 80) {
    colorClass =
      'border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400';
  } else if (score >= 60) {
    colorClass =
      'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
  } else {
    colorClass = 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400';
  }

  return (
    <Badge variant="outline" className={`gap-1 font-medium ${colorClass}`}>
      <Star className="h-3 w-3" />
      {score}
    </Badge>
  );
}

function DetailSkeletons() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-64" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-14 w-full rounded-lg" />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Skeleton className="h-10 w-96" />
      <Card>
        <CardContent className="space-y-3 p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SolicitudCotizacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const solicitudId = params.id as string;
  const { data: _session, status: sessionStatus } = useSession();

  const [loading, setLoading] = useState(true);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);

  // Dialog state
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  const [selectedProviderForQuotation, setSelectedProviderForQuotation] =
    useState<ProviderEntry | null>(null);
  const [quotationForm, setQuotationForm] = useState<QuotationFormData>(EMPTY_FORM);
  const [submittingQuotation, setSubmittingQuotation] = useState(false);

  // Action states
  const [sendingToProviders, setSendingToProviders] = useState(false);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analyzingQuotationId, setAnalyzingQuotationId] = useState<string | null>(null);
  const [acceptingQuotationId, setAcceptingQuotationId] = useState<string | null>(null);

  // ------ Data Fetching ---------------------------------------------------

  const fetchSolicitud = useCallback(async () => {
    try {
      const res = await fetch(`/api/seguros/cotizaciones/solicitudes/${solicitudId}`);
      if (!res.ok) throw new Error('Error al cargar solicitud');
      const data = await res.json();
      setSolicitud(data);
    } catch {
      toast.error('Error al cargar los datos de la solicitud');
    } finally {
      setLoading(false);
    }
  }, [solicitudId]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return;
    fetchSolicitud();
  }, [sessionStatus, fetchSolicitud]);

  // ------ Actions ---------------------------------------------------------

  const handleSendToProviders = async () => {
    if (!solicitud) return;
    setSendingToProviders(true);
    try {
      const res = await fetch(`/api/seguros/cotizaciones/solicitudes/${solicitud.id}/enviar`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      const result = await res.json();
      toast.success(result.message || 'Solicitud enviada a proveedores');
      await fetchSolicitud();
    } catch {
      toast.error('Error al enviar la solicitud a proveedores');
    } finally {
      setSendingToProviders(false);
    }
  };

  const handleRunComparativeAnalysis = async () => {
    if (!solicitud || solicitud.quotations.length < 2) {
      toast.error('Se necesitan al menos 2 cotizaciones para el análisis comparativo');
      return;
    }
    setRunningAnalysis(true);
    try {
      const res = await fetch('/api/seguros/cotizaciones/analisis-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'compare',
          quotationIds: solicitud.quotations.map((q) => q.id),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Análisis IA comparativo completado');
      await fetchSolicitud();
    } catch {
      toast.error('Error al ejecutar el análisis IA');
    } finally {
      setRunningAnalysis(false);
    }
  };

  const handleAnalyzeQuotation = async (quotationId: string) => {
    setAnalyzingQuotationId(quotationId);
    try {
      const res = await fetch('/api/seguros/cotizaciones/analisis-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', quotationId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Análisis IA completado');
      await fetchSolicitud();
    } catch {
      toast.error('Error al analizar la cotización');
    } finally {
      setAnalyzingQuotationId(null);
    }
  };

  const handleAcceptQuotation = async (quotationId: string, providerName: string) => {
    setAcceptingQuotationId(quotationId);
    try {
      const res = await fetch(`/api/seguros/cotizaciones/recibidas/${quotationId}/aceptar`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error();
      toast.success(`Cotización de ${providerName} aceptada`);
      await fetchSolicitud();
    } catch {
      toast.error('Error al aceptar la cotización');
    } finally {
      setAcceptingQuotationId(null);
    }
  };

  // ------ Quotation Registration Dialog -----------------------------------

  const openQuotationDialog = (provEntry: ProviderEntry) => {
    setSelectedProviderForQuotation(provEntry);
    setQuotationForm({
      ...EMPTY_FORM,
      sumaAsegurada: solicitud?.sumaAsegurada?.toString() ?? '',
    });
    setQuotationDialogOpen(true);
  };

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitud || !selectedProviderForQuotation) return;

    const primaAnual = parseFloat(quotationForm.primaAnual);
    const sumaAsegurada = parseFloat(quotationForm.sumaAsegurada);
    if (isNaN(primaAnual) || primaAnual <= 0) {
      toast.error('La prima anual es obligatoria y debe ser positiva');
      return;
    }
    if (isNaN(sumaAsegurada) || sumaAsegurada <= 0) {
      toast.error('La suma asegurada es obligatoria y debe ser positiva');
      return;
    }

    setSubmittingQuotation(true);
    try {
      const payload = {
        requestId: solicitud.id,
        providerId: selectedProviderForQuotation.providerId,
        tipoSeguro: solicitud.tipoSeguro,
        primaAnual,
        primaMensual: quotationForm.primaMensual ? parseFloat(quotationForm.primaMensual) : null,
        sumaAsegurada,
        franquicia: quotationForm.franquicia ? parseFloat(quotationForm.franquicia) : null,
        coberturas: quotationForm.coberturas
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        exclusiones: quotationForm.exclusiones
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean),
        condicionesEspeciales: quotationForm.condicionesEspeciales || null,
        validaHasta: quotationForm.validaHasta || null,
        notas: quotationForm.notas || null,
      };

      const res = await fetch('/api/seguros/cotizaciones/recibidas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Error al registrar cotización');
      }

      toast.success(`Cotización de ${selectedProviderForQuotation.provider.nombre} registrada`);
      setQuotationDialogOpen(false);
      await fetchSolicitud();
    } catch (error: any) {
      toast.error(error?.message || 'Error al registrar la cotización');
    } finally {
      setSubmittingQuotation(false);
    }
  };

  const updateQuotationField = (key: keyof QuotationFormData, value: string) => {
    setQuotationForm((prev) => ({ ...prev, [key]: value }));
  };

  // ------ Derived values --------------------------------------------------

  const respondidos = solicitud?.proveedores.filter((p) => p.respondido).length ?? 0;
  const totalProveedores = solicitud?.proveedores.length ?? 0;
  const canSend = solicitud?.estado === 'borrador' || solicitud?.estado === 'pendiente';
  const hasQuotations = (solicitud?.quotations.length ?? 0) > 0;

  // ------ Loading / Error states ------------------------------------------

  if (sessionStatus === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <DetailSkeletons />
      </AuthenticatedLayout>
    );
  }

  if (!solicitud) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h2 className="text-2xl font-bold mb-2">Solicitud no encontrada</h2>
          <p className="text-muted-foreground mb-6">
            La solicitud que buscas no existe o no tienes acceso a ella.
          </p>
          <Button onClick={() => router.push('/seguros/cotizaciones')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Cotizaciones
          </Button>
        </div>
      </AuthenticatedLayout>
    );
  }

  const banner = ESTADO_BANNER[solicitud.estado];
  const BannerIcon = banner.icon;

  const bannerLabel =
    solicitud.estado === 'parcialmente_respondida'
      ? `Respuestas parciales - ${respondidos} de ${totalProveedores} proveedores han respondido`
      : banner.label;

  // ------ Render ----------------------------------------------------------

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
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
              <BreadcrumbLink href="/seguros">Seguros</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/seguros/cotizaciones">Cotizaciones</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{solicitud.codigo}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mt-1 shrink-0"
              onClick={() => router.push('/seguros/cotizaciones')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Solicitud {solicitud.codigo}</h1>
              <p className="text-sm text-muted-foreground">{getTipoLabel(solicitud.tipoSeguro)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {canSend && (
              <Button onClick={handleSendToProviders} disabled={sendingToProviders}>
                {sendingToProviders ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar a Proveedores
              </Button>
            )}
            {hasQuotations && (
              <>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/seguros/cotizaciones/comparar?solicitudId=${solicitud.id}`)
                  }
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Comparar Cotizaciones
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRunComparativeAnalysis}
                  disabled={runningAnalysis || solicitud.quotations.length < 2}
                >
                  {runningAnalysis ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Brain className="mr-2 h-4 w-4" />
                  )}
                  Análisis IA
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 rounded-lg border p-4 ${banner.className}`}>
          <BannerIcon className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{bannerLabel}</span>
        </div>

        {/* Info Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left: Datos de la Solicitud */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Datos de la Solicitud
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tipo de Seguro</span>
                <Badge variant="secondary">{getTipoLabel(solicitud.tipoSeguro)}</Badge>
              </div>
              <Separator />
              {solicitud.direccionInmueble && (
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-muted-foreground flex items-center gap-1 shrink-0">
                    <MapPin className="h-3.5 w-3.5" />
                    Dirección
                  </span>
                  <span className="text-sm font-medium text-right">
                    {solicitud.direccionInmueble}
                  </span>
                </div>
              )}
              {solicitud.superficieM2 != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" />
                    Superficie
                  </span>
                  <span className="text-sm font-medium">{solicitud.superficieM2} m²</span>
                </div>
              )}
              {solicitud.anoConstruccion != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Año Construcción
                  </span>
                  <span className="text-sm font-medium">{solicitud.anoConstruccion}</span>
                </div>
              )}
              {solicitud.usoPrincipal && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uso Principal</span>
                  <span className="text-sm font-medium">{getUsoLabel(solicitud.usoPrincipal)}</span>
                </div>
              )}
              {solicitud.sumaAsegurada != null && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Euro className="h-3.5 w-3.5" />
                    Suma Asegurada
                  </span>
                  <span className="text-sm font-bold">
                    {formatCurrency(solicitud.sumaAsegurada)}
                  </span>
                </div>
              )}
              {solicitud.coberturasSolicitadas.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <span className="text-sm text-muted-foreground">Coberturas Solicitadas</span>
                    <div className="flex flex-wrap gap-1.5">
                      {solicitud.coberturasSolicitadas.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {solicitud.descripcion && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Descripción</span>
                    <p className="text-sm whitespace-pre-wrap">{solicitud.descripcion}</p>
                  </div>
                </>
              )}
              {solicitud.fechaLimiteRespuesta && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Fecha Límite
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(solicitud.fechaLimiteRespuesta)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Datos del Edificio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Datos del Edificio / Propiedad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {solicitud.building ? (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nombre</span>
                    <span className="text-sm font-medium">{solicitud.building.nombre}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-sm text-muted-foreground">Dirección</span>
                    <span className="text-sm font-medium text-right">
                      {solicitud.building.direccion}
                    </span>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Código</span>
                      <p className="font-medium">{solicitud.codigo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Creada</span>
                      <p className="font-medium">{formatDate(solicitud.createdAt)}</p>
                    </div>
                    {solicitud.fechaEnvio && (
                      <div>
                        <span className="text-muted-foreground">Enviada</span>
                        <p className="font-medium">{formatDateTime(solicitud.fechaEnvio)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Building2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Sin edificio asignado</p>
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm w-full">
                    <div>
                      <span className="text-muted-foreground">Código</span>
                      <p className="font-medium">{solicitud.codigo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Creada</span>
                      <p className="font-medium">{formatDate(solicitud.createdAt)}</p>
                    </div>
                    {solicitud.fechaEnvio && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Enviada</span>
                        <p className="font-medium">{formatDateTime(solicitud.fechaEnvio)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="proveedores" className="space-y-4">
          <TabsList>
            <TabsTrigger value="proveedores">Proveedores ({totalProveedores})</TabsTrigger>
            <TabsTrigger value="cotizaciones">
              Cotizaciones Recibidas ({solicitud.quotations.length})
            </TabsTrigger>
            <TabsTrigger value="analisis">Análisis IA</TabsTrigger>
          </TabsList>

          {/* ------------------------------------------------------------ */}
          {/* Tab 1: Proveedores                                           */}
          {/* ------------------------------------------------------------ */}
          <TabsContent value="proveedores" className="space-y-4">
            {solicitud.proveedores.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Mail className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <h3 className="font-semibold">Sin proveedores asignados</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    No hay proveedores vinculados a esta solicitud.
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
                          <TableHead>Proveedor</TableHead>
                          <TableHead>Email Enviado</TableHead>
                          <TableHead className="hidden md:table-cell">Email Destinatario</TableHead>
                          <TableHead>Respondido</TableHead>
                          <TableHead className="w-[160px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {solicitud.proveedores.map((prov) => (
                          <TableRow key={prov.id}>
                            <TableCell className="font-medium">{prov.provider.nombre}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {prov.emailEnviado ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                {prov.fechaEnvioEmail && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(prov.fechaEnvioEmail)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {prov.emailDestinatario ||
                                prov.provider.contactoEmail ||
                                prov.provider.email ||
                                '—'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {prov.respondido ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-muted-foreground" />
                                )}
                                {prov.fechaRespuesta && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(prov.fechaRespuesta)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {!prov.respondido ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openQuotationDialog(prov)}
                                >
                                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                                  Registrar Cotización
                                </Button>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Registrada
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ------------------------------------------------------------ */}
          {/* Tab 2: Cotizaciones Recibidas                                */}
          {/* ------------------------------------------------------------ */}
          <TabsContent value="cotizaciones" className="space-y-4">
            {solicitud.quotations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <h3 className="font-semibold">Sin cotizaciones recibidas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Las cotizaciones aparecerán aquí cuando registres las respuestas de los
                    proveedores.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {solicitud.quotations.map((q) => {
                  const estadoBadge = COTIZACION_BADGE[q.estado];
                  return (
                    <Card key={q.id} className="relative overflow-hidden">
                      {q.estado === 'aceptada' && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-green-500" />
                      )}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{q.provider.nombre}</CardTitle>
                            {q.codigo && (
                              <CardDescription className="font-mono text-xs">
                                Ref: {q.codigo}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <ScoreIABadge score={q.scoreIA} />
                            <Badge variant="outline" className={estadoBadge.className}>
                              {estadoBadge.label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-muted-foreground">Prima Anual</span>
                            <p className="text-lg font-bold">{formatCurrency(q.primaAnual)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Prima Mensual</span>
                            <p className="text-lg font-bold">
                              {q.primaMensual
                                ? formatCurrency(q.primaMensual)
                                : formatCurrency(q.primaAnual / 12)}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Suma Asegurada</span>
                            <p className="text-sm font-medium">{formatCurrency(q.sumaAsegurada)}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Franquicia</span>
                            <p className="text-sm font-medium">
                              {q.franquicia != null ? formatCurrency(q.franquicia) : '—'}
                            </p>
                          </div>
                        </div>

                        {q.coberturas.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">
                              Coberturas ({q.coberturas.length})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {q.coberturas.slice(0, 5).map((c) => (
                                <Badge
                                  key={c}
                                  variant="secondary"
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {c}
                                </Badge>
                              ))}
                              {q.coberturas.length > 5 && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  +{q.coberturas.length - 5} más
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {q.validaHasta && (
                          <p className="text-xs text-muted-foreground">
                            Válida hasta: {formatDate(q.validaHasta)}
                          </p>
                        )}

                        <Separator />

                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/seguros/cotizaciones/detalle/${q.id}`)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Ver detalle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={analyzingQuotationId === q.id}
                            onClick={() => handleAnalyzeQuotation(q.id)}
                          >
                            {analyzingQuotationId === q.id ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Brain className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Analizar IA
                          </Button>
                          {q.estado !== 'aceptada' && q.estado !== 'rechazada' && (
                            <Button
                              size="sm"
                              disabled={acceptingQuotationId === q.id}
                              onClick={() => handleAcceptQuotation(q.id, q.provider.nombre)}
                            >
                              {acceptingQuotationId === q.id ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                              )}
                              Aceptar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ------------------------------------------------------------ */}
          {/* Tab 3: Análisis IA                                           */}
          {/* ------------------------------------------------------------ */}
          <TabsContent value="analisis" className="space-y-4">
            {solicitud.analisisIA ? (
              <AnalisisIASection analisis={solicitud.analisisIA} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Sparkles className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <h3 className="font-semibold">Sin análisis IA disponible</h3>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    {solicitud.quotations.length < 2
                      ? 'Necesitas al menos 2 cotizaciones recibidas para ejecutar un análisis comparativo con IA.'
                      : 'Ejecuta un análisis comparativo para obtener una evaluación inteligente de las cotizaciones.'}
                  </p>
                  {solicitud.quotations.length >= 2 && (
                    <Button
                      className="mt-6"
                      onClick={handleRunComparativeAnalysis}
                      disabled={runningAnalysis}
                    >
                      {runningAnalysis ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="mr-2 h-4 w-4" />
                      )}
                      Ejecutar Análisis IA Comparativo
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Individual quotation analyses */}
            {solicitud.quotations.some((q) => q.analisisIA) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Análisis Individual</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {solicitud.quotations
                    .filter((q) => q.analisisIA)
                    .map((q) => {
                      const a = q.analisisIA as AnalisisIA;
                      return (
                        <Card key={q.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{q.provider.nombre}</CardTitle>
                              <ScoreIABadge score={a.score} />
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {a.pros?.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                                  Ventajas
                                </span>
                                <ul className="space-y-0.5">
                                  {a.pros.map((p, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs">
                                      <ThumbsUp className="mt-0.5 h-3 w-3 shrink-0 text-green-600" />
                                      {p}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {a.cons?.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-xs font-medium text-red-700 dark:text-red-400">
                                  Desventajas
                                </span>
                                <ul className="space-y-0.5">
                                  {a.cons.map((c, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-xs">
                                      <ThumbsDown className="mt-0.5 h-3 w-3 shrink-0 text-red-600" />
                                      {c}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {a.recomendacion && (
                              <div className="rounded-md bg-muted/50 p-2">
                                <p className="text-xs">{a.recomendacion}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ================================================================ */}
      {/* Dialog: Registrar Cotización                                     */}
      {/* ================================================================ */}
      <Dialog open={quotationDialogOpen} onOpenChange={setQuotationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Cotización</DialogTitle>
            <DialogDescription>
              Registra la cotización recibida de{' '}
              <strong>{selectedProviderForQuotation?.provider.nombre}</strong>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitQuotation} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="q-primaAnual">
                  Prima Anual (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="q-primaAnual"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej: 850.00"
                  value={quotationForm.primaAnual}
                  onChange={(e) => updateQuotationField('primaAnual', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-primaMensual">Prima Mensual (€)</Label>
                <Input
                  id="q-primaMensual"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Opcional"
                  value={quotationForm.primaMensual}
                  onChange={(e) => updateQuotationField('primaMensual', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-sumaAsegurada">
                  Suma Asegurada (€) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="q-sumaAsegurada"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej: 250000"
                  value={quotationForm.sumaAsegurada}
                  onChange={(e) => updateQuotationField('sumaAsegurada', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="q-franquicia">Franquicia / Deducible (€)</Label>
                <Input
                  id="q-franquicia"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Opcional"
                  value={quotationForm.franquicia}
                  onChange={(e) => updateQuotationField('franquicia', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-coberturas">Coberturas (una por línea)</Label>
              <Textarea
                id="q-coberturas"
                placeholder={'Incendio y explosión\nDaños por agua\nResponsabilidad civil'}
                rows={4}
                value={quotationForm.coberturas}
                onChange={(e) => updateQuotationField('coberturas', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-exclusiones">Exclusiones (una por línea)</Label>
              <Textarea
                id="q-exclusiones"
                placeholder="Desgaste por uso normal\nDaños intencionados"
                rows={3}
                value={quotationForm.exclusiones}
                onChange={(e) => updateQuotationField('exclusiones', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-condiciones">Condiciones Especiales</Label>
              <Textarea
                id="q-condiciones"
                placeholder="Condiciones o cláusulas especiales de la póliza..."
                rows={2}
                value={quotationForm.condicionesEspeciales}
                onChange={(e) => updateQuotationField('condicionesEspeciales', e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="q-validaHasta">Válida Hasta</Label>
                <Input
                  id="q-validaHasta"
                  type="date"
                  value={quotationForm.validaHasta}
                  onChange={(e) => updateQuotationField('validaHasta', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-notas">Notas</Label>
              <Textarea
                id="q-notas"
                placeholder="Observaciones adicionales..."
                rows={2}
                value={quotationForm.notas}
                onChange={(e) => updateQuotationField('notas', e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setQuotationDialogOpen(false)}
                disabled={submittingQuotation}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submittingQuotation}>
                {submittingQuotation ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {submittingQuotation ? 'Registrando...' : 'Registrar Cotización'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}

// ---------------------------------------------------------------------------
// AnalisisIA Section (comparative)
// ---------------------------------------------------------------------------

function AnalisisIASection({ analisis }: { analisis: AnalisisComparativo }) {
  return (
    <div className="space-y-4">
      {/* Resumen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Resumen del Análisis Comparativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {analisis.resumen && <p className="text-sm leading-relaxed">{analisis.resumen}</p>}
          {analisis.recomendacion && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/50">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Recomendación
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-400">
                    {analisis.recomendacion}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per-quotation scores */}
      {analisis.cotizaciones?.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {analisis.cotizaciones.map((cot, idx) => (
            <Card key={cot.quotationId || idx}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {cot.proveedorNombre || `Proveedor ${idx + 1}`}
                  </CardTitle>
                  <ScoreIABadge score={cot.score} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {cot.pros?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-green-700 dark:text-green-400 flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      Ventajas
                    </span>
                    <ul className="space-y-0.5">
                      {cot.pros.map((p, i) => (
                        <li key={i} className="text-xs text-muted-foreground pl-4">
                          • {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {cot.cons?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-red-700 dark:text-red-400 flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      Desventajas
                    </span>
                    <ul className="space-y-0.5">
                      {cot.cons.map((c, i) => (
                        <li key={i} className="text-xs text-muted-foreground pl-4">
                          • {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
