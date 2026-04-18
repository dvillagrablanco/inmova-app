'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Store,
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

interface PlatformDetail {
  source: string;
  sourceLabel: string;
  sourceUrl?: string;
  reliability: number;
  dataType: string;
  pricePerM2Sale?: number;
  pricePerM2Rent?: number;
  sampleSize?: number;
  trend?: string;
}

interface PlatformSources {
  sourcesUsed: string[];
  sourcesFailed: string[];
  overallReliability: number;
  weightedSalePricePerM2: number | null;
  weightedRentPricePerM2: number | null;
  marketTrend: string;
  trendPercentage: number;
  demandLevel: string;
  avgDaysOnMarket: number | null;
  dataFreshness: string;
  platformDetails: PlatformDetail[];
  comparablesCount: number;
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
    fuente?: string;
  }>;
  factoresPositivos: string[];
  factoresNegativos: string[];
  recomendaciones: string[];
  analisisMercado: string;
  tiempoEstimadoVenta: string;
  rentabilidadAlquiler: number;
  alquilerEstimado: number;
  // Media estancia
  alquilerMediaEstancia?: number | null;
  alquilerMediaEstanciaMin?: number | null;
  alquilerMediaEstanciaMax?: number | null;
  rentabilidadMediaEstancia?: number | null;
  ocupacionEstimadaMediaEstancia?: number | null;
  perfilInquilinoMediaEstancia?: string | null;
  platformSources?: PlatformSources | null;
  reasoning?: string;
  metodologiaUsada?: string;
  phase1Summary?: string;
  aiSourcesUsed?: string[];
  // Desglose de ajustes RICS Red Book 2024
  ajustesPorFactores?: {
    esg?: { impactoTotal: string; ceeAplicado: string; detalle: string };
    ubicacion?: { impactoTotal: string; factoresAplicados: string[] };
    riesgos?: { impactoTotal: string; factoresAplicados: string[] };
  };
}

// Características por tipo de activo
const CARACTERISTICAS_POR_TIPO: Record<string, Array<{ id: string; label: string; icon: any }>> = {
  vivienda: [
    { id: 'ascensor', label: 'Ascensor', icon: ArrowUpRight },
    { id: 'terraza', label: 'Terraza', icon: Trees },
    { id: 'piscina', label: 'Piscina', icon: Waves },
    { id: 'garaje', label: 'Garaje', icon: Car },
    { id: 'trastero', label: 'Trastero', icon: Building2 },
    { id: 'aire_acondicionado', label: 'Aire acondicionado', icon: Zap },
    { id: 'calefaccion', label: 'Calefacción', icon: Zap },
    { id: 'jardin', label: 'Jardín', icon: Trees },
    { id: 'portero', label: 'Portero/Conserje', icon: Users },
    { id: 'armarios_empotrados', label: 'Armarios empotrados', icon: Building2 },
    { id: 'lavadero', label: 'Lavadero', icon: Waves },
    { id: 'videoportero', label: 'Videoportero', icon: Zap },
  ],
  local_comercial: [
    { id: 'fachada', label: 'Fachada a calle', icon: Building2 },
    { id: 'escaparate', label: 'Escaparate', icon: Store },
    { id: 'esquina', label: 'Esquina', icon: MapPin },
    { id: 'aire_acondicionado', label: 'Climatización', icon: Zap },
    { id: 'salida_humos', label: 'Salida de humos', icon: Zap },
    { id: 'licencia_actividad', label: 'Licencia actividad', icon: FileText },
    { id: 'aseo', label: 'Aseo propio', icon: Building2 },
    { id: 'almacen', label: 'Almacén/Trastienda', icon: Building2 },
    { id: 'carga_descarga', label: 'Zona carga/descarga', icon: Car },
    { id: 'persiana_seguridad', label: 'Persiana seguridad', icon: Zap },
  ],
  oficina: [
    { id: 'ascensor', label: 'Ascensor', icon: ArrowUpRight },
    { id: 'aire_acondicionado', label: 'Climatización central', icon: Zap },
    { id: 'calefaccion', label: 'Calefacción', icon: Zap },
    { id: 'fibra_optica', label: 'Fibra óptica', icon: Zap },
    { id: 'planta_diafana', label: 'Planta diáfana', icon: Building2 },
    { id: 'suelo_tecnico', label: 'Suelo técnico', icon: Building2 },
    { id: 'falso_techo', label: 'Falso techo', icon: Building2 },
    { id: 'garaje', label: 'Parking propio', icon: Car },
    { id: 'recepcion', label: 'Recepción/Lobby', icon: Users },
    { id: 'sala_reuniones', label: 'Sala reuniones', icon: Users },
    { id: 'terraza', label: 'Terraza', icon: Trees },
    { id: 'portero', label: 'Seguridad/Conserje', icon: Users },
  ],
  nave_industrial: [
    { id: 'muelle_carga', label: 'Muelle de carga', icon: Car },
    { id: 'puente_grua', label: 'Puente grúa', icon: Building2 },
    { id: 'oficinas_anexas', label: 'Oficinas anexas', icon: Building2 },
    { id: 'patio_maniobras', label: 'Patio de maniobras', icon: Car },
    { id: 'acceso_trailer', label: 'Acceso tráiler', icon: Car },
    { id: 'instalacion_electrica', label: 'Inst. eléctrica industrial', icon: Zap },
    { id: 'agua_industrial', label: 'Agua industrial', icon: Waves },
    { id: 'sprinklers', label: 'Sistema anti-incendios', icon: Zap },
    { id: 'acceso_autopista', label: 'Acceso autopista', icon: Car },
    { id: 'vigilancia', label: 'Vigilancia 24h', icon: Users },
  ],
  garaje: [
    { id: 'plaza_doble', label: 'Plaza doble', icon: Car },
    { id: 'acceso_facil', label: 'Acceso fácil', icon: ArrowUpRight },
    { id: 'punto_carga', label: 'Punto carga eléctrica', icon: Zap },
    { id: 'vigilancia', label: 'Vigilancia/Cámaras', icon: Users },
    { id: 'trastero_anejo', label: 'Trastero anejo', icon: Building2 },
    { id: 'preinstalacion_carga', label: 'Pre-inst. carga VE', icon: Zap },
  ],
  trastero: [
    { id: 'acceso_directo', label: 'Acceso directo', icon: ArrowUpRight },
    { id: 'ventilacion', label: 'Ventilación', icon: Zap },
    { id: 'luz_propia', label: 'Luz propia', icon: Zap },
    { id: 'puerta_seguridad', label: 'Puerta seguridad', icon: Users },
    { id: 'antihumedad', label: 'Anti-humedad', icon: Building2 },
    { id: 'vigilancia', label: 'Vigilancia/Cámaras', icon: Users },
  ],
  edificio_completo: [
    { id: 'ascensor', label: 'Ascensor', icon: ArrowUpRight },
    { id: 'portero', label: 'Portero/Conserje', icon: Users },
    { id: 'garaje', label: 'Garaje comunitario', icon: Car },
    { id: 'piscina', label: 'Piscina', icon: Waves },
    { id: 'jardin', label: 'Jardín/Patio', icon: Trees },
    { id: 'locales', label: 'Locales en planta baja', icon: Store },
    { id: 'aire_acondicionado', label: 'Climatización central', icon: Zap },
    { id: 'fachada_reformada', label: 'Fachada reformada', icon: Building2 },
    { id: 'cubierta_reformada', label: 'Cubierta reformada', icon: Building2 },
    { id: 'ite_favorable', label: 'ITE favorable', icon: FileText },
  ],
  solar: [
    { id: 'uso_residencial', label: 'Uso residencial', icon: Home },
    { id: 'uso_comercial', label: 'Uso comercial', icon: Store },
    { id: 'uso_industrial', label: 'Uso industrial', icon: Building2 },
    { id: 'urbanizado', label: 'Urbanizado', icon: Building2 },
    { id: 'acceso_rodado', label: 'Acceso rodado', icon: Car },
    { id: 'servicios_basicos', label: 'Servicios (agua, luz)', icon: Zap },
    { id: 'licencia_tramite', label: 'Licencia en trámite', icon: FileText },
  ],
};

// Campos del formulario que aplican según tipo
const CAMPOS_POR_TIPO: Record<
  string,
  { habitaciones: boolean; banos: boolean; planta: boolean; orientacion: boolean }
> = {
  vivienda: { habitaciones: true, banos: true, planta: true, orientacion: true },
  local_comercial: { habitaciones: false, banos: false, planta: true, orientacion: false },
  oficina: { habitaciones: false, banos: true, planta: true, orientacion: true },
  nave_industrial: { habitaciones: false, banos: false, planta: false, orientacion: false },
  garaje: { habitaciones: false, banos: false, planta: true, orientacion: false },
  trastero: { habitaciones: false, banos: false, planta: true, orientacion: false },
  edificio_completo: { habitaciones: true, banos: true, planta: false, orientacion: false },
  solar: { habitaciones: false, banos: false, planta: false, orientacion: false },
};

const LABELS_POR_TIPO: Record<string, Record<string, string>> = {
  vivienda: {
    superficie: 'Superficie (m²)',
    habitaciones: 'Habitaciones',
    banos: 'Baños',
    planta: 'Planta',
  },
  local_comercial: { superficie: 'Superficie (m²)', planta: 'Planta (0=calle)' },
  oficina: { superficie: 'Superficie (m²)', banos: 'Aseos', planta: 'Planta' },
  nave_industrial: { superficie: 'Superficie (m²)' },
  garaje: { superficie: 'Superficie plaza (m²)', planta: 'Sótano (-1, -2...)' },
  trastero: { superficie: 'Superficie (m²)', planta: 'Planta / Sótano' },
  edificio_completo: {
    superficie: 'Superficie total (m²)',
    habitaciones: 'Nº unidades',
    banos: 'Nº plantas',
  },
  solar: { superficie: 'Superficie parcela (m²)' },
};

// Pasos del proceso de valoración
const VALUATION_STEPS = [
  { label: 'Recopilando datos del inmueble', duration: 1000 },
  { label: 'Scraping de portales inmobiliarios', duration: 4000 },
  { label: 'Consultando Notariado e INE', duration: 2000 },
  { label: 'Fase 1 IA: Analizando comparables', duration: 3000 },
  { label: 'Fase 2 IA: Valoración experta', duration: 5000 },
  { label: 'Generando informe', duration: 1000 },
];

