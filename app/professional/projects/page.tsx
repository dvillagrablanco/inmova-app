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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { GanttChart, GanttTask } from '@/components/projects/gantt-chart';
import { format, addDays, parseISO } from 'date-fns';
import {
  Briefcase,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Euro,
  Clock,
  CheckCircle2,
  Edit,
  Trash2,
  RefreshCw,
  User,
  Mail,
  Phone,
  FileText,
  Timer,
  Users,
} from 'lucide-react';

// Tipos
interface ProfessionalProject {
  id: string;
  name: string;
  description?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  serviceType: 'consultoria' | 'gestion' | 'asesoria' | 'intermediacion' | 'tasacion' | 'legal' | 'otro';
  status: 'propuesta' | 'aprobado' | 'en_curso' | 'revision' | 'completado' | 'cancelado';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  hourlyRate: number;
  estimatedHours: number;
  actualHours: number;
  progress: number;
  tasks: GanttTask[];
  createdAt: string;
}

// Colores y etiquetas
const statusColors: Record<string, { bg: string; text: string }> = {
  propuesta: { bg: 'bg-purple-100', text: 'text-purple-700' },
  aprobado: { bg: 'bg-blue-100', text: 'text-blue-700' },
  en_curso: { bg: 'bg-green-100', text: 'text-green-700' },
  revision: { bg: 'bg-amber-100', text: 'text-amber-700' },
  completado: { bg: 'bg-gray-100', text: 'text-gray-700' },
  cancelado: { bg: 'bg-red-100', text: 'text-red-500' },
};

