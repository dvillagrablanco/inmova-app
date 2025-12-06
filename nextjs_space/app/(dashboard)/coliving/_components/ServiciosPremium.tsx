'use client';

import { useState, useEffect } from 'react';
import logger from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Clock, Euro } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Service {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  icono?: string;
  precioBase: number;
  unidad: string;
  duracion?: number;
  disponible: boolean;
}

export default function ServiciosPremium() {
  const { data: session } = useSession() || {};
  const [servicios, setServicios] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservando, setReservando] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Service | null>(null);

  // Formulario de reserva
  const [fechaServicio, setFechaServicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coliving/services?companyId=${session?.user?.companyId}`);
      if (res.ok) {
        const data = await res.json();
        setServicios(data);
      }
    } catch (error) {
      logger.error('Error cargando servicios:', error);
      toast.error('Error al cargar servicios');
    } finally {
      setLoading(false);
    }
  };

  const reservarServicio = async () => {
    if (!servicioSeleccionado || !fechaServicio || !horaInicio || !ubicacion) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      setReservando(true);
      const res = await fetch('/api/coliving/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: servicioSeleccionado.id,
          tenantId: session?.user?.tenantId,
          companyId: session?.user?.companyId,
          fechaServicio: new Date(fechaServicio).toISOString(),
          horaInicio,
          duracion: servicioSeleccionado.duracion || 60,
          ubicacion,
          precioTotal: servicioSeleccionado.precioBase,
          notas,
        }),
      });

      if (res.ok) {
        toast.success('Servicio reservado exitosamente');
        // Limpiar formulario
        setFechaServicio('');
        setHoraInicio('');
        setUbicacion('');
        setNotas('');
        setServicioSeleccionado(null);
      } else {
        toast.error('Error al reservar servicio');
      }
    } catch (error) {
      logger.error('Error reservando servicio:', error);
      toast.error('Error al reservar servicio');
    } finally {
      setReservando(false);
    }
  };

  const getCategoriaIcon = (categoria: string) => {
    const iconos: Record<string, string> = {
      limpieza: '🧹',
      lavanderia: '👕',
      chef: '👨‍🍳',
      trainer: '🏋️',
      masajes: '💆',
    };
    return iconos[categoria.toLowerCase()] || '✨';
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
            Servicios Premium
          </CardTitle>
          <CardDescription>
            Reserva servicios exclusivos para facilitar tu día a día
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Lista de servicios */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {servicios.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="py-12 text-center text-gray-500">
              No hay servicios disponibles.
            </CardContent>
          </Card>
        ) : (
          servicios.map((servicio) => (
            <Card key={servicio.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">
                      {servicio.icono || getCategoriaIcon(servicio.categoria)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{servicio.nombre}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {servicio.categoria}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {servicio.descripcion}
                </p>

                {/* Detalles */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Euro className="h-4 w-4" />
                      <span>Precio:</span>
                    </div>
                    <span className="font-semibold">
                      €{servicio.precioBase.toFixed(2)} / {servicio.unidad}
                    </span>
                  </div>
                  {servicio.duracion && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Duración:</span>
                      </div>
                      <span className="font-semibold">{servicio.duracion} min</span>
                    </div>
                  )}
                </div>

                {/* Botón de reserva */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      disabled={!servicio.disponible}
                      onClick={() => setServicioSeleccionado(servicio)}
                    >
                      Reservar servicio
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reservar {servicio.nombre}</DialogTitle>
                      <DialogDescription>
                        Completa los detalles de tu reserva
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="fecha">Fecha del servicio</Label>
                        <Input
                          id="fecha"
                          type="date"
                          value={fechaServicio}
                          onChange={(e) => setFechaServicio(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hora">Hora</Label>
                        <Input
                          id="hora"
                          type="time"
                          value={horaInicio}
                          onChange={(e) => setHoraInicio(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ubicacion">Ubicación (Unidad/Habitación)</Label>
                        <Input
                          id="ubicacion"
                          placeholder="Ej: Habitación 101"
                          value={ubicacion}
                          onChange={(e) => setUbicacion(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notas">Notas adicionales (opcional)</Label>
                        <Textarea
                          id="notas"
                          placeholder="Instrucciones especiales..."
                          value={notas}
                          onChange={(e) => setNotas(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium">Total:</span>
                        <span className="text-2xl font-bold">
                          €{servicio.precioBase.toFixed(2)}
                        </span>
                      </div>
                      <Button
                        className="w-full"
                        onClick={reservarServicio}
                        disabled={reservando}
                      >
                        {reservando ? 'Reservando...' : 'Confirmar reserva'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
