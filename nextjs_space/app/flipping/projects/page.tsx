'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, TrendingUp, Building2, Euro, Calendar, Target, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface FlippingProject {
  id: string;
  unitId: string | null;
  titulo: string;
  descripcion: string | null;
  estrategia: string;
  precioCompra: number;
  gastosAdquisicion: number;
  presupuestoReforma: number;
  gastosFinancieros: number;
  otrosGastos: number;
  inversionTotal: number;
  precioVentaObjetivo: number;
  precioVentaReal: number | null;
  beneficioNeto: number | null;
  roiPorcentaje: number | null;
  estado: string;
  fechaCompra: string;
  fechaInicioReforma: string | null;
  fechaFinReforma: string | null;
  fechaVenta: string | null;
  unit: {
    id: string;
    numero: string;
    building: {
      id: string;
      nombre: string;
      direccion: string;
    };
  } | null;
}

export default function FlippingProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<FlippingProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('todos');

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
    try {
      setLoading(true);
      const res = await fetch('/api/flipping/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch = 
        project.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.unit?.building.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = filterEstado === 'todos' || project.estado === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [projects, searchTerm, filterEstado]);

  const stats = useMemo(() => {
    const completados = projects.filter(p => p.estado === 'vendido');
    return {
      total: projects.length,
      activos: projects.filter(p => ['planificacion', 'en_reforma', 'en_venta'].includes(p.estado)).length,
      completados: completados.length,
      roiPromedio: completados.length > 0
        ? (completados.reduce((sum, p) => sum + (p.roiPorcentaje || 0), 0) / completados.length).toFixed(1)
        : '0.0',
    };
  }, [projects]);

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string; color: string }> = {
      planificacion: { variant: 'secondary' as any, label: 'Planificación', color: 'bg-blue-100 text-blue-800' },
      en_compra: { variant: 'outline' as any, label: 'En Compra', color: 'bg-purple-100 text-purple-800' },
      en_reforma: { variant: 'default' as any, label: 'En Reforma', color: 'bg-yellow-100 text-yellow-800' },
      en_venta: { variant: 'outline' as any, label: 'En Venta', color: 'bg-green-100 text-green-800' },
      vendido: { variant: 'default' as any, label: 'Vendido', color: 'bg-emerald-100 text-emerald-800' },
      cancelado: { variant: 'destructive' as any, label: 'Cancelado', color: 'bg-red-100 text-red-800' },
    };
    return badges[estado] || badges.planificacion;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30">
          <div className="container mx-auto p-6 space-y-6">
            {/* Breadcrumbs y Título */}
            <div className="flex items-center justify-between">
              <div>
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard">
                        <Home className="h-4 w-4" />
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>House Flipping</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl font-bold mt-2">Proyectos House Flipping</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona proyectos de inversión y renovación inmobiliaria
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyectos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En cartera
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    En desarrollo
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completados}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vendidos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">ROI Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.roiPromedio}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Retorno de inversión
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle>Filtros de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Buscar por título o edificio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Select value={filterEstado} onValueChange={setFilterEstado}>
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="planificacion">Planificación</SelectItem>
                        <SelectItem value="en_compra">En Compra</SelectItem>
                        <SelectItem value="en_reforma">En Reforma</SelectItem>
                        <SelectItem value="en_venta">En Venta</SelectItem>
                        <SelectItem value="vendido">Vendido</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Proyectos */}
            {filteredProjects.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay proyectos de flipping</h3>
                  <p className="text-sm text-muted-foreground">
                    Comienza a gestionar tus inversiones inmobiliarias
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredProjects.map((project) => {
                  const estadoBadge = getEstadoBadge(project.estado);
                  return (
                    <Card key={project.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-5 w-5 text-primary" />
                              <Badge className={estadoBadge.color}>
                                {estadoBadge.label}
                              </Badge>
                              <Badge variant="outline">{project.estrategia}</Badge>
                            </div>
                            <CardTitle className="text-lg">{project.titulo}</CardTitle>
                            {project.unit && (
                              <CardDescription className="mt-1">
                                <Building2 className="h-3 w-3 inline mr-1" />
                                {project.unit.building.nombre} - Unidad {project.unit.numero}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Inversión Total</p>
                            <div className="flex items-center gap-1">
                              <Euro className="h-4 w-4" />
                              <p className="font-bold">{project.inversionTotal.toLocaleString()}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Precio Objetivo</p>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <p className="font-bold">{project.precioVentaObjetivo.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {project.roiPorcentaje !== null && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm text-muted-foreground">ROI</p>
                            <p className="text-2xl font-bold text-green-600">{project.roiPorcentaje.toFixed(2)}%</p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Fecha Compra</p>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <p>{format(new Date(project.fechaCompra), 'd MMM yyyy', { locale: es })}</p>
                            </div>
                          </div>
                          {project.fechaVenta && (
                            <div>
                              <p className="text-muted-foreground">Fecha Venta</p>
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <p>{format(new Date(project.fechaVenta), 'd MMM yyyy', { locale: es })}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
