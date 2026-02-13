'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Home,
  ArrowLeft,
  Brain,
  TrendingUp,
  TrendingDown,
  Building2,
  MapPin,
  Euro,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Calculator,
  FileText,
  Download,
  RefreshCw,
  Info,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Award,
  Lightbulb,
  Clock,
  Users,
  Ruler,
  Car,
  Trees,
  Waves,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import logger from '@/lib/logger';
import { AIDocumentAssistant } from '@/components/ai/AIDocumentAssistant';

// Tipos para la valoración
interface Building {
  id: string;
  nombre?: string;
  direccion?: string;
  ciudad?: string;
  codigoPostal?: string;
  numeroUnidades?: number;
}

interface Unit {
  id: string;
  numero: string;
  tipo?: string;
  superficie?: number;
  habitaciones?: number;
  banos?: number;
  estado?: string;
  building?: {
    id: string;
    nombre: string;
    direccion?: string;
    ciudad?: string;
  };
}

interface ValoracionResult {
  valorEstimado: number;
  valorMinimo: number;
  valorMaximo: number;
  precioM2: number;
  confianza: number;
  tendenciaMercado: 'alcista' | 'bajista' | 'estable';
  porcentajeTendencia: number;
  comparables: Array<{
    direccion: string;
    precio: number;
    superficie: number;
    precioM2: number;
    similitud: number;
  }>;
  factoresPositivos: string[];
  factoresNegativos: string[];
  recomendaciones: string[];
  analisisMercado: string;
  tiempoEstimadoVenta: string;
  rentabilidadAlquiler: number;
  alquilerEstimado: number;
}

// Características del inmueble
const CARACTERISTICAS = [
  { id: 'ascensor', label: 'Ascensor', icon: ArrowUpRight },
  { id: 'terraza', label: 'Terraza', icon: Trees },
  { id: 'piscina', label: 'Piscina', icon: Waves },
  { id: 'garaje', label: 'Garaje', icon: Car },
  { id: 'trastero', label: 'Trastero', icon: Building2 },
  { id: 'aire_acondicionado', label: 'Aire acondicionado', icon: Zap },
  { id: 'calefaccion', label: 'Calefacción', icon: Zap },
  { id: 'jardin', label: 'Jardín', icon: Trees },
];

