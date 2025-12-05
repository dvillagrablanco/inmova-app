'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import {
  Home,
  ArrowLeft,
  Zap,
  Droplet,
  Flame,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Calendar,
  DollarSign,
  Activity,
  BarChart3,
} from 'lucide-react';
import { usePermissions } from '@/lib/hooks/usePermissions';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from '@/components/ui/lazy-charts-extended';
import logger, { logError } from '@/lib/logger';

interface Building {
  id: string;
  nombre: string;
}

interface Unit {
  id: string;
  numero: string;
  buildingId: string;
}

interface EnergyReading {
  id: string;
  tipo: string;
  lecturaAnterior?: number;
  lecturaActual: number;
  consumo: number;
  fechaLectura: string;
  periodo: string;
  costo?: number;
  building?: Building;
  unit?: Unit;
  notas?: string;
}

interface EnergyAlert {
  id: string;
  tipo: string;
  tipoAlerta: string;
  titulo: string;
  descripcion: string;
  consumoActual: number;
  consumoPromedio?: number;
  desviacionPorcentaje?: number;
  severidad: string;
  resuelta: boolean;
  fechaDeteccion: string;
  building?: Building;
  unit?: Unit;
}

interface Stats {
  currentPeriod: string;
  totalReadings: number;
  currentConsumption: number;
  currentCost: number;
  consumptionVariation: number;
  totalAlerts: number;
  unresolvedAlerts: number;
}

