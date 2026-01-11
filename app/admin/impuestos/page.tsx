'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, addDays, isBefore, isAfter, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calculator,
  Receipt,
  FileText,
  Calendar as CalendarIcon,
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
  Trash2,
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
import { cn } from '@/lib/utils';

// Tipos
interface TipoPersona {
  tipo: 'fisica' | 'juridica';
  nombre: string;
  nif: string;
  regimen?: string;
}

interface Impuesto {
  id: string;
  nombre: string;
  modelo: string;
  descripcion: string;
  periodicidad: 'mensual' | 'trimestral' | 'anual';
  tipoPersona: 'fisica' | 'juridica' | 'ambos';
  proximoVencimiento: Date;
  estado: 'pendiente' | 'en_proceso' | 'presentado' | 'pagado';
  importeEstimado?: number;
  importeReal?: number;
  fechaPresentacion?: Date;
  fechaPago?: Date;
  observaciones?: string;
}

interface InmuebleImpuestos {
  id: string;
  direccion: string;
  tipo: 'vivienda' | 'local' | 'garaje' | 'trastero' | 'oficina';
  referenciaCatastral: string;
  valorCatastral: number;
  ibi: {
    importe: number;
    fechaVencimiento: Date;
    estado: 'pendiente' | 'pagado';
  };
  plusvalia?: {
    importe: number;
    estado: 'pendiente' | 'liquidada';
  };
}

interface ResumenFiscal {
  ejercicio: number;
  ingresosBrutos: number;
  gastosDeducibles: number;
  baseImponible: number;
  impuestoEstimado: number;
  retencionesYPagosACuenta: number;
  resultadoLiquidacion: number;
}

// Datos de ejemplo - Modelos fiscales
const MODELOS_FISCALES = [
  // Personas Físicas
  {
    id: 'modelo-100',
    nombre: 'IRPF - Declaración Anual',
    modelo: '100',
    descripcion: 'Declaración anual del Impuesto sobre la Renta de las Personas Físicas',
    periodicidad: 'anual' as const,
    tipoPersona: 'fisica' as const,
    mesVencimiento: 6, // Junio
    diaVencimiento: 30,
  },
  {
    id: 'modelo-115',
    nombre: 'Retenciones Alquileres',
    modelo: '115',
    descripcion: 'Retenciones e ingresos a cuenta sobre rentas o rendimientos de arrendamiento',
    periodicidad: 'trimestral' as const,
    tipoPersona: 'ambos' as const,
    diasVencimiento: 20, // Del mes siguiente al trimestre
  },
  {
    id: 'modelo-180',
    nombre: 'Resumen Anual Retenciones',
    modelo: '180',
    descripcion: 'Declaración informativa de retenciones sobre arrendamientos',
    periodicidad: 'anual' as const,
    tipoPersona: 'ambos' as const,
    mesVencimiento: 1, // Enero
    diaVencimiento: 31,
  },
  // Personas Jurídicas
  {
    id: 'modelo-200',
    nombre: 'Impuesto de Sociedades',
    modelo: '200',
    descripcion: 'Declaración del Impuesto sobre Sociedades',
    periodicidad: 'anual' as const,
    tipoPersona: 'juridica' as const,
    mesVencimiento: 7, // Julio (25 días desde cierre ejercicio)
    diaVencimiento: 25,
  },
  {
    id: 'modelo-202',
    nombre: 'Pago Fraccionado Sociedades',
    modelo: '202',
    descripcion: 'Pago fraccionado del Impuesto sobre Sociedades',
    periodicidad: 'trimestral' as const,
    tipoPersona: 'juridica' as const,
    diasVencimiento: 20,
  },
  // IVA
  {
    id: 'modelo-303',
    nombre: 'IVA Trimestral',
    modelo: '303',
    descripcion: 'Autoliquidación trimestral del IVA',
    periodicidad: 'trimestral' as const,
    tipoPersona: 'ambos' as const,
    diasVencimiento: 20,
  },
  {
    id: 'modelo-390',
    nombre: 'Resumen Anual IVA',
    modelo: '390',
    descripcion: 'Declaración resumen anual del IVA',
    periodicidad: 'anual' as const,
    tipoPersona: 'ambos' as const,
    mesVencimiento: 1,
    diaVencimiento: 30,
  },
  // Otros
  {
    id: 'modelo-347',
    nombre: 'Operaciones con Terceros',
    modelo: '347',
    descripcion: 'Declaración anual de operaciones con terceros (> 3.005,06€)',
    periodicidad: 'anual' as const,
    tipoPersona: 'ambos' as const,
    mesVencimiento: 2, // Febrero
    diaVencimiento: 28,
  },
];

