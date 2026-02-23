'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wrench, Building2, Home, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MaintenanceRequest {
  id: string;
  titulo: string;
  descripcion: string;
  prioridad: string;
  estado: string;
  fechaSolicitud: string;
  fechaResolucion?: string;
  notas?: string;
  unit?: {
    numero: string;
    building?: { nombre: string; direccion: string };
  };
}

export default function MantenimientoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const id = params.id as string;

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!id || !session) return;
    (async () => {
      try {
        const res = await fetch(`/api/maintenance/${id}`);
        if (res.ok) {
          setRequest(await res.json());
        } else {
          toast.error('Solicitud no encontrada');
        }
      } catch {
        toast.error('Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, session]);

  const prioridadConfig: Record<string, { color: string; icon: any }> = {
    baja: { color: 'bg-blue-500', icon: Clock },
    media: { color: 'bg-amber-500', icon: AlertTriangle },
    alta: { color: 'bg-orange-500', icon: AlertTriangle },
    urgente: { color: 'bg-red-600', icon: AlertTriangle },
  };

  const estadoConfig: Record<string, { color: string; label: string }> = {
    pendiente: { color: 'bg-amber-500', label: 'Pendiente' },
    en_progreso: { color: 'bg-blue-500', label: 'En Progreso' },
    resuelta: { color: 'bg-green-500', label: 'Resuelta' },
    cancelada: { color: 'bg-gray-400', label: 'Cancelada' },
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const prio = prioridadConfig[request?.prioridad || 'media'] || prioridadConfig.media;
  const estado = estadoConfig[request?.estado || 'pendiente'] || estadoConfig.pendiente;
  const PrioIcon = prio.icon;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/mantenimiento">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{request?.titulo || 'Solicitud de Mantenimiento'}</h1>
            <p className="text-muted-foreground">#{id.substring(0, 8)}</p>
          </div>
          {request && (
            <div className="flex gap-2">
              <Badge className={`${prio.color} text-white`}>
                <PrioIcon className="h-3 w-3 mr-1" />
                {(request.prioridad || 'media').charAt(0).toUpperCase() + (request.prioridad || 'media').slice(1)}
              </Badge>
              <Badge className={`${estado.color} text-white`}>
                {estado.label}
              </Badge>
            </div>
          )}
        </div>

        {!request ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Solicitud de mantenimiento no encontrada
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" /> Descripción
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{request.descripcion}</p>
                {request.notas && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-500 mb-1">Notas</p>
                    <p className="text-sm">{request.notas}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5" /> Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.unit?.building && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Edificio</span>
                    <span className="font-medium">{request.unit.building.nombre}</span>
                  </div>
                )}
                {request.unit && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Unidad</span>
                    <span className="font-medium">{request.unit.numero}</span>
                  </div>
                )}
                {request.unit?.building?.direccion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dirección</span>
                    <span className="text-right text-sm">{request.unit.building.direccion}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" /> Fechas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha solicitud</span>
                  <span>{request.fechaSolicitud ? format(new Date(request.fechaSolicitud), 'dd MMM yyyy HH:mm', { locale: es }) : '-'}</span>
                </div>
                {request.fechaResolucion && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha resolución</span>
                    <span className="text-green-600">{format(new Date(request.fechaResolucion), 'dd MMM yyyy', { locale: es })}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.estado === 'pendiente' && (
                  <Button className="w-full" onClick={async () => {
                    await fetch(`/api/maintenance/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estado: 'en_progreso' }),
                    });
                    toast.success('Marcado como en progreso');
                    router.refresh();
                    window.location.reload();
                  }}>
                    Marcar En Progreso
                  </Button>
                )}
                {request.estado === 'en_progreso' && (
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={async () => {
                    await fetch(`/api/maintenance/${id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ estado: 'resuelta', fechaResolucion: new Date().toISOString() }),
                    });
                    toast.success('Marcado como resuelto');
                    router.refresh();
                    window.location.reload();
                  }}>
                    <CheckCircle className="h-4 w-4 mr-2" /> Marcar Resuelta
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
