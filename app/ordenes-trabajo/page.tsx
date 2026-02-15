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
import { Textarea } from '@/components/ui/textarea';
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
  Wrench,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  MapPin,
  Plus,
  Filter,
  Calendar,
  FileText,
  Euro,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  property: string;
  address: string;
  priority: string;
  status: string;
  assignedTo: string;
  createdAt: string;
  dueDate: string;
  estimatedCost: number;
  actualCost?: number;
  category: string;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-800', icon: Calendar },
  in_progress: { label: 'En Progreso', color: 'bg-indigo-100 text-indigo-800', icon: Wrench },
  completed: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
};

const priorityConfig = {
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  medium: { label: 'Media', color: 'bg-yellow-100 text-yellow-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

const categoryConfig = {
  plumbing: { label: 'Fontanería', icon: '🔧' },
  electrical: { label: 'Electricidad', icon: '⚡' },
  painting: { label: 'Pintura', icon: '🎨' },
  hvac: { label: 'Climatización', icon: '❄️' },
  general: { label: 'General', icon: '🔨' },
};

export default function OrdenesTrabajoPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    unitId: '',
    priority: 'medium',
    category: 'general',
    assignedTo: '',
    dueDate: '',
    estimatedCost: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
      fetchProperties();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/work-orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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
    if (!form.title || !form.unitId) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        toast.success('Orden creada exitosamente');
        setOpenDialog(false);
        setForm({
          title: '',
          description: '',
          unitId: '',
          priority: 'medium',
          category: 'general',
          assignedTo: '',
          dueDate: '',
          estimatedCost: 0,
        });
        fetchOrders();
      } else {
        toast.error('Error al crear orden');
      }
    } catch (error) {
      toast.error('Error al crear orden');
    }
  };

  const total = orders.length;
  const pending = orders.filter((o) => o.status === 'pending').length;
  const inProgress = orders.filter((o) => o.status === 'in_progress').length;
  const completed = orders.filter((o) => o.status === 'completed').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalCost = orders.reduce((sum, o) => sum + (o.actualCost || o.estimatedCost), 0);

  const stats = {
    total,
    pending,
    inProgress,
    completed,
    completionRate,
    totalCost,
    averageTime: 3.2,
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
              <BreadcrumbPage>Órdenes de Trabajo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Órdenes de Trabajo</h1>
            <p className="text-muted-foreground">
              Gestiona las órdenes de mantenimiento y reparación
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
                  Nueva Orden
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nueva Orden de Trabajo</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Título *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Ej: Reparación fuga de agua"
                    />
                  </div>
                  <div>
                    <Label>Descripción</Label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Detalles del trabajo a realizar..."
                    />
                  </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prioridad</Label>
                      <Select
                        value={form.priority}
                        onValueChange={(v) => setForm({ ...form, priority: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Categoría</Label>
                      <Select
                        value={form.category}
                        onValueChange={(v) => setForm({ ...form, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="plumbing">Fontanería</SelectItem>
                          <SelectItem value="electrical">Electricidad</SelectItem>
                          <SelectItem value="painting">Pintura</SelectItem>
                          <SelectItem value="hvac">Climatización</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Asignado a</Label>
                    <Input
                      value={form.assignedTo}
                      onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                      placeholder="Nombre del proveedor o técnico"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fecha límite</Label>
                      <Input
                        type="date"
                        value={form.dueDate}
                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Coste estimado (€)</Label>
                      <Input
                        type="number"
                        min="0"
                        value={form.estimatedCost}
                        onChange={(e) =>
                          setForm({ ...form, estimatedCost: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit">Crear Orden</Button>
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
              <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{stats.pending} pendientes</Badge>
                <Badge variant="outline">{stats.inProgress} en progreso</Badge>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Completado</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate}%</div>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Coste Total</CardTitle>
              <Euro className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCost.toLocaleString()}€</div>
              <p className="text-xs text-muted-foreground">este mes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageTime} días</div>
              <p className="text-xs text-muted-foreground">resolución</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>Listado de Órdenes</CardTitle>
            <CardDescription>Todas las órdenes de trabajo activas y completadas</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="pending">Pendientes</TabsTrigger>
                <TabsTrigger value="in_progress">En Progreso</TabsTrigger>
                <TabsTrigger value="completed">Completadas</TabsTrigger>
              </TabsList>
              <TabsContent value={activeTab} className="mt-4">
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay órdenes de trabajo registradas</p>
                      <Button className="mt-4" onClick={() => setOpenDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Primera Orden
                      </Button>
                    </div>
                  ) : (
                    orders
                      .filter((order) => activeTab === 'all' || order.status === activeTab)
                      .map((order) => {
                        const statusInfo =
                          statusConfig[order.status as keyof typeof statusConfig] ||
                          statusConfig.pending;
                        const priorityInfo =
                          priorityConfig[order.priority as keyof typeof priorityConfig] ||
                          priorityConfig.medium;
                        const categoryInfo =
                          categoryConfig[order.category as keyof typeof categoryConfig] ||
                          categoryConfig.general;
                        const StatusIcon = statusInfo.icon;

                        return (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="p-2 bg-indigo-100 rounded-lg text-2xl">
                                {categoryInfo?.icon || '🔧'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-mono text-muted-foreground">
                                    {order.id}
                                  </span>
                                  <h3 className="font-medium">{order.title}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {order.description}
                                </p>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                  <MapPin className="h-3 w-3" />
                                  {order.property} - {order.address}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className={statusInfo.color}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {statusInfo.label}
                                  </Badge>
                                  <Badge className={priorityInfo.color}>{priorityInfo.label}</Badge>
                                  <Badge variant="outline">{categoryInfo?.label}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3" />
                                {order.assignedTo || 'Sin asignar'}
                              </div>
                              <div className="text-lg font-semibold mt-1">
                                {order.actualCost || order.estimatedCost}€
                                {!order.actualCost && (
                                  <span className="text-xs text-muted-foreground ml-1">(est.)</span>
                                )}
                              </div>
                              {order.dueDate && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Vence:{' '}
                                  {new Date(order.dueDate).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                  })}
                                </div>
                              )}
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
