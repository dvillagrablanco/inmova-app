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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { GanttChart, GanttProject, GanttTask } from '@/components/projects/gantt-chart';
import { format, addDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Building2,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  Euro,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  HardHat,
  Hammer,
  Wrench,
  Ruler,
  TrendingUp,
  Users,
  FileText,
  MapPin,
  ArrowRight,
} from 'lucide-react';

// Tipos
interface ConstructionProject {
  id: string;
  name: string;
  description?: string;
  address: string;
  type: 'obra_nueva' | 'reforma_integral' | 'reforma_parcial' | 'rehabilitacion' | 'ampliacion';
  status: 'planificacion' | 'en_curso' | 'pausado' | 'finalizado' | 'cancelado';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  client?: string;
  contractor?: string;
  tasks: GanttTask[];
  createdAt: string;
  updatedAt: string;
}

// Colores por estado
const statusColors: Record<string, { bg: string; text: string }> = {
  planificacion: { bg: 'bg-blue-100', text: 'text-blue-700' },
  en_curso: { bg: 'bg-green-100', text: 'text-green-700' },
  pausado: { bg: 'bg-amber-100', text: 'text-amber-700' },
  finalizado: { bg: 'bg-gray-100', text: 'text-gray-700' },
  cancelado: { bg: 'bg-red-100', text: 'text-red-700' },
};

const statusLabels: Record<string, string> = {
  planificacion: 'Planificación',
  en_curso: 'En Curso',
  pausado: 'Pausado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const typeLabels: Record<string, string> = {
  obra_nueva: 'Obra Nueva',
  reforma_integral: 'Reforma Integral',
  reforma_parcial: 'Reforma Parcial',
  rehabilitacion: 'Rehabilitación',
  ampliacion: 'Ampliación',
};

// Formato de moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

