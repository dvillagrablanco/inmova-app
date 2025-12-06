import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Star, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface SpaceRating {
  id: string;
  puntuacion: number;
  comentario: string | null;
  fechaRating: string;
  tenant: {
    nombre: string;
    apellidos: string;
  };
}

interface WaitlistEntry {
  id: string;
  fechaDeseada: string;
  horaInicio: string;
  horaFin: string;
  prioridad: number;
  tenant: {
    nombre: string;
    apellidos: string;
    email: string;
  };
}

interface MaintenancePrediction {
  id: string;
  periodo: string;
  indiceDesgaste: number;
  mantenimientoSugerido: boolean;
  tipoMantenimientoSugerido: string | null;
  fechaSugeridaMantenimiento: string | null;
  descripcionRecomendacion: string | null;
  nivelUrgencia: string;
  space: {
    nombre: string;
    tipo: string;
  };
}

export default function SpacesManagement() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { spaceId } = router.query;

  const [ratings, setRatings] = useState<{ ratings: SpaceRating[], promedio: number, total: number } | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [maintenancePredictions, setMaintenancePredictions] = useState<MaintenancePrediction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMaintenancePredictions();
    }
  }, [status]);

  useEffect(() => {
    if (spaceId && status === 'authenticated') {
      fetchRatings();
      fetchWaitlist();
    }
  }, [spaceId, status]);

  const fetchRatings = async () => {
    try {
      const response = await fetch(`/api/coliving/spaces/ratings?spaceId=${spaceId}`);
      if (response.ok) {
        const data = await response.json();
        setRatings(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchWaitlist = async () => {
    try {
      const response = await fetch(`/api/coliving/spaces/waitlist?spaceId=${spaceId}`);
      if (response.ok) {
        const data = await response.json();
        setWaitlist(data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchMaintenancePredictions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coliving/spaces/maintenance');
      if (response.ok) {
        const data = await response.json();
        setMaintenancePredictions(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertWaitlistToReservation = async (waitlistId: string) => {
    try {
      const response = await fetch('/api/coliving/spaces/waitlist-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waitlistId }),
      });

      if (response.ok) {
        toast.success('¡Reserva creada exitosamente!');
        fetchWaitlist();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear reserva');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear reserva');
    }
  };

  const markMaintenanceAlertSent = async (predictionId: string) => {
    try {
      const response = await fetch('/api/coliving/spaces/maintenance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predictionId }),
      });

      if (response.ok) {
        toast.success('Alerta marcada como enviada');
        fetchMaintenancePredictions();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar alerta');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Espacios Compartidos</h1>
        <p className="text-muted-foreground">
          Sistema avanzado de reservas, ratings y mantenimiento predictivo
        </p>
      </div>

      <Tabs defaultValue="ratings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ratings">Ratings y Reseñas</TabsTrigger>
          <TabsTrigger value="waitlist">Cola de Espera</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento Predictivo</TabsTrigger>
        </TabsList>

        {/* Ratings Tab */}
        <TabsContent value="ratings" className="space-y-4">
          {!spaceId ? (
            <Card>
              <CardHeader>
                <CardTitle>Selecciona un espacio</CardTitle>
                <CardDescription>
                  Selecciona un espacio para ver sus ratings y reseñas
                </CardDescription>
              </CardHeader>
            </Card>
          ) : ratings ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Valoraciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-5xl font-bold">{ratings.promedio.toFixed(1)}</p>
                      <div className="flex gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(ratings.promedio)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {ratings.total} valoraciones
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {ratings.ratings.map((rating) => (
                  <Card key={rating.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {rating.tenant.nombre} {rating.tenant.apellidos}
                        </CardTitle>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.puntuacion
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <CardDescription>
                        {new Date(rating.fechaRating).toLocaleDateString('es-ES')}
                      </CardDescription>
                    </CardHeader>
                    {rating.comentario && (
                      <CardContent>
                        <p className="text-sm">{rating.comentario}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Waitlist Tab */}
        <TabsContent value="waitlist" className="space-y-4">
          {!spaceId ? (
            <Card>
              <CardHeader>
                <CardTitle>Selecciona un espacio</CardTitle>
                <CardDescription>
                  Selecciona un espacio para ver su cola de espera
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4">
              {waitlist.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Sin solicitudes en cola</CardTitle>
                    <CardDescription>
                      No hay tenants en cola de espera para este espacio
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                waitlist.map((entry) => (
                  <Card key={entry.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            {entry.tenant.nombre} {entry.tenant.apellidos}
                          </CardTitle>
                          <CardDescription>{entry.tenant.email}</CardDescription>
                        </div>
                        <Badge variant="outline">Prioridad: {entry.prioridad}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm space-y-1">
                          <p>
                            <Clock className="inline h-4 w-4 mr-1" />
                            {new Date(entry.fechaDeseada).toLocaleDateString('es-ES')}
                          </p>
                          <p className="text-muted-foreground">
                            {entry.horaInicio} - {entry.horaFin}
                          </p>
                        </div>
                        <Button
                          onClick={() => convertWaitlistToReservation(entry.id)}
                          size="sm"
                        >
                          Convertir a Reserva
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </CardContent>
            </Card>
          ) : maintenancePredictions.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <CheckCircle className="inline h-5 w-5 mr-2 text-green-500" />
                  Sin alertas de mantenimiento
                </CardTitle>
                <CardDescription>
                  Todos los espacios están en buen estado
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4">
              {maintenancePredictions.map((prediction) => (
                <Card
                  key={prediction.id}
                  className={`${
                    prediction.nivelUrgencia === 'alta'
                      ? 'border-red-500'
                      : prediction.nivelUrgencia === 'media'
                      ? 'border-yellow-500'
                      : 'border-gray-300'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {prediction.space.nombre}
                        </CardTitle>
                        <CardDescription className="capitalize">
                          Tipo: {prediction.space.tipo}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          prediction.nivelUrgencia === 'alta'
                            ? 'destructive'
                            : prediction.nivelUrgencia === 'media'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {prediction.nivelUrgencia.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Índice de Desgaste</span>
                        <span className="font-medium">{prediction.indiceDesgaste}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            prediction.indiceDesgaste > 80
                              ? 'bg-red-500'
                              : prediction.indiceDesgaste > 60
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${prediction.indiceDesgaste}%` }}
                        />
                      </div>
                    </div>

                    {prediction.descripcionRecomendacion && (
                      <div className="text-sm">
                        <p className="font-medium mb-1">Recomendación:</p>
                        <p className="text-muted-foreground">
                          {prediction.descripcionRecomendacion}
                        </p>
                      </div>
                    )}

                    {prediction.fechaSugeridaMantenimiento && (
                      <div className="text-sm">
                        <p className="font-medium">Fecha sugerida:</p>
                        <p className="text-muted-foreground">
                          {new Date(prediction.fechaSugeridaMantenimiento).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => markMaintenanceAlertSent(prediction.id)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Marcar como Enviada
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
