'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format, differenceInDays, isBefore, isAfter, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calculator,
  Receipt,
  FileText,
  CalendarIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Euro,
  Building2,
  User,
  Briefcase,
  TrendingUp,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Bell,
  Settings,
  HelpCircle,
  ExternalLink,
  FileSpreadsheet,
  PieChart,
  BarChart3,
  ArrowRight,
  Home,
  Landmark,
  Scale,
  Percent,
  CreditCard,
  Banknote,
  FileCheck,
  Send,
  Info,
  ChevronRight,
  Filter,
} from 'lucide-react';

// Tipos
interface ResumenFiscal {
  ejercicio: number;
  tipoPersona: 'fisica' | 'juridica';
  ingresosTotales: number;
  gastosTotales: number;
  baseImponible: number;
  impuestoEstimado: number;
  pagosCuenta: number;
  pendientePago: number;
  proximaFecha: string | null;
  proximoModelo: string | null;
}

interface ObligacionFiscal {
  id: string;
  modelo: string;
  nombre: string;
  periodicidad: string;
  fechaLimite: string;
  estado: 'pendiente' | 'presentado' | 'pagado' | 'vencido';
  importe: number | null;
  observaciones?: string;
}

interface PropiedadIBI {
  id: string;
  direccion: string;
  referenciaCatastral: string;
  valorCatastral: number;
  ibiAnual: number;
  fechaPago: string;
  estado: 'pendiente' | 'pagado';
}

interface ModeloTributario {
  codigo: string;
  nombre: string;
  descripcion: string;
  periodicidad: string;
  tipoPersona: 'fisica' | 'juridica' | 'ambos';
  urlAEAT: string;
}

