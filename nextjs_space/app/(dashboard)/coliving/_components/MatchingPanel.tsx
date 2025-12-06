'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Check, X, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Match {
  profile: any;
  score: number;
  interesesComunes: string[];
}

export default function MatchingPanel() {
  const { data: session } = useSession() || {};
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarMatches();
  }, []);

  const cargarMatches = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coliving/matches?profileId=${session?.user?.profileId}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data);
      }
    } catch (error) {
      logger.error('Error cargando matches:', error);
      toast.error('Error al cargar matches');
    } finally {
      setLoading(false);
    }
  };

  const crearMatch = async (profile2Id: string) => {
    try {
      const res = await fetch('/api/coliving/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile1Id: session?.user?.profileId,
          profile2Id,
          companyId: session?.user?.companyId,
        }),
      });

      if (res.ok) {
        toast.success('Match creado');
        cargarMatches();
      }
    } catch (error) {
      logger.error('Error creando match:', error);
      toast.error('Error al crear match');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Encuentra tu compañero ideal
          </CardTitle>
          <CardDescription>
            Basado en tus intereses, idiomas y preferencias
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Lista de matches sugeridos */}
      <div className="grid gap-6 md:grid-cols-2">
        {matches.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-gray-500">
              No hay matches disponibles. Completa tu perfil para encontrar compañeros compatibles.
            </CardContent>
          </Card>
        ) : (
          matches.map((match, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-lg">
                        {match.profile.tenant.nombreCompleto
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {match.profile.tenant.nombreCompleto}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {match.profile.profesion || 'Coliver'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-sm">
                      {match.score}% compatible
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Bio */}
                {match.profile.bio && (
                  <p className="text-sm text-gray-600">{match.profile.bio}</p>
                )}

                {/* Intereses comunes */}
                {match.interesesComunes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Intereses comunes:</p>
                    <div className="flex flex-wrap gap-2">
                      {match.interesesComunes.map((interes, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {interes}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Idiomas */}
                {match.profile.idiomas && match.profile.idiomas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Idiomas:</p>
                    <div className="flex flex-wrap gap-2">
                      {match.profile.idiomas.map((idioma: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {idioma}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex-1"
                    onClick={() => crearMatch(match.profile.id)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                  <Button variant="outline" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
