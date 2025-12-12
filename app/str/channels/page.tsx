'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Share2, CheckCircle, AlertCircle, Clock, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';


interface STRChannel {
  id: string;
  listingId: string;
  canal: string;
  idExterno: string | null;
  urlExterna: string | null;
  sincronizacionAutomatica: boolean;
  ultimaSincronizacion: string | null;
  estado: string;
  configuracion: any;
  listing: {
    id: string;
    titulo: string;
    unit: {
      id: string;
      numero: string;
      building: {
        id: string;
        nombre: string;
      };
    };
  };
}

export default function STRChannelsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [channels, setChannels] = useState<STRChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCanal, setFilterCanal] = useState<string>('todos');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadChannels();
    }
  }, [status]);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/str/channels');
      if (res.ok) {
        const data = await res.json();
        setChannels(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      logger.error('Error loading channels:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const matchesSearch =
        channel.listing.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.canal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        channel.listing.unit.building.nombre.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCanal = filterCanal === 'todos' || channel.canal === filterCanal;
      const matchesEstado = filterEstado === 'todos' || channel.estado === filterEstado;

      return matchesSearch && matchesCanal && matchesEstado;
    });
  }, [channels, searchTerm, filterCanal, filterEstado]);

  const stats = useMemo(() => {
    return {
      total: channels.length,
      activos: channels.filter((c) => c.estado === 'activo').length,
      sincronizados: channels.filter((c) => c.ultimaSincronizacion).length,
      errores: channels.filter((c) => c.estado === 'error').length,
    };
  }, [channels]);

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      activo: { variant: 'default' as any, label: 'Activo' },
      pausado: { variant: 'secondary' as any, label: 'Pausado' },
      error: { variant: 'destructive' as any, label: 'Error' },
      desconectado: { variant: 'outline' as any, label: 'Desconectado' },
    };
    return badges[estado] || badges.desconectado;
  };

  const getCanalColor = (canal: string): string => {
    const colors: Record<string, string> = {
      airbnb: 'bg-red-100 text-red-800',
      booking: 'bg-blue-100 text-blue-800',
      vrbo: 'bg-purple-100 text-purple-800',
      expedia: 'bg-yellow-100 text-yellow-800',
      otros: 'bg-gray-100 text-gray-800',
    };
    return colors[canal.toLowerCase()] || colors.otros;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando canales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumbs y Título */}
            <div className="flex items-center justify-between">
              <div>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">
                        <Home className="h-4 w-4" />
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Canales STR</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl font-bold mt-2">Channel Manager STR</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona la sincronización con plataformas de alquiler turístico
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Canales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">Conexiones configuradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activos}</div>
                  <p className="text-xs text-muted-foreground mt-1">Canales sincronizando</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Sincronizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.sincronizados}</div>
                  <p className="text-xs text-muted-foreground mt-1">Con última sincronización</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Con Errores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">{stats.errores}</div>
                  <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      placeholder="Buscar por anuncio, canal, edificio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Select value={filterCanal} onValueChange={setFilterCanal}>
                      <SelectTrigger>
                        <SelectValue placeholder="Canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los canales</SelectItem>
                        <SelectItem value="airbnb">Airbnb</SelectItem>
                        <SelectItem value="booking">Booking.com</SelectItem>
                        <SelectItem value="vrbo">VRBO</SelectItem>
                        <SelectItem value="expedia">Expedia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Select value={filterEstado} onValueChange={setFilterEstado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="desconectado">Desconectado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Canales */}
            {filteredChannels.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Share2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay canales configurados</h3>
                  <p className="text-sm text-muted-foreground">
                    Conecta tus anuncios con plataformas como Airbnb, Booking.com y VRBO
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredChannels.map((channel) => {
                  const estadoBadge = getEstadoBadge(channel.estado);
                  return (
                    <Card key={channel.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Share2 className="h-5 w-5 text-primary" />
                              <Badge className={getCanalColor(channel.canal)}>
                                {channel.canal}
                              </Badge>
                              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                            </div>
                            <CardTitle className="text-lg">{channel.listing.titulo}</CardTitle>
                            <CardDescription className="mt-1">
                              <Building2 className="h-3 w-3 inline mr-1" />
                              {channel.listing.unit.building.nombre} - Unidad{' '}
                              {channel.listing.unit.numero}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">ID Externo</p>
                            <p className="font-medium">{channel.idExterno || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Sincronización</p>
                            <div className="flex items-center gap-1">
                              {channel.sincronizacionAutomatica ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-yellow-600" />
                              )}
                              <p className="font-medium">
                                {channel.sincronizacionAutomatica ? 'Automática' : 'Manual'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {channel.ultimaSincronizacion && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Última Sincronización</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <p className="font-medium">
                                {format(
                                  new Date(channel.ultimaSincronizacion),
                                  "d 'de' MMMM, HH:mm",
                                  { locale: es }
                                )}
                              </p>
                            </div>
                          </div>
                        )}

                        {channel.urlExterna && (
                          <div className="pt-2 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => window.open(channel.urlExterna!, '_blank')}
                            >
                              Ver en {channel.canal}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
