'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy,
  Star,
  Flame,
  Medal,
  Crown,
  Gift,
  Target,
  Zap,
  TrendingUp,
  Calendar,
  CreditCard,
  Users,
  MessageSquare,
  FileCheck,
  Award,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TenantLevel {
  level: number;
  name: string;
  minPoints: number;
  icon: string;
  color: string;
  benefits: string[];
}

interface TenantAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: { type: string; value: number };
}

interface GamificationProfile {
  tenantId: string;
  tenantName: string;
  points: number;
  level: TenantLevel;
  nextLevel?: TenantLevel;
  progressToNextLevel: number;
  loginStreak: number;
  achievements: { achievement: TenantAchievement; unlockedAt: Date }[];
  recentActivity: any[];
  allAchievements: TenantAchievement[];
  unlockedCount: number;
  totalAchievements: number;
}

const rarityColors = {
  common: 'bg-gray-100 text-gray-800 border-gray-300',
  rare: 'bg-blue-100 text-blue-800 border-blue-300',
  epic: 'bg-purple-100 text-purple-800 border-purple-300',
  legendary: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const rarityGlow = {
  common: '',
  rare: 'ring-2 ring-blue-200',
  epic: 'ring-2 ring-purple-300 shadow-purple-200 shadow-lg',
  legendary: 'ring-2 ring-yellow-400 shadow-yellow-200 shadow-xl animate-pulse',
};

const categoryIcons: Record<string, any> = {
  pagos: CreditCard,
  comunidad: Users,
  perfil: FileCheck,
  social: MessageSquare,
  especial: Award,
};

export default function TenantLogrosPage() {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchProfile();
    registerDailyLogin();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/portal-inquilino/gamification');
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setProfile(data.data);
    } catch (err: any) {
      setError(err.message || 'Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  const registerDailyLogin = async () => {
    try {
      await fetch('/api/portal-inquilino/gamification', {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error registrando login:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">{error || 'Error cargando perfil de gamificación'}</p>
            <Button onClick={fetchProfile} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unlockedIds = profile.achievements.map((a) => a.achievement.id);
  const filteredAchievements =
    selectedCategory === 'all'
      ? profile.allAchievements
      : profile.allAchievements.filter((a) => a.category === selectedCategory);

  const categories = ['all', ...new Set(profile.allAchievements.map((a) => a.category))];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Mis Logros y Recompensas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gana puntos, sube de nivel y desbloquea beneficios exclusivos
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full">
            <Flame className="h-5 w-5" />
            <span className="font-semibold">{profile.loginStreak} días racha</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Nivel Actual */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">Nivel Actual</p>
                <p className="text-3xl font-bold mt-1">{profile.level.name}</p>
                <p className="text-indigo-200 text-sm mt-1">Nivel {profile.level.level}</p>
              </div>
              <span className="text-5xl">{profile.level.icon}</span>
            </div>
          </CardContent>
        </Card>

        {/* Puntos Totales */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Puntos Totales</p>
                <p className="text-3xl font-bold mt-1">{profile.points.toLocaleString()}</p>
                <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />+
                  {profile.recentActivity.reduce((sum, a) => sum + (a.points || 0), 0)} esta semana
                </p>
              </div>
              <Star className="h-12 w-12 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        {/* Logros Desbloqueados */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Logros</p>
                <p className="text-3xl font-bold mt-1">
                  {profile.unlockedCount}/{profile.totalAchievements}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
                  {Math.round((profile.unlockedCount / profile.totalAchievements) * 100)}%
                  completado
                </p>
              </div>
              <Medal className="h-12 w-12 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        {/* Próximo Nivel */}
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-muted-foreground text-sm">Próximo Nivel</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl">{profile.nextLevel?.icon || '👑'}</span>
                <span className="font-bold">{profile.nextLevel?.name || 'Máximo'}</span>
              </div>
              {profile.nextLevel && (
                <>
                  <Progress value={profile.progressToNextLevel} className="mt-3 h-2" />
                  <p className="text-muted-foreground text-xs mt-1">
                    {profile.nextLevel.minPoints - profile.points} puntos restantes
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Beneficios del Nivel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-500" />
            Tus Beneficios de Nivel {profile.level.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {profile.level.benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100"
              >
                <div className="bg-purple-500 text-white p-2 rounded-full">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Todos los Logros
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const Icon = categoryIcons[cat] || Target;
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="capitalize"
                  >
                    {cat === 'all' ? (
                      'Todos'
                    ) : (
                      <>
                        <Icon className="h-4 w-4 mr-1" />
                        {cat}
                      </>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = unlockedIds.includes(achievement.id);

              return (
                <div
                  key={achievement.id}
                  className={cn(
                    'relative p-4 rounded-xl border-2 transition-all duration-300',
                    isUnlocked
                      ? `${rarityColors[achievement.rarity]} ${rarityGlow[achievement.rarity]}`
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  )}
                >
                  {/* Rarity Badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      'absolute top-2 right-2 text-xs capitalize',
                      isUnlocked ? rarityColors[achievement.rarity] : 'bg-gray-200'
                    )}
                  >
                    {achievement.rarity}
                  </Badge>

                  {/* Icon & Name */}
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'text-3xl p-2 rounded-lg',
                        isUnlocked ? 'bg-white/50' : 'grayscale'
                      )}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {achievement.description}
                      </p>
                    </div>
                  </div>

                  {/* Points & Status */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500" />+{achievement.points} pts
                    </span>
                    {isUnlocked ? (
                      <Badge variant="default" className="text-xs bg-green-500">
                        ✓ Desbloqueado
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Bloqueado
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.recentActivity.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay actividad reciente. ¡Empieza a ganar puntos!
            </p>
          ) : (
            <div className="space-y-3">
              {profile.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{activity.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={activity.points > 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {activity.points > 0 ? '+' : ''}
                    {activity.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
