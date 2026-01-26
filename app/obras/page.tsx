'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  HardHat, Plus, Calendar, Euro, MapPin, AlertTriangle, 
  CheckCircle2, Clock, Building2, Users, BarChart3, 
  TrendingUp, TrendingDown, Eye, Ruler
} from 'lucide-react';

interface ConstructionProject {
  id: string;
  nombre: string;
  descripcion: string;
  tipoProyecto: string;
  direccion: string;
  parcela?: string;
  referenciaCatastral?: string;
  numViviendas?: number;
  metrosConstruidos?: number;
  numPlantas?: number;
  presupuestoTotal: number;
  gastosReales: number;
  fechaInicio: string;
  fechaFinPrevista: string;
  fechaFinReal?: string;
  arquitecto?: string;
  direccionObra?: string;
  contratistaPrincipal?: string;
  estado: string;
  createdAt: string;
  // Computed
  avanceGeneral: number;
  desviacionPorcentaje: number;
  diasRestantes?: number;
  enRiesgo: boolean;
  numOrdenesTrabajo: number;
  ordenesCompletadas: number;
  building?: {
    id: string;
    nombre: string;
    direccion: string;
  };
  workOrders: Array<{
    id: string;
    fase: string;
    titulo: string;
    estado: string;
    porcentajeAvance: number;
    presupuesto: number;
    costoReal?: number;
  }>;
}

interface Stats {
  total: number;
  enEjecucion: number;
  enPlanificacion: number;
  finalizadas: number;
  presupuestoTotal: number;
  gastosReales: number;
  metrosTotales: number;
}

