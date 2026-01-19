'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Sun,
  Zap,
  Battery,
  TrendingUp,
  TrendingDown,
  Euro,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Plus,
  RefreshCw,
  Settings,
  BarChart3,
  LineChart,
  Activity,
  Gauge,
  Building2,
  Wrench,
  Clock,
  DollarSign,
  Bolt,
} from 'lucide-react';
import { toast } from 'sonner';

interface InstalacionSolar {
  id: string;
  propiedad: string;
  propiedadId: string;
  capacidadKw: number;
  numeroPaneles: number;
  fechaInstalacion: string;
  estado: 'operativo' | 'mantenimiento' | 'error' | 'offline';
  produccionHoy: number; // kWh
  produccionMes: number; // kWh
  produccionAnio: number; // kWh
  eficiencia: number; // %
  ultimaLectura: string;
  inversor: string;
  garantiaHasta: string;
}

interface ProduccionDiaria {
  fecha: string;
  produccion: number; // kWh
  consumo: number; // kWh
  excedente: number; // kWh
  autoconsumo: number; // %
  horasPico: number;
}

interface Mantenimiento {
  id: string;
  instalacionId: string;
  instalacionNombre: string;
  tipo: 'limpieza' | 'revision' | 'reparacion' | 'sustitucion';
  fecha: string;
  estado: 'programado' | 'completado' | 'pendiente';
  descripcion: string;
  costo?: number;
  tecnico?: string;
}

interface ROIData {
  instalacionId: string;
  inversionInicial: number;
  ahorroMensual: number;
  ahorroAcumulado: number;
  ventaExcedentes: number;
  tiempoAmortizacion: number; // meses
  roi: number; // %
  co2Evitado: number; // kg
}