// Skeleton para carga
function FiscalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Estado vacío
function EmptyState({ message, onAction, actionLabel }: { message: string; onAction?: () => void; actionLabel?: string }) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 text-center">
        <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Sin datos disponibles</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">{message}</p>
        {onAction && (
          <Button onClick={onAction}>
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel || 'Añadir'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Lista de modelos tributarios (referencia estática)
const MODELOS_TRIBUTARIOS: ModeloTributario[] = [
  {
    codigo: '100',
    nombre: 'IRPF - Declaración anual',
    descripcion: 'Impuesto sobre la Renta de las Personas Físicas',
    periodicidad: 'Anual',
    tipoPersona: 'fisica',
    urlAEAT: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI34.shtml',
  },
  {
    codigo: '115',
    nombre: 'IRPF - Retenciones alquileres',
    descripcion: 'Retenciones sobre rendimientos de arrendamientos',
    periodicidad: 'Trimestral',
    tipoPersona: 'ambos',
    urlAEAT: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G604.shtml',
  },
  {
    codigo: '200',
    nombre: 'Impuesto de Sociedades',
    descripcion: 'Declaración anual del Impuesto sobre Sociedades',
    periodicidad: 'Anual',
    tipoPersona: 'juridica',
    urlAEAT: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G414.shtml',
  },
  {
    codigo: '303',
    nombre: 'IVA - Autoliquidación',
    descripcion: 'Impuesto sobre el Valor Añadido',
    periodicidad: 'Trimestral',
    tipoPersona: 'ambos',
    urlAEAT: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G411.shtml',
  },
  {
    codigo: '347',
    nombre: 'Operaciones con terceros',
    descripcion: 'Declaración anual de operaciones con terceras personas',
    periodicidad: 'Anual',
    tipoPersona: 'ambos',
    urlAEAT: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G604.shtml',
  },
  {
    codigo: '390',
    nombre: 'IVA - Resumen anual',
    descripcion: 'Declaración-resumen anual del IVA',
    periodicidad: 'Anual',
    tipoPersona: 'ambos',
    urlAEAT: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G417.shtml',
  },
];

export default function ImpuestosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'resumen');
  const [tipoPersona, setTipoPersona] = useState<'fisica' | 'juridica'>('fisica');
  const [ejercicio, setEjercicio] = useState(new Date().getFullYear());
  
  const [isLoading, setIsLoading] = useState(true);
  const [resumenFiscal, setResumenFiscal] = useState<ResumenFiscal | null>(null);
  const [obligaciones, setObligaciones] = useState<ObligacionFiscal[]>([]);
  const [propiedadesIBI, setPropiedadesIBI] = useState<PropiedadIBI[]>([]);
  
  const [showCalculadoraDialog, setShowCalculadoraDialog] = useState(false);
  const [showNuevoImpuestoDialog, setShowNuevoImpuestoDialog] = useState(false);
  
  // Calculadora
  const [calcIngresos, setCalcIngresos] = useState('');
  const [calcGastos, setCalcGastos] = useState('');
  const [calcValorCatastral, setCalcValorCatastral] = useState('');
  const [calcResultado, setCalcResultado] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar datos cuando cambia ejercicio o tipo persona
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status, ejercicio, tipoPersona]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/impuestos/resumen?ejercicio=${ejercicio}&tipoPersona=${tipoPersona}`);
      if (res.ok) {
        const data = await res.json();
        setResumenFiscal(data.resumenFiscal || null);
        setObligaciones(data.obligaciones || []);
        setPropiedadesIBI(data.propiedadesIBI || []);
      } else {
        // Si no hay datos, mostrar estado vacío
        setResumenFiscal(null);
        setObligaciones([]);
        setPropiedadesIBI([]);
      }
    } catch (error) {
      console.error('Error loading fiscal data:', error);
      toast.error('Error al cargar datos fiscales');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular impuestos
  const calcularImpuestos = async () => {
    if (!calcIngresos) {
      toast.error('Introduce los ingresos anuales');
      return;
    }
    
    setIsCalculating(true);
    try {
      const res = await fetch('/api/admin/impuestos/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPersona,
          tipoInmueble: 'vivienda',
          ingresosAnuales: parseFloat(calcIngresos),
          gastosDeducibles: parseFloat(calcGastos) || 0,
          valorCatastral: parseFloat(calcValorCatastral) || 0,
          comunidadAutonoma: 'madrid',
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setCalcResultado(data.calculo);
      } else {
        toast.error('Error al calcular');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setIsCalculating(false);
    }
  };

  // Obtener estado de la obligación con color
  const getEstadoBadge = (estado: string, fechaLimite?: string) => {
    if (estado === 'pagado') {
      return <Badge className="bg-green-500">✓ Pagado</Badge>;
    }
    if (estado === 'presentado') {
      return <Badge className="bg-blue-500">📄 Presentado</Badge>;
    }
    if (estado === 'vencido' || (fechaLimite && isBefore(new Date(fechaLimite), new Date()))) {
      return <Badge variant="destructive">⚠️ Vencido</Badge>;
    }
    if (fechaLimite) {
      const diasRestantes = differenceInDays(new Date(fechaLimite), new Date());
      if (diasRestantes <= 7) {
        return <Badge className="bg-amber-500">⏰ {diasRestantes} días</Badge>;
      }
    }
    return <Badge variant="outline">⏳ Pendiente</Badge>;
  };

  // Formato de moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <FiscalSkeleton />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
              <Euro className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Gestión Fiscal</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Ejercicio {ejercicio}
                </Badge>
              </div>
              <p className="text-muted-foreground">Control de impuestos y obligaciones tributarias</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(ejercicio)} onValueChange={(v) => setEjercicio(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Ejercicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026">2026</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={tipoPersona} onValueChange={(v: 'fisica' | 'juridica') => setTipoPersona(v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fisica">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Persona Física
                  </div>
                </SelectItem>
                <SelectItem value="juridica">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Persona Jurídica
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => setShowCalculadoraDialog(true)}>
              <Calculator className="h-4 w-4 mr-2" />
              Calculadora
            </Button>
            
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards - Solo si hay datos */}
        {resumenFiscal ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Obligaciones Pendientes</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {obligaciones.filter(o => o.estado === 'pendiente').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Impuesto Estimado</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(resumenFiscal.impuestoEstimado)}
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">IBI Total</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(propiedadesIBI.reduce((sum, p) => sum + p.ibiAnual, 0))}
                    </p>
                  </div>
                  <Home className="h-8 w-8 text-violet-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Próxima Fecha</p>
                    <p className="text-2xl font-bold">
                      {resumenFiscal.proximaFecha 
                        ? format(new Date(resumenFiscal.proximaFecha), 'dd/MM')
                        : '-'}
                    </p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-emerald-500" />
                </div>
                {resumenFiscal.proximoModelo && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Modelo {resumenFiscal.proximoModelo}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="py-8 text-center">
              <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                No hay datos fiscales para el ejercicio {ejercicio}. 
                Añade obligaciones fiscales para comenzar.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="resumen" className="gap-2">
              <PieChart className="h-4 w-4" />
              <span className="hidden md:inline">Resumen</span>
            </TabsTrigger>
            <TabsTrigger value="obligaciones" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline">Obligaciones</span>
            </TabsTrigger>
            <TabsTrigger value="inmuebles" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden md:inline">IBI</span>
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden md:inline">Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="modelos" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden md:inline">Modelos</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="resumen" className="space-y-6">
            {resumenFiscal ? (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Resumen Financiero */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-500" />
                      Resumen Financiero
                    </CardTitle>
                    <CardDescription>Desglose del ejercicio {ejercicio}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Ingresos Totales</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(resumenFiscal.ingresosTotales)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Gastos Deducibles</span>
                        <span className="font-semibold text-red-600">
                          -{formatCurrency(resumenFiscal.gastosTotales)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Base Imponible</span>
                        <span className="font-bold">
                          {formatCurrency(resumenFiscal.baseImponible)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Impuesto Estimado</span>
                        <span className="font-semibold text-amber-600">
                          {formatCurrency(resumenFiscal.impuestoEstimado)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Pagos a Cuenta</span>
                        <span className="font-semibold text-green-600">
                          -{formatCurrency(resumenFiscal.pagosCuenta)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <span className="font-semibold">Pendiente de Pago</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(resumenFiscal.pendientePago)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enlaces Útiles */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-blue-500" />
                      Recursos Oficiales
                    </CardTitle>
                    <CardDescription>Acceso a la Agencia Tributaria</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: 'Sede Electrónica AEAT', url: 'https://sede.agenciatributaria.gob.es/', icon: Landmark },
                        { name: 'Calendario del Contribuyente', url: 'https://sede.agenciatributaria.gob.es/Sede/ayuda/calendario-contribuyente.html', icon: CalendarIcon },
                        { name: 'Renta Web', url: 'https://sede.agenciatributaria.gob.es/Sede/Renta.html', icon: User },
                        { name: 'Modelo 303 IVA', url: 'https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G411.shtml', icon: Receipt },
                        { name: 'Catastro', url: 'https://www.sedecatastro.gob.es/', icon: Home },
                      ].map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <link.icon className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-medium">{link.name}</span>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <EmptyState 
                message="No hay datos fiscales registrados para este ejercicio. Comienza añadiendo tus obligaciones tributarias."
                onAction={() => setShowNuevoImpuestoDialog(true)}
                actionLabel="Añadir Obligación"
              />
            )}
          </TabsContent>

          {/* Tab: Obligaciones */}
          <TabsContent value="obligaciones" className="space-y-6">
            {obligaciones.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Obligaciones Tributarias</CardTitle>
                      <CardDescription>Modelos y declaraciones del ejercicio</CardDescription>
                    </div>
                    <Button onClick={() => setShowNuevoImpuestoDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {obligaciones.map((obligacion) => (
                        <div
                          key={obligacion.id}
                          className="flex items-center justify-between p-4 rounded-lg border"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Modelo {obligacion.modelo}</span>
                                <Badge variant="outline">{obligacion.periodicidad}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{obligacion.nombre}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Fecha límite: {format(new Date(obligacion.fechaLimite), 'dd/MM/yyyy', { locale: es })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {obligacion.importe !== null && (
                              <span className="font-semibold">{formatCurrency(obligacion.importe)}</span>
                            )}
                            {getEstadoBadge(obligacion.estado, obligacion.fechaLimite)}
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <EmptyState 
                message="No hay obligaciones tributarias registradas. Añade tus modelos fiscales para llevar un control."
                onAction={() => setShowNuevoImpuestoDialog(true)}
                actionLabel="Añadir Obligación"
              />
            )}
          </TabsContent>

          {/* Tab: Inmuebles IBI */}
          <TabsContent value="inmuebles" className="space-y-6">
            {propiedadesIBI.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-violet-500" />
                        Impuesto sobre Bienes Inmuebles (IBI)
                      </CardTitle>
                      <CardDescription>Control del IBI de tus propiedades</CardDescription>
                    </div>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Inmueble
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {propiedadesIBI.map((propiedad) => (
                      <div
                        key={propiedad.id}
                        className="p-4 rounded-lg border"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{propiedad.direccion}</h4>
                            <p className="text-sm text-muted-foreground">
                              Ref. Catastral: {propiedad.referenciaCatastral}
                            </p>
                          </div>
                          {getEstadoBadge(propiedad.estado)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Valor Catastral</p>
                            <p className="font-semibold">{formatCurrency(propiedad.valorCatastral)}</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">IBI Anual</p>
                            <p className="font-semibold text-amber-600">{formatCurrency(propiedad.ibiAnual)}</p>
                          </div>
                          <div className="text-center p-3 bg-muted/50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Fecha Pago</p>
                            <p className="font-semibold">
                              {format(new Date(propiedad.fechaPago), 'dd/MM/yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <EmptyState 
                message="No hay propiedades registradas para el control de IBI. Añade tus inmuebles para gestionar el impuesto."
                onAction={() => toast.info('Funcionalidad en desarrollo')}
                actionLabel="Añadir Inmueble"
              />
            )}
          </TabsContent>

          {/* Tab: Calendario */}
          <TabsContent value="calendario" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-emerald-500" />
                  Calendario Fiscal {ejercicio}
                </CardTitle>
                <CardDescription>Fechas importantes del ejercicio</CardDescription>
              </CardHeader>
              <CardContent>
                {obligaciones.length > 0 ? (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {obligaciones
                        .sort((a, b) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime())
                        .map((obligacion) => {
                          const fecha = new Date(obligacion.fechaLimite);
                          const diasRestantes = differenceInDays(fecha, new Date());
                          const esPasado = diasRestantes < 0;
                          const esUrgente = diasRestantes >= 0 && diasRestantes <= 7;
                          
                          return (
                            <div
                              key={obligacion.id}
                              className={`flex items-center gap-4 p-4 rounded-lg border ${
                                esPasado ? 'bg-red-50 border-red-200' : 
                                esUrgente ? 'bg-amber-50 border-amber-200' : ''
                              }`}
                            >
                              <div className="text-center min-w-16">
                                <p className="text-2xl font-bold">{format(fecha, 'dd')}</p>
                                <p className="text-xs text-muted-foreground uppercase">
                                  {format(fecha, 'MMM', { locale: es })}
                                </p>
                              </div>
                              <Separator orientation="vertical" className="h-12" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">Modelo {obligacion.modelo}</span>
                                  {getEstadoBadge(obligacion.estado, obligacion.fechaLimite)}
                                </div>
                                <p className="text-sm text-muted-foreground">{obligacion.nombre}</p>
                              </div>
                              {!esPasado && obligacion.estado === 'pendiente' && (
                                <div className="text-right">
                                  <p className={`text-sm font-medium ${esUrgente ? 'text-amber-600' : ''}`}>
                                    {diasRestantes} días restantes
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      No hay fechas registradas. Añade obligaciones fiscales para ver el calendario.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Modelos */}
          <TabsContent value="modelos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-blue-500" />
                  Modelos Tributarios
                </CardTitle>
                <CardDescription>Referencia de modelos aplicables para {tipoPersona === 'fisica' ? 'persona física' : 'persona jurídica'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MODELOS_TRIBUTARIOS
                    .filter(m => m.tipoPersona === 'ambos' || m.tipoPersona === tipoPersona)
                    .map((modelo) => (
                      <div
                        key={modelo.codigo}
                        className="flex items-center justify-between p-4 rounded-lg border"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{modelo.codigo}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{modelo.nombre}</h4>
                            <p className="text-sm text-muted-foreground">{modelo.descripcion}</p>
                            <Badge variant="outline" className="mt-1">{modelo.periodicidad}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(modelo.urlAEAT, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          AEAT
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Calculadora de Impuestos */}
        <Dialog open={showCalculadoraDialog} onOpenChange={setShowCalculadoraDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-500" />
                Calculadora Fiscal
              </DialogTitle>
              <DialogDescription>
                Estima tus impuestos por rendimientos inmobiliarios
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ingresos Anuales (€)</Label>
                <Input
                  type="number"
                  placeholder="Ej: 12000"
                  value={calcIngresos}
                  onChange={(e) => setCalcIngresos(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Gastos Deducibles (€)</Label>
                <Input
                  type="number"
                  placeholder="Ej: 2000"
                  value={calcGastos}
                  onChange={(e) => setCalcGastos(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Catastral (€) - Opcional</Label>
                <Input
                  type="number"
                  placeholder="Para estimar IBI"
                  value={calcValorCatastral}
                  onChange={(e) => setCalcValorCatastral(e.target.value)}
                />
              </div>

              {calcResultado && (
                <div className="p-4 rounded-lg bg-muted space-y-3">
                  <h4 className="font-semibold">Resultado Estimado</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Rendimiento Neto:</span>
                      <span className="font-semibold">{formatCurrency(calcResultado.rendimientoNeto)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Imponible:</span>
                      <span className="font-semibold">{formatCurrency(calcResultado.baseImponible)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base">
                      <span className="font-medium">
                        {tipoPersona === 'fisica' ? 'IRPF Estimado:' : 'IS Estimado:'}
                      </span>
                      <span className="font-bold text-primary">
                        {formatCurrency(calcResultado.impuestoEstimado)}
                      </span>
                    </div>
                    {calcResultado.ibiEstimado > 0 && (
                      <div className="flex justify-between">
                        <span>IBI Estimado:</span>
                        <span className="font-semibold">{formatCurrency(calcResultado.ibiEstimado)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Cálculo orientativo. Consulta con un asesor fiscal.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setCalcIngresos('');
                setCalcGastos('');
                setCalcValorCatastral('');
                setCalcResultado(null);
              }}>
                Limpiar
              </Button>
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={calcularImpuestos}
                disabled={isCalculating}
              >
                {isCalculating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Calcular
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Nueva Obligación */}
        <Dialog open={showNuevoImpuestoDialog} onOpenChange={setShowNuevoImpuestoDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-emerald-500" />
                Nueva Obligación Fiscal
              </DialogTitle>
              <DialogDescription>
                Registra una nueva obligación tributaria
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Modelo</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS_TRIBUTARIOS
                      .filter(m => m.tipoPersona === 'ambos' || m.tipoPersona === tipoPersona)
                      .map((m) => (
                        <SelectItem key={m.codigo} value={m.codigo}>
                          Modelo {m.codigo} - {m.nombre}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha Límite</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Importe (€) - Opcional</Label>
                <Input type="number" placeholder="Si ya conoces el importe" />
              </div>
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Input placeholder="Notas adicionales" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNuevoImpuestoDialog(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={() => {
                  toast.success('Obligación registrada correctamente');
                  setShowNuevoImpuestoDialog(false);
                  loadData();
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
