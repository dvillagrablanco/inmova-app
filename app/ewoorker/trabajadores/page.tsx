'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  ChevronRight,
  HardHat,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface Trabajador {
  id: string;
  nombre: string;
  apellidos?: string;
  especialidad: string;
  especialidadesSecundarias: string[];
  experienciaAnios?: number;
  descripcion?: string;
  tarifaHora?: number;
  tarifaDia?: number;
  disponible: boolean;
  disponibleDesde?: string;
  disponibleHasta?: string;
  rating: number;
  totalReviews: number;
  trabajosCompletados: number;
  tienePRL: boolean;
  tieneReconocimientoMedico: boolean;
  verificado: boolean;
  activo: boolean;
}

const ESPECIALIDADES = [
  'Electricidad',
  'Fontanería',
  'Soldadura',
  'Albañilería',
  'Pintura',
  'Carpintería',
  'Climatización',
  'Estructura',
  'Impermeabilización',
  'Yesería',
  'Cerrajería',
  'Cristalería',
  'Otros',
];

export default function TrabajadoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEspecialidad, setFilterEspecialidad] = useState('todas');
  const [filterDisponible, setFilterDisponible] = useState('todos');

  // Modal de nuevo trabajador
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTrabajador, setNewTrabajador] = useState({
    nombre: '',
    apellidos: '',
    especialidad: '',
    experienciaAnios: 0,
    descripcion: '',
    tarifaHora: 0,
    tarifaDia: 0,
    tienePRL: false,
    tieneReconocimientoMedico: false,
    disponible: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchTrabajadores();
    }
  }, [session]);

  const fetchTrabajadores = async () => {
    try {
      const res = await fetch('/api/ewoorker/trabajadores?modo=mis-trabajadores');
      if (res.ok) {
        const data = await res.json();
        setTrabajadores(data.trabajadores);
      }
    } catch (error) {
      console.error('Error fetching trabajadores:', error);
      toast.error('Error al cargar trabajadores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrabajador = async () => {
    if (!newTrabajador.nombre || !newTrabajador.especialidad) {
      toast.error('Nombre y especialidad son requeridos');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/ewoorker/trabajadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrabajador),
      });

      if (res.ok) {
        const data = await res.json();
        setTrabajadores([data.trabajador, ...trabajadores]);
        setShowNewModal(false);
        setNewTrabajador({
          nombre: '',
          apellidos: '',
          especialidad: '',
          experienciaAnios: 0,
          descripcion: '',
          tarifaHora: 0,
          tarifaDia: 0,
          tienePRL: false,
          tieneReconocimientoMedico: false,
          disponible: true,
        });
        toast.success('Trabajador creado correctamente');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al crear trabajador');
      }
    } catch (error) {
      console.error('Error creating trabajador:', error);
      toast.error('Error al crear trabajador');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDisponibilidad = async (trabajador: Trabajador) => {
    try {
      const res = await fetch(`/api/ewoorker/trabajadores/${trabajador.id}/disponibilidad`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disponible: !trabajador.disponible }),
      });

      if (res.ok) {
        setTrabajadores(
          trabajadores.map((t) =>
            t.id === trabajador.id ? { ...t, disponible: !t.disponible } : t
          )
        );
        toast.success(
          !trabajador.disponible
            ? 'Trabajador ahora disponible para subcontratación'
            : 'Trabajador ya no está disponible'
        );
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al cambiar disponibilidad');
      }
    } catch (error) {
      console.error('Error toggling disponibilidad:', error);
      toast.error('Error al cambiar disponibilidad');
    }
  };

  const handleDeleteTrabajador = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este trabajador?')) return;

    try {
      const res = await fetch(`/api/ewoorker/trabajadores/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTrabajadores(trabajadores.filter((t) => t.id !== id));
        toast.success('Trabajador eliminado');
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al eliminar trabajador');
      }
    } catch (error) {
      console.error('Error deleting trabajador:', error);
      toast.error('Error al eliminar trabajador');
    }
  };

  // Filtrar trabajadores
  const trabajadoresFiltrados = trabajadores.filter((t) => {
    const matchSearch =
      t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.especialidad.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEspecialidad =
      filterEspecialidad === 'todas' || t.especialidad === filterEspecialidad;
    const matchDisponible =
      filterDisponible === 'todos' ||
      (filterDisponible === 'disponibles' && t.disponible) ||
      (filterDisponible === 'no-disponibles' && !t.disponible);

    return matchSearch && matchEspecialidad && matchDisponible;
  });

  const disponiblesCount = trabajadores.filter((t) => t.disponible).length;
  const noDisponiblesCount = trabajadores.filter((t) => !t.disponible).length;

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8" />
                Mis Trabajadores
              </h1>
              <p className="mt-2 text-orange-100">
                Gestiona y ofrece tus trabajadores para subcontratación
              </p>
            </div>
            <Button
              onClick={() => setShowNewModal(true)}
              className="bg-white text-orange-600 hover:bg-orange-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              Añadir Trabajador
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Trabajadores</p>
                  <p className="text-2xl font-bold">{trabajadores.length}</p>
                </div>
                <Users className="h-10 w-10 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-700">{disponiblesCount}</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">No Disponibles</p>
                  <p className="text-2xl font-bold">{noDisponiblesCount}</p>
                </div>
                <Briefcase className="h-10 w-10 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o especialidad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterEspecialidad} onValueChange={setFilterEspecialidad}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las especialidades</SelectItem>
              {ESPECIALIDADES.map((esp) => (
                <SelectItem key={esp} value={esp}>
                  {esp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDisponible} onValueChange={setFilterDisponible}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="disponibles">Disponibles</SelectItem>
              <SelectItem value="no-disponibles">No disponibles</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de Trabajadores */}
        {trabajadoresFiltrados.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay trabajadores</h3>
              <p className="text-gray-500 mb-4">
                Añade trabajadores para poder ofrecerlos en subcontratación
              </p>
              <Button onClick={() => setShowNewModal(true)}>
                <Plus className="h-5 w-5 mr-2" />
                Añadir Trabajador
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trabajadoresFiltrados.map((trabajador) => (
              <Card
                key={trabajador.id}
                className={`hover:shadow-lg transition-shadow ${
                  trabajador.disponible ? 'border-green-200' : 'border-gray-200'
                }`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          trabajador.disponible ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        {trabajador.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {trabajador.nombre} {trabajador.apellidos}
                        </h3>
                        <p className="text-sm text-gray-600">{trabajador.especialidad}</p>
                      </div>
                    </div>
                    <Badge
                      variant={trabajador.disponible ? 'default' : 'secondary'}
                      className={
                        trabajador.disponible
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }
                    >
                      {trabajador.disponible ? 'Disponible' : 'No disponible'}
                    </Badge>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 mb-4 text-sm">
                    {trabajador.experienciaAnios && (
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {trabajador.experienciaAnios} años de experiencia
                      </div>
                    )}
                    {trabajador.tarifaHora && (
                      <div className="flex items-center text-gray-600">
                        €{trabajador.tarifaHora}/hora
                        {trabajador.tarifaDia && ` · €${trabajador.tarifaDia}/día`}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {trabajador.tienePRL && (
                        <Badge variant="outline" className="text-xs">
                          PRL
                        </Badge>
                      )}
                      {trabajador.tieneReconocimientoMedico && (
                        <Badge variant="outline" className="text-xs">
                          Médico
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{trabajador.rating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm">
                      ({trabajador.totalReviews} reviews)
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-gray-500 text-sm">
                      {trabajador.trabajosCompletados} trabajos
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Ofrecer:</span>
                      <Switch
                        checked={trabajador.disponible}
                        onCheckedChange={() => handleToggleDisponibilidad(trabajador)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/ewoorker/trabajadores/${trabajador.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteTrabajador(trabajador.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tip Card */}
        <Card className="mt-8 bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <HardHat className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 mb-1">
                  ¿Tienes baja carga de trabajo?
                </h3>
                <p className="text-sm text-orange-700 mb-2">
                  Activa la disponibilidad de tus trabajadores para que otras empresas puedan
                  subcontratarlos. Reduce tus costes fijos y evita despidos.
                </p>
                <p className="text-xs text-orange-600">
                  Los trabajadores disponibles aparecerán en el marketplace de eWoorker.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Nuevo Trabajador */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nuevo Trabajador
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={newTrabajador.nombre}
                  onChange={(e) => setNewTrabajador({ ...newTrabajador, nombre: e.target.value })}
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={newTrabajador.apellidos}
                  onChange={(e) =>
                    setNewTrabajador({ ...newTrabajador, apellidos: e.target.value })
                  }
                  placeholder="García López"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="especialidad">Especialidad *</Label>
              <Select
                value={newTrabajador.especialidad}
                onValueChange={(v) => setNewTrabajador({ ...newTrabajador, especialidad: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona especialidad" />
                </SelectTrigger>
                <SelectContent>
                  {ESPECIALIDADES.map((esp) => (
                    <SelectItem key={esp} value={esp}>
                      {esp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experiencia">Años de experiencia</Label>
                <Input
                  id="experiencia"
                  type="number"
                  min="0"
                  value={newTrabajador.experienciaAnios}
                  onChange={(e) =>
                    setNewTrabajador({
                      ...newTrabajador,
                      experienciaAnios: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="tarifaHora">Tarifa/hora (€)</Label>
                <Input
                  id="tarifaHora"
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTrabajador.tarifaHora}
                  onChange={(e) =>
                    setNewTrabajador({
                      ...newTrabajador,
                      tarifaHora: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={newTrabajador.descripcion}
                onChange={(e) =>
                  setNewTrabajador({ ...newTrabajador, descripcion: e.target.value })
                }
                placeholder="Breve descripción del trabajador y sus habilidades..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="prl"
                  checked={newTrabajador.tienePRL}
                  onCheckedChange={(v) => setNewTrabajador({ ...newTrabajador, tienePRL: v })}
                />
                <Label htmlFor="prl">Tiene PRL</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="medico"
                  checked={newTrabajador.tieneReconocimientoMedico}
                  onCheckedChange={(v) =>
                    setNewTrabajador({ ...newTrabajador, tieneReconocimientoMedico: v })
                  }
                />
                <Label htmlFor="medico">Reconocimiento médico</Label>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <Switch
                id="disponible"
                checked={newTrabajador.disponible}
                onCheckedChange={(v) => setNewTrabajador({ ...newTrabajador, disponible: v })}
              />
              <Label htmlFor="disponible" className="text-green-700">
                Disponible para subcontratación
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTrabajador} disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Trabajador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
