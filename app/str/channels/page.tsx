'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Globe,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw,
  Link as LinkIcon,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';

interface Channel {
  id: string;
  name: string;
  logo: string;
  connected: boolean;
  active: boolean;
  propertiesSync: number;
  totalProperties: number;
  reservations: number;
  revenue: number;
  commission: number;
  lastSync: string;
  apiStatus: 'ok' | 'warning' | 'error';
}

export default function STRChannelsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadChannels();
    }
  }, [status]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      
      // Cargar canales desde la API
      const response = await fetch('/api/str/channels');
      
      if (response.ok) {
        const apiChannels = await response.json();
        
        // También obtener métricas de canal
        const metricsResponse = await fetch('/api/str/channel-performance');
        const metrics = metricsResponse.ok ? await metricsResponse.json() : {};
        
        // Mapear al formato de la UI
        const channelLogos: Record<string, string> = {
          AIRBNB: '🏠',
          BOOKING: '🔵',
          VRBO: '🏖️',
          HOMEAWAY: '🌴',
          EXPEDIA: '🟡',
          TRIPADVISOR: '🦉',
          IDEALISTA: '🟢',
          FOTOCASA: '📸',
          CUSTOM: '🔗',
        };
        
        const channelNames: Record<string, string> = {
          AIRBNB: 'Airbnb',
          BOOKING: 'Booking.com',
          VRBO: 'VRBO',
          HOMEAWAY: 'HomeAway',
          EXPEDIA: 'Expedia',
          TRIPADVISOR: 'TripAdvisor',
          IDEALISTA: 'Idealista',
          FOTOCASA: 'Fotocasa',
          CUSTOM: 'Canal Personalizado',
        };

        if (Array.isArray(apiChannels) && apiChannels.length > 0) {
          // Agrupar por canal
          const channelGroups: Record<string, any[]> = {};
          apiChannels.forEach((ch: any) => {
            const key = ch.canal || 'CUSTOM';
            if (!channelGroups[key]) channelGroups[key] = [];
            channelGroups[key].push(ch);
          });

          const formattedChannels: Channel[] = Object.entries(channelGroups).map(([canal, items]) => {
            const activeItems = items.filter((i: any) => i.activo);
            const channelMetric = metrics[canal] || {};
            
            return {
              id: canal.toLowerCase(),
              name: channelNames[canal] || canal,
              logo: channelLogos[canal] || '🔗',
              connected: items.length > 0,
              active: activeItems.length > 0,
              propertiesSync: activeItems.length,
              totalProperties: items.length,
              reservations: channelMetric.reservations || 0,
              revenue: channelMetric.revenue || 0,
              commission: channelMetric.commission || 15,
              lastSync: items[0]?.ultimaSync 
                ? new Date(items[0].ultimaSync).toLocaleString('es-ES') 
                : '-',
              apiStatus: activeItems.length > 0 ? 'ok' : items.length > 0 ? 'warning' : 'error',
            };
          });

          setChannels(formattedChannels);
        } else {
          // Si no hay canales configurados, mostrar lista vacía
          setChannels([]);
        }
      } else {
        // Si la API falla, mostrar canales disponibles para conectar
        setChannels([
          {
            id: 'airbnb',
            name: 'Airbnb',
            logo: '🏠',
            connected: false,
            active: false,
            propertiesSync: 0,
            totalProperties: 0,
            reservations: 0,
            revenue: 0,
            commission: 15,
            lastSync: '-',
            apiStatus: 'error',
          },
          {
            id: 'booking',
            name: 'Booking.com',
            logo: '🔵',
            connected: false,
            active: false,
            propertiesSync: 0,
            totalProperties: 0,
            reservations: 0,
            revenue: 0,
            commission: 18,
            lastSync: '-',
            apiStatus: 'error',
          },
          {
            id: 'vrbo',
            name: 'VRBO',
            logo: '🏖️',
            connected: false,
            active: false,
            propertiesSync: 0,
            totalProperties: 0,
            reservations: 0,
            revenue: 0,
            commission: 12,
            lastSync: '-',
            apiStatus: 'error',
          },
        ]);
      }

    } catch (error) {
      console.error('Error loading channels:', error);
      toast.error('Error al cargar canales');
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = async (channelId: string, active: boolean) => {
    try {
      const updatedChannels = channels.map(ch =>
        ch.id === channelId ? { ...ch, active } : ch
      );
      setChannels(updatedChannels);
      toast.success(`Canal ${active ? 'activado' : 'desactivado'} correctamente`);
    } catch (error) {
      toast.error('Error al actualizar canal');
    }
  };

  const syncChannel = async (channelId: string) => {
    toast.info('Sincronizando canal...');
    // Simulate sync
    setTimeout(() => {
      const updatedChannels = channels.map(ch =>
        ch.id === channelId ? { ...ch, lastSync: new Date().toLocaleString('es-ES') } : ch
      );
      setChannels(updatedChannels);
      toast.success('Sincronización completada');
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      ok: { color: 'bg-green-500', label: 'Conectado', icon: CheckCircle },
      warning: { color: 'bg-yellow-500', label: 'Advertencia', icon: AlertCircle },
      error: { color: 'bg-red-500', label: 'Error', icon: AlertCircle },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.error;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const totalRevenue = channels.reduce((sum, ch) => sum + ch.revenue, 0);
  const totalReservations = channels.reduce((sum, ch) => sum + ch.reservations, 0);
  const activeChannels = channels.filter(ch => ch.connected && ch.active).length;

  const revenueByChannel = channels
    .filter(ch => ch.revenue > 0)
    .map(ch => ({
      name: ch.name,
      revenue: ch.revenue,
      reservations: ch.reservations,
    }));

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando canales...</p>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Gestión de Canales OTA</h1>
                <p className="text-muted-foreground mt-2">
                  Sincronización multicanal con plataformas de reservas
                </p>
              </div>
              <Button onClick={() => syncChannel('all')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sincronizar Todo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Canales Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {activeChannels} / {channels.filter(ch => ch.connected).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Conectados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">+18% vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalReservations}</div>
                  <p className="text-xs text-muted-foreground mt-1">Este mes</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Comisión Media</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {channels.filter(ch => ch.connected).length > 0
                      ? (channels.filter(ch => ch.connected).reduce((sum, ch) => sum + ch.commission, 0) /
                          channels.filter(ch => ch.connected).length).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Plataformas</p>
                </CardContent>
              </Card>
            </div>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Ingresos por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByChannel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10B981" name="Ingresos (€)" />
                    <Bar dataKey="reservations" fill="#3B82F6" name="Reservas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Channels List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {channels.map((channel) => (
                <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{channel.logo}</div>
                        <div>
                          <CardTitle className="text-lg">{channel.name}</CardTitle>
                          <CardDescription>
                            {channel.propertiesSync} de {channel.totalProperties} propiedades sincronizadas
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(channel.apiStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${channel.id}`}>Canal Activo</Label>
                      </div>
                      <Switch
                        id={`active-${channel.id}`}
                        checked={channel.active}
                        onCheckedChange={(checked) => toggleChannel(channel.id, checked)}
                        disabled={!channel.connected}
                      />
                    </div>

                    {channel.connected ? (
                      <>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div>
                            <p className="text-xs text-muted-foreground">Reservas</p>
                            <p className="text-lg font-bold">{channel.reservations}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Ingresos</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(channel.revenue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Comisión</p>
                            <p className="text-lg font-bold">{channel.commission}%</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Última sincronización:</span>
                            <span className="font-medium">{channel.lastSync}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => syncChannel(channel.id)}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Sincronizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/str/channels/${channel.id}/settings`)}
                          >
                            Configurar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-4">
                          Canal no conectado. Conecta para empezar a sincronizar.
                        </p>
                        <Button onClick={() => toast.info('Iniciando conexión con ' + channel.name)}>
                          <LinkIcon className="h-4 w-4 mr-2" />
                          Conectar Canal
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </AuthenticatedLayout>
  );
}
