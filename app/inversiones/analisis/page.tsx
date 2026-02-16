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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2, Plus, Trash2, Calculator, Euro, TrendingUp, Landmark,
  ArrowUpRight, ArrowDownRight, Table2, Save, ParkingCircle, Store, Home,
  Brain, Upload, FileText, Sparkles, Loader2, Copy, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface RentRollEntry {
  tipo: 'vivienda' | 'garaje' | 'local' | 'trastero' | 'oficina' | 'otro';
  referencia: string;
  superficie: number;
  habitaciones: number;
  banos: number;
  rentaMensual: number;
  estado: 'alquilado' | 'vacio' | 'reforma';
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
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiValuation, setAiValuation] = useState<any>(null);
  const [aiText, setAiText] = useState('');

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
    { tipo: 'vivienda', referencia: '', superficie: 0, habitaciones: 0, banos: 0, rentaMensual: 0, estado: 'alquilado' },
  ]);

  const [notas, setNotas] = useState('');

  // Cargar analisis guardados al montar
  useEffect(() => {
    if (status === 'authenticated') {
      setLoadingSaved(true);
      fetch('/api/investment/analysis')
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.data) setSavedAnalyses(data.data); })
        .catch(() => {})
        .finally(() => setLoadingSaved(false));
    }
  }, [status]);

  if (status === 'unauthenticated') { router.push('/login'); }

  const loadSavedAnalysis = async (id: string) => {
    try {
      const res = await fetch(`/api/investment/analysis/${id}`);
      if (!res.ok) { toast.error('Error cargando analisis'); return; }
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
          potencialZona: data.rentaPotencialAnual ? {
            precioM2Zona: data.precioM2Zona,
            rentaPotencialAnual: data.rentaPotencialAnual,
            yieldPotencial: data.yieldPotencial,
            gapRentaActualVsPotencial: data.gapRentaActualVsPotencial,
          } : null,
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
      toast.success('Analisis cargado');
    } catch { toast.error('Error cargando'); }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!savedId) { toast.error('Primero calcula y guarda el analisis'); return; }
    window.open(`/api/investment/analysis/${savedId}/export?format=${format}`, '_blank');
  };

  const addUnit = (tipo: RentRollEntry['tipo'] = 'vivienda') => {
    const needsRooms = ['vivienda', 'oficina'].includes(tipo);
    setRentRoll([...rentRoll, {
      tipo, referencia: '', superficie: 0,
      habitaciones: needsRooms ? 2 : 0,
      banos: needsRooms ? 1 : 0,
      rentaMensual: 0, estado: 'alquilado',
    }]);
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
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

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
      formData.append('context', `Analisis de inversion para grupo societario. Extraer rent roll con viviendas, garajes, locales, trasteros. Datos del activo y gastos.`);

      const res = await fetch('/api/investment/analysis/ai-extract', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Error en analisis IA');
        return;
      }

      const data = await res.json();
      const extracted = data.data;

      // Aplicar rent roll extraido
      if (extracted.rentRoll && extracted.rentRoll.length > 0) {
        setRentRoll(extracted.rentRoll.map((u: any) => ({
          tipo: u.tipo || 'vivienda',
          referencia: u.referencia || '',
          superficie: u.superficie || 0,
          rentaMensual: u.rentaMensual || 0,
          estado: u.estado || 'alquilado',
        })));
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
          nombre, direccion, askingPrice,
          gastosNotaria, gastosRegistro, impuestoCompra,
          comisionCompra, otrosGastosCompra,
          capexReforma, capexImprevistos, capexOtros,
          ibiAnual, comunidadMensual, seguroAnual, mantenimientoAnual,
          gestionAdminPct, vacioEstimadoPct, comisionAlquilerPct, otrosGastosAnuales,
          usaFinanciacion, ltv, tipoInteres, plazoAnos, comisionApertura,
          precioM2Zona: precioM2Zona || undefined,
          precioM2ZonaFuente: precioM2Zona ? precioM2ZonaFuente : undefined,
          rentRoll, notas,
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
      fetch('/api/investment/analysis').then(r => r.ok ? r.json() : null).then(d => { if (d?.data) setSavedAnalyses(d.data); });
      toast.success('Analisis calculado y guardado');
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
          <h1 className="text-2xl font-bold text-gray-900">Analisis de Inversion</h1>
          <p className="text-gray-500">Introduce el rent roll y datos del activo para calcular rentabilidad y sensibilidad</p>
        </div>

        <Tabs defaultValue="datos" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1">
            <TabsTrigger value="guardados" className="gap-1 text-xs"><Save className="h-3 w-3" /> Guardados</TabsTrigger>
            <TabsTrigger value="ia" className="gap-1 text-xs"><Brain className="h-3 w-3" /> IA</TabsTrigger>
            <TabsTrigger value="datos" className="text-xs">Activo</TabsTrigger>
            <TabsTrigger value="rentroll" className="text-xs">Rent Roll</TabsTrigger>
            <TabsTrigger value="gastos" className="text-xs">Gastos</TabsTrigger>
            <TabsTrigger value="financiacion" className="text-xs">Financiacion</TabsTrigger>
            {results && <TabsTrigger value="resultados" className="text-xs">Resultados</TabsTrigger>}
            {results && <TabsTrigger value="sensibilidad" className="text-xs">Sensibilidad</TabsTrigger>}
          </TabsList>

          {/* TAB: Analisis guardados */}
          <TabsContent value="guardados">
            <Card>
              <CardHeader>
                <CardTitle>Analisis Guardados</CardTitle>
                <CardDescription>Selecciona un analisis para cargarlo o exportarlo</CardDescription>
              </CardHeader>
              <CardContent>
                {savedAnalyses.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay analisis guardados. Crea uno nuevo desde las pestanas.</p>
                ) : (
                  <div className="space-y-2">
                    {savedAnalyses.map((a) => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1 cursor-pointer" onClick={() => loadSavedAnalysis(a.id)}>
                          <div className="font-medium text-gray-900">{a.nombre}</div>
                          <div className="text-sm text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                            {a.direccion && <span>{a.direccion}</span>}
                            <span>{fmt(a.askingPrice || 0)}</span>
                            {a.yieldNeto != null && <span>Yield: {a.yieldNeto}%</span>}
                            {a.cashOnCash != null && <span>CoC: {a.cashOnCash}%</span>}
                          </div>
                          <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString('es-ES')}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setSavedId(a.id); handleExport('csv'); }}>
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
                    Sube un documento (rent roll, ficha del activo, informe de valoracion) y la IA extraera
                    automaticamente las unidades, rentas, gastos y datos del activo. Tambien generara una
                    valoracion IA si hay datos suficientes.
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
                            <span className="text-sm text-purple-600">Analizando documento con IA...</span>
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
                      placeholder="Pega aqui el rent roll, datos del activo, o cualquier informacion relevante...

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
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analizando...</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Extraer con IA</>
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
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(aiValuation.estimatedValue)}
                          </div>
                        </div>
                      )}
                      {aiValuation.minValue && (
                        <div>
                          <span className="text-gray-500">Rango minimo</span>
                          <div className="font-medium">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(aiValuation.minValue)}
                          </div>
                        </div>
                      )}
                      {aiValuation.maxValue && (
                        <div>
                          <span className="text-gray-500">Rango maximo</span>
                          <div className="font-medium">
                            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(aiValuation.maxValue)}
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
                      <p className="text-sm text-gray-600 mt-3 border-t pt-3">{aiValuation.reasoning}</p>
                    )}
                    {aiValuation.estimatedValue && askingPrice > 0 && (
                      <div className="mt-3 p-3 rounded-lg bg-white border">
                        <span className="text-sm text-gray-500">Asking vs Valoracion IA: </span>
                        <span className={`font-bold ${askingPrice > aiValuation.estimatedValue ? 'text-red-600' : 'text-green-600'}`}>
                          {askingPrice > aiValuation.estimatedValue
                            ? `Asking ${Math.round((askingPrice / aiValuation.estimatedValue - 1) * 100)}% POR ENCIMA de valoracion`
                            : `Asking ${Math.round((1 - askingPrice / aiValuation.estimatedValue) * 100)}% por debajo de valoracion`
                          }
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
                    <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Edificio Calle Mayor 12" />
                  </div>
                  <div>
                    <Label>Direccion</Label>
                    <Input value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Calle, numero, ciudad" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Precio que piden (asking price) *</Label>
                    <Input type="number" value={askingPrice || ''} onChange={e => setAskingPrice(Number(e.target.value))} placeholder="500000" />
                    <p className="text-xs text-gray-400 mt-1">Techo maximo para la tabla de sensibilidad</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>EUR/m2 alquiler de la zona</Label>
                    <Input type="number" step="0.5" value={precioM2Zona || ''} onChange={e => setPrecioM2Zona(Number(e.target.value))} placeholder="12.50" />
                    <p className="text-xs text-gray-400 mt-1">Para calcular potencial de rentabilidad</p>
                  </div>
                  <div>
                    <Label>Fuente del dato</Label>
                    <Select value={precioM2ZonaFuente} onValueChange={setPrecioM2ZonaFuente}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
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
                    <Button variant="outline" size="sm" disabled={aiLoading} onClick={async () => {
                      if (!direccion) { toast.error('Introduce direccion primero'); return; }
                      setAiLoading(true);
                      try {
                        const formData = new FormData();
                        formData.append('text', `Estima el precio medio de alquiler por m2 en la zona de: ${direccion}. Responde SOLO con un numero decimal (ej: 12.5)`);
                        formData.append('context', 'Precio EUR/m2 alquiler zona');
                        const res = await fetch('/api/investment/analysis/ai-extract', { method: 'POST', body: formData });
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
                      } catch {} finally { setAiLoading(false); }
                    }}>
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      Estimar con IA
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Gastos de compra</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                    <div><Label className="text-xs">Notaria</Label><Input type="number" value={gastosNotaria} onChange={e => setGastosNotaria(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">Registro</Label><Input type="number" value={gastosRegistro} onChange={e => setGastosRegistro(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">ITP/IVA (%)</Label><Input type="number" value={impuestoCompra} onChange={e => setImpuestoCompra(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">Comision compra (%)</Label><Input type="number" value={comisionCompra} onChange={e => setComisionCompra(Number(e.target.value))} /></div>
                    <div><Label className="text-xs">Otros gastos</Label><Input type="number" value={otrosGastosCompra} onChange={e => setOtrosGastosCompra(Number(e.target.value))} /></div>
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
                      {rentRoll.length} unidades | Renta mensual: {fmt(totalRentaMensual)} | Anual: {fmt(totalRentaAnual)}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="outline" onClick={() => addUnit('vivienda')}><Home className="h-3 w-3 mr-1" />Viv</Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('garaje')}><ParkingCircle className="h-3 w-3 mr-1" />Gar</Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('local')}><Store className="h-3 w-3 mr-1" />Loc</Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('trastero')}>Tra</Button>
                    <Button size="sm" variant="outline" onClick={() => addUnit('oficina')}>Ofi</Button>
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
                            <Select value={unit.tipo} onValueChange={v => updateUnit(idx, 'tipo', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                                  <SelectItem key={k} value={k}>{v}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Input className="h-8 text-sm flex-1" placeholder="Ref: 1A, Local B..." value={unit.referencia}
                            onChange={e => updateUnit(idx, 'referencia', e.target.value)} />
                          <div className="w-28 shrink-0">
                            <Select value={unit.estado} onValueChange={v => updateUnit(idx, 'estado', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="alquilado">Alquilado</SelectItem>
                                <SelectItem value="vacio">Vacio</SelectItem>
                                <SelectItem value="reforma">Reforma</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-gray-400 shrink-0" onClick={() => duplicateUnit(idx)} title="Duplicar">
                            <Copy className="h-3 w-3" />
                          </Button>
                          {rentRoll.length > 1 && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 shrink-0" onClick={() => removeUnit(idx)}>
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
                        <div className={`grid gap-2 ${showRooms ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2'}`}>
                          <div>
                            <Label className="text-[10px] text-gray-400">Superficie (m2)</Label>
                            <Input className="h-8 text-sm" type="number" placeholder="75" value={unit.superficie || ''}
                              onChange={e => updateUnit(idx, 'superficie', Number(e.target.value))} />
                          </div>
                          {showRooms && (
                            <>
                              <div>
                                <Label className="text-[10px] text-gray-400">Habitaciones</Label>
                                <Input className="h-8 text-sm" type="number" placeholder="2" value={unit.habitaciones || ''}
                                  onChange={e => updateUnit(idx, 'habitaciones', Number(e.target.value))} />
                              </div>
                              <div>
                                <Label className="text-[10px] text-gray-400">Banos</Label>
                                <Input className="h-8 text-sm" type="number" placeholder="1" value={unit.banos || ''}
                                  onChange={e => updateUnit(idx, 'banos', Number(e.target.value))} />
                              </div>
                            </>
                          )}
                          <div>
                            <Label className="text-[10px] text-gray-400">Renta EUR/mes</Label>
                            <Input className="h-8 text-sm" type="number" placeholder="800" value={unit.rentaMensual || ''}
                              onChange={e => updateUnit(idx, 'rentaMensual', Number(e.target.value))} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen por tipo */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                  {(['vivienda', 'garaje', 'local', 'trastero', 'oficina'] as const).map(tipo => {
                    const count = rentRoll.filter(u => u.tipo === tipo).length;
                    const renta = rentRoll.filter(u => u.tipo === tipo).reduce((s, u) => s + u.rentaMensual, 0);
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
                <CardHeader><CardTitle className="text-lg">OPEX (Gastos recurrentes anuales)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-sm">IBI anual</Label><Input type="number" value={ibiAnual} onChange={e => setIbiAnual(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Comunidad mensual</Label><Input type="number" value={comunidadMensual} onChange={e => setComunidadMensual(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Seguro anual</Label><Input type="number" value={seguroAnual} onChange={e => setSeguroAnual(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Mantenimiento anual</Label><Input type="number" value={mantenimientoAnual} onChange={e => setMantenimientoAnual(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Gestion/Admin (% renta bruta)</Label><Input type="number" value={gestionAdminPct} onChange={e => setGestionAdminPct(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Vacio estimado (%)</Label><Input type="number" value={vacioEstimadoPct} onChange={e => setVacioEstimadoPct(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Comision alquiler (% nueva contratacion)</Label><Input type="number" value={comisionAlquilerPct} onChange={e => setComisionAlquilerPct(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Otros gastos anuales</Label><Input type="number" value={otrosGastosAnuales} onChange={e => setOtrosGastosAnuales(Number(e.target.value))} /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">CAPEX (Inversiones)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div><Label className="text-sm">Reforma/Rehabilitacion</Label><Input type="number" value={capexReforma} onChange={e => setCapexReforma(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Imprevistos (% sobre CAPEX)</Label><Input type="number" value={capexImprevistos} onChange={e => setCapexImprevistos(Number(e.target.value))} /></div>
                  <div><Label className="text-sm">Otros CAPEX</Label><Input type="number" value={capexOtros} onChange={e => setCapexOtros(Number(e.target.value))} /></div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB: Financiacion */}
          <TabsContent value="financiacion">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2"><Landmark className="h-5 w-5" /> Financiacion</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Usar financiacion</Label>
                    <Switch checked={usaFinanciacion} onCheckedChange={setUsaFinanciacion} />
                  </div>
                </div>
              </CardHeader>
              {usaFinanciacion && (
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><Label className="text-sm">LTV (% financiado)</Label><Input type="number" value={ltv} onChange={e => setLtv(Number(e.target.value))} /></div>
                    <div><Label className="text-sm">Tipo interes anual (%)</Label><Input type="number" step="0.1" value={tipoInteres} onChange={e => setTipoInteres(Number(e.target.value))} /></div>
                    <div><Label className="text-sm">Plazo (anos)</Label><Input type="number" value={plazoAnos} onChange={e => setPlazoAnos(Number(e.target.value))} /></div>
                    <div><Label className="text-sm">Comision apertura (%)</Label><Input type="number" step="0.1" value={comisionApertura} onChange={e => setComisionApertura(Number(e.target.value))} /></div>
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
                  const color = isGood ? 'bg-green-100 border-green-300 text-green-800' : isOk ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-red-100 border-red-300 text-red-800';
                  const label = isGood ? 'Buena oportunidad' : isOk ? 'Aceptable' : 'Rentabilidad baja';
                  return (
                    <div className={`p-3 rounded-lg border text-sm font-medium text-center ${color}`}>
                      {label} — Yield neto {y}% | PER {results.per || 0}x | {fmt(results.precioM2Activo || 0)}/m2
                    </div>
                  );
                })()}

                {/* KPIs principales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card><CardContent className="p-4">
                    <div className="text-xs text-gray-500">Yield Bruto</div>
                    <div className="text-2xl font-bold">{results.yieldBruto}%</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <div className="text-xs text-gray-500">Yield Neto</div>
                    <div className="text-2xl font-bold text-blue-600">{results.yieldNeto}%</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <div className="text-xs text-gray-500">Cash-on-Cash</div>
                    <div className="text-2xl font-bold text-green-600">{results.cashOnCash}%</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-4">
                    <div className="text-xs text-gray-500">Payback</div>
                    <div className="text-2xl font-bold">{results.paybackAnos < 100 ? `${results.paybackAnos} a` : 'N/A'}</div>
                  </CardContent></Card>
                </div>

                {/* KPIs secundarios */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  <Card><CardContent className="p-3">
                    <div className="text-[10px] text-gray-400">Precio/m2</div>
                    <div className="text-sm font-bold">{fmt(results.precioM2Activo || 0)}</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-3">
                    <div className="text-[10px] text-gray-400">PER (multiplo)</div>
                    <div className="text-sm font-bold">{results.per || 0}x</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-3">
                    <div className="text-[10px] text-gray-400">Renta/m2/mes</div>
                    <div className="text-sm font-bold">{results.rentaM2Mensual || 0} €</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-3">
                    <div className="text-[10px] text-gray-400">NOI anual</div>
                    <div className="text-sm font-bold">{fmt(results.noiAnual || 0)}</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-3">
                    <div className="text-[10px] text-gray-400">CF mensual</div>
                    <div className={`text-sm font-bold ${(results.cashFlowAnualPreTax || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt((results.cashFlowAnualPreTax || 0) / 12)}</div>
                  </CardContent></Card>
                  <Card><CardContent className="p-3">
                    <div className="text-[10px] text-gray-400">Superficie</div>
                    <div className="text-sm font-bold">{results.rentRollSummary?.superficieTotal || 0} m2</div>
                  </CardContent></Card>
                </div>

                {/* Rentabilidad por tipo */}
                {results.rentabilidadPorTipo && results.rentabilidadPorTipo.length > 1 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Rentabilidad por Tipo</CardTitle></CardHeader>
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
                                <td className="p-2 text-right font-medium text-blue-600">{t.eurM2Mes} €</td>
                                <td className="p-2 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <div className="w-12 h-2 bg-gray-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(t.pctDelTotal, 100)}%` }} />
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
                    <CardHeader><CardTitle className="text-lg">Ingresos</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Renta bruta mensual</span><span className="font-medium">{fmt(results.rentaBrutaMensual)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Renta bruta anual</span><span className="font-medium">{fmt(results.rentaBrutaAnual)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">(-) Ajuste vacio ({vacioEstimadoPct}%)</span><span className="text-red-600">-{fmt(results.ajusteVacio)}</span></div>
                      <div className="flex justify-between border-t pt-2 font-bold"><span>Renta efectiva anual</span><span>{fmt(results.rentaEfectivaAnual)}</span></div>
                    </CardContent>
                  </Card>

                  {/* Inversion */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Inversion</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500">Precio compra</span><span className="font-medium">{fmt(askingPrice)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Gastos compra</span><span>{fmt(results.totalGastosCompra)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">CAPEX</span><span>{fmt(results.totalCapex)}</span></div>
                      <div className="flex justify-between border-t pt-2 font-bold"><span>Inversion total</span><span>{fmt(results.inversionTotal)}</span></div>
                      {usaFinanciacion && <>
                        <div className="flex justify-between"><span className="text-gray-500">Hipoteca ({ltv}%)</span><span>-{fmt(results.importeHipoteca)}</span></div>
                        <div className="flex justify-between font-bold"><span>Capital propio</span><span className="text-blue-600">{fmt(results.capitalPropio)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Cuota mensual</span><span>{fmt(results.cuotaMensual)}</span></div>
                      </>}
                    </CardContent>
                  </Card>

                  {/* OPEX */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">OPEX Anual</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {results.detalleOpex ? (<>
                        <div className="flex justify-between"><span className="text-gray-500">IBI</span><span>{fmt(results.detalleOpex.ibi || 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Comunidad</span><span>{fmt(results.detalleOpex.comunidad || 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Seguro</span><span>{fmt(results.detalleOpex.seguro || 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Mantenimiento</span><span>{fmt(results.detalleOpex.mantenimiento || 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Gestion admin</span><span>{fmt(results.detalleOpex.gestionAdmin || 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Comisiones</span><span>{fmt(results.detalleOpex.comisionAlquiler || 0)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Otros</span><span>{fmt(results.detalleOpex.otros || 0)}</span></div>
                      </>) : (
                        <p className="text-gray-400 text-xs">Recalcula para ver el desglose</p>
                      )}
                      <div className="flex justify-between border-t pt-2 font-bold"><span>Total OPEX</span><span className="text-red-600">{fmt(results.opexAnual || 0)}</span></div>
                    </CardContent>
                  </Card>

                  {/* Cash-flow */}
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Cash-Flow Anual</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-green-500" />Renta efectiva</span><span className="text-green-600">+{fmt(results.rentaEfectivaAnual)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><ArrowDownRight className="h-3 w-3 text-red-500" />OPEX</span><span className="text-red-600">-{fmt(results.opexAnual)}</span></div>
                      <div className="flex justify-between font-medium"><span>NOI</span><span>{fmt(results.noiAnual)}</span></div>
                      {usaFinanciacion && (
                        <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Landmark className="h-3 w-3" />Hipoteca anual</span><span className="text-red-600">-{fmt(results.cuotaAnual)}</span></div>
                      )}
                      <div className="flex justify-between border-t pt-2 font-bold text-lg">
                        <span>Cash-Flow pre-tax</span>
                        <span className={results.cashFlowAnualPreTax >= 0 ? 'text-green-600' : 'text-red-600'}>{fmt(results.cashFlowAnualPreTax)}</span>
                      </div>
                      <div className="text-xs text-gray-400 text-right">= {fmt(results.cashFlowAnualPreTax / 12)}/mes</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Rent Roll Summary */}
                {/* Potencial de zona */}
                {results.potencialZona && (
                  <Card className="border-green-200 bg-green-50/30 md:col-span-2">
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-600" /> Potencial de Rentabilidad por Zona</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">EUR/m2 zona</span>
                          <div className="text-lg font-bold">{results.potencialZona.precioM2Zona} EUR</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Renta potencial anual</span>
                          <div className="text-lg font-bold text-green-600">{fmt(results.potencialZona.rentaPotencialAnual)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Yield potencial</span>
                          <div className="text-lg font-bold text-green-600">{results.potencialZona.yieldPotencial}%</div>
                        </div>
                        <div>
                          <span className="text-gray-500">CF potencial anual</span>
                          <div className={`text-lg font-bold ${results.potencialZona.cashFlowPotencialAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {fmt(results.potencialZona.cashFlowPotencialAnual)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Gap vs actual</span>
                          <div className={`text-lg font-bold ${results.potencialZona.gapRentaActualVsPotencial > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                            {results.potencialZona.gapRentaActualVsPotencial > 0 ? '+' : ''}{results.potencialZona.gapRentaActualVsPotencial}%
                          </div>
                          <div className="text-xs text-gray-400">
                            {results.potencialZona.upside > 0
                              ? `+${fmt(results.potencialZona.upside)}/ano de upside`
                              : 'Renta actual por encima de mercado'
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader><CardTitle className="text-lg">Resumen Rent Roll</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline">{results.rentRollSummary.totalUnidades} unidades</Badge>
                      {results.rentRollSummary.viviendas > 0 && <Badge variant="outline">{results.rentRollSummary.viviendas} viviendas</Badge>}
                      {results.rentRollSummary.garajes > 0 && <Badge variant="outline">{results.rentRollSummary.garajes} garajes</Badge>}
                      {results.rentRollSummary.locales > 0 && <Badge variant="outline">{results.rentRollSummary.locales} locales</Badge>}
                      {results.rentRollSummary.trasteros > 0 && <Badge variant="outline">{results.rentRollSummary.trasteros} trasteros</Badge>}
                      {results.rentRollSummary.otros > 0 && <Badge variant="outline">{results.rentRollSummary.otros} otros</Badge>}
                      <Badge variant="outline">Ocupacion: {results.rentRollSummary.ocupacionActual}%</Badge>
                      <Badge variant="outline">{results.rentRollSummary.superficieTotal} m2</Badge>
                      {results.rentRollSummary.totalHabitaciones > 0 && <Badge variant="outline">{results.rentRollSummary.totalHabitaciones} hab.</Badge>}
                      {results.rentRollSummary.totalBanos > 0 && <Badge variant="outline">{results.rentRollSummary.totalBanos} banos</Badge>}
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
                  <CardTitle className="flex items-center gap-2"><Table2 className="h-5 w-5" /> Tabla de Sensibilidad</CardTitle>
                  <CardDescription>Partiendo del asking price ({fmt(askingPrice)}) como maximo, bajando en escalones del 5%</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400 mb-2 md:hidden">Desliza horizontalmente para ver todas las columnas →</p>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full text-sm min-w-[800px]">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium">Precio</th>
                          <th className="text-right p-3 font-medium">Dto.</th>
                          <th className="text-right p-3 font-medium">Inversion</th>
                          <th className="text-right p-3 font-medium">Capital propio</th>
                          {usaFinanciacion && <th className="text-right p-3 font-medium">Cuota/mes</th>}
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
                          <tr key={idx} className={idx === 0 ? 'bg-red-50/50' : row.descuentoPct >= 15 ? 'bg-green-50/50' : ''}>
                            <td className="p-3 font-medium">{fmt(row.precio)}</td>
                            <td className="p-3 text-right">
                              {row.descuentoPct === 0
                                ? <Badge className="bg-red-100 text-red-700 text-xs">Asking</Badge>
                                : <span className="text-green-600">-{row.descuentoPct}%</span>
                              }
                            </td>
                            <td className="p-3 text-right">{fmt(row.inversionTotal)}</td>
                            <td className="p-3 text-right">{fmt(row.capitalPropio)}</td>
                            {usaFinanciacion && <td className="p-3 text-right">{fmt(row.cuotaMensual)}</td>}
                            <td className="p-3 text-right font-medium">{row.yieldBruto}%</td>
                            <td className="p-3 text-right font-medium text-blue-600">{row.yieldNeto}%</td>
                            <td className="p-3 text-right font-medium text-green-600">{row.cashOnCash}%</td>
                            <td className={`p-3 text-right font-medium ${row.cashFlowMensual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fmt(row.cashFlowMensual)}
                            </td>
                            <td className={`p-3 text-right font-medium ${row.cashFlowAnual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {fmt(row.cashFlowAnual)}
                            </td>
                            <td className="p-3 text-right">{row.paybackAnos < 100 ? `${row.paybackAnos}a` : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">
                    Rojo = asking price (techo). Verde = zona de descuento favorable. El cash-flow incluye hipoteca si se usa financiacion.
                  </p>
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
            <Button variant="outline" onClick={() => { setResults(null); setSavedId(null); setNombre(''); }}>
              Nuevo analisis
            </Button>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
