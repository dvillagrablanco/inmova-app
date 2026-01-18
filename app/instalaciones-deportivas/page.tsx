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
  Dumbbell,
  Calendar,
  Clock,
  Users,
  MapPin,
  Euro,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Activity,
  Timer,
  Key,
  Wrench,
  TrendingUp,
  BarChart3,
  UserCheck,
  Ban,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface InstalacionDeportiva {
  id: string;
  nombre: string;
  tipo: 'piscina' | 'gimnasio' | 'pista_padel' | 'pista_tenis' | 'cancha' | 'spa' | 'sauna' | 'otro';
  ubicacion: string;
  capacidad: number;
  estado: 'disponible' | 'ocupado' | 'mantenimiento' | 'cerrado';
  descripcion?: string;
  amenidades: string[];
  horarioApertura: string;
  horarioCierre: string;
  precioHora?: number;
  incluidoEnCuota: boolean;
  reservasHoy: number;
  ocupacionSemana: number; // %
  calificacion: number;
}

interface Reserva {
  id: string;
  instalacionId: string;
  instalacionNombre: string;
  usuario: string;
  usuarioId: string;
  unidad?: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'confirmada' | 'pendiente' | 'cancelada' | 'completada' | 'no_show';
  precio?: number;
  notas?: string;
}

interface MantenimientoInstalacion {
  id: string;
  instalacionId: string;
  instalacionNombre: string;
  tipo: 'preventivo' | 'correctivo' | 'limpieza' | 'revision';
  fecha: string;
  estado: 'programado' | 'en_progreso' | 'completado';
  descripcion: string;
  costo?: number;
  responsable?: string;
}

interface AccesoRegistro {
  id: string;
  instalacionId: string;
  instalacionNombre: string;
  usuario: string;
  fecha: string;
  horaEntrada: string;
  horaSalida?: string;
  metodoAcceso: 'tarjeta' | 'codigo' | 'manual' | 'app';
}

const TIPOS_INSTALACION = [
  { value: 'piscina', label: 'Piscina', icon: '🏊', color: 'bg-blue-100 text-blue-800' },
  { value: 'gimnasio', label: 'Gimnasio', icon: '🏋️', color: 'bg-purple-100 text-purple-800' },
  { value: 'pista_padel', label: 'Pista de Pádel', icon: '🎾', color: 'bg-green-100 text-green-800' },
  { value: 'pista_tenis', label: 'Pista de Tenis', icon: '🎾', color: 'bg-amber-100 text-amber-800' },
  { value: 'cancha', label: 'Cancha Multideporte', icon: '⚽', color: 'bg-orange-100 text-orange-800' },
  { value: 'spa', label: 'Spa', icon: '💆', color: 'bg-pink-100 text-pink-800' },
  { value: 'sauna', label: 'Sauna', icon: '🧖', color: 'bg-red-100 text-red-800' },
  { value: 'otro', label: 'Otro', icon: '🏢', color: 'bg-gray-100 text-gray-800' },
];