export default function ValoracionIAPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados
  const [loading, setLoading] = useState(true);
  const [valorando, setValorando] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<string>('manual');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('');
  const [assetType, setAssetType] = useState<'unit' | 'building'>('unit');
  const [resultado, setResultado] = useState<ValoracionResult | null>(null);

  // Feedback para refinar valoración
  const [feedbackText, setFeedbackText] = useState('');
  const [refinando, setRefinando] = useState(false);
  const [refinamientosCount, setRefinamientosCount] = useState(0);

  // Valoración de Mercado
  const [activeTab, setActiveTab] = useState<'mis-activos' | 'mercado'>('mis-activos');
  const [refCatastral, setRefCatastral] = useState('');
  const [catastroData, setCatastroData] = useState<any>(null);
  const [buscandoCatastro, setBuscandoCatastro] = useState(false);
  const [searchDireccionLibre, setSearchDireccionLibre] = useState('');
  const [searchProvincia, setSearchProvincia] = useState('');
  const [searchMunicipio, setSearchMunicipio] = useState('');
  const [searchTipoVia, setSearchTipoVia] = useState('CL');
  const [searchVia, setSearchVia] = useState('');
  const [searchNumero, setSearchNumero] = useState('');

  // Pasos de valoración progresivos
  const [currentStep, setCurrentStep] = useState(0);
  // Historial
  const [historial, setHistorial] = useState<any[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

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
    tipoActivo: 'vivienda' as string,
    direccionManual: '',
    ciudadManual: '',
    codigoPostalManual: '',
    eficienciaEnergetica: 'none',
    // === Criterios avanzados RICS Red Book 2024 / IVS / ECO 805/2003 ===
    // ESG / energía
    certificadoEnergetico: '' as '' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G',
    consumoEnergeticoKwhM2: '',
    // Calidad de ubicación
    proximidadTransportePublico: '' as '' | 'excelente' | 'buena' | 'regular' | 'mala',
    distanciaMetroMin: '',
    zonaRuido: '' as '' | 'tranquila' | 'media' | 'ruidosa',
    proximidadServicios: '' as '' | 'excelente' | 'buena' | 'regular' | 'mala',
    calidadColegios: '' as '' | 'alta' | 'media' | 'baja',
    zonaVerdeProxima: false,
    vistas: '' as '' | 'panoramicas' | 'despejadas' | 'normales' | 'limitadas',
    zonaTensionada: false,
    zbe: false,
    // Riesgos
    riesgoInundacion: '' as '' | 'alto' | 'medio' | 'bajo',
    ite: '' as '' | 'favorable' | 'desfavorable' | 'pendiente',
    cedulaHabitabilidad: undefined as boolean | undefined,
    derramasPendientes: '',
    inquilinosRentaAntigua: '',
    // Económicos
    ibiAnual: '',
    comunidadMensual: '',
    rentaActualMensual: '',
    superficieUtil: '',
    yearLastRenovation: '',
  });

  // Cargar datos al iniciar
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAssets();
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (units.length === 0 && buildings.length === 0) return;

    const unitId = searchParams.get('unitId');
    const city = searchParams.get('ciudad');
    const surface = searchParams.get('superficie');

    if (unitId && units.some((unit) => unit.id === unitId)) {
      const unit = units.find((item) => item.id === unitId);
      if (assetType !== 'unit') {
        setAssetType('unit');
      }

      if (unit?.building?.id) {
        setSelectedBuildingFilter(unit.building.id);
      }

      setSelectedAsset(unitId);
      setFormData((prev) => ({
        ...prev,
        superficie: unit?.superficie?.toString() || prev.superficie,
        habitaciones: unit?.habitaciones?.toString() || prev.habitaciones,
        banos: unit?.banos?.toString() || prev.banos,
        direccionManual: unit?.building?.direccion || prev.direccionManual,
      }));
      return;
    }

    if (city || surface) {
      setActiveTab('mercado');
      setFormData((prev) => ({
        ...prev,
        ciudadManual: city || prev.ciudadManual,
        superficie: surface || prev.superficie,
      }));
    }
  }, [status, units, buildings, searchParams, assetType]);

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
      console.error('Error fetching assets:', error);
      toast.error('Error al cargar los activos');
    } finally {
      setLoading(false);
    }
  };

  // Cuando se selecciona un activo, rellenar datos automáticamente
  const handleAssetSelect = async (assetId: string) => {
    setSelectedAsset(assetId);

    if (assetId === 'manual') {
      return;
    }

    if (assetType === 'unit') {
      const unit = units.find((u) => u.id === assetId);
      if (unit) {
        setFormData((prev) => ({
          ...prev,
          superficie: unit.superficie?.toString() || prev.superficie,
          habitaciones: unit.habitaciones?.toString() || prev.habitaciones,
          banos: unit.banos?.toString() || prev.banos,
        }));
        if ((unit as any).referenciaCatastral) {
          setRefCatastral((unit as any).referenciaCatastral);
        }

        // Fetch unit details for characteristics pre-fill
        try {
          const res = await fetch(`/api/units/${assetId}`);
          if (res.ok) {
            const detail = await res.json();
            const unitData = detail.data || detail;
            const chars: string[] = [];

            // Unit-level characteristics
            if (unitData.aireAcondicionado) chars.push('aire_acondicionado');
            if (unitData.calefaccion) chars.push('calefaccion');
            if (unitData.terraza) chars.push('terraza');
            if (unitData.armarioEmpotrado) chars.push('armarios_empotrados');

            // Building-level characteristics
            const bld = unitData.building || buildings.find((b) => b.id === selectedBuildingFilter);
            if (bld) {
              if ((bld as any).ascensor) chars.push('ascensor');
              if ((bld as any).garaje) chars.push('garaje');
              if ((bld as any).trastero) chars.push('trastero');
              if ((bld as any).piscina) chars.push('piscina');
              if ((bld as any).jardin) chars.push('jardin');
            }

            // Pre-fill form fields
            setFormData((prev) => ({
              ...prev,
              superficie: unitData.superficie?.toString() || prev.superficie,
              habitaciones: unitData.habitaciones?.toString() || prev.habitaciones,
              banos: unitData.banos?.toString() || prev.banos,
              planta: unitData.planta?.toString() || prev.planta,
              caracteristicas: chars.length > 0 ? chars : prev.caracteristicas,
              direccionManual: (bld as any)?.direccion || prev.direccionManual,
              ciudadManual: (bld as any)?.ciudad || prev.ciudadManual,
              codigoPostalManual: (bld as any)?.codigoPostal || prev.codigoPostalManual,
            }));

            if (chars.length > 0) {
              toast.success(`${chars.length} características precargadas del inmueble`);
            }
          }
        } catch {
          // Silent — form already has basic data from units list
        }
      }
    } else if (assetType === 'building') {
      const building = buildings.find((b: any) => b.id === assetId);
      if (building) {
        if ((building as any).referenciaCatastral) {
          setRefCatastral((building as any).referenciaCatastral);
        }
        // Pre-fill building characteristics
        const chars: string[] = [];
        if ((building as any).ascensor) chars.push('ascensor');
        if ((building as any).garaje) chars.push('garaje');
        if ((building as any).trastero) chars.push('trastero');
        if ((building as any).piscina) chars.push('piscina');
        if ((building as any).jardin) chars.push('jardin');

        setFormData((prev) => ({
          ...prev,
          caracteristicas: chars.length > 0 ? chars : prev.caracteristicas,
          direccionManual: (building as any).direccion || prev.direccionManual,
          ciudadManual: (building as any).ciudad || prev.ciudadManual,
          codigoPostalManual: (building as any).codigoPostal || prev.codigoPostalManual,
        }));
      }
    }
  };

  // Búsqueda Catastro (Valoración de Mercado)
  const handleBuscarCatastro = async () => {
    const hasRC = refCatastral.trim().length >= 14 && refCatastral.trim().length <= 20;
    const hasFreeAddress = searchDireccionLibre.trim().length >= 5;
    const hasAddress =
      searchProvincia.trim() && searchMunicipio.trim() && searchVia.trim() && searchNumero.trim();

    if (!hasRC && !hasFreeAddress && !hasAddress) {
      toast.error(
        'Introduce una dirección (ej: "Calle Alcalá 1, Madrid") o una referencia catastral'
      );
      return;
    }

    setBuscandoCatastro(true);
    setCatastroData(null);

    try {
      let url = '/api/catastro/consulta?';
      if (hasRC) {
        url += `rc=${encodeURIComponent(refCatastral.trim())}`;
      } else if (hasFreeAddress) {
        url += `q=${encodeURIComponent(searchDireccionLibre.trim())}`;
      } else {
        url += `provincia=${encodeURIComponent(searchProvincia)}&municipio=${encodeURIComponent(searchMunicipio)}&tipoVia=${encodeURIComponent(searchTipoVia)}&via=${encodeURIComponent(searchVia)}&numero=${encodeURIComponent(searchNumero)}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Error consultando catastro');
      }

      const data = await res.json();
      setCatastroData(data);

      // Auto-fill form fields
      const anoActual = new Date().getFullYear();
      const antiguedad = data.anoConstruccion ? String(anoActual - data.anoConstruccion) : '';
      setFormData((prev) => ({
        ...prev,
        superficie: String(data.superficieTotal || data.superficie || prev.superficie),
        antiguedad: antiguedad || prev.antiguedad,
      }));

      toast.success('Datos del Catastro cargados correctamente');
    } catch (error: any) {
      console.error('Error consultando catastro:', error);
      toast.error(error.message || 'No se encontraron datos catastrales');
    } finally {
      setBuscandoCatastro(false);
    }
  };

  // Toggle característica
  const toggleCaracteristica = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      caracteristicas: prev.caracteristicas.includes(id)
        ? prev.caracteristicas.filter((c) => c !== id)
        : [...prev.caracteristicas, id],
    }));
  };

  // Cargar historial de valoraciones
  const fetchHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const res = await fetch('/api/valuations?limit=10');
      if (res.ok) {
        const data = await res.json();
        setHistorial(Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } catch {
      // Silencioso
    } finally {
      setLoadingHistorial(false);
    }
  };

  // Simular pasos progresivos durante la valoración
  useEffect(() => {
    if (!valorando) {
      setCurrentStep(0);
      return;
    }
    let step = 0;
    const timers: NodeJS.Timeout[] = [];
    let accumulated = 0;
    for (const s of VALUATION_STEPS) {
      const localStep = step;
      accumulated += s.duration;
      timers.push(setTimeout(() => setCurrentStep(localStep), accumulated));
      step++;
    }
    return () => timers.forEach(clearTimeout);
  }, [valorando]);

  // Realizar valoración con IA
  const handleValorar = async () => {
    if (!formData.superficie || parseFloat(formData.superficie) <= 0) {
      toast.error('Indica la superficie del inmueble');
      return;
    }

    setValorando(true);
    setResultado(null);

    try {
      let direccion = formData.direccionManual || '';
      let ciudad = formData.ciudadManual || '';
      let codigoPostal = formData.codigoPostalManual || '';
      let unitId: string | undefined;
      let buildingId: string | undefined;

      if (activeTab === 'mercado' && catastroData) {
        direccion = direccion || catastroData.direccion || '';
        ciudad = ciudad || catastroData.municipio || '';
        codigoPostal = codigoPostal || catastroData.codigoPostal || '';
      } else if (selectedAsset && selectedAsset !== 'manual' && assetType === 'unit') {
        const unit = units.find((u) => u.id === selectedAsset);
        direccion = direccion || unit?.building?.direccion || '';
        ciudad = ciudad || unit?.building?.ciudad || '';
        unitId = selectedAsset;
      } else if (selectedAsset && selectedAsset !== 'manual' && assetType === 'building') {
        const building = buildings.find((b) => b.id === selectedAsset);
        direccion = direccion || building?.direccion || '';
        ciudad = ciudad || building?.ciudad || '';
        buildingId = selectedAsset;
      }

      // Intentar extraer ciudad de la dirección si no se proporcionó
      if (!ciudad && direccion) {
        const parts = direccion
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);
        if (parts.length >= 2) {
          ciudad = parts[parts.length - 1]; // Última parte suele ser la ciudad
        }
      }

      if (!ciudad) {
        toast.error('Indica la ciudad del inmueble para una valoración precisa');
        setValorando(false);
        return;
      }

      // Map page values to API-compatible property types
      const tipoActivoMap: Record<string, string> = {
        edificio_completo: 'edificio',
        solar: 'terreno',
      };
      const tipoActivoApi = tipoActivoMap[formData.tipoActivo] || formData.tipoActivo;

      const response = await fetch('/api/ai/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tipoActivo: tipoActivoApi,
          superficie: parseFloat(formData.superficie),
          habitaciones: parseInt(formData.habitaciones) || 0,
          banos: parseInt(formData.banos) || 0,
          antiguedad: parseInt(formData.antiguedad) || 0,
          planta: parseInt(formData.planta) || 0,
          direccion,
          ciudad,
          codigoPostal,
          unitId: activeTab === 'mis-activos' ? unitId : undefined,
          buildingId: activeTab === 'mis-activos' ? buildingId : undefined,
          // === Avanzados RICS Red Book 2024 — solo enviar si tienen valor ===
          certificadoEnergetico: formData.certificadoEnergetico || undefined,
          consumoEnergeticoKwhM2: formData.consumoEnergeticoKwhM2
            ? parseFloat(formData.consumoEnergeticoKwhM2)
            : undefined,
          proximidadTransportePublico: formData.proximidadTransportePublico || undefined,
          distanciaMetroMin: formData.distanciaMetroMin
            ? parseFloat(formData.distanciaMetroMin)
            : undefined,
          zonaRuido: formData.zonaRuido || undefined,
          proximidadServicios: formData.proximidadServicios || undefined,
          calidadColegios: formData.calidadColegios || undefined,
          zonaVerdeProxima: formData.zonaVerdeProxima || undefined,
          vistas: formData.vistas || undefined,
          zonaTensionada: formData.zonaTensionada || undefined,
          zbe: formData.zbe || undefined,
          riesgoInundacion: formData.riesgoInundacion || undefined,
          ite: formData.ite || undefined,
          cedulaHabitabilidad:
            formData.cedulaHabitabilidad !== undefined ? formData.cedulaHabitabilidad : undefined,
          derramasPendientes: formData.derramasPendientes
            ? parseFloat(formData.derramasPendientes)
            : undefined,
          inquilinosRentaAntigua: formData.inquilinosRentaAntigua
            ? parseInt(formData.inquilinosRentaAntigua)
            : undefined,
          ibiAnual: formData.ibiAnual ? parseFloat(formData.ibiAnual) : undefined,
          comunidadMensual: formData.comunidadMensual
            ? parseFloat(formData.comunidadMensual)
            : undefined,
          rentaActualMensual: formData.rentaActualMensual
            ? parseFloat(formData.rentaActualMensual)
            : undefined,
          squareMetersUtil: formData.superficieUtil
            ? parseFloat(formData.superficieUtil)
            : undefined,
          yearLastRenovation: formData.yearLastRenovation
            ? parseInt(formData.yearLastRenovation)
            : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al realizar la valoración');
      }

      const data = await response.json();
      setResultado(data);
      toast.success('Valoración completada');
    } catch (error: any) {
      console.error('Error en valoración:', error);
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

  // Refinar valoración con feedback del usuario
  const handleRefinar = async () => {
    if (!resultado || !feedbackText.trim()) return;

    setRefinando(true);
    try {
      const response = await fetch('/api/ai/valuate/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousValuation: resultado,
          propertyData: formData,
          userFeedback: feedbackText.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al refinar la valoración');
      }

      const data = await response.json();
      setResultado(data);
      setFeedbackText('');
      setRefinamientosCount((prev) => prev + 1);
      toast.success('Valoración ajustada según tus comentarios');
    } catch (error: any) {
      console.error('Error refinando valoración:', error);
      toast.error(error.message || 'Error al refinar la valoración con IA');
    } finally {
      setRefinando(false);
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

      if (activeTab === 'mercado' && catastroData) {
        direccion = catastroData.direccion || '';
        ciudad = catastroData.municipio || '';
      } else if (selectedAsset && selectedAsset !== 'manual' && assetType === 'unit') {
        const unit = units.find((u) => u.id === selectedAsset);
        direccion = unit?.building?.direccion || '';
        ciudad = unit?.building?.ciudad || '';
        unitId = selectedAsset;
      } else if (selectedAsset && selectedAsset !== 'manual' && assetType === 'building') {
        const building = buildings.find((b) => b.id === selectedAsset);
        direccion = building?.direccion || '';
        ciudad = building?.ciudad || '';
        buildingId = selectedAsset;
      }

      const response = await fetch('/api/valuations', {
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
      console.error('Error guardando valoración:', error);
      toast.error('Error al guardar la valoración');
    }
  };

  // Descargar informe profesional
  const handleDescargarInforme = () => {
    if (!resultado) return;

    const fecha = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const lines = [
      '════════════════════════════════════════════════════════════════',
      '       INFORME DE VALORACIÓN DE ACTIVO INMOBILIARIO',
      '          Generado por Inmova IA — Análisis Multi-Plataforma',
      '════════════════════════════════════════════════════════════════',
      '',
      `Fecha: ${fecha} a las ${hora}`,
      `Referencia: VAL-${Date.now().toString(36).toUpperCase()}`,
      '',
      '── DATOS DEL INMUEBLE ─────────────────────────────────────────',
      `Dirección: ${formData.direccionManual || '(auto-rellenada)'}`,
      `Ciudad: ${formData.ciudadManual || '(auto-rellenada)'}`,
      `Código Postal: ${formData.codigoPostalManual || '(auto-rellenada)'}`,
      `Superficie: ${formData.superficie} m²`,
      `Habitaciones: ${formData.habitaciones || 'N/A'}`,
      `Baños: ${formData.banos || 'N/A'}`,
      `Planta: ${formData.planta || 'N/A'}`,
      `Antigüedad: ${formData.antiguedad ? formData.antiguedad + ' años' : 'N/A'}`,
      `Estado: ${formData.estadoConservacion}`,
      `Orientación: ${formData.orientacion}`,
      `Eficiencia energética: ${formData.eficienciaEnergetica || 'Sin certificar'}`,
      `Tipo de activo: ${formData.tipoActivo}`,
      `Finalidad: ${formData.finalidad}`,
      formData.caracteristicas.length > 0
        ? `Equipamiento: ${formData.caracteristicas.join(', ')}`
        : '',
      formData.descripcionAdicional ? `Info adicional: ${formData.descripcionAdicional}` : '',
      '',
      '── VALORACIÓN ESTIMADA ────────────────────────────────────────',
      `Valor estimado:        ${formatCurrency(resultado.valorEstimado)}`,
      `Rango:                 ${formatCurrency(resultado.valorMinimo)} - ${formatCurrency(resultado.valorMaximo)}`,
      `Precio por m²:         ${formatCurrency(resultado.precioM2)}`,
      `Nivel de confianza:    ${resultado.confianza}%`,
      `Tendencia del mercado: ${resultado.tendenciaMercado} (${resultado.porcentajeTendencia}%)`,
      `Tiempo estimado venta: ${resultado.tiempoEstimadoVenta}`,
      '',
      '── ANÁLISIS DE INVERSIÓN — LARGA ESTANCIA (12+ meses) ────────',
      `Alquiler mensual estimado:  ${resultado.alquilerEstimado ? formatCurrency(resultado.alquilerEstimado) + '/mes' : 'N/A'}`,
      `Renta anual estimada:       ${resultado.alquilerEstimado ? formatCurrency(resultado.alquilerEstimado * 12) + '/año' : 'N/A'}`,
      `Rentabilidad bruta anual:   ${resultado.rentabilidadAlquiler ? resultado.rentabilidadAlquiler.toFixed(2) + '%' : 'N/A'}`,
      `Cap Rate:                   ${(resultado as any).capRate ? (resultado as any).capRate.toFixed(2) + '%' : 'N/A'}`,
      '',
    ];

    if (resultado.alquilerMediaEstancia) {
      lines.push(
        '── ANÁLISIS DE INVERSIÓN — MEDIA ESTANCIA (1-11 meses) ──────',
        `Alquiler mensual estimado:  ${formatCurrency(resultado.alquilerMediaEstancia)}/mes`,
        resultado.alquilerMediaEstanciaMin && resultado.alquilerMediaEstanciaMax
          ? `Rango estacional:           ${formatCurrency(resultado.alquilerMediaEstanciaMin)} (baja) — ${formatCurrency(resultado.alquilerMediaEstanciaMax)} (alta)`
          : '',
        `Rentabilidad bruta anual:   ${resultado.rentabilidadMediaEstancia ? resultado.rentabilidadMediaEstancia.toFixed(2) + '%' : 'N/A'}`,
        `Ocupación estimada anual:   ${resultado.ocupacionEstimadaMediaEstancia ? resultado.ocupacionEstimadaMediaEstancia + '%' : 'N/A'}`,
        resultado.ocupacionEstimadaMediaEstancia
          ? `Renta anual neta (con ocupación): ${formatCurrency(Math.round(resultado.alquilerMediaEstancia * 12 * (resultado.ocupacionEstimadaMediaEstancia / 100)))}/año`
          : '',
        `Premium vs larga estancia:  ${resultado.alquilerEstimado ? '+' + Math.round(((resultado.alquilerMediaEstancia - resultado.alquilerEstimado) / resultado.alquilerEstimado) * 100) + '%' : 'N/A'}`,
        `Perfil inquilino:           ${resultado.perfilInquilinoMediaEstancia || 'N/A'}`,
        ''
      );
    }

    if (resultado.metodologiaUsada) {
      lines.push(
        '── METODOLOGÍA ────────────────────────────────────────────',
        resultado.metodologiaUsada,
        ''
      );
    }

    if (resultado.reasoning) {
      lines.push(
        '── RAZONAMIENTO DEL TASADOR IA ────────────────────────────',
        resultado.reasoning,
        ''
      );
    }

    if (resultado.factoresPositivos?.length > 0) {
      lines.push('── FACTORES POSITIVOS ─────────────────────────────────────');
      resultado.factoresPositivos.forEach((f) => lines.push(`  + ${f}`));
      lines.push('');
    }

    if (resultado.factoresNegativos?.length > 0) {
      lines.push('── FACTORES NEGATIVOS ─────────────────────────────────────');
      resultado.factoresNegativos.forEach((f) => lines.push(`  - ${f}`));
      lines.push('');
    }

    if (resultado.recomendaciones?.length > 0) {
      lines.push('── RECOMENDACIONES ────────────────────────────────────────');
      resultado.recomendaciones.forEach((r, i) => lines.push(`  ${i + 1}. ${r}`));
      lines.push('');
    }

    if (resultado.comparables?.length > 0) {
      lines.push('── PROPIEDADES COMPARABLES (analizadas por IA) ───────────');
      resultado.comparables.forEach((c, i) => {
        lines.push(`  ${i + 1}. ${c.direccion}${c.fuente ? ` [${c.fuente}]` : ''}`);
        lines.push(
          `     ${formatCurrency(c.precio)} | ${c.superficie}m² | ${formatCurrency(c.precioM2)}/m² | Similitud: ${Math.round(c.similitud * 100)}%`
        );
      });
      lines.push('');
    }

    if (resultado.analisisMercado) {
      lines.push(
        '── ANÁLISIS DE MERCADO ────────────────────────────────────',
        resultado.analisisMercado,
        ''
      );
    }

    if (resultado.phase1Summary) {
      lines.push(
        '── PRE-ANÁLISIS DE COMPARABLES (Fase 1 IA) ───────────────',
        resultado.phase1Summary,
        ''
      );
    }

    if (resultado.platformSources?.sourcesUsed?.length) {
      lines.push('── FUENTES DE DATOS CONSULTADAS ───────────────────────────');
      lines.push(`  Plataformas: ${resultado.platformSources.sourcesUsed.join(', ')}`);
      lines.push(`  Fiabilidad global: ${resultado.platformSources.overallReliability}%`);
      if (resultado.platformSources.weightedSalePricePerM2) {
        lines.push(
          `  Precio ponderado: ${formatCurrency(resultado.platformSources.weightedSalePricePerM2)}/m²`
        );
      }
      lines.push('');
    }

    if (resultado.aiSourcesUsed?.length) {
      lines.push(`  Fuentes IA: ${resultado.aiSourcesUsed.join(', ')}`, '');
    }

    lines.push('════════════════════════════════════════════════════════════════');
    lines.push('AVISO LEGAL: Esta valoración es una estimación basada en datos');
    lines.push('de mercado y análisis de IA. No sustituye a una tasación oficial');
    lines.push('realizada por un perito acreditado.');
    lines.push('');
    lines.push('Generado por Inmova App — https://inmovaapp.com');

    // Generate professional PDF via HTML print
    const content = lines.filter((l) => l !== undefined).join('\n');
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe de Valoración - INMOVA</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: 40px; font-size: 13px; line-height: 1.6; }
  .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #4F46E5; }
  .header h1 { font-size: 22px; font-weight: 700; color: #4F46E5; }
  .header .subtitle { color: #666; margin-top: 4px; font-size: 12px; }
  .header .logo { font-size: 28px; font-weight: 800; color: #4F46E5; letter-spacing: -1px; margin-bottom: 8px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 20px 0; }
  .kpi { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; text-align: center; }
  .kpi .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
  .kpi .value { font-size: 20px; font-weight: 700; margin-top: 4px; color: #1a1a1a; }
  .kpi .value.green { color: #16a34a; }
  .kpi .value.blue { color: #4F46E5; }
  .section { margin: 20px 0; }
  .section h2 { font-size: 14px; font-weight: 700; color: #4F46E5; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .section p, .section li { font-size: 12px; color: #333; }
  .section ul { padding-left: 16px; }
  .section li { margin-bottom: 4px; }
  .data-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
  .data-row .label { color: #666; }
  .data-row .value { font-weight: 600; }
  .comparables { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
  .comparables th { background: #f9fafb; padding: 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb; }
  .comparables td { padding: 6px 8px; border-bottom: 1px solid #f3f4f6; }
  .factors { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .factor-list { font-size: 11px; }
  .factor-list .positive { color: #16a34a; }
  .factor-list .negative { color: #dc2626; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #4F46E5; text-align: center; font-size: 10px; color: #999; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
  .badge-green { background: #dcfce7; color: #16a34a; }
  .badge-blue { background: #dbeafe; color: #2563eb; }
  .badge-amber { background: #fef3c7; color: #d97706; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">INMOVA</div>
  <h1>Informe de Valoración de Activo Inmobiliario</h1>
  <p class="subtitle">${fecha} · Análisis Multi-Plataforma con IA · Ref: VAL-${Date.now().toString(36).toUpperCase()}</p>
</div>

<div class="kpi-grid">
  <div class="kpi"><div class="label">Valor Estimado</div><div class="value green">${formatCurrency(resultado.valorEstimado)}</div></div>
  <div class="kpi"><div class="label">Rango</div><div class="value">${formatCurrency(resultado.valorMinimo)} — ${formatCurrency(resultado.valorMaximo)}</div></div>
  <div class="kpi"><div class="label">Precio/m²</div><div class="value blue">${formatCurrency(resultado.precioM2)}</div></div>
</div>

<div class="section">
  <h2>Datos del Inmueble</h2>
  <div class="data-row"><span class="label">Dirección</span><span class="value">${formData.direccionManual || '—'}</span></div>
  <div class="data-row"><span class="label">Ciudad</span><span class="value">${formData.ciudadManual || '—'}</span></div>
  <div class="data-row"><span class="label">Superficie</span><span class="value">${formData.superficie} m²</span></div>
  <div class="data-row"><span class="label">Habitaciones / Baños</span><span class="value">${formData.habitaciones || '—'} / ${formData.banos || '—'}</span></div>
  <div class="data-row"><span class="label">Estado</span><span class="value">${formData.estadoConservacion}</span></div>
  <div class="data-row"><span class="label">Confianza</span><span class="value">${resultado.confianza}%</span></div>
  <div class="data-row"><span class="label">Tendencia</span><span class="value">${resultado.tendenciaMercado} (${resultado.porcentajeTendencia}%)</span></div>
</div>

${
  resultado.alquilerEstimado
    ? `<div class="section">
  <h2>Análisis de Inversión</h2>
  <div class="data-row"><span class="label">Alquiler mensual estimado</span><span class="value">${formatCurrency(resultado.alquilerEstimado)}/mes</span></div>
  <div class="data-row"><span class="label">Renta anual</span><span class="value">${formatCurrency(resultado.alquilerEstimado * 12)}/año</span></div>
  <div class="data-row"><span class="label">Rentabilidad bruta</span><span class="value">${resultado.rentabilidadAlquiler?.toFixed(2) || '—'}%</span></div>
  <div class="data-row"><span class="label">Tiempo estimado venta</span><span class="value">${resultado.tiempoEstimadoVenta || '—'}</span></div>
</div>`
    : ''
}

${
  resultado.reasoning
    ? `<div class="section">
  <h2>Razonamiento del Tasador IA</h2>
  <p>${resultado.reasoning}</p>
</div>`
    : ''
}

${
  resultado.factoresPositivos?.length || resultado.factoresNegativos?.length
    ? `<div class="section">
  <h2>Factores Clave</h2>
  <div class="factors">
    <div class="factor-list">${resultado.factoresPositivos?.map((f: string) => `<p class="positive">✓ ${f}</p>`).join('') || ''}</div>
    <div class="factor-list">${resultado.factoresNegativos?.map((f: string) => `<p class="negative">✗ ${f}</p>`).join('') || ''}</div>
  </div>
</div>`
    : ''
}

${
  resultado.comparables?.length
    ? `<div class="section">
  <h2>Propiedades Comparables</h2>
  <table class="comparables">
    <thead><tr><th>Dirección</th><th>Precio</th><th>Superficie</th><th>€/m²</th><th>Similitud</th></tr></thead>
    <tbody>${resultado.comparables.map((c: any) => `<tr><td>${c.direccion}</td><td>${formatCurrency(c.precio)}</td><td>${c.superficie}m²</td><td>${formatCurrency(c.precioM2)}</td><td>${Math.round(c.similitud * 100)}%</td></tr>`).join('')}</tbody>
  </table>
</div>`
    : ''
}

${
  resultado.analisisMercado
    ? `<div class="section">
  <h2>Análisis de Mercado</h2>
  <p>${resultado.analisisMercado}</p>
</div>`
    : ''
}

${
  resultado.recomendaciones?.length
    ? `<div class="section">
  <h2>Recomendaciones</h2>
  <ul>${resultado.recomendaciones.map((r: string) => `<li>${r}</li>`).join('')}</ul>
</div>`
    : ''
}

<div class="footer">
  <p><strong>INMOVA</strong> — Plataforma PropTech de Gestión Inmobiliaria</p>
  <p>Esta valoración es una estimación basada en datos de mercado y análisis de IA. No sustituye a una tasación oficial.</p>
  <p>inmovaapp.com · ${fecha}</p>
</div>
</body>
</html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(htmlContent);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
    toast.success('Informe PDF generado — usa Ctrl+P para guardar como PDF');
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
            {/* Tabs: Mis Activos | Valoración de Mercado */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as 'mis-activos' | 'mercado')}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="mis-activos" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Mis Activos
                </TabsTrigger>
                <TabsTrigger value="mercado" className="gap-2">
                  <MapPin className="h-4 w-4" />
                  Valoración de Mercado
                </TabsTrigger>
                <TabsTrigger
                  value="historial"
                  className="gap-2"
                  onClick={() => {
                    if (historial.length === 0) fetchHistorial();
                  }}
                >
                  <Clock className="h-4 w-4" />
                  Historial
                </TabsTrigger>
              </TabsList>

              {/* Tab: Mis Activos */}
              <TabsContent value="mis-activos" className="mt-4">
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
                          setSelectedBuildingFilter('');
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

                    {/* Para unidades: primero seleccionar edificio, luego unidad */}
                    {assetType === 'unit' && (
                      <>
                        <div className="space-y-2">
                          <Label>1. Seleccionar Edificio</Label>
                          <Select
                            value={selectedBuildingFilter}
                            onValueChange={(v) => {
                              setSelectedBuildingFilter(v);
                              setSelectedAsset('manual');
                              // Auto-rellenar dirección/ciudad del edificio
                              if (v) {
                                const building = buildings.find((b) => b.id === v);
                                if (building) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    direccionManual:
                                      (building as any).direccion || prev.direccionManual,
                                    ciudadManual: (building as any).ciudad || prev.ciudadManual,
                                    codigoPostalManual:
                                      (building as any).codigoPostal || prev.codigoPostalManual,
                                  }));
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un edificio..." />
                            </SelectTrigger>
                            <SelectContent>
                              {buildings.map((building) => (
                                <SelectItem key={building.id} value={building.id}>
                                  {building.nombre || (building as any).direccion || 'Sin nombre'}
                                  {building.numeroUnidades
                                    ? ` (${building.numeroUnidades} uds)`
                                    : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedBuildingFilter && (
                          <div className="space-y-2">
                            <Label>2. Seleccionar Unidad</Label>
                            <Select value={selectedAsset} onValueChange={handleAssetSelect}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona una unidad del edificio..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="manual">
                                  -- Introducir datos manualmente --
                                </SelectItem>
                                {units
                                  .filter((u) => u.building?.id === selectedBuildingFilter)
                                  .map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                      Unidad {unit.numero}
                                      {unit.tipo ? ` (${unit.tipo})` : ''}
                                      {unit.superficie ? ` — ${unit.superficie}m²` : ''}
                                      {unit.habitaciones ? ` — ${unit.habitaciones} hab.` : ''}
                                      {unit.estado ? ` [${unit.estado}]` : ''}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              {
                                units.filter((u) => u.building?.id === selectedBuildingFilter)
                                  .length
                              }{' '}
                              unidades en este edificio
                            </p>
                          </div>
                        )}

                        {!selectedBuildingFilter && (
                          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            Selecciona primero un edificio para ver sus unidades disponibles.
                          </p>
                        )}
                      </>
                    )}

                    {/* Para edificios: selector directo */}
                    {assetType === 'building' && (
                      <div className="space-y-2">
                        <Label>Seleccionar Edificio</Label>
                        <Select value={selectedAsset} onValueChange={handleAssetSelect}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un edificio de tu cartera..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">
                              -- Introducir datos manualmente --
                            </SelectItem>
                            {buildings.map((building) => (
                              <SelectItem key={building.id} value={building.id}>
                                {building.nombre || (building as any).direccion || 'Sin dirección'}
                                {building.numeroUnidades
                                  ? ` (${building.numeroUnidades} unidades)`
                                  : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Valoración de Mercado */}
              <TabsContent value="mercado" className="mt-4 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Búsqueda en Catastro
                    </CardTitle>
                    <CardDescription>
                      Consulta datos oficiales para valorar cualquier inmueble
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Búsqueda por Referencia Catastral */}
                    <div className="space-y-2">
                      <Label>Referencia Catastral</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ej: 1234567VK1234N0001W (14-20 caracteres)"
                          value={refCatastral}
                          onChange={(e) => setRefCatastral(e.target.value)}
                        />
                        <Button
                          variant="secondary"
                          onClick={handleBuscarCatastro}
                          disabled={buscandoCatastro}
                        >
                          {buscandoCatastro ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Consultar Catastro'
                          )}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Búsqueda por Dirección (simple) */}
                    <div className="space-y-2">
                      <Label>O busca por dirección</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder='Ej: "Calle Alcalá 1, Madrid" o "Avda Diagonal 520, Barcelona"'
                          value={searchDireccionLibre}
                          onChange={(e) => setSearchDireccionLibre(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleBuscarCatastro()}
                        />
                        <Button
                          variant="outline"
                          onClick={handleBuscarCatastro}
                          disabled={buscandoCatastro}
                        >
                          {buscandoCatastro ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Buscar'
                          )}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Formato: tipo vía + nombre + número + ciudad. Se consulta la API pública del
                        Catastro.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Resultado Catastro */}
                {catastroData && (
                  <Card className="border-2 border-violet-200 bg-violet-50/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-violet-600" />
                          Datos del Catastro
                        </span>
                        <Badge variant="secondary">Datos del Catastro</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="font-medium">{catastroData.direccion}</p>
                      <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                        <span>{catastroData.superficieTotal} m²</span>
                        <span>Uso: {catastroData.uso}</span>
                        {catastroData.anoConstruccion ? (
                          <span>Año: {catastroData.anoConstruccion}</span>
                        ) : null}
                        {catastroData.inmuebles?.length ? (
                          <span>{catastroData.inmuebles.length} inmueble(s)</span>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tab: Historial de Valoraciones */}
              <TabsContent value="historial" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Historial de Valoraciones
                    </CardTitle>
                    <CardDescription>Valoraciones realizadas anteriormente</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingHistorial ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : historial.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p>No hay valoraciones anteriores</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={fetchHistorial}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Recargar
                        </Button>
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {historial.map((v: any, idx: number) => (
                            <div
                              key={v.id || idx}
                              className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                              onClick={() => {
                                setResultado({
                                  valorEstimado: v.estimatedValue,
                                  valorMinimo: v.minValue,
                                  valorMaximo: v.maxValue,
                                  precioM2: v.pricePerM2 || 0,
                                  confianza: v.confidenceScore || 70,
                                  tendenciaMercado:
                                    v.marketTrend === 'UP'
                                      ? 'alcista'
                                      : v.marketTrend === 'DOWN'
                                        ? 'bajista'
                                        : 'estable',
                                  porcentajeTendencia: 0,
                                  comparables: [],
                                  factoresPositivos: v.keyFactors || [],
                                  factoresNegativos: [],
                                  recomendaciones: v.recommendations || [],
                                  analisisMercado: '',
                                  tiempoEstimadoVenta: '',
                                  rentabilidadAlquiler: v.estimatedROI || 0,
                                  alquilerEstimado: v.estimatedRent || 0,
                                  reasoning: v.reasoning || '',
                                });
                                setActiveTab('mis-activos');
                                toast.success('Valoración cargada');
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">
                                    {v.address || 'Sin dirección'}, {v.city}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {v.squareMeters}m² | {v.rooms} hab. |{' '}
                                    {new Date(v.createdAt).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-violet-700">
                                    {formatCurrency(v.estimatedValue)}
                                  </p>
                                  <Badge variant="outline" className="text-[10px]">
                                    {v.confidenceScore || 0}% confianza
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Características del Inmueble */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Características del Inmueble
                  {activeTab === 'mercado' && catastroData && (
                    <Badge variant="outline" className="text-xs">
                      Datos del Catastro
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="superficie">
                      {(LABELS_POR_TIPO[formData.tipoActivo] || LABELS_POR_TIPO.vivienda)
                        .superficie || 'Superficie (m²)'}{' '}
                      *
                    </Label>
                    <Input
                      id="superficie"
                      type="number"
                      placeholder={
                        formData.tipoActivo === 'nave_industrial'
                          ? '500'
                          : formData.tipoActivo === 'garaje'
                            ? '12'
                            : formData.tipoActivo === 'solar'
                              ? '1000'
                              : '85'
                      }
                      value={formData.superficie}
                      onChange={(e) => setFormData({ ...formData, superficie: e.target.value })}
                    />
                  </div>
                  {(CAMPOS_POR_TIPO[formData.tipoActivo] || CAMPOS_POR_TIPO.vivienda)
                    .habitaciones && (
                    <div className="space-y-2">
                      <Label htmlFor="habitaciones">
                        {(LABELS_POR_TIPO[formData.tipoActivo] || LABELS_POR_TIPO.vivienda)
                          .habitaciones || 'Habitaciones'}
                      </Label>
                      <Input
                        id="habitaciones"
                        type="number"
                        placeholder={formData.tipoActivo === 'edificio_completo' ? '12' : '3'}
                        value={formData.habitaciones}
                        onChange={(e) => setFormData({ ...formData, habitaciones: e.target.value })}
                      />
                    </div>
                  )}
                  {(CAMPOS_POR_TIPO[formData.tipoActivo] || CAMPOS_POR_TIPO.vivienda).banos && (
                    <div className="space-y-2">
                      <Label htmlFor="banos">
                        {(LABELS_POR_TIPO[formData.tipoActivo] || LABELS_POR_TIPO.vivienda).banos ||
                          'Baños'}
                      </Label>
                      <Input
                        id="banos"
                        type="number"
                        placeholder={formData.tipoActivo === 'edificio_completo' ? '4' : '2'}
                        value={formData.banos}
                        onChange={(e) => setFormData({ ...formData, banos: e.target.value })}
                      />
                    </div>
                  )}
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
                  {(CAMPOS_POR_TIPO[formData.tipoActivo] || CAMPOS_POR_TIPO.vivienda).planta && (
                    <div className="space-y-2">
                      <Label htmlFor="planta">
                        {(LABELS_POR_TIPO[formData.tipoActivo] || LABELS_POR_TIPO.vivienda)
                          .planta || 'Planta'}
                      </Label>
                      <Input
                        id="planta"
                        type="number"
                        placeholder={
                          formData.tipoActivo === 'garaje'
                            ? '-1'
                            : formData.tipoActivo === 'local_comercial'
                              ? '0'
                              : '3'
                        }
                        value={formData.planta}
                        onChange={(e) => setFormData({ ...formData, planta: e.target.value })}
                      />
                    </div>
                  )}
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
                  {(CAMPOS_POR_TIPO[formData.tipoActivo] || CAMPOS_POR_TIPO.vivienda)
                    .orientacion && (
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
                  )}
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

                {/* Ubicación (manual o auto-rellenada) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Ubicación
                    {(activeTab === 'mercado' && catastroData) || selectedAsset !== 'manual' ? (
                      <Badge variant="outline" className="text-[10px]">
                        Auto-rellenada
                      </Badge>
                    ) : null}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      placeholder="Dirección (calle, n.°)"
                      value={formData.direccionManual}
                      onChange={(e) =>
                        setFormData({ ...formData, direccionManual: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Ciudad"
                      value={formData.ciudadManual}
                      onChange={(e) => setFormData({ ...formData, ciudadManual: e.target.value })}
                    />
                    <Input
                      placeholder="Código Postal"
                      value={formData.codigoPostalManual}
                      onChange={(e) =>
                        setFormData({ ...formData, codigoPostalManual: e.target.value })
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Si se selecciona un activo o catastro, se usará esa dirección. Estos campos
                    permiten sobreescribirla.
                  </p>
                </div>

                <Separator />

                {/* Eficiencia Energética */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Certificado Energético</Label>
                    <Select
                      value={formData.eficienciaEnergetica}
                      onValueChange={(v) => setFormData({ ...formData, eficienciaEnergetica: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin certificar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin certificar</SelectItem>
                        <SelectItem value="A">A (muy eficiente)</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                        <SelectItem value="G">G (poco eficiente)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de activo</Label>
                    <Select
                      value={formData.tipoActivo}
                      onValueChange={(v) =>
                        setFormData({ ...formData, tipoActivo: v, caracteristicas: [] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vivienda">Vivienda</SelectItem>
                        <SelectItem value="local_comercial">Local comercial</SelectItem>
                        <SelectItem value="oficina">Oficina</SelectItem>
                        <SelectItem value="nave_industrial">Nave industrial</SelectItem>
                        <SelectItem value="garaje">Garaje / Parking</SelectItem>
                        <SelectItem value="trastero">Trastero</SelectItem>
                        <SelectItem value="edificio_completo">Edificio completo</SelectItem>
                        <SelectItem value="solar">Solar / Terreno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Características adaptadas al tipo de activo */}
                <div className="space-y-2">
                  <Label>
                    Equipamiento y extras —{' '}
                    {formData.tipoActivo === 'vivienda'
                      ? 'Vivienda'
                      : formData.tipoActivo === 'local_comercial'
                        ? 'Local comercial'
                        : formData.tipoActivo === 'oficina'
                          ? 'Oficina'
                          : formData.tipoActivo === 'nave_industrial'
                            ? 'Nave industrial'
                            : formData.tipoActivo === 'garaje'
                              ? 'Garaje'
                              : formData.tipoActivo === 'edificio_completo'
                                ? 'Edificio'
                                : formData.tipoActivo === 'solar'
                                  ? 'Solar'
                                  : 'General'}
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      CARACTERISTICAS_POR_TIPO[formData.tipoActivo] ||
                      CARACTERISTICAS_POR_TIPO.vivienda
                    ).map((car) => {
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
                    onChange={(e) =>
                      setFormData({ ...formData, descripcionAdicional: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {/* === Criterios avanzados (RICS Red Book 2024 / ECO 805/2003) === */}
                <details className="group rounded-lg border bg-muted/20 p-4">
                  <summary className="cursor-pointer flex items-center gap-2 font-medium text-sm">
                    <Brain className="h-4 w-4 text-violet-600" />
                    Criterios avanzados (ESG, ubicación, riesgos)
                    <Badge variant="outline" className="ml-2 text-[10px]">
                      Opcional · mejora la precisión
                    </Badge>
                  </summary>
                  <div className="mt-4 space-y-5 text-sm">
                    {/* ESG / Energía */}
                    <div>
                      <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        ESG / Eficiencia Energética
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="cee">CEE energético</Label>
                          <Select
                            value={formData.certificadoEnergetico || 'none'}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                certificadoEnergetico: v === 'none' ? '' : (v as any),
                              })
                            }
                          >
                            <SelectTrigger id="cee">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No aportado</SelectItem>
                              {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((l) => (
                                <SelectItem key={l} value={l}>
                                  {l}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="kwh">Consumo (kWh/m²·año)</Label>
                          <Input
                            id="kwh"
                            type="number"
                            value={formData.consumoEnergeticoKwhM2}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                consumoEnergeticoKwhM2: e.target.value,
                              })
                            }
                            placeholder="ej. 80"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Calidad de ubicación */}
                    <div>
                      <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        Calidad de ubicación
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Transporte público</Label>
                          <Select
                            value={formData.proximidadTransportePublico || 'none'}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                proximidadTransportePublico: v === 'none' ? '' : (v as any),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="excelente">Excelente (+15-25%)</SelectItem>
                              <SelectItem value="buena">Buena (+5-10%)</SelectItem>
                              <SelectItem value="regular">Regular</SelectItem>
                              <SelectItem value="mala">Mala (-3-7%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Distancia transporte (min andando)</Label>
                          <Input
                            type="number"
                            value={formData.distanciaMetroMin}
                            onChange={(e) =>
                              setFormData({ ...formData, distanciaMetroMin: e.target.value })
                            }
                            placeholder="ej. 5"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Nivel de ruido</Label>
                          <Select
                            value={formData.zonaRuido || 'none'}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                zonaRuido: v === 'none' ? '' : (v as any),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="tranquila">Tranquila (+3-5%)</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="ruidosa">Ruidosa (-5-10%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Calidad colegios próximos</Label>
                          <Select
                            value={formData.calidadColegios || 'none'}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                calidadColegios: v === 'none' ? '' : (v as any),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="alta">Alta (+10-30%)</SelectItem>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="baja">Baja (-3-7%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Vistas</Label>
                          <Select
                            value={formData.vistas || 'none'}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                vistas: v === 'none' ? '' : (v as any),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="panoramicas">Panorámicas (+8-15%)</SelectItem>
                              <SelectItem value="despejadas">Despejadas (+3-6%)</SelectItem>
                              <SelectItem value="normales">Normales</SelectItem>
                              <SelectItem value="limitadas">Limitadas (-3-5%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 pt-6">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.zonaVerdeProxima}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  zonaVerdeProxima: e.target.checked,
                                })
                              }
                            />
                            Zona verde a &lt;500m (+2-5%)
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.zonaTensionada}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  zonaTensionada: e.target.checked,
                                })
                              }
                            />
                            Zona tensionada LAU (-3-8%)
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Riesgos */}
                    <div>
                      <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        Riesgos técnicos / legales
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>ITE (Inspección Técnica)</Label>
                          <Select
                            value={formData.ite || 'none'}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                ite: v === 'none' ? '' : (v as any),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="favorable">Favorable</SelectItem>
                              <SelectItem value="pendiente">Pendiente (-3-5%)</SelectItem>
                              <SelectItem value="desfavorable">Desfavorable (-10-25%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Riesgo inundación</Label>
                          <Select
                            value={formData.riesgoInundacion || 'none'}
                            onValueChange={(v) =>
                              setFormData({
                                ...formData,
                                riesgoInundacion: v === 'none' ? '' : (v as any),
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">—</SelectItem>
                              <SelectItem value="bajo">Bajo</SelectItem>
                              <SelectItem value="medio">Medio (-3-8%)</SelectItem>
                              <SelectItem value="alto">Alto (-10-20%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label>Derramas pendientes (€)</Label>
                          <Input
                            type="number"
                            value={formData.derramasPendientes}
                            onChange={(e) =>
                              setFormData({ ...formData, derramasPendientes: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Inquilinos LAU 1964 (renta antigua)</Label>
                          <Input
                            type="number"
                            value={formData.inquilinosRentaAntigua}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                inquilinosRentaAntigua: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Económicos */}
                    <div>
                      <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                        Datos económicos del activo
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label>IBI anual (€)</Label>
                          <Input
                            type="number"
                            value={formData.ibiAnual}
                            onChange={(e) =>
                              setFormData({ ...formData, ibiAnual: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Comunidad mensual (€)</Label>
                          <Input
                            type="number"
                            value={formData.comunidadMensual}
                            onChange={(e) =>
                              setFormData({ ...formData, comunidadMensual: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Renta actual mensual (€)</Label>
                          <Input
                            type="number"
                            value={formData.rentaActualMensual}
                            onChange={(e) =>
                              setFormData({ ...formData, rentaActualMensual: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Superficie útil (m²)</Label>
                          <Input
                            type="number"
                            value={formData.superficieUtil}
                            onChange={(e) =>
                              setFormData({ ...formData, superficieUtil: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Año última reforma integral</Label>
                          <Input
                            type="number"
                            value={formData.yearLastRenovation}
                            onChange={(e) =>
                              setFormData({ ...formData, yearLastRenovation: e.target.value })
                            }
                            placeholder="ej. 2018"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground italic">
                      Aportar estos datos mejora la precisión de la valoración y la confianza
                      del modelo IA. Estándares: RICS Red Book Global 2024, IVS 2024 y Orden
                      ECO/805/2003.
                    </p>
                  </div>
                </details>

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
              <Card className="h-full flex flex-col items-center justify-center min-h-[400px] border-dashed border-2">
                <CardContent className="text-center py-10">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
                    <Brain className="h-10 w-10 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Valoración Inteligente Multi-Plataforma
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm leading-relaxed">
                    Obtiene datos en tiempo real de Idealista, Fotocasa, Habitaclia y Pisos.com
                    mediante scraping, los cruza con datos oficiales del Notariado e INE, y aplica
                    un análisis IA en dos fases para una valoración profesional.
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto mb-6">
                    <div className="p-2 bg-muted/50 rounded-lg text-left">
                      <p className="text-xs font-medium">Fase 1 — IA rápida</p>
                      <p className="text-[10px] text-muted-foreground">
                        Filtra y puntúa comparables de portales
                      </p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg text-left">
                      <p className="text-xs font-medium">Fase 2 — IA experta</p>
                      <p className="text-[10px] text-muted-foreground">
                        Valoración por comparables + capitalización
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Target className="h-3 w-3 mr-1" />4 portales
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Notariado + INE
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Brain className="h-3 w-3 mr-1" />
                      IA multi-paso
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Recomendaciones
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {valorando && (
              <Card className="h-full flex flex-col items-center justify-center min-h-[400px]">
                <CardContent className="text-center py-10">
                  <div className="relative h-24 w-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-200" />
                    <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                    <Brain className="absolute inset-0 m-auto h-10 w-10 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Valoración IA en curso</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto text-sm mb-6">
                    Scraping de portales, análisis de comparables y valoración experta multi-paso
                  </p>

                  <div className="mb-4">
                    <Progress
                      value={((currentStep + 1) / VALUATION_STEPS.length) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Paso {currentStep + 1} de {VALUATION_STEPS.length}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-left max-w-sm mx-auto">
                    {VALUATION_STEPS.map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 transition-opacity ${
                          idx < currentStep
                            ? 'text-muted-foreground'
                            : idx === currentStep
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground/40'
                        }`}
                      >
                        {idx < currentStep ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        ) : idx === currentStep ? (
                          <Loader2 className="h-4 w-4 animate-spin text-violet-500 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 shrink-0" />
                        )}
                        {step.label}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {resultado && (
              <div className="space-y-4">
                {/* Valoración Principal */}
                <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50/80 to-purple-50/80 shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-violet-600" />
                        Valoración Estimada
                      </span>
                      <Badge className={getTrendColor(resultado.tendenciaMercado)}>
                        {getTrendIcon(resultado.tendenciaMercado)}
                        <span className="ml-1">
                          {resultado.tendenciaMercado === 'alcista'
                            ? '+'
                            : resultado.tendenciaMercado === 'bajista'
                              ? '-'
                              : ''}
                          {resultado.porcentajeTendencia}%
                        </span>
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Precio principal */}
                    <div className="text-center">
                      <p className="text-4xl sm:text-5xl font-bold text-violet-700 tracking-tight">
                        {formatCurrency(resultado.valorEstimado)}
                      </p>
                      {resultado.metodologiaUsada && (
                        <p className="text-xs text-violet-500 mt-1">{resultado.metodologiaUsada}</p>
                      )}
                    </div>

                    {/* Barra visual de rango min-max */}
                    <div className="px-2">
                      <div className="relative h-3 bg-gradient-to-r from-violet-100 via-violet-300 to-violet-100 rounded-full">
                        {resultado.valorMinimo > 0 && resultado.valorMaximo > 0 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-violet-600 border-2 border-white shadow-md"
                            style={{
                              left: `${Math.max(5, Math.min(95, ((resultado.valorEstimado - resultado.valorMinimo) / (resultado.valorMaximo - resultado.valorMinimo)) * 100))}%`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          />
                        )}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(resultado.valorMinimo)}</span>
                        <span className="font-medium text-violet-700">
                          {formatCurrency(resultado.valorEstimado)}
                        </span>
                        <span>{formatCurrency(resultado.valorMaximo)}</span>
                      </div>
                    </div>

                    {/* KPIs — adaptados al tipo de activo */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t">
                      <div className="text-center p-2 bg-white/60 rounded-lg">
                        <p className="text-lg font-bold">{formatCurrency(resultado.precioM2)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          {formData.tipoActivo === 'garaje' ? '€/plaza' : '€/m²'}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white/60 rounded-lg">
                        <p className="text-lg font-bold">{resultado.confianza}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Confianza
                        </p>
                      </div>
                      {formData.tipoActivo !== 'terreno' && formData.tipoActivo !== 'solar' && (
                        <div className="text-center p-2 bg-white/60 rounded-lg">
                          <p className="text-lg font-bold">
                            {resultado.tiempoEstimadoVenta || '-'}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Tiempo venta
                          </p>
                        </div>
                      )}
                      <div className="text-center p-2 bg-white/60 rounded-lg">
                        <p className="text-lg font-bold">{resultado.comparables?.length || 0}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                          Comparables
                        </p>
                      </div>
                      {resultado.rentabilidadAlquiler > 0 && (
                        <div className="text-center p-2 bg-white/60 rounded-lg">
                          <p className="text-lg font-bold text-green-700">
                            {resultado.rentabilidadAlquiler.toFixed(1)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                            Yield bruto
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Barra de confianza */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Fiabilidad del análisis</span>
                        <span
                          className={`font-semibold ${resultado.confianza >= 75 ? 'text-green-600' : resultado.confianza >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                        >
                          {resultado.confianza >= 75
                            ? 'Alta'
                            : resultado.confianza >= 60
                              ? 'Media'
                              : 'Baja'}
                        </span>
                      </div>
                      <Progress value={resultado.confianza} className="h-2" />
                    </div>

                    {/* Resumen de alquileres — adaptado al tipo de activo */}
                    {(resultado.alquilerEstimado > 0 || resultado.alquilerMediaEstancia) && (
                      <div className="pt-4 border-t space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                          <Euro className="h-3.5 w-3.5" />
                          {formData.tipoActivo === 'garaje'
                            ? 'Estimación renta mensual'
                            : formData.tipoActivo === 'trastero'
                              ? 'Estimación renta mensual'
                              : formData.tipoActivo === 'nave_industrial'
                                ? 'Estimación renta'
                                : formData.tipoActivo === 'local_comercial'
                                  ? 'Estimación renta local'
                                  : 'Estimación de alquiler'}
                        </p>
                        <div
                          className={`grid ${resultado.alquilerMediaEstancia && resultado.alquilerMediaEstancia > 0 && formData.tipoActivo === 'vivienda' ? 'grid-cols-2' : 'grid-cols-1'} gap-3`}
                        >
                          {resultado.alquilerEstimado > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-[10px] text-green-600 font-medium uppercase">
                                {formData.tipoActivo === 'garaje'
                                  ? 'Renta plaza parking'
                                  : formData.tipoActivo === 'trastero'
                                    ? 'Renta trastero'
                                    : formData.tipoActivo === 'nave_industrial'
                                      ? 'Renta nave'
                                      : formData.tipoActivo === 'local_comercial'
                                        ? 'Renta local'
                                        : formData.tipoActivo === 'oficina'
                                          ? 'Renta oficina'
                                          : 'Larga estancia (12+ meses)'}
                              </p>
                              <p className="text-2xl font-bold text-green-800">
                                {formatCurrency(resultado.alquilerEstimado)}
                                <span className="text-sm font-normal">/mes</span>
                              </p>
                              {resultado.rentabilidadAlquiler > 0 && (
                                <p className="text-xs text-green-600 mt-0.5">
                                  Rentabilidad: {resultado.rentabilidadAlquiler.toFixed(1)}% bruta
                                </p>
                              )}
                            </div>
                          )}
                          {resultado.alquilerMediaEstancia &&
                            resultado.alquilerMediaEstancia > 0 &&
                            formData.tipoActivo === 'vivienda' && (
                              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                <p className="text-[10px] text-orange-600 font-medium uppercase">
                                  Media estancia (1-11 meses)
                                </p>
                                <p className="text-2xl font-bold text-orange-800">
                                  {formatCurrency(resultado.alquilerMediaEstancia)}
                                  <span className="text-sm font-normal">/mes</span>
                                </p>
                                {resultado.alquilerEstimado > 0 && (
                                  <p className="text-xs text-orange-600 mt-0.5">
                                    +
                                    {Math.round(
                                      ((resultado.alquilerMediaEstancia -
                                        resultado.alquilerEstimado) /
                                        resultado.alquilerEstimado) *
                                        100
                                    )}
                                    % vs larga
                                    {resultado.ocupacionEstimadaMediaEstancia
                                      ? ` · ${resultado.ocupacionEstimadaMediaEstancia}% ocupación`
                                      : ''}
                                  </p>
                                )}
                              </div>
                            )}
                        </div>
                        {resultado.perfilInquilinoMediaEstancia && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Perfil media estancia:</span>{' '}
                            {resultado.perfilInquilinoMediaEstancia}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Dashboard de Inversión — Larga + Media Estancia */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Euro className="h-4 w-4" />
                      Análisis de Inversión por Alquiler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Larga estancia */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Larga estancia (12+ meses)
                        </p>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-[10px] text-green-600 uppercase tracking-wide font-medium">
                            Alquiler/mes
                          </p>
                          <p className="text-xl font-bold text-green-800">
                            {resultado.alquilerEstimado
                              ? `${formatCurrency(resultado.alquilerEstimado)}`
                              : '-'}
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-[10px] text-green-600 uppercase tracking-wide font-medium">
                            Renta anual
                          </p>
                          <p className="text-xl font-bold text-green-800">
                            {resultado.alquilerEstimado
                              ? formatCurrency(resultado.alquilerEstimado * 12)
                              : '-'}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-[10px] text-blue-600 uppercase tracking-wide font-medium">
                            Rentabilidad bruta
                          </p>
                          <p className="text-xl font-bold text-blue-800">
                            {resultado.rentabilidadAlquiler
                              ? `${resultado.rentabilidadAlquiler.toFixed(2)}%`
                              : '-'}
                          </p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <p className="text-[10px] text-amber-600 uppercase tracking-wide font-medium">
                            Cap Rate
                          </p>
                          <p className="text-xl font-bold text-amber-800">
                            {(resultado as any).capRate
                              ? `${(resultado as any).capRate.toFixed(2)}%`
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Media estancia */}
                    {resultado.alquilerMediaEstancia ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Media estancia (1-11 meses)
                          </p>
                          {resultado.perfilInquilinoMediaEstancia && (
                            <Badge variant="outline" className="text-[10px] ml-auto">
                              <Users className="h-3 w-3 mr-1" />
                              {resultado.perfilInquilinoMediaEstancia}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <p className="text-[10px] text-orange-600 uppercase tracking-wide font-medium">
                              Alquiler/mes
                            </p>
                            <p className="text-xl font-bold text-orange-800">
                              {formatCurrency(resultado.alquilerMediaEstancia)}
                            </p>
                            {resultado.alquilerMediaEstanciaMin &&
                              resultado.alquilerMediaEstanciaMax && (
                                <p className="text-[10px] text-orange-500 mt-0.5">
                                  {formatCurrency(resultado.alquilerMediaEstanciaMin)} –{' '}
                                  {formatCurrency(resultado.alquilerMediaEstanciaMax)}
                                </p>
                              )}
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <p className="text-[10px] text-orange-600 uppercase tracking-wide font-medium">
                              Renta anual estimada
                            </p>
                            <p className="text-xl font-bold text-orange-800">
                              {resultado.ocupacionEstimadaMediaEstancia
                                ? formatCurrency(
                                    Math.round(
                                      resultado.alquilerMediaEstancia *
                                        12 *
                                        (resultado.ocupacionEstimadaMediaEstancia / 100)
                                    )
                                  )
                                : formatCurrency(resultado.alquilerMediaEstancia * 12)}
                            </p>
                            {resultado.ocupacionEstimadaMediaEstancia && (
                              <p className="text-[10px] text-orange-500 mt-0.5">
                                con {resultado.ocupacionEstimadaMediaEstancia}% ocupación
                              </p>
                            )}
                          </div>
                          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-[10px] text-indigo-600 uppercase tracking-wide font-medium">
                              Rentabilidad bruta
                            </p>
                            <p className="text-xl font-bold text-indigo-800">
                              {resultado.rentabilidadMediaEstancia
                                ? `${resultado.rentabilidadMediaEstancia.toFixed(2)}%`
                                : '-'}
                            </p>
                          </div>
                          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <p className="text-[10px] text-indigo-600 uppercase tracking-wide font-medium">
                              Premium vs larga
                            </p>
                            <p className="text-xl font-bold text-indigo-800">
                              {resultado.alquilerEstimado && resultado.alquilerMediaEstancia
                                ? `+${Math.round(((resultado.alquilerMediaEstancia - resultado.alquilerEstimado) / resultado.alquilerEstimado) * 100)}%`
                                : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Comparativa visual */}
                    {resultado.alquilerEstimado > 0 && resultado.alquilerMediaEstancia ? (
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Comparativa mensual
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs w-28 shrink-0 text-right">Larga estancia</span>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full flex items-center justify-end pr-2"
                                style={{
                                  width: `${Math.min(100, (resultado.alquilerEstimado / (resultado.alquilerMediaEstanciaMax || resultado.alquilerMediaEstancia)) * 100)}%`,
                                }}
                              >
                                <span className="text-[10px] text-white font-medium">
                                  {formatCurrency(resultado.alquilerEstimado)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs w-28 shrink-0 text-right">Media estancia</span>
                            <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                              <div
                                className="h-full bg-orange-500 rounded-full flex items-center justify-end pr-2"
                                style={{ width: '100%' }}
                              >
                                <span className="text-[10px] text-white font-medium">
                                  {formatCurrency(resultado.alquilerMediaEstancia)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                {/* Metodología y Análisis de Mercado — siempre visible */}
                {(resultado.metodologiaUsada ||
                  resultado.analisisMercado ||
                  resultado.reasoning) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-4 w-4 text-violet-500" />
                        Metodología y Análisis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resultado.metodologiaUsada && (
                        <div className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                          <p className="text-xs font-medium text-violet-700 uppercase tracking-wide mb-1">
                            Metodología aplicada
                          </p>
                          <p className="text-sm text-violet-900">{resultado.metodologiaUsada}</p>
                        </div>
                      )}

                      {resultado.analisisMercado && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-1">
                            Situaci&oacute;n del mercado
                          </p>
                          <p className="text-sm text-blue-900 whitespace-pre-line">
                            {resultado.analisisMercado}
                          </p>
                          {resultado.platformSources && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {resultado.platformSources.marketTrend && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    resultado.platformSources.marketTrend === 'UP'
                                      ? 'border-green-300 text-green-700 bg-green-50'
                                      : resultado.platformSources.marketTrend === 'DOWN'
                                        ? 'border-red-300 text-red-700 bg-red-50'
                                        : 'border-gray-300 text-gray-700 bg-gray-50'
                                  }`}
                                >
                                  {resultado.platformSources.marketTrend === 'UP'
                                    ? 'Alcista'
                                    : resultado.platformSources.marketTrend === 'DOWN'
                                      ? 'Bajista'
                                      : 'Estable'}
                                  {resultado.platformSources.trendPercentage > 0 &&
                                    ` (${resultado.platformSources.trendPercentage}%)`}
                                </Badge>
                              )}
                              {resultado.platformSources.demandLevel && (
                                <Badge variant="outline" className="text-xs">
                                  Demanda: {resultado.platformSources.demandLevel}
                                </Badge>
                              )}
                              {resultado.platformSources.avgDaysOnMarket && (
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {resultado.platformSources.avgDaysOnMarket} d&iacute;as en mercado
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {resultado.reasoning && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                            Razonamiento del tasador IA
                          </p>
                          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                            {resultado.reasoning}
                          </p>
                        </div>
                      )}

                      {/* Desglose de ajustes RICS Red Book 2024 */}
                      {resultado.ajustesPorFactores && (
                        <div className="rounded-lg border bg-violet-50/40 dark:bg-violet-950/20 p-3 space-y-3">
                          <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 uppercase tracking-wide">
                            Desglose de ajustes (RICS Red Book 2024)
                          </p>
                          {resultado.ajustesPorFactores.esg && (
                            <div className="text-xs space-y-1">
                              <div className="font-medium">
                                ESG / Eficiencia energética:{' '}
                                <span className="text-violet-700">
                                  {resultado.ajustesPorFactores.esg.impactoTotal}
                                </span>
                              </div>
                              <div className="text-muted-foreground">
                                CEE aplicado: {resultado.ajustesPorFactores.esg.ceeAplicado}
                              </div>
                              {resultado.ajustesPorFactores.esg.detalle && (
                                <div className="text-muted-foreground">
                                  {resultado.ajustesPorFactores.esg.detalle}
                                </div>
                              )}
                            </div>
                          )}
                          {resultado.ajustesPorFactores.ubicacion && (
                            <div className="text-xs space-y-1">
                              <div className="font-medium">
                                Calidad de ubicación:{' '}
                                <span className="text-violet-700">
                                  {resultado.ajustesPorFactores.ubicacion.impactoTotal}
                                </span>
                              </div>
                              {resultado.ajustesPorFactores.ubicacion.factoresAplicados?.length >
                                0 && (
                                <ul className="list-disc list-inside text-muted-foreground">
                                  {resultado.ajustesPorFactores.ubicacion.factoresAplicados.map(
                                    (f, i) => (
                                      <li key={i}>{f}</li>
                                    )
                                  )}
                                </ul>
                              )}
                            </div>
                          )}
                          {resultado.ajustesPorFactores.riesgos && (
                            <div className="text-xs space-y-1">
                              <div className="font-medium">
                                Riesgos técnicos / legales:{' '}
                                <span className="text-red-700">
                                  {resultado.ajustesPorFactores.riesgos.impactoTotal}
                                </span>
                              </div>
                              {resultado.ajustesPorFactores.riesgos.factoresAplicados?.length >
                                0 && (
                                <ul className="list-disc list-inside text-muted-foreground">
                                  {resultado.ajustesPorFactores.riesgos.factoresAplicados.map(
                                    (f, i) => (
                                      <li key={i}>{f}</li>
                                    )
                                  )}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {resultado.phase1Summary && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            Pre-an&aacute;lisis de comparables (Fase 1)
                          </p>
                          <p className="text-sm text-muted-foreground">{resultado.phase1Summary}</p>
                        </div>
                      )}

                      {resultado.aiSourcesUsed && resultado.aiSourcesUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-1">
                            Fuentes utilizadas:
                          </span>
                          {resultado.aiSourcesUsed.map((source, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {source === 'claude_ai'
                                ? 'Claude AI'
                                : source === 'idealista_data'
                                  ? 'Idealista Data'
                                  : source === 'idealista'
                                    ? 'Idealista'
                                    : source === 'fotocasa'
                                      ? 'Fotocasa'
                                      : source === 'notariado'
                                        ? 'Notariado'
                                        : source === 'ine'
                                          ? 'INE'
                                          : source}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Factores positivos y negativos — siempre visible */}
                {(resultado.factoresPositivos?.length > 0 ||
                  resultado.factoresNegativos?.length > 0) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Factores de Valoraci&oacute;n
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {resultado.factoresPositivos?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Factores Positivos
                            </p>
                            <ul className="space-y-1">
                              {resultado.factoresPositivos.map((f, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                >
                                  <span className="text-green-500 mt-1 shrink-0">+</span>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {resultado.factoresNegativos?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              Factores Negativos
                            </p>
                            <ul className="space-y-1">
                              {resultado.factoresNegativos.map((f, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                >
                                  <span className="text-red-500 mt-1 shrink-0">-</span>
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Detalles expandibles */}
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
                            <div
                              key={idx}
                              className="p-3 bg-muted/50 rounded-lg flex items-center justify-between"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{comp.direccion}</p>
                                  {comp.fuente && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      {comp.fuente}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {comp.superficie}m² &bull; {formatCurrency(comp.precioM2)}/m²
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

                  {/* Fuentes de Datos de Plataformas */}
                  {resultado.platformSources &&
                    resultado.platformSources.sourcesUsed?.length > 0 && (
                      <AccordionItem value="plataformas">
                        <AccordionTrigger>
                          <span className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Fuentes de Datos ({resultado.platformSources.sourcesUsed.length}{' '}
                            plataformas)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {/* Resumen */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-600 font-medium">
                                  Fiabilidad global
                                </p>
                                <p className="text-lg font-bold text-blue-800">
                                  {resultado.platformSources.overallReliability}%
                                </p>
                              </div>
                              {resultado.platformSources.weightedSalePricePerM2 && (
                                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                  <p className="text-xs text-emerald-600 font-medium">
                                    Precio ponderado
                                  </p>
                                  <p className="text-lg font-bold text-emerald-800">
                                    {formatCurrency(
                                      resultado.platformSources.weightedSalePricePerM2
                                    )}
                                    /m²
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Detalle por plataforma */}
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Desglose por fuente
                              </p>
                              {resultado.platformSources.platformDetails
                                ?.filter((pd: PlatformDetail) => pd.reliability > 0)
                                .sort(
                                  (a: PlatformDetail, b: PlatformDetail) =>
                                    b.reliability - a.reliability
                                )
                                .map((pd: PlatformDetail, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-3 bg-muted/50 rounded-lg flex items-center justify-between"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm">{pd.sourceLabel}</p>
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${
                                            pd.dataType === 'transaction_price'
                                              ? 'border-green-300 text-green-700 bg-green-50'
                                              : pd.dataType === 'asking_price'
                                                ? 'border-orange-300 text-orange-700 bg-orange-50'
                                                : pd.dataType === 'index'
                                                  ? 'border-blue-300 text-blue-700 bg-blue-50'
                                                  : 'border-gray-300'
                                          }`}
                                        >
                                          {pd.dataType === 'transaction_price'
                                            ? 'Precio real'
                                            : pd.dataType === 'asking_price'
                                              ? 'Asking price'
                                              : pd.dataType === 'index'
                                                ? 'Indice'
                                                : 'Estimación'}
                                        </Badge>
                                      </div>
                                      <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                        {pd.pricePerM2Sale && (
                                          <span>Venta: {formatCurrency(pd.pricePerM2Sale)}/m²</span>
                                        )}
                                        {pd.pricePerM2Rent && (
                                          <span>Alquiler: {pd.pricePerM2Rent}€/m²/mes</span>
                                        )}
                                        {pd.sampleSize ? (
                                          <span>{pd.sampleSize} muestras</span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-1">
                                        <div
                                          className={`h-2 w-2 rounded-full ${
                                            pd.reliability >= 80
                                              ? 'bg-green-500'
                                              : pd.reliability >= 60
                                                ? 'bg-yellow-500'
                                                : 'bg-red-500'
                                          }`}
                                        />
                                        <span className="text-xs font-medium">
                                          {pd.reliability}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>

                            {/* Fuentes fallidas */}
                            {resultado.platformSources.sourcesFailed?.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-2">
                                <span className="font-medium">No disponibles: </span>
                                {resultado.platformSources.sourcesFailed.join(', ')}
                              </div>
                            )}

                            {/* Datos enriquecidos de Idealista Data */}
                            {resultado.platformSources.platformDetails
                              ?.filter((pd: PlatformDetail) => pd.source === 'idealista_data')
                              .map((pd: PlatformDetail, idx: number) => {
                                const raw = (pd as any).rawData;
                                if (!raw) return null;
                                return (
                                  <div
                                    key={`idealist-enriched-${idx}`}
                                    className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2"
                                  >
                                    <p className="text-xs font-medium text-blue-700 uppercase tracking-wide flex items-center gap-1">
                                      <TrendingUp className="h-3 w-3" />
                                      Datos enriquecidos Idealista
                                    </p>
                                    {raw.grossYield > 0 && (
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="border-emerald-300 text-emerald-700 bg-emerald-50 text-xs"
                                        >
                                          Rentabilidad bruta: {raw.grossYield}%
                                        </Badge>
                                      </div>
                                    )}
                                    {raw.subZones && raw.subZones.length > 0 && (
                                      <div className="text-xs text-muted-foreground">
                                        <span className="font-medium">Subzonas: </span>
                                        {raw.subZones.slice(0, 4).map((z: any, i: number) => (
                                          <span key={i}>
                                            {z.location} ({z.pricePerM2}€/m²)
                                            {i < Math.min(raw.subZones.length, 4) - 1 ? ' · ' : ''}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                            <p className="text-xs text-muted-foreground mt-2 italic">
                              Los asking prices de Idealista/Fotocasa se ajustan -12% para aproximar
                              el precio real de cierre. Los datos del Notariado son precios
                              escriturados (máxima fiabilidad).
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                </Accordion>

                {/* Ajustar Valoración con Feedback */}
                <Card className="border-2 border-amber-200 bg-amber-50/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                      Ajustar Valoración
                    </CardTitle>
                    <CardDescription>
                      Indica tus observaciones sobre el mercado local y la IA recalculará la
                      valoración
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Ej: El precio de mercado en esta zona está más cerca de 3.500€/m² según ventas recientes que conozco. La capitalización de rentas da un valor demasiado alto porque los alquileres están inflados temporalmente. He visto pisos similares venderse por 280.000€ en los últimos meses..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {refinamientosCount > 0
                          ? `${refinamientosCount} ajuste${refinamientosCount > 1 ? 's' : ''} realizado${refinamientosCount > 1 ? 's' : ''} · Modelo rápido (bajo coste)`
                          : 'Tu conocimiento del mercado local ayuda a ajustar la valoración'}
                      </p>
                      <Button
                        onClick={handleRefinar}
                        disabled={refinando || !feedbackText.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {refinando ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Recalculando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Recalcular con Comentarios
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Acciones */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setResultado(null);
                      setFeedbackText('');
                      setRefinamientosCount(0);
                    }}
                  >
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
          const superficie = fields.find((f) => f.fieldName.toLowerCase().includes('superficie'));
          const habitaciones = fields.find((f) => f.fieldName.toLowerCase().includes('habitacion'));

          if (superficie) {
            setFormData((prev) => ({ ...prev, superficie: superficie.fieldValue }));
          }
          if (habitaciones) {
            setFormData((prev) => ({ ...prev, habitaciones: habitaciones.fieldValue }));
          }
        }}
      />
    </AuthenticatedLayout>
  );
}
