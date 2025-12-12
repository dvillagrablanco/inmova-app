'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  Package,
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  Plus,
  DollarSign,
  Clock,
  BarChart3,
  Wrench,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';


interface InventoryItem {
  id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  cantidadMinima: number;
  costoUnitario: number;
  unidadMedida: string;
  proveedor?: string;
  ubicacion?: string;
}

interface Prediction {
  id: string;
  equipoSistema: string;
  probabilidadFalla: number;
  diasEstimados: number;
  factoresRiesgo: string;
  recomendaciones: string;
  confianza: number;
  estado: string;
  fechaObjetivo: string;
}

interface MaintenanceMetrics {
  id: string;
  periodo: string;
  tiempoRespuestaPromedio: number;
  tiempoResolucionPromedio: number;
  tasaResolucionPrimera: number;
  costosPreventivo: number;
  costosCorrectivo: number;
  costosEmergencia: number;
  solicitudesCompletas: number;
  solicitudesPendientes: number;
  solicitudesAtrasadas: number;
}

interface Budget {
  id: string;
  periodo: string;
  presupuestoTotal: number;
  gastadoCorrectivo: number;
  gastadoPreventivo: number;
  gastadoEmergencia: number;
  numeroOrdenes: number;
}

export default function MantenimientoProPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [metrics, setMetrics] = useState<MaintenanceMetrics[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openInventoryDialog, setOpenInventoryDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    nombre: '',
    categoria: '',
    cantidad: 0,
    cantidadMinima: 5,
    costoUnitario: 0,
    unidadMedida: 'unidad',
    proveedor: '',
    ubicacion: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch inventory
      const invRes = await fetch('/api/maintenance-pro/inventory');
      if (invRes.ok) {
        const data = await invRes.json();
        setInventory(data.inventory || []);
      }

      // Fetch predictions
      const predRes = await fetch('/api/maintenance-pro/predictions');
      if (predRes.ok) {
        const data = await predRes.json();
        setPredictions(data.predictions || []);
      }

      // Fetch metrics
      const metricsRes = await fetch('/api/maintenance-pro/metrics');
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data.metrics || []);
      }

      // Fetch budgets
      const budgetRes = await fetch('/api/maintenance-pro/budgets');
      if (budgetRes.ok) {
        const data = await budgetRes.json();
        setBudgets(data.budgets || []);
      }
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePredictions = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch('/api/maintenance-pro/predictions', {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Predicciones generadas exitosamente');
        fetchData();
      } else {
        toast.error('Error al generar predicciones');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al generar predicciones');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMetrics = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch('/api/maintenance-pro/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        toast.success('Métricas calculadas exitosamente');
        fetchData();
      } else {
        toast.error('Error al calcular métricas');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al calcular métricas');
    } finally {
      setIsGenerating(false);
    }
  };

  const addInventoryItem = async () => {
    try {
      const res = await fetch('/api/maintenance-pro/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (res.ok) {
        toast.success('Item agregado al inventario');
        setOpenInventoryDialog(false);
        setNewItem({
          nombre: '',
          categoria: '',
          cantidad: 0,
          cantidadMinima: 5,
          costoUnitario: 0,
          unidadMedida: 'unidad',
          proveedor: '',
          ubicacion: '',
        });
        fetchData();
      } else {
        toast.error('Error al agregar item');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al agregar item');
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="text-center">Cargando...</div>
          </main>
        </div>
      </div>
    );
  }

  // KPIs
  const lowStockItems = inventory.filter((item) => item.cantidad <= item.cantidadMinima).length;
  const criticalPredictions = predictions.filter((p) => p.estado === 'critica').length;
  const currentMetric = metrics[0];
  const currentBudget = budgets[0];
  const totalInventoryValue = inventory.reduce(
    (sum, item) => sum + item.cantidad * item.costoUnitario,
    0
  );

  const metricsChartData = metrics
    .slice(0, 6)
    .reverse()
    .map((m) => ({
      periodo: m.periodo,
      tiempoRespuesta: m.tiempoRespuestaPromedio,
      tiempoResolucion: m.tiempoResolucionPromedio,
      tasa: m.tasaResolucionPrimera,
    }));

  const budgetChartData = budgets
    .slice(0, 6)
    .reverse()
    .map((b) => ({
      periodo: b.periodo,
      preventivo: b.gastadoPreventivo,
      correctivo: b.gastadoCorrectivo,
      emergencia: b.gastadoEmergencia,
    }));

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>

            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Analytics de Mantenimiento</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Analytics de Mantenimiento</h1>
                <p className="text-muted-foreground mt-1">
                  Gestión avanzada con predicciones, inventario y métricas
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={generateMetrics} disabled={isGenerating} variant="outline">
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  Calcular Métricas
                </Button>
                <Button onClick={generatePredictions} disabled={isGenerating}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  Generar Predicciones
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
                <p className="text-xs text-muted-foreground">Items requieren reposición</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Alertas Críticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{criticalPredictions}</div>
                <p className="text-xs text-muted-foreground">Fallas predichas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{totalInventoryValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{inventory.length} items</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tiempo Resolución</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetric ? `${currentMetric.tiempoResolucionPromedio.toFixed(1)}d` : '-'}
                </div>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tasa Primera Resolución</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentMetric ? `${currentMetric.tasaResolucionPrimera.toFixed(0)}%` : '-'}
                </div>
                <p className="text-xs text-muted-foreground">Eficiencia</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="predictions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="predictions">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Predicciones
              </TabsTrigger>
              <TabsTrigger value="inventory">
                <Package className="h-4 w-4 mr-2" />
                Inventario
              </TabsTrigger>
              <TabsTrigger value="metrics">
                <Activity className="h-4 w-4 mr-2" />
                Métricas
              </TabsTrigger>
              <TabsTrigger value="budgets">
                <DollarSign className="h-4 w-4 mr-2" />
                Presupuestos
              </TabsTrigger>
            </TabsList>

            {/* Predicciones */}
            <TabsContent value="predictions" className="space-y-4">
              {predictions.length > 0 ? (
                predictions.map((pred) => {
                  const factores = JSON.parse(pred.factoresRiesgo || '[]');
                  const recomendaciones = JSON.parse(pred.recomendaciones || '[]');
                  const estadoColor =
                    pred.estado === 'critica'
                      ? 'destructive'
                      : pred.estado === 'alerta'
                        ? 'default'
                        : 'secondary';

                  return (
                    <Card key={pred.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={estadoColor}>{pred.estado}</Badge>
                              <Badge variant="outline">
                                {(pred.confianza * 100).toFixed(0)}% confianza
                              </Badge>
                            </div>
                            <CardTitle className="text-lg">{pred.equipoSistema}</CardTitle>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Probabilidad de falla</p>
                            <p className="text-3xl font-bold">
                              {pred.probabilidadFalla.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Factores de Riesgo:
                            </p>
                            {factores.map((factor: string, i: number) => (
                              <p key={i} className="text-sm text-muted-foreground ml-6">
                                • {factor}
                              </p>
                            ))}
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Wrench className="h-4 w-4" />
                              Recomendaciones:
                            </p>
                            {recomendaciones.map((rec: string, i: number) => (
                              <p key={i} className="text-sm text-muted-foreground ml-6">
                                • {rec}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Estimado en {pred.diasEstimados} días</span>
                          <span>•</span>
                          <span>
                            Fecha objetivo:{' '}
                            {format(new Date(pred.fechaObjetivo), 'dd MMM yyyy', { locale: es })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay predicciones disponibles. Genera predicciones para ver alertas de
                      fallas.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Inventario */}
            <TabsContent value="inventory" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Dialog open={openInventoryDialog} onOpenChange={setOpenInventoryDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nuevo Item de Inventario</DialogTitle>
                      <DialogDescription>
                        Registra un nuevo repuesto o material en el inventario
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label>Nombre</Label>
                        <Input
                          value={newItem.nombre}
                          onChange={(e) => setNewItem({ ...newItem, nombre: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Categoría</Label>
                          <Select
                            value={newItem.categoria}
                            onValueChange={(val) => setNewItem({ ...newItem, categoria: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="electrico">Eléctrico</SelectItem>
                              <SelectItem value="fontaneria">Fontanería</SelectItem>
                              <SelectItem value="climatizacion">Climatización</SelectItem>
                              <SelectItem value="herramientas">Herramientas</SelectItem>
                              <SelectItem value="pintura">Pintura</SelectItem>
                              <SelectItem value="otros">Otros</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Unidad de Medida</Label>
                          <Select
                            value={newItem.unidadMedida}
                            onValueChange={(val) => setNewItem({ ...newItem, unidadMedida: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unidad">Unidad</SelectItem>
                              <SelectItem value="metro">Metro</SelectItem>
                              <SelectItem value="litro">Litro</SelectItem>
                              <SelectItem value="kilogramo">Kilogramo</SelectItem>
                              <SelectItem value="caja">Caja</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Cantidad</Label>
                          <Input
                            type="number"
                            value={newItem.cantidad}
                            onChange={(e) =>
                              setNewItem({ ...newItem, cantidad: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div>
                          <Label>Cantidad Mínima</Label>
                          <Input
                            type="number"
                            value={newItem.cantidadMinima}
                            onChange={(e) =>
                              setNewItem({
                                ...newItem,
                                cantidadMinima: parseInt(e.target.value) || 5,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Costo Unitario (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={newItem.costoUnitario}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              costoUnitario: parseFloat(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Proveedor</Label>
                        <Input
                          value={newItem.proveedor}
                          onChange={(e) => setNewItem({ ...newItem, proveedor: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Ubicación</Label>
                        <Input
                          value={newItem.ubicacion}
                          onChange={(e) => setNewItem({ ...newItem, ubicacion: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOpenInventoryDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={addInventoryItem}>Agregar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {inventory.length > 0 ? (
                <div className="grid gap-4">
                  {inventory.map((item) => {
                    const lowStock = item.cantidad <= item.cantidadMinima;
                    return (
                      <Card key={item.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{item.nombre}</h3>
                                <Badge variant="outline">{item.categoria}</Badge>
                                {lowStock && <Badge variant="destructive">Stock Bajo</Badge>}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p>Ubicación: {item.ubicacion || 'No especificada'}</p>
                                {item.proveedor && <p>Proveedor: {item.proveedor}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{item.cantidad}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.unidadMedida} (mín: {item.cantidadMinima})
                              </p>
                              <p className="text-sm font-semibold mt-1">
                                €{(item.cantidad * item.costoUnitario).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay items en el inventario. Agrega repuestos y materiales.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Métricas */}
            <TabsContent value="metrics" className="space-y-6">
              {currentMetric && (
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Solicitudes Completas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentMetric.solicitudesCompletas}</div>
                      <p className="text-xs text-muted-foreground">Este período</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {currentMetric.solicitudesPendientes}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {currentMetric.solicitudesAtrasadas} atrasadas
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Costos Preventivo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        €{currentMetric.costosPreventivo.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Mantenimiento programado</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Costos Correctivo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        €{currentMetric.costosCorrectivo.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Reparaciones</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {metricsChartData.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tiempos de Respuesta y Resolución</CardTitle>
                      <CardDescription>Promedios en días</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metricsChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="tiempoRespuesta"
                            stroke="#000000"
                            name="Tiempo Respuesta"
                          />
                          <Line
                            type="monotone"
                            dataKey="tiempoResolucion"
                            stroke="#666666"
                            name="Tiempo Resolución"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tasa de Resolución Primera Visita</CardTitle>
                      <CardDescription>Porcentaje de éxito</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={metricsChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="tasa" fill="#000000" name="% Resolución Primera Visita" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!currentMetric && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay métricas disponibles. Calcula métricas para ver el desempeño.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Presupuestos */}
            <TabsContent value="budgets" className="space-y-6">
              {currentBudget && (
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        €{currentBudget.presupuestoTotal.toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">{currentBudget.periodo}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Gastado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        €
                        {(
                          currentBudget.gastadoCorrectivo +
                          currentBudget.gastadoPreventivo +
                          currentBudget.gastadoEmergencia
                        ).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(
                          ((currentBudget.gastadoCorrectivo +
                            currentBudget.gastadoPreventivo +
                            currentBudget.gastadoEmergencia) /
                            currentBudget.presupuestoTotal) *
                          100
                        ).toFixed(1)}
                        % usado
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Disponible</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        €
                        {(
                          currentBudget.presupuestoTotal -
                          currentBudget.gastadoCorrectivo -
                          currentBudget.gastadoPreventivo -
                          currentBudget.gastadoEmergencia
                        ).toLocaleString()}
                      </div>
                      <p className="text-xs text-muted-foreground">Remanente</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Órdenes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{currentBudget.numeroOrdenes}</div>
                      <p className="text-xs text-muted-foreground">Trabajos realizados</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {budgetChartData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Gastos por Tipo</CardTitle>
                    <CardDescription>Últimos 6 períodos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="preventivo" stackId="a" fill="#10b981" name="Preventivo" />
                        <Bar dataKey="correctivo" stackId="a" fill="#f59e0b" name="Correctivo" />
                        <Bar dataKey="emergencia" stackId="a" fill="#ef4444" name="Emergencia" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {!currentBudget && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay presupuestos registrados.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
