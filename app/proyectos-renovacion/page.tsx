'use client';

import { useState, useEffect } from 'react';
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
  Hammer, Plus, TrendingUp, TrendingDown, Euro, Calendar, 
  MapPin, BarChart3, AlertTriangle, CheckCircle2, Clock,
  ArrowUpRight, ArrowDownRight, Building2
} from 'lucide-react';

interface RenovationProject {
  id: string;
  nombre: string;
  direccion: string;
  descripcion?: string;
  precioCompra: number;
  gastosCompra: number;
  fechaCompra?: string;
  presupuestoRenovacion: number;
  gastosRealesRenovacion: number;
  precioVentaEstimado: number;
  precioVentaReal?: number;
  gastosVenta: number;
  fechaVenta?: string;
  estado: string;
  createdAt: string;
  // Computed
  inversionTotal: number;
  beneficioEstimado: number;
  roiEstimado: number;
  beneficioReal?: number;
  roiReal?: number;
  avanceRenovacion: number;
  renovations: Array<{
    id: string;
    categoria: string;
    descripcion: string;
    presupuestado: number;
    costoReal?: number;
    completado: boolean;
    porcentajeAvance: number;
  }>;
}

interface Stats {
  total: number;
  enPlanificacion: number;
  enRenovacion: number;
  enVenta: number;
  vendidos: number;
  inversionTotal: number;
  beneficioTotalReal: number;
}

