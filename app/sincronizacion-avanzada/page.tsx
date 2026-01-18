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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  RefreshCw,
  Zap,
  Cloud,
  Globe,
  Link2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Settings,
  Play,
  Pause,
  Eye,
  Trash2,
  Plus,
  ArrowUpDown,
  History,
  AlertTriangle,
  Activity,
  Database,
  FileJson,
  Webhook,
  Calendar,
  Home,
  Users,
  CreditCard,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Integracion {
  id: string;
  nombre: string;
  tipo: 'portal' | 'software' | 'api' | 'webhook';
  plataforma: string;
  estado: 'conectado' | 'desconectado' | 'error' | 'sincronizando';
  ultimaSync: string;
  proximaSync?: string;
  registrosSincronizados: number;
  errores: number;
  configuracion: {
    autoSync: boolean;
    frecuencia: string;
    direccion: 'bidireccional' | 'push' | 'pull';
  };
}

interface LogSync {
  id: string;
  integracionId: string;
  integracionNombre: string;
  fecha: string;
  tipo: 'sync' | 'push' | 'pull' | 'webhook';
  estado: 'completado' | 'error' | 'parcial';
  registrosCreados: number;
  registrosActualizados: number;
  registrosEliminados: number;
  errores: number;
  duracion: number; // en segundos
  detalles?: string;
}

interface Conflicto {
  id: string;
  integracionId: string;
  integracionNombre: string;
  fecha: string;
  entidad: string;
  campoConflicto: string;
  valorLocal: string;
  valorRemoto: string;
  estado: 'pendiente' | 'resuelto_local' | 'resuelto_remoto' | 'ignorado';
}

interface WebhookConfig {
  id: string;
  nombre: string;
  url: string;
  eventos: string[];
  estado: 'activo' | 'inactivo' | 'error';
  ultimaEjecucion?: string;
  secretKey: string;
}