export default function EnergiaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { canCreate } = usePermissions();

  const [readings, setReadings] = useState<EnergyReading[]>([]);
  const [alerts, setAlerts] = useState<EnergyAlert[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const [openReadingDialog, setOpenReadingDialog] = useState(false);
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterBuilding, setFilterBuilding] = useState<string>('');

  const [readingForm, setReadingForm] = useState({
    buildingId: '',
    unitId: '',
    tipo: 'electricidad',
    lecturaAnterior: '',
    lecturaActual: '',
    fechaLectura: format(new Date(), 'yyyy-MM-dd'),
    costo: '',
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [readingsRes, alertsRes, statsRes, trendsRes, buildingsRes, unitsRes] =
        await Promise.all([
          fetch('/api/energy/readings'),
          fetch('/api/energy/alerts?resuelta=false'),
          fetch('/api/energy/stats'),
          fetch('/api/energy/stats?type=trends&tipo=electricidad&months=6'),
          fetch('/api/buildings'),
          fetch('/api/units'),
        ]);

      const [readingsData, alertsData, statsData, trendsData, buildingsData, unitsData] =
        await Promise.all([
          readingsRes.json(),
          alertsRes.json(),
          statsRes.json(),
          trendsRes.json(),
          buildingsRes.json(),
          unitsRes.json(),
        ]);

      setReadings(Array.isArray(readingsData) ? readingsData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setStats(statsData || null);
      setTrends(Array.isArray(trendsData) ? trendsData : []);
      setBuildings(Array.isArray(buildingsData) ? buildingsData : []);
      setUnits(Array.isArray(unitsData) ? unitsData : []);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReading = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/energy/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readingForm),
      });

      if (!res.ok) throw new Error('Error al crear lectura');

      toast.success('Lectura registrada exitosamente');
      setOpenReadingDialog(false);
      setReadingForm({
        buildingId: '',
        unitId: '',
        tipo: 'electricidad',
        lecturaAnterior: '',
        lecturaActual: '',
        fechaLectura: format(new Date(), 'yyyy-MM-dd'),
        costo: '',
        notas: '',
      });
      fetchData();
    } catch (error) {
      logger.error('Error creating reading:', error);
      toast.error('Error al registrar la lectura');
    }
  };

  const handleResolveAlert = async (alertId: string, accion: string) => {
    try {
      const res = await fetch('/api/energy/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, accionTomada: accion }),
      });

      if (!res.ok) throw new Error('Error al resolver alerta');

      toast.success('Alerta resuelta exitosamente');
      fetchData();
    } catch (error) {
      logger.error('Error resolving alert:', error);
      toast.error('Error al resolver la alerta');
    }
  };

  const filteredReadings = useMemo(() => {
    return readings.filter((reading) => {
      if (filterTipo && reading.tipo !== filterTipo) return false;
      if (filterBuilding && reading.building?.id !== filterBuilding) return false;
      return true;
    });
  }, [readings, filterTipo, filterBuilding]);

  const getEnergyIcon = (tipo: string) => {
    switch (tipo) {
      case 'electricidad':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'agua':
        return <Droplet className="h-5 w-5 text-blue-500" />;
      case 'gas':
        return <Flame className="h-5 w-5 text-orange-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severidad: string) => {
    const variants: Record<string, string> = {
      alta: 'bg-red-100 text-red-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-green-100 text-green-800',
    };
    return variants[severidad] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {/* Breadcrumbs */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
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
                    <BreadcrumbPage>Gestión de Energía</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Gestión de Energía</h1>
            </div>
            <p className="text-muted-foreground">
              Monitorea consumos de energía, agua y gas en tiempo real
            </p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Período Actual</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.currentPeriod || 'N/A'}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalReadings || 0} lecturas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consumo Total</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.currentConsumption.toFixed(2) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.consumptionVariation
                    ? `${stats.consumptionVariation > 0 ? '+' : ''}${stats.consumptionVariation.toFixed(1)}%`
                    : 'vs mes anterior'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costo Mensual</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.currentCost ? `${stats.currentCost.toFixed(2)}€` : '0.00€'}
                </div>
                <p className="text-xs text-muted-foreground">Estimado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.unresolvedAlerts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalAlerts || 0} totales
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de energía" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="electricidad">Electricidad</SelectItem>
                <SelectItem value="agua">Agua</SelectItem>
                <SelectItem value="gas">Gas</SelectItem>
                <SelectItem value="calefaccion">Calefacción</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterBuilding} onValueChange={setFilterBuilding}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Edificio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id}>
                    {building.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="readings" className="space-y-6">
            <TabsList>
              <TabsTrigger value="readings" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Lecturas
              </TabsTrigger>
              <TabsTrigger value="alerts" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Alertas ({alerts.length})
              </TabsTrigger>
              <TabsTrigger value="trends" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Tendencias
              </TabsTrigger>
            </TabsList>

            {/* Lecturas Tab */}
            <TabsContent value="readings" className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Historial de Lecturas</h2>
                {canCreate && (
                  <Dialog open={openReadingDialog} onOpenChange={setOpenReadingDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Registrar Lectura
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Registrar Nueva Lectura</DialogTitle>
                        <DialogDescription>
                          Registra el consumo de energía, agua o gas
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateReading} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tipo">Tipo de Energía *</Label>
                            <Select
                              value={readingForm.tipo}
                              onValueChange={(value) =>
                                setReadingForm({ ...readingForm, tipo: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="electricidad">Electricidad</SelectItem>
                                <SelectItem value="agua">Agua</SelectItem>
                                <SelectItem value="gas">Gas</SelectItem>
                                <SelectItem value="calefaccion">Calefacción</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fechaLectura">Fecha *</Label>
                            <Input
                              id="fechaLectura"
                              type="date"
                              required
                              value={readingForm.fechaLectura}
                              onChange={(e) =>
                                setReadingForm({ ...readingForm, fechaLectura: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="buildingId">Edificio (Opcional)</Label>
                            <Select
                              value={readingForm.buildingId}
                              onValueChange={(value) =>
                                setReadingForm({ ...readingForm, buildingId: value, unitId: '' })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Ninguno</SelectItem>
                                {buildings.map((building) => (
                                  <SelectItem key={building.id} value={building.id}>
                                    {building.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="unitId">Unidad (Opcional)</Label>
                            <Select
                              value={readingForm.unitId}
                              onValueChange={(value) =>
                                setReadingForm({ ...readingForm, unitId: value })
                              }
                              disabled={!readingForm.buildingId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Ninguna</SelectItem>
                                {units
                                  .filter((u) => u.buildingId === readingForm.buildingId)
                                  .map((unit) => (
                                    <SelectItem key={unit.id} value={unit.id}>
                                      {unit.numero}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="lecturaAnterior">Lectura Anterior</Label>
                            <Input
                              id="lecturaAnterior"
                              type="number"
                              step="0.01"
                              value={readingForm.lecturaAnterior}
                              onChange={(e) =>
                                setReadingForm({
                                  ...readingForm,
                                  lecturaAnterior: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="lecturaActual">Lectura Actual *</Label>
                            <Input
                              id="lecturaActual"
                              type="number"
                              step="0.01"
                              required
                              value={readingForm.lecturaActual}
                              onChange={(e) =>
                                setReadingForm({ ...readingForm, lecturaActual: e.target.value })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="costo">Costo (€)</Label>
                            <Input
                              id="costo"
                              type="number"
                              step="0.01"
                              value={readingForm.costo}
                              onChange={(e) =>
                                setReadingForm({ ...readingForm, costo: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notas">Notas</Label>
                          <Textarea
                            id="notas"
                            value={readingForm.notas}
                            onChange={(e) =>
                              setReadingForm({ ...readingForm, notas: e.target.value })
                            }
                            rows={2}
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpenReadingDialog(false)}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit">Registrar</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredReadings.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Activity className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay lecturas registradas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredReadings.map((reading) => (
                    <Card key={reading.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {getEnergyIcon(reading.tipo)}
                            <div>
                              <CardTitle className="text-lg capitalize">
                                {reading.tipo}
                              </CardTitle>
                              <CardDescription>{reading.periodo}</CardDescription>
                            </div>
                          </div>
                          <Badge>
                            {format(new Date(reading.fechaLectura), 'dd/MM/yyyy')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Lectura Actual</p>
                            <p className="text-2xl font-bold">
                              {reading.lecturaActual.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Consumo</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {reading.consumo.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {reading.costo && (
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span className="text-sm font-medium">Costo:</span>
                            <span className="text-lg font-bold text-green-600">
                              {reading.costo.toFixed(2)}€
                            </span>
                          </div>
                        )}

                        {(reading.building || reading.unit) && (
                          <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {reading.building?.nombre}
                              {reading.unit && ` - Unidad ${reading.unit.numero}`}
                            </span>
                          </div>
                        )}

                        {reading.notas && (
                          <p className="text-sm text-muted-foreground italic">
                            {reading.notas}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Alertas Tab */}
            <TabsContent value="alerts" className="space-y-4">
              <h2 className="text-xl font-semibold">Alertas de Consumo</h2>

              <div className="grid grid-cols-1 gap-4">
                {alerts.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay alertas activas
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  alerts.map((alert) => (
                    <Card key={alert.id} className="border-l-4 border-l-orange-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getEnergyIcon(alert.tipo)}
                              <CardTitle className="text-lg">{alert.titulo}</CardTitle>
                            </div>
                            <CardDescription>{alert.descripcion}</CardDescription>
                          </div>
                          <Badge className={getSeverityBadge(alert.severidad)}>
                            {alert.severidad}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Consumo Actual</p>
                            <p className="text-lg font-semibold">
                              {alert.consumoActual.toFixed(2)}
                            </p>
                          </div>
                          {alert.consumoPromedio && (
                            <div>
                              <p className="text-muted-foreground">Promedio</p>
                              <p className="text-lg font-semibold">
                                {alert.consumoPromedio.toFixed(2)}
                              </p>
                            </div>
                          )}
                          {alert.desviacionPorcentaje && (
                            <div>
                              <p className="text-muted-foreground">Desviación</p>
                              <p
                                className={`text-lg font-semibold ${
                                  alert.desviacionPorcentaje > 0
                                    ? 'text-red-600'
                                    : 'text-green-600'
                                }`}
                              >
                                {alert.desviacionPorcentaje > 0 ? '+' : ''}
                                {alert.desviacionPorcentaje.toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>

                        {(alert.building || alert.unit) && (
                          <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {alert.building?.nombre}
                              {alert.unit && ` - Unidad ${alert.unit.numero}`}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Detectada: {format(new Date(alert.fechaDeteccion), 'dd/MM/yyyy HH:mm')}
                        </div>

                        {!alert.resuelta && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleResolveAlert(alert.id, 'Revisado y corregido')
                            }
                            className="w-full"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marcar como Resuelta
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Tendencias Tab */}
            <TabsContent value="trends" className="space-y-4">
              <h2 className="text-xl font-semibold">Tendencias de Consumo</h2>

              <Card>
                <CardHeader>
                  <CardTitle>Consumo de Electricidad (Últimos 6 Meses)</CardTitle>
                  <CardDescription>
                    Evolución del consumo y costos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {trends.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground text-center">
                        No hay suficientes datos para mostrar tendencias
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="periodo" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="consumo"
                          stroke="#8884d8"
                          name="Consumo"
                          strokeWidth={2}
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="costo"
                          stroke="#82ca9d"
                          name="Costo (€)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
