'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  RefreshCw,
  Plus,
  Search,
  Calendar,
  ArrowLeft,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Hammer,
  Euro,
  Users,
  Building2,
  ClipboardList,
  PlayCircle,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface ProyectoRenovacion {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'mantenimiento' | 'mejora' | 'reparacion' | 'instalacion' | 'rehabilitacion';
  zona: string;
  estado: 'planificado' | 'aprobado' | 'en_curso' | 'pausado' | 'completado' | 'cancelado';
  prioridad: 'urgente' | 'alta' | 'media' | 'baja';
  presupuestoEstimado: number;
  presupuestoReal?: number;
  fechaInicio?: string;
  fechaFinPrevista?: string;
  fechaFinReal?: string;
  progreso: number;
  contratista?: string;
  responsable?: string;
  aprobadoEnJunta?: boolean;
  fechaAprobacion?: string;
}

interface SolicitudRenovacion {
  id: string;
  solicitante: string;
  vivienda: string;
  descripcion: string;
  tipo: string;
  fechaSolicitud: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'en_revision';
}

const estadoColors: Record<string, string> = {
  planificado: 'bg-gray-100 text-gray-800',
  aprobado: 'bg-blue-100 text-blue-800',
  en_curso: 'bg-green-100 text-green-800',
  pausado: 'bg-amber-100 text-amber-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const prioridadColors: Record<string, string> = {
  urgente: 'bg-red-100 text-red-800',
  alta: 'bg-orange-100 text-orange-800',
  media: 'bg-amber-100 text-amber-800',
  baja: 'bg-green-100 text-green-800',
};

const tipoConfig: Record<string, { color: string; label: string }> = {
  mantenimiento: { color: 'bg-blue-100 text-blue-800', label: 'Mantenimiento' },
  mejora: { color: 'bg-green-100 text-green-800', label: 'Mejora' },
  reparacion: { color: 'bg-amber-100 text-amber-800', label: 'Reparación' },
  instalacion: { color: 'bg-purple-100 text-purple-800', label: 'Instalación' },
  rehabilitacion: { color: 'bg-indigo-100 text-indigo-800', label: 'Rehabilitación' },
};

