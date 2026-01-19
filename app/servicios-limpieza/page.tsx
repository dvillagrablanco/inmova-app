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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  SprayCanIcon as Sparkles,
  Calendar,
  Clock,
  Users,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  MapPin,
  Star,
  Timer,
  Euro,
  ClipboardCheck,
  Camera,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  CheckSquare,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ServicioLimpieza {
  id: string;
  propiedad: string;
  propiedadId: string;
  tipo: 'rutinaria' | 'profunda' | 'check-out' | 'check-in' | 'emergencia';
  estado: 'programado' | 'en_progreso' | 'completado' | 'cancelado' | 'pendiente_revision';
  fechaProgramada: string;
  horaInicio?: string;
  horaFin?: string;
  duracionEstimada: number; // en minutos
  duracionReal?: number;
  personalAsignado: string[];
  tareas: Tarea[];
  notas?: string;
  calificacion?: number;
  fotosAntes?: string[];
  fotosDespues?: string[];
  costo: number;
  facturado: boolean;
}

interface Tarea {
  id: string;
  nombre: string;
  completada: boolean;
  orden: number;
}

interface Personal {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  rol: 'supervisor' | 'limpiador';
  estado: 'disponible' | 'ocupado' | 'no_disponible';
  tareasCompletadas: number;
  calificacionPromedio: number;
  propiedadesAsignadas: number;
}

interface Checklist {
  id: string;
  nombre: string;
  tipo: string;
  tareas: {
    id: string;
    nombre: string;
    obligatoria: boolean;
    categoria: string;
  }[];
  activo: boolean;
}

interface KPI {
  serviciosHoy: number;
  serviciosCompletados: number;
  tiempoPromedioHoy: number;
  calificacionPromedio: number;
  personalActivo: number;
  serviciosPendientes: number;
}

const TIPOS_SERVICIO = [
  { value: 'rutinaria', label: 'Limpieza Rutinaria', color: 'bg-blue-100 text-blue-800' },
  { value: 'profunda', label: 'Limpieza Profunda', color: 'bg-purple-100 text-purple-800' },
  { value: 'check-out', label: 'Check-Out', color: 'bg-amber-100 text-amber-800' },
  { value: 'check-in', label: 'Check-In', color: 'bg-green-100 text-green-800' },
  { value: 'emergencia', label: 'Emergencia', color: 'bg-red-100 text-red-800' },
];

