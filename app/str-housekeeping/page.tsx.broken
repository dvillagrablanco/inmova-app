'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Package,
  ClipboardList,
  Calendar,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function STRHousekeepingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    listingId: '',
    tipo: 'check_out',
    fechaTarea: '',
    horaEstimada: '',
    asignadoA: '',
    prioridad: 'normal',
    instrucciones: '',
  });

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
      const [tasksRes, listingsRes, staffRes] = await Promise.all([
        fetch('/api/str-housekeeping/tasks'),
        fetch('/api/str/listings'),
        fetch('/api/str-housekeeping/staff'),
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (listingsRes.ok) setListings(await listingsRes.json());
      if (staffRes.ok) setStaff(await staffRes.json());
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/str-housekeeping/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Tarea creada correctamente');
        setShowDialog(false);
        setFormData({
          listingId: '',
          tipo: 'check_out',
          fechaTarea: '',
          horaEstimada: '',
          asignadoA: '',
          prioridad: 'normal',
          instrucciones: '',
        });
        loadData();
      } else {
        toast.error('Error al crear tarea');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al crear tarea');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/str-housekeeping/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus }),
      });

      if (res.ok) {
        toast.success('Estado actualizado');
        loadData();
      } else {
        toast.error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.listing?.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.staff?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    pendientes: tasks.filter((t) => t.estado === 'pendiente').length,
    asignadas: tasks.filter((t) => t.estado === 'asignada').length,
    enProgreso: tasks.filter((t) => t.estado === 'en_progreso').length,
    completadas: tasks.filter((t) => t.estado === 'completada').length,
  };

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pendiente: { variant: 'secondary', label: 'Pendiente' },
      asignada: { variant: 'default', label: 'Asignada' },
      en_progreso: { variant: 'default', label: 'En Progreso' },
      completada: { variant: 'default', label: 'Completada' },
      verificada: { variant: 'default', label: 'Verificada' },
      incidencia: { variant: 'destructive', label: 'Incidencia' },
    };
    return variants[estado] || { variant: 'secondary', label: estado };
  };

  const getTipoBadge = (tipo: string) => {
    const labels: Record<string, string> = {
      check_out: 'Check-out',
      check_in: 'Check-in',
      deep_clean: 'Limpieza Profunda',
      maintenance: 'Mantenimiento',
      inspection: 'Inspección',
    };
    return labels[tipo] || tipo;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
          <div className="flex justify-center items-center h-full">
          <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando...</p>
              </div>
            </div>
          </AuthenticatedLayout>
    </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
          <div className="flex justify-between items-center">
          <div>
                <h1 className="text-3xl font-bold gradient-text">Gestión de Limpieza STR</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona tareas de limpieza, personal e inventario
                </p>
              </div>
          <div className="flex gap-2">
                <Button variant="outline" onClick={loadData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button onClick={() => setShowDialog(true)} className="gradient-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </div>
            </div>

            {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
          <div className="text-2xl font-bold">{stats.pendientes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Asignadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
          <div className="text-2xl font-bold">{stats.asignadas}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    En Progreso
                  </CardTitle>
                </CardHeader>
                <CardContent>
          <div className="text-2xl font-bold">{stats.enProgreso}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
          <div className="text-2xl font-bold">{stats.completadas}</div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access Tabs */}
            <Tabs defaultValue="tasks" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tasks">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Tareas
                </TabsTrigger>
                <TabsTrigger value="staff" onClick={() => router.push('/str-housekeeping/staff')}>
                  <Users className="h-4 w-4 mr-2" />
                  Personal
                </TabsTrigger>
                <TabsTrigger
                  value="inventory"
                  onClick={() => router.push('/str-housekeeping/inventory')}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Inventario
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tasks" className="space-y-4">
                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
          <div className="flex gap-4">
          <div className="flex-1">
          <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por propiedad o personal..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="pendiente">Pendientes</SelectItem>
                          <SelectItem value="asignada">Asignadas</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completada">Completadas</SelectItem>
                          <SelectItem value="verificada">Verificadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Tasks List */}
          <div className="space-y-4">
                  {filteredTasks.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">No hay tareas</h3>
                        <p className="text-muted-foreground mb-4">
                          Crea la primera tarea de limpieza
                        </p>
                        <Button onClick={() => setShowDialog(true)} className="gradient-primary">
                          <Plus className="h-4 w-4 mr-2" />
                          Nueva Tarea
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredTasks.map((task) => (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
          <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">
                                  {task.listing?.titulo || 'Sin título'}
                                </h3>
                                <Badge {...getStatusBadge(task.estado)}>
                                  {getStatusBadge(task.estado).label}
                                </Badge>
                                <Badge variant="outline">{getTipoBadge(task.tipo)}</Badge>
                                {task.prioridad === 'urgente' && (
                                  <Badge variant="destructive">Urgente</Badge>
                                )}
                              </div>
          <div className="text-sm text-muted-foreground space-y-1">
                                {task.listing?.unit?.building?.nombre && (
          <div>
                                    📍 {task.listing.unit.building.nombre} -{' '}
                                    {task.listing.unit.numero}
                                  </div>
                                )}
          <div className="flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(task.fechaTarea), 'PPP', { locale: es })}
                                    {task.horaEstimada && ` • ${task.horaEstimada}`}
                                  </span>
                                  {task.staff && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3.5 w-3.5" />
                                      {task.staff.nombre}
                                    </span>
                                  )}
                                </div>
                                {task.instrucciones && (
          <div className="text-xs mt-2 p-2 bg-muted rounded">
                                    {task.instrucciones}
                                  </div>
                                )}
                              </div>
                            </div>
          <div className="flex gap-2">
                              {task.estado === 'pendiente' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(task.id, 'en_progreso')}
                                >
                                  Iniciar
                                </Button>
                              )}
                              {task.estado === 'en_progreso' && (
                                <Button
                                  size="sm"
                                  className="gradient-primary"
                                  onClick={() => handleStatusChange(task.id, 'completada')}
                                >
                                  Completar
                                </Button>
                              )}
                              {task.estado === 'completada' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(task.id, 'verificada')}
                                >
                                  Verificar
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Dialog Create Task */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Tarea de Limpieza</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
          <div>
              <Label>Propiedad</Label>
              <Select
                value={formData.listingId}
                onValueChange={(value) => setFormData({ ...formData, listingId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {listings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="grid grid-cols-2 gap-4">
          <div>
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check_out">Check-out</SelectItem>
                    <SelectItem value="check_in">Check-in</SelectItem>
                    <SelectItem value="deep_clean">Limpieza Profunda</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="inspection">Inspección</SelectItem>
                  </SelectContent>
                </Select>
              </div>

          <div>
                <Label>Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-4">
          <div>
                <Label>Fecha</Label>
                <Input
                  type="date"
                  value={formData.fechaTarea}
                  onChange={(e) => setFormData({ ...formData, fechaTarea: e.target.value })}
                />
              </div>

          <div>
                <Label>Hora estimada</Label>
                <Input
                  type="time"
                  value={formData.horaEstimada}
                  onChange={(e) => setFormData({ ...formData, horaEstimada: e.target.value })}
                />
              </div>
            </div>

          <div>
              <Label>Asignar a</Label>
              <Select
                value={formData.asignadoA}
                onValueChange={(value) => setFormData({ ...formData, asignadoA: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div>
              <Label>Instrucciones</Label>
              <Input
                value={formData.instrucciones}
                onChange={(e) => setFormData({ ...formData, instrucciones: e.target.value })}
                placeholder="Instrucciones especiales..."
              />
            </div>

          <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} className="gradient-primary">
                Crear Tarea
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
