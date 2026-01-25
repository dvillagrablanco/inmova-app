'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Sparkles, Plus, Calendar, Clock, User, CheckCircle2, 
  AlertCircle, PlayCircle, XCircle, Home, Filter, Search
} from 'lucide-react';

interface CleaningTask {
  id: string;
  tipo: string;
  status: string;
  fechaProgramada: string;
  fechaInicio?: string;
  fechaFin?: string;
  prioridad: number;
  notas?: string;
  instruccionesEspeciales?: string;
  tiempoEstimadoMin?: number;
  tiempoRealMin?: number;
  listing?: {
    id: string;
    titulo: string;
    direccion: string;
  };
  staff?: {
    id: string;
    nombre: string;
    telefono: string;
    foto?: string;
  };
  booking?: {
    id: string;
    guestNombre: string;
    checkInDate: string;
    checkOutDate: string;
  };
}

interface Stats {
  total: number;
  pendientes: number;
  enProgreso: number;
  completadas: number;
  canceladas: number;
}

export default function ServiciosLimpiezaPage() {
  const [tasks, setTasks] = useState<CleaningTask[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    tipo: 'check_out',
    fechaProgramada: '',
    prioridad: 0,
    notas: '',
    instruccionesEspeciales: '',
    tiempoEstimadoMin: 60,
  });

  useEffect(() => {
    loadTasks();
  }, [filterStatus]);

  async function loadTasks() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      
      const response = await fetch(`/api/servicios-limpieza?${params}`);
      if (!response.ok) throw new Error('Error al cargar tareas');
      
      const data = await response.json();
      setTasks(data.data || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las tareas de limpieza');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      if (!formData.fechaProgramada) {
        toast.error('Selecciona una fecha programada');
        return;
      }

      const response = await fetch('/api/servicios-limpieza', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear tarea');
      }

      toast.success('Tarea de limpieza programada');
      setDialogOpen(false);
      setFormData({
        tipo: 'check_out',
        fechaProgramada: '',
        prioridad: 0,
        notas: '',
        instruccionesEspeciales: '',
        tiempoEstimadoMin: 60,
      });
      loadTasks();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
      pendiente: { label: 'Pendiente', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
      en_progreso: { label: 'En Progreso', variant: 'default', icon: <PlayCircle className="h-3 w-3" /> },
      completada: { label: 'Completada', variant: 'secondary', icon: <CheckCircle2 className="h-3 w-3" /> },
      cancelada: { label: 'Cancelada', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
    };
    const config = statusConfig[status] || statusConfig.pendiente;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const tipoLabels: Record<string, string> = {
      check_out: 'Check-out',
      check_in: 'Check-in',
      profunda: 'Limpieza Profunda',
      mantenimiento: 'Mantenimiento',
      rapida: 'Rápida',
    };
    return <Badge variant="outline">{tipoLabels[tipo] || tipo}</Badge>;
  };

  const getPrioridadBadge = (prioridad: number) => {
    const prioridadConfig: Record<number, { label: string; color: string }> = {
      0: { label: 'Normal', color: 'bg-gray-100 text-gray-700' },
      1: { label: 'Alta', color: 'bg-yellow-100 text-yellow-700' },
      2: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
    };
    const config = prioridadConfig[prioridad] || prioridadConfig[0];
    return <span className={`px-2 py-0.5 text-xs rounded-full ${config.color}`}>{config.label}</span>;
  };

  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      task.listing?.direccion?.toLowerCase().includes(query) ||
      task.staff?.nombre?.toLowerCase().includes(query) ||
      task.booking?.guestNombre?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Servicios de Limpieza</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-500" />
              Servicios de Limpieza
            </h1>
            <p className="text-muted-foreground">
              Gestión de tareas de limpieza y mantenimiento
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Programar Limpieza</DialogTitle>
                <DialogDescription>
                  Crea una nueva tarea de limpieza
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de Limpieza</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="check_out">Check-out</SelectItem>
                      <SelectItem value="check_in">Check-in</SelectItem>
                      <SelectItem value="profunda">Limpieza Profunda</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      <SelectItem value="rapida">Rápida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha Programada</Label>
                  <Input
                    type="datetime-local"
                    value={formData.fechaProgramada}
                    onChange={(e) => setFormData({ ...formData, fechaProgramada: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prioridad</Label>
                  <Select
                    value={String(formData.prioridad)}
                    onValueChange={(v) => setFormData({ ...formData, prioridad: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="1">Alta</SelectItem>
                      <SelectItem value="2">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tiempo Estimado (minutos)</Label>
                  <Input
                    type="number"
                    value={formData.tiempoEstimadoMin}
                    onChange={(e) => setFormData({ ...formData, tiempoEstimadoMin: parseInt(e.target.value) || 60 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Notas adicionales..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Instrucciones Especiales</Label>
                  <Textarea
                    value={formData.instruccionesEspeciales}
                    onChange={(e) => setFormData({ ...formData, instruccionesEspeciales: e.target.value })}
                    placeholder="Instrucciones específicas para esta limpieza..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>
                  Programar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Tareas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pendientes}</div>
                <div className="text-sm text-muted-foreground">Pendientes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.enProgreso}</div>
                <div className="text-sm text-muted-foreground">En Progreso</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
                <div className="text-sm text-muted-foreground">Completadas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-red-600">{stats.canceladas}</div>
                <div className="text-sm text-muted-foreground">Canceladas</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por dirección, personal o huésped..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="en_progreso">En Progreso</SelectItem>
                  <SelectItem value="completada">Completadas</SelectItem>
                  <SelectItem value="cancelada">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas Programadas</CardTitle>
            <CardDescription>
              {filteredTasks.length} tarea(s) encontrada(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay tareas de limpieza</h3>
                <p className="text-muted-foreground mb-4">
                  Programa tu primera tarea para empezar
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getTipoBadge(task.tipo)}
                          {getStatusBadge(task.status)}
                          {getPrioridadBadge(task.prioridad)}
                        </div>
                        {task.listing && (
                          <div className="flex items-center gap-2 text-sm">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span>{task.listing.direccion || task.listing.titulo}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(task.fechaProgramada).toLocaleString('es-ES', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                          {task.tiempoEstimadoMin && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {task.tiempoEstimadoMin} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {task.staff && (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="text-sm">
                              <div className="font-medium">{task.staff.nombre}</div>
                              <div className="text-muted-foreground">{task.staff.telefono}</div>
                            </div>
                          </div>
                        )}
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                    {task.notas && (
                      <p className="mt-2 text-sm text-muted-foreground">{task.notas}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
