'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  CheckSquare,
  Plus,
  Calendar,
  User,
  Home,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Task {
  id: string;
  titulo: string;
  descripcion?: string;
  estado: string;
  prioridad: string;
  fechaVencimiento?: string;
  asignadoA?: {
    name: string;
  };
  building?: {
    nombre: string;
  };
  createdAt: string;
}

const priorities = [
  { value: 'BAJA', label: 'Baja', color: 'bg-blue-500' },
  { value: 'MEDIA', label: 'Media', color: 'bg-yellow-500' },
  { value: 'ALTA', label: 'Alta', color: 'bg-orange-500' },
  { value: 'URGENTE', label: 'Urgente', color: 'bg-red-500' },
];

const statuses = [
  { value: 'PENDIENTE', label: 'Pendiente', icon: Clock },
  { value: 'EN_PROGRESO', label: 'En Progreso', icon: AlertCircle },
  { value: 'COMPLETADA', label: 'Completada', icon: CheckCircle2 },
];

export default function TareasPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [prioridadFilter, setPrioridadFilter] = useState<string>('all');

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'MEDIA',
    estado: 'PENDIENTE',
    fechaVencimiento: '',
  });

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, estadoFilter, prioridadFilter, tasks]);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error();
      const data = await response.json();
      const taskList = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setTasks(taskList);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error al cargar tareas');
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) => t.titulo?.toLowerCase().includes(term) || t.descripcion?.toLowerCase().includes(term)
      );
    }

    if (estadoFilter && estadoFilter !== 'all') {
      filtered = filtered.filter((t) => t.estado === estadoFilter);
    }

    if (prioridadFilter && prioridadFilter !== 'all') {
      filtered = filtered.filter((t) => t.prioridad === prioridadFilter);
    }

    setFilteredTasks(filtered);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error();

      toast.success('Tarea creada correctamente');
      setCreateDialogOpen(false);
      setFormData({
        titulo: '',
        descripcion: '',
        prioridad: 'MEDIA',
        estado: 'PENDIENTE',
        fechaVencimiento: '',
      });
      fetchTasks();
    } catch (error) {
      toast.error('Error al crear tarea');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error();
      toast.success('Tarea eliminada');
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar tarea');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = statuses.find((s) => s.value === status);
    const Icon = statusInfo?.icon || Clock;
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className="h-3 w-3" />
        {statusInfo?.label || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityInfo = priorities.find((p) => p.value === priority);
    return (
      <Badge className={`${priorityInfo?.color} text-white`} variant="default">
        {priorityInfo?.label || priority}
      </Badge>
    );
  };

  const stats = {
    total: tasks.length,
    pendientes: tasks.filter((t) => t.estado === 'PENDIENTE').length,
    enProgreso: tasks.filter((t) => t.estado === 'EN_PROGRESO').length,
    completadas: tasks.filter((t) => t.estado === 'COMPLETADA').length,
  };

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Tareas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center gap-3">
              <CheckSquare className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Tareas</h1>
                <p className="text-sm text-muted-foreground">Gestiona las tareas del equipo</p>
              </div>
            </div>
          </div>

          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tarea
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.pendientes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.enProgreso}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar tareas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={prioridadFilter} onValueChange={setPrioridadFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay tareas</h3>
              <p className="text-sm text-muted-foreground mb-4">Crea tu primera tarea</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
              </Button>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base">{task.titulo}</CardTitle>
                      {task.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.descripcion}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setTaskToEdit(task);
                            setFormData({
                              titulo: task.titulo,
                              descripcion: task.descripcion || '',
                              prioridad: task.prioridad,
                              estado: task.estado,
                              fechaVencimiento: task.fechaVencimiento || '',
                            });
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setTaskToDelete(task);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    {getStatusBadge(task.estado)}
                    {getPriorityBadge(task.prioridad)}
                  </div>

                  {task.fechaVencimiento && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(task.fechaVencimiento), "dd 'de' MMM, yyyy", { locale: es })}
                    </div>
                  )}

                  {task.asignadoA && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      {task.asignadoA.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Tarea</DialogTitle>
              <DialogDescription>Crea una nueva tarea para el equipo</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Título de la tarea"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción detallada..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <Select
                      value={formData.prioridad}
                      onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Vencimiento</Label>
                    <Input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fechaVencimiento: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Creando...' : 'Crear Tarea'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Eliminar tarea?</DialogTitle>
              <DialogDescription>
                Esta acción no se puede deshacer. La tarea será eliminada permanentemente.
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
      </div>
    </AuthenticatedLayout>
  );
}
