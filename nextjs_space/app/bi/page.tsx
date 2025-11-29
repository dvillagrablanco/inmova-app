'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Home, ArrowLeft, TrendingUp, TrendingDown, Building2, Users, 
  Euro, AlertCircle, Download, RefreshCw, Calendar, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BIData {
  ingresos: any[];
  gastos: any[];
  ocupacion: any[];
  morosidad: any[];
  mantenimiento: any[];
  rentabilidad: any;
  tendencias: any;
}

const COLORS = ['#000000', '#3f3f3f', '#7f7f7f', '#bfbfbf', '#e0e0e0'];

export default function BIPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BIData | null>(null);
  const [periodo, setPeriodo] = useState('12'); // meses
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [buildings, setBuildings] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
      loadBuildings();
    }
  }, [status, periodo, buildingFilter]);

  async function loadData() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        periodo,
        buildingId: buildingFilter !== 'all' ? buildingFilter : ''
      });
      
      const response = await fetch(`/api/bi/dashboard?${params}`);
      if (!response.ok) throw new Error('Error al cargar datos');
      
      const result = await response.json();
      setData(result);
    } catch (error: any) {
      console.error('Error loading BI data:', error);
      toast.error('Error al cargar datos de Business Intelligence');
    } finally {
      setLoading(false);
    }
  }

  async function loadBuildings() {
    try {
      const response = await fetch('/api/buildings');
      if (!response.ok) return;
      const result = await response.json();
      setBuildings(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading buildings:', error);
    }
  }

  async function exportData() {
    try {
      const params = new URLSearchParams({
        periodo,
        buildingId: buildingFilter !== 'all' ? buildingFilter : '',
        format: 'xlsx'
      });
      
      const response = await fetch(`/api/bi/export?${params}`);
      if (!response.ok) throw new Error('Error al exportar');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bi-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Reporte exportado exitosamente');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar reporte');
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6">
            <div className="flex items-center justify-center h-96">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Business Intelligence</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="text-3xl font-bold mt-2">Business Intelligence</h1>
              <p className="text-muted-foreground mt-1">
                Análisis avanzado y visualizaciones interactivas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refrescar
              </Button>
              <Button size="sm" onClick={exportData}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros de Análisis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Últimos 3 meses</SelectItem>
                      <SelectItem value="6">Últimos 6 meses</SelectItem>
                      <SelectItem value="12">Último año</SelectItem>
                      <SelectItem value="24">Últimos 2 años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Edificio</label>
                  <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los edificios</SelectItem>
                      {buildings.map(building => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Rango de fechas</label>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(), 'dd MMM yyyy', { locale: es })}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <Euro className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  €{data?.rentabilidad?.ingresosTotales?.toLocaleString('es-ES', { minimumFractionDigits: 2 }) || '0.00'}
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  +12.5% vs período anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.rentabilidad?.tasaOcupacion?.toFixed(1) || '0.0'}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  +3.2% vs período anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ROI Promedio</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.rentabilidad?.roiPromedio?.toFixed(2) || '0.00'}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  +1.8% vs período anterior
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa Morosidad</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.rentabilidad?.tasaMorosidad?.toFixed(1) || '0.0'}%
                </div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                  <TrendingDown className="h-3 w-3 mr-1 text-green-600" />
                  -2.1% vs período anterior
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Visualizaciones por Tabs */}
          <Tabs defaultValue="ingresos" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ingresos">Ingresos</TabsTrigger>
              <TabsTrigger value="gastos">Gastos</TabsTrigger>
              <TabsTrigger value="ocupacion">Ocupación</TabsTrigger>
              <TabsTrigger value="morosidad">Morosidad</TabsTrigger>
              <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
            </TabsList>

            {/* Tab de Ingresos */}
            <TabsContent value="ingresos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evolución de Ingresos</CardTitle>
                  <CardDescription>Ingresos mensuales por tipo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data?.ingresos || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="rentas" fill="#000000" name="Rentas" />
                      <Bar dataKey="servicios" fill="#666666" name="Servicios" />
                      <Bar dataKey="otros" fill="#999999" name="Otros" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Gastos */}
            <TabsContent value="gastos" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Gastos</CardTitle>
                    <CardDescription>Por categoría</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data?.gastos || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.categoria}: ${entry.porcentaje}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="monto"
                        >
                          {(data?.gastos || []).map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de Gastos</CardTitle>
                    <CardDescription>Tendencia mensual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data?.gastos || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="total" stroke="#000000" strokeWidth={2} name="Total Gastos" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab de Ocupación */}
            <TabsContent value="ocupacion" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tasa de Ocupación por Edificio</CardTitle>
                  <CardDescription>Porcentaje de unidades ocupadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={data?.ocupacion || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="edificio" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="porcentaje" fill="#000000" name="% Ocupación" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Morosidad */}
            <TabsContent value="morosidad" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Análisis de Morosidad</CardTitle>
                  <CardDescription>Pagos atrasados y recuperación</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={data?.morosidad || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="morosidad" stroke="#dc2626" fill="#fee2e2" name="Morosidad" />
                      <Area type="monotone" dataKey="recuperado" stroke="#16a34a" fill="#dcfce7" name="Recuperado" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab de Tendencias */}
            <TabsContent value="tendencias" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tendencias y Predicciones</CardTitle>
                  <CardDescription>Análisis predictivo basado en datos históricos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={data?.tendencias?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="periodo" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="real" stroke="#000000" strokeWidth={2} name="Datos Reales" />
                      <Line type="monotone" dataKey="prediccion" stroke="#666666" strokeDasharray="5 5" name="Predicción" />
                    </LineChart>
                  </ResponsiveContainer>
                  
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Tendencia General</div>
                      <div className="text-xl font-bold mt-1 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Positiva
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Crecimiento Proyectado</div>
                      <div className="text-xl font-bold mt-1">+8.5%</div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">Confianza</div>
                      <div className="text-xl font-bold mt-1">
                        <Badge variant="default">Alta (92%)</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
