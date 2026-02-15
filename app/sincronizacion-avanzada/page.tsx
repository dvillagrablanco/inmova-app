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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RefreshCw,
  Link2,
  Calendar,
  Cloud,
  DollarSign,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  History,
  Settings,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// ============================================================================
// TIPOS
// ============================================================================

interface SyncConfig {
  id: string;
  nombre: string;
  tipo: string;
  plataforma: string;
  url?: string;
  direccion: string;
  frecuencia: number;
  activo: boolean;
  ultimaSincronizacion?: string;
}

interface SyncLog {
  id: string;
  configId: string;
  configNombre: string;
  plataforma: string;
  tipo: string;
  fecha: string;
  estado: string;
  registrosActualizados: number;
  duracion: number;
}

interface Stats {
  totalConfiguraciones: number;
  activas: number;
  plataformas: number;
  ultimaSincronizacion?: string;
  sincronizacionesHoy: number;
}

const PLATAFORMAS = [
  { value: 'airbnb', label: 'Airbnb', icon: '🏠' },
  { value: 'booking', label: 'Booking.com', icon: '🔵' },
  { value: 'vrbo', label: 'VRBO', icon: '🏡' },
  { value: 'google', label: 'Google Calendar', icon: '📅' },
  { value: 'ical', label: 'iCal', icon: '📆' },
  { value: 'tripadvisor', label: 'TripAdvisor', icon: '🦉' },
  { value: 'expedia', label: 'Expedia', icon: '✈️' },
  { value: 'custom', label: 'Personalizado', icon: '⚙️' },
];