export default function InstalacionesDeportivasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('instalaciones');
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [estadoFilter, setEstadoFilter] = useState('todos');

  const [instalaciones, setInstalaciones] = useState<InstalacionDeportiva[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mantenimientos, setMantenimientos] = useState<MantenimientoInstalacion[]>([]);
  const [accesos, setAccesos] = useState<AccesoRegistro[]>([]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showReservaDialog, setShowReservaDialog] = useState(false);
  const [selectedInstalacion, setSelectedInstalacion] = useState<InstalacionDeportiva | null>(null);

  // Formularios
  const [nuevaInstalacion, setNuevaInstalacion] = useState({
    nombre: '',
    tipo: 'gimnasio' as InstalacionDeportiva['tipo'],
    ubicacion: '',
    capacidad: 10,
    horarioApertura: '07:00',
    horarioCierre: '22:00',
    precioHora: 0,
    incluidoEnCuota: true,
    descripcion: '',
  });

  const [nuevaReserva, setNuevaReserva] = useState({
    instalacionId: '',
    fecha: '',
    horaInicio: '09:00',
    horaFin: '10:00',
    notas: '',
  });

  // KPIs calculados
  const totalInstalaciones = instalaciones.length;
  const instalacionesDisponibles = instalaciones.filter(i => i.estado === 'disponible').length;
  const reservasHoy = reservas.filter(r => 
    new Date(r.fecha).toDateString() === new Date().toDateString() && r.estado !== 'cancelada'
  ).length;
  const ocupacionPromedio = instalaciones.length > 0
    ? instalaciones.reduce((acc, i) => acc + i.ocupacionSemana, 0) / instalaciones.length
    : 0;
  const ingresosMes = reservas
    .filter(r => r.precio && r.estado === 'completada')
    .reduce((acc, r) => acc + (r.precio || 0), 0);
  const calificacionPromedio = instalaciones.length > 0
    ? instalaciones.reduce((acc, i) => acc + i.calificacion, 0) / instalaciones.length
    : 0;

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
      // TODO: Integrar con API real
      // const [instRes, resRes, mantRes, accRes] = await Promise.all([
      //   fetch('/api/instalaciones-deportivas'),
      //   fetch('/api/instalaciones-deportivas/reservas'),
      //   fetch('/api/instalaciones-deportivas/mantenimientos'),
      //   fetch('/api/instalaciones-deportivas/accesos'),
      // ]);

      // Estado vacío inicial
      setInstalaciones([]);
      setReservas([]);
      setMantenimientos([]);
      setAccesos([]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      toast.error('Error al cargar instalaciones deportivas');
    } finally {
      setLoading(false);
    }
  };

  const crearInstalacion = async () => {
    if (!nuevaInstalacion.nombre || !nuevaInstalacion.ubicacion) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      // TODO: Integrar con API real
      toast.success('Instalación creada exitosamente');
      setShowAddDialog(false);
      setNuevaInstalacion({
        nombre: '',
        tipo: 'gimnasio',
        ubicacion: '',
        capacidad: 10,
        horarioApertura: '07:00',
        horarioCierre: '22:00',
        precioHora: 0,
        incluidoEnCuota: true,
        descripcion: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear instalación');
    }
  };

  const crearReserva = async () => {
    if (!nuevaReserva.instalacionId || !nuevaReserva.fecha) {
      toast.error('Completa los campos obligatorios');
      return;
    }

    try {
      // TODO: Integrar con API real
      toast.success('Reserva creada exitosamente');
      setShowReservaDialog(false);
      setNuevaReserva({
        instalacionId: '',
        fecha: '',
        horaInicio: '09:00',
        horaFin: '10:00',
        notas: '',
      });
      loadData();
    } catch (error) {
      toast.error('Error al crear reserva');
    }
  };

  const cancelarReserva = async (id: string) => {
    try {
      // TODO: Integrar con API real
      toast.success('Reserva cancelada');
      loadData();
    } catch (error) {
      toast.error('Error al cancelar reserva');
    }
  };

  // Filtros
  const filteredInstalaciones = instalaciones.filter(i => {
    const matchSearch = i.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        i.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = tipoFilter === 'todos' || i.tipo === tipoFilter;
    const matchEstado = estadoFilter === 'todos' || i.estado === estadoFilter;
    return matchSearch && matchTipo && matchEstado;
  });

  const getTipoInfo = (tipo: string) => {
    return TIPOS_INSTALACION.find(t => t.value === tipo) || TIPOS_INSTALACION[TIPOS_INSTALACION.length - 1];
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, string> = {
      disponible: 'bg-green-100 text-green-800',
      ocupado: 'bg-blue-100 text-blue-800',
      mantenimiento: 'bg-amber-100 text-amber-800',
      cerrado: 'bg-red-100 text-red-800',
      confirmada: 'bg-green-100 text-green-800',
      pendiente: 'bg-amber-100 text-amber-800',
      cancelada: 'bg-red-100 text-red-800',
      completada: 'bg-blue-100 text-blue-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    return colores[estado] || 'bg-gray-100 text-gray-800';
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando instalaciones deportivas...</p>
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
                <Dumbbell className="h-8 w-8 text-green-600" />
                Instalaciones Deportivas
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestión de espacios deportivos, reservas y accesos
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={() => setShowReservaDialog(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Instalación
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Instalaciones</span>
                <Dumbbell className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{totalInstalaciones}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Disponibles</span>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold">{instalacionesDisponibles}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Reservas Hoy</span>
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold">{reservasHoy}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ocupación</span>
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold">{ocupacionPromedio.toFixed(0)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Ingresos Mes</span>
                <Euro className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold">{ingresosMes}€</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Valoración</span>
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold">{calificacionPromedio.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="instalaciones">
              <Dumbbell className="h-4 w-4 mr-2" />
              Instalaciones
            </TabsTrigger>
            <TabsTrigger value="reservas">
              <Calendar className="h-4 w-4 mr-2" />
              Reservas
            </TabsTrigger>
            <TabsTrigger value="calendario">
              <Clock className="h-4 w-4 mr-2" />
              Calendario
            </TabsTrigger>
            <TabsTrigger value="accesos">
              <Key className="h-4 w-4 mr-2" />
              Control de Accesos
            </TabsTrigger>
            <TabsTrigger value="mantenimiento">
              <Wrench className="h-4 w-4 mr-2" />
              Mantenimiento
            </TabsTrigger>
          </TabsList>

          {/* Instalaciones */}
          <TabsContent value="instalaciones" className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar instalaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {TIPOS_INSTALACION.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="ocupado">Ocupado</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredInstalaciones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Dumbbell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay instalaciones deportivas</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Registra las instalaciones deportivas de tus propiedades para gestionar reservas y accesos.
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Primera Instalación
                  </Button>

                  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    {TIPOS_INSTALACION.slice(0, 8).map((tipo) => (
                      <Card key={tipo.value} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowAddDialog(true)}>
                        <CardContent className="p-4 text-center">
                          <span className="text-3xl">{tipo.icon}</span>
                          <p className="font-medium text-sm mt-2">{tipo.label}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredInstalaciones.map((instalacion) => {
                  const tipoInfo = getTipoInfo(instalacion.tipo);
                  return (
                    <Card key={instalacion.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{tipoInfo.icon}</span>
                            <div>
                              <CardTitle className="text-lg">{instalacion.nombre}</CardTitle>
                              <CardDescription className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {instalacion.ubicacion}
                              </CardDescription>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="h-4 w-4 mr-2" />
                                Ver Reservas
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge className={tipoInfo.color}>{tipoInfo.label}</Badge>
                            <Badge className={getEstadoColor(instalacion.estado)}>
                              {instalacion.estado}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Users className="h-3 w-3" />
                              Capacidad: {instalacion.capacidad}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {instalacion.horarioApertura} - {instalacion.horarioCierre}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Ocupación semanal</span>
                              <span>{instalacion.ocupacionSemana}%</span>
                            </div>
                            <Progress value={instalacion.ocupacionSemana} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                              <span className="font-medium">{instalacion.calificacion}</span>
                            </div>
                            {instalacion.incluidoEnCuota ? (
                              <Badge variant="secondary">Incluido en cuota</Badge>
                            ) : (
                              <span className="font-medium text-green-600">{instalacion.precioHora}€/h</span>
                            )}
                          </div>

                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={() => {
                              setSelectedInstalacion(instalacion);
                              setNuevaReserva({ ...nuevaReserva, instalacionId: instalacion.id });
                              setShowReservaDialog(true);
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Reservar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Reservas */}
          <TabsContent value="reservas" className="space-y-4">
            {reservas.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
                  <p className="text-muted-foreground mb-4">
                    Las reservas de instalaciones aparecerán aquí
                  </p>
                  <Button onClick={() => setShowReservaDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Reserva
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Reservas Activas</CardTitle>
                  <CardDescription>Gestión de reservas de instalaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalación</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservas.map((reserva) => (
                        <TableRow key={reserva.id}>
                          <TableCell className="font-medium">{reserva.instalacionNombre}</TableCell>
                          <TableCell>
                            <div>
                              <p>{reserva.usuario}</p>
                              {reserva.unidad && (
                                <p className="text-xs text-muted-foreground">{reserva.unidad}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{new Date(reserva.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{reserva.horaInicio} - {reserva.horaFin}</TableCell>
                          <TableCell>{reserva.precio ? `${reserva.precio}€` : 'Incluido'}</TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(reserva.estado)}>
                              {reserva.estado}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalles
                                </DropdownMenuItem>
                                {reserva.estado === 'confirmada' && (
                                  <DropdownMenuItem 
                                    onClick={() => cancelarReserva(reserva.id)}
                                    className="text-red-600"
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
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
                <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Vista de Calendario</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Visualiza la disponibilidad y reservas de todas las instalaciones en un calendario interactivo.
                </p>
                <div className="bg-gray-100 rounded-lg p-8 max-w-3xl mx-auto">
                  <p className="text-muted-foreground">
                    Calendario disponible cuando haya instalaciones y reservas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Control de Accesos */}
          <TabsContent value="accesos" className="space-y-4">
            {accesos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin registros de acceso</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    Configura el control de accesos para registrar entradas y salidas de las instalaciones.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-6">
                    {[
                      { metodo: 'Tarjeta RFID', icon: '💳', desc: 'Acceso con tarjeta' },
                      { metodo: 'Código PIN', icon: '🔢', desc: 'Teclado numérico' },
                      { metodo: 'App Móvil', icon: '📱', desc: 'Bluetooth/QR' },
                      { metodo: 'Manual', icon: '👤', desc: 'Control presencial' },
                    ].map((m, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 text-center">
                          <span className="text-2xl">{m.icon}</span>
                          <p className="font-medium text-sm mt-2">{m.metodo}</p>
                          <p className="text-xs text-muted-foreground">{m.desc}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Registros de Acceso</CardTitle>
                  <CardDescription>Historial de entradas y salidas</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalación</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Salida</TableHead>
                        <TableHead>Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accesos.map((acceso) => (
                        <TableRow key={acceso.id}>
                          <TableCell>{acceso.instalacionNombre}</TableCell>
                          <TableCell>{acceso.usuario}</TableCell>
                          <TableCell>{new Date(acceso.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{acceso.horaEntrada}</TableCell>
                          <TableCell>{acceso.horaSalida || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{acceso.metodoAcceso}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Mantenimiento */}
          <TabsContent value="mantenimiento" className="space-y-4">
            {mantenimientos.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin mantenimientos programados</h3>
                  <p className="text-muted-foreground mb-4">
                    Programa mantenimientos para mantener las instalaciones en óptimas condiciones
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Programar Mantenimiento
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Mantenimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instalación</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Responsable</TableHead>
                        <TableHead>Costo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mantenimientos.map((mant) => (
                        <TableRow key={mant.id}>
                          <TableCell>{mant.instalacionNombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{mant.tipo}</Badge>
                          </TableCell>
                          <TableCell>{new Date(mant.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell>{mant.responsable || '-'}</TableCell>
                          <TableCell>{mant.costo ? `${mant.costo}€` : '-'}</TableCell>
                          <TableCell>
                            <Badge className={getEstadoColor(mant.estado)}>
                              {mant.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog Nueva Instalación */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nueva Instalación Deportiva</DialogTitle>
              <DialogDescription>
                Registra una nueva instalación o espacio deportivo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    value={nuevaInstalacion.nombre}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, nombre: e.target.value})}
                    placeholder="Ej: Piscina Climatizada"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select 
                    value={nuevaInstalacion.tipo} 
                    onValueChange={(v) => setNuevaInstalacion({...nuevaInstalacion, tipo: v as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_INSTALACION.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.icon} {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ubicación *</Label>
                <Input
                  value={nuevaInstalacion.ubicacion}
                  onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, ubicacion: e.target.value})}
                  placeholder="Ej: Edificio A, Planta -1"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    value={nuevaInstalacion.capacidad}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, capacidad: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Apertura</Label>
                  <Input
                    type="time"
                    value={nuevaInstalacion.horarioApertura}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, horarioApertura: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cierre</Label>
                  <Input
                    type="time"
                    value={nuevaInstalacion.horarioCierre}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, horarioCierre: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Precio por Hora (€)</Label>
                  <Input
                    type="number"
                    value={nuevaInstalacion.precioHora}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, precioHora: parseFloat(e.target.value)})}
                    placeholder="0 si incluido en cuota"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="incluidoCuota"
                    checked={nuevaInstalacion.incluidoEnCuota}
                    onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, incluidoEnCuota: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="incluidoCuota">Incluido en cuota</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={nuevaInstalacion.descripcion}
                  onChange={(e) => setNuevaInstalacion({...nuevaInstalacion, descripcion: e.target.value})}
                  placeholder="Descripción y amenidades de la instalación..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={crearInstalacion}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Instalación
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog Nueva Reserva */}
        <Dialog open={showReservaDialog} onOpenChange={setShowReservaDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Reserva</DialogTitle>
              <DialogDescription>
                {selectedInstalacion 
                  ? `Reservar ${selectedInstalacion.nombre}`
                  : 'Selecciona una instalación y horario'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Instalación *</Label>
                <Select 
                  value={nuevaReserva.instalacionId} 
                  onValueChange={(v) => setNuevaReserva({...nuevaReserva, instalacionId: v})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una instalación" />
                  </SelectTrigger>
                  <SelectContent>
                    {instalaciones.filter(i => i.estado === 'disponible').map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={nuevaReserva.fecha}
                  onChange={(e) => setNuevaReserva({...nuevaReserva, fecha: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora Inicio</Label>
                  <Input
                    type="time"
                    value={nuevaReserva.horaInicio}
                    onChange={(e) => setNuevaReserva({...nuevaReserva, horaInicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora Fin</Label>
                  <Input
                    type="time"
                    value={nuevaReserva.horaFin}
                    onChange={(e) => setNuevaReserva({...nuevaReserva, horaFin: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={nuevaReserva.notas}
                  onChange={(e) => setNuevaReserva({...nuevaReserva, notas: e.target.value})}
                  placeholder="Notas adicionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReservaDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={crearReserva}>
                <Calendar className="h-4 w-4 mr-2" />
                Confirmar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
