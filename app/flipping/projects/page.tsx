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
  Home,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Euro,
  Clock,
  CheckCircle2,
  TrendingUp,
  Edit,
  Trash2,
  RefreshCw,
  MapPin,
  Percent,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Tipos
interface FlippingProject {
  id: string;
  name: string;
  description?: string;
  address: string;
  status: 'busqueda' | 'negociacion' | 'comprado' | 'reforma' | 'venta' | 'vendido' | 'cancelado';
  startDate: string;
  endDate: string;
  purchasePrice: number;
  renovationBudget: number;
  renovationSpent: number;
  targetSalePrice: number;
  actualSalePrice?: number;
  currentValue: number;
  squareMeters: number;
  progress: number;
  tasks: GanttTask[];
  createdAt: string;
}

// Colores y etiquetas
const statusColors: Record<string, { bg: string; text: string }> = {
  busqueda: { bg: 'bg-purple-100', text: 'text-purple-700' },
  negociacion: { bg: 'bg-amber-100', text: 'text-amber-700' },
  comprado: { bg: 'bg-blue-100', text: 'text-blue-700' },
  reforma: { bg: 'bg-orange-100', text: 'text-orange-700' },
  venta: { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  vendido: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelado: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

const statusLabels: Record<string, string> = {
  busqueda: 'Búsqueda',
  negociacion: 'Negociación',
  comprado: 'Comprado',
  reforma: 'En Reforma',
  venta: 'En Venta',
  vendido: 'Vendido',
  cancelado: 'Cancelado',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
};

// Estado vacío
function EmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  return (
    <Card>
      <CardContent className="pt-12 pb-12 text-center">
        <Home className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Sin proyectos de flipping</h3>
        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
          Crea tu primer proyecto de house flipping para gestionar compra, reforma y venta con diagrama de Gantt y cálculo de ROI.
        </p>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Crear Proyecto
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FlippingProjectsPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<FlippingProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<FlippingProject | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'gantt'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<FlippingProject | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    status: 'busqueda' as FlippingProject['status'],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
    purchasePrice: '',
    renovationBudget: '',
    targetSalePrice: '',
    squareMeters: '',
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
      const res = await fetch('/api/proyectos/flipping');
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

  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcular ROI
  const calculateROI = (project: FlippingProject) => {
    const totalInvestment = project.purchasePrice + project.renovationSpent;
    const salePrice = project.actualSalePrice || project.targetSalePrice;
    if (totalInvestment === 0) return 0;
    return ((salePrice - totalInvestment) / totalInvestment) * 100;
  };

  // Estadísticas
  const stats = {
    total: projects.length,
    enReforma: projects.filter(p => p.status === 'reforma').length,
    vendidos: projects.filter(p => p.status === 'vendido').length,
    inversionTotal: projects.reduce((sum, p) => sum + p.purchasePrice + p.renovationSpent, 0),
    ventasTotal: projects
      .filter(p => p.status === 'vendido')
      .reduce((sum, p) => sum + (p.actualSalePrice || 0), 0),
    roiPromedio: projects.length > 0 
      ? projects.reduce((sum, p) => sum + calculateROI(p), 0) / projects.length
      : 0,
  };

  const handleCreateProject = async () => {
    if (!formData.name || !formData.address || !formData.startDate || !formData.endDate) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/proyectos/flipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchasePrice: parseFloat(formData.purchasePrice) || 0,
          renovationBudget: parseFloat(formData.renovationBudget) || 0,
          targetSalePrice: parseFloat(formData.targetSalePrice) || 0,
          squareMeters: parseFloat(formData.squareMeters) || 0,
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
      const res = await fetch(`/api/proyectos/flipping?id=${projectId}`, { method: 'DELETE' });
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
      const res = await fetch(`/api/proyectos/flipping/tasks?projectId=${projectId}`, {
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
      const res = await fetch(`/api/proyectos/flipping/tasks?projectId=${projectId}&taskId=${taskId}`, {
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
      const res = await fetch(`/api/proyectos/flipping/tasks?projectId=${projectId}&taskId=${taskId}`, {
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
      address: '',
      status: 'busqueda',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
      purchasePrice: '',
      renovationBudget: '',
      targetSalePrice: '',
      squareMeters: '',
    });
    setEditingProject(null);
  };

  const openEditDialog = (project: FlippingProject) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      address: project.address,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
      purchasePrice: String(project.purchasePrice),
      renovationBudget: String(project.renovationBudget),
      targetSalePrice: String(project.targetSalePrice),
      squareMeters: String(project.squareMeters),
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
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">House Flipping</h1>
              <p className="text-muted-foreground">Gestión de proyectos de compra-reforma-venta</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadProjects}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button 
              className="bg-gradient-to-r from-emerald-500 to-teal-500"
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
                <Home className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Reforma</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.enReforma}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendidos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.vendidos}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Invertido</p>
                  <p className="text-2xl font-bold">
                    {stats.inversionTotal > 0 ? formatCurrency(stats.inversionTotal) : '-'}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">ROI Medio</p>
                  <p className={`text-2xl font-bold ${stats.roiPromedio >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.roiPromedio > 0 ? `${stats.roiPromedio.toFixed(1)}%` : '-'}
                  </p>
                </div>
                <Percent className="h-8 w-8 text-violet-500" />
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
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
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
                      budget: project.renovationBudget,
                      actualSpent: project.renovationSpent,
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
              const roi = calculateROI(project);
              const renovationUsage = project.renovationBudget > 0 
                ? (project.renovationSpent / project.renovationBudget) * 100 
                : 0;
              
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
                    {/* ROI */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">ROI Estimado</span>
                      <span className={`text-lg font-bold flex items-center gap-1 ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roi >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {roi.toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Financiero */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted/30 rounded">
                        <p className="text-xs text-muted-foreground">Compra</p>
                        <p className="font-semibold">{formatCurrency(project.purchasePrice)}</p>
                      </div>
                      <div className="p-2 bg-muted/30 rounded">
                        <p className="text-xs text-muted-foreground">Venta Objetivo</p>
                        <p className="font-semibold">{formatCurrency(project.targetSalePrice)}</p>
                      </div>
                    </div>
                    
                    {/* Reforma */}
                    {project.renovationBudget > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Reforma</span>
                          <span>{formatCurrency(project.renovationSpent)} / {formatCurrency(project.renovationBudget)}</span>
                        </div>
                        <Progress value={Math.min(renovationUsage, 100)} className={`h-2 ${renovationUsage > 100 ? '[&>div]:bg-red-500' : ''}`} />
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
                  const roi = calculateROI(project);
                  
                  return (
                    <div key={project.id} className="p-4 flex items-center gap-4 hover:bg-muted/50">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                        <Home className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{project.name}</span>
                          <Badge className={`${statusColor.bg} ${statusColor.text}`}>{statusLabels[project.status]}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.address}</span>
                          <span>{formatCurrency(project.purchasePrice)} → {formatCurrency(project.targetSalePrice)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>{roi.toFixed(1)}% ROI</p>
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
              <DialogTitle>{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto de Flipping'}</DialogTitle>
              <DialogDescription>Define los datos del proyecto de compra-reforma-venta</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input placeholder="Ej: Piso Salamanca" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
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
              <div className="space-y-2">
                <Label>Dirección *</Label>
                <Input placeholder="Calle, número, ciudad" value={formData.address} onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea placeholder="Detalles del proyecto..." value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={2} />
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
                  <Label>Superficie (m²)</Label>
                  <Input type="number" placeholder="0" value={formData.squareMeters} onChange={(e) => setFormData(prev => ({ ...prev, squareMeters: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Precio compra (€)</Label>
                  <Input type="number" placeholder="0" value={formData.purchasePrice} onChange={(e) => setFormData(prev => ({ ...prev, purchasePrice: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Presupuesto reforma (€)</Label>
                  <Input type="number" placeholder="0" value={formData.renovationBudget} onChange={(e) => setFormData(prev => ({ ...prev, renovationBudget: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Precio venta objetivo (€)</Label>
                  <Input type="number" placeholder="0" value={formData.targetSalePrice} onChange={(e) => setFormData(prev => ({ ...prev, targetSalePrice: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500" onClick={handleCreateProject}>
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
                <Home className="h-5 w-5 text-emerald-500" />
                {selectedProject?.name}
              </DialogTitle>
              <DialogDescription>{selectedProject?.address}</DialogDescription>
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
                  budget: selectedProject.renovationBudget,
                  actualSpent: selectedProject.renovationSpent,
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