export default function ValoracionIAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [valorando, setValorando] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('manual');
  const [assetType, setAssetType] = useState<'unit' | 'building'>('unit');
  const [resultado, setResultado] = useState<ValoracionResult | null>(null);
  
  // Datos del formulario
  const [formData, setFormData] = useState({
    superficie: '',
    habitaciones: '',
    banos: '',
    antiguedad: '',
    estadoConservacion: 'bueno',
    orientacion: 'sur',
    planta: '',
    finalidad: 'venta',
    caracteristicas: [] as string[],
    descripcionAdicional: '',
  });

  // Cargar datos al iniciar
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAssets();
    }
  }, [status, router]);

  const fetchAssets = async () => {
    try {
      const [unitsRes, buildingsRes] = await Promise.all([
        fetch('/api/units'),
        fetch('/api/buildings'),
      ]);
      
      if (unitsRes.ok) {
        const unitsData = await unitsRes.json();
        setUnits(Array.isArray(unitsData) ? unitsData : []);
      }
      
      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        const normalizedBuildings = Array.isArray(buildingsData)
          ? buildingsData
          : Array.isArray(buildingsData?.data)
            ? buildingsData.data
            : [];
        setBuildings(normalizedBuildings);
      }
    } catch (error) {
      logger.error('Error fetching assets:', error);
      toast.error('Error al cargar los activos');
    } finally {
      setLoading(false);
    }
  };

  // Cuando se selecciona un activo, rellenar datos automáticamente
  const handleAssetSelect = (assetId: string) => {
    setSelectedAsset(assetId);
    
    // Si es "manual", no rellenar datos automáticamente
    if (assetId === 'manual') {
      return;
    }
    
    if (assetType === 'unit') {
      const unit = units.find(u => u.id === assetId);
      if (unit) {
        setFormData(prev => ({
          ...prev,
          superficie: unit.superficie?.toString() || '',
          habitaciones: unit.habitaciones?.toString() || '',
          banos: unit.banos?.toString() || '',
        }));
      }
    }
  };

  // Toggle característica
  const toggleCaracteristica = (id: string) => {
    setFormData(prev => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(id)
        ? prev.caracteristicas.filter(c => c !== id)
        : [...prev.caracteristicas, id],
    }));
  };

  // Realizar valoración con IA
  const handleValorar = async () => {
    if (!formData.superficie || parseFloat(formData.superficie) <= 0) {
      toast.error('Por favor indica la superficie del inmueble');
      return;
    }

    setValorando(true);
    setResultado(null);

    try {
      // Obtener datos del activo seleccionado
      let direccion = '';
      let ciudad = '';
      
      if (selectedAsset && selectedAsset !== 'manual' && assetType === 'unit') {
        const unit = units.find(u => u.id === selectedAsset);
        direccion = unit?.building?.direccion || '';
        ciudad = unit?.building?.ciudad || 'Madrid';
      } else if (selectedAsset && selectedAsset !== 'manual' && assetType === 'building') {
        const building = buildings.find(b => b.id === selectedAsset);
        direccion = building?.direccion || '';
        ciudad = building?.ciudad || 'Madrid';
      }

      const response = await fetch('/api/ai/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          superficie: parseFloat(formData.superficie),
          habitaciones: parseInt(formData.habitaciones) || 0,
          banos: parseInt(formData.banos) || 0,
          antiguedad: parseInt(formData.antiguedad) || 0,
          planta: parseInt(formData.planta) || 0,
          direccion,
          ciudad,
          codigoPostal: '',
          unitId: assetType === 'unit' && selectedAsset !== 'manual' ? selectedAsset : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al realizar la valoración');
      }

      const data = await response.json();
      setResultado(data);
      toast.success('Valoración completada con éxito');
      
    } catch (error: any) {
      logger.error('Error en valoración:', error);
      toast.error(error.message || 'Error al realizar la valoración con IA');
    } finally {
      setValorando(false);
    }
  };

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Obtener icono de tendencia
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'alcista':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'bajista':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-yellow-500" />;
    }
  };

  // Guardar valoración en BD
  const handleGuardar = async () => {
    if (!resultado) return;

    try {
      let direccion = '';
      let ciudad = '';
      let unitId: string | undefined;
      let buildingId: string | undefined;

      if (selectedAsset && selectedAsset !== 'manual' && assetType === 'unit') {
        const unit = units.find(u => u.id === selectedAsset);
        direccion = unit?.building?.direccion || '';
        ciudad = unit?.building?.ciudad || '';
        unitId = selectedAsset;
      } else if (selectedAsset && selectedAsset !== 'manual' && assetType === 'building') {
        const building = buildings.find(b => b.id === selectedAsset);
        direccion = building?.direccion || '';
        ciudad = building?.ciudad || '';
        buildingId = selectedAsset;
      }

      const response = await fetch('/api/valoraciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          buildingId,
          direccion,
          ciudad,
          superficie: parseFloat(formData.superficie) || 0,
          habitaciones: parseInt(formData.habitaciones) || null,
          banos: parseInt(formData.banos) || null,
          antiguedad: parseInt(formData.antiguedad) || null,
          estadoConservacion: formData.estadoConservacion,
          orientacion: formData.orientacion,
          finalidad: formData.finalidad,
          caracteristicas: formData.caracteristicas,
          resultado,
        }),
      });

      if (response.ok) {
        toast.success('Valoración guardada correctamente');
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err.message || 'Error al guardar la valoración');
      }
    } catch (error) {
      logger.error('Error guardando valoración:', error);
      toast.error('Error al guardar la valoración');
    }
  };

  // Descargar informe como archivo de texto
  const handleDescargarInforme = () => {
    if (!resultado) return;

    const lines = [
      '════════════════════════════════════════════════════════',
      '         INFORME DE VALORACIÓN DE ACTIVO INMOBILIARIO',
      '                    Generado por Inmova IA',
      '════════════════════════════════════════════════════════',
      '',
      `Fecha: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}`,
      '',
      '── DATOS DEL INMUEBLE ──────────────────────────────────',
      `Superficie: ${formData.superficie} m²`,
      `Habitaciones: ${formData.habitaciones || 'N/A'}`,
      `Baños: ${formData.banos || 'N/A'}`,
      `Antigüedad: ${formData.antiguedad ? formData.antiguedad + ' años' : 'N/A'}`,
      `Estado: ${formData.estadoConservacion}`,
      `Orientación: ${formData.orientacion}`,
      `Finalidad: ${formData.finalidad}`,
      formData.caracteristicas.length > 0 ? `Características: ${formData.caracteristicas.join(', ')}` : '',
      '',
      '── VALORACIÓN ESTIMADA ─────────────────────────────────',
      `Valor estimado: ${formatCurrency(resultado.valorEstimado)}`,
      `Rango: ${formatCurrency(resultado.valorMinimo)} - ${formatCurrency(resultado.valorMaximo)}`,
      `Precio por m²: ${formatCurrency(resultado.precioM2)}`,
      `Nivel de confianza: ${resultado.confianza}%`,
      `Tendencia del mercado: ${resultado.tendenciaMercado} (${resultado.porcentajeTendencia}%)`,
      `Tiempo estimado de venta: ${resultado.tiempoEstimadoVenta}`,
      '',
    ];

    if (formData.finalidad === 'alquiler' || formData.finalidad === 'ambos') {
      lines.push(
        '── RENTABILIDAD ────────────────────────────────────────',
        `Alquiler mensual estimado: ${formatCurrency(resultado.alquilerEstimado)}/mes`,
        `Rentabilidad bruta: ${resultado.rentabilidadAlquiler.toFixed(2)}%`,
        '',
      );
    }

    if (resultado.factoresPositivos.length > 0) {
      lines.push('── FACTORES POSITIVOS ──────────────────────────────────');
      resultado.factoresPositivos.forEach(f => lines.push(`  + ${f}`));
      lines.push('');
    }

    if (resultado.factoresNegativos.length > 0) {
      lines.push('── FACTORES NEGATIVOS ──────────────────────────────────');
      resultado.factoresNegativos.forEach(f => lines.push(`  - ${f}`));
      lines.push('');
    }

    if (resultado.recomendaciones.length > 0) {
      lines.push('── RECOMENDACIONES ─────────────────────────────────────');
      resultado.recomendaciones.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));
      lines.push('');
    }

    if (resultado.comparables.length > 0) {
      lines.push('── PROPIEDADES COMPARABLES ─────────────────────────────');
      resultado.comparables.forEach((c, i) => {
        lines.push(`  ${i + 1}. ${c.direccion}`);
        lines.push(`     Precio: ${formatCurrency(c.precio)} | ${c.superficie}m² | ${formatCurrency(c.precioM2)}/m² | Similitud: ${Math.round(c.similitud * 100)}%`);
      });
      lines.push('');
    }

    if (resultado.analisisMercado) {
      lines.push('── ANÁLISIS DE MERCADO ─────────────────────────────────');
      lines.push(resultado.analisisMercado);
      lines.push('');
    }

    lines.push('════════════════════════════════════════════════════════');
    lines.push('Informe generado automáticamente por Inmova App');
    lines.push('https://inmovaapp.com');

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-valoracion-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Informe descargado');
  };

  // Obtener color de tendencia
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'alcista':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'bajista':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando activos...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Valoración con IA</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Valoración de Activos con IA</h1>
                  <p className="text-muted-foreground mt-1">
                    Tasación inteligente de propiedades con análisis de mercado
                  </p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3 text-violet-500" />
              Powered by Claude AI
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Panel de Formulario */}
          <div className="space-y-6">
            {/* Selección de Activo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Seleccionar Activo a Valorar
                </CardTitle>
                <CardDescription>
                  Elige un inmueble de tu cartera o introduce datos manualmente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tipo de activo */}
                <div className="space-y-2">
                  <Label>Tipo de Activo</Label>
                  <Select 
                    value={assetType} 
                    onValueChange={(v: 'unit' | 'building') => {
                      setAssetType(v);
                      setSelectedAsset('manual');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unit">Unidades / Viviendas</SelectItem>
                      <SelectItem value="building">Edificios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Selector de activo */}
                <div className="space-y-2">
                  <Label>Seleccionar Activo</Label>
                  <Select value={selectedAsset} onValueChange={handleAssetSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un activo de tu cartera..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">-- Introducir datos manualmente --</SelectItem>
                      {assetType === 'unit' ? (
                        units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
                            {unit.building?.nombre || 'Sin edificio'} - Unidad {unit.numero}
                            {unit.superficie && ` (${unit.superficie}m²)`}
                          </SelectItem>
                        ))
                      ) : (
                        buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id}>
                            {building.nombre || building.direccion || 'Sin dirección'}
                            {building.numeroUnidades
                              ? ` (${building.numeroUnidades} unidades)`
                              : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Características del Inmueble */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Características del Inmueble
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="superficie">Superficie (m²) *</Label>
                    <Input
                      id="superficie"
                      type="number"
                      placeholder="85"
                      value={formData.superficie}
                      onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="habitaciones">Habitaciones</Label>
                    <Input
                      id="habitaciones"
                      type="number"
                      placeholder="3"
                      value={formData.habitaciones}
                      onChange={(e) => setFormData({ ...formData, habitaciones: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banos">Baños</Label>
                    <Input
                      id="banos"
                      type="number"
                      placeholder="2"
                      value={formData.banos}
                      onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="antiguedad">Antigüedad (años)</Label>
                    <Input
                      id="antiguedad"
                      type="number"
                      placeholder="15"
                      value={formData.antiguedad}
                      onChange={(e) => setFormData({ ...formData, antiguedad: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planta">Planta</Label>
                    <Input
                      id="planta"
                      type="number"
                      placeholder="3"
                      value={formData.planta}
                      onChange={(e) => setFormData({ ...formData, planta: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select 
                      value={formData.estadoConservacion}
                      onValueChange={(v) => setFormData({ ...formData, estadoConservacion: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excelente">Excelente / A estrenar</SelectItem>
                        <SelectItem value="muy_bueno">Muy bueno</SelectItem>
                        <SelectItem value="bueno">Bueno</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="reformar">A reformar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Orientación</Label>
                    <Select 
                      value={formData.orientacion}
                      onValueChange={(v) => setFormData({ ...formData, orientacion: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="norte">Norte</SelectItem>
                        <SelectItem value="sur">Sur</SelectItem>
                        <SelectItem value="este">Este</SelectItem>
                        <SelectItem value="oeste">Oeste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Finalidad</Label>
                    <Select 
                      value={formData.finalidad}
                      onValueChange={(v) => setFormData({ ...formData, finalidad: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venta">Venta</SelectItem>
                        <SelectItem value="alquiler">Alquiler</SelectItem>
                        <SelectItem value="ambos">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Características adicionales */}
                <div className="space-y-2">
                  <Label>Características adicionales</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CARACTERISTICAS.map((car) => {
                      const Icon = car.icon;
                      const isSelected = formData.caracteristicas.includes(car.id);
                      return (
                        <Button
                          key={car.id}
                          type="button"
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className="justify-start gap-2"
                          onClick={() => toggleCaracteristica(car.id)}
                        >
                          <Icon className="h-4 w-4" />
                          {car.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Descripción adicional */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion">Información adicional (opcional)</Label>
                  <Textarea
                    id="descripcion"
                    placeholder="Describe características especiales, reformas recientes, vistas, etc."
                    value={formData.descripcionAdicional}
                    onChange={(e) => setFormData({ ...formData, descripcionAdicional: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Botón de valorar */}
                <Button 
                  className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                  size="lg"
                  onClick={handleValorar}
                  disabled={valorando}
                >
                  {valorando ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analizando con IA...
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 mr-2" />
                      Valorar con Inteligencia Artificial
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Panel de Resultados */}
          <div className="space-y-6">
            {!resultado && !valorando && (
              <Card className="h-full flex flex-col items-center justify-center min-h-[400px] border-dashed">
                <CardContent className="text-center py-12">
                  <div className="h-20 w-20 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-6">
                    <Brain className="h-10 w-10 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Valoración Inteligente</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    Completa los datos del inmueble y obtén una valoración profesional 
                    basada en análisis de mercado con inteligencia artificial.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary">
                      <Target className="h-3 w-3 mr-1" />
                      Análisis de comparables
                    </Badge>
                    <Badge variant="secondary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Tendencias de mercado
                    </Badge>
                    <Badge variant="secondary">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Recomendaciones
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {valorando && (
              <Card className="h-full flex flex-col items-center justify-center min-h-[400px]">
                <CardContent className="text-center py-12">
                  <div className="relative h-24 w-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-200" />
                    <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                    <Brain className="absolute inset-0 m-auto h-10 w-10 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Analizando con IA</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Claude está analizando el mercado, comparando propiedades similares 
                    y calculando el valor óptimo...
                  </p>
                  <div className="mt-6 space-y-2 text-sm text-left max-w-xs mx-auto">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Analizando características
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      Buscando comparables
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                      <Clock className="h-4 w-4" />
                      Calculando valoración
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {resultado && (
              <div className="space-y-4">
                {/* Valoración Principal */}
                <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-violet-600" />
                        Valoración Estimada
                      </span>
                      <Badge className={getTrendColor(resultado.tendenciaMercado)}>
                        {getTrendIcon(resultado.tendenciaMercado)}
                        <span className="ml-1">
                          {resultado.tendenciaMercado === 'alcista' ? '+' : 
                           resultado.tendenciaMercado === 'bajista' ? '-' : ''}
                          {resultado.porcentajeTendencia}%
                        </span>
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <p className="text-5xl font-bold text-violet-700">
                        {formatCurrency(resultado.valorEstimado)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Rango: {formatCurrency(resultado.valorMinimo)} - {formatCurrency(resultado.valorMaximo)}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{formatCurrency(resultado.precioM2)}</p>
                        <p className="text-xs text-muted-foreground">Precio/m²</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{resultado.confianza}%</p>
                        <p className="text-xs text-muted-foreground">Confianza</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{resultado.tiempoEstimadoVenta}</p>
                        <p className="text-xs text-muted-foreground">Tiempo venta</p>
                      </div>
                    </div>

                    {/* Nivel de confianza */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Nivel de confianza</span>
                        <span className="font-medium">{resultado.confianza}%</span>
                      </div>
                      <Progress value={resultado.confianza} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Rentabilidad Alquiler */}
                {(formData.finalidad === 'alquiler' || formData.finalidad === 'ambos') && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Euro className="h-4 w-4" />
                        Análisis de Rentabilidad
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-sm text-green-700">Alquiler mensual estimado</p>
                          <p className="text-2xl font-bold text-green-800">
                            {formatCurrency(resultado.alquilerEstimado)}/mes
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm text-blue-700">Rentabilidad bruta</p>
                          <p className="text-2xl font-bold text-blue-800">
                            {resultado.rentabilidadAlquiler.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Análisis Detallado */}
                <Accordion type="single" collapsible className="w-full">
                  {/* Comparables */}
                  {resultado.comparables && resultado.comparables.length > 0 && (
                    <AccordionItem value="comparables">
                      <AccordionTrigger>
                        <span className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Propiedades Comparables ({resultado.comparables.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {resultado.comparables.map((comp, idx) => (
                            <div key={idx} className="p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{comp.direccion}</p>
                                <p className="text-xs text-muted-foreground">
                                  {comp.superficie}m² • {formatCurrency(comp.precioM2)}/m²
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{formatCurrency(comp.precio)}</p>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(comp.similitud * 100)}% similar
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Factores */}
                  <AccordionItem value="factores">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        Factores de Valoración
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Factores Positivos
                          </p>
                          <ul className="space-y-1">
                            {resultado.factoresPositivos.map((f, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-green-500 mt-1">+</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                            <AlertTriangle className="h-4 w-4" />
                            Factores Negativos
                          </p>
                          <ul className="space-y-1">
                            {resultado.factoresNegativos.map((f, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-red-500 mt-1">-</span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Recomendaciones */}
                  <AccordionItem value="recomendaciones">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recomendaciones del Experto
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {resultado.recomendaciones.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="h-5 w-5 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Análisis de Mercado */}
                  <AccordionItem value="mercado">
                    <AccordionTrigger>
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Análisis de Mercado
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {resultado.analisisMercado}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setResultado(null)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Nueva Valoración
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleDescargarInforme}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Informe
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleGuardar}>
                    <FileText className="h-4 w-4 mr-2" />
                    Guardar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Asistente IA de Documentos - Para subir documentación de la propiedad */}
      <AIDocumentAssistant 
        context="propiedades"
        variant="floating"
        position="bottom-right"
        onAnalysisComplete={(analysis) => {
          // Si se detectan datos de superficie, habitaciones, etc., aplicarlos
          const fields = analysis.extractedFields;
          const superficie = fields.find(f => f.fieldName.toLowerCase().includes('superficie'));
          const habitaciones = fields.find(f => f.fieldName.toLowerCase().includes('habitacion'));
          
          if (superficie) {
            setFormData(prev => ({ ...prev, superficie: superficie.fieldValue }));
          }
          if (habitaciones) {
            setFormData(prev => ({ ...prev, habitaciones: habitaciones.fieldValue }));
          }
        }}
      />
    </AuthenticatedLayout>
  );
}
