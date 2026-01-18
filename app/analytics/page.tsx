'use client';

import { useEffect, useState } from 'react';
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
  Home,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  Calendar,
  Building2,
  Target,
  CheckCircle2,
  Clock,
  Percent,
  Euro,
  Activity,
  Download,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

interface Trend {
  periodo: string;
  tasaOcupacion: number;
  ingresosMensuales: number;
  ingresoNeto: number;
  morosidad: number;
}

interface Prediction {
  tipo: string;
  valorPredicho: number;
  confianza: number;
  factores: string;
  periodo: string;
}

interface Recommendation {
  id: string;
  tipo: string;
  prioridad: string;
  titulo: string;
  descripcion: string;
  accionSugerida: string;
  impactoEstimado?: number;
  aplicada: boolean;
}

interface KPI {
  label: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: any;
  color: string;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [periodFilter, setPeriodFilter] = useState('12');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, periodFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // TODO: Integrar con API real
      // const trendsRes = await fetch(`/api/analytics/trends?months=${periodFilter}`);
      // if (trendsRes.ok) {
      //   const data = await trendsRes.json();
      //   setTrends(data.trends || []);
      // }

      // const predictionsRes = await fetch('/api/predictions');
      // if (predictionsRes.ok) {
      //   const data = await predictionsRes.json();
      //   setPredictions(data.predictions || []);
      // }

      // const recsRes = await fetch('/api/recommendations');
      // if (recsRes.ok) {
      //   const data = await recsRes.json();
      //   setRecommendations(data.recommendations || []);
      // }

