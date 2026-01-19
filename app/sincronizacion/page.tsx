'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/lazy-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  RefreshCw,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Link,
  Unlink,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  MoreVertical,
  AlertCircle,
  Activity,
  Database,
  Cloud,
  Globe,
  ArrowRightLeft,
  History,
  Zap,
  Building2,
  Home,
  FileText,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

// Interfaces
interface SyncConnection {
  id: string;
  nombre: string;
  tipo: string; // PORTAL_INMOBILIARIO, CRM, ERP, API_EXTERNA, WEBHOOK
  plataforma: string; // idealista, fotocasa, habitaclia, salesforce, hubspot, custom
  estado: string; // ACTIVO, INACTIVO, ERROR, SINCRONIZANDO
  frecuencia: string; // MANUAL, CADA_HORA, CADA_6_HORAS, DIARIO, SEMANAL
  ultimaSincronizacion?: string;
  proximaSincronizacion?: string;
  registrosSincronizados: number;
  erroresUltimaSinc: number;
  direccion: string; // BIDIRECCIONAL, SOLO_IMPORTAR, SOLO_EXPORTAR
  entidadesSincronizadas: string[]; // PROPIEDADES, INQUILINOS, CONTRATOS, etc.
  configuracion?: {
    apiKey?: string;
    apiUrl?: string;
    webhookUrl?: string;
  };
  notas?: string;
  createdAt: string;
}

interface SyncLog {
  id: string;
  connectionId: string;
  connectionName: string;
  tipo: string; // IMPORTACION, EXPORTACION, BIDIRECCIONAL
  estado: string; // EXITOSA, FALLIDA, PARCIAL
  registrosCreados: number;
  registrosActualizados: number;
  registrosEliminados: number;
  errores: number;
  duracion: number; // ms
  mensaje?: string;
  detalles?: string[];
  ejecutadoEn: string;
}

// Constantes
const CONNECTION_TYPES = [
  { value: 'PORTAL_INMOBILIARIO', label: 'Portal Inmobiliario', icon: Globe },
  { value: 'CRM', label: 'CRM', icon: Users },
  { value: 'ERP', label: 'ERP', icon: Database },
  { value: 'API_EXTERNA', label: 'API Externa', icon: Cloud },
  { value: 'WEBHOOK', label: 'Webhook', icon: Zap },
];

const PLATFORMS = {
  PORTAL_INMOBILIARIO: [
    { value: 'idealista', label: 'Idealista' },
    { value: 'fotocasa', label: 'Fotocasa' },
    { value: 'habitaclia', label: 'Habitaclia' },
    { value: 'pisos', label: 'Pisos.com' },
    { value: 'yaencontre', label: 'Yaencontre' },
  ],
  CRM: [
    { value: 'salesforce', label: 'Salesforce' },
    { value: 'hubspot', label: 'HubSpot' },
    { value: 'zoho', label: 'Zoho CRM' },
    { value: 'pipedrive', label: 'Pipedrive' },
  ],
  ERP: [
    { value: 'sap', label: 'SAP' },
    { value: 'odoo', label: 'Odoo' },
    { value: 'dynamics', label: 'Microsoft Dynamics' },
  ],
  API_EXTERNA: [
    { value: 'custom', label: 'API Personalizada' },
  ],
  WEBHOOK: [
    { value: 'webhook', label: 'Webhook Personalizado' },
  ],
};

const FREQUENCIES = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CADA_HORA', label: 'Cada hora' },
  { value: 'CADA_6_HORAS', label: 'Cada 6 horas' },
  { value: 'DIARIO', label: 'Diario' },
  { value: 'SEMANAL', label: 'Semanal' },
];

const DIRECTIONS = [
  { value: 'BIDIRECCIONAL', label: 'Bidireccional' },
  { value: 'SOLO_IMPORTAR', label: 'Solo importar' },
  { value: 'SOLO_EXPORTAR', label: 'Solo exportar' },
];

const ENTITIES = [
  { value: 'PROPIEDADES', label: 'Propiedades', icon: Building2 },
  { value: 'INQUILINOS', label: 'Inquilinos', icon: Users },
  { value: 'CONTRATOS', label: 'Contratos', icon: FileText },
  { value: 'EDIFICIOS', label: 'Edificios', icon: Home },
];

