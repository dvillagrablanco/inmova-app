'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Plus,
  Trash2,
  Calculator,
  Euro,
  TrendingUp,
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Table2,
  Save,
  ParkingCircle,
  Store,
  Home,
  Brain,
  Upload,
  FileText,
  Sparkles,
  Loader2,
  Copy,
  BarChart3,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface RentRollEntry {
  tipo: 'vivienda' | 'garaje' | 'local' | 'trastero' | 'oficina' | 'otro';
  referencia: string;
  superficie: number;
  habitaciones: number;
  banos: number;
  rentaMensual: number;
  rentaMercado: number;
  estado: 'alquilado' | 'vacio' | 'reforma';
  contratoVencimiento: string;
  inquilino: string;
}

const TIPO_ICONS: Record<string, any> = {
  vivienda: Home,
  garaje: ParkingCircle,
  local: Store,
  trastero: Building2,
  oficina: Building2,
  otro: Building2,
};

const TIPO_LABELS: Record<string, string> = {
  vivienda: 'Vivienda',
  garaje: 'Garaje',
  local: 'Local',
  trastero: 'Trastero',
  oficina: 'Oficina',
  otro: 'Otro',
};

export default function AnalisisInversionPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialTab = searchParams?.get('tab') || 'broker';
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiValuation, setAiValuation] = useState<any>(null);
  const [aiText, setAiText] = useState('');

  // Análisis crítico de propuesta de broker
  const [brokerAnalysis, setBrokerAnalysis] = useState<any>(null);
  const [brokerLoading, setBrokerLoading] = useState(false);

  // Datos de contraste de mercado (metodología profesional de tasación)
  const [marketContext, setMarketContext] = useState<any>(null);
  const [precioVsBroker, setPrecioVsBroker] = useState<any>(null);
  const [platformSummary, setPlatformSummary] = useState<any>(null);

  // Chat de inversiones
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Procesamiento de escrituras
  const [escrituraLoading, setEscrituraLoading] = useState(false);
  const [escrituraResult, setEscrituraResult] = useState<any>(null);

  // Procesamiento de contratos
  const [contratoLoading, setContratoLoading] = useState(false);
  const [contratoResult, setContratoResult] = useState<any>(null);
  const [contratoText, setContratoText] = useState('');

  // Form state
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [askingPrice, setAskingPrice] = useState<number>(0);

  // Potencial zona
  const [precioM2Zona, setPrecioM2Zona] = useState<number>(0);
  const [precioM2ZonaFuente, setPrecioM2ZonaFuente] = useState('manual');

  // Gastos compra
  const [gastosNotaria, setGastosNotaria] = useState(3000);
  const [gastosRegistro, setGastosRegistro] = useState(1500);
  const [impuestoCompra, setImpuestoCompra] = useState(10); // ITP %
  const [comisionCompra, setComisionCompra] = useState(0);
  const [otrosGastosCompra, setOtrosGastosCompra] = useState(0);

  // CAPEX
  const [capexReforma, setCapexReforma] = useState(0);
  const [capexImprevistos, setCapexImprevistos] = useState(10);
  const [capexOtros, setCapexOtros] = useState(0);

  // OPEX
  const [ibiAnual, setIbiAnual] = useState(0);
  const [comunidadMensual, setComunidadMensual] = useState(0);
  const [seguroAnual, setSeguroAnual] = useState(0);
  const [mantenimientoAnual, setMantenimientoAnual] = useState(0);
  const [gestionAdminPct, setGestionAdminPct] = useState(0);
  const [vacioEstimadoPct, setVacioEstimadoPct] = useState(5);
  const [comisionAlquilerPct, setComisionAlquilerPct] = useState(0);
  const [otrosGastosAnuales, setOtrosGastosAnuales] = useState(0);

  // Financiacion
  const [usaFinanciacion, setUsaFinanciacion] = useState(false);
  const [ltv, setLtv] = useState(70);
  const [tipoInteres, setTipoInteres] = useState(3.5);
  const [plazoAnos, setPlazoAnos] = useState(25);
  const [comisionApertura, setComisionApertura] = useState(0.5);

  // Rent Roll
  const [rentRoll, setRentRoll] = useState<RentRollEntry[]>([
    {
      tipo: 'vivienda',
      referencia: '',
      superficie: 0,
      habitaciones: 0,
      banos: 0,
      rentaMensual: 0,
      rentaMercado: 0,
      estado: 'alquilado',
      contratoVencimiento: '',
      inquilino: '',
    },
  ]);

  const [notas, setNotas] = useState('');

  // Cargar analisis guardados al montar
  useEffect(() => {
    if (status === 'authenticated') {
      setLoadingSaved(true);
      fetch('/api/investment/analysis')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.data) setSavedAnalyses(data.data);
        })
        .catch(() => {})
        .finally(() => setLoadingSaved(false));
    }
  }, [status]);

  if (status === 'unauthenticated') {
    router.push('/login');
  }

  const loadSavedAnalysis = async (id: string) => {
    try {
      const res = await fetch(`/api/investment/analysis/${id}`);
      if (!res.ok) {
        toast.error('Error cargando análisis');
        return;
      }
      const { data } = await res.json();
      // Poblar formulario con datos guardados
      setNombre(data.nombre);
      setDireccion(data.direccion || '');
      setAskingPrice(data.askingPrice);
      setGastosNotaria(data.gastosNotaria);
      setGastosRegistro(data.gastosRegistro);
      setImpuestoCompra(data.impuestoCompra);
      setComisionCompra(data.comisionCompra);
      setOtrosGastosCompra(data.otrosGastosCompra);
      setCapexReforma(data.capexReforma);
      setCapexImprevistos(data.capexImprevistos);
      setCapexOtros(data.capexOtros);
      setIbiAnual(data.ibiAnual);
      setComunidadMensual(data.comunidadMensual);
      setSeguroAnual(data.seguroAnual);
      setMantenimientoAnual(data.mantenimientoAnual);
      setGestionAdminPct(data.gestionAdminPct);
      setVacioEstimadoPct(data.vacioEstimadoPct);
      setComisionAlquilerPct(data.comisionAlquilerPct);
      setOtrosGastosAnuales(data.otrosGastosAnuales);
      setUsaFinanciacion(data.usaFinanciacion);
      if (data.ltv) setLtv(data.ltv);
      if (data.tipoInteres) setTipoInteres(data.tipoInteres);
      if (data.plazoAnos) setPlazoAnos(data.plazoAnos);
      if (data.comisionApertura) setComisionApertura(data.comisionApertura);
      if (data.precioM2Zona) setPrecioM2Zona(data.precioM2Zona);
      if (data.precioM2ZonaFuente) setPrecioM2ZonaFuente(data.precioM2ZonaFuente);
      setRentRoll((data.rentRoll as any[]) || []);
      setNotas(data.notas || '');
      setSavedId(data.id);
      // Reconstruir resultados
      if (data.yieldBruto != null) {
        setResults({
          rentaBrutaAnual: data.rentaBrutaAnual,
          noiAnual: data.rentaNetaAnual,
          inversionTotal: data.inversionTotal,
          capitalPropio: data.capitalPropio,
          importeHipoteca: data.importeHipoteca,
          cuotaMensual: data.cuotaHipotecaMensual,
          cashFlowAnualPreTax: data.cashFlowAnual,
          yieldBruto: data.yieldBruto,
          yieldNeto: data.yieldNeto,
          cashOnCash: data.cashOnCash,
          paybackAnos: data.paybackAnos,
          tablaSensibilidad: data.tablaSensibilidad || [],
          potencialZona: data.rentaPotencialAnual
            ? {
                precioM2Zona: data.precioM2Zona,
                rentaPotencialAnual: data.rentaPotencialAnual,
                yieldPotencial: data.yieldPotencial,
                gapRentaActualVsPotencial: data.gapRentaActualVsPotencial,
              }
            : null,
          rentRollSummary: { totalUnidades: (data.rentRoll as any[])?.length || 0 },
          rentaBrutaMensual: (data.rentaBrutaAnual || 0) / 12,
          rentaEfectivaAnual: data.rentaNetaAnual,
          ajusteVacio: 0,
          totalGastosCompra: 0,
          totalCapex: 0,
          opexAnual: 0,
          detalleOpex: {},
          cuotaAnual: (data.cuotaHipotecaMensual || 0) * 12,
        });
      }
      toast.success('Análisis cargado');
    } catch {
      toast.error('Error cargando');
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!savedId) {
      toast.error('Primero calcula y guarda el análisis');
      return;
    }
    window.open(`/api/investment/analysis/${savedId}/export?format=${format}`, '_blank');
  };

  const addUnit = (tipo: RentRollEntry['tipo'] = 'vivienda') => {
    const needsRooms = ['vivienda', 'oficina'].includes(tipo);
    setRentRoll([
      ...rentRoll,
      {
        tipo,
        referencia: '',
        superficie: 0,
        habitaciones: needsRooms ? 2 : 0,
        banos: needsRooms ? 1 : 0,
        rentaMensual: 0,
        rentaMercado: 0,
        estado: 'alquilado',
        contratoVencimiento: '',
        inquilino: '',
      },
    ]);
  };

  const removeUnit = (idx: number) => {
    setRentRoll(rentRoll.filter((_, i) => i !== idx));
  };

  const duplicateUnit = (idx: number) => {
    const original = rentRoll[idx];
    const copy = { ...original, referencia: `${original.referencia} (copia)` };
    const updated = [...rentRoll];
    updated.splice(idx + 1, 0, copy);
    setRentRoll(updated);
  };

  const updateUnit = (idx: number, field: keyof RentRollEntry, value: any) => {
    const updated = [...rentRoll];
    (updated[idx] as any)[field] = value;
    setRentRoll(updated);
  };

  const totalRentaMensual = rentRoll.reduce((s, u) => s + u.rentaMensual, 0);
  const totalRentaAnual = totalRentaMensual * 12;

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(n);

  const handleAIExtract = async (file?: File) => {
    setAiLoading(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      }
      if (aiText) {
        formData.append('text', aiText);
      }
      formData.append(
        'context',
        `Análisis de inversión para grupo societario. Extraer rent roll con viviendas, garajes, locales, trasteros. Datos del activo y gastos.`
      );

      const res = await fetch('/api/investment/analysis/ai-extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error en análisis IA');
        return;
      }

      const data = await res.json();
      const extracted = data.data;

      // Aplicar rent roll extraido
      if (extracted.rentRoll && extracted.rentRoll.length > 0) {
        setRentRoll(
          extracted.rentRoll.map((u: any) => ({
            tipo: u.tipo || 'vivienda',
            referencia: u.referencia || '',
            superficie: u.superficie || 0,
            rentaMensual: u.rentaMensual || 0,
            estado: u.estado || 'alquilado',
          }))
        );
        toast.success(`${extracted.rentRoll.length} unidades extraidas del documento`);
      }

      // Aplicar datos del activo
      if (extracted.datosActivo) {
        const d = extracted.datosActivo;
        if (d.nombre) setNombre(d.nombre);
        if (d.direccion) setDireccion(d.direccion);
        if (d.askingPrice) setAskingPrice(d.askingPrice);
        if (d.ibiAnual) setIbiAnual(d.ibiAnual);
        if (d.comunidadMensual) setComunidadMensual(d.comunidadMensual);
        if (d.seguroAnual) setSeguroAnual(d.seguroAnual);
      }

      // Valoracion IA
      if (extracted.valoracionIA) {
        setAiValuation(extracted.valoracionIA);
        toast.success('Valoracion IA del activo generada');
      }
    } catch {
      toast.error('Error de conexion con IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleBrokerAnalysis = async (file?: File) => {
    setBrokerLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (aiText) formData.append('text', aiText);
      formData.append(
        'context',
        'Propuesta de broker para grupo patrimonial familiar. Analizar críticamente.'
      );

      const res = await fetch('/api/investment/analysis/ai-analyze-proposal', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error en análisis de propuesta');
        return;
      }

      const data = await res.json();
      const extracted = data.data;
      setBrokerAnalysis(extracted);

      // Store market context data from parallel analysis (public market data only)
      if (data.marketContext) setMarketContext(data.marketContext);
      if (data.precioVsBroker) setPrecioVsBroker(data.precioVsBroker);
      if (data.platformSummary) setPlatformSummary(data.platformSummary);

      if (extracted.rentRoll?.length > 0) {
        setRentRoll(extracted.rentRoll);
        toast.success(`${extracted.rentRoll.length} unidades extraídas`);
      }
      if (extracted.datosActivo) {
        const d = extracted.datosActivo;
        if (d.nombre) setNombre(d.nombre);
        if (d.direccion) setDireccion(d.direccion);
        if (d.askingPrice) setAskingPrice(d.askingPrice);
        if (d.ibiAnual) setIbiAnual(d.ibiAnual);
        if (d.comunidadMensual) setComunidadMensual(d.comunidadMensual);
        if (d.seguroAnual) setSeguroAnual(d.seguroAnual);
      }
    } catch {
      toast.error('Error de conexión con IA');
    } finally {
      setBrokerLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const attachedAnalysis = results
        ? {
            nombre,
            direccion,
            askingPrice,
            rentRoll: rentRoll.slice(0, 30),
            yieldBruto: results.yieldBruto,
            yieldNeto: results.yieldNeto,
            cashOnCash: results.cashOnCash,
            noiAnual: results.noiAnual,
            cashFlowAnualPreTax: results.cashFlowAnualPreTax,
          }
        : null;

      const res = await fetch('/api/ai/investment-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          conversationHistory: chatMessages.slice(-20),
          attachedAnalysis,
        }),
      });

      if (!res.ok) throw new Error('Error en chat');
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.data.reply }]);

      if (data.data.extractedData?.rentRoll?.length > 0) {
        setRentRoll(data.data.extractedData.rentRoll);
        toast.success('Rent roll extraído del chat');
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error de conexión. Intenta de nuevo.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleContratoUpload = async (file?: File) => {
    setContratoLoading(true);
    setContratoResult(null);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (contratoText) formData.append('text', contratoText);
      formData.append('autoApply', 'true');

      const res = await fetch('/api/ai/process-contract', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error procesando contrato');
        return;
      }

      const data = await res.json();
      setContratoResult(data.data);
      const ed = data.data.extracted;
      if (ed) {
        toast.success(
          `${ed.tipo_documento === 'adenda' ? 'Adenda' : 'Contrato'} procesado: ${ed.arrendatario?.nombre || ''}`
        );
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setContratoLoading(false);
    }
  };

  const handleEscrituraUpload = async (file: File) => {
    setEscrituraLoading(true);
    setEscrituraResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/ai/process-escritura', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error procesando escritura');
        return;
      }

      const data = await res.json();
      setEscrituraResult(data.data);

      const ed = data.data.extractedData;
      if (ed) {
        toast.success(`Escritura procesada: ${ed.tipo_escritura || 'compraventa'}`);
        if (ed.precio_total) {
          setAskingPrice(ed.precio_total);
        }
        if (ed.inmueble?.direccion) {
          setDireccion(ed.inmueble.direccion);
          setNombre(ed.inmueble.descripcion || ed.inmueble.direccion);
        }
        if (ed.fincas?.length > 0) {
          setRentRoll(
            ed.fincas.map((f: any) => ({
              tipo:
                f.tipo === 'local'
                  ? 'local'
                  : f.tipo === 'garaje'
                    ? 'garaje'
                    : f.tipo === 'trastero'
                      ? 'trastero'
                      : f.tipo === 'oficina'
                        ? 'oficina'
                        : 'vivienda',
              referencia: f.descripcion || f.numero_finca || '',
              superficie: f.superficie_construida || f.superficie_util || 0,
              habitaciones: 0,
              banos: 0,
              rentaMensual: 0,
              rentaMercado: 0,
              estado: 'alquilado' as const,
              contratoVencimiento: '',
              inquilino: '',
            }))
          );
          toast.success(`${ed.fincas.length} fincas extraídas de la escritura`);
        }
      }

      // Acciones procesadas silenciosamente
    } catch {
      toast.error('Error de conexión');
    } finally {
      setEscrituraLoading(false);
    }
  };

  const handleCalcular = async () => {
    if (!nombre || askingPrice <= 0 || rentRoll.length === 0) {
      toast.error('Completa nombre, precio y al menos 1 unidad');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/investment/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          direccion,
          askingPrice,
          gastosNotaria,
          gastosRegistro,
          impuestoCompra,
          comisionCompra,
          otrosGastosCompra,
          capexReforma,
          capexImprevistos,
          capexOtros,
          ibiAnual,
          comunidadMensual,
          seguroAnual,
          mantenimientoAnual,
          gestionAdminPct,
          vacioEstimadoPct,
          comisionAlquilerPct,
          otrosGastosAnuales,
          usaFinanciacion,
          ltv,
          tipoInteres,
          plazoAnos,
          comisionApertura,
          precioM2Zona: precioM2Zona || undefined,
          precioM2ZonaFuente: precioM2Zona ? precioM2ZonaFuente : undefined,
          rentRoll,
          notas,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error en el calculo');
        return;
      }

      const data = await res.json();
      setResults(data.data.results);
      setSavedId(data.data.analysis.id);
      // Refrescar lista
      fetch('/api/investment/analysis')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.data) setSavedAnalyses(d.data);
        });
      toast.success('Análisis calculado y guardado');
    } catch {
      toast.error('Error de conexion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análisis de Inversión</h1>
          <p className="text-gray-500">
            Introduce el rent roll y datos del activo para calcular rentabilidad y sensibilidad
          </p>
        </div>

        <Tabs defaultValue={initialTab} className="space-y-4">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="guardados" className="gap-1 text-xs">
              <Save className="h-3 w-3" /> Guardados
            </TabsTrigger>
            <TabsTrigger value="escritura" className="gap-1 text-xs">
              <FileText className="h-3 w-3" /> Escrituras
            </TabsTrigger>
            <TabsTrigger value="contratos" className="gap-1 text-xs">
              <FileText className="h-3 w-3" /> Contratos
            </TabsTrigger>
            <TabsTrigger value="broker" className="gap-1 text-xs">
              <Shield className="h-3 w-3" /> Analizar Propuesta
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1 text-xs">
              <MessageSquare className="h-3 w-3" /> Chat IA
            </TabsTrigger>
            <TabsTrigger value="ia" className="gap-1 text-xs">
              <Brain className="h-3 w-3" /> Extracción
            </TabsTrigger>
            <TabsTrigger value="datos" className="text-xs">
              Activo
            </TabsTrigger>
            <TabsTrigger value="rentroll" className="text-xs">
              Rent Roll
            </TabsTrigger>
            <TabsTrigger value="gastos" className="text-xs">
              Gastos
            </TabsTrigger>
            <TabsTrigger value="financiacion" className="text-xs">
              Financiación
            </TabsTrigger>
            {results && (
              <TabsTrigger value="resultados" className="text-xs">
                Resultados
              </TabsTrigger>
            )}
            {results && (
              <TabsTrigger value="sensibilidad" className="text-xs">
                Sensibilidad
              </TabsTrigger>
            )}
            {results?.proyeccion && (
              <TabsTrigger value="proyeccion" className="text-xs">
                Proyección 10a
              </TabsTrigger>
            )}
            {results?.gapPorUnidad?.length > 0 && (
              <TabsTrigger value="gap" className="text-xs">
                Gap Rentas
              </TabsTrigger>
            )}
            {brokerAnalysis?.analisisCritico && (
              <TabsTrigger value="due-diligence" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" /> Due Diligence
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB: Analisis guardados */}
          <TabsContent value="guardados">
            <Card>
              <CardHeader>
                <CardTitle>Análisis Guardados</CardTitle>
                <CardDescription>Selecciona un análisis para cargarlo o exportarlo</CardDescription>
              </CardHeader>
              <CardContent>
                {savedAnalyses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay análisis guardados. Crea uno nuevo desde las pestañas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {savedAnalyses.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => loadSavedAnalysis(a.id)}
                        >
                          <div className="font-medium text-gray-900">{a.nombre}</div>
                          <div className="text-sm text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                            {a.direccion && <span>{a.direccion}</span>}
                            <span>{fmt(a.askingPrice || 0)}</span>
                            {a.yieldNeto != null && <span>Yield: {a.yieldNeto}%</span>}
                            {a.cashOnCash != null && <span>CoC: {a.cashOnCash}%</span>}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(a.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSavedId(a.id);
                              handleExport('csv');
                            }}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => loadSavedAnalysis(a.id)}>
                            <Upload className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Procesar Escrituras */}
          <TabsContent value="escritura">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Procesar Escritura Notarial
                  </CardTitle>
                  <CardDescription>
                    Sube una escritura de compraventa (PDF escaneado o digital). La IA realizará OCR
                    si es necesario, extraerá todos los datos (comprador, vendedor, precio, fincas,
                    superficies, refs catastrales) y los guardará automáticamente en la app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors bg-blue-50/30">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      id="escritura-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleEscrituraUpload(file);
                      }}
                      disabled={escrituraLoading}
                    />
                    <label htmlFor="escritura-upload" className="cursor-pointer">
                      {escrituraLoading ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                          <span className="text-sm text-blue-600 font-medium">
                            Procesando escritura...
                          </span>
                          <span className="text-xs text-blue-500">
                            OCR + Extracción IA + Guardado en repositorio
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <Upload className="h-10 w-10 text-blue-500" />
                          <span className="text-sm text-blue-700 font-medium">
                            Subir escritura PDF
                          </span>
                          <span className="text-xs text-gray-500">
                            PDF escaneado o digital - se aplica OCR automáticamente si es necesario
                          </span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                    <strong>La IA procesará automáticamente:</strong>
                    <ul className="mt-1 space-y-0.5 ml-4 list-disc">
                      <li>OCR con Tesseract (español) si el PDF es escaneado</li>
                      <li>Extracción: comprador, vendedor, precio, fecha, notario</li>
                      <li>Fincas: superficies, refs catastrales, valores, cuotas</li>
                      <li>Guardado del PDF en el repositorio documental</li>
                      <li>Creación del registro AssetAcquisition con precio de compra</li>
                      <li>Vinculación automática al edificio si existe en la app</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Resultado de escritura procesada */}
              {escrituraResult?.extractedData && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Escritura Procesada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Info método */}
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">
                        {escrituraResult.ocrMethod === 'ocr' ? 'OCR Tesseract' : 'Texto embebido'}
                      </Badge>
                      <Badge variant="outline">{escrituraResult.pagesProcessed} páginas</Badge>
                    </div>

                    {/* Datos principales */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <h4 className="font-medium">Operación</h4>
                        <div className="space-y-1">
                          {escrituraResult.extractedData.tipo_escritura && (
                            <div>
                              <span className="text-gray-500">Tipo:</span>{' '}
                              {escrituraResult.extractedData.tipo_escritura}
                            </div>
                          )}
                          {escrituraResult.extractedData.numero_escritura && (
                            <div>
                              <span className="text-gray-500">Nº:</span>{' '}
                              {escrituraResult.extractedData.numero_escritura}
                            </div>
                          )}
                          {escrituraResult.extractedData.fecha && (
                            <div>
                              <span className="text-gray-500">Fecha:</span>{' '}
                              {escrituraResult.extractedData.fecha}
                            </div>
                          )}
                          {escrituraResult.extractedData.notario && (
                            <div>
                              <span className="text-gray-500">Notario:</span>{' '}
                              {escrituraResult.extractedData.notario}
                            </div>
                          )}
                          {escrituraResult.extractedData.precio_total && (
                            <div>
                              <span className="text-gray-500">Precio:</span>{' '}
                              <strong className="text-green-700">
                                {fmt(escrituraResult.extractedData.precio_total)}
                              </strong>
                            </div>
                          )}
                          {escrituraResult.extractedData.forma_pago && (
                            <div>
                              <span className="text-gray-500">Pago:</span>{' '}
                              {escrituraResult.extractedData.forma_pago}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <h4 className="font-medium">Partes</h4>
                        <div className="space-y-1">
                          {escrituraResult.extractedData.comprador?.nombre && (
                            <div>
                              <span className="text-gray-500">Comprador:</span>{' '}
                              {escrituraResult.extractedData.comprador.nombre}
                            </div>
                          )}
                          {escrituraResult.extractedData.comprador?.nif && (
                            <div>
                              <span className="text-gray-500">NIF:</span>{' '}
                              {escrituraResult.extractedData.comprador.nif}
                            </div>
                          )}
                          {escrituraResult.extractedData.vendedor?.nombre && (
                            <div>
                              <span className="text-gray-500">Vendedor:</span>{' '}
                              {escrituraResult.extractedData.vendedor.nombre}
                            </div>
                          )}
                          {escrituraResult.extractedData.vendedor?.nif && (
                            <div>
                              <span className="text-gray-500">NIF:</span>{' '}
                              {escrituraResult.extractedData.vendedor.nif}
                            </div>
                          )}
                        </div>
                        {escrituraResult.extractedData.inmueble && (
                          <>
                            <h4 className="font-medium mt-2">Inmueble</h4>
                            <div>
                              <span className="text-gray-500">Dir:</span>{' '}
                              {escrituraResult.extractedData.inmueble.direccion}
                            </div>
                            <div>
                              <span className="text-gray-500">Tipo:</span>{' '}
                              {escrituraResult.extractedData.inmueble.tipo}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Fincas */}
                    {escrituraResult.extractedData.fincas?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">
                          Fincas extraídas ({escrituraResult.extractedData.fincas.length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b bg-gray-50">
                                <th className="text-left p-2">Finca</th>
                                <th className="text-left p-2">Tipo</th>
                                <th className="text-right p-2">Sup. constr.</th>
                                <th className="text-right p-2">Sup. útil</th>
                                <th className="text-right p-2">Valor</th>
                                <th className="text-left p-2">Ref. catastral</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {escrituraResult.extractedData.fincas.map((f: any, i: number) => (
                                <tr key={i}>
                                  <td className="p-2 font-medium">
                                    {f.descripcion || f.numero_finca}
                                  </td>
                                  <td className="p-2 text-gray-500">{f.tipo}</td>
                                  <td className="p-2 text-right">
                                    {f.superficie_construida
                                      ? `${f.superficie_construida} m²`
                                      : '-'}
                                  </td>
                                  <td className="p-2 text-right">
                                    {f.superficie_util ? `${f.superficie_util} m²` : '-'}
                                  </td>
                                  <td className="p-2 text-right">
                                    {f.valor_escriturado ? fmt(f.valor_escriturado) : '-'}
                                  </td>
                                  <td className="p-2 font-mono text-[10px]">
                                    {f.referencia_catastral || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Acciones realizadas */}
                    {escrituraResult.actions?.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <h4 className="font-medium text-sm text-green-800 mb-1">
                          Acciones realizadas
                        </h4>
                        <ul className="text-xs text-green-700 space-y-0.5">
                          {escrituraResult.actions.map((a: string, i: number) => (
                            <li key={i}>✓ {a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {escrituraResult.extractedData.resumen && (
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                        {escrituraResult.extractedData.resumen}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB: Procesar Contratos / Adendas */}
          <TabsContent value="contratos">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    Procesar Contrato o Adenda
                  </CardTitle>
                  <CardDescription>
                    Sube un contrato de arrendamiento o adenda. La IA extraerá inquilino, renta,
                    fechas y actualizará automáticamente la ficha de la unidad correspondiente. Las
                    adendas prorrogarán el contrato existente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors bg-green-50/30">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      id="contrato-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleContratoUpload(file);
                      }}
                      disabled={contratoLoading}
                    />
                    <label htmlFor="contrato-upload" className="cursor-pointer">
                      {contratoLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                          <span className="text-sm text-green-600 font-medium">
                            Procesando contrato...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-green-500" />
                          <span className="text-sm text-green-700 font-medium">
                            Subir contrato o adenda PDF
                          </span>
                          <span className="text-xs text-gray-500">
                            Contrato nuevo, renovación, prórroga o adenda
                          </span>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-500">o pega el texto</span>
                    </div>
                  </div>

                  <Textarea
                    value={contratoText}
                    onChange={(e) => setContratoText(e.target.value)}
                    placeholder="Pega aquí el texto del contrato o adenda..."
                    rows={6}
                    disabled={contratoLoading}
                  />
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={contratoLoading || !contratoText.trim()}
                    onClick={() => handleContratoUpload()}
                  >
                    {contratoLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Procesar contrato
                  </Button>
                </CardContent>
              </Card>

              {contratoResult?.extracted && (
                <Card
                  className={`border-2 ${contratoResult.extracted.es_adenda ? 'border-amber-300 bg-amber-50/30' : 'border-green-300 bg-green-50/30'}`}
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      {contratoResult.extracted.es_adenda
                        ? 'Adenda Procesada'
                        : 'Contrato Procesado'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-1">
                        <div>
                          <span className="text-gray-500">Tipo:</span>{' '}
                          {contratoResult.extracted.tipo_contrato}
                        </div>
                        <div>
                          <span className="text-gray-500">Edificio:</span>{' '}
                          {contratoResult.extracted.edificio?.nombre}
                        </div>
                        <div>
                          <span className="text-gray-500">Unidad:</span>{' '}
                          <strong>{contratoResult.extracted.unidad}</strong>
                        </div>
                        <div>
                          <span className="text-gray-500">Inquilino:</span>{' '}
                          {contratoResult.extracted.arrendatario?.nombre}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {contratoResult.extracted.renta_mensual && (
                          <div>
                            <span className="text-gray-500">Renta:</span>{' '}
                            <strong>{fmt(contratoResult.extracted.renta_mensual)}/mes</strong>
                          </div>
                        )}
                        {contratoResult.extracted.fecha_inicio && (
                          <div>
                            <span className="text-gray-500">Inicio:</span>{' '}
                            {contratoResult.extracted.fecha_inicio}
                          </div>
                        )}
                        {contratoResult.extracted.fecha_fin && (
                          <div>
                            <span className="text-gray-500">Fin:</span>{' '}
                            {contratoResult.extracted.fecha_fin}
                          </div>
                        )}
                        {contratoResult.extracted.fianza && (
                          <div>
                            <span className="text-gray-500">Fianza:</span>{' '}
                            {fmt(contratoResult.extracted.fianza)}
                          </div>
                        )}
                      </div>
                    </div>

                    {contratoResult.extracted.es_adenda &&
                      contratoResult.extracted.cambios_adenda && (
                        <div className="bg-amber-100 rounded-lg p-3 text-sm">
                          <strong>Cambios de la adenda:</strong>
                          {contratoResult.extracted.cambios_adenda.nueva_fecha_fin && (
                            <div>
                              Nueva fecha fin:{' '}
                              {contratoResult.extracted.cambios_adenda.nueva_fecha_fin}
                            </div>
                          )}
                          {contratoResult.extracted.cambios_adenda.nueva_renta && (
                            <div>
                              Nueva renta:{' '}
                              {fmt(contratoResult.extracted.cambios_adenda.nueva_renta)}/mes
                            </div>
                          )}
                          {contratoResult.extracted.cambios_adenda.otros_cambios && (
                            <div>{contratoResult.extracted.cambios_adenda.otros_cambios}</div>
                          )}
                        </div>
                      )}

                    {contratoResult.actions?.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-3">
                        <ul className="text-xs text-green-700 space-y-0.5">
                          {contratoResult.actions.map((a: string, i: number) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {contratoResult.extracted.resumen && (
                      <p className="text-sm text-gray-600">{contratoResult.extracted.resumen}</p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB: Analizar Propuesta de Broker */}
          <TabsContent value="broker">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-amber-600" />
                    Analizar Propuesta de Broker
                  </CardTitle>
                  <CardDescription>
                    Pega o sube la propuesta del broker con el rent roll. La IA extraerá los datos,
                    cuestionará la información facilitada, contrastará con mercado y generará un
                    análisis independiente con recomendación de compra/negociación/descarte.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Subir propuesta del broker</Label>
                    <div className="mt-2 border-2 border-dashed border-amber-300 rounded-lg p-6 text-center hover:border-amber-400 transition-colors bg-amber-50/30">
                      <input
                        type="file"
                        accept=".pdf,.csv,.txt,.xlsx,.jpg,.jpeg,.png"
                        className="hidden"
                        id="broker-file-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBrokerAnalysis(file);
                        }}
                        disabled={brokerLoading}
                      />
                      <label htmlFor="broker-file-upload" className="cursor-pointer">
                        {brokerLoading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                            <span className="text-sm text-amber-600 font-medium">
                              Analizando propuesta críticamente...
                            </span>
                            <span className="text-xs text-amber-500">
                              Extrayendo rent roll, cuestionando datos, calculando yields reales...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-amber-500" />
                            <span className="text-sm text-amber-700 font-medium">
                              PDF, Excel, imagen o texto del broker
                            </span>
                            <span className="text-xs text-gray-500">
                              Teaser comercial, rent roll, ficha del activo
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-500">o pega el contenido</span>
                    </div>
                  </div>

                  <Textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder="Pega aquí la propuesta del broker, el rent roll, el teaser comercial...

Ejemplo:
ACTIVO: Edificio residencial Calle Goya 45, Madrid
Precio: 2.200.000 EUR | Yield: 5,2%

RENT ROLL:
- 1ºA: 85m2, 3 hab, 1.100€/mes (alquilado hasta dic 2026)
- 1ºB: 62m2, 2 hab, 850€/mes (alquilado)
- 2ºA: 85m2, 3 hab, 1.050€/mes (alquilado)
- 2ºB: 62m2, 2 hab, VACÍO (estimado 900€/mes)
- Local: 120m2, 2.500€/mes (alquilado)
- 2 Garajes: 150€/mes c/u

IBI: 8.500€/año | Comunidad: 350€/mes
Estado: Reformado 2018"
                    rows={10}
                    disabled={brokerLoading}
                  />
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    disabled={brokerLoading || !aiText.trim()}
                    onClick={() => handleBrokerAnalysis()}
                  >
                    {brokerLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analizando propuesta...
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" /> Analizar propuesta críticamente
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Resultado del análisis crítico */}
              {brokerAnalysis?.analisisIndependiente && (
                <Card
                  className={`border-2 ${
                    brokerAnalysis.analisisIndependiente.conclusion === 'COMPRAR'
                      ? 'border-green-300 bg-green-50/30'
                      : brokerAnalysis.analisisIndependiente.conclusion === 'NEGOCIAR'
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-red-300 bg-red-50/30'
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {brokerAnalysis.analisisIndependiente.conclusion === 'COMPRAR' && (
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      )}
                      {brokerAnalysis.analisisIndependiente.conclusion === 'NEGOCIAR' && (
                        <AlertTriangle className="h-6 w-6 text-amber-600" />
                      )}
                      {brokerAnalysis.analisisIndependiente.conclusion === 'DESCARTAR' && (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      Veredicto: {brokerAnalysis.analisisIndependiente.conclusion}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">
                      {brokerAnalysis.analisisIndependiente.resumenEjecutivo}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="text-xs text-gray-500">Yield bruto real</div>
                        <div className="text-xl font-bold">
                          {brokerAnalysis.analisisIndependiente.yieldBrutoReal}%
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="text-xs text-gray-500">Yield neto estimado</div>
                        <div className="text-xl font-bold text-blue-600">
                          {brokerAnalysis.analisisIndependiente.yieldNetoEstimado}%
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="text-xs text-gray-500">Precio máx recomendado</div>
                        <div className="text-xl font-bold text-green-600">
                          {fmt(brokerAnalysis.analisisIndependiente.precioMaximoRecomendado || 0)}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border">
                        <div className="text-xs text-gray-500">Descuento sugerido</div>
                        <div className="text-xl font-bold text-amber-600">
                          {brokerAnalysis.analisisIndependiente.descuentoSugerido}%
                        </div>
                      </div>
                    </div>

                    {/* Escenarios */}
                    {brokerAnalysis.analisisIndependiente.escenarios && (
                      <div>
                        <h4 className="font-medium text-sm mb-2">Escenarios de oferta</h4>
                        <div className="grid md:grid-cols-3 gap-3">
                          {(['conservador', 'base', 'optimista'] as const).map((esc) => {
                            const e = brokerAnalysis.analisisIndependiente.escenarios[esc];
                            if (!e) return null;
                            const colors = {
                              conservador: 'border-blue-200 bg-blue-50/50',
                              base: 'border-green-200 bg-green-50/50',
                              optimista: 'border-purple-200 bg-purple-50/50',
                            };
                            return (
                              <div key={esc} className={`rounded-lg p-3 border ${colors[esc]}`}>
                                <div className="text-xs font-medium uppercase text-gray-500">
                                  {esc}
                                </div>
                                <div className="text-lg font-bold">{fmt(e.precio || 0)}</div>
                                <div className="text-sm text-gray-600">
                                  Yield: {e.yield}% | CF: {fmt(e.cashFlowMensual || 0)}/mes
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* ── CONTRASTE DE MERCADO — Metodología Profesional de Tasación ── */}
              {(marketContext || precioVsBroker) && (
                <Card className="border-2 border-blue-200 bg-blue-50/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      Valoración Independiente de Mercado
                    </CardTitle>
                    <CardDescription>
                      Datos reales de transacciones (Notariado) + ofertas actuales (portales) — Metodología ECO/805/2003
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Badge de valoración vs mercado */}
                    {precioVsBroker && (
                      <div className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                        precioVsBroker.estado === 'sobrevalorado' ? 'border-red-300 bg-red-50' :
                        precioVsBroker.estado === 'ligeramente_alto' ? 'border-amber-300 bg-amber-50' :
                        precioVsBroker.estado === 'en_linea' ? 'border-green-300 bg-green-50' :
                        'border-blue-300 bg-blue-50'
                      }`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {precioVsBroker.estado === 'sobrevalorado' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                            {precioVsBroker.estado === 'ligeramente_alto' && <AlertTriangle className="h-5 w-5 text-amber-600" />}
                            {precioVsBroker.estado === 'en_linea' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            {precioVsBroker.estado === 'infravalorado' && <TrendingUp className="h-5 w-5 text-blue-600" />}
                            <span className="font-bold text-base">
                              {precioVsBroker.estado === 'sobrevalorado' ? 'Precio Sobrevalorado' :
                               precioVsBroker.estado === 'ligeramente_alto' ? 'Precio Ligeramente Alto' :
                               precioVsBroker.estado === 'en_linea' ? 'Precio en Línea con Mercado' :
                               'Precio Infravalorado (Oportunidad)'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Broker: <strong>{precioVsBroker.precioM2Broker?.toLocaleString('es-ES')}€/m²</strong> vs
                            Mercado real: <strong>{precioVsBroker.precioM2Mercado?.toLocaleString('es-ES')}€/m²</strong>
                            {' '}({precioVsBroker.diferenciaPercent > 0 ? '+' : ''}{precioVsBroker.diferenciaPercent}%)
                          </p>
                        </div>
                        <Badge className={`text-lg px-4 py-1 ${
                          precioVsBroker.estado === 'sobrevalorado' ? 'bg-red-500' :
                          precioVsBroker.estado === 'ligeramente_alto' ? 'bg-amber-500' :
                          precioVsBroker.estado === 'en_linea' ? 'bg-green-500' :
                          'bg-blue-500'
                        }`}>
                          {precioVsBroker.diferenciaPercent > 0 ? '+' : ''}{precioVsBroker.diferenciaPercent}%
                        </Badge>
                      </div>
                    )}

                    {/* Barras de comparación de precios */}
                    {marketContext && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">Precios €/m² — Comparativa</h4>
                        {(() => {
                          const brokerP = precioVsBroker?.precioM2Broker || 0;
                          const realP = marketContext.precioM2ZonaReal || 0;
                          const askingP = marketContext.precioM2ZonaAsking || 0;
                          const maxP = Math.max(brokerP, realP, askingP, 1);
                          return (
                            <div className="space-y-2">
                              {brokerP > 0 && (
                                <div>
                                  <div className="flex justify-between text-xs mb-0.5">
                                    <span>Precio Broker</span>
                                    <span className="font-bold">{brokerP.toLocaleString('es-ES')}€/m²</span>
                                  </div>
                                  <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-red-400 rounded-full" style={{ width: `${(brokerP / maxP) * 100}%` }} />
                                  </div>
                                </div>
                              )}
                              {askingP > 0 && (
                                <div>
                                  <div className="flex justify-between text-xs mb-0.5">
                                    <span>Asking Price Portales <span className="text-gray-400">(Idealista/Fotocasa)</span></span>
                                    <span className="font-bold">{askingP.toLocaleString('es-ES')}€/m²</span>
                                  </div>
                                  <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(askingP / maxP) * 100}%` }} />
                                  </div>
                                </div>
                              )}
                              {realP > 0 && (
                                <div>
                                  <div className="flex justify-between text-xs mb-0.5">
                                    <span>Precio Real Escriturado <span className="text-gray-400">(Notariado)</span></span>
                                    <span className="font-bold">{realP.toLocaleString('es-ES')}€/m²</span>
                                  </div>
                                  <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${(realP / maxP) * 100}%` }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Market details grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-xs text-gray-500">Zona</div>
                            <div className="text-sm font-bold">{marketContext.zona || '-'}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-xs text-gray-500">Tendencia</div>
                            <div className="text-sm font-bold capitalize">{marketContext.tendenciaZona || '-'}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-xs text-gray-500">Demanda</div>
                            <div className="text-sm font-bold capitalize">{marketContext.demandaZona || '-'}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border">
                            <div className="text-xs text-gray-500">Alquiler €/m²/mes</div>
                            <div className="text-sm font-bold">
                              {marketContext.alquilerM2ZonaReal ? `${marketContext.alquilerM2ZonaReal}€` : '-'}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Fuentes: {marketContext.fuentePrecioReal || 'Notariado'}, {marketContext.fuenteAsking || 'Idealista/Fotocasa'}
                        </p>
                      </div>
                    )}

                    {/* Platform summary */}
                    {platformSummary && (
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 pt-2 border-t">
                        <span>Fuentes: {platformSummary.sourcesUsed?.join(', ')}</span>
                        <span>•</span>
                        <span>Fiabilidad: {platformSummary.overallReliability}%</span>
                        {platformSummary.comparablesCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{platformSummary.comparablesCount} comparables</span>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Flags del análisis crítico */}
              {brokerAnalysis?.analisisCritico?.flags && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Análisis Crítico - Flags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {brokerAnalysis.analisisCritico.flags.map((flag: any, i: number) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 p-2 rounded-lg text-sm ${
                            flag.nivel === 'verde'
                              ? 'bg-green-50'
                              : flag.nivel === 'amarillo'
                                ? 'bg-amber-50'
                                : 'bg-red-50'
                          }`}
                        >
                          <span className="shrink-0 mt-0.5">
                            {flag.nivel === 'verde'
                              ? '🟢'
                              : flag.nivel === 'amarillo'
                                ? '🟡'
                                : '🔴'}
                          </span>
                          <div>
                            <span className="font-medium">{flag.categoria}: </span>
                            <span className="text-gray-700">{flag.detalle}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {brokerAnalysis.analisisCritico.riesgos?.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-sm text-red-800 mb-1">
                          Riesgos identificados
                        </h4>
                        <ul className="text-sm text-red-700 space-y-1">
                          {brokerAnalysis.analisisCritico.riesgos.map((r: string, i: number) => (
                            <li key={i}>• {r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {brokerAnalysis.analisisCritico.oportunidades?.length > 0 && (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-sm text-green-800 mb-1">Oportunidades</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          {brokerAnalysis.analisisCritico.oportunidades.map(
                            (o: string, i: number) => (
                              <li key={i}>• {o}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB: Chat IA de Inversiones */}
          <TabsContent value="chat">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Chat Analista de Inversiones
                </CardTitle>
                <CardDescription>
                  Pega una propuesta de broker o haz preguntas sobre un activo. La IA analizará
                  críticamente la información y generará recomendaciones.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8 text-gray-400 space-y-3">
                      <Brain className="h-12 w-12 mx-auto text-gray-300" />
                      <p className="text-sm">
                        Pega aquí la propuesta del broker o pregúntame sobre un activo.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {[
                          'Analiza este rent roll que me ha pasado un broker...',
                          '¿Qué yield neto debería buscar en Madrid centro?',
                          '¿Este precio por m2 es razonable para la zona?',
                        ].map((suggestion, i) => (
                          <button
                            key={i}
                            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600"
                            onClick={() => setChatInput(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none prose-headings:text-sm prose-headings:font-bold prose-p:my-1 prose-ul:my-1 prose-table:text-xs">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Analizando...
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="shrink-0 flex gap-2">
                  <Textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                      }
                    }}
                    placeholder="Pega la propuesta del broker o escribe tu pregunta..."
                    rows={2}
                    className="flex-1 resize-none"
                    disabled={chatLoading}
                  />
                  <Button
                    onClick={handleChatSend}
                    disabled={chatLoading || !chatInput.trim()}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Due Diligence (aparece después del análisis de broker) */}
          {brokerAnalysis?.analisisCritico && (
            <TabsContent value="due-diligence">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      Checklist de Due Diligence
                    </CardTitle>
                    <CardDescription>
                      Puntos a verificar antes de realizar una oferta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        {
                          cat: 'Legal',
                          items: [
                            'Nota simple actualizada',
                            'Cargas y gravámenes',
                            'Certificado comunidad de propietarios',
                            'IBI al corriente',
                            'Licencia de primera ocupación',
                          ],
                        },
                        {
                          cat: 'Técnico',
                          items: [
                            'ITE (Inspección Técnica Edificio)',
                            'Certificado energético',
                            'Estado instalaciones (fontanería, electricidad)',
                            'Informe de humedades/estructura',
                            'Presupuesto de reforma si necesario',
                          ],
                        },
                        {
                          cat: 'Arrendamientos',
                          items: [
                            'Contratos de alquiler originales',
                            'Historial de pagos de inquilinos',
                            'Fianzas depositadas en IVIMA/organismo',
                            'Vencimientos y prórrogas',
                            'Derechos de tanteo y retracto',
                          ],
                        },
                        {
                          cat: 'Fiscal',
                          items: [
                            'Valor catastral y referencia',
                            'ITP o IVA+AJD aplicable',
                            'Plusvalía municipal estimada',
                            'Base amortización (suelo vs construcción)',
                            'IS/IRPF impacto',
                          ],
                        },
                        {
                          cat: 'Mercado',
                          items: [
                            'Comparables de venta en la zona',
                            'Rentas de mercado por m2',
                            'Zona tensionada (tope de renta)',
                            'Tendencia del barrio',
                            'Oferta de alquiler disponible',
                          ],
                        },
                      ].map((section) => (
                        <div key={section.cat} className="border rounded-lg p-3">
                          <h4 className="font-medium text-sm mb-2">{section.cat}</h4>
                          <div className="grid md:grid-cols-2 gap-1">
                            {section.items.map((item, i) => (
                              <label
                                key={i}
                                className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-900"
                              >
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                {item}
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {brokerAnalysis.analisisCritico.gastosOmitidos?.length > 0 && (
                  <Card className="border-amber-200">
                    <CardHeader>
                      <CardTitle className="text-base text-amber-800">
                        Gastos omitidos por el broker
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1">
                        {brokerAnalysis.analisisCritico.gastosOmitidos.map(
                          (g: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                              {g}
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          {/* TAB: Asistente IA Documental */}
          <TabsContent value="ia">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Asistente IA Documental
                  </CardTitle>
                  <CardDescription>
                    Sube un documento (rent roll, ficha del activo, informe de valoracion) y la IA
                    extraera automaticamente las unidades, rentas, gastos y datos del activo.
                    Tambien generara una valoracion IA si hay datos suficientes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload de archivo */}
                  <div>
                    <Label className="text-sm font-medium">Subir documento</Label>
                    <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.csv,.txt,.xlsx,.jpg,.jpeg,.png"
                        className="hidden"
                        id="ai-file-upload"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAIExtract(file);
                        }}
                        disabled={aiLoading}
                      />
                      <label htmlFor="ai-file-upload" className="cursor-pointer">
                        {aiLoading ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                            <span className="text-sm text-purple-600">
                              Analizando documento con IA...
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Upload className="h-8 w-8 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              PDF, CSV, Excel, imagen o texto
                            </span>
                            <span className="text-xs text-gray-400">
                              Rent roll, ficha de activo, nota simple, informe de tasacion
                            </span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* O pegar texto */}
                  <div>
                    <Label className="text-sm font-medium">O pega el contenido directamente</Label>
                    <Textarea
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                      placeholder="Pega aquí el rent roll, datos del activo, o cualquier información relevante...

Ejemplo:
Edificio Calle Mayor 12, Madrid
Precio: 850.000 EUR
- 1A: Vivienda 75m2, 900 EUR/mes, alquilado
- 1B: Vivienda 60m2, 750 EUR/mes, vacio
- Local: 120m2, 1.200 EUR/mes, alquilado
- Garaje 1: 100 EUR/mes, alquilado
- Garaje 2: 100 EUR/mes, vacio
IBI: 3.200 EUR/ano
Comunidad: 180 EUR/mes"
                      rows={8}
                      disabled={aiLoading}
                    />
                    <Button
                      className="mt-2"
                      variant="default"
                      disabled={aiLoading || !aiText.trim()}
                      onClick={() => handleAIExtract()}
                    >
                      {aiLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analizando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" /> Extraer con IA
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Valoracion IA */}
              {aiValuation && (
                <Card className="border-purple-200 bg-purple-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Valoracion IA del Activo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {aiValuation.estimatedValue && (
                        <div>
                          <span className="text-gray-500">Valor estimado</span>
                          <div className="text-lg font-bold text-purple-600">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                              maximumFractionDigits: 0,
                            }).format(aiValuation.estimatedValue)}
                          </div>
                        </div>
                      )}
                      {aiValuation.minValue && (
                        <div>
                          <span className="text-gray-500">Rango minimo</span>
                          <div className="font-medium">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                              maximumFractionDigits: 0,
                            }).format(aiValuation.minValue)}
                          </div>
                        </div>
                      )}
                      {aiValuation.maxValue && (
                        <div>
                          <span className="text-gray-500">Rango maximo</span>
                          <div className="font-medium">
                            {new Intl.NumberFormat('es-ES', {
                              style: 'currency',
                              currency: 'EUR',
                              maximumFractionDigits: 0,
                            }).format(aiValuation.maxValue)}
                          </div>
                        </div>
                      )}
                      {aiValuation.confidenceScore && (
                        <div>
                          <span className="text-gray-500">Confianza</span>
                          <div className="font-medium">{aiValuation.confidenceScore}%</div>
                        </div>
                      )}
                    </div>
                    {aiValuation.reasoning && (
                      <p className="text-sm text-gray-600 mt-3 border-t pt-3">
                        {aiValuation.reasoning}
                      </p>
                    )}
                    {aiValuation.estimatedValue && askingPrice > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-white border">
                        <span className="text-sm text-gray-500">Asking vs Valoracion IA: </span>
                        <span
                          className={`font-bold ${askingPrice > aiValuation.estimatedValue ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {askingPrice > aiValuation.estimatedValue
                            ? `Asking ${Math.round((askingPrice / aiValuation.estimatedValue - 1) * 100)}% POR ENCIMA de valoracion`
                            : `Asking ${Math.round((1 - askingPrice / aiValuation.estimatedValue) * 100)}% por debajo de valoracion`}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* TAB: Datos del activo */}
          <TabsContent value="datos">
            <Card>
              <CardHeader>
                <CardTitle>Datos del Activo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre del analisis *</Label>
                    <Input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej: Edificio Calle Mayor 12"
                    />
                  </div>
                  <div>
                    <Label>Direccion</Label>
                    <Input
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Calle, numero, ciudad"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Precio que piden (asking price) *</Label>
                    <Input
                      type="number"
                      value={askingPrice || ''}
                      onChange={(e) => setAskingPrice(Number(e.target.value))}
                      placeholder="500000"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Techo maximo para la tabla de sensibilidad
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>EUR/m2 alquiler de la zona</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={precioM2Zona || ''}
                      onChange={(e) => setPrecioM2Zona(Number(e.target.value))}
                      placeholder="12.50"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Para calcular potencial de rentabilidad
                    </p>
                  </div>
                  <div>
                    <Label>Fuente del dato</Label>
                    <Select value={precioM2ZonaFuente} onValueChange={setPrecioM2ZonaFuente}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual</SelectItem>
                        <SelectItem value="ia">Valoracion IA</SelectItem>
                        <SelectItem value="idealista">Idealista</SelectItem>
                        <SelectItem value="fotocasa">Fotocasa</SelectItem>
                        <SelectItem value="tasacion">Tasacion oficial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={aiLoading}
                      onClick={async () => {
                        if (!direccion) {
                          toast.error('Introduce dirección primero');
                          return;
                        }
                        setAiLoading(true);
                        try {
                          const formData = new FormData();
                          formData.append(
                            'text',
                            `Estima el precio medio de alquiler por m2 en la zona de: ${direccion}. Responde SOLO con un numero decimal (ej: 12.5)`
                          );
                          formData.append('context', 'Precio EUR/m2 alquiler zona');
                          const res = await fetch('/api/investment/analysis/ai-extract', {
                            method: 'POST',
                            body: formData,
                          });
                          if (res.ok) {
                            const data = await res.json();
                            const raw = data.data?.rawAnalysis || '';
                            const match = raw.match(/(\d+[.,]?\d*)/);
                            if (match) {
                              const val = parseFloat(match[1].replace(',', '.'));
                              setPrecioM2Zona(val);
                              setPrecioM2ZonaFuente('ia');
                              toast.success(`IA estima ${val} EUR/m2`);
                            }
                          }
                        } catch {
                        } finally {
                          setAiLoading(false);
                        }
                      }}
                    >
                      {aiLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Estimar con IA
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Gastos de compra</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                    <div>
                      <Label className="text-xs">Notaria</Label>
                      <Input
                        type="number"
                        value={gastosNotaria}
                        onChange={(e) => setGastosNotaria(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Registro</Label>
                      <Input
                        type="number"
                        value={gastosRegistro}
                        onChange={(e) => setGastosRegistro(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">ITP/IVA (%)</Label>
                      <Input
                        type="number"
                        value={impuestoCompra}
                        onChange={(e) => setImpuestoCompra(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Comision compra (%)</Label>
                      <Input
                        type="number"
                        value={comisionCompra}
                        onChange={(e) => setComisionCompra(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Otros gastos</Label>
                      <Input
                        type="number"
                        value={otrosGastosCompra}
                        onChange={(e) => setOtrosGastosCompra(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Rent Roll */}
          <TabsContent value="rentroll">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rent Roll</CardTitle>
                    <CardDescription>
                      {rentRoll.length} unidades | Renta mensual: {fmt(totalRentaMensual)} | Anual:{' '}
                      {fmt(totalRentaAnual)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => addUnit('vivienda')}>
                      <Home className="h-3 w-3 mr-1" />
                      Viv
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('garaje')}>
                      <ParkingCircle className="h-3 w-3 mr-1" />
                      Gar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('local')}>
                      <Store className="h-3 w-3 mr-1" />
                      Loc
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('trastero')}>
                      Tra
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('oficina')}>
                      Ofi
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rentRoll.map((unit, idx) => {
                    const showRooms = ['vivienda', 'oficina'].includes(unit.tipo);
                    return (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {/* Fila 1: Tipo + Ref + Estado + Borrar */}
                        <div className="flex items-center gap-2">
                          <div className="w-28 shrink-0">
                            <Select
                              value={unit.tipo}
                              onValueChange={(v) => updateUnit(idx, 'tipo', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>
                                    {v}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            className="h-8 text-sm flex-1"
                            placeholder="Ref: 1A, Local B..."
                            value={unit.referencia}
                            onChange={(e) => updateUnit(idx, 'referencia', e.target.value)}
                          />
                          <div className="w-28 shrink-0">
                            <Select
                              value={unit.estado}
                              onValueChange={(v) => updateUnit(idx, 'estado', v)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alquilado">Alquilado</SelectItem>
                                <SelectItem value="vacio">Vacio</SelectItem>
                                <SelectItem value="reforma">Reforma</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-gray-400 shrink-0"
                            onClick={() => duplicateUnit(idx)}
                            title="Duplicar"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {rentRoll.length > 1 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 shrink-0"
                              onClick={() => removeUnit(idx)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          {/* EUR/m2 indicator */}
                          {unit.superficie > 0 && unit.rentaMensual > 0 && (
                            <span className="text-[10px] text-blue-600 font-medium shrink-0 hidden md:block">
                              {(unit.rentaMensual / unit.superficie).toFixed(1)} €/m2
                            </span>
                          )}
                        </div>
                        {/* Fila 2: m2 + hab + banos + renta */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                          <div>
                            <Label className="text-[10px] text-gray-400">Superficie (m2)</Label>
                            <Input
                              className="h-8 text-sm"
                              type="number"
                              placeholder="75"
                              value={unit.superficie || ''}
                              onChange={(e) =>
                                updateUnit(idx, 'superficie', Number(e.target.value))
                              }
                            />
                          </div>
                          {showRooms && (
                            <>
                              <div>
                                <Label className="text-[10px] text-gray-400">Hab.</Label>
                                <Input
                                  className="h-8 text-sm"
                                  type="number"
                                  placeholder="2"
                                  value={unit.habitaciones || ''}
                                  onChange={(e) =>
                                    updateUnit(idx, 'habitaciones', Number(e.target.value))
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-400">Banos</Label>
                                <Input
                                  className="h-8 text-sm"
                                  type="number"
                                  placeholder="1"
                                  value={unit.banos || ''}
                                  onChange={(e) => updateUnit(idx, 'banos', Number(e.target.value))}
                                />
                              </div>
                            </>
                          )}
                          <div>
                            <Label className="text-[10px] text-gray-400">Renta actual €/mes</Label>
                            <Input
                              className="h-8 text-sm"
                              type="number"
                              placeholder="800"
                              value={unit.rentaMensual || ''}
                              onChange={(e) =>
                                updateUnit(idx, 'rentaMensual', Number(e.target.value))
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-gray-400">Renta mercado €/mes</Label>
                            <Input
                              className="h-8 text-sm"
                              type="number"
                              placeholder="950"
                              value={unit.rentaMercado || ''}
                              onChange={(e) =>
                                updateUnit(idx, 'rentaMercado', Number(e.target.value))
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-gray-400">Vencimiento</Label>
                            <Input
                              className="h-8 text-sm"
                              type="month"
                              value={unit.contratoVencimiento || ''}
                              onChange={(e) =>
                                updateUnit(idx, 'contratoVencimiento', e.target.value)
                              }
                            />
                          </div>
                        </div>
                        {/* Gap indicator */}
                        {unit.rentaMercado > 0 &&
                          unit.rentaMensual > 0 &&
                          unit.rentaMercado !== unit.rentaMensual && (
                            <div
                              className={`text-[10px] px-2 py-0.5 rounded ${unit.rentaMercado > unit.rentaMensual ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                            >
                              Gap: {unit.rentaMercado > unit.rentaMensual ? '+' : ''}
                              {Math.round(unit.rentaMercado - unit.rentaMensual)}€/mes (
                              {unit.rentaMercado > unit.rentaMensual ? '+' : ''}
                              {Math.round((unit.rentaMercado / unit.rentaMensual - 1) * 100)}%)
                              {unit.contratoVencimiento && ` | Vence: ${unit.contratoVencimiento}`}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>

                {/* Resumen por tipo */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  {(['vivienda', 'garaje', 'local', 'trastero', 'oficina'] as const).map((tipo) => {
                    const count = rentRoll.filter((u) => u.tipo === tipo).length;
                    const renta = rentRoll
                      .filter((u) => u.tipo === tipo)
                      .reduce((s, u) => s + u.rentaMensual, 0);
                    if (count === 0) return null;
                    return (
                      <Badge key={tipo} variant="outline" className="text-xs">
                        {TIPO_LABELS[tipo]}: {count} ud. | {fmt(renta)}/mes
                      </Badge>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: OPEX / CAPEX */}
          <TabsContent value="gastos">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">OPEX (Gastos recurrentes anuales)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">IBI anual</Label>
                    <Input
                      type="number"
                      value={ibiAnual}
                      onChange={(e) => setIbiAnual(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Comunidad mensual</Label>
                    <Input
                      type="number"
                      value={comunidadMensual}
                      onChange={(e) => setComunidadMensual(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Seguro anual</Label>
                    <Input
                      type="number"
                      value={seguroAnual}
                      onChange={(e) => setSeguroAnual(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Mantenimiento anual</Label>
                    <Input
                      type="number"
                      value={mantenimientoAnual}
                      onChange={(e) => setMantenimientoAnual(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Gestion/Admin (% renta bruta)</Label>
                    <Input
                      type="number"
                      value={gestionAdminPct}
                      onChange={(e) => setGestionAdminPct(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Vacio estimado (%)</Label>
                    <Input
                      type="number"
                      value={vacioEstimadoPct}
                      onChange={(e) => setVacioEstimadoPct(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Comision alquiler (% nueva contratacion)</Label>
                    <Input
                      type="number"
                      value={comisionAlquilerPct}
                      onChange={(e) => setComisionAlquilerPct(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Otros gastos anuales</Label>
                    <Input
                      type="number"
                      value={otrosGastosAnuales}
                      onChange={(e) => setOtrosGastosAnuales(Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">CAPEX (Inversiones)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm">Reforma/Rehabilitacion</Label>
                    <Input
                      type="number"
                      value={capexReforma}
                      onChange={(e) => setCapexReforma(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Imprevistos (% sobre CAPEX)</Label>
                    <Input
                      type="number"
                      value={capexImprevistos}
                      onChange={(e) => setCapexImprevistos(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Otros CAPEX</Label>
                    <Input
                      type="number"
                      value={capexOtros}
                      onChange={(e) => setCapexOtros(Number(e.target.value))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Financiacion */}
          <TabsContent value="financiacion">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Landmark className="h-5 w-5" /> Financiacion
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Usar financiacion</Label>
                    <Switch checked={usaFinanciacion} onCheckedChange={setUsaFinanciacion} />
                  </div>
                </div>
              </CardHeader>
              {usaFinanciacion && (
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">LTV (% financiado)</Label>
                      <Input
                        type="number"
                        value={ltv}
                        onChange={(e) => setLtv(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Tipo interes anual (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={tipoInteres}
                        onChange={(e) => setTipoInteres(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Plazo (anos)</Label>
                      <Input
                        type="number"
                        value={plazoAnos}
                        onChange={(e) => setPlazoAnos(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Comision apertura (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={comisionApertura}
                        onChange={(e) => setComisionApertura(Number(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* TAB: Resultados */}
          {results && (
            <TabsContent value="resultados">
              <div className="space-y-4">
                {/* Semaforo de calidad del deal */}
                {(() => {
                  const y = results.yieldNeto || 0;
                  const isGood = y >= 6;
                  const isOk = y >= 4;
                  const color = isGood
                    ? 'bg-green-100 border-green-300 text-green-800'
                    : isOk
                      ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                      : 'bg-red-100 border-red-300 text-red-800';
                  const label = isGood
                    ? 'Buena oportunidad'
                    : isOk
                      ? 'Aceptable'
                      : 'Rentabilidad baja';
                  return (
                    <div
                      className={`p-3 rounded-lg border text-sm font-medium text-center ${color}`}
                    >
                      {label} — Yield neto {y}% | PER {results.per || 0}x |{' '}
                      {fmt(results.precioM2Activo || 0)}/m2
                    </div>
                  );
                })()}

                {/* KPIs principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500">Yield Bruto</div>
                      <div className="text-2xl font-bold">{results.yieldBruto}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500">Yield Neto</div>
                      <div className="text-2xl font-bold text-blue-600">{results.yieldNeto}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500">Cash-on-Cash</div>
                      <div className="text-2xl font-bold text-green-600">{results.cashOnCash}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-xs text-gray-500">Payback</div>
                      <div className="text-2xl font-bold">
                        {results.paybackAnos < 100 ? `${results.paybackAnos} a` : 'N/A'}
                      </div>
                    </CardContent>
                  </Card>
                  {results.tirBruta != null && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-xs text-gray-500">TIR (10 años)</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {results.tirBruta}%
                        </div>
                        {results.tirApalancada != null && (
                          <div className="text-xs text-gray-400">
                            Apalancada: {results.tirApalancada}%
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* KPIs secundarios */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-[10px] text-gray-400">Precio/m2</div>
                      <div className="text-sm font-bold">{fmt(results.precioM2Activo || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-[10px] text-gray-400">PER (multiplo)</div>
                      <div className="text-sm font-bold">{results.per || 0}x</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-[10px] text-gray-400">Renta/m2/mes</div>
                      <div className="text-sm font-bold">{results.rentaM2Mensual || 0} €</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-[10px] text-gray-400">NOI anual</div>
                      <div className="text-sm font-bold">{fmt(results.noiAnual || 0)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-[10px] text-gray-400">CF mensual</div>
                      <div
                        className={`text-sm font-bold ${(results.cashFlowAnualPreTax || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {fmt((results.cashFlowAnualPreTax || 0) / 12)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-[10px] text-gray-400">Superficie</div>
                      <div className="text-sm font-bold">
                        {results.rentRollSummary?.superficieTotal || 0} m2
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rentabilidad por tipo */}
                {results.rentabilidadPorTipo && results.rentabilidadPorTipo.length > 1 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" /> Rentabilidad por Tipo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-gray-500">
                              <th className="text-left p-2">Tipo</th>
                              <th className="text-right p-2">Uds</th>
                              <th className="text-right p-2">m2</th>
                              <th className="text-right p-2">Renta/mes</th>
                              <th className="text-right p-2">EUR/m2</th>
                              <th className="text-right p-2">% Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {results.rentabilidadPorTipo.map((t: any) => (
                              <tr key={t.tipo}>
                                <td className="p-2 font-medium">{TIPO_LABELS[t.tipo] || t.tipo}</td>
                                <td className="p-2 text-right">{t.unidades}</td>
                                <td className="p-2 text-right">{t.superficie}</td>
                                <td className="p-2 text-right">{fmt(t.rentaMensual)}</td>
                                <td className="p-2 text-right font-medium text-blue-600">
                                  {t.eurM2Mes} €
                                </td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${Math.min(t.pctDelTotal, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs">{t.pctDelTotal}%</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Ingresos */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ingresos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Renta bruta mensual</span>
                        <span className="font-medium">{fmt(results.rentaBrutaMensual)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Renta bruta anual</span>
                        <span className="font-medium">{fmt(results.rentaBrutaAnual)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          (-) Ajuste vacio ({vacioEstimadoPct}%)
                        </span>
                        <span className="text-red-600">-{fmt(results.ajusteVacio)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Renta efectiva anual</span>
                        <span>{fmt(results.rentaEfectivaAnual)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inversion */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Inversión</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Precio compra</span>
                        <span className="font-medium">{fmt(askingPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Gastos compra</span>
                        <span>{fmt(results.totalGastosCompra)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">CAPEX</span>
                        <span>{fmt(results.totalCapex)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Inversión total</span>
                        <span>{fmt(results.inversionTotal)}</span>
                      </div>
                      {usaFinanciacion && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Hipoteca ({ltv}%)</span>
                            <span>-{fmt(results.importeHipoteca)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span>Capital propio</span>
                            <span className="text-blue-600">{fmt(results.capitalPropio)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Cuota mensual</span>
                            <span>{fmt(results.cuotaMensual)}</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  {/* OPEX */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">OPEX Anual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {results.detalleOpex ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-500">IBI</span>
                            <span>{fmt(results.detalleOpex.ibi || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Comunidad</span>
                            <span>{fmt(results.detalleOpex.comunidad || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Seguro</span>
                            <span>{fmt(results.detalleOpex.seguro || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Mantenimiento</span>
                            <span>{fmt(results.detalleOpex.mantenimiento || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Gestión admin</span>
                            <span>{fmt(results.detalleOpex.gestionAdmin || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Comisiones</span>
                            <span>{fmt(results.detalleOpex.comisionAlquiler || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Otros</span>
                            <span>{fmt(results.detalleOpex.otros || 0)}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-gray-400 text-xs">Recalcula para ver el desglose</p>
                      )}
                      <div className="flex justify-between border-t pt-2 font-bold">
                        <span>Total OPEX</span>
                        <span className="text-red-600">{fmt(results.opexAnual || 0)}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Cash-flow */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cash-Flow Anual</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-green-500" />
                          Renta efectiva
                        </span>
                        <span className="text-green-600">+{fmt(results.rentaEfectivaAnual)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 flex items-center gap-1">
                          <ArrowDownRight className="h-3 w-3 text-red-500" />
                          OPEX
                        </span>
                        <span className="text-red-600">-{fmt(results.opexAnual)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>NOI</span>
                        <span>{fmt(results.noiAnual)}</span>
                      </div>
                      {usaFinanciacion && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Landmark className="h-3 w-3" />
                            Hipoteca anual
                          </span>
                          <span className="text-red-600">-{fmt(results.cuotaAnual)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t pt-2 font-bold text-lg">
                        <span>Cash-Flow pre-tax</span>
                        <span
                          className={
                            results.cashFlowAnualPreTax >= 0 ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {fmt(results.cashFlowAnualPreTax)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        = {fmt(results.cashFlowAnualPreTax / 12)}/mes
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rent Roll Summary */}
                {/* Potencial de zona */}
                {results.potencialZona && (
                  <Card className="border-green-200 bg-green-50/30 md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" /> Potencial de Rentabilidad
                        por Zona
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">EUR/m2 zona</span>
                          <div className="text-lg font-bold">
                            {results.potencialZona.precioM2Zona} EUR
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Renta potencial anual</span>
                          <div className="text-lg font-bold text-green-600">
                            {fmt(results.potencialZona.rentaPotencialAnual)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Yield potencial</span>
                          <div className="text-lg font-bold text-green-600">
                            {results.potencialZona.yieldPotencial}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">CF potencial anual</span>
                          <div
                            className={`text-lg font-bold ${results.potencialZona.cashFlowPotencialAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {fmt(results.potencialZona.cashFlowPotencialAnual)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Gap vs actual</span>
                          <div
                            className={`text-lg font-bold ${results.potencialZona.gapRentaActualVsPotencial > 0 ? 'text-green-600' : 'text-orange-600'}`}
                          >
                            {results.potencialZona.gapRentaActualVsPotencial > 0 ? '+' : ''}
                            {results.potencialZona.gapRentaActualVsPotencial}%
                          </div>
                          <div className="text-xs text-gray-400">
                            {results.potencialZona.upside > 0
                              ? `+${fmt(results.potencialZona.upside)}/ano de upside`
                              : 'Renta actual por encima de mercado'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen Rent Roll</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline">
                        {results.rentRollSummary.totalUnidades} unidades
                      </Badge>
                      {results.rentRollSummary.viviendas > 0 && (
                        <Badge variant="outline">
                          {results.rentRollSummary.viviendas} viviendas
                        </Badge>
                      )}
                      {results.rentRollSummary.garajes > 0 && (
                        <Badge variant="outline">{results.rentRollSummary.garajes} garajes</Badge>
                      )}
                      {results.rentRollSummary.locales > 0 && (
                        <Badge variant="outline">{results.rentRollSummary.locales} locales</Badge>
                      )}
                      {results.rentRollSummary.trasteros > 0 && (
                        <Badge variant="outline">
                          {results.rentRollSummary.trasteros} trasteros
                        </Badge>
                      )}
                      {results.rentRollSummary.otros > 0 && (
                        <Badge variant="outline">{results.rentRollSummary.otros} otros</Badge>
                      )}
                      <Badge variant="outline">
                        Ocupacion: {results.rentRollSummary.ocupacionActual}%
                      </Badge>
                      <Badge variant="outline">{results.rentRollSummary.superficieTotal} m2</Badge>
                      {results.rentRollSummary.totalHabitaciones > 0 && (
                        <Badge variant="outline">
                          {results.rentRollSummary.totalHabitaciones} hab.
                        </Badge>
                      )}
                      {results.rentRollSummary.totalBanos > 0 && (
                        <Badge variant="outline">{results.rentRollSummary.totalBanos} banos</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* TAB: Sensibilidad */}
          {results && (
            <TabsContent value="sensibilidad">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table2 className="h-5 w-5" /> Tabla de Sensibilidad
                  </CardTitle>
                  <CardDescription>
                    Partiendo del asking price ({fmt(askingPrice)}) como maximo, bajando en
                    escalones del 5%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400 mb-2 md:hidden">
                    Desliza horizontalmente para ver todas las columnas →
                  </p>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">Precio</th>
                          <th className="text-right p-3 font-medium">Dto.</th>
                          <th className="text-right p-3 font-medium">Inversión</th>
                          <th className="text-right p-3 font-medium">Capital propio</th>
                          {usaFinanciacion && (
                            <th className="text-right p-3 font-medium">Cuota/mes</th>
                          )}
                          <th className="text-right p-3 font-medium">Yield bruto</th>
                          <th className="text-right p-3 font-medium">Yield neto</th>
                          <th className="text-right p-3 font-medium">Cash-on-Cash</th>
                          <th className="text-right p-3 font-medium">CF mensual</th>
                          <th className="text-right p-3 font-medium">CF anual</th>
                          <th className="text-right p-3 font-medium">Payback</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.tablaSensibilidad.map((row: any, idx: number) => (
                          <tr
                            key={idx}
                            className={
                              idx === 0
                                ? 'bg-red-50/50'
                                : row.descuentoPct >= 15
                                  ? 'bg-green-50/50'
                                  : ''
                            }
                          >
                            <td className="p-3 font-medium">{fmt(row.precio)}</td>
                            <td className="p-3 text-right">
                              {row.descuentoPct === 0 ? (
                                <Badge className="bg-red-100 text-red-700 text-xs">Asking</Badge>
                              ) : (
                                <span className="text-green-600">-{row.descuentoPct}%</span>
                              )}
                            </td>
                            <td className="p-3 text-right">{fmt(row.inversionTotal)}</td>
                            <td className="p-3 text-right">{fmt(row.capitalPropio)}</td>
                            {usaFinanciacion && (
                              <td className="p-3 text-right">{fmt(row.cuotaMensual)}</td>
                            )}
                            <td className="p-3 text-right font-medium">{row.yieldBruto}%</td>
                            <td className="p-3 text-right font-medium text-blue-600">
                              {row.yieldNeto}%
                            </td>
                            <td className="p-3 text-right font-medium text-green-600">
                              {row.cashOnCash}%
                            </td>
                            <td
                              className={`p-3 text-right font-medium ${row.cashFlowMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {fmt(row.cashFlowMensual)}
                            </td>
                            <td
                              className={`p-3 text-right font-medium ${row.cashFlowAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {fmt(row.cashFlowAnual)}
                            </td>
                            <td className="p-3 text-right">
                              {row.paybackAnos < 100 ? `${row.paybackAnos}a` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Rojo = asking price (techo). Verde = zona de descuento favorable. El cash-flow
                    incluye hipoteca si se usa financiacion.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* TAB: Proyección Cash Flow 10 años */}
          {results?.proyeccion && (
            <TabsContent value="proyeccion">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Proyección Cash Flow a 10 Años
                  </CardTitle>
                  <CardDescription>
                    IPC estimado: 2% anual sobre rentas y gastos. Valor de salida: NOI año 10 × 15
                    (PER).
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* TIR cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {results.tirBruta != null && (
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <div className="text-xs text-purple-600">TIR Bruta (sin financiación)</div>
                        <div className="text-2xl font-bold text-purple-700">
                          {results.tirBruta}%
                        </div>
                      </div>
                    )}
                    {results.tirApalancada != null && (
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <div className="text-xs text-blue-600">TIR Apalancada</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {results.tirApalancada}%
                        </div>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="text-xs text-gray-500">CF acumulado 10 años</div>
                      <div
                        className={`text-2xl font-bold ${(results.proyeccion[9]?.cashFlowAcumulado || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {fmt(results.proyeccion[9]?.cashFlowAcumulado || 0)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <div className="text-xs text-gray-500">Valor salida estimado</div>
                      <div className="text-2xl font-bold">
                        {fmt((results.proyeccion[9]?.noi || 0) * 15)}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead>
                        <tr className="border-b bg-gray-50 text-xs">
                          <th className="text-left p-2 font-medium">Año</th>
                          <th className="text-right p-2 font-medium">Renta bruta</th>
                          <th className="text-right p-2 font-medium">OPEX</th>
                          <th className="text-right p-2 font-medium">NOI</th>
                          <th className="text-right p-2 font-medium">Deuda</th>
                          <th className="text-right p-2 font-medium">Cash Flow</th>
                          <th className="text-right p-2 font-medium">CF Acumulado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.proyeccion.map((row: any) => (
                          <tr
                            key={row.ano}
                            className={
                              row.cashFlowAcumulado >= 0 &&
                              results.proyeccion[row.ano - 2]?.cashFlowAcumulado < 0
                                ? 'bg-green-50'
                                : ''
                            }
                          >
                            <td className="p-2 font-medium">Año {row.ano}</td>
                            <td className="p-2 text-right">{fmt(row.rentaBruta)}</td>
                            <td className="p-2 text-right text-red-600">-{fmt(row.opex)}</td>
                            <td className="p-2 text-right font-medium">{fmt(row.noi)}</td>
                            <td className="p-2 text-right text-gray-500">
                              {row.deuda > 0 ? `-${fmt(row.deuda)}` : '-'}
                            </td>
                            <td
                              className={`p-2 text-right font-medium ${row.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {fmt(row.cashFlow)}
                            </td>
                            <td
                              className={`p-2 text-right ${row.cashFlowAcumulado >= 0 ? 'text-green-600' : 'text-red-600'}`}
                            >
                              {fmt(row.cashFlowAcumulado)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* TAB: Gap Rentas Actual vs Mercado */}
          {results?.gapPorUnidad?.length > 0 && (
            <TabsContent value="gap">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" /> Gap Renta Actual vs Mercado
                  </CardTitle>
                  <CardDescription>
                    Comparativa por unidad entre la renta actual y la renta estimada de mercado.
                    Upside potencial al renovar contratos.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Totals */}
                  {(() => {
                    const totalGap = results.gapPorUnidad.reduce(
                      (s: number, u: any) => s + u.gap,
                      0
                    );
                    const totalActual = results.gapPorUnidad.reduce(
                      (s: number, u: any) => s + u.rentaActual,
                      0
                    );
                    const totalMercado = results.gapPorUnidad.reduce(
                      (s: number, u: any) => s + u.rentaMercado,
                      0
                    );
                    return (
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 border text-center">
                          <div className="text-xs text-gray-500">Renta actual total</div>
                          <div className="text-lg font-bold">{fmt(totalActual)}/mes</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                          <div className="text-xs text-green-600">Renta mercado total</div>
                          <div className="text-lg font-bold text-green-700">
                            {fmt(totalMercado)}/mes
                          </div>
                        </div>
                        <div
                          className={`rounded-lg p-3 border text-center ${totalGap > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                        >
                          <div className="text-xs text-gray-600">Gap (upside)</div>
                          <div
                            className={`text-lg font-bold ${totalGap > 0 ? 'text-green-700' : 'text-red-700'}`}
                          >
                            {totalGap > 0 ? '+' : ''}
                            {fmt(totalGap)}/mes
                          </div>
                          <div className="text-xs text-gray-500">
                            {totalGap > 0 ? '+' : ''}
                            {fmt(totalGap * 12)}/año
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50 text-xs">
                          <th className="text-left p-2">Unidad</th>
                          <th className="text-left p-2">Tipo</th>
                          <th className="text-right p-2">Renta actual</th>
                          <th className="text-right p-2">Renta mercado</th>
                          <th className="text-right p-2">Gap €/mes</th>
                          <th className="text-right p-2">Gap %</th>
                          <th className="p-2">Potencial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {results.gapPorUnidad.map((u: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2 font-medium">{u.referencia}</td>
                            <td className="p-2 text-gray-500">{TIPO_LABELS[u.tipo] || u.tipo}</td>
                            <td className="p-2 text-right">{fmt(u.rentaActual)}</td>
                            <td className="p-2 text-right">{fmt(u.rentaMercado)}</td>
                            <td
                              className={`p-2 text-right font-medium ${u.gap > 0 ? 'text-green-600' : u.gap < 0 ? 'text-red-600' : ''}`}
                            >
                              {u.gap > 0 ? '+' : ''}
                              {fmt(u.gap)}
                            </td>
                            <td
                              className={`p-2 text-right ${u.gapPct > 0 ? 'text-green-600' : u.gapPct < 0 ? 'text-red-600' : ''}`}
                            >
                              {u.gapPct > 0 ? '+' : ''}
                              {u.gapPct}%
                            </td>
                            <td className="p-2">
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${u.gap > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${Math.min(Math.abs(u.gapPct), 100)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Boton calcular + export */}
        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleCalcular} disabled={saving} size="lg">
            <Calculator className="h-4 w-4 mr-2" />
            {saving ? 'Calculando...' : 'Calcular y Guardar'}
          </Button>
          {savedId && (
            <>
              <Button variant="outline" onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport('json')}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar JSON
              </Button>
            </>
          )}
          {results && (
            <Button
              variant="outline"
              onClick={() => {
                setResults(null);
                setSavedId(null);
                setNombre('');
              }}
            >
              Nuevo analisis
            </Button>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
