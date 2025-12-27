'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Leaf,
  TrendingDown,
  Award,
  FileText,
  BarChart3,
  Zap,
  Droplet,
  Wind,
  Plus,
  Download,
  Target,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import logger from '@/lib/logger';

interface ESGMetrics {
  carbonFootprint: number; // kg CO2
  energyConsumption: number; // kWh
  waterConsumption: number; // m³
  wasteGenerated: number; // kg
  recyclingRate: number; // %
  renewableEnergyRate: number; // %
  esgScore: number; // 0-100
  certifications: string[];
}

interface DecarbonizationPlan {
  id: string;
  buildingId: string;
  buildingName: string;
  targetYear: number;
  currentEmissions: number;
  targetReduction: number; // %
  status: 'on_track' | 'at_risk' | 'delayed';
  progress: number;
  actions: Array<{
    id: string;
    name: string;
    impact: number; // kg CO2 reducción
    cost: number;
    status: 'pending' | 'in_progress' | 'completed';
    deadline: string;
  }>;
}

export default function ESGPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ESGMetrics | null>(null);
  const [plans, setPlans] = useState<DecarbonizationPlan[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadESGData();
    }
  }, [status, router, selectedPeriod]);

  const loadESGData = async () => {
    try {
      setLoading(true);
      const [metricsRes, plansRes] = await Promise.all([
        fetch(`/api/esg/metrics?period=${selectedPeriod}`),
        fetch('/api/esg/decarbonization-plans'),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }

      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data);
      }
    } catch (error) {
      logger.error('Error loading ESG data:', error);
      toast.error('Error al cargar datos ESG');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (status: string) => {
    const config = {
      on_track: { color: 'bg-green-500', label: 'En Objetivo', icon: CheckCircle2 },
      at_risk: { color: 'bg-yellow-500', label: 'En Riesgo', icon: AlertCircle },
      delayed: { color: 'bg-red-500', label: 'Retrasado', icon: AlertCircle },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.on_track;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const generateReport = async () => {
    try {
      toast.info('Generando reporte CSRD...');
      const response = await fetch('/api/esg/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'csrd', period: selectedPeriod }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-esg-${selectedPeriod}.pdf`;
        a.click();
        toast.success('Reporte generado correctamente');
      } else {
        toast.error('Error al generar reporte');
      }
    } catch (error) {
      logger.error('Error generating report:', error);
      toast.error('Error al generar reporte');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Cargando datos ESG...</p>
              </div>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ESG & Sostenibilidad
                </h1>
                <p className="text-muted-foreground mt-2">
                  Gestión de huella de carbono, planes de descarbonización y reportes CSRD
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={generateReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Reporte CSRD
                </Button>
                <Button onClick={() => router.push('/esg/nuevo-plan')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Plan
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Huella de Carbono</CardTitle>
                      <Leaf className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{(metrics.carbonFootprint / 1000).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">toneladas CO₂</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingDown className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">-12% vs mes anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Consumo Energético</CardTitle>
                      <Zap className="h-4 w-4 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.energyConsumption.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">kWh</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Renovable</span>
                        <span className="font-medium">{metrics.renewableEnergyRate}%</span>
                      </div>
                      <Progress value={metrics.renewableEnergyRate} className="h-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Consumo de Agua</CardTitle>
                      <Droplet className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.waterConsumption}</div>
                    <p className="text-xs text-muted-foreground">m³</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingDown className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-600">-8% vs mes anterior</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Score ESG</CardTitle>
                      <Award className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(metrics.esgScore)}`}>
                      {metrics.esgScore}/100
                    </div>
                    <p className="text-xs text-muted-foreground">Puntuación global</p>
                    <div className="mt-2">
                      <Progress value={metrics.esgScore} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="plans" className="space-y-4">
              <TabsList>
                <TabsTrigger value="plans">Planes de Descarbonización</TabsTrigger>
                <TabsTrigger value="metrics">Métricas Detalladas</TabsTrigger>
                <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
                <TabsTrigger value="benchmarking">Benchmarking</TabsTrigger>
              </TabsList>

              <TabsContent value="plans" className="space-y-4">
                {plans.map((plan) => (
                  <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{plan.buildingName}</CardTitle>
                          <CardDescription>
                            Objetivo: Reducir {plan.targetReduction}% emisiones para {plan.targetYear}
                          </CardDescription>
                        </div>
                        {getStatusBadge(plan.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Emisiones Actuales</p>
                          <p className="text-2xl font-bold">{plan.currentEmissions.toFixed(1)} t</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Objetivo Reducción</p>
                          <p className="text-2xl font-bold text-green-600">-{plan.targetReduction}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Progreso</p>
                          <p className="text-2xl font-bold">{plan.progress}%</p>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium">Progreso General</span>
                          <span className="text-muted-foreground">{plan.progress}%</span>
                        </div>
                        <Progress value={plan.progress} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Acciones del Plan</h4>
                        {plan.actions.slice(0, 3).map((action) => (
                          <div
                            key={action.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  action.status === 'completed'
                                    ? 'bg-green-500'
                                    : action.status === 'in_progress'
                                    ? 'bg-yellow-500'
                                    : 'bg-gray-300'
                                }`}
                              />
                              <div>
                                <p className="text-sm font-medium">{action.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Impacto: -{action.impact} kg CO₂ • Coste: €{action.cost.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={action.status === 'completed' ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {action.status === 'completed'
                                ? 'Completado'
                                : action.status === 'in_progress'
                                ? 'En Progreso'
                                : 'Pendiente'}
                            </Badge>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.push(`/esg/planes/${plan.id}`)}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                        <Button variant="outline" onClick={() => router.push(`/esg/planes/${plan.id}/edit`)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {plans.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Leaf className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No hay planes de descarbonización</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Crea tu primer plan para reducir las emisiones de CO₂
                      </p>
                      <Button onClick={() => router.push('/esg/nuevo-plan')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Plan
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="metrics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas Detalladas de Sostenibilidad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Análisis detallado de métricas ESG próximamente...</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Certificaciones y Sellos Verdes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {metrics && metrics.certifications.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {metrics.certifications.map((cert, index) => (
                          <div key={index} className="flex items-center gap-3 p-4 border rounded-lg">
                            <Award className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="font-semibold">{cert}</p>
                              <p className="text-xs text-muted-foreground">Vigente</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No hay certificaciones registradas</p>
                        <Button className="mt-4" onClick={() => router.push('/esg/certificaciones')}>
                          <Plus className="mr-2 h-4 w-4" />
                          Solicitar Certificación
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="benchmarking" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Comparativa con el Mercado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Benchmarking sostenible con propiedades similares próximamente...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}
