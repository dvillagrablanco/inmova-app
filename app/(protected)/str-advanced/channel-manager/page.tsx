'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, RefreshCw, Download, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

export default function ChannelManagerPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [channels, setChannels] = useState([
    { id: '1', name: 'Airbnb', status: 'conectado', lastSync: '2024-12-06T10:30:00', bookings: 12 },
    {
      id: '2',
      name: 'Booking.com',
      status: 'conectado',
      lastSync: '2024-12-06T10:25:00',
      bookings: 8,
    },
    { id: '3', name: 'Vrbo', status: 'conectado', lastSync: '2024-12-06T09:45:00', bookings: 5 },
    { id: '4', name: 'Expedia', status: 'desconectado', lastSync: null, bookings: 0 },
  ]);

  const syncChannel = async (channelId: string) => {
    try {
      setLoading(true);
      toast.success('Sincronización iniciada...');

      // Simular sincronización
      setTimeout(() => {
        setChannels((prev) =>
          prev.map((ch) =>
            ch.id === channelId ? { ...ch, lastSync: new Date().toISOString() } : ch
          )
        );
        toast.success('Canal sincronizado correctamente');
        setLoading(false);
      }, 2000);
    } catch (error) {
      toast.error('Error al sincronizar canal');
      setLoading(false);
    }
  };

  const exportCalendar = async (listingId: string) => {
    try {
      const response = await fetch(
        `/api/str-advanced/channel-manager/export-ical?listingId=${listingId}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `calendar-${listingId}.ics`;
      a.click();
      toast.success('Calendario exportado correctamente');
    } catch (error) {
      toast.error('Error al exportar calendario');
    }
  };

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">Channel Manager</h1>
                  <p className="text-muted-foreground">
                    Gestión unificada de canales de distribución
                  </p>
                </div>
                <Button onClick={() => router.push('/str-advanced')}>Volver al Dashboard</Button>
              </div>
            </div>

            {/* Estado de Canales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {channels.map((channel) => (
                <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{channel.name}</CardTitle>
                      {channel.status === 'conectado' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Estado</span>
                        <Badge variant={channel.status === 'conectado' ? 'default' : 'secondary'}>
                          {channel.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Reservas</span>
                        <span className="font-medium">{channel.bookings}</span>
                      </div>
                      {channel.lastSync && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            Última sync: {new Date(channel.lastSync).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => syncChannel(channel.id)}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Sincronizar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Calendario Unificado */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Calendario Unificado</CardTitle>
                <CardDescription>
                  Vista consolidada de todas las reservas de todos los canales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <Button variant="outline">
                    <Calendar className="h-4 w-4 mr-2" />
                    Ver Calendario
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar iCal
                  </Button>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Conectar Nuevo Canal
                  </Button>
                </div>
                <div className="bg-muted p-8 rounded-lg text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Vista de calendario se mostrará aquí</p>
                  <p className="text-sm">
                    Mostrando sincronización en tiempo real de todos los canales
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configuración de Sincronización */}
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Sincronización</CardTitle>
                <CardDescription>Ajustes de sincronización automática</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Sincronización Automática</Label>
                      <p className="text-sm text-muted-foreground">
                        Sincronizar automáticamente cada 15 minutos
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Activar
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Notificaciones de Nuevas Reservas</Label>
                      <p className="text-sm text-muted-foreground">
                        Recibir alertas cuando llegue una nueva reserva
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