export default function SincronizacionAvanzadaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('integraciones');
  const [syncing, setSyncing] = useState<string | null>(null);

  const [integraciones, setIntegraciones] = useState<Integracion[]>([]);
  const [logs, setLogs] = useState<LogSync[]>([]);
  const [conflictos, setConflictos] = useState<Conflicto[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showWebhookDialog, setShowWebhookDialog] = useState(false);

  // KPIs
  const integraciionesActivas = integraciones.filter(i => i.estado === 'conectado').length;
  const totalSincronizados = integraciones.reduce((acc, i) => acc + i.registrosSincronizados, 0);
  const erroresPendientes = integraciones.reduce((acc, i) => acc + i.errores, 0);
  const conflictosPendientes = conflictos.filter(c => c.estado === 'pendiente').length;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const [intRes, logsRes, confRes, webhooksRes] = await Promise.all([
      //   fetch('/api/sync/integraciones'),
      //   fetch('/api/sync/logs?limit=50'),
      //   fetch('/api/sync/conflictos'),
      //   fetch('/api/sync/webhooks'),
      // ]);

      // Estado vacío inicial
      setIntegraciones([]);
      setLogs([]);
      setConflictos([]);
      setWebhooks([]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar configuración de sincronización');
    } finally {
      setLoading(false);
    }
  };

  const sincronizarIntegracion = async (id: string) => {
    try {
      setSyncing(id);
      // TODO: Integrar con API real
      // await fetch(`/api/sync/integraciones/${id}/sync`, { method: 'POST' });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular
      toast.success('Sincronización iniciada');
      loadData();
    } catch (error) {
      toast.error('Error al iniciar sincronización');
    } finally {
      setSyncing(null);
    }
  };

  const resolverConflicto = async (id: string, resolucion: 'local' | 'remoto' | 'ignorar') => {
    try {
      // TODO: Integrar con API real
      toast.success(`Conflicto resuelto: ${resolucion}`);
      loadData();
    } catch (error) {
      toast.error('Error al resolver conflicto');
    }
  };

  const toggleIntegracion = async (id: string, activo: boolean) => {
    try {
      // TODO: Integrar con API real
      toast.success(`Integración ${activo ? 'activada' : 'desactivada'}`);
      loadData();
    } catch (error) {
      toast.error('Error al actualizar integración');
    }
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      conectado: 'bg-green-100 text-green-800',
      desconectado: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
      sincronizando: 'bg-blue-100 text-blue-800',
      activo: 'bg-green-100 text-green-800',
      inactivo: 'bg-gray-100 text-gray-800',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  const getTipoIcon = (tipo: string) => {
    const iconos: Record<string, any> = {
      portal: Globe,
      software: Database,
      api: FileJson,
      webhook: Webhook,
    };
    return iconos[tipo] || Link2;
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando configuración de sincronización...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Cloud className="h-8 w-8 text-blue-600" />
                Sincronización Avanzada
              </h1>
              <p className="text-muted-foreground mt-1">
                Configuración de sincronización multi-plataforma
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Integración
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Integraciones Activas</span>
                <Link2 className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{integraciionesActivas}</p>
              <p className="text-xs text-muted-foreground">de {integraciones.length} configuradas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Registros Sincronizados</span>
                <ArrowUpDown className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{totalSincronizados.toLocaleString('es-ES')}</p>
              <p className="text-xs text-muted-foreground">total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Errores Pendientes</span>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold">{erroresPendientes}</p>
              <p className="text-xs text-muted-foreground">requieren atención</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Conflictos</span>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold">{conflictosPendientes}</p>
              <p className="text-xs text-muted-foreground">por resolver</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="integraciones">
              <Link2 className="h-4 w-4 mr-2" />
              Integraciones
            </TabsTrigger>
            <TabsTrigger value="webhooks">
              <Webhook className="h-4 w-4 mr-2" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="conflictos">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Conflictos
              {conflictosPendientes > 0 && (
                <Badge variant="destructive" className="ml-2">{conflictosPendientes}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="logs">
              <History className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Integraciones */}
          <TabsContent value="integraciones" className="space-y-4">
            {integraciones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Cloud className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay integraciones configuradas</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Conecta tus portales inmobiliarios, software de gestión y APIs para sincronizar datos automáticamente.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Primera Integración
                  </Button>

                  {/* Integraciones Disponibles */}
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    {[
                      { nombre: 'Idealista', tipo: 'Portal Inmobiliario', icon: Home },
                      { nombre: 'Fotocasa', tipo: 'Portal Inmobiliario', icon: Home },
                      { nombre: 'Stripe', tipo: 'Pagos', icon: CreditCard },
                      { nombre: 'Google Calendar', tipo: 'Calendario', icon: Calendar },
                      { nombre: 'Contasimple', tipo: 'Contabilidad', icon: Database },
                      { nombre: 'Holded', tipo: 'ERP', icon: Building2 },
                      { nombre: 'Mailchimp', tipo: 'Marketing', icon: Users },
                      { nombre: 'API Custom', tipo: 'Personalizada', icon: FileJson },
                    ].map((int, i) => {
                      const Icon = int.icon;
                      return (
                        <Card key={i} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAddDialog(true)}>
                          <CardContent className="p-4 text-center">
                            <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                            <p className="font-medium text-sm">{int.nombre}</p>
                            <p className="text-xs text-muted-foreground">{int.tipo}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {integraciones.map((integracion) => {
                  const TipoIcon = getTipoIcon(integracion.tipo);
                  return (
                    <Card key={integracion.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-lg">
                              <TipoIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{integracion.nombre}</h3>
                              <p className="text-sm text-muted-foreground">{integracion.plataforma}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm font-medium">{integracion.registrosSincronizados.toLocaleString()} registros</p>
                              <p className="text-xs text-muted-foreground">
                                Última sync: {integracion.ultimaSync ? new Date(integracion.ultimaSync).toLocaleString('es-ES') : 'Nunca'}
                              </p>
                            </div>
                            <Badge className={getEstadoColor(integracion.estado)}>
                              {integracion.estado}
                            </Badge>
                            <Switch
                              checked={integracion.estado === 'conectado'}
                              onCheckedChange={(checked) => toggleIntegracion(integracion.id, checked)}
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={syncing === integracion.id}
                              onClick={() => sincronizarIntegracion(integracion.id)}
                            >
                              <RefreshCw className={`h-4 w-4 ${syncing === integracion.id ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </div>
                        {integracion.errores > 0 && (
                          <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            {integracion.errores} errores en la última sincronización
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Webhooks */}
          <TabsContent value="webhooks" className="space-y-4">
            {webhooks.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Webhook className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay webhooks configurados</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Configura webhooks para recibir notificaciones en tiempo real cuando ocurran eventos en tu plataforma.
                  </p>
                  <Button onClick={() => setShowWebhookDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Webhook
                  </Button>

                  <div className="mt-8 max-w-lg mx-auto">
                    <h4 className="font-medium mb-3">Eventos Disponibles:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        'property.created', 'property.updated', 'property.deleted',
                        'tenant.created', 'tenant.updated', 'contract.signed',
                        'payment.received', 'payment.overdue', 'maintenance.created',
                        'maintenance.completed', 'booking.created', 'booking.cancelled',
                      ].map((evento, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <Zap className="h-3 w-3 text-amber-500" />
                          <code className="text-xs">{evento}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Webhooks Configurados</CardTitle>
                      <CardDescription>Endpoints para eventos en tiempo real</CardDescription>
                    </div>
                    <Button size="sm" onClick={() => setShowWebhookDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Eventos</TableHead>
                        <TableHead>Última Ejecución</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhooks.map((webhook) => (
                        <TableRow key={webhook.id}>
                          <TableCell className="font-medium">{webhook.nombre}</TableCell>
                          <TableCell className="font-mono text-xs">{webhook.url}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{webhook.eventos.length} eventos</Badge>
                          </TableCell>
                          <TableCell>
                            {webhook.ultimaEjecucion 
                              ? new Date(webhook.ultimaEjecucion).toLocaleString('es-ES')
                              : 'Nunca'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(webhook.estado)}>
                              {webhook.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Conflictos */}
          <TabsContent value="conflictos" className="space-y-4">
            {conflictos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin conflictos pendientes</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Todos los datos están sincronizados correctamente. Los conflictos aparecerán aquí cuando haya discrepancias entre sistemas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Conflictos de Sincronización</CardTitle>
                  <CardDescription>Resuelve las discrepancias entre sistemas</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Integración</TableHead>
                        <TableHead>Entidad</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Valor Local</TableHead>
                        <TableHead>Valor Remoto</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conflictos.filter(c => c.estado === 'pendiente').map((conflicto) => (
                        <TableRow key={conflicto.id}>
                          <TableCell className="font-medium">{conflicto.integracionNombre}</TableCell>
                          <TableCell>{conflicto.entidad}</TableCell>
                          <TableCell><code className="text-xs">{conflicto.campoConflicto}</code></TableCell>
                          <TableCell className="text-blue-600">{conflicto.valorLocal}</TableCell>
                          <TableCell className="text-amber-600">{conflicto.valorRemoto}</TableCell>
                          <TableCell>{new Date(conflicto.fecha).toLocaleString('es-ES')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="outline" onClick={() => resolverConflicto(conflicto.id, 'local')}>
                                Local
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => resolverConflicto(conflicto.id, 'remoto')}>
                                Remoto
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => resolverConflicto(conflicto.id, 'ignorar')}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Logs */}
          <TabsContent value="logs" className="space-y-4">
            {logs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin registros de sincronización</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Los logs de sincronización aparecerán aquí cuando se ejecuten sincronizaciones.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Logs de Sincronización</CardTitle>
                  <CardDescription>Historial de operaciones de sincronización</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Integración</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Creados</TableHead>
                        <TableHead className="text-right">Actualizados</TableHead>
                        <TableHead className="text-right">Errores</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.integracionNombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.tipo}</Badge>
                          </TableCell>
                          <TableCell>{new Date(log.fecha).toLocaleString('es-ES')}</TableCell>
                          <TableCell className="text-right text-green-600">+{log.registrosCreados}</TableCell>
                          <TableCell className="text-right text-blue-600">{log.registrosActualizados}</TableCell>
                          <TableCell className="text-right text-red-600">{log.errores}</TableCell>
                          <TableCell>{log.duracion}s</TableCell>
                          <TableCell>
                            <Badge className={
                              log.estado === 'completado' ? 'bg-green-100 text-green-800' :
                              log.estado === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {log.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog Nueva Integración */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva Integración</DialogTitle>
              <DialogDescription>
                Configura una nueva conexión con un servicio externo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Integración</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portal">Portal Inmobiliario</SelectItem>
                    <SelectItem value="software">Software de Gestión</SelectItem>
                    <SelectItem value="api">API Personalizada</SelectItem>
                    <SelectItem value="webhook">Webhook Entrante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="idealista">Idealista</SelectItem>
                    <SelectItem value="fotocasa">Fotocasa</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="google">Google Calendar</SelectItem>
                    <SelectItem value="custom">Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>API Key / Token</Label>
                <Input type="password" placeholder="Introduce tu API key" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sincronización Automática</Label>
                  <p className="text-xs text-muted-foreground">Sincronizar datos automáticamente</p>
                </div>
                <Switch />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                toast.success('Integración configurada');
                setShowAddDialog(false);
              }}>
                Conectar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