export default function RenovacionesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState<ProyectoRenovacion[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudRenovacion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [showCreateProyecto, setShowCreateProyecto] = useState(false);
  const [activeTab, setActiveTab] = useState('proyectos');

  const [newProyecto, setNewProyecto] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'mantenimiento' as const,
    zona: '',
    prioridad: 'media' as const,
    presupuestoEstimado: 0,
    fechaInicio: '',
    fechaFinPrevista: '',
    contratista: '',
    responsable: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
    }
  }, [status]);

  const loadData = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/comunidades/renovaciones');
      // const data = await response.json();
      // setProyectos(data.proyectos);
      // setSolicitudes(data.solicitudes);
      
      // Estado vacío inicial
      setProyectos([]);
      setSolicitudes([]);
    } catch (error) {
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProyecto = async () => {
    try {
      // TODO: Integrar con API real
      toast.success('Proyecto creado correctamente');
      setShowCreateProyecto(false);
      setNewProyecto({
        nombre: '',
        descripcion: '',
        tipo: 'mantenimiento',
        zona: '',
        prioridad: 'media',
        presupuestoEstimado: 0,
        fechaInicio: '',
        fechaFinPrevista: '',
        contratista: '',
        responsable: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear el proyecto');
    }
  };

  const filteredProyectos = proyectos.filter((proyecto) => {
    const matchesSearch = proyecto.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proyecto.zona.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || proyecto.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  // KPIs
  const totalProyectos = proyectos.length;
  const proyectosEnCurso = proyectos.filter(p => p.estado === 'en_curso').length;
  const proyectosPlanificados = proyectos.filter(p => p.estado === 'planificado' || p.estado === 'aprobado').length;
  const proyectosCompletados = proyectos.filter(p => p.estado === 'completado').length;
  const presupuestoTotal = proyectos.reduce((sum, p) => sum + p.presupuestoEstimado, 0);
  const solicitudesPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <RefreshCw className="h-8 w-8 text-orange-600" />
                Gestión de Renovaciones
              </h1>
              <p className="text-muted-foreground mt-1">
                Proyectos de mejora, mantenimiento y rehabilitación
              </p>
            </div>
          </div>
          <Dialog open={showCreateProyecto} onOpenChange={setShowCreateProyecto}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Nuevo Proyecto de Renovación</DialogTitle>
                <DialogDescription>
                  Crear un nuevo proyecto de mejora o mantenimiento
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre del Proyecto</Label>
                  <Input
                    value={newProyecto.nombre}
                    onChange={(e) => setNewProyecto({...newProyecto, nombre: e.target.value})}
                    placeholder="Ej: Rehabilitación de fachada principal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={newProyecto.tipo} onValueChange={(v: any) => setNewProyecto({...newProyecto, tipo: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        <SelectItem value="mejora">Mejora</SelectItem>
                        <SelectItem value="reparacion">Reparación</SelectItem>
                        <SelectItem value="instalacion">Instalación</SelectItem>
                        <SelectItem value="rehabilitacion">Rehabilitación</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Prioridad</Label>
                    <Select value={newProyecto.prioridad} onValueChange={(v: any) => setNewProyecto({...newProyecto, prioridad: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urgente">Urgente</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="baja">Baja</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Zona / Ubicación</Label>
                  <Input
                    value={newProyecto.zona}
                    onChange={(e) => setNewProyecto({...newProyecto, zona: e.target.value})}
                    placeholder="Ej: Fachada principal, Cubierta, Zonas comunes..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={newProyecto.descripcion}
                    onChange={(e) => setNewProyecto({...newProyecto, descripcion: e.target.value})}
                    placeholder="Descripción detallada del proyecto..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Presupuesto Estimado (€)</Label>
                    <Input
                      type="number"
                      value={newProyecto.presupuestoEstimado || ''}
                      onChange={(e) => setNewProyecto({...newProyecto, presupuestoEstimado: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contratista</Label>
                    <Input
                      value={newProyecto.contratista}
                      onChange={(e) => setNewProyecto({...newProyecto, contratista: e.target.value})}
                      placeholder="Empresa o profesional"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Fecha Inicio Prevista</Label>
                    <Input
                      type="date"
                      value={newProyecto.fechaInicio}
                      onChange={(e) => setNewProyecto({...newProyecto, fechaInicio: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fecha Fin Prevista</Label>
                    <Input
                      type="date"
                      value={newProyecto.fechaFinPrevista}
                      onChange={(e) => setNewProyecto({...newProyecto, fechaFinPrevista: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateProyecto(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateProyecto}>
                  Crear Proyecto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{totalProyectos}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-orange-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Curso</p>
                  <p className="text-2xl font-bold text-green-600">{proyectosEnCurso}</p>
                </div>
                <PlayCircle className="h-8 w-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Planificados</p>
                  <p className="text-2xl font-bold text-blue-600">{proyectosPlanificados}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completados</p>
                  <p className="text-2xl font-bold text-purple-600">{proyectosCompletados}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Presupuesto</p>
                  <p className="text-xl font-bold">{presupuestoTotal.toLocaleString('es-ES')}€</p>
                </div>
                <Euro className="h-8 w-8 text-amber-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Solicitudes</p>
                  <p className="text-2xl font-bold text-red-600">{solicitudesPendientes}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="proyectos">Proyectos</TabsTrigger>
            <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
            <TabsTrigger value="presupuestos">Presupuestos</TabsTrigger>
          </TabsList>

          <TabsContent value="proyectos" className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar proyecto..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los estados</SelectItem>
                      <SelectItem value="planificado">Planificado</SelectItem>
                      <SelectItem value="aprobado">Aprobado</SelectItem>
                      <SelectItem value="en_curso">En Curso</SelectItem>
                      <SelectItem value="pausado">Pausado</SelectItem>
                      <SelectItem value="completado">Completado</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Proyectos */}
            {filteredProyectos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay proyectos</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primer proyecto de renovación
                  </p>
                  <Button onClick={() => setShowCreateProyecto(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proyecto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredProyectos.map((proyecto) => {
                  const tipo = tipoConfig[proyecto.tipo];
                  
                  return (
                    <Card key={proyecto.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={tipo.color}>{tipo.label}</Badge>
                              <Badge className={estadoColors[proyecto.estado]}>
                                {proyecto.estado.replace('_', ' ')}
                              </Badge>
                              <Badge className={prioridadColors[proyecto.prioridad]}>
                                {proyecto.prioridad}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-semibold">{proyecto.nombre}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{proyecto.descripcion}</p>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Building2 className="h-4 w-4" />
                                {proyecto.zona}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Euro className="h-4 w-4" />
                                {proyecto.presupuestoEstimado.toLocaleString('es-ES')}€
                              </div>
                              {proyecto.contratista && (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  {proyecto.contratista}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {proyecto.aprobadoEnJunta && (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Aprobado
                              </Badge>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver detalle
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <PlayCircle className="h-4 w-4 mr-2" />
                                  Iniciar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <PauseCircle className="h-4 w-4 mr-2" />
                                  Pausar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Completar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        
                        {/* Progress */}
                        {proyecto.estado === 'en_curso' && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progreso</span>
                              <span>{proyecto.progreso}%</span>
                            </div>
                            <Progress value={proyecto.progreso} className="h-2" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="solicitudes" className="space-y-4">
            {solicitudes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay solicitudes</h3>
                  <p className="text-muted-foreground">
                    Las solicitudes de renovación aparecerán aquí
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Historial de Proyectos</h3>
                <p className="text-muted-foreground">
                  El historial de proyectos completados aparecerá aquí
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="presupuestos" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Comparador de Presupuestos</h3>
                <p className="text-muted-foreground">
                  Compara y gestiona presupuestos de contratistas
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