const statusLabels: Record<string, string> = {
  propuesta: 'Propuesta',
  aprobado: 'Aprobado',
  en_curso: 'En Curso',
  revision: 'En Revisión',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const serviceLabels: Record<string, string> = {
  consultoria: 'Consultoría',
  gestion: 'Gestión',
  asesoria: 'Asesoría',
  intermediacion: 'Intermediación',
  tasacion: 'Tasación',
  legal: 'Legal',
  otro: 'Otro',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
};

// Estado vacío
function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 text-center">
        <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Sin proyectos de servicios</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Crea tu primer proyecto de servicios profesionales para gestionar consultoría, asesoría, tasaciones y más con diagrama de Gantt.
        </p>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Proyecto
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ProfessionalProjectsPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<ProfessionalProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProfessionalProject | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'gantt'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<ProfessionalProject | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceType: 'consultoria' as ProfessionalProject['serviceType'],
    status: 'propuesta' as ProfessionalProject['status'],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    budget: '',
    hourlyRate: '',
    estimatedHours: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status]);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/proyectos/professional');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Estadísticas
  const stats = {
    total: projects.length,
    enCurso: projects.filter(p => p.status === 'en_curso').length,
    completados: projects.filter(p => p.status === 'completado').length,
    facturacionTotal: projects.reduce((sum, p) => sum + p.budget, 0),
    horasEstimadas: projects.reduce((sum, p) => sum + p.estimatedHours, 0),
    horasTrabajadas: projects.reduce((sum, p) => sum + p.actualHours, 0),
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.startDate || !formData.endDate) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/proyectos/professional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0,
          hourlyRate: parseFloat(formData.hourlyRate) || 0,
          estimatedHours: parseFloat(formData.estimatedHours) || 0,
        }),
      });

      if (res.ok) {
        toast.success(editingProject ? 'Proyecto actualizado' : 'Proyecto creado');
        setShowCreateDialog(false);
        resetForm();
        loadProjects();
      } else {
        toast.error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return;
    try {
      const res = await fetch(`/api/proyectos/professional?id=${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Proyecto eliminado');
        loadProjects();
      }
    } catch (error) {
      toast.error('Error');
    }
  };

  const handleTaskCreate = async (projectId: string, task: Omit<GanttTask, 'id'>) => {
    try {
      const res = await fetch(`/api/proyectos/professional/tasks?projectId=${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (res.ok) {
        toast.success('Tarea creada');
        loadProjects();
      }
    } catch (error) {
      toast.error('Error');
    }
  };

  const handleTaskUpdate = async (projectId: string, taskId: string, updates: Partial<GanttTask>) => {
    try {
      const res = await fetch(`/api/proyectos/professional/tasks?projectId=${projectId}&taskId=${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        toast.success('Tarea actualizada');
        loadProjects();
      }
    } catch (error) {
      toast.error('Error');
    }
  };

  const handleTaskDelete = async (projectId: string, taskId: string) => {
    try {
      const res = await fetch(`/api/proyectos/professional/tasks?projectId=${projectId}&taskId=${taskId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Tarea eliminada');
        loadProjects();
      }
    } catch (error) {
      toast.error('Error');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      serviceType: 'consultoria',
      status: 'propuesta',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      budget: '',
      hourlyRate: '',
      estimatedHours: '',
    });
    setEditingProject(null);
  };

  const openEditDialog = (project: ProfessionalProject) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      clientPhone: project.clientPhone || '',
      serviceType: project.serviceType,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: String(project.budget),
      hourlyRate: String(project.hourlyRate),
      estimatedHours: String(project.estimatedHours),
    });
    setShowCreateDialog(true);
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto py-6 px-4 max-w-7xl">
          <Skeleton className="h-16 w-64 mb-8" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Card key={i}><CardContent className="pt-6"><Skeleton className="h-40" /></CardContent></Card>)}
          </div>
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
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Servicios Profesionales</h1>
              <p className="text-muted-foreground">Gestión de proyectos de consultoría, asesoría y más</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadProjects}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              className="bg-gradient-to-r from-violet-500 to-purple-500"
              onClick={() => { resetForm(); setShowCreateDialog(true); }}
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
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Briefcase className="h-8 w-8 text-violet-500" />
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
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completados</p>
                  <p className="text-2xl font-bold">{stats.completados}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Facturación</p>
                  <p className="text-2xl font-bold">
                    {stats.facturacionTotal > 0 ? formatCurrency(stats.facturacionTotal) : '-'}
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
                  <p className="text-sm text-muted-foreground">Horas</p>
                  <p className="text-2xl font-bold">{stats.horasTrabajadas}/{stats.horasEstimadas}h</p>
                </div>
                <Timer className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos o clientes..."
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
                {Object.entries(statusLabels).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-1 border rounded-lg p-1">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('grid')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'gantt' ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => setViewMode('gantt')}>
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Proyectos */}
        {projects.length === 0 ? (
          <EmptyState onCreateNew={() => setShowCreateDialog(true)} />
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No se encontraron proyectos</p>
            </CardContent>
          </Card>
        ) : viewMode === 'gantt' ? (
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const statusColor = statusColors[project.status];
              const hoursUsage = project.estimatedHours > 0 ? (project.actualHours / project.estimatedHours) * 100 : 0;
              
              return (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {project.clientName && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />
                            {project.clientName}
                          </CardDescription>
                        )}
                      </div>
                      <Badge className={`${statusColor.bg} ${statusColor.text}`}>
                        {statusLabels[project.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{serviceLabels[project.serviceType]}</Badge>
                      <span className="text-muted-foreground">
                        {format(parseISO(project.startDate), 'dd/MM')} - {format(parseISO(project.endDate), 'dd/MM/yy')}
                      </span>
                    </div>
                    
                    {/* Financiero */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted/30 rounded">
                        <p className="text-xs text-muted-foreground">Presupuesto</p>
                        <p className="font-semibold">{formatCurrency(project.budget)}</p>
                      </div>
                      {project.hourlyRate > 0 && (
                        <div className="p-2 bg-muted/30 rounded">
                          <p className="text-xs text-muted-foreground">Tarifa/hora</p>
                          <p className="font-semibold">{formatCurrency(project.hourlyRate)}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Horas */}
                    {project.estimatedHours > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Horas</span>
                          <span>{project.actualHours}h / {project.estimatedHours}h</span>
                        </div>
                        <Progress value={Math.min(hoursUsage, 100)} className={`h-2 ${hoursUsage > 100 ? '[&>div]:bg-red-500' : ''}`} />
                      </div>
                    )}
                    
                    {/* Progreso */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progreso</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedProject(project); setShowDetailDialog(true); }}>
                        <Calendar className="h-4 w-4 mr-1" />
                        Gantt
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(project)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteProject(project.id)}>
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
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{project.name}</span>
                          <Badge className={`${statusColor.bg} ${statusColor.text}`}>{statusLabels[project.status]}</Badge>
                          <Badge variant="outline">{serviceLabels[project.serviceType]}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {project.clientName && <span className="flex items-center gap-1"><User className="h-3 w-3" />{project.clientName}</span>}
                          <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{formatCurrency(project.budget)}</span>
                          <span className="flex items-center gap-1"><Timer className="h-3 w-3" />{project.actualHours}h/{project.estimatedHours}h</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{project.progress}%</p>
                          <Progress value={project.progress} className="w-24 h-2" />
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedProject(project); setShowDetailDialog(true); }}>
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

        {/* Dialog Crear/Editar */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto de Servicios'}</DialogTitle>
              <DialogDescription>Define los datos del proyecto profesional</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del proyecto *</Label>
                  <Input placeholder="Ej: Asesoría fiscal Q1" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de servicio</Label>
                  <Select value={formData.serviceType} onValueChange={(v: any) => setFormData(prev => ({ ...prev, serviceType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(serviceLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea placeholder="Detalles del proyecto..." value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} />
              </div>
              
              {/* Cliente */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nombre cliente</Label>
                  <Input placeholder="Nombre" value={formData.clientName} onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Email cliente</Label>
                  <Input type="email" placeholder="email@ejemplo.com" value={formData.clientEmail} onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input placeholder="+34 600..." value={formData.clientPhone} onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))} />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fecha inicio *</Label>
                  <Input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin *</Label>
                  <Input type="date" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData(prev => ({ ...prev, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Presupuesto (€)</Label>
                  <Input type="number" placeholder="0" value={formData.budget} onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tarifa/hora (€)</Label>
                  <Input type="number" placeholder="0" value={formData.hourlyRate} onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Horas estimadas</Label>
                  <Input type="number" placeholder="0" value={formData.estimatedHours} onChange={(e) => setFormData(prev => ({ ...prev, estimatedHours: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button className="bg-gradient-to-r from-violet-500 to-purple-500" onClick={handleCreateProject}>
                {editingProject ? 'Guardar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Gantt */}
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-violet-500" />
                {selectedProject?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedProject?.clientName && `Cliente: ${selectedProject.clientName}`}
                {selectedProject?.serviceType && ` • ${serviceLabels[selectedProject.serviceType]}`}
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
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
