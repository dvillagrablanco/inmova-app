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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HardHat,
  Plus,
  Search,
  Filter,
  Calendar,
  Euro,
  Building2,
  User,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  FileText,
  Users,
  Wrench,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface Obra {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'reforma_integral' | 'reforma_parcial' | 'mantenimiento' | 'nueva_construccion' | 'rehabilitacion';
  estado: 'planificada' | 'en_curso' | 'pausada' | 'completada' | 'cancelada';
  propiedadId: string;
  propiedadDireccion: string;
  fechaInicio: string;
  fechaFinPrevista: string;
  fechaFinReal?: string;
  presupuestoTotal: number;
  costoActual: number;
  progreso: number;
  contratista?: string;
  responsable?: string;
  permisos: boolean;
  fases: Fase[];
}

interface Fase {
  id: string;
  nombre: string;
  estado: 'pendiente' | 'en_curso' | 'completada';
  progreso: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export default function ObrasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [obras, setObras] = useState<Obra[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newObra, setNewObra] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'reforma_integral' as const,
    propiedadDireccion: '',
    fechaInicio: '',
    fechaFinPrevista: '',
    presupuestoTotal: 0,
    contratista: '',
    responsable: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadObras();
    }
  }, [status]);

  const loadObras = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/obras');
      // const data = await response.json();
      // setObras(data.obras);
      
      // Estado vacío inicial
      setObras([]);
    } catch (error) {
      toast.error('Error al cargar las obras');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObra = async () => {
    if (!newObra.nombre || !newObra.fechaInicio || !newObra.presupuestoTotal) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    try {
      // TODO: Integrar con API real
      toast.success('Obra creada correctamente');
      setShowCreateDialog(false);
      loadObras();
    } catch (error) {
      toast.error('Error al crear la obra');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      planificada: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      en_curso: { color: 'bg-blue-100 text-blue-800', icon: Play },
      pausada: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      completada: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelada: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };
    const { color, icon: Icon } = config[estado] || config.planificada;
    const labels: Record<string, string> = {
      planificada: 'Planificada',
      en_curso: 'En Curso',
      pausada: 'Pausada',
      completada: 'Completada',
      cancelada: 'Cancelada',
    };
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {labels[estado]}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, string> = {
      reforma_integral: 'bg-purple-100 text-purple-800',
      reforma_parcial: 'bg-blue-100 text-blue-800',
      mantenimiento: 'bg-green-100 text-green-800',
      nueva_construccion: 'bg-orange-100 text-orange-800',
      rehabilitacion: 'bg-teal-100 text-teal-800',
    };
    const labels: Record<string, string> = {
      reforma_integral: 'Reforma Integral',
      reforma_parcial: 'Reforma Parcial',
      mantenimiento: 'Mantenimiento',
      nueva_construccion: 'Nueva Construcción',
      rehabilitacion: 'Rehabilitación',
    };
    return <Badge className={config[tipo]}>{labels[tipo]}</Badge>;
  };

  const filteredObras = obras.filter((o) => {
    const matchesSearch =
      o.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.propiedadDireccion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || o.tipo === tipoFilter;
    const matchesEstado = estadoFilter === 'todos' || o.estado === estadoFilter;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Estadísticas
  const stats = {
    total: obras.length,
    enCurso: obras.filter((o) => o.estado === 'en_curso').length,
    completadas: obras.filter((o) => o.estado === 'completada').length,
    presupuestoTotal: obras.reduce((sum, o) => sum + o.presupuestoTotal, 0),
    costoActual: obras.reduce((sum, o) => sum + o.costoActual, 0),
  };

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <HardHat className="h-8 w-8 text-orange-600" />
              Gestión de Obras
            </h1>
            <p className="text-gray-600 mt-1">
              Coordina y supervisa obras, reformas y proyectos de construcción
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadObras}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Obra
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Obra</DialogTitle>
                  <DialogDescription>
                    Complete los datos del proyecto de obra o reforma
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre del Proyecto *</Label>
                    <Input
                      value={newObra.nombre}
                      onChange={(e) => setNewObra({ ...newObra, nombre: e.target.value })}
                      placeholder="Ej: Reforma integral Piso 3A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={newObra.descripcion}
                      onChange={(e) => setNewObra({ ...newObra, descripcion: e.target.value })}
                      placeholder="Descripción detallada del proyecto..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Obra *</Label>
                      <Select
                        value={newObra.tipo}
                        onValueChange={(value: any) => setNewObra({ ...newObra, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="reforma_integral">Reforma Integral</SelectItem>
                          <SelectItem value="reforma_parcial">Reforma Parcial</SelectItem>
                          <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                          <SelectItem value="nueva_construccion">Nueva Construcción</SelectItem>
                          <SelectItem value="rehabilitacion">Rehabilitación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Presupuesto (€) *</Label>
                      <Input
                        type="number"
                        value={newObra.presupuestoTotal}
                        onChange={(e) =>
                          setNewObra({ ...newObra, presupuestoTotal: parseFloat(e.target.value) })
                        }
                        placeholder="50000"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección de la Propiedad *</Label>
                    <Input
                      value={newObra.propiedadDireccion}
                      onChange={(e) =>
                        setNewObra({ ...newObra, propiedadDireccion: e.target.value })
                      }
                      placeholder="Calle Mayor 15, 3º A, Madrid"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Inicio *</Label>
                      <Input
                        type="date"
                        value={newObra.fechaInicio}
                        onChange={(e) => setNewObra({ ...newObra, fechaInicio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Fin Prevista</Label>
                      <Input
                        type="date"
                        value={newObra.fechaFinPrevista}
                        onChange={(e) =>
                          setNewObra({ ...newObra, fechaFinPrevista: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contratista</Label>
                      <Input
                        value={newObra.contratista}
                        onChange={(e) => setNewObra({ ...newObra, contratista: e.target.value })}
                        placeholder="Nombre de la empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Responsable</Label>
                      <Input
                        value={newObra.responsable}
                        onChange={(e) => setNewObra({ ...newObra, responsable: e.target.value })}
                        placeholder="Jefe de obra"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateObra}>Crear Obra</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <HardHat className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Proyectos</div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">En Curso</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.enCurso}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Completadas</div>
                  <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Euro className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Presupuesto Total</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.presupuestoTotal.toLocaleString('es-ES')}€
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nombre o dirección..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  <SelectItem value="reforma_integral">Reforma Integral</SelectItem>
                  <SelectItem value="reforma_parcial">Reforma Parcial</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="nueva_construccion">Nueva Construcción</SelectItem>
                  <SelectItem value="rehabilitacion">Rehabilitación</SelectItem>
                </SelectContent>
              </Select>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="planificada">Planificada</SelectItem>
                  <SelectItem value="en_curso">En Curso</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Obras */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredObras.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <HardHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay obras registradas
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza creando tu primer proyecto de obra o reforma
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Obra
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredObras.map((obra) => (
              <Card key={obra.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{obra.nombre}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {obra.propiedadDireccion}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <FileText className="h-4 w-4 mr-2" />
                          Documentos
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getTipoBadge(obra.tipo)}
                    {getEstadoBadge(obra.estado)}
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium">{obra.progreso}%</span>
                    </div>
                    <Progress value={obra.progreso} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Presupuesto</p>
                      <p className="font-semibold">
                        {obra.presupuestoTotal.toLocaleString('es-ES')}€
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gastado</p>
                      <p
                        className={`font-semibold ${
                          obra.costoActual > obra.presupuestoTotal
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {obra.costoActual.toLocaleString('es-ES')}€
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(obra.fechaInicio), 'dd/MM/yyyy')}</span>
                      {obra.fechaFinPrevista && (
                        <>
                          <span>→</span>
                          <span>{format(new Date(obra.fechaFinPrevista), 'dd/MM/yyyy')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {obra.contratista && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>{obra.contratista}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