// Datos de ejemplo - Inmuebles
const SAMPLE_INMUEBLES: InmuebleImpuestos[] = [
  {
    id: '1',
    direccion: 'Calle Mayor 15, 3ºA - Madrid',
    tipo: 'vivienda',
    referenciaCatastral: '1234567AB1234N0001AB',
    valorCatastral: 185000,
    ibi: {
      importe: 892.45,
      fechaVencimiento: new Date('2026-10-15'),
      estado: 'pendiente',
    },
  },
  {
    id: '2',
    direccion: 'Av. de la Constitución 42, Local B - Barcelona',
    tipo: 'local',
    referenciaCatastral: '9876543CD5678N0002CD',
    valorCatastral: 320000,
    ibi: {
      importe: 1543.20,
      fechaVencimiento: new Date('2026-09-30'),
      estado: 'pendiente',
    },
  },
  {
    id: '3',
    direccion: 'Paseo de Gracia 88, 5ºB - Barcelona',
    tipo: 'vivienda',
    referenciaCatastral: '5432109EF9012N0003EF',
    valorCatastral: 450000,
    ibi: {
      importe: 2156.80,
      fechaVencimiento: new Date('2026-09-30'),
      estado: 'pagado',
    },
  },
];

// Datos de ejemplo - Impuestos pendientes
const SAMPLE_IMPUESTOS: Impuesto[] = [
  {
    id: '1',
    nombre: 'IVA Trimestral Q4 2025',
    modelo: '303',
    descripcion: 'Autoliquidación IVA 4º trimestre',
    periodicidad: 'trimestral',
    tipoPersona: 'ambos',
    proximoVencimiento: new Date('2026-01-20'),
    estado: 'presentado',
    importeEstimado: 3450,
    importeReal: 3420,
    fechaPresentacion: new Date('2026-01-18'),
  },
  {
    id: '2',
    nombre: 'Retenciones Alquileres Q4 2025',
    modelo: '115',
    descripcion: 'Retenciones alquileres 4º trimestre',
    periodicidad: 'trimestral',
    tipoPersona: 'ambos',
    proximoVencimiento: new Date('2026-01-20'),
    estado: 'pagado',
    importeEstimado: 1200,
    importeReal: 1200,
    fechaPresentacion: new Date('2026-01-15'),
    fechaPago: new Date('2026-01-15'),
  },
  {
    id: '3',
    nombre: 'IVA Trimestral Q1 2026',
    modelo: '303',
    descripcion: 'Autoliquidación IVA 1er trimestre',
    periodicidad: 'trimestral',
    tipoPersona: 'ambos',
    proximoVencimiento: new Date('2026-04-20'),
    estado: 'pendiente',
    importeEstimado: 2850,
  },
  {
    id: '4',
    nombre: 'Retenciones Alquileres Q1 2026',
    modelo: '115',
    descripcion: 'Retenciones alquileres 1er trimestre',
    periodicidad: 'trimestral',
    tipoPersona: 'ambos',
    proximoVencimiento: new Date('2026-04-20'),
    estado: 'pendiente',
    importeEstimado: 1350,
  },
  {
    id: '5',
    nombre: 'Resumen Anual IVA 2025',
    modelo: '390',
    descripcion: 'Declaración resumen anual IVA',
    periodicidad: 'anual',
    tipoPersona: 'ambos',
    proximoVencimiento: new Date('2026-01-30'),
    estado: 'en_proceso',
    importeEstimado: 0,
  },
  {
    id: '6',
    nombre: 'Operaciones Terceros 2025',
    modelo: '347',
    descripcion: 'Declaración operaciones con terceros',
    periodicidad: 'anual',
    tipoPersona: 'ambos',
    proximoVencimiento: new Date('2026-02-28'),
    estado: 'pendiente',
  },
  {
    id: '7',
    nombre: 'IRPF 2025',
    modelo: '100',
    descripcion: 'Declaración renta personas físicas',
    periodicidad: 'anual',
    tipoPersona: 'fisica',
    proximoVencimiento: new Date('2026-06-30'),
    estado: 'pendiente',
    importeEstimado: 4500,
  },
];

