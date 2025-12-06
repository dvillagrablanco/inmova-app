'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PackageItem {
  id: string;
  numeroSeguimiento?: string;
  remitente: string;
  empresa?: string;
  fechaLlegada: string;
  fechaRecogida?: string;
  estado: string;
  ubicacionAlmacen?: string;
  tamano?: string;
  notificado: boolean;
  notas?: string;
}

export default function PaqueteriaPanel() {
  const { data: session } = useSession() || {};
  const [paquetes, setPaquetes] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPaquetes();
  }, []);

  const cargarPaquetes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/coliving/packages?tenantId=${session?.user?.tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setPaquetes(data);
      }
    } catch (error) {
      console.error('Error cargando paquetes:', error);
      toast.error('Error al cargar paquetes');
    } finally {
      setLoading(false);
    }
  };

  const marcarRecogido = async (packageId: string) => {
    try {
      const res = await fetch(`/api/coliving/packages/${packageId}/collect`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Paquete marcado como recogido');
        cargarPaquetes();
      }
    } catch (error) {
      console.error('Error marcando paquete:', error);
      toast.error('Error al marcar paquete');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { label: string; variant: any }> = {
      pendiente: { label: 'Pendiente recogida', variant: 'default' },
      notificado: { label: 'Te esperamos!', variant: 'default' },
      recogido: { label: 'Recogido', variant: 'secondary' },
    };
    return estados[estado] || { label: estado, variant: 'default' };
  };

  const getTamanoIcon = (tamano?: string) => {
    if (!tamano) return '📦';
    const iconos: Record<string, string> = {
      pequeño: '📦',
      mediano: '📦',
      grande: '📦',
    };
    return iconos[tamano.toLowerCase()] || '📦';
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
            <Package className="h-5 w-5" />
            Tus Paquetes
          </CardTitle>
          <CardDescription>
            Revisa el estado de tus paquetes y envíos
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Lista de paquetes */}
      <div className="grid gap-4">
        {paquetes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No tienes paquetes pendientes.
            </CardContent>
          </Card>
        ) : (
          paquetes.map((paquete) => {
            const estadoInfo = getEstadoBadge(paquete.estado);
            const fechaLlegada = new Date(paquete.fechaLlegada);

            return (
              <Card key={paquete.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icono del paquete */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center text-3xl">
                        {getTamanoIcon(paquete.tamano)}
                      </div>
                    </div>

                    {/* Información del paquete */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            Paquete de {paquete.remitente}
                          </h3>
                          {paquete.empresa && (
                            <p className="text-sm text-gray-600">{paquete.empresa}</p>
                          )}
                          {paquete.numeroSeguimiento && (
                            <p className="text-xs text-gray-500 mt-1">
                              Seguimiento: {paquete.numeroSeguimiento}
                            </p>
                          )}
                        </div>
                        <Badge variant={estadoInfo.variant}>
                          {estadoInfo.label}
                        </Badge>
                      </div>

                      {/* Detalles */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>
                            Llegó: {format(fechaLlegada, "d 'de' MMMM", { locale: es })}
                          </span>
                        </div>
                        {paquete.ubicacionAlmacen && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{paquete.ubicacionAlmacen}</span>
                          </div>
                        )}
                        {paquete.tamano && (
                          <div className="text-gray-600">
                            Tamaño: <span className="font-medium">{paquete.tamano}</span>
                          </div>
                        )}
                      </div>

                      {/* Notas */}
                      {paquete.notas && (
                        <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                          {paquete.notas}
                        </p>
                      )}

                      {/* Botón de acción */}
                      {paquete.estado !== 'recogido' && (
                        <Button
                          onClick={() => marcarRecogido(paquete.id)}
                          className="w-full sm:w-auto"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Marcar como recogido
                        </Button>
                      )}

                      {paquete.estado === 'recogido' && paquete.fechaRecogida && (
                        <p className="text-sm text-green-600">
                          Recogido el{' '}
                          {format(new Date(paquete.fechaRecogida), "d 'de' MMMM 'a las' HH:mm", {
                            locale: es,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
