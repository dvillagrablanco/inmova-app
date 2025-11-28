'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Home,
  MoreVertical,
  Plus,
  AlertCircle,
  TrendingUp,
  User,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePermissions } from '@/lib/hooks/usePermissions';

interface Task {
  id: string;
  titulo: string;
  descripcion?: string | null;
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fechaLimite?: string | null;
  fechaInicio?: string | null;
  fechaCompletada?: string | null;
  asignadoA?: string | null;
  creadoPor: string;
  notas?: string | null;
  asignadoUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  creadorUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function TareasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all');

  const [formData, setFormData] = useState<{
    titulo: string;
    descripcion: string;
    estado: 'pendiente' | 'en_progreso' | 'completada' | 'cancelada';
    prioridad: 'baja' | 'media' | 'alta' | 'urgente';
    fechaLimite: string;
    fechaInicio: string;
    asignadoA: string;
    notas: string;
  }>({
    titulo: '',
    descripcion: '',
    estado: 'pendiente',
    prioridad: 'media',
    fechaLimite: '',
    fechaInicio: '',
    asignadoA: '',
    notas: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTasks();
      fetchUsers();
    }
  }, [session]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Error al cargar tareas');
      const data = await res.json();
      setTasks(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las tareas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleOpenDialog = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        titulo: task.titulo,
        descripcion: task.descripcion || '',
        estado: task.estado,
        prioridad: task.prioridad,
        fechaLimite: task.fechaLimite ? format(new Date(task.fechaLimite), 'yyyy-MM-dd') : '',
        fechaInicio: task.fechaInicio ? format(new Date(task.fechaInicio), 'yyyy-MM-dd') : '',
        asignadoA: task.asignadoA || '',
        notas: task.notas || '',
      });
    } else {
      setEditingTask(null);
      setFormData({
        titulo: '',
        descripcion: '',
        estado: 'pendiente',
        prioridad: 'media',
        fechaLimite: '',
        fechaInicio: '',
        asignadoA: '',
        notas: '',
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!formData.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks';
      const method = editingTask ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fechaLimite: formData.fechaLimite || null,
          fechaInicio: formData.fechaInicio || null,
          asignadoA: formData.asignadoA || null,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar tarea');

      toast.success(editingTask ? 'Tarea actualizada' : 'Tarea creada correctamente');
      setOpenDialog(false);
      fetchTasks();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la tarea');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar tarea');

      toast.success('Tarea eliminada correctamente');
      fetchTasks();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  const handleMarkAsCompleted = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'completada' }),
      });

      if (!res.ok) throw new Error('Error al actualizar tarea');

      toast.success('Tarea marcada como completada');
      fetchTasks();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar la tarea');
    }
  };

  // Filtrar tareas
  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.asignadoUser?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterEstado !== 'all') {
      filtered = filtered.filter((t) => t.estado === filterEstado);
    }

    if (filterPrioridad !== 'all') {
      filtered = filtered.filter((t) => t.prioridad === filterPrioridad);
    }

    return filtered;
  }, [tasks, searchTerm, filterEstado, filterPrioridad]);

  // KPIs
  const stats = useMemo(() => {
    const total = tasks.length;
    const pendientes = tasks.filter((t) => t.estado === 'pendiente').length;
    const enProgreso = tasks.filter((t) => t.estado === 'en_progreso').length;
    const completadas = tasks.filter((t) => t.estado === 'completada').length;
    const urgentes = tasks.filter((t) => t.prioridad === 'urgente' && t.estado !== 'completada').length;

    return { total, pendientes, enProgreso, completadas, urgentes };
  }, [tasks]);

  const getEstadoBadge = (estado: string) => {
    const badges = {
      pendiente: <Badge variant="secondary">Pendiente</Badge>,
      en_progreso: <Badge className="bg-blue-500">En Progreso</Badge>,
      completada: <Badge className="bg-green-500">Completada</Badge>,
      cancelada: <Badge variant="destructive">Cancelada</Badge>,
    };
    return badges[estado as keyof typeof badges] || <Badge>{estado}</Badge>;
  };

  const getPrioridadBadge = (prioridad: string) => {
    const badges = {
      baja: <Badge variant="outline" className="border-gray-400">Baja</Badge>,
      media: <Badge variant="outline" className="border-yellow-400">Media</Badge>,
      alta: <Badge variant="outline" className="border-orange-500">Alta</Badge>,
      urgente: <Badge className="bg-red-500">Urgente</Badge>,
    };
    return badges[prioridad as keyof typeof badges] || <Badge>{prioridad}</Badge>;
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Breadcrumbs y Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <Home className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink>Tareas</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/dashboard')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Dashboard
                </Button>
                <h1 className="text-2xl font-bold sm:text-3xl">Tareas y Recordatorios</h1>
              </div>
            </div>
            {canCreate && (
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            )}
          </div>

          {/* KPI Cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tareas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendientes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.enProgreso}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completadas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.urgentes}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Input
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En Progreso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Tareas */}
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No hay tareas que mostrar
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{task.titulo}</h3>
                          {getEstadoBadge(task.estado)}
                          {getPrioridadBadge(task.prioridad)}
                        </div>
                        {task.descripcion && (
                          <p className="text-sm text-muted-foreground">{task.descripcion}</p>
                        )}
                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                          {task.asignadoUser && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>Asignado: {task.asignadoUser.name}</span>
                            </div>
                          )}
                          {task.fechaLimite && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Límite: {format(new Date(task.fechaLimite), "d MMM yyyy", { locale: es })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {task.estado !== 'completada' && canUpdate && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkAsCompleted(task)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Completar
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => handleOpenDialog(task)}>
                                Editar
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(task.id)}
                                className="text-red-600"
                              >
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>

      {/* Dialog para Nueva/Editar Tarea */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar Tarea' : 'Nueva Tarea'}</DialogTitle>
            <DialogDescription>
              {editingTask ? 'Modifica los detalles de la tarea' : 'Crea una nueva tarea para el equipo'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Título de la tarea"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada (opcional)"
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value: any) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value: any) => setFormData({ ...formData, prioridad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fechaLimite">Fecha Límite</Label>
                <Input
                  id="fechaLimite"
                  type="date"
                  value={formData.fechaLimite}
                  onChange={(e) => setFormData({ ...formData, fechaLimite: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="asignadoA">Asignar a</Label>
              <Select
                value={formData.asignadoA}
                onValueChange={(value) => setFormData({ ...formData, asignadoA: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin asignar</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales (opcional)"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingTask ? 'Actualizar' : 'Crear'} Tarea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
