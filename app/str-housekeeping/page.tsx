'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  Sparkles,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  MapPin,
  Plus,
  Filter,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface HousekeepingTask {
  id: string;
  property: string;
  address: string;
  type: string;
  status: string;
  scheduledDate: string;
  assignedTo: string;
  estimatedDuration: number;
  unitId?: string;
  buildingId?: string;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  in_progress: { label: 'En Progreso', color: 'bg-blue-100 text-blue-800', icon: Sparkles },
  completed: { label: 'Completado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const typeConfig = {
  checkout: { label: 'Check-out', color: 'bg-orange-100 text-orange-800' },
  checkin: { label: 'Check-in', color: 'bg-purple-100 text-purple-800' },
  deep_clean: { label: 'Limpieza Profunda', color: 'bg-indigo-100 text-indigo-800' },
  maintenance: { label: 'Mantenimiento', color: 'bg-gray-100 text-gray-800' },
};

export default function STRHousekeepingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today');
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  const [form, setForm] = useState({
    unitId: '',
    type: 'checkout',
    scheduledDate: '',
    assignedTo: '',
    estimatedDuration: 2,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchTasks();
      fetchProperties();
    }
  }, [status]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/housekeeping');
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/units');
      if (response.ok) {
        const data = await response.json();
        setProperties(data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.unitId || !form.scheduledDate || !form.assignedTo) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const response = await fetch('/api/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Tarea creada exitosamente');
        setOpenDialog(false);
        setForm({
          unitId: '',
          type: 'checkout',
          scheduledDate: '',
          assignedTo: '',
          estimatedDuration: 2,
        });
        fetchTasks();
      } else {
        toast.error('Error al crear tarea');
      }
    } catch (error) {
      toast.error('Error al crear tarea');
    }
  };

  const stats = {
    pendingToday: tasks.filter(
      (t) =>
        t.status === 'pending' &&
        new Date(t.scheduledDate).toDateString() === new Date().toDateString()
    ).length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    completedToday: tasks.filter(
      (t) =>
        t.status === 'completed' &&
        new Date(t.scheduledDate).toDateString() === new Date().toDateString()
    ).length,
    totalWeek: tasks.length,
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/str">STR</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Housekeeping</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Limpieza</h1>
            <p className="text-muted-foreground">
              Gestiona las tareas de limpieza y housekeeping de tus propiedades STR
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtrar
            </Button>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Tarea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nueva Tarea de Limpieza</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Propiedad *</Label>
                    <Select
                      value={form.unitId}
                      onValueChange={(v) => setForm({ ...form, unitId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona propiedad" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.building?.nombre} - {p.numero}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tipo de Tarea</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checkout">Check-out</SelectItem>
                        <SelectItem value="checkin">Check-in</SelectItem>
                        <SelectItem value="deep_clean">Limpieza Profunda</SelectItem>
                        <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fecha Programada *</Label>
                    <Input
                      type="datetime-local"
                      value={form.scheduledDate}
                      onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Asignado a *</Label>
                    <Input
                      value={form.assignedTo}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      placeholder="Nombre del responsable"
                    />
                  </div>
                  <div>
                    <Label>Duración Estimada (horas)</Label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={form.estimatedDuration}
                      onChange={(e) =>
                        setForm({ ...form, estimatedDuration: parseFloat(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Tarea</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendientes Hoy</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingToday}</div>
              <p className="text-xs text-muted-foreground">tareas por completar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Sparkles className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">en este momento</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completadas Hoy</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">tareas finalizadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWeek}</div>
              <p className="text-xs text-muted-foreground">tareas programadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Tareas de Limpieza</CardTitle>
            <CardDescription>
              Listado de todas las tareas de housekeeping programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="today">Hoy</TabsTrigger>
                <TabsTrigger value="week">Esta Semana</TabsTrigger>
                <TabsTrigger value="all">Todas</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <div className="space-y-4">
                  {tasks.length === 0 ? (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay tareas de limpieza programadas</p>
                      <Button className="mt-4" onClick={() => setOpenDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Primera Tarea
                      </Button>
                    </div>
                  ) : (
                    tasks.map((task) => {
                      const statusInfo =
                        statusConfig[task.status as keyof typeof statusConfig] ||
                        statusConfig.pending;
                      const typeInfo =
                        typeConfig[task.type as keyof typeof typeConfig] || typeConfig.checkout;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <Sparkles className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <h3 className="font-medium">{task.property}</h3>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {task.address}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                                <Badge className={statusInfo.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3" />
                              {task.assignedTo}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {task.estimatedDuration}h estimadas
                            </div>
                            <Button variant="outline" size="sm" className="mt-2">
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
