'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  DollarSign,
  BarChart3,
  Calendar,
  Zap,
  Target,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default function RevenueManagementPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [revenueData, setRevenueData] = useState({
    totalRevenue: 45280,
    monthlyGrowth: 12.5,
    averageNightlyRate: 127,
    revPAR: 98,
    occupancyRate: 77,
    adr: 135,
  });

  const [strategies, setStrategies] = useState([
    { id: '1', name: 'Temporada Alta', type: 'alta', active: true, listings: 8, avgIncrease: 30 },
    {
      id: '2',
      name: 'Last Minute',
      type: 'last_minute',
      active: true,
      listings: 12,
      avgIncrease: -10,
    },
    { id: '3', name: 'Early Bird', type: 'early_bird', active: false, listings: 5, avgIncrease: 5 },
  ]);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Revenue Management</h1>
              <p className="text-muted-foreground">Optimización automática de precios e ingresos</p>
            </div>
            <Button onClick={() => router.push('/str-advanced')}>Volver al Dashboard</Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="strategies">Estrategias</TabsTrigger>
            <TabsTrigger value="pricing">Precios Dinámicos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    €{revenueData.totalRevenue.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <ArrowUp className="h-3 w-3 mr-1" />+{revenueData.monthlyGrowth}% vs mes
                    anterior
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">RevPAR</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">€{revenueData.revPAR}</div>
                  <p className="text-xs text-muted-foreground mt-1">Revenue per Available Room</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">ADR</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">€{revenueData.adr}</div>
                  <p className="text-xs text-muted-foreground mt-1">Average Daily Rate</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Ingresos */}
            <Card>
              <CardHeader>
                <CardTitle>Evolución de Ingresos</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-8 rounded-lg text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Gráfico de ingresos se mostrará aquí</p>
                  <p className="text-sm">Comparativa mensual con tendencias y proyecciones</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategies" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Estrategias de Pricing</CardTitle>
                    <CardDescription>Reglas automáticas de ajuste de precios</CardDescription>
                  </div>
                  <Button>
                    <Zap className="h-4 w-4 mr-2" />
                    Nueva Estrategia
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {strategies.map((strategy) => (
                    <Card key={strategy.id} className="border-2">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{strategy.name}</h3>
                              <Badge variant={strategy.active ? 'default' : 'secondary'}>
                                {strategy.active ? 'Activa' : 'Inactiva'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Propiedades</span>
                                <p className="font-medium">{strategy.listings}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Tipo</span>
                                <p className="font-medium capitalize">
                                  {strategy.type.replace('_', ' ')}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Ajuste Promedio</span>
                                <p
                                  className={`font-medium ${strategy.avgIncrease > 0 ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {strategy.avgIncrease > 0 ? '+' : ''}
                                  {strategy.avgIncrease}%
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                            <Button variant={strategy.active ? 'destructive' : 'default'} size="sm">
                              {strategy.active ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Simulador de Precios Dinámicos</CardTitle>
                <CardDescription>
                  Calcula el precio óptimo basado en múltiples factores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-8 rounded-lg text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Simulador de precios dinámicos</p>
                  <p className="text-sm">Introduce los parámetros para calcular el precio óptimo</p>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Configurar Temporadas
                  </Button>
                  <Button variant="outline" className="w-full">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Análisis Competencia
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