export default function ProyectosRenovacionPage() {
  const [projects, setProjects] = useState<RenovationProject[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<RenovationProject | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('');

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    descripcion: '',
    precioCompra: 0,
    gastosCompra: 0,
    fechaCompra: '',
    presupuestoRenovacion: 0,
    precioVentaEstimado: 0,
    estado: 'planificacion',
  });

  useEffect(() => {
    loadProjects();
  }, [filterEstado]);

  async function loadProjects() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterEstado) params.append('estado', filterEstado);
      
      const response = await fetch(`/api/proyectos-renovacion?${params}`);
      if (!response.ok) throw new Error('Error al cargar proyectos');
      
      const data = await response.json();
      setProjects(data.data || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    try {
      if (!formData.nombre || !formData.direccion || formData.precioCompra <= 0) {
        toast.error('Completa los campos obligatorios');
        return;
      }

      const response = await fetch('/api/proyectos-renovacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear proyecto');
      }

      toast.success('Proyecto de renovación creado');
      setDialogOpen(false);
      setFormData({
        nombre: '',
        direccion: '',
        descripcion: '',
        precioCompra: 0,
        gastosCompra: 0,
        fechaCompra: '',
        presupuestoRenovacion: 0,
        precioVentaEstimado: 0,
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
      en_renovacion: { label: 'En Renovación', variant: 'default' },
      en_venta: { label: 'En Venta', variant: 'secondary' },
      vendido: { label: 'Vendido', variant: 'default' },
      cancelado: { label: 'Cancelado', variant: 'destructive' },
    };
    const c = config[estado] || config.planificacion;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
    }).format(value);
  };

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
              <BreadcrumbPage>Proyectos de Renovación</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Hammer className="h-6 w-6 text-orange-500" />
              Proyectos de Renovación
            </h1>
            <p className="text-muted-foreground">
              Gestión de proyectos de renovación y reforma (House Flipping)
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo Proyecto de Renovación</DialogTitle>
                <DialogDescription>
                  Crea un nuevo proyecto de house flipping
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nombre del Proyecto *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Reforma Piso Centro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dirección *</Label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle, número, ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del proyecto..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Precio de Compra *</Label>
                    <Input
                      type="number"
                      value={formData.precioCompra}
                      onChange={(e) => setFormData({ ...formData, precioCompra: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Gastos de Compra</Label>
                    <Input
                      type="number"
                      value={formData.gastosCompra}
                      onChange={(e) => setFormData({ ...formData, gastosCompra: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Compra</Label>
                  <Input
                    type="date"
                    value={formData.fechaCompra}
                    onChange={(e) => setFormData({ ...formData, fechaCompra: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Presupuesto Renovación *</Label>
                    <Input
                      type="number"
                      value={formData.presupuestoRenovacion}
                      onChange={(e) => setFormData({ ...formData, presupuestoRenovacion: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio Venta Estimado *</Label>
                    <Input
                      type="number"
                      value={formData.precioVentaEstimado}
                      onChange={(e) => setFormData({ ...formData, precioVentaEstimado: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
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
                      <SelectItem value="en_renovacion">En Renovación</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>
                  Crear Proyecto
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
                <div className="text-sm text-muted-foreground">Total Proyectos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600">{stats.enRenovacion}</div>
                <div className="text-sm text-muted-foreground">En Renovación</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{formatCurrency(stats.inversionTotal)}</div>
                <div className="text-sm text-muted-foreground">Inversión Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className={`text-2xl font-bold ${stats.beneficioTotalReal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.beneficioTotalReal)}
                </div>
                <div className="text-sm text-muted-foreground">Beneficio Realizado</div>
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
                <SelectItem value="en_renovacion">En Renovación</SelectItem>
                <SelectItem value="en_venta">En Venta</SelectItem>
                <SelectItem value="vendido">Vendido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Projects List */}
        {projects.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Hammer className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No hay proyectos de renovación</h3>
                <p className="text-muted-foreground mb-4">
                  Crea tu primer proyecto de house flipping
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Proyecto
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{project.nombre}</h3>
                        {getEstadoBadge(project.estado)}
                      </div>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {project.direccion}
                      </p>
                      {project.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {project.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-6">
                      {/* Inversión */}
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Inversión Total</div>
                        <div className="font-semibold">{formatCurrency(project.inversionTotal)}</div>
                      </div>

                      {/* ROI Estimado */}
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">ROI Estimado</div>
                        <div className={`font-semibold flex items-center justify-center gap-1 ${project.roiEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {project.roiEstimado >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          {project.roiEstimado.toFixed(1)}%
                        </div>
                      </div>

                      {/* Beneficio Estimado */}
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Beneficio Est.</div>
                        <div className={`font-semibold ${project.beneficioEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(project.beneficioEstimado)}
                        </div>
                      </div>

                      {/* Avance */}
                      <div className="min-w-32">
                        <div className="text-xs text-muted-foreground mb-1">Avance</div>
                        <Progress value={project.avanceRenovacion} className="h-2" />
                        <div className="text-xs text-center mt-1">{project.avanceRenovacion}%</div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setDetailProject(project)}
                    >
                      Ver Detalles
                    </Button>
                  </div>

                  {/* Financial Summary Bar */}
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Compra:</span>{' '}
                      <span className="font-medium">{formatCurrency(project.precioCompra)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Renovación:</span>{' '}
                      <span className="font-medium">{formatCurrency(project.gastosRealesRenovacion)} / {formatCurrency(project.presupuestoRenovacion)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Venta Est.:</span>{' '}
                      <span className="font-medium">{formatCurrency(project.precioVentaEstimado)}</span>
                    </div>
                    {project.precioVentaReal && (
                      <div>
                        <span className="text-muted-foreground">Venta Real:</span>{' '}
                        <span className="font-medium text-green-600">{formatCurrency(project.precioVentaReal)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!detailProject} onOpenChange={() => setDetailProject(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {detailProject && (
              <>
                <DialogHeader>
                  <DialogTitle>{detailProject.nombre}</DialogTitle>
                  <DialogDescription className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {detailProject.direccion}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-xl font-bold">{formatCurrency(detailProject.inversionTotal)}</div>
                        <div className="text-xs text-muted-foreground">Inversión Total</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className={`text-xl font-bold ${detailProject.beneficioEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(detailProject.beneficioEstimado)}
                        </div>
                        <div className="text-xs text-muted-foreground">Beneficio Estimado</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className={`text-xl font-bold ${detailProject.roiEstimado >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {detailProject.roiEstimado.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">ROI Estimado</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 text-center">
                        <div className="text-xl font-bold">{detailProject.avanceRenovacion}%</div>
                        <div className="text-xs text-muted-foreground">Avance</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Renovations List */}
                  {detailProject.renovations && detailProject.renovations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Tareas de Renovación</h4>
                      <div className="space-y-2">
                        {detailProject.renovations.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {r.completado ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Clock className="h-5 w-5 text-yellow-600" />
                              )}
                              <div>
                                <div className="font-medium">{r.descripcion}</div>
                                <div className="text-xs text-muted-foreground">{r.categoria}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{formatCurrency(r.costoReal || r.presupuestado)}</div>
                              <div className="text-xs text-muted-foreground">
                                Presupuesto: {formatCurrency(r.presupuestado)}
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
