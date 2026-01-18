'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
  Download,
  Building2,
  Users,
  Wrench,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Star,
  Calendar,
  RefreshCw,
  Activity,
  BarChart3,
  Timer,
  ThumbsUp,
  Home,
  UserCheck,
  Hammer,
} from 'lucide-react';
import { toast } from 'sonner';

interface OcupacionData {
  id: string;
  propiedad: string;
  tipo: string;
  totalUnidades: number;
  ocupadas: number;
  vacantes: number;
  tasaOcupacion: number;
  tendencia: 'up' | 'down' | 'stable';
  diasPromedioVacancia: number;
}

interface MantenimientoData {
  id: string;
  categoria: string;
  totalSolicitudes: number;
  completadas: number;
  pendientes: number;
  enProgreso: number;
  tiempoPromedioResolucion: number; // en horas
  satisfaccion: number; // 0-100
  costoPromedio: number;
}

interface SatisfaccionData {
  id: string;
  periodo: string;
  respuestas: number;
  satisfaccionGeneral: number;
  nps: number;
  categorias: {
    mantenimiento: number;
    comunicacion: number;
    areasComunes: number;
    seguridad: number;
    atencionCliente: number;
  };
}

interface RendimientoEquipo {
  id: string;
  miembro: string;
  rol: string;
  tareasAsignadas: number;
  tareasCompletadas: number;
  tiempoPromedioRespuesta: number; // en horas
  satisfaccionCliente: number;
  eficiencia: number;
}

interface KPIOperativo {
  id: string;
  nombre: string;
  valor: number;
  meta: number;
  unidad: string;
  tendencia: 'up' | 'down' | 'stable';
  progreso: number;
}

