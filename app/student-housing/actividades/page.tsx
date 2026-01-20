'use client';

/**
 * Student Housing - Actividades
 * 
 * Gestión de eventos y actividades para residentes (conectado a API real)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
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
  PartyPopper,
  Calendar,
  Users,
  Plus,
  Clock,
  MapPin,
  Edit,
  Trash,
  Eye,
  CalendarDays,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface Actividad {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  categoria: 'social' | 'academico' | 'deportivo' | 'cultural' | 'otro';
  capacidad: number;
  inscritos: number;
  estado: 'proxima' | 'en_curso' | 'completada' | 'cancelada';
  organizador: string;
}

const CATEGORIAS = [
  { value: 'social', label: 'Social', color: 'bg-pink-100 text-pink-700' },
  { value: 'academico', label: 'Académico', color: 'bg-blue-100 text-blue-700' },
  { value: 'deportivo', label: 'Deportivo', color: 'bg-green-100 text-green-700' },
  { value: 'cultural', label: 'Cultural', color: 'bg-purple-100 text-purple-700' },
  { value: 'otro', label: 'Otro', color: 'bg-gray-100 text-gray-700' },
];

export default function StudentHousingActividadesPage() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar actividades desde API
  const fetchActividades = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student-housing/activities');
      if (response.ok) {
        const data = await response.json();
        setActividades(data.data || []);
      } else {
        toast.error('Error al cargar actividades');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActividades();
  }, []);
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    fecha: '',
    hora: '',
    ubicacion: '',
    categoria: 'social' as Actividad['categoria'],
    capacidad: 30,
  });

  const filteredActividades = actividades.filter((a) => {
    const matchCategoria = filterCategoria === 'all' || a.categoria === filterCategoria;
    const matchEstado = filterEstado === 'all' || a.estado === filterEstado;
    return matchCategoria && matchEstado;
  });

  const getCategoriaStyle = (categoria: string) => {
    const cat = CATEGORIAS.find((c) => c.value === categoria);
    return cat?.color || 'bg-gray-100 text-gray-700';
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'proxima':
        return <Badge className="bg-blue-100 text-blue-700">Próxima</Badge>;
      case 'en_curso':
        return <Badge className="bg-green-100 text-green-700">En curso</Badge>;
      case 'completada':
        return <Badge variant="secondary">Completada</Badge>;
      case 'cancelada':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const handleInscribir = (id: string) => {
    setActividades(
      actividades.map((a) =>
        a.id === id && a.inscritos < a.capacidad
          ? { ...a, inscritos: a.inscritos + 1 }
          : a
      )
    );
    toast.success('Inscripción realizada correctamente');
  };

  const handleCrearActividad = () => {
    if (!formData.titulo || !formData.fecha || !formData.hora) {
      toast.error('Por favor completa los campos obligatorios');
      return;
    }

    const nuevaActividad: Actividad = {
      id: Date.now().toString(),
      ...formData,
      inscritos: 0,
      estado: 'proxima',
      organizador: 'Administración',
    };

    setActividades([nuevaActividad, ...actividades]);
    setIsDialogOpen(false);
    setFormData({
      titulo: '',
      descripcion: '',
      fecha: '',
      hora: '',
      ubicacion: '',
      categoria: 'social',
      capacidad: 30,
    });
    toast.success('Actividad creada correctamente');
  };

  const handleCancelar = (id: string) => {
    setActividades(
      actividades.map((a) =>
        a.id === id ? { ...a, estado: 'cancelada' as const } : a
      )
    );
    toast.info('Actividad cancelada');
  };

  const stats = {
    proximas: actividades.filter((a) => a.estado === 'proxima').length,
    completadas: actividades.filter((a) => a.estado === 'completada').length,
    totalInscritos: actividades
      .filter((a) => a.estado === 'proxima')
      .reduce((acc, a) => acc + a.inscritos, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PartyPopper className="h-6 w-6" />
            Actividades
          </h1>
          <p className="text-muted-foreground">
            Eventos y actividades para residentes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Actividad</DialogTitle>
              <DialogDescription>
                Define los detalles del evento o actividad
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  placeholder="Nombre de la actividad"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    setFormData({ ...formData, descripcion: e.target.value })
                  }
                  placeholder="Descripción detallada..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Hora *</Label>
                  <Input
                    type="time"
                    value={formData.hora}
                    onChange={(e) =>
                      setFormData({ ...formData, hora: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Ubicación</Label>
                <Input
                  value={formData.ubicacion}
                  onChange={(e) =>
                    setFormData({ ...formData, ubicacion: e.target.value })
                  }
                  placeholder="Lugar del evento"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria: value as Actividad['categoria'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    value={formData.capacidad}
                    onChange={(e) =>
                      setFormData({ ...formData, capacidad: parseInt(e.target.value) || 30 })
                    }
                    min={1}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCrearActividad}>Crear Actividad</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Próximas</p>
                <p className="text-2xl font-bold text-blue-600">{stats.proximas}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inscritos Total</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalInscritos}</p>
              </div>
              <Users className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold">{stats.completadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-gray-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="proxima">Próximas</SelectItem>
                <SelectItem value="en_curso">En curso</SelectItem>
                <SelectItem value="completada">Completadas</SelectItem>
                <SelectItem value="cancelada">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actividades Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredActividades.map((actividad) => (
          <Card key={actividad.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <CardTitle className="text-lg">{actividad.titulo}</CardTitle>
                  <CardDescription className="mt-1">
                    Organiza: {actividad.organizador}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {getEstadoBadge(actividad.estado)}
                  <Badge className={getCategoriaStyle(actividad.categoria)}>
                    {CATEGORIAS.find((c) => c.value === actividad.categoria)?.label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {actividad.descripcion}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {actividad.fecha} a las {actividad.hora}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{actividad.ubicacion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className={actividad.inscritos >= actividad.capacidad ? 'text-red-600' : ''}>
                    {actividad.inscritos}/{actividad.capacidad} inscritos
                    {actividad.inscritos >= actividad.capacidad && ' (Completo)'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {actividad.estado === 'proxima' && (
                  <>
                    <Button
                      className="flex-1"
                      disabled={actividad.inscritos >= actividad.capacidad}
                      onClick={() => handleInscribir(actividad.id)}
                    >
                      {actividad.inscritos >= actividad.capacidad
                        ? 'Completo'
                        : 'Inscribir Residente'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleCancelar(actividad.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {actividad.estado !== 'proxima' && (
                  <Button variant="outline" className="flex-1" disabled>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredActividades.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se encontraron actividades
          </CardContent>
        </Card>
      )}
    </div>
  );
}
