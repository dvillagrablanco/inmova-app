'use client';

/**
 * Student Housing - Mantenimiento
 * 
 * Gestión de solicitudes de mantenimiento (conectado a API real)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Wrench,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Building,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

interface SolicitudMantenimiento {
  id: string;
  residente: string;
  habitacion: string;
  edificio: string;
  titulo: string;
  descripcion: string;
  categoria: 'fontaneria' | 'electricidad' | 'climatizacion' | 'mobiliario' | 'limpieza' | 'otro';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  estado: 'pendiente' | 'asignada' | 'en_proceso' | 'completada' | 'cancelada';
  fechaCreacion: string;
  fechaResolucion: string | null;
  asignadoA: string | null;
  comentarios: string[];
}

const CATEGORIAS = [
  { value: 'fontaneria', label: 'Fontanería', icon: '🚿' },
  { value: 'electricidad', label: 'Electricidad', icon: '⚡' },
  { value: 'climatizacion', label: 'Climatización', icon: '❄️' },
  { value: 'mobiliario', label: 'Mobiliario', icon: '🪑' },
  { value: 'limpieza', label: 'Limpieza', icon: '🧹' },
  { value: 'otro', label: 'Otro', icon: '🔧' },
];

const TECNICOS = [
  'Juan Pérez (Fontanero)',
  'Miguel Santos (Técnico HVAC)',
  'Elena García (Electricista)',
  'Servicios Generales',
];

export default function StudentHousingMantenimientoPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudMantenimiento[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar solicitudes desde API
  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student-housing/maintenance');
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all');
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudMantenimiento | null>(null);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'otro' as SolicitudMantenimiento['categoria'],
    prioridad: 'media' as SolicitudMantenimiento['prioridad'],
    habitacion: '',
  });

  const filteredSolicitudes = solicitudes.filter((s) => {
    const matchSearch =
      s.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.residente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.habitacion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === 'all' || s.estado === filterEstado;
    const matchPrioridad = filterPrioridad === 'all' || s.prioridad === filterPrioridad;
    return matchSearch && matchEstado && matchPrioridad;
  });

  const getPrioridadBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'urgente':
        return <Badge className="bg-red-100 text-red-700">Urgente</Badge>;
      case 'alta':
        return <Badge className="bg-orange-100 text-orange-700">Alta</Badge>;
      case 'media':
        return <Badge className="bg-yellow-100 text-yellow-700">Media</Badge>;
      case 'baja':
        return <Badge className="bg-blue-100 text-blue-700">Baja</Badge>;
      default:
        return <Badge variant="outline">{prioridad}</Badge>;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge variant="secondary">Pendiente</Badge>;
      case 'asignada':
        return <Badge className="bg-blue-100 text-blue-700">Asignada</Badge>;
      case 'en_proceso':
        return <Badge className="bg-purple-100 text-purple-700">En Proceso</Badge>;
      case 'completada':
        return <Badge className="bg-green-100 text-green-700">Completada</Badge>;
      case 'cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleAsignar = (id: string, tecnico: string) => {
    setSolicitudes(
      solicitudes.map((s) =>
        s.id === id ? { ...s, estado: 'asignada' as const, asignadoA: tecnico } : s
      )
    );
    toast.success(`Solicitud asignada a ${tecnico}`);
  };

  const handleCambiarEstado = (id: string, estado: SolicitudMantenimiento['estado']) => {
    setSolicitudes(
      solicitudes.map((s) =>
        s.id === id
          ? {
              ...s,
              estado,
              fechaResolucion:
                estado === 'completada' ? new Date().toISOString().split('T')[0] : s.fechaResolucion,
            }
          : s
      )
    );
    toast.success('Estado actualizado');
  };

  const handleAgregarComentario = (id: string) => {
    if (!nuevoComentario.trim()) return;
    setSolicitudes(
      solicitudes.map((s) =>
        s.id === id ? { ...s, comentarios: [...s.comentarios, nuevoComentario] } : s
      )
    );
    setNuevoComentario('');
    toast.success('Comentario agregado');
  };

  const handleCrearSolicitud = () => {
    if (!formData.titulo || !formData.descripcion || !formData.habitacion) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    const nuevaSolicitud: SolicitudMantenimiento = {
      id: Date.now().toString(),
      residente: 'Admin',
      habitacion: formData.habitacion,
      edificio: formData.habitacion.split('-')[0] === 'A' ? 'Edificio A' : 
                formData.habitacion.split('-')[0] === 'B' ? 'Edificio B' : 'Edificio C',
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      categoria: formData.categoria,
      prioridad: formData.prioridad,
      estado: 'pendiente',
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaResolucion: null,
      asignadoA: null,
      comentarios: [],
    };

    setSolicitudes([nuevaSolicitud, ...solicitudes]);
    setIsDialogOpen(false);
    setFormData({
      titulo: '',
      descripcion: '',
      categoria: 'otro',
      prioridad: 'media',
      habitacion: '',
    });
    toast.success('Solicitud creada correctamente');
  };

  const stats = {
    pendientes: solicitudes.filter((s) => s.estado === 'pendiente').length,
    enProceso: solicitudes.filter((s) => s.estado === 'asignada' || s.estado === 'en_proceso').length,
    urgentes: solicitudes.filter((s) => s.prioridad === 'urgente' && s.estado !== 'completada').length,
    completadas: solicitudes.filter((s) => s.estado === 'completada').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            Mantenimiento
          </h1>
          <p className="text-muted-foreground">
            Gestión de solicitudes de mantenimiento
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nueva Solicitud de Mantenimiento</DialogTitle>
              <DialogDescription>
                Reporta un problema o solicita una reparación
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Breve descripción del problema"
                />
              </div>
              <div>
                <Label>Habitación *</Label>
                <Input
                  value={formData.habitacion}
                  onChange={(e) => setFormData({ ...formData, habitacion: e.target.value })}
                  placeholder="Ej: A-201"
                />
              </div>
              <div>
                <Label>Descripción *</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe el problema en detalle..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria: value as SolicitudMantenimiento['categoria'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridad</Label>
                  <Select
                    value={formData.prioridad}
                    onValueChange={(value) =>
                      setFormData({ ...formData, prioridad: value as SolicitudMantenimiento['prioridad'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearSolicitud}>Crear Solicitud</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En Proceso</p>
                <p className="text-2xl font-bold text-blue-600">{stats.enProceso}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgentes}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="asignada">Asignada</SelectItem>
                <SelectItem value="en_proceso">En Proceso</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="baja">Baja</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Solicitudes List */}
      <div className="space-y-4">
        {filteredSolicitudes.map((solicitud) => (
          <Card key={solicitud.id}>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {CATEGORIAS.find((c) => c.value === solicitud.categoria)?.icon || '🔧'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{solicitud.titulo}</h3>
                        {getPrioridadBadge(solicitud.prioridad)}
                        {getEstadoBadge(solicitud.estado)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {solicitud.descripcion}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {solicitud.residente}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />
                          {solicitud.habitacion} - {solicitud.edificio}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {solicitud.fechaCreacion}
                        </span>
                        {solicitud.asignadoA && (
                          <span className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {solicitud.asignadoA}
                          </span>
                        )}
                      </div>
                      {solicitud.comentarios.length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <p className="flex items-center gap-1 text-muted-foreground mb-1">
                            <MessageSquare className="h-3 w-3" />
                            Último comentario:
                          </p>
                          <p>{solicitud.comentarios[solicitud.comentarios.length - 1]}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedSolicitud(solicitud)}>
                        Ver Detalles
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>{solicitud.titulo}</DialogTitle>
                        <DialogDescription>
                          {solicitud.habitacion} - {solicitud.edificio}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="flex gap-2">
                          {getPrioridadBadge(solicitud.prioridad)}
                          {getEstadoBadge(solicitud.estado)}
                        </div>
                        <p className="text-sm">{solicitud.descripcion}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Residente</p>
                            <p className="font-medium">{solicitud.residente}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Categoría</p>
                            <p className="font-medium capitalize">{solicitud.categoria}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha Creación</p>
                            <p className="font-medium">{solicitud.fechaCreacion}</p>
                          </div>
                          {solicitud.fechaResolucion && (
                            <div>
                              <p className="text-muted-foreground">Fecha Resolución</p>
                              <p className="font-medium">{solicitud.fechaResolucion}</p>
                            </div>
                          )}
                        </div>

                        {solicitud.estado !== 'completada' && (
                          <div className="space-y-2">
                            <Label>Asignar técnico</Label>
                            <Select
                              value={solicitud.asignadoA || ''}
                              onValueChange={(value) => handleAsignar(solicitud.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar técnico" />
                              </SelectTrigger>
                              <SelectContent>
                                {TECNICOS.map((tecnico) => (
                                  <SelectItem key={tecnico} value={tecnico}>
                                    {tecnico}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {solicitud.comentarios.length > 0 && (
                          <div>
                            <Label>Historial de comentarios</Label>
                            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                              {solicitud.comentarios.map((c, i) => (
                                <p key={i} className="text-sm p-2 bg-muted rounded">
                                  {c}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {solicitud.estado !== 'completada' && (
                          <div className="space-y-2">
                            <Label>Agregar comentario</Label>
                            <div className="flex gap-2">
                              <Input
                                value={nuevoComentario}
                                onChange={(e) => setNuevoComentario(e.target.value)}
                                placeholder="Escribir comentario..."
                              />
                              <Button onClick={() => handleAgregarComentario(solicitud.id)}>
                                Añadir
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {solicitud.estado === 'asignada' && (
                            <Button
                              className="flex-1"
                              onClick={() => handleCambiarEstado(solicitud.id, 'en_proceso')}
                            >
                              Iniciar Trabajo
                            </Button>
                          )}
                          {solicitud.estado === 'en_proceso' && (
                            <Button
                              className="flex-1"
                              onClick={() => handleCambiarEstado(solicitud.id, 'completada')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completar
                            </Button>
                          )}
                          {solicitud.estado !== 'completada' && solicitud.estado !== 'cancelada' && (
                            <Button
                              variant="destructive"
                              onClick={() => handleCambiarEstado(solicitud.id, 'cancelada')}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {solicitud.estado === 'pendiente' && (
                    <Select onValueChange={(value) => handleAsignar(solicitud.id, value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        {TECNICOS.map((tecnico) => (
                          <SelectItem key={tecnico} value={tecnico}>
                            {tecnico}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSolicitudes.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se encontraron solicitudes de mantenimiento
          </CardContent>
        </Card>
      )}
    </div>
  );
}
