'use client';

/**
 * Página de Leaderboard eWoorker
 *
 * Sprint 3: Ranking de empresas por puntos de gamificación
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Trophy, Star, Users, ArrowLeft, Medal } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  empresaId: string;
  empresaNombre: string;
  logo?: string;
  points: number;
  level: {
    level: number;
    name: string;
    icon: string;
  };
}

interface ReferralLeaderboardEntry {
  rank: number;
  empresaId: string;
  empresaNombre: string;
  verifiedReferrals: number;
  totalPoints: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [pointsLeaderboard, setPointsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [referralLeaderboard, setReferralLeaderboard] = useState<ReferralLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      const [pointsRes, referralRes] = await Promise.all([
        fetch('/api/ewoorker/gamification/leaderboard?limit=50'),
        fetch('/api/ewoorker/referrals/leaderboard?limit=20'),
      ]);

      if (pointsRes.ok) {
        const pointsData = await pointsRes.json();
        setPointsLeaderboard(pointsData.leaderboard);
      }

      if (referralRes.ok) {
        const referralData = await referralRes.json();
        setReferralLeaderboard(referralData.leaderboard);
      }
    } catch {
      toast.error('Error cargando rankings');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
      default:
        return 'bg-white';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div className="flex items-center gap-4">
          <Trophy className="h-10 w-10 text-amber-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ranking eWoorker</h1>
            <p className="text-gray-600">Las empresas más activas de la plataforma</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="points" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="points">
            <Star className="h-4 w-4 mr-2" />
            Por Puntos
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Users className="h-4 w-4 mr-2" />
            Por Referidos
          </TabsTrigger>
        </TabsList>

        {/* Ranking por Puntos */}
        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle>Top 50 por Puntos</CardTitle>
              <CardDescription>Empresas con mayor puntuación de gamificación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pointsLeaderboard.length > 0 ? (
                  pointsLeaderboard.map((entry) => (
                    <div
                      key={entry.empresaId}
                      className={`flex items-center justify-between p-4 rounded-lg border ${getRankBg(
                        entry.rank
                      )}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 text-center">{getRankIcon(entry.rank)}</div>
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                          {entry.logo ? (
                            <img
                              src={entry.logo}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            entry.level.icon
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{entry.empresaNombre}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Nivel {entry.level.level}</span>
                            <Badge variant="secondary" className="text-xs">
                              {entry.level.name}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="h-4 w-4" />
                          <span className="font-bold">{entry.points.toLocaleString()}</span>
                        </div>
                        <span className="text-xs text-gray-500">puntos</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No hay datos de ranking aún</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking por Referidos */}
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Top 20 por Referidos</CardTitle>
              <CardDescription>Empresas que más empresas han invitado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {referralLeaderboard.length > 0 ? (
                  referralLeaderboard.map((entry) => (
                    <div
                      key={entry.empresaId}
                      className={`flex items-center justify-between p-4 rounded-lg border ${getRankBg(
                        entry.rank
                      )}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 text-center">{getRankIcon(entry.rank)}</div>
                        <div>
                          <p className="font-semibold">{entry.empresaNombre}</p>
                          <p className="text-sm text-gray-500">
                            {entry.verifiedReferrals} referidos verificados
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-green-600">
                          <Users className="h-4 w-4" />
                          <span className="font-bold">{entry.totalPoints.toLocaleString()}</span>
                        </div>
                        <span className="text-xs text-gray-500">pts ganados</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p>No hay datos de referidos aún</p>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/ewoorker/perfil/referidos')}
                      className="mt-4"
                    >
                      Empezar a Referir
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