const ESTADOS_SERVICIO = [
  { value: 'programado', label: 'Programado', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_progreso', label: 'En Progreso', color: 'bg-amber-100 text-amber-800' },
  { value: 'completado', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'pendiente_revision', label: 'Pendiente Revisión', color: 'bg-purple-100 text-purple-800' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

export default function ServiciosLimpiezaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('servicios');
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [fechaFilter, setFechaFilter] = useState('hoy');

  const [servicios, setServicios] = useState<ServicioLimpieza[]>([]);
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [kpis, setKpis] = useState<KPI>({
    serviciosHoy: 0,
    serviciosCompletados: 0,
    tiempoPromedioHoy: 0,
    calificacionPromedio: 0,
    personalActivo: 0,
    serviciosPendientes: 0,
  });

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showChecklistDialog, setShowChecklistDialog] = useState(false);
  const [selectedServicio, setSelectedServicio] = useState<ServicioLimpieza | null>(null);

  // Formulario nuevo servicio
  const [nuevoServicio, setNuevoServicio] = useState({
    propiedadId: '',
    tipo: 'rutinaria' as ServicioLimpieza['tipo'],
    fechaProgramada: '',
    horaInicio: '09:00',
    duracionEstimada: 120,
    personalAsignado: [] as string[],
    notas: '',
    checklist: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      loadData();
    }
  }, [status, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [serviciosRes, personalRes, checklistsRes] = await Promise.all([
        fetch('/api/limpieza/servicios'),
        fetch('/api/limpieza/personal'),
        fetch('/api/limpieza/checklists'),
      ]);

      const serviciosData = await serviciosRes.json();
      const personalData = await personalRes.json();
      const checklistsData = await checklistsRes.json();

      if (serviciosData.success) {
        setServicios(serviciosData.data || []);
        if (serviciosData.kpis) {
          setKpis(serviciosData.kpis);
        }
      }
      if (personalData.success) {
        setPersonal(personalData.data || []);
      }
      if (checklistsData.success) {
        setChecklists(checklistsData.data || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar datos de limpieza');
    } finally {
      setLoading(false);
    }
  };

  const crearServicio = async () => {
    if (!nuevoServicio.propiedadId || !nuevoServicio.fechaProgramada) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      const res = await fetch('/api/limpieza/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoServicio),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Servicio de limpieza programado');
        setShowCreateDialog(false);
        setNuevoServicio({
          propiedadId: '',
          tipo: 'rutinaria',
          fechaProgramada: '',
          horaInicio: '09:00',
          duracionEstimada: 120,
          personalAsignado: [],
          notas: '',
          checklist: '',
        });
        loadData();
      } else {
        toast.error(data.error || 'Error al programar servicio');
      }
    } catch (error) {
      toast.error('Error al programar servicio');
    }
  };

  const actualizarEstadoServicio = async (id: string, nuevoEstado: ServicioLimpieza['estado']) => {
    try {
      const res = await fetch(`/api/limpieza/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`Servicio actualizado a: ${nuevoEstado}`);
        loadData();
      } else {
        toast.error(data.error || 'Error al actualizar servicio');
      }
    } catch (error) {
      toast.error('Error al actualizar servicio');
    }
  };

  const eliminarServicio = async (id: string) => {
    try {
      const res = await fetch(`/api/limpieza/servicios/${id}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('Servicio eliminado');
        loadData();
      } else {
        toast.error(data.error || 'Error al eliminar servicio');
      }
    } catch (error) {
      toast.error('Error al eliminar servicio');
    }
  };

  // Filtros
  const filteredServicios = servicios.filter(s => {
    const matchSearch = s.propiedad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = estadoFilter === 'todos' || s.estado === estadoFilter;
    const matchTipo = tipoFilter === 'todos' || s.tipo === tipoFilter;
    return matchSearch && matchEstado && matchTipo;
  });

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando servicios de limpieza...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="h-8 w-8 text-blue-600" />
                Servicios de Limpieza
              </h1>
              <p className="text-muted-foreground mt-1">
                Programación, seguimiento y control de calidad
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Programar Limpieza
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Servicios Hoy</span>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.serviciosHoy}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Completados</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.serviciosCompletados}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pendientes</span>
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.serviciosPendientes}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Tiempo Promedio</span>
                <Timer className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.tiempoPromedioHoy}min</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Calificación</span>
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold">{kpis.calificacionPromedio.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Personal Activo</span>
                <Users className="h-4 w-4 text-cyan-600" />
              </div>
              <p className="text-2xl font-bold">{kpis.personalActivo}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="servicios">
              <Sparkles className="h-4 w-4 mr-2" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="calendario">
              <Calendar className="h-4 w-4 mr-2" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="personal">
              <Users className="h-4 w-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="checklists">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Checklists
            </TabsTrigger>
            <TabsTrigger value="calidad">
              <Star className="h-4 w-4 mr-2" />
              Control de Calidad
            </TabsTrigger>
          </TabsList>

          {/* Servicios */}
          <TabsContent value="servicios" className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por propiedad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {ESTADOS_SERVICIO.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {TIPOS_SERVICIO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={fechaFilter} onValueChange={setFechaFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mes</SelectItem>
                  <SelectItem value="todos">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredServicios.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay servicios de limpieza</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Programa tu primer servicio de limpieza para comenzar a gestionar la limpieza de tus propiedades.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Programar Primer Servicio
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Propiedad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha/Hora</TableHead>
                        <TableHead>Personal</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Calificación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServicios.map((servicio) => {
                        const tipoInfo = TIPOS_SERVICIO.find(t => t.value === servicio.tipo);
                        const estadoInfo = ESTADOS_SERVICIO.find(e => e.value === servicio.estado);
                        return (
                          <TableRow key={servicio.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{servicio.propiedad}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={tipoInfo?.color}>{tipoInfo?.label}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{new Date(servicio.fechaProgramada).toLocaleDateString('es-ES')}</div>
                                {servicio.horaInicio && (
                                  <div className="text-muted-foreground">{servicio.horaInicio}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{servicio.personalAsignado.length}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{servicio.duracionEstimada}min est.</div>
                                {servicio.duracionReal && (
                                  <div className="text-muted-foreground">{servicio.duracionReal}min real</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={estadoInfo?.color}>{estadoInfo?.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {servicio.calificacion ? (
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                  <span>{servicio.calificacion}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedServicio(servicio)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Detalles
                                  </DropdownMenuItem>
                                  {servicio.estado === 'programado' && (
                                    <DropdownMenuItem onClick={() => actualizarEstadoServicio(servicio.id, 'en_progreso')}>
                                      <Play className="h-4 w-4 mr-2" />
                                      Iniciar
                                    </DropdownMenuItem>
                                  )}
                                  {servicio.estado === 'en_progreso' && (
                                    <DropdownMenuItem onClick={() => actualizarEstadoServicio(servicio.id, 'completado')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Completar
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => {}}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => eliminarServicio(servicio.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Eliminar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Calendario */}
          <TabsContent value="calendario" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Vista de Calendario</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Visualiza y gestiona los servicios de limpieza en un calendario interactivo.
                </p>
                <div className="bg-gray-100 rounded-lg p-8 max-w-3xl mx-auto">
                  <p className="text-muted-foreground">
                    Calendario disponible cuando haya servicios programados
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal */}
          <TabsContent value="personal" className="space-y-4">
            {personal.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay personal registrado</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Registra al personal de limpieza para poder asignarles servicios.
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Personal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personal.map((p) => (
                  <Card key={p.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{p.nombre}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {p.rol === 'supervisor' ? 'Supervisor' : 'Limpiador'}
                          </Badge>
                        </div>
                        <Badge
                          variant={p.estado === 'disponible' ? 'default' : 
                                   p.estado === 'ocupado' ? 'secondary' : 'outline'}
                        >
                          {p.estado}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tareas Completadas</span>
                          <span className="font-medium">{p.tareasCompletadas}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Calificación</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="font-medium">{p.calificacionPromedio.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Propiedades</span>
                          <span className="font-medium">{p.propiedadesAsignadas}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Checklists */}
          <TabsContent value="checklists" className="space-y-4">
            {checklists.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <ClipboardCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay checklists configurados</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Crea checklists personalizados para estandarizar los procesos de limpieza.
                  </p>
                  <Button onClick={() => setShowChecklistDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Checklist
                  </Button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-3xl mx-auto">
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <CheckSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <h4 className="font-medium">Limpieza Básica</h4>
                        <p className="text-xs text-muted-foreground">15 tareas estándar</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <CheckSquare className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-medium">Limpieza Profunda</h4>
                        <p className="text-xs text-muted-foreground">28 tareas completas</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <CheckSquare className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                        <h4 className="font-medium">Check-Out STR</h4>
                        <p className="text-xs text-muted-foreground">22 tareas específicas</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {checklists.map((checklist) => (
                  <Card key={checklist.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{checklist.nombre}</CardTitle>
                          <Badge variant="outline" className="mt-1">{checklist.tipo}</Badge>
                        </div>
                        <Badge variant={checklist.activo ? 'default' : 'secondary'}>
                          {checklist.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {checklist.tareas.length} tareas
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Control de Calidad */}
          <TabsContent value="calidad" className="space-y-4">
            <Card>
              <CardContent className="text-center py-12">
                <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Control de Calidad</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Revisa la calidad de los servicios de limpieza completados, califica y proporciona feedback.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-green-600">0</div>
                      <p className="text-sm text-muted-foreground">Excelentes (5★)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-amber-600">0</div>
                      <p className="text-sm text-muted-foreground">Pendientes de Revisión</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl font-bold text-red-600">0</div>
                      <p className="text-sm text-muted-foreground">Requieren Mejora</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog Crear Servicio */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Programar Servicio de Limpieza</DialogTitle>
              <DialogDescription>
                Configura los detalles del servicio de limpieza
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Propiedad *</Label>
                <Select 
                  value={nuevoServicio.propiedadId} 
                  onValueChange={(v) => setNuevoServicio({...nuevoServicio, propiedadId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Apartamento Centro - Calle Mayor 15</SelectItem>
                    <SelectItem value="2">Piso Eixample - Av. Diagonal 200</SelectItem>
                    <SelectItem value="3">Loft Gracia - Carrer Verdi 50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Limpieza *</Label>
                  <Select 
                    value={nuevoServicio.tipo} 
                    onValueChange={(v) => setNuevoServicio({...nuevoServicio, tipo: v as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SERVICIO.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Checklist</Label>
                  <Select 
                    value={nuevoServicio.checklist} 
                    onValueChange={(v) => setNuevoServicio({...nuevoServicio, checklist: v})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basico">Limpieza Básica</SelectItem>
                      <SelectItem value="profunda">Limpieza Profunda</SelectItem>
                      <SelectItem value="checkout">Check-Out STR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={nuevoServicio.fechaProgramada}
                    onChange={(e) => setNuevoServicio({...nuevoServicio, fechaProgramada: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Inicio</Label>
                  <Input
                    type="time"
                    value={nuevoServicio.horaInicio}
                    onChange={(e) => setNuevoServicio({...nuevoServicio, horaInicio: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Duración Estimada (minutos)</Label>
                <Select 
                  value={nuevoServicio.duracionEstimada.toString()} 
                  onValueChange={(v) => setNuevoServicio({...nuevoServicio, duracionEstimada: parseInt(v)})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1.5 horas</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                    <SelectItem value="180">3 horas</SelectItem>
                    <SelectItem value="240">4 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas Adicionales</Label>
                <Textarea
                  value={nuevoServicio.notas}
                  onChange={(e) => setNuevoServicio({...nuevoServicio, notas: e.target.value})}
                  placeholder="Instrucciones especiales, áreas de enfoque, etc."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={crearServicio}>
                <Plus className="h-4 w-4 mr-2" />
                Programar Servicio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