export default function ObrasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<ConstructionProject | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('');

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    tipoProyecto: 'obra_nueva',
    direccion: '',
    numViviendas: 0,
    metrosConstruidos: 0,
    numPlantas: 0,
    presupuestoTotal: 0,
    fechaInicio: '',
    fechaFinPrevista: '',
    arquitecto: '',
    contratistaPrincipal: '',
    estado: 'planificacion',
  });

  // Redirigir al login si no hay sesión
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/obras');
    }
  }, [status, router]);

  // Cargar proyectos solo cuando hay sesión
  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [filterEstado, status]);

  async function loadProjects() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterEstado) params.append('estado', filterEstado);
      
      const response = await fetch(`/api/obras?${params}`);
      if (!response.ok) throw new Error('Error al cargar obras');
      
      const data = await response.json();
      setProjects(data.data || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar las obras');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      if (!formData.nombre || !formData.direccion || !formData.fechaInicio || !formData.fechaFinPrevista) {
        toast.error('Completa los campos obligatorios');
        return;
      }

      const response = await fetch('/api/obras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear obra');
      }

      toast.success('Obra creada exitosamente');
      setDialogOpen(false);
      setFormData({
        nombre: '',
        descripcion: '',
        tipoProyecto: 'obra_nueva',
        direccion: '',
        numViviendas: 0,
        metrosConstruidos: 0,
        numPlantas: 0,
        presupuestoTotal: 0,
        fechaInicio: '',
        fechaFinPrevista: '',
        arquitecto: '',
        contratistaPrincipal: '',
        estado: 'planificacion',
      });
      loadProjects();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      planificacion: { label: 'Planificación', variant: 'outline' },
      licencias: { label: 'En Licencias', variant: 'secondary' },
      ejecucion: { label: 'En Ejecución', variant: 'default' },
      parada: { label: 'Parada', variant: 'destructive' },
      finalizada: { label: 'Finalizada', variant: 'default' },
      cancelada: { label: 'Cancelada', variant: 'destructive' },
    };
    const c = config[estado] || config.planificacion;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getTipoBadge = (tipo: string) => {
    const tipoLabels: Record<string, string> = {
      obra_nueva: 'Obra Nueva',
      reforma_integral: 'Reforma Integral',
      rehabilitacion: 'Rehabilitación',
      ampliacion: 'Ampliación',
      demolicion: 'Demolición',
      otro: 'Otro',
    };
    return <Badge variant="outline">{tipoLabels[tipo] || tipo}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Mostrar skeleton mientras carga la sesión o los datos
  if (status === 'loading' || loading) {
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

  // Si no hay sesión, no renderizar (el useEffect ya redirige)
  if (status === 'unauthenticated') {
    return null;
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
              <BreadcrumbPage>Gestión de Obras</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HardHat className="h-6 w-6 text-yellow-500" />
              Gestión de Obras
            </h1>
            <p className="text-muted-foreground">
              Coordinación y seguimiento de obras y reformas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Obra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Obra</DialogTitle>
                <DialogDescription>
                  Registra un nuevo proyecto de construcción
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nombre del Proyecto *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Edificio Residencial Norte"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción *</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del proyecto..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Proyecto</Label>
                    <Select
                      value={formData.tipoProyecto}
                      onValueChange={(v) => setFormData({ ...formData, tipoProyecto: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="obra_nueva">Obra Nueva</SelectItem>
                        <SelectItem value="reforma_integral">Reforma Integral</SelectItem>
                        <SelectItem value="rehabilitacion">Rehabilitación</SelectItem>
                        <SelectItem value="ampliacion">Ampliación</SelectItem>
                        <SelectItem value="demolicion">Demolición</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Estado Inicial</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(v) => setFormData({ ...formData, estado: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planificacion">Planificación</SelectItem>
                        <SelectItem value="licencias">En Licencias</SelectItem>
                        <SelectItem value="ejecucion">En Ejecución</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Dirección *</Label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Dirección de la obra"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nº Viviendas</Label>
                    <Input
                      type="number"
                      value={formData.numViviendas}
                      onChange={(e) => setFormData({ ...formData, numViviendas: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>m² Construidos</Label>
                    <Input
                      type="number"
                      value={formData.metrosConstruidos}
                      onChange={(e) => setFormData({ ...formData, metrosConstruidos: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nº Plantas</Label>
                    <Input
                      type="number"
                      value={formData.numPlantas}
                      onChange={(e) => setFormData({ ...formData, numPlantas: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Presupuesto Total (€) *</Label>
                  <Input
                    type="number"
                    value={formData.presupuestoTotal}
                    onChange={(e) => setFormData({ ...formData, presupuestoTotal: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha Inicio *</Label>
                    <Input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin Prevista *</Label>
                    <Input
                      type="date"
                      value={formData.fechaFinPrevista}
                      onChange={(e) => setFormData({ ...formData, fechaFinPrevista: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Arquitecto</Label>
                    <Input
                      value={formData.arquitecto}
                      onChange={(e) => setFormData({ ...formData, arquitecto: e.target.value })}
                      placeholder="Nombre del arquitecto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contratista Principal</Label>
                    <Input
                      value={formData.contratistaPrincipal}
                      onChange={(e) => setFormData({ ...formData, contratistaPrincipal: e.target.value })}
                      placeholder="Empresa contratista"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>
                  Crear Obra
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Obras</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.enEjecucion}</div>
                <div className="text-sm text-muted-foreground">En Ejecución</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{formatCurrency(stats.presupuestoTotal)}</div>
                <div className="text-sm text-muted-foreground">Presupuesto Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {stats.metrosTotales.toLocaleString('es-ES')} m²
                </div>
                <div className="text-sm text-muted-foreground">Metros Construidos</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <Card>
          <CardContent className="pt-4">
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="planificacion">Planificación</SelectItem>
                <SelectItem value="licencias">En Licencias</SelectItem>
                <SelectItem value="ejecucion">En Ejecución</SelectItem>
                <SelectItem value="parada">Parada</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Projects List */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <HardHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay obras registradas</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primera obra para empezar a gestionar
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Obra
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className={`hover:shadow-md transition-shadow ${project.enRiesgo ? 'border-red-200' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{project.nombre}</h3>
                        {getEstadoBadge(project.estado)}
                        {getTipoBadge(project.tipoProyecto)}
                        {project.enRiesgo && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            En Riesgo
                          </Badge>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {project.direccion}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {project.descripcion}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {project.numViviendas && project.numViviendas > 0 && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {project.numViviendas} viviendas
                          </span>
                        )}
                        {project.metrosConstruidos && project.metrosConstruidos > 0 && (
                          <span className="flex items-center gap-1">
                            <Ruler className="h-4 w-4" />
                            {project.metrosConstruidos.toLocaleString('es-ES')} m²
                          </span>
                        )}
                        {project.diasRestantes !== null && project.diasRestantes !== undefined && (
                          <span className={`flex items-center gap-1 ${project.diasRestantes < 0 ? 'text-red-600' : ''}`}>
                            <Calendar className="h-4 w-4" />
                            {project.diasRestantes < 0 
                              ? `${Math.abs(project.diasRestantes)} días de retraso`
                              : `${project.diasRestantes} días restantes`
                            }
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Avance */}
                      <div className="min-w-32">
                        <div className="text-xs text-muted-foreground mb-1">Avance General</div>
                        <Progress value={project.avanceGeneral} className="h-2" />
                        <div className="text-xs text-center mt-1">{project.avanceGeneral}%</div>
                      </div>

                      {/* Desviación */}
                      <div className="text-center px-4">
                        <div className={`text-lg font-bold flex items-center justify-center gap-1 ${project.desviacionPorcentaje > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {project.desviacionPorcentaje > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {Math.abs(project.desviacionPorcentaje).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Desviación</div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setDetailProject(project)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>
                    </div>
                  </div>

                  {/* Financial Bar */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Presupuesto:</span>{' '}
                      <span className="font-medium">{formatCurrency(project.presupuestoTotal)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gastado:</span>{' '}
                      <span className={`font-medium ${project.gastosReales > project.presupuestoTotal ? 'text-red-600' : ''}`}>
                        {formatCurrency(project.gastosReales)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Órdenes:</span>{' '}
                      <span className="font-medium">{project.ordenesCompletadas}/{project.numOrdenesTrabajo}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Contratista:</span>{' '}
                      <span className="font-medium">{project.contratistaPrincipal || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!detailProject} onOpenChange={() => setDetailProject(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            {detailProject && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {detailProject.nombre}
                    {getEstadoBadge(detailProject.estado)}
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {detailProject.direccion}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-xl font-bold">{formatCurrency(detailProject.presupuestoTotal)}</div>
                        <div className="text-xs text-muted-foreground">Presupuesto</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className={`text-xl font-bold ${detailProject.gastosReales > detailProject.presupuestoTotal ? 'text-red-600' : ''}`}>
                          {formatCurrency(detailProject.gastosReales)}
                        </div>
                        <div className="text-xs text-muted-foreground">Gastado</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-xl font-bold">{detailProject.avanceGeneral}%</div>
                        <div className="text-xs text-muted-foreground">Avance</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className={`text-xl font-bold ${detailProject.desviacionPorcentaje > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {detailProject.desviacionPorcentaje > 0 ? '+' : ''}{detailProject.desviacionPorcentaje.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Desviación</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Project Info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    {detailProject.arquitecto && (
                      <div>
                        <span className="text-muted-foreground">Arquitecto:</span>{' '}
                        <span className="font-medium">{detailProject.arquitecto}</span>
                      </div>
                    )}
                    {detailProject.contratistaPrincipal && (
                      <div>
                        <span className="text-muted-foreground">Contratista:</span>{' '}
                        <span className="font-medium">{detailProject.contratistaPrincipal}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Inicio:</span>{' '}
                      <span className="font-medium">
                        {new Date(detailProject.fechaInicio).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fin Previsto:</span>{' '}
                      <span className="font-medium">
                        {new Date(detailProject.fechaFinPrevista).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    {detailProject.numViviendas && (
                      <div>
                        <span className="text-muted-foreground">Viviendas:</span>{' '}
                        <span className="font-medium">{detailProject.numViviendas}</span>
                      </div>
                    )}
                    {detailProject.metrosConstruidos && (
                      <div>
                        <span className="text-muted-foreground">Superficie:</span>{' '}
                        <span className="font-medium">{detailProject.metrosConstruidos.toLocaleString('es-ES')} m²</span>
                      </div>
                    )}
                  </div>

                  {/* Work Orders */}
                  {detailProject.workOrders && detailProject.workOrders.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Órdenes de Trabajo</h4>
                      <div className="space-y-2">
                        {detailProject.workOrders.map((wo) => (
                          <div key={wo.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {wo.estado === 'completada' ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              )}
                              <div>
                                <div className="font-medium">{wo.titulo}</div>
                                <div className="text-xs text-muted-foreground">Fase: {wo.fase}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Progress value={wo.porcentajeAvance} className="w-20 h-2" />
                              <span className="text-sm">{wo.porcentajeAvance}%</span>
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(wo.costoReal || wo.presupuesto)}</div>
                                <div className="text-xs text-muted-foreground">
                                  Ppto: {formatCurrency(wo.presupuesto)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