const TIPOS_SYNC = [
  { value: 'calendario', label: 'Calendario / Disponibilidad' },
  { value: 'reservas', label: 'Reservas' },
  { value: 'precios', label: 'Precios' },
  { value: 'inventario', label: 'Inventario' },
  { value: 'reviews', label: 'Reseñas' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function SincronizacionAvanzadaPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  // Estados
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<SyncConfig[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState('conexiones');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Form state
  const [newConfig, setNewConfig] = useState({
    nombre: '',
    tipo: 'calendario',
    plataforma: 'airbnb',
    url: '',
    apiKey: '',
    direccion: 'bidireccional',
    frecuencia: 15,
    activo: true,
  });

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadConfigs(), loadLogs()]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/sync');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data.data || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/sync?logs=true');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  // Crear configuración
  const handleCreate = async () => {
    if (!newConfig.nombre || !newConfig.plataforma) {
      toast.error('Completa los campos requeridos');
      return;
    }

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        toast.success('Conexión creada exitosamente');
        setShowNewDialog(false);
        resetForm();
        loadConfigs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear conexión');
      }
    } catch (error) {
      console.error('Error creating config:', error);
      toast.error('Error al crear conexión');
    }
  };

  // Sincronizar manualmente
  const handleSync = async (configId: string) => {
    setSyncing(configId);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', configId }),
      });

      if (response.ok) {
        toast.success('Sincronización completada');
        loadData();
      } else {
        toast.error('Error en la sincronización');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Error en la sincronización');
    } finally {
      setSyncing(null);
    }
  };

  const resetForm = () => {
    setNewConfig({
      nombre: '',
      tipo: 'calendario',
      plataforma: 'airbnb',
      url: '',
      apiKey: '',
      direccion: 'bidireccional',
      frecuencia: 15,
      activo: true,
    });
  };

  // Obtener ícono de plataforma
  const getPlatformIcon = (plataforma: string): string => {
    const p = PLATAFORMAS.find(pl => pl.value === plataforma);
    return p?.icon || '🔗';
  };

  // Obtener color del estado
  const getEstadoColor = (estado: string): string => {
    switch (estado) {
      case 'completado': return 'bg-green-100 text-green-700';
      case 'error': return 'bg-red-100 text-red-700';
      case 'en_progreso': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Loading
  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 rounded-xl">
              <RefreshCw className="h-8 w-8 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Sincronización Avanzada</h1>
              <p className="text-muted-foreground">
                Conexiones con plataformas externas
              </p>
            </div>
          </div>
          <Button onClick={() => { resetForm(); setShowNewDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Conexión
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Link2 className="h-8 w-8 text-violet-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.totalConfiguraciones || 0}</p>
                  <p className="text-xs text-muted-foreground">Conexiones</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats?.activas || 0}</p>
                  <p className="text-xs text-muted-foreground">Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Cloud className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.plataformas || 0}</p>
                  <p className="text-xs text-muted-foreground">Plataformas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <History className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats?.sincronizacionesHoy || 0}</p>
                  <p className="text-xs text-muted-foreground">Hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-gray-500" />
                <div>
                  <p className="text-sm font-bold">
                    {stats?.ultimaSincronizacion 
                      ? formatDistanceToNow(new Date(stats.ultimaSincronizacion), { addSuffix: true, locale: es })
                      : 'Nunca'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">Última sync</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="conexiones" className="gap-2">
              <Link2 className="h-4 w-4" />
              Conexiones ({configs.length})
            </TabsTrigger>
            <TabsTrigger value="historial" className="gap-2">
              <History className="h-4 w-4" />
              Historial ({logs.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab: Conexiones */}
          <TabsContent value="conexiones" className="mt-4 space-y-4">
            {configs.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Link2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">Sin conexiones</h3>
                  <p className="text-muted-foreground">Configura tu primera sincronización</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {configs.map(config => (
                  <Card key={config.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getPlatformIcon(config.plataforma)}</span>
                          <div>
                            <CardTitle className="text-lg">{config.nombre}</CardTitle>
                            <CardDescription className="capitalize">
                              {TIPOS_SYNC.find(t => t.value === config.tipo)?.label || config.tipo}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant={config.activo ? 'default' : 'secondary'}>
                          {config.activo ? 'Activa' : 'Pausada'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Plataforma</span>
                        <span className="capitalize">{config.plataforma}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Dirección</span>
                        <span className="capitalize">{config.direccion}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frecuencia</span>
                        <span>Cada {config.frecuencia} min</span>
                      </div>
                      {config.ultimaSincronizacion && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Última sync</span>
                          <span>
                            {formatDistanceToNow(new Date(config.ultimaSincronizacion), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSync(config.id)}
                          disabled={syncing === config.id}
                        >
                          <RefreshCw className={`h-4 w-4 mr-1 ${syncing === config.id ? 'animate-spin' : ''}`} />
                          {syncing === config.id ? 'Sincronizando...' : 'Sincronizar'}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Historial */}
          <TabsContent value="historial" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {logs.length === 0 ? (
                  <div className="py-16 text-center">
                    <History className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Sin historial</h3>
                    <p className="text-muted-foreground">Las sincronizaciones aparecerán aquí</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Conexión</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Registros</TableHead>
                        <TableHead>Duración</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{getPlatformIcon(log.plataforma)}</span>
                              <span className="font-medium">{log.configNombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{log.tipo}</TableCell>
                          <TableCell>
                            {format(new Date(log.fecha), "dd MMM HH:mm", { locale: es })}
                          </TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(log.estado)}>
                              {log.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.registrosActualizados}</TableCell>
                          <TableCell>{(log.duracion / 1000).toFixed(1)}s</TableCell>
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

      {/* Dialog: Nueva Conexión */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Conexión de Sincronización</DialogTitle>
            <DialogDescription>Configura una nueva integración</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nombre de la conexión *</Label>
                <Input
                  placeholder="Airbnb - Apartamento Centro"
                  value={newConfig.nombre}
                  onChange={e => setNewConfig(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select
                  value={newConfig.plataforma}
                  onValueChange={v => setNewConfig(prev => ({ ...prev, plataforma: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATAFORMAS.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de sincronización</Label>
                <Select
                  value={newConfig.tipo}
                  onValueChange={v => setNewConfig(prev => ({ ...prev, tipo: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SYNC.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label>URL de sincronización (iCal, API)</Label>
                <Input
                  placeholder="https://..."
                  value={newConfig.url}
                  onChange={e => setNewConfig(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Select
                  value={newConfig.direccion}
                  onValueChange={v => setNewConfig(prev => ({ ...prev, direccion: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Solo entrada</SelectItem>
                    <SelectItem value="salida">Solo salida</SelectItem>
                    <SelectItem value="bidireccional">Bidireccional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frecuencia (minutos)</Label>
                <Select
                  value={newConfig.frecuencia.toString()}
                  onValueChange={v => setNewConfig(prev => ({ ...prev, frecuencia: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 min</SelectItem>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="360">6 horas</SelectItem>
                    <SelectItem value="1440">24 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={newConfig.activo}
                onCheckedChange={v => setNewConfig(prev => ({ ...prev, activo: v }))}
              />
              <Label className="font-normal">Activar sincronización automática</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Crear Conexión</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