const emptyForm = {
  nombre: '',
  tipo: 'PORTAL_INMOBILIARIO',
  plataforma: '',
  frecuencia: 'DIARIO',
  direccion: 'BIDIRECCIONAL',
  entidadesSincronizadas: [] as string[],
  apiKey: '',
  apiUrl: '',
  webhookUrl: '',
  notas: '',
};

export default function SincronizacionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<SyncConnection[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);

  // Selected items
  const [connectionToEdit, setConnectionToEdit] = useState<SyncConnection | null>(null);
  const [connectionToDelete, setConnectionToDelete] = useState<SyncConnection | null>(null);
  const [selectedConnectionLogs, setSelectedConnectionLogs] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState(emptyForm);

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

      // Cargar conexiones
      const connectionsRes = await fetch('/api/sync/connections');
      if (connectionsRes.ok) {
        const data = await connectionsRes.json();
        setConnections(data.data || data);
      }

      // Cargar logs recientes
      const logsRes = await fetch('/api/sync/logs');
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.data || data);
      }
    } catch (error) {
      console.error('Error loading sync data:', error);
      toast.error('Error al cargar datos de sincronización');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.plataforma) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/sync/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          configuracion: {
            apiKey: formData.apiKey,
            apiUrl: formData.apiUrl,
            webhookUrl: formData.webhookUrl,
          },
        }),
      });

      if (res.ok) {
        toast.success('Conexión creada exitosamente');
        setCreateDialogOpen(false);
        setFormData(emptyForm);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear conexión');
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      toast.error('Error al crear conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectionToEdit) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sync/connections/${connectionToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          configuracion: {
            apiKey: formData.apiKey,
            apiUrl: formData.apiUrl,
            webhookUrl: formData.webhookUrl,
          },
        }),
      });

      if (res.ok) {
        toast.success('Conexión actualizada exitosamente');
        setEditDialogOpen(false);
        setConnectionToEdit(null);
        setFormData(emptyForm);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al actualizar conexión');
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      toast.error('Error al actualizar conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!connectionToDelete) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/sync/connections/${connectionToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Conexión eliminada exitosamente');
        setDeleteDialogOpen(false);
        setConnectionToDelete(null);
        loadData();
      } else {
        toast.error('Error al eliminar conexión');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      toast.error('Error al eliminar conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleConnection = async (id: string, currentState: string) => {
    const newState = currentState === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      const res = await fetch(`/api/sync/connections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newState }),
      });

      if (res.ok) {
        toast.success(`Conexión ${newState === 'ACTIVO' ? 'activada' : 'desactivada'}`);
        loadData();
      } else {
        toast.error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const runSync = async (id: string) => {
    try {
      const res = await fetch(`/api/sync/connections/${id}/run`, {
        method: 'POST',
      });

      if (res.ok) {
        toast.success('Sincronización iniciada');
        loadData();
      } else {
        toast.error('Error al iniciar sincronización');
      }
    } catch (error) {
      console.error('Error running sync:', error);
      toast.error('Error al iniciar sincronización');
    }
  };

  const openEditDialog = (connection: SyncConnection) => {
    setConnectionToEdit(connection);
    setFormData({
      nombre: connection.nombre,
      tipo: connection.tipo,
      plataforma: connection.plataforma,
      frecuencia: connection.frecuencia,
      direccion: connection.direccion,
      entidadesSincronizadas: connection.entidadesSincronizadas || [],
      apiKey: connection.configuracion?.apiKey || '',
      apiUrl: connection.configuracion?.apiUrl || '',
      webhookUrl: connection.configuracion?.webhookUrl || '',
      notas: connection.notas || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (connection: SyncConnection) => {
    setConnectionToDelete(connection);
    setDeleteDialogOpen(true);
  };

  const viewLogs = (connectionId: string) => {
    setSelectedConnectionLogs(connectionId);
    setLogsDialogOpen(true);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>;
      case 'INACTIVO':
        return <Badge variant="secondary">Inactivo</Badge>;
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>;
      case 'SINCRONIZANDO':
        return <Badge className="bg-blue-100 text-blue-800">Sincronizando...</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getLogStatusBadge = (estado: string) => {
    switch (estado) {
      case 'EXITOSA':
        return <Badge className="bg-green-100 text-green-800">Exitosa</Badge>;
      case 'FALLIDA':
        return <Badge variant="destructive">Fallida</Badge>;
      case 'PARCIAL':
        return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getTypeIcon = (tipo: string) => {
    const typeConfig = CONNECTION_TYPES.find(t => t.value === tipo);
    return typeConfig?.icon || Cloud;
  };

  const filteredLogs = selectedConnectionLogs
    ? logs.filter(log => log.connectionId === selectedConnectionLogs)
    : logs;

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Sincronización de Datos
            </h1>
            <p className="text-gray-600 mt-1">
              Conecta y sincroniza datos con portales inmobiliarios, CRMs y sistemas externos
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Conexión
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conexiones Totales</CardTitle>
              <Link className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connections.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conexiones Activas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connections.filter(c => c.estado === 'ACTIVO').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Sincronizados</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {connections.reduce((sum, c) => sum + c.registrosSincronizados, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sincronizaciones Hoy</CardTitle>
              <Activity className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {logs.filter(l => {
                  const today = new Date();
                  const logDate = new Date(l.ejecutadoEn);
                  return logDate.toDateString() === today.toDateString();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="connections" className="space-y-4">
          <TabsList>
            <TabsTrigger value="connections">Conexiones</TabsTrigger>
            <TabsTrigger value="history">Historial de Sincronizaciones</TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            {connections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Unlink className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay conexiones configuradas</h3>
                  <p className="text-gray-500 mb-4">
                    Crea tu primera conexión para sincronizar datos
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Conexión
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {connections.map((connection) => {
                  const TypeIcon = getTypeIcon(connection.tipo);
                  return (
                    <Card key={connection.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <TypeIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{connection.nombre}</CardTitle>
                              <CardDescription>
                                {connection.plataforma} · {connection.tipo.replace('_', ' ')}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(connection.estado)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(connection)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => viewLogs(connection.id)}>
                                  <History className="h-4 w-4 mr-2" />
                                  Ver Historial
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(connection)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-gray-600">Frecuencia</div>
                            <div className="font-semibold">{connection.frecuencia.replace('_', ' ')}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Dirección</div>
                            <div className="font-semibold">{connection.direccion.replace('_', ' ')}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Registros Sincronizados</div>
                            <div className="font-semibold">{connection.registrosSincronizados.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Última Sincronización</div>
                            <div className="font-semibold">
                              {connection.ultimaSincronizacion
                                ? format(new Date(connection.ultimaSincronizacion), 'dd/MM/yyyy HH:mm', { locale: es })
                                : 'Nunca'}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Entidades</div>
                            <div className="flex flex-wrap gap-1">
                              {connection.entidadesSincronizadas?.map(entity => (
                                <Badge key={entity} variant="outline" className="text-xs">
                                  {entity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {connection.erroresUltimaSinc > 0 && (
                          <div className="mb-4 p-2 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">
                              {connection.erroresUltimaSinc} errores en la última sincronización
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleConnection(connection.id, connection.estado)}
                          >
                            {connection.estado === 'ACTIVO' ? (
                              <>
                                <Pause className="h-4 w-4 mr-1" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Activar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => runSync(connection.id)}
                            disabled={connection.estado !== 'ACTIVO'}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Sincronizar Ahora
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Sincronizaciones</CardTitle>
                <CardDescription>Últimas sincronizaciones ejecutadas</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No hay sincronizaciones registradas</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conexión</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.connectionName}</TableCell>
                          <TableCell>{log.tipo}</TableCell>
                          <TableCell>{getLogStatusBadge(log.estado)}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="text-green-600">+{log.registrosCreados}</span>
                              {' / '}
                              <span className="text-blue-600">~{log.registrosActualizados}</span>
                              {log.registrosEliminados > 0 && (
                                <>
                                  {' / '}
                                  <span className="text-red-600">-{log.registrosEliminados}</span>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{(log.duracion / 1000).toFixed(1)}s</TableCell>
                          <TableCell>
                            {format(new Date(log.ejecutadoEn), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Conexión de Sincronización</DialogTitle>
            <DialogDescription>
              Configura una nueva conexión para sincronizar datos con sistemas externos
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de la Conexión *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Sincronización con Idealista"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Conexión *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value, plataforma: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONNECTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Plataforma *</Label>
                  <Select
                    value={formData.plataforma}
                    onValueChange={(value) => setFormData({ ...formData, plataforma: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS[formData.tipo as keyof typeof PLATFORMS]?.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frecuencia</Label>
                  <Select
                    value={formData.frecuencia}
                    onValueChange={(value) => setFormData({ ...formData, frecuencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Select
                    value={formData.direccion}
                    onValueChange={(value) => setFormData({ ...formData, direccion: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTIONS.map((dir) => (
                        <SelectItem key={dir.value} value={dir.value}>
                          {dir.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Entidades a Sincronizar</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ENTITIES.map((entity) => (
                    <div key={entity.value} className="flex items-center space-x-2">
                      <Switch
                        id={`entity-${entity.value}`}
                        checked={formData.entidadesSincronizadas.includes(entity.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              entidadesSincronizadas: [...formData.entidadesSincronizadas, entity.value],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              entidadesSincronizadas: formData.entidadesSincronizadas.filter(e => e !== entity.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`entity-${entity.value}`}>{entity.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Tu API Key"
                />
              </div>

              <div className="space-y-2">
                <Label>URL de la API</Label>
                <Input
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  placeholder="https://api.ejemplo.com/v1"
                />
              </div>

              {formData.tipo === 'WEBHOOK' && (
                <div className="space-y-2">
                  <Label>URL del Webhook</Label>
                  <Input
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://tu-webhook.com/endpoint"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales sobre esta conexión..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Creando...' : 'Crear Conexión'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Conexión</DialogTitle>
            <DialogDescription>
              Modifica la configuración de la conexión
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de la Conexión *</Label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Conexión *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value, plataforma: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONNECTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Plataforma *</Label>
                  <Select
                    value={formData.plataforma}
                    onValueChange={(value) => setFormData({ ...formData, plataforma: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS[formData.tipo as keyof typeof PLATFORMS]?.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frecuencia</Label>
                  <Select
                    value={formData.frecuencia}
                    onValueChange={(value) => setFormData({ ...formData, frecuencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <Select
                    value={formData.direccion}
                    onValueChange={(value) => setFormData({ ...formData, direccion: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIRECTIONS.map((dir) => (
                        <SelectItem key={dir.value} value={dir.value}>
                          {dir.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Entidades a Sincronizar</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ENTITIES.map((entity) => (
                    <div key={entity.value} className="flex items-center space-x-2">
                      <Switch
                        id={`edit-entity-${entity.value}`}
                        checked={formData.entidadesSincronizadas.includes(entity.value)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              entidadesSincronizadas: [...formData.entidadesSincronizadas, entity.value],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              entidadesSincronizadas: formData.entidadesSincronizadas.filter(e => e !== entity.value),
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`edit-entity-${entity.value}`}>{entity.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Tu API Key"
                />
              </div>

              <div className="space-y-2">
                <Label>URL de la API</Label>
                <Input
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  placeholder="https://api.ejemplo.com/v1"
                />
              </div>

              {formData.tipo === 'WEBHOOK' && (
                <div className="space-y-2">
                  <Label>URL del Webhook</Label>
                  <Input
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://tu-webhook.com/endpoint"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar conexión?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará la conexión &quot;{connectionToDelete?.nombre}&quot; permanentemente.
              Se perderá el historial de sincronizaciones asociado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSaving}>
              {isSaving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial de Sincronizaciones</DialogTitle>
            <DialogDescription>
              Últimas sincronizaciones de esta conexión
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay sincronizaciones registradas</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {log.estado === 'EXITOSA' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : log.estado === 'FALLIDA' ? (
                          <XCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <div className="font-semibold">
                            {format(new Date(log.ejecutadoEn), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {log.mensaje || `${log.registrosCreados} creados, ${log.registrosActualizados} actualizados`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {getLogStatusBadge(log.estado)}
                        <div className="text-xs text-gray-500 mt-1">
                          {(log.duracion / 1000).toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