// Skeleton
function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Estado vacío
function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 text-center">
        <HardHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Sin proyectos de construcción</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Crea tu primer proyecto de construcción para gestionar obras, reformas y rehabilitaciones con diagrama de Gantt.
        </p>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Proyecto
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ConstruccionProyectosPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ConstructionProject | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'gantt'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<ConstructionProject | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    type: 'reforma_integral' as ConstructionProject['type'],
    status: 'planificacion' as ConstructionProject['status'],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
    budget: '',
    client: '',
    contractor: '',
  });

  // Verificar autenticación
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar datos
  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/proyectos/construccion');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar proyectos
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: projects.length,
    enCurso: projects.filter(p => p.status === 'en_curso').length,
    finalizados: projects.filter(p => p.status === 'finalizado').length,
    presupuestoTotal: projects.reduce((sum, p) => sum + p.budget, 0),
    gastoTotal: projects.reduce((sum, p) => sum + p.spent, 0),
  };

  // Crear proyecto
  const handleCreateProject = async () => {
    if (!formData.name || !formData.address || !formData.startDate || !formData.endDate) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/proyectos/construccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0,
        }),
      });

      if (res.ok) {
        toast.success(editingProject ? 'Proyecto actualizado' : 'Proyecto creado');
        setShowCreateDialog(false);
        resetForm();
        loadProjects();
      } else {
        toast.error('Error al guardar proyecto');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // Eliminar proyecto
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;

    try {
      const res = await fetch(`/api/proyectos/construccion?id=${projectId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Proyecto eliminado');
        loadProjects();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  // Actualizar tarea del proyecto
  const handleTaskUpdate = async (projectId: string, taskId: string, updates: Partial<GanttTask>) => {
    try {
      const res = await fetch(`/api/proyectos/construccion/tasks?projectId=${projectId}&taskId=${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        toast.success('Tarea actualizada');
        loadProjects();
      }
    } catch (error) {
      toast.error('Error al actualizar tarea');
    }
  };

  // Crear tarea
  const handleTaskCreate = async (projectId: string, task: Omit<GanttTask, 'id'>) => {
    try {
      const res = await fetch(`/api/proyectos/construccion/tasks?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (res.ok) {
        toast.success('Tarea creada');
        loadProjects();
      }
    } catch (error) {
      toast.error('Error al crear tarea');
    }
  };

  // Eliminar tarea
  const handleTaskDelete = async (projectId: string, taskId: string) => {
    try {
      const res = await fetch(`/api/proyectos/construccion/tasks?projectId=${projectId}&taskId=${taskId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Tarea eliminada');
        loadProjects();
      }
    } catch (error) {
      toast.error('Error al eliminar tarea');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      type: 'reforma_integral',
      status: 'planificacion',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
      budget: '',
      client: '',
      contractor: '',
    });
    setEditingProject(null);
  };

  // Abrir diálogo de edición
  const openEditDialog = (project: ConstructionProject) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      address: project.address,
      type: project.type,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: String(project.budget),
      client: project.client || '',
      contractor: project.contractor || '',
    });
    setShowCreateDialog(true);
  };

  // Ver detalles con Gantt
  const openDetailView = (project: ConstructionProject) => {
    setSelectedProject(project);
    setShowDetailDialog(true);
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <ProjectsSkeleton />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center">
              <HardHat className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Construcción</h1>
              <p className="text-muted-foreground">Gestión de obras y reformas con diagrama de Gantt</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadProjects}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              className="bg-gradient-to-r from-amber-500 to-orange-500"
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Proyectos</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Curso</p>
                  <p className="text-2xl font-bold text-green-600">{stats.enCurso}</p>
                </div>
                <Hammer className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Finalizados</p>
                  <p className="text-2xl font-bold">{stats.finalizados}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Presupuesto</p>
                  <p className="text-2xl font-bold">
                    {stats.presupuestoTotal > 0 ? formatCurrency(stats.presupuestoTotal) : '-'}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gastado</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats.gastoTotal > 0 ? formatCurrency(stats.gastoTotal) : '-'}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="planificacion">Planificación</SelectItem>
                <SelectItem value="en_curso">En Curso</SelectItem>
                <SelectItem value="pausado">Pausado</SelectItem>
                <SelectItem value="finalizado">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'gantt' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('gantt')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lista de proyectos */}
        {projects.length === 0 ? (
          <EmptyState onCreateNew={() => setShowCreateDialog(true)} />
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No se encontraron proyectos con ese filtro</p>
            </CardContent>
          </Card>
        ) : viewMode === 'gantt' ? (
          // Vista Gantt - todos los proyectos
          <div className="space-y-6">
            {filteredProjects.map((project) => (
              <Card key={project.id}>
                <CardContent className="pt-6">
                  <GanttChart
                    project={{
                      id: project.id,
                      name: project.name,
                      description: project.description,
                      startDate: project.startDate,
                      endDate: project.endDate,
                      tasks: project.tasks || [],
                      budget: project.budget,
                      actualSpent: project.spent,
                    }}
                    onTaskCreate={(task) => handleTaskCreate(project.id, task)}
                    onTaskUpdate={(taskId, updates) => handleTaskUpdate(project.id, taskId, updates)}
                    onTaskDelete={(taskId) => handleTaskDelete(project.id, taskId)}
                    showCosts
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          // Vista Grid
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const statusColor = statusColors[project.status];
              const budgetUsage = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
              
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {project.address}
                        </CardDescription>
                      </div>
                      <Badge className={`${statusColor.bg} ${statusColor.text}`}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{typeLabels[project.type]}</Badge>
                      <span className="text-muted-foreground">
                        {format(parseISO(project.startDate), 'dd/MM/yy')} - {format(parseISO(project.endDate), 'dd/MM/yy')}
                      </span>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    {project.budget > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Presupuesto</span>
                          <span className="font-medium">{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</span>
                        </div>
                        <Progress 
                          value={Math.min(budgetUsage, 100)} 
                          className={`h-2 ${budgetUsage > 100 ? '[&>div]:bg-red-500' : ''}`}
                        />
                      </div>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDetailView(project)}
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Gantt
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(project)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          // Vista Lista
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredProjects.map((project) => {
                  const statusColor = statusColors[project.status];
                  
                  return (
                    <div key={project.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <HardHat className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{project.name}</span>
                          <Badge className={`${statusColor.bg} ${statusColor.text}`}>
                            {statusLabels[project.status]}
                          </Badge>
                          <Badge variant="outline">{typeLabels[project.type]}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {project.address}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(project.startDate), 'dd/MM/yy')} - {format(parseISO(project.endDate), 'dd/MM/yy')}
                          </span>
                          {project.budget > 0 && (
                            <span className="flex items-center gap-1">
                              <Euro className="h-3 w-3" />
                              {formatCurrency(project.budget)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{project.progress}%</p>
                          <Progress value={project.progress} className="w-24 h-2" />
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openDetailView(project)}>
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(project)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProject(project.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog: Crear/Editar Proyecto */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto de Construcción'}
              </DialogTitle>
              <DialogDescription>
                {editingProject ? 'Modifica los detalles del proyecto' : 'Crea un nuevo proyecto de obra o reforma'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del proyecto *</Label>
                  <Input
                    placeholder="Ej: Reforma piso Calle Mayor"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de obra *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v: any) => setFormData(prev => ({ ...prev, type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Dirección *</Label>
                <Input
                  placeholder="Ej: Calle Mayor 123, 28001 Madrid"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Descripción del proyecto..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fecha inicio *</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin *</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v: any) => setFormData(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Presupuesto (€)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Input
                    placeholder="Nombre del cliente"
                    value={formData.client}
                    onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contratista</Label>
                  <Input
                    placeholder="Empresa constructora"
                    value={formData.contractor}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractor: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-orange-500"
                onClick={handleCreateProject}
              >
                {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Detalle con Gantt */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HardHat className="h-5 w-5 text-amber-500" />
                {selectedProject?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedProject?.address} • {selectedProject && typeLabels[selectedProject.type]}
              </DialogDescription>
            </DialogHeader>
            
            {selectedProject && (
              <GanttChart
                project={{
                  id: selectedProject.id,
                  name: selectedProject.name,
                  description: selectedProject.description,
                  startDate: selectedProject.startDate,
                  endDate: selectedProject.endDate,
                  tasks: selectedProject.tasks || [],
                  budget: selectedProject.budget,
                  actualSpent: selectedProject.spent,
                }}
                onTaskCreate={(task) => handleTaskCreate(selectedProject.id, task)}
                onTaskUpdate={(taskId, updates) => handleTaskUpdate(selectedProject.id, taskId, updates)}
                onTaskDelete={(taskId) => handleTaskDelete(selectedProject.id, taskId)}
                showCosts
              />
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