export default function EnergiaSolarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('instalaciones');
  const [periodoFilter, setPeriodoFilter] = useState('mes');

  const [instalaciones, setInstalaciones] = useState<InstalacionSolar[]>([]);
  const [produccion, setProduccion] = useState<ProduccionDiaria[]>([]);
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [roiData, setRoiData] = useState<ROIData[]>([]);

  const [showAddDialog, setShowAddDialog] = useState(false);

  // KPIs calculados
  const totalCapacidad = instalaciones.reduce((acc, i) => acc + i.capacidadKw, 0);
  const produccionHoyTotal = instalaciones.reduce((acc, i) => acc + i.produccionHoy, 0);
  const produccionMesTotal = instalaciones.reduce((acc, i) => acc + i.produccionMes, 0);
  const eficienciaPromedio = instalaciones.length > 0 
    ? instalaciones.reduce((acc, i) => acc + i.eficiencia, 0) / instalaciones.length 
    : 0;
  const ahorroMensualTotal = roiData.reduce((acc, r) => acc + r.ahorroMensual, 0);
  const co2EvitadoTotal = roiData.reduce((acc, r) => acc + r.co2Evitado, 0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [instRes, prodRes, mantRes, roiRes] = await Promise.all([
        fetch('/api/energia-solar/instalaciones'),
        fetch(`/api/energia-solar/produccion?periodo=${periodoFilter}`),
        fetch('/api/energia-solar/mantenimientos'),
        fetch('/api/energia-solar/roi'),
      ]);

      const instData = await instRes.json();
      const prodData = await prodRes.json();
      const mantData = await mantRes.json();
      const roiData = await roiRes.json();

      if (instData.success) setInstalaciones(instData.data || []);
      if (prodData.success) setProduccion(prodData.data || []);
      if (mantData.success) setMantenimientos(mantData.data || []);
      if (roiData.success) setRoiData(roiData.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos de energía solar');
    } finally {
      setLoading(false);
    }
  };

  const programarMantenimiento = async (instalacionId: string) => {
    try {
      const res = await fetch('/api/energia-solar/mantenimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instalacionId,
          tipo: 'revision',
          fecha: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          descripcion: 'Revisión programada',
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Mantenimiento programado');
        loadData();
      } else {
        toast.error(data.error || 'Error al programar mantenimiento');
      }
    } catch (error) {
      toast.error('Error al programar mantenimiento');
    }
  };
  
  const [formInstalacion, setFormInstalacion] = useState({
    propiedadId: '',
    capacidadKw: '',
    numeroPaneles: '',
    fechaInstalacion: '',
    inversor: '',
    inversionInicial: '',
  });
  
  const crearInstalacion = async () => {
    if (!formInstalacion.propiedadId || !formInstalacion.capacidadKw) {
      toast.error('Completa los campos obligatorios');
      return;
    }
    
    try {
      const res = await fetch('/api/energia-solar/instalaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propiedadId: formInstalacion.propiedadId,
          capacidadKw: parseFloat(formInstalacion.capacidadKw),
          numeroPaneles: parseInt(formInstalacion.numeroPaneles) || undefined,
          fechaInstalacion: formInstalacion.fechaInstalacion || undefined,
          inversor: formInstalacion.inversor || undefined,
          inversionInicial: parseFloat(formInstalacion.inversionInicial) || undefined,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Instalación registrada exitosamente');
        setShowAddDialog(false);
        setFormInstalacion({
          propiedadId: '',
          capacidadKw: '',
          numeroPaneles: '',
          fechaInstalacion: '',
          inversor: '',
          inversionInicial: '',
        });
        loadData();
      } else {
        toast.error(data.error || 'Error al registrar instalación');
      }
    } catch (error) {
      toast.error('Error al registrar instalación');
    }
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      operativo: 'bg-green-100 text-green-800',
      mantenimiento: 'bg-amber-100 text-amber-800',
      error: 'bg-red-100 text-red-800',
      offline: 'bg-gray-100 text-gray-800',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos de energía solar...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sun className="h-8 w-8 text-amber-500" />
                Energía Solar
              </h1>
              <p className="text-muted-foreground mt-1">
                Monitoreo y gestión de instalaciones fotovoltaicas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Hoy</SelectItem>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mes</SelectItem>
                <SelectItem value="anio">Este Año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Instalación
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-700">Capacidad Total</span>
                <Bolt className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold text-amber-800">{totalCapacidad} kW</p>
              <p className="text-xs text-amber-600">{instalaciones.length} instalaciones</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-green-700">Producción Hoy</span>
                <Zap className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-800">{produccionHoyTotal} kWh</p>
              <p className="text-xs text-green-600">tiempo real</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-700">Producción Mes</span>
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-800">{produccionMesTotal} kWh</p>
              <p className="text-xs text-blue-600">acumulado</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-purple-700">Eficiencia</span>
                <Gauge className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-800">{eficienciaPromedio.toFixed(1)}%</p>
              <p className="text-xs text-purple-600">promedio</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-emerald-700">Ahorro Mensual</span>
                <Euro className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-800">{ahorroMensualTotal}€</p>
              <p className="text-xs text-emerald-600">estimado</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-teal-700">CO₂ Evitado</span>
                <Leaf className="h-4 w-4 text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-teal-800">{co2EvitadoTotal} kg</p>
              <p className="text-xs text-teal-600">este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="instalaciones">
              <Sun className="h-4 w-4 mr-2" />
              Instalaciones
            </TabsTrigger>
            <TabsTrigger value="produccion">
              <Activity className="h-4 w-4 mr-2" />
              Producción
            </TabsTrigger>
            <TabsTrigger value="roi">
              <TrendingUp className="h-4 w-4 mr-2" />
              ROI y Ahorro
            </TabsTrigger>
            <TabsTrigger value="mantenimiento">
              <Wrench className="h-4 w-4 mr-2" />
              Mantenimiento
            </TabsTrigger>
            <TabsTrigger value="excedentes">
              <DollarSign className="h-4 w-4 mr-2" />
              Excedentes
            </TabsTrigger>
          </TabsList>

          {/* Instalaciones */}
          <TabsContent value="instalaciones" className="space-y-4">
            {instalaciones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sun className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay instalaciones solares registradas</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Registra tus instalaciones fotovoltaicas para monitorear su producción, ahorro y mantenimiento.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primera Instalación
                  </Button>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Zap className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <h4 className="font-medium">Monitoreo en Tiempo Real</h4>
                        <p className="text-xs text-muted-foreground">Producción y consumo al instante</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Euro className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <h4 className="font-medium">Cálculo de Ahorro</h4>
                        <p className="text-xs text-muted-foreground">ROI y amortización automática</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Leaf className="h-8 w-8 text-teal-500 mx-auto mb-2" />
                        <h4 className="font-medium">Impacto Ambiental</h4>
                        <p className="text-xs text-muted-foreground">CO₂ evitado y sostenibilidad</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {instalaciones.map((instalacion) => (
                  <Card key={instalacion.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Sun className="h-5 w-5 text-amber-500" />
                            {instalacion.propiedad}
                          </CardTitle>
                          <CardDescription>
                            {instalacion.capacidadKw} kW • {instalacion.numeroPaneles} paneles
                          </CardDescription>
                        </div>
                        <Badge className={getEstadoColor(instalacion.estado)}>
                          {instalacion.estado}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-2 bg-amber-50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Hoy</p>
                          <p className="text-lg font-bold text-amber-700">{instalacion.produccionHoy} kWh</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Este Mes</p>
                          <p className="text-lg font-bold text-green-700">{instalacion.produccionMes} kWh</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-muted-foreground">Eficiencia</p>
                          <p className="text-lg font-bold text-blue-700">{instalacion.eficiencia}%</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Inversor</span>
                          <span>{instalacion.inversor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Instalación</span>
                          <span>{new Date(instalacion.fechaInstalacion).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Garantía hasta</span>
                          <span>{new Date(instalacion.garantiaHasta).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Activity className="h-3 w-3 mr-1" />
                          Ver Detalle
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => programarMantenimiento(instalacion.id)}>
                          <Wrench className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Producción */}
          <TabsContent value="produccion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Producción Energética</CardTitle>
                <CardDescription>Histórico de generación y consumo</CardDescription>
              </CardHeader>
              <CardContent>
                {produccion.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin datos de producción</h3>
                    <p className="text-muted-foreground">
                      Los datos de producción aparecerán cuando haya instalaciones activas
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Producción</TableHead>
                        <TableHead className="text-right">Consumo</TableHead>
                        <TableHead className="text-right">Excedente</TableHead>
                        <TableHead className="text-right">Autoconsumo</TableHead>
                        <TableHead className="text-right">Horas Pico</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produccion.map((p, i) => (
                        <TableRow key={i}>
                          <TableCell>{new Date(p.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell className="text-right text-green-600">{p.produccion} kWh</TableCell>
                          <TableCell className="text-right">{p.consumo} kWh</TableCell>
                          <TableCell className="text-right text-blue-600">{p.excedente} kWh</TableCell>
                          <TableCell className="text-right">{p.autoconsumo}%</TableCell>
                          <TableCell className="text-right">{p.horasPico}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI */}
          <TabsContent value="roi" className="space-y-4">
            {roiData.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin datos de ROI</h3>
                  <p className="text-muted-foreground">
                    El cálculo de retorno de inversión aparecerá cuando haya instalaciones registradas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {roiData.map((roi, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle>Análisis ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Inversión Inicial</span>
                          <span className="font-bold">{roi.inversionInicial.toLocaleString('es-ES')}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Ahorro Mensual</span>
                          <span className="font-bold text-green-600">+{roi.ahorroMensual}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Ahorro Acumulado</span>
                          <span className="font-bold text-green-600">{roi.ahorroAcumulado.toLocaleString('es-ES')}€</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Venta Excedentes</span>
                          <span className="font-bold text-blue-600">{roi.ventaExcedentes}€</span>
                        </div>
                        <div className="pt-4 border-t">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-muted-foreground">Tiempo de Amortización</span>
                            <span className="font-bold">{Math.round(roi.tiempoAmortizacion / 12)} años</span>
                          </div>
                          <Progress value={(roi.ahorroAcumulado / roi.inversionInicial) * 100} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {((roi.ahorroAcumulado / roi.inversionInicial) * 100).toFixed(1)}% amortizado
                          </p>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t">
                          <span className="font-semibold">ROI Total</span>
                          <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                            {roi.roi}%
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Mantenimiento */}
          <TabsContent value="mantenimiento" className="space-y-4">
            {mantenimientos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin mantenimientos programados</h3>
                  <p className="text-muted-foreground mb-4">
                    Programa mantenimientos preventivos para mantener la eficiencia óptima
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-6">
                    {[
                      { tipo: 'Limpieza', frecuencia: 'Cada 3 meses', icon: '🧹' },
                      { tipo: 'Revisión', frecuencia: 'Cada 6 meses', icon: '🔍' },
                      { tipo: 'Inspección', frecuencia: 'Anual', icon: '📋' },
                      { tipo: 'Calibración', frecuencia: 'Anual', icon: '⚙️' },
                    ].map((mant, i) => (
                      <Card key={i}>
                        <CardContent className="p-3 text-center">
                          <span className="text-2xl">{mant.icon}</span>
                          <p className="font-medium text-sm mt-1">{mant.tipo}</p>
                          <p className="text-xs text-muted-foreground">{mant.frecuencia}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Historial de Mantenimiento</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalación</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Técnico</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mantenimientos.map((mant) => (
                        <TableRow key={mant.id}>
                          <TableCell>{mant.instalacionNombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{mant.tipo}</Badge>
                          </TableCell>
                          <TableCell>{new Date(mant.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{mant.tecnico || '-'}</TableCell>
                          <TableCell>{mant.costo ? `${mant.costo}€` : '-'}</TableCell>
                          <TableCell>
                            <Badge className={
                              mant.estado === 'completado' ? 'bg-green-100 text-green-800' :
                              mant.estado === 'programado' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {mant.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Excedentes */}
          <TabsContent value="excedentes" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Gestión de Excedentes Energéticos</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Configura la venta de excedentes a la red eléctrica y maximiza tus ingresos por energía solar.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mt-6">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4 text-center">
                      <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-medium text-green-800">Compensación Simplificada</h4>
                      <p className="text-xs text-green-600">Descuento en factura eléctrica</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4 text-center">
                      <Euro className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-medium text-blue-800">Venta a Red</h4>
                      <p className="text-xs text-blue-600">Ingresos directos por kWh</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="p-4 text-center">
                      <Battery className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-medium text-purple-800">Almacenamiento</h4>
                      <p className="text-xs text-purple-600">Baterías para autoconsumo</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Nueva Instalación */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva Instalación Solar</DialogTitle>
              <DialogDescription>
                Registra una nueva instalación fotovoltaica
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Propiedad</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Edificio Centro - Calle Mayor 15</SelectItem>
                    <SelectItem value="2">Residencial Norte - Av. Diagonal 200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Capacidad (kW)</Label>
                  <Input type="number" placeholder="Ej: 10" />
                </div>
                <div className="space-y-2">
                  <Label>Número de Paneles</Label>
                  <Input type="number" placeholder="Ej: 25" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Instalación</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Marca Inversor</Label>
                  <Input placeholder="Ej: Huawei, SMA" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Inversión Inicial (€)</Label>
                <Input type="number" placeholder="Coste total de la instalación" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={crearInstalacion}>
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
