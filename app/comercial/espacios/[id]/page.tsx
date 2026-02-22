'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, MapPin, Ruler, Euro, Calendar, User } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface CommercialSpace {
  id: string;
  nombre: string;
  tipo: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  superficie?: number;
  superficieConstruida?: number;
  superficieUtil?: number;
  estado: string;
  rentaMensualBase?: number;
  building?: { nombre: string; direccion: string };
  commercialLeases?: any[];
  notas?: string;
}

export default function EspacioDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [space, setSpace] = useState<CommercialSpace | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!id || !session) return;
    (async () => {
      try {
        const res = await fetch(`/api/comercial/spaces/${id}`);
        if (res.ok) {
          const data = await res.json();
          setSpace(data);
        } else {
          toast.error('Espacio no encontrado');
        }
      } catch {
        toast.error('Error al cargar el espacio');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, session]);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const tipoLabels: Record<string, string> = {
    oficina_privada: 'Oficina Privada',
    oficina_abierta: 'Oficina Abierta',
    local_comercial: 'Local Comercial',
    nave_industrial: 'Nave Industrial',
    almacen: 'Almacén',
    coworking_hot_desk: 'Coworking Hot Desk',
    coworking_dedicated: 'Coworking Dedicado',
    coworking_office: 'Oficina Coworking',
    sala_reuniones: 'Sala de Reuniones',
    showroom: 'Showroom',
    taller: 'Taller',
  };

  const estadoColors: Record<string, string> = {
    disponible: 'bg-green-500',
    ocupada: 'bg-blue-500',
    reservada: 'bg-amber-500',
    mantenimiento: 'bg-red-500',
  };

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/comercial">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{space?.nombre || 'Espacio Comercial'}</h1>
            <p className="text-muted-foreground">{space?.direccion}, {space?.ciudad}</p>
          </div>
          {space?.estado && (
            <Badge className={`${estadoColors[space.estado] || 'bg-gray-500'} text-white`}>
              {space.estado.charAt(0).toUpperCase() + space.estado.slice(1)}
            </Badge>
          )}
        </div>

        {!space ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Espacio comercial no encontrado
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium">{tipoLabels[space.tipo] || space.tipo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <Badge variant="outline">{space.estado}</Badge>
                </div>
                {space.building && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edificio</span>
                    <span className="font-medium">{space.building.nombre}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dirección</span>
                  <span className="font-medium text-right">{space.direccion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ciudad</span>
                  <span>{space.ciudad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provincia</span>
                  <span>{space.provincia}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ruler className="h-5 w-5" /> Superficie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {space.superficieConstruida && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Construida</span>
                    <span className="font-medium">{space.superficieConstruida} m²</span>
                  </div>
                )}
                {space.superficieUtil && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Útil</span>
                    <span className="font-medium">{space.superficieUtil} m²</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Euro className="h-5 w-5" /> Economía
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {space.rentaMensualBase != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renta mensual base</span>
                    <span className="font-medium text-green-600">
                      {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(space.rentaMensualBase)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
