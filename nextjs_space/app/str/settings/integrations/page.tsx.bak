'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useEffect, useState } from 'react';
import logger from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Zap,
  Activity,
  AlertCircle,
  CheckCircle2,
  Copy,
  RefreshCw,
  Server,
  Wifi,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

export default function IntegrationsSettingsPage() {
  const [stats, setStats] = useState({
    totalListings: 0,
    connectedChannels: 0,
    activeSync: 0,
    lastSync: null as Date | null,
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState('24');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // En producción, cargar desde API
      // Por ahora, datos de demoselectItem
      setStats({
        totalListings: 12,
        connectedChannels: 5,
        activeSync: 3,
        lastSync: new Date(),
      });

      // Generar webhook URL basado en el dominio
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://inmova.app';
      setWebhookUrl(`${baseUrl}/api/webhooks/str`);
    } catch (error) {
      logger.error('Error cargando configuración:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('URL copiada al portapapeles');
  };

  const handleSaveSettings = async () => {
    try {
      // En producción, guardar en API
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      logger.error('Error guardando configuración:', error);
      toast.error('Error al guardar configuración');
    }
  };

  const handleTestConnection = async (channel: string) => {
    try {
      toast.loading(`Probando conexión con ${channel}...`);
      // Simular test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.dismiss();
      toast.success(`¡Conexión exitosa con ${channel}!`);
    } catch (error) {
      toast.dismiss();
      toast.error('Error en la conexión');
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
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuración de Integraciones</h1>
        <p className="text-muted-foreground">
          Gestiona las integraciones con plataformas externas y configura la
          sincronización automática
        </p>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Listings Activos
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">
              Con integraciones configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Canales Conectados
            </CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.connectedChannels}</div>
            <p className="text-xs text-muted-foreground">
              Activos y funcionando
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sincronizaciones Activas
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSync}</div>
            <p className="text-xs text-muted-foreground">
              En proceso ahora mismo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Última Sincronización
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.lastSync
                ? format(stats.lastSync, 'HH:mm', { locale: es })
                : '--:--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.lastSync
                ? format(stats.lastSync, "d 'de' MMMM", { locale: es })
                : 'Sin sincronización'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de configuración */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="channels">
            <Wifi className="mr-2 h-4 w-4" />
            Canales
          </TabsTrigger>
          <TabsTrigger value="webhooks">
            <Zap className="mr-2 h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Server className="mr-2 h-4 w-4" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        {/* Tab: General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>
                Ajusta las preferencias generales de sincronización
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sincronización automática */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronización automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Sincroniza automáticamente calendario, precios y reservas
                  </p>
                </div>
                <Switch checked={autoSync} onCheckedChange={setAutoSync} />
              </div>

              <Separator />

              {/* Intervalo de sincronización */}
              <div className="space-y-2">
                <Label>Intervalo de sincronización</Label>
                <Select value={syncInterval} onValueChange={setSyncInterval}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un intervalo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Cada hora</SelectItem>
                    <SelectItem value="6">Cada 6 horas</SelectItem>
                    <SelectItem value="12">Cada 12 horas</SelectItem>
                    <SelectItem value="24">Cada 24 horas</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Frecuencia con la que se sincronizarán los datos con los canales
                  externos
                </p>
              </div>

              <Separator />

              {/* Notificaciones */}
              <div className="space-y-4">
                <Label>Notificaciones</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        Errores de sincronización
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recibe notificaciones cuando haya errores
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Nuevas reservas</p>
                      <p className="text-xs text-muted-foreground">
                        Notificar cuando se importe una nueva reserva
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        Cambios en el calendario
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Notificar cambios importantes en disponibilidad
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={loadSettings}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSettings}>
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Canales */}
        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Canales</CardTitle>
              <CardDescription>
                Gestiona las credenciales y configuración de cada canal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  'AIRBNB',
                  'BOOKING',
                  'VRBO',
                  'HOMEAWAY',
                  'EXPEDIA',
                  'TRIPADVISOR',
                ].map((channel) => (
                  <Card key={channel} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                            {CHANNEL_ICONS[channel] || '📋'}
                          </div>
                          <div>
                            <p className="font-semibold">{channel}</p>
                            <p className="text-sm text-muted-foreground">
                              {Math.random() > 0.5 ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Configurado
                                </span>
                              ) : (
                                <span className="flex items-center text-gray-500">
                                  <AlertCircle className="mr-1 h-3 w-3" />
                                  No configurado
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestConnection(channel)}
                          >
                            Probar
                          </Button>
                          <Button size="sm" variant="outline">
                            Configurar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Modo Demo Activo
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        Actualmente estás en modo demo. Las integraciones simulan
                        conexiones reales con los canales. Para activar
                        integraciones reales, necesitas:
                      </p>
                      <ul className="ml-5 mt-2 list-disc space-y-1">
                        <li>Obtener credenciales API de cada plataforma</li>
                        <li>Configurar las variables de entorno necesarias</li>
                        <li>Configurar webhooks en cada plataforma</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Webhooks */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Webhooks</CardTitle>
              <CardDescription>
                Configura los webhooks para recibir notificaciones en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* URL del webhook */}
              <div className="space-y-2">
                <Label>URL del Webhook</Label>
                <div className="flex space-x-2">
                  <Input value={webhookUrl} readOnly className="flex-1" />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyWebhookUrl}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Usa esta URL en las configuraciones de webhook de cada
                  plataforma
                </p>
              </div>

              <Separator />

              {/* Eventos */}
              <div className="space-y-4">
                <Label>Eventos a recibir</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Nuevas reservas</p>
                      <p className="text-xs text-muted-foreground">
                        Notificar cuando se cree una nueva reserva
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        Modificaciones de reservas
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cambios en fechas, precio o estado
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Cancelaciones</p>
                      <p className="text-xs text-muted-foreground">
                        Cuando una reserva es cancelada
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Nuevas reseñas</p>
                      <p className="text-xs text-muted-foreground">
                        Cuando un huésped deja una reseña
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Mensajes</p>
                      <p className="text-xs text-muted-foreground">
                        Notificar nuevos mensajes de huéspedes
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Instrucción por canal */}
              <div className="space-y-4">
                <Label>Instrucciones por Canal</Label>
                <div className="space-y-3">
                  {['AIRBNB', 'BOOKING', 'VRBO'].map((channel) => (
                    <div
                      key={channel}
                      className="rounded-lg border p-4 hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {CHANNEL_ICONS[channel]}
                          </span>
                          <span className="font-medium">{channel}</span>
                        </div>
                        <Button size="sm" variant="outline">
                          Ver guía
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={handleSaveSettings}>Guardar cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Avanzado */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Avanzada</CardTitle>
              <CardDescription>
                Opciones avanzadas para usuarios expertos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rate limiting */}
              <div className="space-y-2">
                <Label>Límite de peticiones (Rate Limiting)</Label>
                <Input type="number" defaultValue="100" />
                <p className="text-sm text-muted-foreground">
                  Número máximo de peticiones por minuto a cada API externa
                </p>
              </div>

              <Separator />

              {/* Timeout */}
              <div className="space-y-2">
                <Label>Timeout de sincronización (segundos)</Label>
                <Input type="number" defaultValue="30" />
                <p className="text-sm text-muted-foreground">
                  Tiempo máximo de espera para cada petición de sincronización
                </p>
              </div>

              <Separator />

              {/* Reintentos */}
              <div className="space-y-2">
                <Label>Número de reintentos</Label>
                <Input type="number" defaultValue="3" />
                <p className="text-sm text-muted-foreground">
                  Cuántas veces reintentar una sincronización fallida antes de
                  reportar error
                </p>
              </div>

              <Separator />

              {/* Logs */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Logs detallados</Label>
                  <p className="text-sm text-muted-foreground">
                    Guardar logs detallados de todas las sincronizaciones
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Separator />

              {/* Limpiar caché */}
              <div className="space-y-2">
                <Label>Mantenimiento</Label>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Limpiar caché de sincronización
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Activity className="mr-2 h-4 w-4" />
                    Forzar sincronización completa
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end space-x-2">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={handleSaveSettings}>Guardar cambios</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
      </div>
        </main>
      </div>
    </div>
  );
}
