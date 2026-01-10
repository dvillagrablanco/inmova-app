'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  X,
  ExternalLink,
  Settings,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Unlink,
  Home,
  Building2,
  Globe,
  Upload,
  Download,
  Eye,
  BarChart3,
  Clock,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface Portal {
  id: string;
  name: string;
  description: string;
  logo: string;
  website: string;
  country: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  configFields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'select';
    required: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  features: string[];
  stats?: {
    activeListings: number;
    views: number;
    leads: number;
    lastSync: string;
  };
  syncFrequency?: string;
}

const portals: Portal[] = [
  {
    id: 'idealista',
    name: 'Idealista',
    description: 'El mayor portal inmobiliario de España con más de 13 millones de visitas mensuales.',
    logo: '🏠',
    website: 'https://www.idealista.com',
    country: 'España',
    status: 'disconnected',
    configFields: [
      {
        name: 'IDEALISTA_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de Idealista',
      },
      {
        name: 'IDEALISTA_SECRET',
        label: 'API Secret',
        type: 'password',
        required: true,
        placeholder: 'Tu Secret de Idealista',
      },
      {
        name: 'IDEALISTA_AGENCY_CODE',
        label: 'Código de Agencia',
        type: 'text',
        required: true,
        placeholder: 'Código asignado por Idealista',
      },
    ],
    features: [
      'Publicación automática de inmuebles',
      'Sincronización bidireccional',
      'Leads directos al CRM',
      'Estadísticas de rendimiento',
      'Destacados y promociones',
    ],
  },
  {
    id: 'fotocasa',
    name: 'Fotocasa',
    description: 'Portal inmobiliario líder con presencia en España y Portugal. Parte del grupo Adevinta.',
    logo: '📷',
    website: 'https://www.fotocasa.es',
    country: 'España',
    status: 'disconnected',
    configFields: [
      {
        name: 'FOTOCASA_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de Fotocasa',
      },
      {
        name: 'FOTOCASA_CLIENT_ID',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Tu Client ID',
      },
      {
        name: 'FOTOCASA_AGENCY_ID',
        label: 'ID de Agencia',
        type: 'text',
        required: true,
        placeholder: 'ID asignado por Fotocasa',
      },
    ],
    features: [
      'Publicación automática',
      'Fotos ilimitadas',
      'Leads integrados',
      'Estadísticas detalladas',
    ],
  },
  {
    id: 'habitaclia',
    name: 'Habitaclia',
    description: 'Portal inmobiliario del grupo Fotocasa. Especialmente fuerte en Cataluña y Baleares.',
    logo: '🏡',
    website: 'https://www.habitaclia.com',
    country: 'España',
    status: 'disconnected',
    configFields: [
      {
        name: 'HABITACLIA_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de Habitaclia',
      },
      {
        name: 'HABITACLIA_CLIENT_ID',
        label: 'Client ID',
        type: 'text',
        required: true,
        placeholder: 'Tu Client ID',
      },
    ],
    features: [
      'Publicación automática',
      'Sincronización con Fotocasa',
      'Leads integrados',
      'Tours virtuales',
    ],
  },
  {
    id: 'pisos',
    name: 'Pisos.com',
    description: 'Portal inmobiliario generalista con presencia en toda España.',
    logo: '🏢',
    website: 'https://www.pisos.com',
    country: 'España',
    status: 'disconnected',
    configFields: [
      {
        name: 'PISOS_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de Pisos.com',
      },
      {
        name: 'PISOS_USERNAME',
        label: 'Usuario',
        type: 'text',
        required: true,
        placeholder: 'Tu usuario de Pisos.com',
      },
    ],
    features: [
      'Publicación XML',
      'Destacados disponibles',
      'Estadísticas básicas',
    ],
  },
  {
    id: 'yaencontre',
    name: 'yaencontre',
    description: 'Portal inmobiliario español con fuerte presencia en alquileres.',
    logo: '🔍',
    website: 'https://www.yaencontre.com',
    country: 'España',
    status: 'disconnected',
    configFields: [
      {
        name: 'YAENCONTRE_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key',
      },
    ],
    features: [
      'Publicación automática',
      'Especializado en alquileres',
      'Leads por email',
    ],
  },
  {
    id: 'inmueble24',
    name: 'Inmueble24',
    description: 'Portal inmobiliario del grupo Navent, con presencia en México y Latinoamérica.',
    logo: '🌎',
    website: 'https://www.inmueble24.com',
    country: 'México',
    status: 'disconnected',
    configFields: [
      {
        name: 'INMUEBLE24_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de Inmueble24',
      },
      {
        name: 'INMUEBLE24_PUBLISHER_ID',
        label: 'Publisher ID',
        type: 'text',
        required: true,
        placeholder: 'Tu Publisher ID',
      },
    ],
    features: [
      'Publicación en México',
      'Feed XML/JSON',
      'Leads integrados',
    ],
  },
  {
    id: 'rightmove',
    name: 'Rightmove',
    description: 'El mayor portal inmobiliario de Reino Unido con más de 140 millones de visitas mensuales.',
    logo: '🇬🇧',
    website: 'https://www.rightmove.co.uk',
    country: 'UK',
    status: 'disconnected',
    configFields: [
      {
        name: 'RIGHTMOVE_BRANCH_ID',
        label: 'Branch ID',
        type: 'text',
        required: true,
        placeholder: 'Tu Branch ID',
      },
      {
        name: 'RIGHTMOVE_CERTIFICATE',
        label: 'Certificado',
        type: 'password',
        required: true,
        placeholder: 'Certificado SSL',
      },
    ],
    features: [
      'Publicación en UK',
      'Feed BLM format',
      'Premium Listings',
      'Featured properties',
    ],
  },
  {
    id: 'zoopla',
    name: 'Zoopla',
    description: 'Segundo portal inmobiliario más grande de Reino Unido.',
    logo: '🏘️',
    website: 'https://www.zoopla.co.uk',
    country: 'UK',
    status: 'disconnected',
    configFields: [
      {
        name: 'ZOOPLA_API_KEY',
        label: 'API Key',
        type: 'password',
        required: true,
        placeholder: 'Tu API Key de Zoopla',
      },
      {
        name: 'ZOOPLA_BRANCH_ID',
        label: 'Branch ID',
        type: 'text',
        required: true,
        placeholder: 'Tu Branch ID',
      },
    ],
    features: [
      'Publicación en UK',
      'Integración ZPG',
      'Leads automáticos',
    ],
  },
];

