'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/lazy-tabs';
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home as HomeIcon,
  Users,
  AlertTriangle,
  RefreshCw,
  Lightbulb,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import {
  AreaChart,
  Area,
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

function AnalyticsPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [trends, setTrends] = useState<Trend[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

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

      // Fetch trends
      const trendsRes = await fetch('/api/analytics/trends?months=12');
      if (trendsRes.ok) {
        const data = await trendsRes.json();
        setTrends(data.trends || []);
      }

      // Fetch predictions
      const predictionsRes = await fetch('/api/predictions');
      if (predictionsRes.ok) {
        const data = await predictionsRes.json();
        setPredictions(data.predictions || []);
      }

      // Fetch recommendations
      const recsRes = await fetch('/api/recommendations');
      if (recsRes.ok) {
        const data = await recsRes.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      toast.error('Error al cargar analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePredictions = async () => {
    try {
      setIsGenerating(true);

      // Generate revenue predictions
      await fetch('/api/predictions/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthsAhead: 3 }),
      });

      // Generate occupancy predictions
      await fetch('/api/predictions/occupancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthsAhead: 3 }),
      });

      // Generate recommendations
      await fetch('/api/recommendations', {
        method: 'POST',
      });

      toast.success('Predicciones generadas exitosamente');
      fetchData();
    } catch (error) {
      logger.error('Error generating predictions:', error);
      toast.error('Error al generar predicciones');
    } finally {
      setIsGenerating(false);
    }
  };

  const markRecommendationApplied = async (id: string) => {
    try {
      await fetch(`/api/recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aplicada: true }),
      });
      toast.success('Recomendación marcada como aplicada');
      fetchData();
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar recomendación');
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

  const revenueData = trends.map((t) => ({
    name: t.periodo,
    ingresos: t.ingresosMensuales,
    neto: t.ingresoNeto,
  }));

  const occupancyData = trends.map((t) => ({
    name: t.periodo,
    ocupacion: t.tasaOcupacion,
  }));

  const revenuePredictions = predictions.filter((p) => p.tipo === 'ingresos');
  const occupancyPredictions = predictions.filter((p) => p.tipo === 'ocupacion');

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
                  <BreadcrumbPage>Analytics & Predicciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Analytics Avanzado</h1>
                <p className="text-muted-foreground mt-1">
                  Tendencias, predicciones y recomendaciones inteligentes
                </p>
              </div>
              <Button onClick={generatePredictions} disabled={isGenerating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                Generar Predicciones
              </Button>
            </div>
          </div>

          <Tabs defaultValue="trends" className="space-y-6">
            <TabsList>
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

            {/* Tendencias */}
            <TabsContent value="trends" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Evolución de Ingresos</CardTitle>
                    <CardDescription>Ingresos brutos vs netos (últimos 12 meses)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="ingresos"
                          stackId="1"
                          stroke="#000000"
                          fill="#000000"
                          name="Ingresos Brutos"
                        />
                        <Area
                          type="monotone"
                          dataKey="neto"
                          stackId="2"
                          stroke="#666666"
                          fill="#666666"
                          name="Ingresos Netos"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tasa de Ocupación</CardTitle>
                    <CardDescription>Evolución de ocupación (últimos 12 meses)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={occupancyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="ocupacion"
                          stroke="#000000"
                          strokeWidth={2}
                          name="% Ocupación"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {trends.length > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Ocupación Actual</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {trends[trends.length - 1]?.tasaOcupacion.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Ingresos Este Mes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        €{trends[trends.length - 1]?.ingresosMensuales.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Ingreso Neto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        €{trends[trends.length - 1]?.ingresoNeto.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Morosidad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        €{trends[trends.length - 1]?.morosidad.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Predicciones */}
            <TabsContent value="predictions" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Revenue Predictions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Predicción de Ingresos</CardTitle>
                    <CardDescription>Próximos 3 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenuePredictions.length > 0 ? (
                      <div className="space-y-4">
                        {revenuePredictions.map((pred, idx) => {
                          const factores = JSON.parse(pred.factores || '[]');
                          return (
                            <div key={idx} className="border-l-4 border-primary pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">{pred.periodo}</span>
                                <Badge variant="outline">
                                  {(pred.confianza * 100).toFixed(0)}% confianza
                                </Badge>
                              </div>
                              <div className="text-2xl font-bold mb-2">
                                €{pred.valorPredicho.toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium mb-1">Factores:</p>
                                {factores.map((factor: string, i: number) => (
                                  <p key={i} className="text-xs">
                                    • {factor}
                                  </p>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No hay predicciones disponibles. Genera nuevas predicciones.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Occupancy Predictions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Predicción de Ocupación</CardTitle>
                    <CardDescription>Próximos 3 meses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {occupancyPredictions.length > 0 ? (
                      <div className="space-y-4">
                        {occupancyPredictions.map((pred, idx) => {
                          const factores = JSON.parse(pred.factores || '[]');
                          return (
                            <div key={idx} className="border-l-4 border-primary pl-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold">{pred.periodo}</span>
                                <Badge variant="outline">
                                  {(pred.confianza * 100).toFixed(0)}% confianza
                                </Badge>
                              </div>
                              <div className="text-2xl font-bold mb-2">
                                {pred.valorPredicho.toFixed(1)}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <p className="font-medium mb-1">Factores:</p>
                                {factores.map((factor: string, i: number) => (
                                  <p key={i} className="text-xs">
                                    • {factor}
                                  </p>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        No hay predicciones disponibles. Genera nuevas predicciones.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recomendaciones */}
            <TabsContent value="recommendations" className="space-y-6">
              {recommendations.length > 0 ? (
                <div className="grid gap-4">
                  {recommendations.map((rec) => {
                    const priorityColor =
                      rec.prioridad === 'alta'
                        ? 'destructive'
                        : rec.prioridad === 'media'
                          ? 'default'
                          : 'secondary';

                    return (
                      <Card key={rec.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={priorityColor}>{rec.prioridad}</Badge>
                                <Badge variant="outline">{rec.tipo}</Badge>
                              </div>
                              <CardTitle className="text-lg">{rec.titulo}</CardTitle>
                            </div>
                            {rec.impactoEstimado && (
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">Impacto estimado</p>
                                <p className="text-lg font-bold">
                                  €{rec.impactoEstimado.toLocaleString()}
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markRecommendationApplied(rec.id)}
                          >
                            Marcar como aplicada
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No hay recomendaciones activas. Genera nuevas recomendaciones.
                    </p>
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

export default function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <AnalyticsPageContent />
    </ErrorBoundary>
  );
}
