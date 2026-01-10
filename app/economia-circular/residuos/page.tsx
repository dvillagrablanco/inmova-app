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
import {
  ArrowLeft,
  Recycle,
  Trash2,
  Leaf,
  Trophy,
  TrendingUp,
  Target,
  Award,
  Calendar,
  BarChart3,
} from 'lucide-react';
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
  PieChart,
  Pie,
  Cell,
} from '@/components/ui/lazy-charts-extended';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

interface WasteStats {
  totalRecycled: number;
  recyclingRate: number;
  co2Saved: number;
  monthlyData: Array<{ month: string; recycled: number; total: number }>;
  wasteByType: Array<{ type: string; amount: number }>;
  buildingRanking: Array<{ name: string; rate: number; position: number }>;
}

export default function GestionResiduosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WasteStats | null>(null);
  const [userPoints, setUserPoints] = useState(0);
  const [userBadges, setUserBadges] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/circular-economy/waste/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUserPoints(data.userPoints || 0);
        setUserBadges(data.userBadges || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  // Default stats if none loaded
  const displayStats: WasteStats = stats || {
    totalRecycled: 0,
    recyclingRate: 0,
    co2Saved: 0,
    monthlyData: [],
    wasteByType: [],
    buildingRanking: [],
  };

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Recycle className="h-8 w-8 text-green-600" />
              Gestión de Residuos
            </h1>
            <p className="text-muted-foreground mt-1">
              Métricas de reciclaje y gamificación sostenible
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Recycle className="h-4 w-4 text-green-600" />
                Total Reciclado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.totalRecycled} kg</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Tasa de Reciclaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.recyclingRate}%</div>
              <Progress value={displayStats.recyclingRate} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Leaf className="h-4 w-4 text-emerald-600" />
                CO₂ Ahorrado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayStats.co2Saved} kg</div>
              <p className="text-xs text-muted-foreground">Huella reducida</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-purple-600" />
                Tus Puntos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{userPoints}</div>
              <p className="text-xs text-muted-foreground">
                {userBadges.length} insignias ganadas
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
            <TabsTrigger value="ranking">
              <Trophy className="h-4 w-4 mr-2" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="gamification">
              <Award className="h-4 w-4 mr-2" />
              Gamificación
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Evolution */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolución Mensual</CardTitle>
                </CardHeader>
                <CardContent>
                  {displayStats.monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={displayStats.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="recycled"
                          stroke="#10B981"
                          name="Reciclado (kg)"
                        />
                        <Line
                          type="monotone"
                          dataKey="total"
                          stroke="#94A3B8"
                          name="Total (kg)"
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Waste by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  {displayStats.wasteByType.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={displayStats.wasteByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, amount }) => `${type}: ${amount}kg`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {displayStats.wasteByType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No hay datos disponibles
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tips */}
            <Card className="bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">💡 Consejos de Reciclaje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg">
                    <h4 className="font-semibold text-green-700 mb-2">Plásticos</h4>
                    <p className="text-sm text-gray-600">
                      Vacía y enjuaga los envases. No incluyas plásticos de un solo uso como
                      bolsas de patatas.
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <h4 className="font-semibold text-blue-700 mb-2">Papel y Cartón</h4>
                    <p className="text-sm text-gray-600">
                      Aplasta las cajas para ahorrar espacio. No incluyas papel manchado de
                      comida.
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <h4 className="font-semibold text-yellow-700 mb-2">Vidrio</h4>
                    <p className="text-sm text-gray-600">
                      Retira tapas y corchos. No incluyas espejos, bombillas o vajilla de
                      cristal.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ranking Tab */}
          <TabsContent value="ranking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Ranking de Edificios
                </CardTitle>
                <CardDescription>
                  Clasificación por tasa de reciclaje este mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {displayStats.buildingRanking.length > 0 ? (
                  <div className="space-y-3">
                    {displayStats.buildingRanking.map((building, index) => (
                      <div
                        key={building.name}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : index === 1
                                ? 'bg-gray-100 text-gray-800'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-muted'
                          }`}
                        >
                          {building.position}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{building.name}</p>
                          <Progress value={building.rate} className="h-2 mt-1" />
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{building.rate}%</p>
                          <p className="text-xs text-muted-foreground">tasa reciclaje</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de ranking disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gamification Tab */}
          <TabsContent value="gamification" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Points */}
              <Card>
                <CardHeader>
                  <CardTitle>Sistema de Puntos</CardTitle>
                  <CardDescription>Gana puntos reciclando correctamente</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Tus puntos</p>
                      <p className="text-4xl font-bold text-purple-600">{userPoints}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Siguiente nivel: {Math.ceil(userPoints / 100) * 100 + 100} pts
                      </p>
                      <Progress
                        value={(userPoints % 100)}
                        className="h-2 mt-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold">Cómo ganar puntos:</h4>
                      <ul className="space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="text-green-600">+10 pts</span>
                          <span>Por cada kg de plástico reciclado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-blue-600">+5 pts</span>
                          <span>Por cada kg de papel reciclado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-yellow-600">+8 pts</span>
                          <span>Por cada kg de vidrio reciclado</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-purple-600">+50 pts</span>
                          <span>Racha de 7 días reciclando</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>Insignias</CardTitle>
                  <CardDescription>Desbloquea logros por tu compromiso</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        id: 'first_recycle',
                        name: 'Primer Reciclaje',
                        icon: '🌱',
                        unlocked: userBadges.includes('first_recycle'),
                      },
                      {
                        id: 'week_streak',
                        name: 'Racha Semanal',
                        icon: '🔥',
                        unlocked: userBadges.includes('week_streak'),
                      },
                      {
                        id: 'eco_warrior',
                        name: 'Eco Warrior',
                        icon: '🦸',
                        unlocked: userBadges.includes('eco_warrior'),
                      },
                      {
                        id: '100kg',
                        name: '100kg Club',
                        icon: '💯',
                        unlocked: userBadges.includes('100kg'),
                      },
                      {
                        id: 'plastic_free',
                        name: 'Plastic Free',
                        icon: '🚫',
                        unlocked: userBadges.includes('plastic_free'),
                      },
                      {
                        id: 'community_leader',
                        name: 'Líder Comunidad',
                        icon: '👑',
                        unlocked: userBadges.includes('community_leader'),
                      },
                    ].map((badge) => (
                      <div
                        key={badge.id}
                        className={`p-4 rounded-lg text-center ${
                          badge.unlocked ? 'bg-green-50' : 'bg-muted opacity-50'
                        }`}
                      >
                        <span className="text-3xl">{badge.icon}</span>
                        <p className="text-xs font-medium mt-2">{badge.name}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rewards */}
            <Card>
              <CardHeader>
                <CardTitle>Canjea tus Puntos</CardTitle>
                <CardDescription>
                  Usa tus puntos para obtener descuentos y beneficios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🎁</span>
                      <Badge>500 pts</Badge>
                    </div>
                    <h4 className="font-semibold">5€ descuento</h4>
                    <p className="text-sm text-muted-foreground">En tu próxima factura</p>
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      disabled={userPoints < 500}
                    >
                      Canjear
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🌳</span>
                      <Badge>1000 pts</Badge>
                    </div>
                    <h4 className="font-semibold">Planta un árbol</h4>
                    <p className="text-sm text-muted-foreground">
                      Plantamos un árbol a tu nombre
                    </p>
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      disabled={userPoints < 1000}
                    >
                      Canjear
                    </Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">🏆</span>
                      <Badge>2000 pts</Badge>
                    </div>
                    <h4 className="font-semibold">Mes de huerto gratis</h4>
                    <p className="text-sm text-muted-foreground">
                      Un mes de parcela en el huerto
                    </p>
                    <Button
                      className="w-full mt-3"
                      size="sm"
                      disabled={userPoints < 2000}
                    >
                      Canjear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