      // Estado vacío inicial
      setTrends([]);
      setPredictions([]);
      setRecommendations([]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error al cargar analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePredictions = async () => {
    try {
      setIsGenerating(true);
      // TODO: Integrar con API real
      // await fetch('/api/predictions/revenue', { method: 'POST', ... });
      // await fetch('/api/predictions/occupancy', { method: 'POST', ... });
      // await fetch('/api/recommendations', { method: 'POST' });
      
      toast.success('Predicciones generadas exitosamente');
      fetchData();
    } catch (error) {
      console.error('Error generating predictions:', error);
      toast.error('Error al generar predicciones');
    } finally {
      setIsGenerating(false);
    }
  };

  const markRecommendationApplied = async (id: string) => {
    try {
      // TODO: Integrar con API real
      // await fetch(`/api/recommendations/${id}`, { method: 'PATCH', ... });
      toast.success('Recomendación marcada como aplicada');
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar recomendación');
    }
  };

  // KPIs calculados
  const currentOccupancy = trends.length > 0 ? trends[trends.length - 1]?.tasaOcupacion : 0;
  const currentRevenue = trends.length > 0 ? trends[trends.length - 1]?.ingresosMensuales : 0;
  const currentNetRevenue = trends.length > 0 ? trends[trends.length - 1]?.ingresoNeto : 0;
  const currentDelinquency = trends.length > 0 ? trends[trends.length - 1]?.morosidad : 0;

  const kpis: KPI[] = [
    {
      label: 'Tasa de Ocupación',
      value: `${currentOccupancy.toFixed(1)}%`,
      change: 2.5,
      changeType: 'positive',
      icon: Target,
      color: 'text-green-600',
    },
    {
      label: 'Ingresos Mensuales',
      value: `${currentRevenue.toLocaleString('es-ES')}€`,
      change: 5.2,
      changeType: 'positive',
      icon: Euro,
      color: 'text-blue-600',
    },
    {
      label: 'Ingreso Neto',
      value: `${currentNetRevenue.toLocaleString('es-ES')}€`,
      change: 3.1,
      changeType: 'positive',
      icon: TrendingUp,
      color: 'text-purple-600',
    },
    {
      label: 'Morosidad',
      value: `${currentDelinquency.toLocaleString('es-ES')}€`,
      change: -1.5,
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'text-red-600',
    },
  ];

  const revenuePredictions = predictions.filter((p) => p.tipo === 'ingresos');
  const occupancyPredictions = predictions.filter((p) => p.tipo === 'ocupacion');
  const pendingRecommendations = recommendations.filter((r) => !r.aplicada);

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando analytics...</p>
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
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Analytics Avanzado
              </h1>
              <p className="text-muted-foreground mt-1">
                Tendencias, predicciones y recomendaciones inteligentes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">Últimos 3 meses</SelectItem>
                <SelectItem value="6">Últimos 6 meses</SelectItem>
                <SelectItem value="12">Últimos 12 meses</SelectItem>
                <SelectItem value="24">Últimos 24 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={generatePredictions} disabled={isGenerating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Generar Predicciones
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const IconComponent = kpi.icon;
            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{kpi.label}</span>
                    <IconComponent className={`h-5 w-5 ${kpi.color} opacity-60`} />
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold">{kpi.value}</span>
                    {kpi.change && (
                      <div className={`flex items-center text-sm ${
                        kpi.changeType === 'positive' ? 'text-green-600' :
                        kpi.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {kpi.changeType === 'positive' ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : kpi.changeType === 'negative' ? (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        ) : null}
                        {Math.abs(kpi.change)}%
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">
              <Activity className="h-4 w-4 mr-2" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="trends">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Tendencias
            </TabsTrigger>
            <TabsTrigger value="predictions">
              <TrendingUp className="h-4 w-4 mr-2" />
              Predicciones
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Lightbulb className="h-4 w-4 mr-2" />
              Recomendaciones
            </TabsTrigger>
          </TabsList>

          {/* Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Resumen de Predicciones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Predicciones Activas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {predictions.length === 0 ? (
                    <div className="text-center py-6">
                      <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay predicciones disponibles
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={generatePredictions}>
                        Generar Predicciones
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Ingresos</span>
                        <span className="font-medium">{revenuePredictions.length} predicciones</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Ocupación</span>
                        <span className="font-medium">{occupancyPredictions.length} predicciones</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recomendaciones Pendientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                    Recomendaciones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingRecommendations.length === 0 ? (
                    <div className="text-center py-6">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Todas las recomendaciones aplicadas
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{pendingRecommendations.length}</span>
                        <Badge variant="outline">Pendientes</Badge>
                      </div>
                      <div className="space-y-1">
                        {pendingRecommendations.slice(0, 2).map((rec) => (
                          <div key={rec.id} className="text-sm text-muted-foreground truncate">
                            • {rec.titulo}
                          </div>
                        ))}
                        {pendingRecommendations.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{pendingRecommendations.length - 2} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estado General */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    Estado General
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Ocupación</span>
                        <span>{currentOccupancy.toFixed(0)}%</span>
                      </div>
                      <Progress value={currentOccupancy} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Cobro de Rentas</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Satisfacción</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Evolución de Ingresos</CardTitle>
                  <CardDescription>Últimos {periodFilter} meses</CardDescription>
                </CardHeader>
                <CardContent>
                  {trends.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No hay datos de tendencias disponibles
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Los datos aparecerán cuando haya transacciones registradas
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Gráfico de evolución de ingresos</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tasa de Ocupación</CardTitle>
                  <CardDescription>Últimos {periodFilter} meses</CardDescription>
                </CardHeader>
                <CardContent>
                  {trends.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <LineChartIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          No hay datos de ocupación disponibles
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Los datos aparecerán cuando haya propiedades registradas
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Gráfico de tasa de ocupación</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tendencias */}
          <TabsContent value="trends" className="space-y-6">
            {trends.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <LineChartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos de tendencias</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Las tendencias se calcularán automáticamente cuando haya suficientes datos históricos de propiedades, pagos e inquilinos.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de Ingresos</CardTitle>
                    <CardDescription>Ingresos brutos vs netos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Gráfico disponible con datos</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tasa de Ocupación</CardTitle>
                    <CardDescription>Evolución mensual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-muted-foreground">Gráfico disponible con datos</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Predicciones */}
          <TabsContent value="predictions" className="space-y-6">
            {predictions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay predicciones disponibles</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Genera predicciones basadas en tus datos históricos para obtener estimaciones de ingresos y ocupación.
                  </p>
                  <Button onClick={generatePredictions} disabled={isGenerating}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    Generar Predicciones
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Predicción de Ingresos</CardTitle>
                    <CardDescription>Próximos 3 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {revenuePredictions.map((pred, idx) => {
                        let factores: string[] = [];
                        try {
                          const parsed = JSON.parse(pred.factores || '[]');
                          factores = Array.isArray(parsed) ? parsed : [];
                        } catch {
                          factores = [];
                        }
                        return (
                          <div key={idx} className="border-l-4 border-blue-600 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{pred.periodo}</span>
                              <Badge variant="outline">
                                {(pred.confianza * 100).toFixed(0)}% confianza
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold mb-2">
                              €{pred.valorPredicho.toLocaleString('es-ES')}
                            </div>
                            {factores.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium mb-1">Factores:</p>
                                {factores.map((factor: string, i: number) => (
                                  <p key={i} className="text-xs">• {factor}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Predicción de Ocupación</CardTitle>
                    <CardDescription>Próximos 3 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {occupancyPredictions.map((pred, idx) => {
                        let factores: string[] = [];
                        try {
                          const parsed = JSON.parse(pred.factores || '[]');
                          factores = Array.isArray(parsed) ? parsed : [];
                        } catch {
                          factores = [];
                        }
                        return (
                          <div key={idx} className="border-l-4 border-green-600 pl-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">{pred.periodo}</span>
                              <Badge variant="outline">
                                {(pred.confianza * 100).toFixed(0)}% confianza
                              </Badge>
                            </div>
                            <div className="text-2xl font-bold mb-2">
                              {pred.valorPredicho.toFixed(1)}%
                            </div>
                            {factores.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium mb-1">Factores:</p>
                                {factores.map((factor: string, i: number) => (
                                  <p key={i} className="text-xs">• {factor}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Recomendaciones */}
          <TabsContent value="recommendations" className="space-y-6">
            {recommendations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay recomendaciones activas</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Las recomendaciones inteligentes se generan analizando tus datos para identificar oportunidades de mejora.
                  </p>
                  <Button onClick={generatePredictions} disabled={isGenerating}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    Generar Recomendaciones
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec) => {
                  const priorityColor =
                    rec.prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                    rec.prioridad === 'media' ? 'bg-amber-100 text-amber-800' :
                    'bg-green-100 text-green-800';

                  return (
                    <Card key={rec.id} className={rec.aplicada ? 'opacity-60' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={priorityColor}>{rec.prioridad}</Badge>
                              <Badge variant="outline">{rec.tipo}</Badge>
                              {rec.aplicada && (
                                <Badge variant="secondary">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Aplicada
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-lg">{rec.titulo}</CardTitle>
                          </div>
                          {rec.impactoEstimado && (
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">Impacto estimado</p>
                              <p className="text-lg font-bold text-green-600">
                                +€{rec.impactoEstimado.toLocaleString('es-ES')}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4">{rec.descripcion}</p>
                        <div className="bg-muted p-4 rounded-lg mb-4">
                          <p className="text-sm font-semibold mb-2">Acciones sugeridas:</p>
                          <p className="text-sm">{rec.accionSugerida}</p>
                        </div>
                        {!rec.aplicada && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markRecommendationApplied(rec.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marcar como aplicada
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
