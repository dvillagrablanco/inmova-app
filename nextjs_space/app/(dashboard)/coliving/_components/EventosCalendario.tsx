'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Event {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  fecha: string;
  duracion: number;
  ubicacion: string;
  capacidad?: number;
  costo?: number;
  imagen?: string;
  _count: {
    asistentes: number;
  };
}

export default function EventosCalendario() {
  const { data: session } = useSession() || {};
  const [eventos, setEventos] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarEventos();
  }, []);

  const cargarEventos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coliving/events?companyId=${session?.user?.companyId}`);
      if (res.ok) {
        const data = await res.json();
        setEventos(data);
      }
    } catch (error) {
      logger.error('Error cargando eventos:', error);
      toast.error('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  const asistirEvento = async (eventId: string) => {
    try {
      const res = await fetch(`/api/coliving/events/${eventId}/attend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: session?.user?.profileId,
        }),
      });

      if (res.ok) {
        toast.success('Te has inscrito al evento');
        cargarEventos();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al inscribirse');
      }
    } catch (error) {
      logger.error('Error asistiendo a evento:', error);
      toast.error('Error al inscribirse al evento');
    }
  };

  const getTipoColor = (tipo: string) => {
    const colores: Record<string, string> = {
      social: 'bg-blue-100 text-blue-700',
      deportivo: 'bg-green-100 text-green-700',
      cultural: 'bg-purple-100 text-purple-700',
      networking: 'bg-orange-100 text-orange-700',
    };
    return colores[tipo.toLowerCase()] || 'bg-gray-100 text-gray-700';
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
            <Calendar className="h-5 w-5" />
            Próximos Eventos
          </CardTitle>
          <CardDescription>
            Participa en eventos y actividades de la comunidad
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Lista de eventos */}
      <div className="grid gap-6 md:grid-cols-2">
        {eventos.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-gray-500">
              No hay eventos programados próximamente.
            </CardContent>
          </Card>
        ) : (
          eventos.map((evento) => {
            const fechaEvento = new Date(evento.fecha);
            const estaLleno = evento.capacidad ? evento._count.asistentes >= evento.capacidad : false;

            return (
              <Card key={evento.id} className="overflow-hidden">
                {/* Imagen del evento */}
                {evento.imagen && (
                  <div className="aspect-video relative bg-gradient-to-br from-purple-100 to-pink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={evento.imagen}
                      alt={evento.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">{evento.titulo}</CardTitle>
                    <Badge className={getTipoColor(evento.tipo)}>
                      {evento.tipo}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {evento.descripcion}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Detalles del evento */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(fechaEvento, "EEEE, d 'de' MMMM", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        {format(fechaEvento, 'HH:mm')} ({evento.duracion} min)
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{evento.ubicacion}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>
                        {evento._count.asistentes}
                        {evento.capacidad ? `/${evento.capacidad}` : ''} asistentes
                      </span>
                    </div>
                  </div>

                  {/* Precio */}
                  {evento.costo && evento.costo > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">Costo:</span>
                      <span className="text-lg font-bold">€{evento.costo.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Botón de inscripción */}
                  <Button
                    className="w-full"
                    onClick={() => asistirEvento(evento.id)}
                    disabled={estaLleno}
                  >
                    {estaLleno ? (
                      'Evento lleno'
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Inscribirme
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
