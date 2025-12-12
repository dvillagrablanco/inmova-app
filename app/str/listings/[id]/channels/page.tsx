'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Settings,
  Calendar,
  DollarSign,
  Home,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


interface ChannelStatus {
  channel: string;
  name: string;
  status: {
    connected: boolean;
    status: string;
    lastSync: string | null;
    nextSync: string | null;
    errors: number;
    externalId?: string;
    syncSettings?: {
      calendar: boolean;
      prices: boolean;
      bookings: boolean;
    };
  };
  config: {
    name: string;
    supportedFeatures: {
      calendar: boolean;
      pricing: boolean;
      bookings: boolean;
      messaging: boolean;
      reviews: boolean;
    };
  };
}

interface Listing {
  id: string;
  titulo: string;
  tipoPropiedad: string;
  precioPorNoche: number;
  activo: boolean;
}

const CHANNEL_ICONS: Record<string, string> = {
  AIRBNB: '🏠',
  BOOKING: '📖',
  VRBO: '🏖️',
  HOMEAWAY: '🏡',
  WEB_PROPIA: '🌐',
  EXPEDIA: '✈️',
  TRIPADVISOR: '🧐',
  OTROS: '📋',
};

const CHANNEL_COLORS: Record<string, string> = {
  AIRBNB: 'bg-pink-500',
  BOOKING: 'bg-blue-600',
  VRBO: 'bg-blue-500',
  HOMEAWAY: 'bg-orange-500',
  WEB_PROPIA: 'bg-purple-600',
  EXPEDIA: 'bg-yellow-500',
  TRIPADVISOR: 'bg-green-600',
  OTROS: 'bg-gray-500',
};

