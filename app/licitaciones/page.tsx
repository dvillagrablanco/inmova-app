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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Gavel,
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
  FileText,
  Users,
  RefreshCw,
  Send,
  Award,
  TrendingUp,
  BarChart3,
  Star,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, differenceInDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

interface Licitacion {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'obra' | 'servicio' | 'suministro' | 'mantenimiento';
  estado: 'borrador' | 'publicada' | 'en_evaluacion' | 'adjudicada' | 'desierta' | 'cancelada';
  presupuestoBase: number;
  fechaPublicacion?: string;
  fechaLimiteOfertas: string;
  fechaAdjudicacion?: string;
  propiedadId?: string;
  propiedadDireccion?: string;
  requisitos: string[];
  criteriosEvaluacion: CriterioEvaluacion[];
  ofertas: Oferta[];
  documentos: string[];
  ganadorId?: string;
}

interface CriterioEvaluacion {
  nombre: string;
  peso: number;
  descripcion?: string;
}

interface Oferta {
  id: string;
  proveedorNombre: string;
  proveedorEmail: string;
  importeOfertado: number;
  fechaRecepcion: string;
  documentos: string[];
  puntuacion?: number;
  estado: 'recibida' | 'evaluando' | 'aceptada' | 'rechazada';
  notas?: string;
}

