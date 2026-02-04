'use client';

import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Badge } from '@/components/ui/badge';

interface Community {
  id: string;
  nombreComunidad: string;
  direccion: string;
  ciudad?: string;
  activa: boolean;
  building: {
    nombre: string;
    numeroUnidades?: number;
  };
  _count: {
    facturas: number;
    movimientosCaja: number;
    informes: number;
  };
}

export default function ComunidadesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchCommunities();
    }
  }, [status, router]);

  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/admin-fincas/communities');
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (error) {
      logger.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Comunidades Gestionadas</h1>
                <p className="text-muted-foreground mt-1">
                  {communities.length}{' '}
                  {communities.length === 1 ? 'comunidad activa' : 'comunidades activas'}
                </p>
              </div>
              <Button asChild>
                <Link href="/admin-fincas/comunidades/nueva">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Comunidad
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <Card key={community.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">{community.nombreComunidad}</CardTitle>
                      </div>
                      <Badge variant={community.activa ? 'default' : 'secondary'}>
                        {community.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                      <p className="text-sm">{community.direccion}</p>
                      {community.ciudad && (
                        <p className="text-sm text-muted-foreground">{community.ciudad}</p>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Edificio</p>
                      <p className="text-sm">{community.building.nombre}</p>
                      {community.building.numeroUnidades && (
                        <p className="text-sm text-muted-foreground">
                          {community.building.numeroUnidades} unidades
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                      <div className="text-center">
                        <p className="text-lg font-bold">{community._count.facturas}</p>
                        <p className="text-xs text-muted-foreground">Facturas</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{community._count.movimientosCaja}</p>
                        <p className="text-xs text-muted-foreground">Movimientos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{community._count.informes}</p>
                        <p className="text-xs text-muted-foreground">Informes</p>
                      </div>
                    </div>

                    <Button asChild variant="outline" className="w-full mt-3">
                      <Link href={`/admin-fincas/comunidades/${community.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {communities.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay comunidades registradas</h3>
                  <p className="text-muted-foreground mb-4">
                    Comienza añadiendo tu primera comunidad
                  </p>
                  <Button asChild>
                    <Link href="/admin-fincas/comunidades/nueva">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Comunidad
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </AuthenticatedLayout>
  );
}