export default function ChannelsPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelStatus | null>(
    null,
  );
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  // Cargar datos del listing y canales
  useEffect(() => {
    if (!listingId) return;
    loadData();
  }, [listingId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar listing
      const listingRes = await fetch(`/api/str/listings/${listingId}`);
      if (!listingRes.ok) throw new Error('Error al cargar listing');
      const listingData = await listingRes.json();
      setListing(listingData);

      // Cargar estado de canales
      const channelsRes = await fetch(
        `/api/str/channels/${listingId}/status`,
      );
      if (!channelsRes.ok) throw new Error('Error al cargar canales');
      const channelsData = await channelsRes.json();
      setChannels(channelsData.channels || []);
    } catch (error) {
      logger.error('Error cargando datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectChannel = (channel: ChannelStatus) => {
    setSelectedChannel(channel);
    setCredentials({});
    setConnectDialogOpen(true);
  };

  const handleSaveConnection = async () => {
    if (!selectedChannel) return;

    try {
      const res = await fetch('/api/str/channels/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          channel: selectedChannel.channel,
          credentials,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al conectar');
      }

      toast.success(`${selectedChannel.name} conectado exitosamente`);
      setConnectDialogOpen(false);
      loadData();
    } catch (error) {
      logger.error('Error conectando canal:', error);
      toast.error((error as Error).message);
    }
  };

  const handleDisconnectChannel = async (channel: ChannelStatus) => {
    if (
      !confirm(
        `¿Estás seguro de desconectar ${channel.name}? Se dejará de sincronizar automáticamente.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch('/api/str/channels/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          channel: channel.channel,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al desconectar');
      }

      toast.success(`${channel.name} desconectado exitosamente`);
      loadData();
    } catch (error) {
      logger.error('Error desconectando canal:', error);
      toast.error((error as Error).message);
    }
  };

  const handleSyncChannel = async (
    channel: ChannelStatus,
    syncType: string,
  ) => {
    const syncKey = `${channel.channel}_${syncType}`;
    try {
      setSyncing({ ...syncing, [syncKey]: true });

      const res = await fetch(`/api/str/channels/${listingId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: channel.channel,
          type: syncType,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Error al sincronizar');
      }

      const result = await res.json();
      toast.success(
        `${channel.name}: ${result.result.syncedItems} elementos sincronizados`,
      );
      loadData();
    } catch (error) {
      logger.error('Error sincronizando:', error);
      toast.error((error as Error).message);
    } finally {
      setSyncing({ ...syncing, [syncKey]: false });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sincronizado':
      case 'conectado':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Conectado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Error
          </Badge>
        );
      case 'sincronizando':
        return (
          <Badge className="bg-blue-500">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            Sincronizando
          </Badge>
        );
      case 'desconectado':
        return (
          <Badge variant="secondary">
            <WifiOff className="mr-1 h-3 w-3" />
            Desconectado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gradient-bg">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Listing no encontrado</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/str/listings/${listingId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Listing
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{listing.titulo}</h1>
              <p className="text-muted-foreground">
              Gestiona las integraciones con canales externos
            </p>
          </div>
          <Button onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-blue-500" />
            Información Importante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Modo Demo:</strong> Este sistema simula las integraciones
              con canales externos. Para activar integraciones reales, necesitas
              configurar las credenciales API de cada plataforma.
            </p>
            <p>
              <strong>Sincronización automática:</strong> Una vez conectado, el
              sistema sincronizará automáticamente calendario, precios y reservas
              cada 24 horas.
            </p>
            <p>
              <strong>Sincronización manual:</strong> Puedes sincronizar
              manualmente en cualquier momento usando los botones de acción.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Canales */}
      <div className="grid gap-6 md:grid-cols-2">
        {channels.map((channel) => {
          const isConnected = channel.status.connected;
          const hasErrors = channel.status.errors > 0;

          return (
            <Card
              key={channel.channel}
              className={`${
                isConnected ? 'border-green-200 bg-green-50/50' : ''
              } ${
                hasErrors ? 'border-red-200 bg-red-50/50' : ''
              } transition-all hover:shadow-md`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg text-2xl text-white ${
                        CHANNEL_COLORS[channel.channel] || 'bg-gray-500'
                      }`}
                    >
                      {CHANNEL_ICONS[channel.channel] || '📋'}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {channel.name}
                      </CardTitle>
                      <CardDescription>
                        {channel.status.externalId
                          ? `ID: ${channel.status.externalId}`
                          : 'No conectado'}
                      </CardDescription>
                    </div>
                  </div>
                  {isConnected ? (
                    <Wifi className="h-5 w-5 text-green-600" />
                  ) : (
                    <WifiOff className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Estado */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Estado</span>
                    {getStatusBadge(channel.status.status)}
                </div>

                {isConnected && (
                  <>
                    <Separator />

                    {/* Última sincronización */}
                    {channel.status.lastSync && (
                      <div className="text-sm">
                        <span className="font-medium">  Última sincronización:</span>
                          <br />
                        <span className="text-muted-foreground">
                          {format(
                            new Date(channel.status.lastSync),
                            "d 'de' MMMM 'a las' HH:mm",
                            { locale: es },
                          )}
                        </span>
                      </div>
                    )}

                    {/* Próxima sincronización */}
                    {channel.status.nextSync && (
                      <div className="text-sm">
                        <span className="font-medium">
                          Próxima sincronización:
                        </span>
                        <br />
                        <span className="text-muted-foreground">
                          {format(
                            new Date(channel.status.nextSync),
                            "d 'de' MMMM 'a las' HH:mm",
                            { locale: es },
                          )}
                        </span>
                      </div>
                    )}

                    {/* Errores */}
                    {hasErrors && (
                      <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                        <AlertCircle className="mr-2 inline-block h-4 w-4" />
                        {channel.status.errors} error(es) en la sincronización
                      </div>
                    )}

                    <Separator />

                    {/* Acciones de sincronización */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        Sincronización manual
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {channel.config.supportedFeatures.calendar && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              handleSyncChannel(channel, 'calendar')
                            }
                            disabled={
                              syncing[`${channel.channel}_calendar`] || false
                            }
                          >
                            {syncing[`${channel.channel}_calendar`] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Calendar className="mr-1 h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">
                              Calendario
                            </span>
                          </Button>
                        )}

                        {channel.config.supportedFeatures.pricing && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              handleSyncChannel(channel, 'prices')
                            }
                            disabled={
                              syncing[`${channel.channel}_prices`] || false
                            }
                          >
                            {syncing[`${channel.channel}_prices`] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <DollarSign className="mr-1 h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Precios</span>
                          </Button>
                        )}

                        {channel.config.supportedFeatures.bookings && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              handleSyncChannel(channel, 'bookings')
                            }
                            disabled={
                              syncing[`${channel.channel}_bookings`] || false
                            }
                          >
                            {syncing[`${channel.channel}_bookings`] ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Home className="mr-1 h-4 w-4" />
                            )}
                            <span className="hidden sm:inline">Reservas</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Botones de acción */}
                <div className="flex space-x-2">
                  {isConnected ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleConnectChannel(channel)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDisconnectChannel(channel)}
                      >
                        <WifiOff className="mr-2 h-4 w-4" />
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleConnectChannel(channel)}
                    >
                      <Wifi className="mr-2 h-4 w-4" />
                      Conectar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Diálogo de conexión */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedChannel?.status.connected ? 'Configurar' : 'Conectar'}{' '}
              {selectedChannel?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedChannel?.status.connected
                ? 'Actualiza las credenciales de conexión'
                : 'Ingresa las credenciales para conectar este canal'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* En modo DEMO, mostramos campos genéricos */}
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key / Token</Label>
                <Input
                id="apiKey"
                placeholder="Ingresa tu API key"
                value={credentials.apiKey || ''}
                onChange={(e) =>
                  setCredentials({ ...credentials, apiKey: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                <strong>Modo Demo:</strong> Puedes ingresar cualquier valor para
                probar la funcionalidad
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="listingId">ID de Propiedad/Listing</Label>
                <Input
                id="listingId"
                placeholder="Ej: 12345678"
                value={credentials.listingId || ''}
                onChange={(e) =>
                  setCredentials({ ...credentials, listingId: e.target.value })
                }
              />
            </div>

            {/* Configuración de sincronización */}
            {selectedChannel?.status.connected && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="text-sm font-medium">
                    Opciones de sincronización
                  </p>

                  {selectedChannel?.config.supportedFeatures.calendar && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="syncCalendar">Sincronizar calendario</Label>
                        <Switch id="syncCalendar" defaultChecked />
                    </div>
                  )}

                  {selectedChannel?.config.supportedFeatures.pricing && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="syncPrices">Sincronizar precios</Label>
                        <Switch id="syncPrices" defaultChecked />
                    </div>
                  )}

                  {selectedChannel?.config.supportedFeatures.bookings && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="syncBookings">Importar reservas</Label>
                        <Switch id="syncBookings" defaultChecked />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveConnection}>
              {selectedChannel?.status.connected
                ? 'Guardar cambios'
                : 'Conectar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