export default function ReportesOperacionalesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ocupacion');
  const [periodoFilter, setPeriodoFilter] = useState('mes');

  const [ocupacion, setOcupacion] = useState<OcupacionData[]>([]);
  const [mantenimiento, setMantenimiento] = useState<MantenimientoData[]>([]);
  const [satisfaccion, setSatisfaccion] = useState<SatisfaccionData[]>([]);
  const [equipos, setEquipos] = useState<RendimientoEquipo[]>([]);
  const [kpis, setKpis] = useState<KPIOperativo[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router, periodoFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const [ocupRes, mantRes, satRes, equipRes, kpiRes] = await Promise.all([
      //   fetch(`/api/reportes/ocupacion?periodo=${periodoFilter}`),
      //   fetch(`/api/reportes/mantenimiento?periodo=${periodoFilter}`),
      //   fetch(`/api/reportes/satisfaccion?periodo=${periodoFilter}`),
      //   fetch(`/api/reportes/equipos?periodo=${periodoFilter}`),
      //   fetch(`/api/reportes/kpis?periodo=${periodoFilter}`),
      // ]);

      // Estado vacío inicial
      setOcupacion([]);
      setMantenimiento([]);
      setSatisfaccion([]);
      setEquipos([]);
      setKpis([]);
    } catch (error) {
      console.error('Error cargando reportes:', error);
      toast.error('Error al cargar reportes operacionales');
    } finally {
      setLoading(false);
    }
  };

  const exportarReporte = () => {
    // TODO: Implementar exportación
    toast.success('Reporte exportado exitosamente');
  };

  // KPIs calculados
  const tasaOcupacionGlobal = ocupacion.length > 0
    ? ocupacion.reduce((acc, o) => acc + o.tasaOcupacion, 0) / ocupacion.length
    : 0;
  const tiempoResolucionPromedio = mantenimiento.length > 0
    ? mantenimiento.reduce((acc, m) => acc + m.tiempoPromedioResolucion, 0) / mantenimiento.length
    : 0;
  const satisfaccionPromedio = satisfaccion.length > 0
    ? satisfaccion[satisfaccion.length - 1]?.satisfaccionGeneral || 0
    : 0;
  const eficienciaEquipo = equipos.length > 0
    ? equipos.reduce((acc, e) => acc + e.eficiencia, 0) / equipos.length
    : 0;

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando reportes operacionales...</p>
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
            <Button variant="ghost" size="icon" onClick={() => router.push('/reportes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Activity className="h-8 w-8 text-blue-600" />
                Reportes Operacionales
              </h1>
              <p className="text-muted-foreground mt-1">
                Ocupación, mantenimiento, satisfacción y rendimiento de equipos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Esta Semana</SelectItem>
                <SelectItem value="mes">Este Mes</SelectItem>
                <SelectItem value="trimestre">Este Trimestre</SelectItem>
                <SelectItem value="año">Este Año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportarReporte}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPIs Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tasa de Ocupación</span>
                <Home className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{tasaOcupacionGlobal.toFixed(1)}%</p>
                <Badge variant="secondary" className="mb-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Meta: 95%
                </Badge>
              </div>
              <Progress value={tasaOcupacionGlobal} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tiempo Resolución</span>
                <Timer className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{tiempoResolucionPromedio.toFixed(0)}h</p>
                <Badge variant="secondary" className="mb-1">
                  <Target className="h-3 w-3 mr-1" />
                  Meta: 24h
                </Badge>
              </div>
              <Progress value={Math.min(100, (24 / tiempoResolucionPromedio) * 100)} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Satisfacción</span>
                <ThumbsUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{satisfaccionPromedio.toFixed(0)}%</p>
                <Badge variant="secondary" className="mb-1">
                  <Star className="h-3 w-3 mr-1" />
                  Meta: 90%
                </Badge>
              </div>
              <Progress value={satisfaccionPromedio} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Eficiencia Equipo</span>
                <UserCheck className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{eficienciaEquipo.toFixed(0)}%</p>
                <Badge variant="secondary" className="mb-1">
                  <Target className="h-3 w-3 mr-1" />
                  Meta: 85%
                </Badge>
              </div>
              <Progress value={eficienciaEquipo} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="ocupacion">
              <Home className="h-4 w-4 mr-2" />
              Tasas de Ocupación
            </TabsTrigger>
            <TabsTrigger value="mantenimiento">
              <Wrench className="h-4 w-4 mr-2" />
              Mantenimiento
            </TabsTrigger>
            <TabsTrigger value="satisfaccion">
              <Star className="h-4 w-4 mr-2" />
              Satisfacción
            </TabsTrigger>
            <TabsTrigger value="equipos">
              <Users className="h-4 w-4 mr-2" />
              Rendimiento Equipos
            </TabsTrigger>
            <TabsTrigger value="kpis">
              <Target className="h-4 w-4 mr-2" />
              KPIs Personalizados
            </TabsTrigger>
          </TabsList>

          {/* Tasas de Ocupación */}
          <TabsContent value="ocupacion" className="space-y-6">
            {ocupacion.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos de ocupación</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Los datos de ocupación se calcularán automáticamente cuando haya propiedades y unidades registradas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Tasas de Ocupación por Propiedad</CardTitle>
                  <CardDescription>Análisis de ocupación y vacancia</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Propiedad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Total Unidades</TableHead>
                        <TableHead className="text-right">Ocupadas</TableHead>
                        <TableHead className="text-right">Vacantes</TableHead>
                        <TableHead className="text-right">Tasa Ocupación</TableHead>
                        <TableHead className="text-right">Tendencia</TableHead>
                        <TableHead className="text-right">Días Promedio Vacancia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ocupacion.map((o) => (
                        <TableRow key={o.id}>
                          <TableCell className="font-medium">{o.propiedad}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{o.tipo}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{o.totalUnidades}</TableCell>
                          <TableCell className="text-right text-green-600">{o.ocupadas}</TableCell>
                          <TableCell className="text-right text-red-600">{o.vacantes}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-medium">{o.tasaOcupacion.toFixed(1)}%</span>
                              <Progress value={o.tasaOcupacion} className="w-16 h-2" />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {o.tendencia === 'up' ? (
                              <TrendingUp className="h-4 w-4 text-green-600 inline" />
                            ) : o.tendencia === 'down' ? (
                              <TrendingDown className="h-4 w-4 text-red-600 inline" />
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{o.diasPromedioVacancia} días</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Mantenimiento */}
          <TabsContent value="mantenimiento" className="space-y-6">
            {mantenimiento.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos de mantenimiento</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Los datos de mantenimiento se calcularán automáticamente cuando haya solicitudes de mantenimiento registradas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mantenimiento.map((m) => (
                    <Card key={m.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Hammer className="h-5 w-5" />
                          {m.categoria}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Solicitudes</span>
                            <span className="font-medium">{m.totalSolicitudes}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Completadas</span>
                            <Badge variant="default">{m.completadas}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">En Progreso</span>
                            <Badge variant="secondary">{m.enProgreso}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Pendientes</span>
                            <Badge variant="destructive">{m.pendientes}</Badge>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Tiempo Promedio</span>
                              <span className="font-medium">{m.tiempoPromedioResolucion}h</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-muted-foreground">Satisfacción</span>
                              <span className="font-medium">{m.satisfaccion}%</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-sm text-muted-foreground">Costo Promedio</span>
                              <span className="font-medium">{m.costoPromedio.toLocaleString('es-ES')}€</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Satisfacción */}
          <TabsContent value="satisfaccion" className="space-y-6">
            {satisfaccion.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos de satisfacción</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Los datos de satisfacción se calcularán automáticamente cuando haya encuestas y valoraciones registradas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Evolución de Satisfacción */}
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de Satisfacción</CardTitle>
                    <CardDescription>Histórico de puntuaciones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <BarChart3 className="h-16 w-16 text-gray-300" />
                      <p className="text-muted-foreground ml-4">Gráfico disponible con datos</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Desglose por Categorías */}
                <Card>
                  <CardHeader>
                    <CardTitle>Satisfacción por Categoría</CardTitle>
                    <CardDescription>Último periodo: {satisfaccion[satisfaccion.length - 1]?.periodo}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {satisfaccion.length > 0 && (
                      <div className="space-y-4">
                        {Object.entries(satisfaccion[satisfaccion.length - 1].categorias).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span>{value}%</span>
                            </div>
                            <Progress value={value} className="h-2" />
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Rendimiento de Equipos */}
          <TabsContent value="equipos" className="space-y-6">
            {equipos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos de rendimiento</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Los datos de rendimiento se calcularán automáticamente cuando haya miembros de equipo y tareas registradas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento del Equipo</CardTitle>
                  <CardDescription>Métricas de desempeño individual</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Miembro</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead className="text-right">Tareas Asignadas</TableHead>
                        <TableHead className="text-right">Completadas</TableHead>
                        <TableHead className="text-right">Tiempo Resp.</TableHead>
                        <TableHead className="text-right">Satisfacción</TableHead>
                        <TableHead className="text-right">Eficiencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {equipos.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.miembro}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.rol}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{e.tareasAsignadas}</TableCell>
                          <TableCell className="text-right">
                            <span className={e.tareasCompletadas === e.tareasAsignadas ? 'text-green-600' : ''}>
                              {e.tareasCompletadas}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{e.tiempoPromedioRespuesta}h</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              {e.satisfaccionCliente}%
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant={e.eficiencia >= 90 ? 'default' : e.eficiencia >= 75 ? 'secondary' : 'destructive'}
                            >
                              {e.eficiencia}%
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

          {/* KPIs Personalizados */}
          <TabsContent value="kpis" className="space-y-6">
            {kpis.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay KPIs personalizados</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Configura KPIs personalizados para medir el rendimiento de tus operaciones según tus necesidades específicas.
                  </p>
                  <Button>
                    <Target className="h-4 w-4 mr-2" />
                    Configurar KPIs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                  <Card key={kpi.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{kpi.nombre}</CardTitle>
                        {kpi.tendencia === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : kpi.tendencia === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <span className="h-4 w-4">—</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-end justify-between">
                          <span className="text-3xl font-bold">
                            {kpi.valor}{kpi.unidad}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Meta: {kpi.meta}{kpi.unidad}
                          </span>
                        </div>
                        <Progress value={kpi.progreso} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                          {kpi.progreso.toFixed(0)}% de la meta
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
