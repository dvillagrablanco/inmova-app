'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Share2, Plus, Search, Globe, CheckCircle2, Clock, AlertCircle,
  ExternalLink, Building2, Home, Eye, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Publication {
  id: string;
  unitName: string;
  address: string;
  portals: Array<{ name: string; status: 'published' | 'pending' | 'error'; url?: string }>;
  price: number;
  views: number;
  leads: number;
  publishedAt: string;
}

const portalColors: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
};

const portalIcons: Record<string, any> = {
  published: CheckCircle2,
  pending: Clock,
  error: AlertCircle,
};

export default function PublicacionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [publications] = useState<Publication[]>([]);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Share2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Publicaciones Multi-portal</h1>
              <p className="text-muted-foreground">Publica tus propiedades en Idealista, Fotocasa, Habitaclia y mas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => toast.info('Sincronizando portales...')}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600" onClick={() => toast.info('Selecciona una propiedad para publicar')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Publicacion
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Publicadas</p>
                  <p className="text-2xl font-bold">{publications.length}</p>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portales</p>
                  <p className="text-2xl font-bold">4</p>
                </div>
                <Share2 className="h-8 w-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visitas totales</p>
                  <p className="text-2xl font-bold">{publications.reduce((s, p) => s + p.views, 0)}</p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Leads generados</p>
                  <p className="text-2xl font-bold">{publications.reduce((s, p) => s + p.leads, 0)}</p>
                </div>
                <Building2 className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar publicaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Portales disponibles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Portales Inmobiliarios Conectados</CardTitle>
            <CardDescription>Estado de la conexion con cada portal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Idealista', status: 'Disponible', color: 'text-green-600' },
                { name: 'Fotocasa', status: 'Disponible', color: 'text-green-600' },
                { name: 'Habitaclia', status: 'Disponible', color: 'text-green-600' },
                { name: 'pisos.com', status: 'Proximamente', color: 'text-amber-600' },
              ].map((portal) => (
                <div key={portal.name} className="flex items-center gap-3 p-4 border rounded-lg">
                  <Globe className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{portal.name}</p>
                    <p className={`text-sm ${portal.color}`}>{portal.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Empty state */}
        {publications.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Share2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Sin publicaciones activas</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Publica tus propiedades disponibles en los principales portales inmobiliarios de Espana con un solo clic.
              </p>
              <Button onClick={() => toast.info('Selecciona una propiedad para publicar')}>
                <Plus className="h-4 w-4 mr-2" />
                Publicar Propiedad
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Publications list */}
        {publications.length > 0 && (
          <div className="grid gap-4">
            {publications.map((pub) => (
              <Card key={pub.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Home className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{pub.unitName}</h3>
                        <p className="text-sm text-muted-foreground">{pub.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pub.portals.map((portal) => {
                        const StatusIcon = portalIcons[portal.status];
                        return (
                          <Badge key={portal.name} className={portalColors[portal.status]}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {portal.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                    <span>{pub.price.toLocaleString('es-ES')}€/mes</span>
                    <span>{pub.views} visitas</span>
                    <span>{pub.leads} leads</span>
                    <span>Publicado: {new Date(pub.publishedAt).toLocaleDateString('es-ES')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
