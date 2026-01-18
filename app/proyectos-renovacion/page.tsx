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
  Hammer,
  Plus,
  Search,
  Calendar,
  Euro,
  Building2,
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
  TrendingUp,
  Camera,
  Image,
  ArrowUpRight,
  Calculator,
  Target,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface ProyectoRenovacion {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'flipping' | 'value_add' | 'reforma_alquiler' | 'rehabilitacion';
  estado: 'analisis' | 'planificacion' | 'en_curso' | 'completado' | 'vendido';
  propiedadId: string;
  propiedadDireccion: string;
  precioCompra: number;
  presupuestoRenovacion: number;
  gastoActual: number;
  valorEstimadoFinal: number;
  precioVenta?: number;
  fechaInicio: string;
  fechaFinPrevista: string;
  fechaFinReal?: string;
  progreso: number;
  roiEstimado: number;
  roiReal?: number;
  fotosAntes: string[];
  fotosDespues: string[];
  fases: FaseRenovacion[];
}

interface FaseRenovacion {
  id: string;
  nombre: string;
  estado: 'pendiente' | 'en_curso' | 'completada';
  presupuesto: number;
  gasto: number;
  progreso: number;
}

export default function ProyectosRenovacionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState<ProyectoRenovacion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newProyecto, setNewProyecto] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'flipping' as const,
    propiedadDireccion: '',
    precioCompra: 0,
    presupuestoRenovacion: 0,
    valorEstimadoFinal: 0,
    fechaInicio: '',
    fechaFinPrevista: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadProyectos();
    }
  }, [status]);

  const loadProyectos = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/proyectos-renovacion');
      // const data = await response.json();
      // setProyectos(data.proyectos);
      
      // Estado vacío inicial
      setProyectos([]);
    } catch (error) {
      toast.error('Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProyecto = async () => {
    if (!newProyecto.nombre || !newProyecto.precioCompra || !newProyecto.presupuestoRenovacion) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    try {
      // TODO: Integrar con API real
      toast.success('Proyecto de renovación creado correctamente');
      setShowCreateDialog(false);
      loadProyectos();
    } catch (error) {
      toast.error('Error al crear el proyecto');
    }
  };

  // Calcular ROI estimado
  const calcularROI = () => {
    const inversion = newProyecto.precioCompra + newProyecto.presupuestoRenovacion;
    if (inversion > 0 && newProyecto.valorEstimadoFinal > 0) {
      return ((newProyecto.valorEstimadoFinal - inversion) / inversion * 100).toFixed(1);
    }
    return '0';
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      analisis: { color: 'bg-gray-100 text-gray-800', icon: Target },
      planificacion: { color: 'bg-blue-100 text-blue-800', icon: FileText },
      en_curso: { color: 'bg-yellow-100 text-yellow-800', icon: Play },
      completado: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      vendido: { color: 'bg-purple-100 text-purple-800', icon: ArrowUpRight },
    };
    const { color, icon: Icon } = config[estado] || config.analisis;
    const labels: Record<string, string> = {
      analisis: 'En Análisis',
      planificacion: 'Planificación',
      en_curso: 'En Curso',
      completado: 'Completado',
      vendido: 'Vendido',
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
      flipping: 'bg-orange-100 text-orange-800',
      value_add: 'bg-blue-100 text-blue-800',
      reforma_alquiler: 'bg-green-100 text-green-800',
      rehabilitacion: 'bg-purple-100 text-purple-800',
    };
    const labels: Record<string, string> = {
      flipping: 'Flipping',
      value_add: 'Value Add',
      reforma_alquiler: 'Reforma Alquiler',
      rehabilitacion: 'Rehabilitación',
    };
    return <Badge className={config[tipo]}>{labels[tipo]}</Badge>;
  };

  const filteredProyectos = proyectos.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.propiedadDireccion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || p.tipo === tipoFilter;
    const matchesEstado = estadoFilter === 'todos' || p.estado === estadoFilter;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Estadísticas
  const stats = {
    total: proyectos.length,
    enCurso: proyectos.filter((p) => p.estado === 'en_curso').length,
    completados: proyectos.filter((p) => ['completado', 'vendido'].includes(p.estado)).length,
    inversionTotal: proyectos.reduce((sum, p) => sum + p.precioCompra + p.presupuestoRenovacion, 0),
    roiPromedio:
      proyectos.length > 0
        ? proyectos.reduce((sum, p) => sum + p.roiEstimado, 0) / proyectos.length
        : 0,
    beneficioRealizado: proyectos
      .filter((p) => p.estado === 'vendido' && p.precioVenta)
      .reduce((sum, p) => {
        const inversion = p.precioCompra + p.gastoActual;
        return sum + ((p.precioVenta || 0) - inversion);
      }, 0),
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
              <Hammer className="h-8 w-8 text-orange-600" />
              Proyectos de Renovación
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona proyectos de flipping, value-add y reformas con análisis de ROI
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadProyectos}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Proyecto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Proyecto de Renovación</DialogTitle>
                  <DialogDescription>
                    Define el proyecto con análisis de inversión y ROI esperado
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre del Proyecto *</Label>
                    <Input
                      value={newProyecto.nombre}
                      onChange={(e) => setNewProyecto({ ...newProyecto, nombre: e.target.value })}
                      placeholder="Ej: Reforma Piso Chamberí para venta"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={newProyecto.descripcion}
                      onChange={(e) => setNewProyecto({ ...newProyecto, descripcion: e.target.value })}
                      placeholder="Descripción del proyecto y objetivos..."
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Proyecto *</Label>
                      <Select
                        value={newProyecto.tipo}
                        onValueChange={(value: any) => setNewProyecto({ ...newProyecto, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="flipping">Flipping (Compra-Reforma-Venta)</SelectItem>
                          <SelectItem value="value_add">Value Add</SelectItem>
                          <SelectItem value="reforma_alquiler">Reforma para Alquiler</SelectItem>
                          <SelectItem value="rehabilitacion">Rehabilitación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección *</Label>
                      <Input
                        value={newProyecto.propiedadDireccion}
                        onChange={(e) =>
                          setNewProyecto({ ...newProyecto, propiedadDireccion: e.target.value })
                        }
                        placeholder="Calle Mayor 15, Madrid"
                      />
                    </div>
                  </div>

                  {/* Sección de Inversión */}
                  <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Análisis de Inversión
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Precio Compra (€) *</Label>
                        <Input
                          type="number"
                          value={newProyecto.precioCompra}
                          onChange={(e) =>
                            setNewProyecto({ ...newProyecto, precioCompra: parseFloat(e.target.value) || 0 })
                          }
                          placeholder="150000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Presupuesto Reforma (€) *</Label>
                        <Input
                          type="number"
                          value={newProyecto.presupuestoRenovacion}
                          onChange={(e) =>
                            setNewProyecto({
                              ...newProyecto,
                              presupuestoRenovacion: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="40000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Final Estimado (€) *</Label>
                        <Input
                          type="number"
                          value={newProyecto.valorEstimadoFinal}
                          onChange={(e) =>
                            setNewProyecto({
                              ...newProyecto,
                              valorEstimadoFinal: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="230000"
                        />
                      </div>
                    </div>
                    
                    {/* ROI Calculado */}
                    {newProyecto.precioCompra > 0 && newProyecto.valorEstimadoFinal > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div>
                          <p className="text-sm text-gray-600">Inversión Total</p>
                          <p className="font-semibold">
                            {(newProyecto.precioCompra + newProyecto.presupuestoRenovacion).toLocaleString('es-ES')}€
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Beneficio Estimado</p>
                          <p className="font-semibold text-green-600">
                            {(newProyecto.valorEstimadoFinal - newProyecto.precioCompra - newProyecto.presupuestoRenovacion).toLocaleString('es-ES')}€
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">ROI Estimado</p>
                          <p className={`text-xl font-bold ${parseFloat(calcularROI()) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {calcularROI()}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={newProyecto.fechaInicio}
                        onChange={(e) => setNewProyecto({ ...newProyecto, fechaInicio: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha Fin Prevista</Label>
                      <Input
                        type="date"
                        value={newProyecto.fechaFinPrevista}
                        onChange={(e) =>
                          setNewProyecto({ ...newProyecto, fechaFinPrevista: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateProyecto}>Crear Proyecto</Button>
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
                  <Hammer className="h-5 w-5 text-orange-600" />
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
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Play className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">En Curso</div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.enCurso}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">ROI Promedio</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.roiPromedio.toFixed(1)}%
                  </div>
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
                  <div className="text-sm text-gray-600">Inversión Total</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(stats.inversionTotal / 1000).toFixed(0)}K€
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
                  <SelectItem value="flipping">Flipping</SelectItem>
                  <SelectItem value="value_add">Value Add</SelectItem>
                  <SelectItem value="reforma_alquiler">Reforma Alquiler</SelectItem>
                  <SelectItem value="rehabilitacion">Rehabilitación</SelectItem>
                </SelectContent>
              </Select>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="analisis">En Análisis</SelectItem>
                  <SelectItem value="planificacion">Planificación</SelectItem>
                  <SelectItem value="en_curso">En Curso</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Proyectos */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredProyectos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Hammer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay proyectos de renovación
              </h3>
              <p className="text-gray-600 mb-4">
                Comienza creando tu primer proyecto de flipping o reforma
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Proyecto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredProyectos.map((proyecto) => {
              const inversionTotal = proyecto.precioCompra + proyecto.presupuestoRenovacion;
              const beneficioEstimado = proyecto.valorEstimadoFinal - inversionTotal;
              const desviacionPresupuesto =
                ((proyecto.gastoActual - proyecto.presupuestoRenovacion) / proyecto.presupuestoRenovacion) * 100;

              return (
                <Card key={proyecto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Imagen Before/After o Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center relative">
                    {proyecto.fotosAntes.length > 0 || proyecto.fotosDespues.length > 0 ? (
                      <div className="absolute inset-0 grid grid-cols-2">
                        <div className="bg-gray-200 flex items-center justify-center border-r">
                          <span className="text-xs text-gray-500">ANTES</span>
                        </div>
                        <div className="bg-gray-100 flex items-center justify-center">
                          <span className="text-xs text-gray-500">DESPUÉS</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="h-12 w-12 text-orange-300 mx-auto mb-2" />
                        <span className="text-sm text-orange-400">Sin fotos aún</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
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
                            <Image className="h-4 w-4 mr-2" />
                            Subir fotos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getTipoBadge(proyecto.tipo)}
                        {getEstadoBadge(proyecto.estado)}
                      </div>
                      <h3 className="font-semibold text-lg">{proyecto.nombre}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Building2 className="h-3 w-3" />
                        {proyecto.propiedadDireccion}
                      </p>
                    </div>

                    {/* Progreso */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progreso</span>
                        <span className="font-medium">{proyecto.progreso}%</span>
                      </div>
                      <Progress value={proyecto.progreso} className="h-2" />
                    </div>

                    {/* Métricas Financieras */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Inversión</p>
                        <p className="font-semibold text-sm">
                          {(inversionTotal / 1000).toFixed(0)}K€
                        </p>
                      </div>
                      <div className="text-center border-x">
                        <p className="text-xs text-gray-500">Beneficio Est.</p>
                        <p className={`font-semibold text-sm ${beneficioEstimado > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(beneficioEstimado / 1000).toFixed(0)}K€
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">ROI Est.</p>
                        <p className={`font-semibold text-sm ${proyecto.roiEstimado > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {proyecto.roiEstimado.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Desviación de presupuesto si aplica */}
                    {proyecto.estado === 'en_curso' && proyecto.gastoActual > 0 && (
                      <div className={`p-2 rounded text-sm ${desviacionPresupuesto > 10 ? 'bg-red-50 text-red-700' : desviacionPresupuesto > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-700'}`}>
                        <span className="font-medium">
                          {desviacionPresupuesto > 0 ? '+' : ''}{desviacionPresupuesto.toFixed(1)}%
                        </span> respecto al presupuesto
                      </div>
                    )}

                    {/* Fechas */}
                    <div className="flex items-center justify-between pt-3 border-t text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(proyecto.fechaInicio), 'dd/MM/yyyy')}</span>
                      </div>
                      {proyecto.fechaFinPrevista && (
                        <div>
                          → {format(new Date(proyecto.fechaFinPrevista), 'dd/MM/yyyy')}
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
    </AuthenticatedLayout>
  );
}
