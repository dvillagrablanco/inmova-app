'use client';

/**
 * Página de Logros y Gamificación eWoorker
 *
 * Sprint 3: Sistema de gamificación con puntos, niveles y logros
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Star,
  Medal,
  Target,
  Flame,
  TrendingUp,
  Crown,
  ArrowUp,
  Clock,
  Award,
} from 'lucide-react';

interface Level {
  level: number;
  name: string;
  minPoints: number;
  icon: string;
  benefits: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: string;
}

interface GamificationProfile {
  points: number;
  level: Level;
  nextLevel: Level | null;
  progressToNextLevel: number;
  achievements: { achievement: Achievement; unlockedAt: Date }[];
  recentActivity: { action: string; points: number; createdAt: Date }[];
  rank?: number;
}

const RARITY_COLORS: Record<string, string> = {
  COMUN: 'bg-gray-100 text-gray-800',
  RARO: 'bg-blue-100 text-blue-800',
  EPICO: 'bg-purple-100 text-purple-800',
  LEGENDARIO: 'bg-yellow-100 text-yellow-800',
};

export default function LogrosPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/ewoorker/gamification/profile');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setProfile(data.profile);
    } catch {
      toast.error('Error cargando perfil de gamificación');
    } finally {
      setLoading(false);
    }
  };

  const registerDailyLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch('/api/ewoorker/gamification/profile', { method: 'POST' });
      const data = await res.json();

      if (data.loginResult.points > 0) {
        toast.success(
          `🔥 +${data.loginResult.points} puntos! Racha: ${data.loginResult.streak} días`
        );
        if (data.loginResult.bonus > 0) {
          toast.success(`🎉 ¡Bonus de racha! +${data.loginResult.bonus} puntos extra`);
        }
        fetchProfile();
      } else {
        toast.info('Ya has registrado tu login de hoy');
      }
    } catch {
      toast.error('Error registrando login');
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>No se pudo cargar el perfil de gamificación</p>
            <Button onClick={() => router.push('/ewoorker/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header con nivel actual */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Logros</h1>
            <p className="text-gray-600">Tu progreso en eWoorker</p>
          </div>
          <Button onClick={registerDailyLogin} disabled={loginLoading}>
            <Flame className="h-4 w-4 mr-2" />
            {loginLoading ? 'Registrando...' : 'Registrar Login Diario'}
          </Button>
        </div>
      </div>

      {/* Tarjeta de Nivel Principal */}
      <Card className="mb-8 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-6xl">{profile.level.icon}</div>
              <div>
                <p className="text-sm opacity-80">Nivel {profile.level.level}</p>
                <h2 className="text-3xl font-bold">{profile.level.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="h-5 w-5" />
                  <span className="text-xl font-semibold">
                    {profile.points.toLocaleString()} puntos
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              {profile.rank && (
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5" />
                  <span className="text-lg">Ranking #{profile.rank}</span>
                </div>
              )}
              <Badge variant="secondary" className="bg-white/20 text-white">
                {profile.achievements.length} logros
              </Badge>
            </div>
          </div>

          {/* Progreso al siguiente nivel */}
          {profile.nextLevel && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>Progreso a {profile.nextLevel.name}</span>
                <span>{profile.progressToNextLevel}%</span>
              </div>
              <Progress value={profile.progressToNextLevel} className="h-3 bg-white/20" />
              <p className="text-xs mt-1 opacity-80">
                Faltan {(profile.nextLevel.minPoints - profile.points).toLocaleString()} puntos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs de contenido */}
      <Tabs defaultValue="achievements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">
            <Trophy className="h-4 w-4 mr-2" />
            Logros
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="h-4 w-4 mr-2" />
            Actividad
          </TabsTrigger>
          <TabsTrigger value="benefits">
            <Award className="h-4 w-4 mr-2" />
            Beneficios
          </TabsTrigger>
        </TabsList>

        {/* Tab de Logros */}
        <TabsContent value="achievements">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profile.achievements.length > 0 ? (
              profile.achievements.map(({ achievement }) => (
                <Card key={achievement.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{achievement.name}</h3>
                          <Badge className={RARITY_COLORS[achievement.rarity]}>
                            {achievement.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-amber-600">
                          <Star className="h-4 w-4" />
                          <span className="text-sm font-medium">+{achievement.points} pts</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center py-12">
                  <Medal className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">Sin logros aún</h3>
                  <p className="text-gray-500">Completa acciones para desbloquear logros</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab de Actividad */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones que te dieron puntos</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {profile.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <ArrowUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{activity.action.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        +{activity.points} pts
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Sin actividad reciente</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Beneficios */}
        <TabsContent value="benefits">
          <Card>
            <CardHeader>
              <CardTitle>Tus Beneficios de Nivel {profile.level.level}</CardTitle>
              <CardDescription>Ventajas de ser {profile.level.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {profile.level.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="p-1 bg-amber-100 rounded-full">
                      <Target className="h-4 w-4 text-amber-600" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {profile.nextLevel && (
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    Próximo nivel: {profile.nextLevel.icon} {profile.nextLevel.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">Desbloquearás:</p>
                  <ul className="space-y-2">
                    {profile.nextLevel.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botón para ver leaderboard */}
      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => router.push('/ewoorker/leaderboard')}>
          <Crown className="h-4 w-4 mr-2" />
          Ver Ranking Completo
        </Button>
      </div>
    </div>
  );
}
