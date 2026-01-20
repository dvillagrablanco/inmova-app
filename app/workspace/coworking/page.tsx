'use client';

/**
 * Workspace - Coworking
 * 
 * Gestión de espacios de coworking (conectado a API real)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Laptop,
  Search,
  Plus,
  Users,
  Euro,
  Monitor,
  Wifi,
  Coffee,
  Printer,
  Phone,
  Calendar,
  Edit,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Espacio {
  id: string;
  nombre: string;
  tipo: 'hot_desk' | 'dedicated_desk' | 'oficina_privada' | 'sala_reuniones';
  capacidad: number;
  ocupacion: number;
  precio: number;
  periodicidad: 'hora' | 'dia' | 'mes';
  estado: 'disponible' | 'ocupado' | 'reservado' | 'mantenimiento';
  amenities: string[];
  descripcion: string;
}

const ESPACIOS_MOCK: Espacio[] = [
  {
    id: '1',
    nombre: 'Hot Desk Zona A',
    tipo: 'hot_desk',
    capacidad: 20,
    ocupacion: 16,
    precio: 15,
    periodicidad: 'dia',
    estado: 'disponible',
    amenities: ['WiFi', 'Toma corriente', 'Taquilla'],
    descripcion: 'Zona abierta con escritorios compartidos. Ideal para freelancers.',
  },
  {
    id: '2',
    nombre: 'Hot Desk Zona B',
    tipo: 'hot_desk',
    capacidad: 15,
    ocupacion: 15,
    precio: 15,
    periodicidad: 'dia',
    estado: 'ocupado',
    amenities: ['WiFi', 'Toma corriente', 'Taquilla'],
    descripcion: 'Zona abierta con escritorios compartidos. Vista al jardín.',
  },
  {
    id: '3',
    nombre: 'Dedicated Desk #1-5',
    tipo: 'dedicated_desk',
    capacidad: 5,
    ocupacion: 4,
    precio: 250,
    periodicidad: 'mes',
    estado: 'disponible',
    amenities: ['WiFi', 'Escritorio asignado', 'Almacenamiento', 'Acceso 24/7'],
    descripcion: 'Escritorios dedicados con almacenamiento personal.',
  },
  {
    id: '4',
    nombre: 'Oficina Privada A',
    tipo: 'oficina_privada',
    capacidad: 4,
    ocupacion: 4,
    precio: 800,
    periodicidad: 'mes',
    estado: 'ocupado',
    amenities: ['WiFi', 'Privacidad', 'Pizarra', 'Aire acondicionado', 'Acceso 24/7'],
    descripcion: 'Oficina privada para equipos pequeños. Totalmente equipada.',
  },
  {
    id: '5',
    nombre: 'Oficina Privada B',
    tipo: 'oficina_privada',
    capacidad: 6,
    ocupacion: 0,
    precio: 1200,
    periodicidad: 'mes',
    estado: 'disponible',
    amenities: ['WiFi', 'Privacidad', 'Pizarra', 'Aire acondicionado', 'Acceso 24/7', 'TV'],
    descripcion: 'Oficina privada amplia con sala de reuniones integrada.',
  },
  {
    id: '6',
    nombre: 'Sala de Reuniones Principal',
    tipo: 'sala_reuniones',
    capacidad: 12,
    ocupacion: 0,
    precio: 30,
    periodicidad: 'hora',
    estado: 'disponible',
    amenities: ['WiFi', 'Proyector', 'Pizarra', 'Videoconferencia', 'Café'],
    descripcion: 'Sala equipada para reuniones y presentaciones.',
  },
  {
    id: '7',
    nombre: 'Sala de Reuniones Pequeña',
    tipo: 'sala_reuniones',
    capacidad: 6,
    ocupacion: 0,
    precio: 20,
    periodicidad: 'hora',
    estado: 'reservado',
    amenities: ['WiFi', 'TV', 'Pizarra', 'Videoconferencia'],
    descripcion: 'Sala íntima para reuniones pequeñas.',
  },
];

export default function WorkspaceCoworkingPage() {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');

  // Cargar espacios desde API
  const fetchEspacios = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workspace/spaces');
      if (response.ok) {
        const data = await response.json();
        setEspacios(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEspacios();
  }, []);
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'hot_desk' as Espacio['tipo'],
    capacidad: 10,
    precio: 15,
    periodicidad: 'dia' as Espacio['periodicidad'],
    descripcion: '',
  });

  const filteredEspacios = espacios.filter((e) => {
    const matchSearch =
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTipo = filterTipo === 'all' || e.tipo === filterTipo;
    const matchEstado = filterEstado === 'all' || e.estado === filterEstado;
    return matchSearch && matchTipo && matchEstado;
  });

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'hot_desk':
        return <Badge variant="outline">Hot Desk</Badge>;
      case 'dedicated_desk':
        return <Badge className="bg-blue-100 text-blue-700">Dedicated</Badge>;
      case 'oficina_privada':
        return <Badge className="bg-purple-100 text-purple-700">Privada</Badge>;
      case 'sala_reuniones':
        return <Badge className="bg-green-100 text-green-700">Sala</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge className="bg-green-100 text-green-700">Disponible</Badge>;
      case 'ocupado':
        return <Badge className="bg-red-100 text-red-700">Ocupado</Badge>;
      case 'reservado':
        return <Badge className="bg-yellow-100 text-yellow-700">Reservado</Badge>;
      case 'mantenimiento':
        return <Badge variant="secondary">Mantenimiento</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const formatPrecio = (precio: number, periodicidad: string) => {
    return `€${precio}/${periodicidad === 'hora' ? 'h' : periodicidad === 'dia' ? 'día' : 'mes'}`;
  };

  const handleCrearEspacio = () => {
    if (!formData.nombre) {
      toast.error('El nombre es obligatorio');
      return;
    }

    const nuevoEspacio: Espacio = {
      id: Date.now().toString(),
      ...formData,
      ocupacion: 0,
      estado: 'disponible',
      amenities: ['WiFi'],
    };

    setEspacios([...espacios, nuevoEspacio]);
    setIsDialogOpen(false);
    setFormData({
      nombre: '',
      tipo: 'hot_desk',
      capacidad: 10,
      precio: 15,
      periodicidad: 'dia',
      descripcion: '',
    });
    toast.success('Espacio creado correctamente');
  };

  const handleCambiarEstado = (id: string, estado: Espacio['estado']) => {
    setEspacios(espacios.map((e) => (e.id === id ? { ...e, estado } : e)));
    toast.success('Estado actualizado');
  };

  // Stats
  const totalCapacidad = espacios.reduce((acc, e) => acc + e.capacidad, 0);
  const totalOcupacion = espacios.reduce((acc, e) => acc + e.ocupacion, 0);
  const ingresosMensuales = espacios.reduce((acc, e) => {
    if (e.periodicidad === 'mes' && e.ocupacion > 0) {
      return acc + e.precio * e.ocupacion;
    }
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Laptop className="h-6 w-6" />
            Espacios de Coworking
          </h1>
          <p className="text-muted-foreground">
            Gestión de espacios y recursos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/workspace/booking">
              <Calendar className="h-4 w-4 mr-2" />
              Reservas
            </Link>
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Espacio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Espacio</DialogTitle>
                <DialogDescription>
                  Define las características del espacio de trabajo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del espacio"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) =>
                        setFormData({ ...formData, tipo: value as Espacio['tipo'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot_desk">Hot Desk</SelectItem>
                        <SelectItem value="dedicated_desk">Dedicated Desk</SelectItem>
                        <SelectItem value="oficina_privada">Oficina Privada</SelectItem>
                        <SelectItem value="sala_reuniones">Sala de Reuniones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Capacidad</Label>
                    <Input
                      type="number"
                      value={formData.capacidad}
                      onChange={(e) =>
                        setFormData({ ...formData, capacidad: parseInt(e.target.value) || 1 })
                      }
                      min={1}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Precio</Label>
                    <Input
                      type="number"
                      value={formData.precio}
                      onChange={(e) =>
                        setFormData({ ...formData, precio: parseInt(e.target.value) || 0 })
                      }
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Periodicidad</Label>
                    <Select
                      value={formData.periodicidad}
                      onValueChange={(value) =>
                        setFormData({ ...formData, periodicidad: value as Espacio['periodicidad'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hora">Por hora</SelectItem>
                        <SelectItem value="dia">Por día</SelectItem>
                        <SelectItem value="mes">Por mes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción del espacio..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCrearEspacio}>Crear Espacio</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold">
                  {Math.round((totalOcupacion / totalCapacidad) * 100)}%
                </p>
              </div>
              <Monitor className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Puestos</p>
                <p className="text-2xl font-bold">{totalOcupacion}/{totalCapacidad}</p>
              </div>
              <Users className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Espacios</p>
                <p className="text-2xl font-bold">{espacios.length}</p>
              </div>
              <Laptop className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos/mes</p>
                <p className="text-2xl font-bold text-green-600">
                  €{ingresosMensuales.toLocaleString()}
                </p>
              </div>
              <Euro className="h-8 w-8 text-emerald-500 opacity-80" />
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
                placeholder="Buscar espacios..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="hot_desk">Hot Desk</SelectItem>
                <SelectItem value="dedicated_desk">Dedicated Desk</SelectItem>
                <SelectItem value="oficina_privada">Oficina Privada</SelectItem>
                <SelectItem value="sala_reuniones">Sala de Reuniones</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="ocupado">Ocupado</SelectItem>
                <SelectItem value="reservado">Reservado</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Espacios Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredEspacios.map((espacio) => (
          <Card key={espacio.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{espacio.nombre}</CardTitle>
                  <CardDescription>{espacio.descripcion}</CardDescription>
                </div>
                {getEstadoBadge(espacio.estado)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  {getTipoBadge(espacio.tipo)}
                  <span className="font-semibold text-green-600">
                    {formatPrecio(espacio.precio, espacio.periodicidad)}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ocupación</span>
                    <span>
                      {espacio.ocupacion}/{espacio.capacidad} puestos
                    </span>
                  </div>
                  <Progress value={(espacio.ocupacion / espacio.capacidad) * 100} />
                </div>

                <div className="flex flex-wrap gap-1">
                  {espacio.amenities.slice(0, 4).map((amenity, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {espacio.amenities.length > 4 && (
                    <Badge variant="secondary" className="text-xs">
                      +{espacio.amenities.length - 4}
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedEspacio(espacio)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{espacio.nombre}</DialogTitle>
                        <DialogDescription>{espacio.descripcion}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="flex gap-2">
                          {getTipoBadge(espacio.tipo)}
                          {getEstadoBadge(espacio.estado)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Capacidad</p>
                            <p className="font-medium">{espacio.capacidad} puestos</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ocupación actual</p>
                            <p className="font-medium">{espacio.ocupacion} personas</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Precio</p>
                            <p className="font-medium text-green-600">
                              {formatPrecio(espacio.precio, espacio.periodicidad)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Disponibilidad</p>
                            <p className="font-medium">
                              {espacio.capacidad - espacio.ocupacion} libres
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-sm mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-1">
                            {espacio.amenities.map((a, i) => (
                              <Badge key={i} variant="secondary">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Cambiar estado</Label>
                          <Select
                            value={espacio.estado}
                            onValueChange={(value) =>
                              handleCambiarEstado(espacio.id, value as Espacio['estado'])
                            }
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="disponible">Disponible</SelectItem>
                              <SelectItem value="ocupado">Ocupado</SelectItem>
                              <SelectItem value="reservado">Reservado</SelectItem>
                              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Button className="flex-1" asChild>
                            <Link href="/workspace/booking">
                              <Calendar className="h-4 w-4 mr-2" />
                              Reservar
                            </Link>
                          </Button>
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    className="flex-1"
                    disabled={espacio.estado === 'ocupado' || espacio.estado === 'mantenimiento'}
                    asChild
                  >
                    <Link href="/workspace/booking">Reservar</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEspacios.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se encontraron espacios con los filtros aplicados
          </CardContent>
        </Card>
      )}
    </div>
  );
}
