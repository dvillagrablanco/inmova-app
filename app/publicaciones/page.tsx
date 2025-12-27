'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Trash2,
  Globe,
  Calendar as CalendarIcon,
  Building2,
  MapPin,
  Euro,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface Publicacion {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  activa: boolean;
  fechaPublicacion: string;
  fechaExpiracion: string | null;
  portal: string;
  unit: {
    id: string;
    numero: string;
    building: {
      id: string;
      nombre: string;
      direccion: string;
    };
  };
}

export default function PublicacionesPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadPublicaciones();
    }
  }, [session]);

  const loadPublicaciones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/publicaciones');
      if (res.ok) {
        const data = await res.json();
        setPublicaciones(data);
      } else {
        toast.error('Error al cargar publicaciones');
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error loading publicaciones'), {
        context: 'loadPublicaciones',
      });
      toast.error('Error al cargar publicaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActiva = async (id: string, activa: boolean) => {
    try {
      const res = await fetch(`/api/publicaciones/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activa: !activa }),
      });

      if (res.ok) {
        toast.success(`Publicación ${activa ? 'desactivada' : 'activada'}`);
        loadPublicaciones();
      } else {
        toast.error('Error al actualizar publicación');
      }
    } catch (error) {
      toast.error('Error al activar publicación');
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="w-fit"
            >
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
                  <BreadcrumbPage>Publicaciones</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Publicaciones</h1>
              <p className="text-muted-foreground">Gestiona tus anuncios en portales inmobiliarios</p>
            </div>
            <Button onClick={() => router.push('/publicaciones/nueva')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Publicación
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{publicaciones.length}</div>
                <p className="text-xs text-muted-foreground">publicaciones</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {publicaciones.filter((p) => p.activa).length}
                </div>
                <p className="text-xs text-muted-foreground">en portales</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Inactivas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {publicaciones.filter((p) => !p.activa).length}
                </div>
                <p className="text-xs text-muted-foreground">pausadas</p>
              </CardContent>
            </Card>
          </div>

          {publicaciones.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Globe className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay publicaciones</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera publicación en portales inmobiliarios
                </p>
                <Button onClick={() => router.push('/publicaciones/nueva')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Publicación
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {publicaciones.map((pub) => (
                <Card key={pub.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{pub.titulo}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{pub.descripcion}</p>
                      </div>
                      <Badge variant={pub.activa ? 'default' : 'secondary'}>
                        {pub.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Precio</p>
                        <p className="text-lg font-bold text-green-600">€{pub.precio.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Portal</p>
                        <p className="font-medium">{pub.portal}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Publicado</p>
                        <p className="font-medium">
                          {format(new Date(pub.fechaPublicacion), 'dd MMM yyyy', { locale: es })}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expiración</p>
                        <p className="font-medium">
                          {pub.fechaExpiracion
                            ? format(new Date(pub.fechaExpiracion), 'dd MMM yyyy', { locale: es })
                            : 'Sin límite'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>{pub.unit.building.nombre} - Unidad {pub.unit.numero}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{pub.unit.building.direccion}</span>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActiva(pub.id, pub.activa)}
                      >
                        {pub.activa ? 'Desactivar' : 'Activar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/publicaciones/${pub.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