// Helpers
const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'pendiente':
      return <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50"><Clock className="h-3 w-3 mr-1" /> Pendiente</Badge>;
    case 'en_proceso':
      return <Badge variant="outline" className="text-blue-600 border-blue-400 bg-blue-50"><RefreshCw className="h-3 w-3 mr-1" /> En Proceso</Badge>;
    case 'presentado':
      return <Badge variant="outline" className="text-purple-600 border-purple-400 bg-purple-50"><FileCheck className="h-3 w-3 mr-1" /> Presentado</Badge>;
    case 'pagado':
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Pagado</Badge>;
    default:
      return <Badge variant="secondary">{estado}</Badge>;
  }
};

const getDiasRestantes = (fecha: Date) => {
  const hoy = new Date();
  const dias = differenceInDays(fecha, hoy);
  return dias;
};

const getUrgenciaBadge = (dias: number) => {
  if (dias < 0) {
    return <Badge variant="destructive">Vencido</Badge>;
  } else if (dias <= 7) {
    return <Badge variant="destructive">Urgente ({dias} días)</Badge>;
  } else if (dias <= 15) {
    return <Badge variant="outline" className="text-amber-600 border-amber-400">{dias} días</Badge>;
  } else if (dias <= 30) {
    return <Badge variant="outline" className="text-blue-600 border-blue-400">{dias} días</Badge>;
  }
  return <Badge variant="secondary">{dias} días</Badge>;
};

