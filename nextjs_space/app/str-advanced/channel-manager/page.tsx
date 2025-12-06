'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Zap,
  RefreshCw,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ArrowLeft,
  BarChart3,
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react';

const CHANNEL_LOGOS: Record<string, { name: string; color: string }> = {
  airbnb: { name: 'Airbnb', color: 'bg-[#FF5A5F]' },
  booking: { name: 'Booking.com', color: 'bg-[#003580]' },
  vrbo: { name: 'Vrbo', color: 'bg-[#3B5998]' },
  expedia: { name: 'Expedia', color: 'bg-[#00355F]' },
  tripadvisor: { name: 'TripAdvisor', color: 'bg-[#34E0A1]' },
  directo: { name: 'Reserva Directa', color: 'bg-gray-600' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  sincronizado: { label: 'Sincronizado', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  sincronizando: { label: 'Sincronizando', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
  error: { label: 'Error', color: 'bg-red-100 text-red-800', icon: XCircle },
  pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-800', icon: Clock },
};

export default function ChannelManagerPage() {
  const { data: session, status } = useSession() || {};
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('channels');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/str/channel-manager');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSync = async (channelId: string) => {
    setSyncing(channelId);
    try {
      const res = await fetch('/api/str/channel-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast.success('Sincronización completada');
      } else {
        toast.error(result.message || 'Error en sincronización');
      }
      
      fetchData();
    } catch (error) {
      toast.error('Error al sincronizar');
    } finally {
      setSyncing(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/str-advanced">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Channel Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestiona la sincronización de todos tus canales de reserva
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Canal
          </Button>
        </div>
      </div>

      {/* Stats */}
      {data?.syncStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Canales Conectados</p>
                  <p className="text-2xl font-bold">{data.channels?.length || 0}</p>
                </div>
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sincronizaciones</p>
                  <p className="text-2xl font-bold">{data.syncStats.total}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tasa de Éxito</p>
                  <p className="text-2xl font-bold text-green-600">{data.syncStats.tasaExito}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Errores</p>
                  <p className="text-2xl font-bold text-red-600">{data.syncStats.fallidos}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Canales</TabsTrigger>
          <TabsTrigger value="pricing">Pricing por Canal</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          {!data?.channels?.length ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay canales configurados</h3>
                  <p className="text-muted-foreground mb-4">
                    Conecta tu primer canal de reservas para empezar.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Canal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {data.channels.map((channel: any) => {
                const channelInfo = CHANNEL_LOGOS[channel.canal] || { name: channel.canal, color: 'bg-gray-500' };
                const statusInfo = STATUS_CONFIG[channel.estadoSync] || STATUS_CONFIG.pendiente;
                const StatusIcon = statusInfo.icon;
                
                return (
                  <Card key={channel.id}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-lg ${channelInfo.color} flex items-center justify-center text-white font-bold`}>
                            {channelInfo.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold">{channelInfo.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {channel.listing?.titulo || 'Sin propiedad asignada'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <Badge className={statusInfo.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                            {channel.ultimaSync && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Última sync: {new Date(channel.ultimaSync).toLocaleString('es-ES')}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSync(channel.id)}
                              disabled={syncing === channel.id}
                            >
                              <RefreshCw className={`h-4 w-4 ${syncing === channel.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sync options */}
                      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${channel.sincronizarPrecio ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-muted-foreground">Precios</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${channel.sincronizarCalendario ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-muted-foreground">Calendario</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${channel.sincronizarReservas ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm text-muted-foreground">Reservas</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Dinámico por Canal</CardTitle>
              <CardDescription>
                Configura ajustes de precio específicos para cada canal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecciona una propiedad para configurar el pricing por canal</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Métricas por Canal</CardTitle>
              <CardDescription>
                Rendimiento y estadísticas de cada canal
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.metrics?.length > 0 ? (
                <div className="space-y-4">
                  {data.metrics.map((metric: any) => {
                    const channelInfo = CHANNEL_LOGOS[metric.canal] || { name: metric.canal, color: 'bg-gray-500' };
                    return (
                      <div key={metric.canal} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg ${channelInfo.color} flex items-center justify-center text-white text-sm font-bold`}>
                            {channelInfo.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium">{channelInfo.name}</span>
                        </div>
                        <div className="flex items-center gap-8 text-sm">
                          <div className="text-center">
                            <p className="font-semibold">{metric._sum?.reservasRecibidas || 0}</p>
                            <p className="text-muted-foreground">Reservas</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">€{(metric._sum?.ingresosBrutos || 0).toLocaleString()}</p>
                            <p className="text-muted-foreground">Ingresos</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">{(metric._avg?.tasaOcupacion || 0).toFixed(1)}%</p>
                            <p className="text-muted-foreground">Ocupación</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold">€{(metric._avg?.adr || 0).toFixed(0)}</p>
                            <p className="text-muted-foreground">ADR</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay métricas disponibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Sincronizaciones</CardTitle>
              <CardDescription>
                Registro de todas las sincronizaciones recientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.recentSyncs?.length > 0 ? (
                <div className="space-y-2">
                  {data.recentSyncs.map((sync: any) => (
                    <div key={sync.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${sync.exitoso ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {sync.tipoEvento.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(sync.iniciadoEn).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {sync.duracionMs && (
                          <span className="text-xs text-muted-foreground">
                            {sync.duracionMs}ms
                          </span>
                        )}
                        <Badge variant={sync.exitoso ? 'default' : 'destructive'}>
                          {sync.exitoso ? 'OK' : 'Error'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay historial de sincronizaciones</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
