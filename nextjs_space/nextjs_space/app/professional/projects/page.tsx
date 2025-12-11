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
import { Home, ArrowLeft, Briefcase, Euro, Calendar, FileText, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import logger, { logError } from '@/lib/logger';

interface ProfessionalProject {
  id: string;
  titulo: string;
  descripcion: string | null;
  tipoServicio: string;
  cliente: string;
  estado: string;
  presupuesto: number;
  fechaInicio: string;
  fechaFinEstimada: string;
  fechaFinReal: string | null;
}

export default function ProfessionalProjectsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ProfessionalProject[]>([]);
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
      const res = await fetch('/api/professional/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      logger.error('Error loading projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        project.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.cliente.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEstado = filterEstado === 'todos' || project.estado === filterEstado;

      return matchesSearch && matchesEstado;
    });
  }, [projects, searchTerm, filterEstado]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      activos: projects.filter((p) => ['en_progreso', 'revision'].includes(p.estado)).length,
      completados: projects.filter((p) => p.estado === 'completado').length,
      facturacion: projects.reduce((sum, p) => sum + p.presupuesto, 0),
    };
  }, [projects]);

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string; color: string }> = {
      propuesta: {
        variant: 'secondary' as any,
        label: 'Propuesta',
        color: 'bg-blue-100 text-blue-800',
      },
      en_progreso: {
        variant: 'default' as any,
        label: 'En Progreso',
        color: 'bg-yellow-100 text-yellow-800',
      },
      revision: {
        variant: 'outline' as any,
        label: 'Revisión',
        color: 'bg-orange-100 text-orange-800',
      },
      completado: {
        variant: 'default' as any,
        label: 'Completado',
        color: 'bg-green-100 text-green-800',
      },
      cancelado: {
        variant: 'destructive' as any,
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800',
      },
    };
    return badges[estado] || badges.propuesta;
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
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
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
                      <BreadcrumbPage>Servicios Profesionales</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <h1 className="text-3xl font-bold mt-2">Servicios Profesionales</h1>
                <p className="text-muted-foreground mt-1">
                  Gestiona proyectos de arquitectura, topografía y asesoría
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
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Proyectos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">En cartera</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activos}</div>
                  <p className="text-xs text-muted-foreground mt-1">En desarrollo</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completados}</div>
                  <p className="text-xs text-muted-foreground mt-1">Finalizados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Facturación Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{stats.facturacion.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Volumen de negocio</p>
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
                      placeholder="Buscar por título o cliente..."
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
                        <SelectItem value="propuesta">Propuesta</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                        <SelectItem value="revision">Revisión</SelectItem>
                        <SelectItem value="completado">Completado</SelectItem>
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
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay proyectos profesionales</h3>
                  <p className="text-sm text-muted-foreground">
                    Comienza a gestionar tus servicios de arquitectura y asesoría
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
                              <Briefcase className="h-5 w-5 text-primary" />
                              <Badge className={estadoBadge.color}>{estadoBadge.label}</Badge>
                              <Badge variant="outline">{project.tipoServicio}</Badge>
                            </div>
                            <CardTitle className="text-lg">{project.titulo}</CardTitle>
                            <CardDescription className="mt-1">
                              <Users className="h-3 w-3 inline mr-1" />
                              Cliente: {project.cliente}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {project.descripcion && (
                          <p className="text-sm text-muted-foreground">{project.descripcion}</p>
                        )}

                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex items-center justify-between text-sm">
                            <p className="text-muted-foreground">Presupuesto</p>
                            <div className="flex items-center gap-1">
                              <Euro className="h-4 w-4" />
                              <p className="font-bold">{project.presupuesto.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t">
                          <div>
                            <p className="text-muted-foreground">Inicio</p>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <p>
                                {format(new Date(project.fechaInicio), 'd MMM yyyy', {
                                  locale: es,
                                })}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fin Estimado</p>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <p>
                                {format(new Date(project.fechaFinEstimada), 'd MMM yyyy', {
                                  locale: es,
                                })}
                              </p>
                            </div>
                          </div>
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
