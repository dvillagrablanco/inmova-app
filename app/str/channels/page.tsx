'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
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
      
      // Mock data
      setChannels([
        {
          id: 'airbnb',
          name: 'Airbnb',
          logo: '🏠',
          connected: true,
          active: true,
          propertiesSync: 12,
          totalProperties: 12,
          reservations: 45,
          revenue: 18750,
          commission: 15,
          lastSync: '2025-12-26 17:30',
          apiStatus: 'ok',
        },
        {
          id: 'booking',
          name: 'Booking.com',
          logo: '🔵',
          connected: true,
          active: true,
          propertiesSync: 10,
          totalProperties: 12,
          reservations: 38,
          revenue: 15200,
          commission: 18,
          lastSync: '2025-12-26 17:28',
          apiStatus: 'ok',
        },
        {
          id: 'vrbo',
          name: 'VRBO',
          logo: '🏖️',
          connected: true,
          active: false,
          propertiesSync: 5,
          totalProperties: 12,
          reservations: 12,
          revenue: 6400,
          commission: 12,
          lastSync: '2025-12-26 16:00',
          apiStatus: 'warning',
        },
        {
          id: 'homeaway',
          name: 'HomeAway',
          logo: '🌴',
          connected: false,
          active: false,
          propertiesSync: 0,
          totalProperties: 12,
          reservations: 0,
          revenue: 0,
          commission: 14,
          lastSync: '-',
          apiStatus: 'error',
        },
        {
          id: 'idealista',
          name: 'Idealista',
          logo: '🟢',
          connected: true,
          active: true,
          propertiesSync: 12,
          totalProperties: 12,
          reservations: 8,
          revenue: 3200,
          commission: 0,
          lastSync: '2025-12-26 17:25',
          apiStatus: 'ok',
        },
      ]);

    } catch (error) {
      toast.error('Error al cargar canales');
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
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando canales...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
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
        </main>
      </div>
    </div>
  );
}
