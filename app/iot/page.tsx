'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Wifi,
  Thermometer,
  Lock,
  Lightbulb,
  Droplet,
  AlertTriangle,
  CheckCircle,
  Activity,
  Zap,
  Wind,
  Plus,
  Settings,
  TrendingDown,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';

interface IoTDevice {
  id: string;
  name: string;
  type: 'thermostat' | 'lock' | 'light' | 'sensor' | 'meter';
  status: 'online' | 'offline' | 'warning';
  location: string;
  buildingId: string;
  buildingName: string;
  battery?: number;
  lastUpdate: string;
  currentValue?: number;
  unit?: string;
}

interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  lastTriggered?: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  resolved: boolean;
}

export default function IoTPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<IoTDevice | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<IoTDevice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    type: 'sensor' as 'thermostat' | 'lock' | 'light' | 'sensor' | 'meter',
    location: '',
    status: 'online' as 'online' | 'offline' | 'warning',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
      // Simular actualización en tiempo real cada 5 segundos
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar dispositivos reales desde la API
      const response = await fetch('/api/iot/devices');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.devices && data.devices.length > 0) {
          setDevices(data.devices);
          
          // Generar alertas basadas en dispositivos
          const generatedAlerts: Alert[] = [];
          data.devices.forEach((device: IoTDevice) => {
            if (device.battery !== undefined && device.battery < 20) {
              generatedAlerts.push({
                id: `al_${device.id}_battery`,
                type: 'warning',
                message: `Batería baja en ${device.name}`,
                deviceId: device.id,
                deviceName: device.name,
                timestamp: new Date().toISOString(),
                resolved: false,
              });
            }
            if (device.status === 'offline') {
              generatedAlerts.push({
                id: `al_${device.id}_offline`,
                type: 'error',
                message: 'Dispositivo sin conexión',
                deviceId: device.id,
                deviceName: device.name,
                timestamp: device.lastUpdate,
                resolved: false,
              });
            }
          });
          setAlerts(generatedAlerts);
        } else {
          // No hay dispositivos, mostrar estado vacío
          setDevices([]);
          setAlerts([]);
        }
      } else {
        throw new Error('Error al cargar dispositivos');
      }
      
      // Cargar automatizaciones (si hay API)
      try {
        const autoResponse = await fetch('/api/iot/automations');
        if (autoResponse.ok) {
          const autoData = await autoResponse.json();
          setAutomations(autoData.automations || []);
        } else {
          setAutomations([]);
        }
      } catch {
        setAutomations([]);
      }
    } catch (error) {
      console.error('Error loading IoT data:', error);
      toast.error('Error al cargar dispositivos IoT');
      setDevices([]);
      setAutomations([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (device: IoTDevice) => {
    setDeviceToEdit(device);
    setEditForm({
      name: device.name,
      type: device.type,
      location: device.location,
      status: device.status,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (device: IoTDevice) => {
    setDeviceToDelete(device);
    setDeleteDialogOpen(true);
  };

  const handleEditDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceToEdit) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/iot/devices/${deviceToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        toast.success('Dispositivo actualizado');
        setEditDialogOpen(false);
        setDeviceToEdit(null);
        loadData();
      } else {
        throw new Error('Error al actualizar');
      }
    } catch (error) {
      toast.error('Error al actualizar el dispositivo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/iot/devices/${deviceToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Dispositivo eliminado');
        setDeleteDialogOpen(false);
        setDeviceToDelete(null);
        loadData();
      } else {
        throw new Error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar el dispositivo');
    } finally {
      setIsSaving(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    const icons = {
      thermostat: Thermometer,
      lock: Lock,
      light: Lightbulb,
      sensor: Activity,
      meter: Zap,
    };
    return icons[type as keyof typeof icons] || Activity;
  };

  const getStatusBadge = (status: string) => {
    const config = {
      online: { color: 'bg-green-500', label: 'Online' },
      offline: { color: 'bg-red-500', label: 'Offline' },
      warning: { color: 'bg-yellow-500', label: 'Alerta' },
    };
    const { color, label } = config[status as keyof typeof config] || config.online;
    return <Badge className={color}>{label}</Badge>;
  };

  const getAlertBadge = (type: string) => {
    const config = {
      warning: { color: 'bg-yellow-500', icon: AlertTriangle },
      error: { color: 'bg-red-500', icon: AlertTriangle },
      info: { color: 'bg-blue-500', icon: CheckCircle },
    };
    const { color, icon: Icon } = config[type as keyof typeof config] || config.info;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {type.toUpperCase()}
      </Badge>
    );
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Ahora mismo';
    if (diff < 3600) return `Hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
    return `Hace ${Math.floor(diff / 86400)}d`;
  };

  const temperatureData = devices
    .filter((d: any) => d.tipo === 'termostato' || d.type === 'thermostat')
    .slice(0, 1)
    .flatMap((d: any) => {
      const readings = d.readings || d.lecturas || [];
      if (readings.length > 0) {
        return readings.slice(-24).map((r: any, i: number) => ({
          time: new Date(r.timestamp || r.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          temp: r.value || r.valor || 0,
          target: d.targetTemp || 21,
        }));
      }
      return Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        temp: 0,
        target: 21,
      }));
    });

  const energyData = devices
    .filter((d: any) => d.tipo === 'medidor_energia' || d.type === 'energy_meter')
    .slice(0, 1)
    .flatMap((d: any) => {
      const readings = d.readings || d.lecturas || [];
      if (readings.length > 0) {
        return readings.slice(-7).map((r: any, i: number) => ({
          day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i % 7],
          consumption: r.value || r.valor || 0,
        }));
      }
      return Array.from({ length: 7 }, (_, i) => ({
        day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
        consumption: 0,
      }));
    });

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading && devices.length === 0) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando dispositivos IoT...</p>
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  IoT & Edificios Inteligentes
                </h1>
                <p className="text-muted-foreground mt-2">
                  Monitorización en tiempo real y automatizaciones inteligentes
                </p>
              </div>
              <Button onClick={() => router.push('/iot/nuevo-dispositivo')}>
                <Plus className="h-4 w-4 mr-2" />
                Añadir Dispositivo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Dispositivos Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {devices.filter((d) => d.status === 'online').length} / {devices.length}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">
                      {Math.round((devices.filter((d) => d.status === 'online').length / devices.length) * 100)}% uptime
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Automatizaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {automations.filter((a) => a.enabled).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {automations.length} configuradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">
                    {alerts.filter((a) => !a.resolved).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Requieren atención</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Ahorro Energético</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">15%</div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingDown className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600">vs mes anterior</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="devices" className="space-y-4">
              <TabsList>
                <TabsTrigger value="devices">Dispositivos</TabsTrigger>
                <TabsTrigger value="automations">Automatizaciones</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="alerts">Alertas</TabsTrigger>
              </TabsList>

              <TabsContent value="devices" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devices.map((device) => {
                    const Icon = getDeviceIcon(device.type);
                    return (
                      <Card key={device.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Icon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-base">{device.name}</CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {device.buildingName} • {device.location}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(device.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {device.currentValue !== undefined && (
                            <div className="text-center py-2">
                              <p className="text-3xl font-bold">
                                {device.currentValue}
                                <span className="text-lg text-muted-foreground ml-1">{device.unit}</span>
                              </p>
                            </div>
                          )}

                          {device.battery !== undefined && (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">Batería</span>
                                <span className={device.battery < 20 ? 'text-red-600 font-medium' : ''}>
                                  {device.battery}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    device.battery < 20 ? 'bg-red-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${device.battery}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span>Actualizado {formatTime(device.lastUpdate)}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(device)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(device)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="automations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Automatizaciones Configuradas</CardTitle>
                    <CardDescription>
                      Reglas automáticas para gestionar tus dispositivos inteligentes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {automations.map((automation) => (
                        <div
                          key={automation.id}
                          className="flex items-start justify-between p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{automation.name}</h4>
                              <Badge variant={automation.enabled ? 'default' : 'secondary'}>
                                {automation.enabled ? 'Activa' : 'Desactivada'}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <p>
                                <span className="text-muted-foreground">Cuando:</span>{' '}
                                <span className="font-medium">{automation.trigger}</span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Entonces:</span>{' '}
                                <span className="font-medium">{automation.action}</span>
                              </p>
                              {automation.lastTriggered && (
                                <p className="text-xs text-muted-foreground">
                                  Última ejecución: {automation.lastTriggered}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Temperatura - Últimas 24h</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={temperatureData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="temp"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.3}
                            name="Temperatura Real (°C)"
                          />
                          <Area
                            type="monotone"
                            dataKey="target"
                            stroke="#10B981"
                            fill="#10B981"
                            fillOpacity={0.1}
                            name="Objetivo (°C)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Consumo Energético Semanal</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={energyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="consumption"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            name="kWh"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Alertas y Notificaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {alerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={`flex items-start gap-4 p-4 border rounded-lg ${
                            alert.resolved ? 'bg-gray-50 opacity-60' : ''
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getAlertBadge(alert.type)}
                              {alert.resolved && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resuelta
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium">{alert.message}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {alert.deviceName} • {formatTime(alert.timestamp)}
                            </p>
                          </div>
                          {!alert.resolved && (
                            <Button size="sm" variant="outline">
                              Resolver
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Edit Device Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Dispositivo IoT</DialogTitle>
                  <DialogDescription>
                    Modifica los datos del dispositivo
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditDevice}>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select
                        value={editForm.type}
                        onValueChange={(value: any) => setEditForm({ ...editForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="thermostat">Termostato</SelectItem>
                          <SelectItem value="lock">Cerradura</SelectItem>
                          <SelectItem value="light">Iluminación</SelectItem>
                          <SelectItem value="sensor">Sensor</SelectItem>
                          <SelectItem value="meter">Medidor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ubicación</Label>
                      <Input
                        value={editForm.location}
                        onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                          <SelectItem value="warning">Alerta</SelectItem>
                        </SelectContent>
                      </Select>
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

            {/* Delete Device Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>¿Eliminar dispositivo?</DialogTitle>
                  <DialogDescription>
                    Esta acción eliminará el dispositivo &quot;{deviceToDelete?.name}&quot; permanentemente.
                    Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteDevice} disabled={isSaving}>
                    {isSaving ? 'Eliminando...' : 'Eliminar'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </AuthenticatedLayout>
  );
}
