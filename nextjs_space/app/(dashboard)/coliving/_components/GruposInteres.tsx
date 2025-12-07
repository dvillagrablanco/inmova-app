'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Group {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  icono?: string;
  imagen?: string;
  esPublico: boolean;
  maxMiembros?: number;
  _count: {
    miembros: number;
    eventos: number;
  };
}

export default function GruposInteres() {
  const { data: session } = useSession() || {};
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coliving/groups?companyId=${session?.user?.companyId}`);
      if (res.ok) {
        const data = await res.json();
        setGrupos(data);
      }
    } catch (error) {
      logger.error('Error cargando grupos:', error);
      toast.error('Error al cargar grupos');
    } finally {
      setLoading(false);
    }
  };

  const unirseGrupo = async (groupId: string) => {
    try {
      const res = await fetch(`/api/coliving/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: session?.user?.profileId,
        }),
      });

      if (res.ok) {
        toast.success('Te has unido al grupo');
        cargarGrupos();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al unirse al grupo');
      }
    } catch (error) {
      logger.error('Error uniéndose al grupo:', error);
      toast.error('Error al unirse al grupo');
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const colores: Record<string, string> = {
      yoga: 'bg-purple-100 text-purple-700',
      networking: 'bg-blue-100 text-blue-700',
      cocina: 'bg-orange-100 text-orange-700',
      deportes: 'bg-green-100 text-green-700',
      cultura: 'bg-pink-100 text-pink-700',
      tech: 'bg-indigo-100 text-indigo-700',
    };
    return colores[categoria.toLowerCase()] || 'bg-gray-100 text-gray-700';
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
            <Users className="h-5 w-5" />
            Grupos de Interés
          </CardTitle>
          <CardDescription>
            Únete a grupos afines a tus intereses y conoce personas con gustos similares
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Lista de grupos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {grupos.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center text-gray-500">
              No hay grupos disponibles aún.
            </CardContent>
          </Card>
        ) : (
          grupos.map((grupo) => (
            <Card key={grupo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Imagen del grupo */}
              {grupo.imagen && (
                <div className="aspect-video relative bg-gradient-to-br from-purple-100 to-pink-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={grupo.imagen}
                    alt={grupo.nombre}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              {!grupo.imagen && (
                <div className="aspect-video relative bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <span className="text-6xl">{grupo.icono || '👥'}</span>
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-lg">{grupo.nombre}</CardTitle>
                  <Badge className={getCategoriaColor(grupo.categoria)}>{grupo.categoria}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{grupo.descripcion}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Estadísticas */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {grupo._count.miembros}
                      {grupo.maxMiembros ? `/${grupo.maxMiembros}` : ''} miembros
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    <span>{grupo._count.eventos} eventos</span>
                  </div>
                </div>

                {/* Botón de unión */}
                <Button
                  className="w-full"
                  onClick={() => unirseGrupo(grupo.id)}
                  disabled={grupo.maxMiembros ? grupo._count.miembros >= grupo.maxMiembros : false}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Unirse al grupo
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