export default function ImpuestosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('resumen');
  const [tipoPersona, setTipoPersona] = useState<'fisica' | 'juridica'>('fisica');
  const [impuestos, setImpuestos] = useState<Impuesto[]>(SAMPLE_IMPUESTOS);
  const [inmuebles, setInmuebles] = useState<InmuebleImpuestos[]>(SAMPLE_INMUEBLES);
  const [showCalculadoraDialog, setShowCalculadoraDialog] = useState(false);
  const [showNuevoImpuestoDialog, setShowNuevoImpuestoDialog] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [ejercicioActual] = useState(2026);

  // Cálculos resumen
  const resumenFiscal: ResumenFiscal = {
    ejercicio: ejercicioActual,
    ingresosBrutos: 85000,
    gastosDeducibles: 23500,
    baseImponible: 61500,
    impuestoEstimado: 12300,
    retencionesYPagosACuenta: 8500,
    resultadoLiquidacion: 3800,
  };

  const impuestosPendientes = impuestos.filter(i => i.estado === 'pendiente' || i.estado === 'en_proceso');
  const impuestosProximos = impuestos
    .filter(i => i.estado === 'pendiente')
    .sort((a, b) => a.proximoVencimiento.getTime() - b.proximoVencimiento.getTime())
    .slice(0, 5);
  
  const totalPendiente = impuestos
    .filter(i => i.estado === 'pendiente' || i.estado === 'en_proceso')
    .reduce((sum, i) => sum + (i.importeEstimado || 0), 0);

  const totalIBI = inmuebles.reduce((sum, i) => sum + (i.ibi.estado === 'pendiente' ? i.ibi.importe : 0), 0);

  // Verificar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
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
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Gestión de Impuestos</h1>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Ejercicio {ejercicioActual}
                </Badge>
              </div>
              <p className="text-muted-foreground">Liquidación fiscal para personas físicas y jurídicas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={tipoPersona} onValueChange={(v) => setTipoPersona(v as 'fisica' | 'juridica')}>
              <SelectTrigger className="w-[200px]">
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
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-500"
              onClick={() => setShowNuevoImpuestoDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Impuestos Pendientes</p>
                  <p className="text-2xl font-bold text-amber-600">{impuestosPendientes.length}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Estimado</p>
                  <p className="text-2xl font-bold">{totalPendiente.toLocaleString('es-ES')}€</p>
                </div>
                <Euro className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">IBI Pendiente</p>
                  <p className="text-2xl font-bold">{totalIBI.toLocaleString('es-ES')}€</p>
                </div>
                <Home className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Próximo Vencimiento</p>
                  <p className="text-2xl font-bold text-red-600">
                    {impuestosProximos.length > 0 
                      ? getDiasRestantes(impuestosProximos[0].proximoVencimiento) 
                      : '-'} días
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="resumen" className="gap-2">
              <PieChart className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="obligaciones" className="gap-2">
              <FileText className="h-4 w-4" />
              Obligaciones
            </TabsTrigger>
            <TabsTrigger value="inmuebles" className="gap-2">
              <Building2 className="h-4 w-4" />
              Inmuebles
            </TabsTrigger>
            <TabsTrigger value="calendario" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="modelos" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Modelos
            </TabsTrigger>
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="resumen" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Resumen Fiscal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                    Resumen Fiscal {ejercicioActual}
                  </CardTitle>
                  <CardDescription>
                    {tipoPersona === 'fisica' ? 'IRPF - Rendimientos inmobiliarios' : 'Impuesto de Sociedades'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Ingresos brutos</span>
                      <span className="font-semibold text-green-600">+{resumenFiscal.ingresosBrutos.toLocaleString('es-ES')}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Gastos deducibles</span>
                      <span className="font-semibold text-red-600">-{resumenFiscal.gastosDeducibles.toLocaleString('es-ES')}€</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Base imponible</span>
                      <span className="font-bold">{resumenFiscal.baseImponible.toLocaleString('es-ES')}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Cuota íntegra ({tipoPersona === 'fisica' ? 'IRPF 20%' : 'IS 25%'})
                      </span>
                      <span className="font-semibold">{resumenFiscal.impuestoEstimado.toLocaleString('es-ES')}€</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Retenciones y pagos a cuenta</span>
                      <span className="font-semibold text-green-600">-{resumenFiscal.retencionesYPagosACuenta.toLocaleString('es-ES')}€</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="font-bold">Resultado liquidación</span>
                      <span className={cn(
                        "text-xl font-bold",
                        resumenFiscal.resultadoLiquidacion > 0 ? "text-red-600" : "text-green-600"
                      )}>
                        {resumenFiscal.resultadoLiquidacion > 0 ? '+' : ''}{resumenFiscal.resultadoLiquidacion.toLocaleString('es-ES')}€
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Próximos Vencimientos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Próximos Vencimientos
                  </CardTitle>
                  <CardDescription>Obligaciones fiscales pendientes</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {impuestosProximos.map((impuesto) => {
                        const dias = getDiasRestantes(impuesto.proximoVencimiento);
                        return (
                          <div 
                            key={impuesto.id} 
                            className={cn(
                              "p-3 rounded-lg border",
                              dias <= 7 ? "border-red-200 bg-red-50" : 
                              dias <= 15 ? "border-amber-200 bg-amber-50" : "bg-card"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Mod. {impuesto.modelo}</Badge>
                                <span className="font-medium text-sm">{impuesto.nombre}</span>
                              </div>
                              {getUrgenciaBadge(dias)}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Vence: {format(impuesto.proximoVencimiento, "d 'de' MMMM", { locale: es })}
                              </span>
                              {impuesto.importeEstimado && (
                                <span className="font-semibold">{impuesto.importeEstimado.toLocaleString('es-ES')}€</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Guía de Impuestos PropTech */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-500" />
                  Guía de Impuestos Inmobiliarios
                </CardTitle>
                <CardDescription>Principales obligaciones fiscales para {tipoPersona === 'fisica' ? 'propietarios particulares' : 'empresas inmobiliarias'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tipoPersona === 'fisica' ? (
                    <>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-violet-600" />
                          </div>
                          <h4 className="font-semibold">IRPF</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Rendimientos de capital inmobiliario por alquileres. Tipo marginal según tramo (19%-47%).
                        </p>
                        <Badge variant="outline" className="mt-2">Modelo 100</Badge>
                      </div>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Percent className="h-4 w-4 text-emerald-600" />
                          </div>
                          <h4 className="font-semibold">Retenciones (19%)</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Retención aplicable en alquileres a empresas o autónomos.
                        </p>
                        <Badge variant="outline" className="mt-2">Modelo 115/180</Badge>
                      </div>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Home className="h-4 w-4 text-blue-600" />
                          </div>
                          <h4 className="font-semibold">IBI</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Impuesto municipal sobre bienes inmuebles. Varía según municipio (0.4%-1.3% valor catastral).
                        </p>
                        <Badge variant="outline" className="mt-2">Municipal</Badge>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                            <Briefcase className="h-4 w-4 text-violet-600" />
                          </div>
                          <h4 className="font-semibold">Impuesto Sociedades</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tipo general 25%. Empresas nueva creación: 15% primeros 2 años con beneficios.
                        </p>
                        <Badge variant="outline" className="mt-2">Modelo 200/202</Badge>
                      </div>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Receipt className="h-4 w-4 text-emerald-600" />
                          </div>
                          <h4 className="font-semibold">IVA</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          21% general, 10% vivienda nueva. Alquiler vivienda exento. Local comercial sujeto.
                        </p>
                        <Badge variant="outline" className="mt-2">Modelo 303/390</Badge>
                      </div>
                      <div className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Scale className="h-4 w-4 text-amber-600" />
                          </div>
                          <h4 className="font-semibold">IAE</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Exento si cifra negocios &lt; 1M€. Epígrafes 861 (alquiler locales) y 862 (viviendas).
                        </p>
                        <Badge variant="outline" className="mt-2">Municipal</Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Obligaciones */}
          <TabsContent value="obligaciones" className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_proceso">En proceso</SelectItem>
                    <SelectItem value="presentado">Presentado</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>

            <div className="space-y-4">
              {impuestos
                .filter(i => filtroEstado === 'todos' || i.estado === filtroEstado)
                .filter(i => i.tipoPersona === 'ambos' || i.tipoPersona === tipoPersona)
                .map((impuesto) => {
                  const dias = getDiasRestantes(impuesto.proximoVencimiento);
                  return (
                    <Card key={impuesto.id}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center",
                              impuesto.estado === 'pagado' ? "bg-green-100" :
                              impuesto.estado === 'presentado' ? "bg-purple-100" :
                              dias <= 7 ? "bg-red-100" : "bg-amber-100"
                            )}>
                              <FileText className={cn(
                                "h-6 w-6",
                                impuesto.estado === 'pagado' ? "text-green-600" :
                                impuesto.estado === 'presentado' ? "text-purple-600" :
                                dias <= 7 ? "text-red-600" : "text-amber-600"
                              )} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{impuesto.nombre}</h3>
                                <Badge variant="outline">Mod. {impuesto.modelo}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{impuesto.descripcion}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  Vence: {format(impuesto.proximoVencimiento, "d MMM yyyy", { locale: es })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {impuesto.periodicidad}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              {impuesto.importeEstimado && (
                                <p className="text-lg font-bold">
                                  {impuesto.importeReal || impuesto.importeEstimado}€
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                {getEstadoBadge(impuesto.estado)}
                                {impuesto.estado === 'pendiente' && getUrgenciaBadge(dias)}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                              {impuesto.estado === 'pendiente' && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                  <Send className="h-4 w-4 mr-1" />
                                  Presentar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          {/* Tab: Inmuebles */}
          <TabsContent value="inmuebles" className="space-y-6">
            <div className="grid gap-4">
              {inmuebles.map((inmueble) => (
                <Card key={inmueble.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          {inmueble.tipo === 'vivienda' ? <Home className="h-6 w-6 text-blue-600" /> :
                           inmueble.tipo === 'local' ? <Landmark className="h-6 w-6 text-blue-600" /> :
                           <Building2 className="h-6 w-6 text-blue-600" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">{inmueble.direccion}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="capitalize">{inmueble.tipo}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Ref. Catastral: {inmueble.referenciaCatastral}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Valor catastral: {inmueble.valorCatastral.toLocaleString('es-ES')}€
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* IBI */}
                        <div className="text-center p-4 rounded-lg bg-muted/50 min-w-[140px]">
                          <p className="text-xs text-muted-foreground mb-1">IBI {ejercicioActual}</p>
                          <p className="text-lg font-bold">{inmueble.ibi.importe.toLocaleString('es-ES')}€</p>
                          {getEstadoBadge(inmueble.ibi.estado)}
                          <p className="text-xs text-muted-foreground mt-1">
                            Vence: {format(inmueble.ibi.fechaVencimiento, "d MMM", { locale: es })}
                          </p>
                        </div>
                        {/* Acciones */}
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver detalles
                          </Button>
                          {inmueble.ibi.estado === 'pendiente' && (
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pagar IBI
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Resumen IBI */}
            <Card>
              <CardHeader>
                <CardTitle>Resumen IBI {ejercicioActual}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">Total Inmuebles</p>
                    <p className="text-2xl font-bold">{inmuebles.length}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">Valor Catastral Total</p>
                    <p className="text-2xl font-bold">
                      {inmuebles.reduce((sum, i) => sum + i.valorCatastral, 0).toLocaleString('es-ES')}€
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 text-center">
                    <p className="text-sm text-muted-foreground">IBI Pendiente</p>
                    <p className="text-2xl font-bold text-amber-600">{totalIBI.toLocaleString('es-ES')}€</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 text-center">
                    <p className="text-sm text-muted-foreground">IBI Pagado</p>
                    <p className="text-2xl font-bold text-green-600">
                      {inmuebles
                        .filter(i => i.ibi.estado === 'pagado')
                        .reduce((sum, i) => sum + i.ibi.importe, 0)
                        .toLocaleString('es-ES')}€
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Calendario */}
          <TabsContent value="calendario" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-blue-500" />
                  Calendario Fiscal {ejercicioActual}
                </CardTitle>
                <CardDescription>Fechas clave de presentación y pago de impuestos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* Q1 */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold text-lg mb-3">1er Trimestre</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>20 Enero</span>
                        <Badge variant="outline">303, 115</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>30 Enero</span>
                        <Badge variant="outline">390, 180</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>28 Febrero</span>
                        <Badge variant="outline">347</Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q2 */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold text-lg mb-3">2º Trimestre</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>20 Abril</span>
                        <Badge variant="outline">303, 115, 202</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>30 Junio</span>
                        <Badge variant="outline">100 (IRPF)</Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q3 */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold text-lg mb-3">3er Trimestre</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>20 Julio</span>
                        <Badge variant="outline">303, 115, 202</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>25 Julio</span>
                        <Badge variant="outline">200 (IS)</Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Q4 */}
                  <div className="p-4 rounded-lg border">
                    <h4 className="font-semibold text-lg mb-3">4º Trimestre</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>20 Octubre</span>
                        <Badge variant="outline">303, 115, 202</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Variable</span>
                        <Badge variant="outline">IBI Municipal</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recordatorios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-amber-500" />
                  Recordatorios Activos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {impuestosProximos.slice(0, 3).map((impuesto) => {
                    const dias = getDiasRestantes(impuesto.proximoVencimiento);
                    return (
                      <div 
                        key={impuesto.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className={cn(
                            "h-5 w-5",
                            dias <= 7 ? "text-red-500" : "text-amber-500"
                          )} />
                          <div>
                            <p className="font-medium">{impuesto.nombre}</p>
                            <p className="text-sm text-muted-foreground">
                              Vence el {format(impuesto.proximoVencimiento, "d 'de' MMMM", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getUrgenciaBadge(dias)}
                          <Button size="sm" variant="outline">
                            Configurar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Modelos */}
          <TabsContent value="modelos" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {MODELOS_FISCALES
                .filter(m => m.tipoPersona === 'ambos' || m.tipoPersona === tipoPersona)
                .map((modelo) => (
                  <Card key={modelo.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-lg font-bold">
                          {modelo.modelo}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {modelo.periodicidad}
                        </Badge>
                      </div>
                      <CardTitle className="text-base">{modelo.nombre}</CardTitle>
                      <CardDescription className="text-xs">{modelo.descripcion}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {modelo.tipoPersona === 'fisica' ? '👤 P. Física' : 
                           modelo.tipoPersona === 'juridica' ? '🏢 P. Jurídica' : '👥 Ambos'}
                        </Badge>
                        <Button size="sm" variant="outline" asChild>
                          <a 
                            href={`https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G${modelo.modelo.padStart(3, '0')}.shtml`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            AEAT
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Enlace AEAT */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center">
                      <Landmark className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Sede Electrónica AEAT</h3>
                      <p className="text-sm text-muted-foreground">
                        Accede a todos los modelos y presentaciones online
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <a 
                      href="https://sede.agenciatributaria.gob.es"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Acceder a AEAT
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog: Calculadora de Impuestos */}
        <Dialog open={showCalculadoraDialog} onOpenChange={setShowCalculadoraDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-emerald-500" />
                Calculadora de Impuestos Inmobiliarios
              </DialogTitle>
              <DialogDescription>
                Estima tus obligaciones fiscales por rendimientos de alquiler
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Ingresos anuales por alquiler</Label>
                  <Input type="number" placeholder="12000" defaultValue="12000" />
                </div>
                <div className="space-y-2">
                  <Label>Gastos deducibles</Label>
                  <Input type="number" placeholder="3000" defaultValue="3000" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Tipo de inmueble</Label>
                <Select defaultValue="vivienda">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vivienda">Vivienda (reducción 60%)</SelectItem>
                    <SelectItem value="local">Local comercial</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-3">Resultado Estimado</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rendimiento neto</span>
                    <span className="font-semibold">9.000€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reducción vivienda (60%)</span>
                    <span className="font-semibold text-green-600">-5.400€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base imponible</span>
                    <span className="font-semibold">3.600€</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base">
                    <span className="font-semibold">Cuota IRPF (19%)</span>
                    <span className="font-bold text-emerald-600">684€</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    Este cálculo es orientativo. Consulta con un asesor fiscal para una liquidación exacta.
                    Los tipos impositivos pueden variar según tu situación personal y comunidad autónoma.
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCalculadoraDialog(false)}>
                Cerrar
              </Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500">
                <Download className="h-4 w-4 mr-2" />
                Descargar Informe
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Nuevo Impuesto */}
        <Dialog open={showNuevoImpuestoDialog} onOpenChange={setShowNuevoImpuestoDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Obligación Fiscal</DialogTitle>
              <DialogDescription>
                Añade un impuesto o modelo fiscal para seguimiento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Modelo fiscal</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS_FISCALES.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        Mod. {m.modelo} - {m.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Periodo</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="q1">1T 2026 (Ene-Mar)</SelectItem>
                    <SelectItem value="q2">2T 2026 (Abr-Jun)</SelectItem>
                    <SelectItem value="q3">3T 2026 (Jul-Sep)</SelectItem>
                    <SelectItem value="q4">4T 2026 (Oct-Dic)</SelectItem>
                    <SelectItem value="anual">Anual 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Importe estimado (€)</Label>
                <Input type="number" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea placeholder="Notas adicionales..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNuevoImpuestoDialog(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-emerald-500 to-teal-500"
                onClick={() => {
                  toast.success('Obligación fiscal registrada');
                  setShowNuevoImpuestoDialog(false);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