export default function PortalesInmobiliariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [portalStatus, setPortalStatus] = useState<Record<string, any>>({});
  const [selectedPortal, setSelectedPortal] = useState<Portal | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState<string | null>(null);
  const [autoSync, setAutoSync] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchPortalStatus();
    }
  }, [status, router]);

  const fetchPortalStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/portals/status');
      if (response.ok) {
        const data = await response.json();
        setPortalStatus(data);
        // Inicializar auto-sync
        const syncState: Record<string, boolean> = {};
        portals.forEach(p => {
          syncState[p.id] = data[p.id]?.autoSync || false;
        });
        setAutoSync(syncState);
      }
    } catch (error) {
      logger.error('Error fetching portal status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async (portalId: string) => {
    try {
      setSyncing(portalId);
      const response = await fetch(`/api/portals/${portalId}/sync`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Sincronización con ${portals.find(p => p.id === portalId)?.name} completada`);
        await fetchPortalStatus();
      } else {
        toast.error(data.message || 'Error al sincronizar');
      }
    } catch (error) {
      logger.error('Error syncing:', error);
      toast.error('Error al sincronizar');
    } finally {
      setSyncing(null);
    }
  };

  const handleSaveConfig = async (portalId: string) => {
    try {
      const response = await fetch(`/api/portals/${portalId}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configValues),
      });

      if (response.ok) {
        toast.success('Configuración guardada exitosamente');
        setSelectedPortal(null);
        setConfigValues({});
        await fetchPortalStatus();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Error al guardar configuración');
      }
    } catch (error) {
      logger.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    }
  };

  const handleDisconnect = async (portalId: string) => {
    if (!confirm('¿Estás seguro de que quieres desconectar este portal? Se dejarán de sincronizar los inmuebles.')) {
      return;
    }

    try {
      const response = await fetch(`/api/portals/${portalId}/disconnect`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Portal desconectado');
        await fetchPortalStatus();
      } else {
        toast.error('Error al desconectar');
      }
    } catch (error) {
      logger.error('Error disconnecting:', error);
      toast.error('Error al desconectar');
    }
  };

  const toggleAutoSync = async (portalId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/portals/${portalId}/auto-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setAutoSync(prev => ({ ...prev, [portalId]: enabled }));
        toast.success(enabled ? 'Auto-sincronización activada' : 'Auto-sincronización desactivada');
      }
    } catch (error) {
      logger.error('Error toggling auto-sync:', error);
    }
  };

  const getPortalStatus = (portalId: string): 'connected' | 'disconnected' => {
    return portalStatus[portalId]?.connected ? 'connected' : 'disconnected';
  };

  const getPortalStats = (portalId: string) => {
    return portalStatus[portalId]?.stats || null;
  };

  const getStatusBadge = (portalId: string) => {
    const status = getPortalStatus(portalId);

    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Conectado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Unlink className="w-3 h-3 mr-1" /> Desconectado
          </Badge>
        );
    }
  };

  // Agrupar portales por país
  const portalsByCountry = portals.reduce((acc, portal) => {
    if (!acc[portal.country]) {
      acc[portal.country] = [];
    }
    acc[portal.country].push(portal);
    return acc;
  }, {} as Record<string, Portal[]>);

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-96 mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Portales Inmobiliarios</h1>
            <p className="text-muted-foreground mt-2">
              Conecta y sincroniza tus inmuebles con los principales portales inmobiliarios.
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-base py-2 px-4">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
              {Object.values(portalStatus).filter((p: any) => p?.connected).length} conectados
            </Badge>
            <Badge variant="outline" className="text-base py-2 px-4">
              <Home className="w-4 h-4 mr-2" />
              {Object.values(portalStatus).reduce((sum: number, p: any) => sum + (p?.stats?.activeListings || 0), 0)} anuncios activos
            </Badge>
          </div>
        </div>

        {/* Alert informativo */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            La sincronización automática publica tus inmuebles en los portales conectados cada 6 horas.
            Puedes forzar una sincronización manual en cualquier momento.
          </AlertDescription>
        </Alert>

        {/* Vista de configuración individual */}
        {selectedPortal ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{selectedPortal.logo}</span>
                  <div>
                    <CardTitle>{selectedPortal.name}</CardTitle>
                    <CardDescription>{selectedPortal.description}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPortal(null);
                    setConfigValues({});
                  }}
                >
                  Volver
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Para obtener las credenciales de API, contacta con el departamento comercial de{' '}
                  <a href={selectedPortal.website} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    {selectedPortal.name}
                  </a>
                  . Las credenciales se almacenan de forma segura y encriptada.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {selectedPortal.configFields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id={field.name}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={configValues[field.name] || ''}
                      onChange={(e) =>
                        setConfigValues((prev) => ({
                          ...prev,
                          [field.name]: e.target.value,
                        }))
                      }
                      required={field.required}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <a
                  href={selectedPortal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ir a {selectedPortal.name}
                </a>
                <Button onClick={() => handleSaveConfig(selectedPortal.id)}>
                  Guardar y conectar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Lista de portales por país */
          <Tabs defaultValue="España" className="space-y-6">
            <TabsList>
              {Object.keys(portalsByCountry).map((country) => (
                <TabsTrigger key={country} value={country}>
                  <Globe className="w-4 h-4 mr-2" />
                  {country} ({portalsByCountry[country].length})
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(portalsByCountry).map(([country, countryPortals]) => (
              <TabsContent key={country} value={country}>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {countryPortals.map((portal) => {
                    const isConnected = getPortalStatus(portal.id) === 'connected';
                    const stats = getPortalStats(portal.id);

                    return (
                      <Card key={portal.id} className={`relative ${isConnected ? 'border-green-200 bg-green-50/30' : ''}`}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{portal.logo}</span>
                              <div>
                                <CardTitle className="text-lg">{portal.name}</CardTitle>
                                <CardDescription className="text-xs line-clamp-2">
                                  {portal.description}
                                </CardDescription>
                              </div>
                            </div>
                            {getStatusBadge(portal.id)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Stats si está conectado */}
                          {isConnected && stats && (
                            <div className="grid grid-cols-3 gap-2 text-center p-3 bg-white rounded-lg border">
                              <div>
                                <div className="text-lg font-bold">{stats.activeListings || 0}</div>
                                <div className="text-xs text-muted-foreground">Anuncios</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold">{stats.views || 0}</div>
                                <div className="text-xs text-muted-foreground">Visitas</div>
                              </div>
                              <div>
                                <div className="text-lg font-bold">{stats.leads || 0}</div>
                                <div className="text-xs text-muted-foreground">Leads</div>
                              </div>
                            </div>
                          )}

                          {/* Features */}
                          <div>
                            <h4 className="text-xs font-semibold mb-2 text-muted-foreground">FUNCIONALIDADES:</h4>
                            <ul className="text-xs space-y-1">
                              {portal.features.slice(0, 3).map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                              {portal.features.length > 3 && (
                                <li className="text-muted-foreground">+{portal.features.length - 3} más</li>
                              )}
                            </ul>
                          </div>

                          {/* Auto-sync toggle si conectado */}
                          {isConnected && (
                            <div className="flex items-center justify-between p-2 bg-white rounded border">
                              <div className="flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm">Auto-sync</span>
                              </div>
                              <Switch
                                checked={autoSync[portal.id] || false}
                                onCheckedChange={(checked) => toggleAutoSync(portal.id, checked)}
                              />
                            </div>
                          )}

                          {/* Última sincronización */}
                          {isConnected && stats?.lastSync && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              Última sync: {new Date(stats.lastSync).toLocaleString('es-ES')}
                            </div>
                          )}

                          {/* Botones de acción */}
                          <div className="flex gap-2 pt-2">
                            {isConnected ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleSyncNow(portal.id)}
                                  disabled={syncing === portal.id}
                                >
                                  {syncing === portal.id ? (
                                    <>
                                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sincronizando...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4 mr-2" /> Sincronizar
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedPortal(portal)}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDisconnect(portal.id)}
                                >
                                  <Unlink className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => setSelectedPortal(portal)}
                              >
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Conectar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(portal.website, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* Guía de integración */}
        <Card>
          <CardHeader>
            <CardTitle>Guía de Publicación en Portales</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Cómo funciona:</h3>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">1.</span>
                    <span>Conecta tu cuenta del portal con las credenciales de API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">2.</span>
                    <span>Selecciona qué inmuebles quieres publicar en cada portal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">3.</span>
                    <span>Activa la sincronización automática o sincroniza manualmente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-primary">4.</span>
                    <span>Los leads de los portales llegarán directamente a tu CRM</span>
                  </li>
                </ol>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Datos sincronizados:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Título, descripción y características</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Fotos y tours virtuales</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Precio y condiciones</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Ubicación y planos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>Certificado energético</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