export default function LicitacionesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [estadoFilter, setEstadoFilter] = useState<string>('todos');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('activas');

  const [newLicitacion, setNewLicitacion] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'obra' as const,
    presupuestoBase: 0,
    fechaLimiteOfertas: '',
    propiedadDireccion: '',
    requisitos: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadLicitaciones();
    }
  }, [status]);

  const loadLicitaciones = async () => {
    try {
      setLoading(true);
      // TODO: Integrar con API real
      // const response = await fetch('/api/licitaciones');
      // const data = await response.json();
      // setLicitaciones(data.licitaciones);
      
      // Estado vacío inicial
      setLicitaciones([]);
    } catch (error) {
      toast.error('Error al cargar las licitaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLicitacion = async () => {
    if (!newLicitacion.titulo || !newLicitacion.fechaLimiteOfertas || !newLicitacion.presupuestoBase) {
      toast.error('Complete los campos obligatorios');
      return;
    }

    try {
      // TODO: Integrar con API real
      toast.success('Licitación creada correctamente');
      setShowCreateDialog(false);
      loadLicitaciones();
    } catch (error) {
      toast.error('Error al crear la licitación');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      borrador: { color: 'bg-gray-100 text-gray-800', icon: FileText },
      publicada: { color: 'bg-blue-100 text-blue-800', icon: Send },
      en_evaluacion: { color: 'bg-yellow-100 text-yellow-800', icon: BarChart3 },
      adjudicada: { color: 'bg-green-100 text-green-800', icon: Award },
      desierta: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      cancelada: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };
    const { color, icon: Icon } = config[estado] || config.borrador;
    const labels: Record<string, string> = {
      borrador: 'Borrador',
      publicada: 'Publicada',
      en_evaluacion: 'En Evaluación',
      adjudicada: 'Adjudicada',
      desierta: 'Desierta',
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
      obra: 'bg-purple-100 text-purple-800',
      servicio: 'bg-blue-100 text-blue-800',
      suministro: 'bg-green-100 text-green-800',
      mantenimiento: 'bg-orange-100 text-orange-800',
    };
    const labels: Record<string, string> = {
      obra: 'Obra',
      servicio: 'Servicio',
      suministro: 'Suministro',
      mantenimiento: 'Mantenimiento',
    };
    return <Badge className={config[tipo]}>{labels[tipo]}</Badge>;
  };

  const filteredLicitaciones = licitaciones.filter((l) => {
    const matchesSearch =
      l.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.propiedadDireccion?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || l.tipo === tipoFilter;
    const matchesEstado = estadoFilter === 'todos' || l.estado === estadoFilter;
    
    // Filtrar por tab
    if (activeTab === 'activas') {
      return matchesSearch && matchesTipo && ['publicada', 'en_evaluacion'].includes(l.estado);
    } else if (activeTab === 'finalizadas') {
      return matchesSearch && matchesTipo && ['adjudicada', 'desierta', 'cancelada'].includes(l.estado);
    } else if (activeTab === 'borradores') {
      return matchesSearch && matchesTipo && l.estado === 'borrador';
    }
    
    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Estadísticas
  const stats = {
    total: licitaciones.length,
    publicadas: licitaciones.filter((l) => l.estado === 'publicada').length,
    enEvaluacion: licitaciones.filter((l) => l.estado === 'en_evaluacion').length,
    adjudicadas: licitaciones.filter((l) => l.estado === 'adjudicada').length,
    totalOfertas: licitaciones.reduce((sum, l) => sum + l.ofertas.length, 0),
    presupuestoTotal: licitaciones
      .filter((l) => ['publicada', 'en_evaluacion'].includes(l.estado))
      .reduce((sum, l) => sum + l.presupuestoBase, 0),
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
              <Gavel className="h-8 w-8 text-indigo-600" />
              Gestión de Licitaciones
            </h1>
            <p className="text-gray-600 mt-1">
              Crea y gestiona procesos de licitación para obras y servicios
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadLicitaciones}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Licitación
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Licitación</DialogTitle>
                  <DialogDescription>
                    Define los términos del proceso de licitación
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Título de la Licitación *</Label>
                    <Input
                      value={newLicitacion.titulo}
                      onChange={(e) => setNewLicitacion({ ...newLicitacion, titulo: e.target.value })}
                      placeholder="Ej: Reforma integral edificio C/ Mayor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea
                      value={newLicitacion.descripcion}
                      onChange={(e) => setNewLicitacion({ ...newLicitacion, descripcion: e.target.value })}
                      placeholder="Descripción detallada del alcance de la licitación..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo *</Label>
                      <Select
                        value={newLicitacion.tipo}
                        onValueChange={(value: any) => setNewLicitacion({ ...newLicitacion, tipo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="obra">Obra</SelectItem>
                          <SelectItem value="servicio">Servicio</SelectItem>
                          <SelectItem value="suministro">Suministro</SelectItem>
                          <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Presupuesto Base (€) *</Label>
                      <Input
                        type="number"
                        value={newLicitacion.presupuestoBase}
                        onChange={(e) =>
                          setNewLicitacion({ ...newLicitacion, presupuestoBase: parseFloat(e.target.value) })
                        }
                        placeholder="50000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha Límite Ofertas *</Label>
                      <Input
                        type="date"
                        value={newLicitacion.fechaLimiteOfertas}
                        onChange={(e) =>
                          setNewLicitacion({ ...newLicitacion, fechaLimiteOfertas: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Propiedad (opcional)</Label>
                      <Input
                        value={newLicitacion.propiedadDireccion}
                        onChange={(e) =>
                          setNewLicitacion({ ...newLicitacion, propiedadDireccion: e.target.value })
                        }
                        placeholder="Dirección de la propiedad"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Requisitos (uno por línea)</Label>
                    <Textarea
                      value={newLicitacion.requisitos}
                      onChange={(e) => setNewLicitacion({ ...newLicitacion, requisitos: e.target.value })}
                      placeholder="Experiencia mínima 5 años&#10;Certificación ISO 9001&#10;Seguro RC mínimo 500.000€"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateLicitacion}>Crear Licitación</Button>
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
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Gavel className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Licitaciones</div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Send className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Publicadas</div>
                  <div className="text-2xl font-bold text-blue-600">{stats.publicadas}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Adjudicadas</div>
                  <div className="text-2xl font-bold text-green-600">{stats.adjudicadas}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Ofertas Recibidas</div>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalOfertas}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs y Filtros */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="activas">
                Activas ({licitaciones.filter(l => ['publicada', 'en_evaluacion'].includes(l.estado)).length})
              </TabsTrigger>
              <TabsTrigger value="finalizadas">
                Finalizadas ({licitaciones.filter(l => ['adjudicada', 'desierta', 'cancelada'].includes(l.estado)).length})
              </TabsTrigger>
              <TabsTrigger value="borradores">
                Borradores ({licitaciones.filter(l => l.estado === 'borrador').length})
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="obra">Obra</SelectItem>
                  <SelectItem value="servicio">Servicio</SelectItem>
                  <SelectItem value="suministro">Suministro</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lista de Licitaciones */}
          <TabsContent value={activeTab} className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredLicitaciones.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay licitaciones
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'borradores'
                      ? 'No tienes borradores de licitaciones'
                      : activeTab === 'finalizadas'
                      ? 'No hay licitaciones finalizadas'
                      : 'Comienza creando tu primera licitación'}
                  </p>
                  {activeTab !== 'finalizadas' && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Licitación
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredLicitaciones.map((licitacion) => {
                  const diasRestantes = differenceInDays(
                    new Date(licitacion.fechaLimiteOfertas),
                    new Date()
                  );
                  const vencida = isBefore(new Date(licitacion.fechaLimiteOfertas), new Date());

                  return (
                    <Card
                      key={licitacion.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getTipoBadge(licitacion.tipo)}
                              {getEstadoBadge(licitacion.estado)}
                            </div>
                            <h3 className="text-lg font-semibold mb-1">{licitacion.titulo}</h3>
                            {licitacion.propiedadDireccion && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {licitacion.propiedadDireccion}
                              </p>
                            )}
                            {licitacion.descripcion && (
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {licitacion.descripcion}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col md:items-end gap-3">
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Presupuesto Base</p>
                              <p className="text-xl font-bold text-indigo-600">
                                {licitacion.presupuestoBase.toLocaleString('es-ES')}€
                              </p>
                            </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{licitacion.ofertas.length} ofertas</span>
                              </div>
                              <div
                                className={`flex items-center gap-1 ${
                                  vencida && licitacion.estado === 'publicada'
                                    ? 'text-red-600'
                                    : diasRestantes <= 7
                                    ? 'text-yellow-600'
                                    : 'text-gray-600'
                                }`}
                              >
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {vencida
                                    ? 'Cerrada'
                                    : `${diasRestantes} días restantes`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="text-sm text-gray-500">
                            Límite: {format(new Date(licitacion.fechaLimiteOfertas), "d 'de' MMMM, yyyy", { locale: es })}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver detalles
                            </Button>
                            {licitacion.estado === 'borrador' && (
                              <Button size="sm">
                                <Send className="h-4 w-4 mr-1" />
                                Publicar
                              </Button>
                            )}
                            {licitacion.estado === 'publicada' && licitacion.ofertas.length > 0 && (
                              <Button size="sm">
                                <BarChart3 className="h-4 w-4 mr-1" />
                                Evaluar
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
