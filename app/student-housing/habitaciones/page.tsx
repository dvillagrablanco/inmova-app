'use client';

/**
 * Student Housing - Habitaciones
 * 
 * Gestión de habitaciones y camas
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from '@/components/ui/dialog';
import {
  Bed,
  Search,
  Building,
  Users,
  Euro,
  CheckCircle,
  XCircle,
  Wrench,
  Eye,
  Edit,
  Home,
} from 'lucide-react';
import { toast } from 'sonner';

interface Habitacion {
  id: string;
  numero: string;
  edificio: string;
  planta: number;
  tipo: 'individual' | 'doble' | 'triple';
  camas: number;
  ocupadas: number;
  precio: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';
  amenities: string[];
  residentes: string[];
}

const HABITACIONES_MOCK: Habitacion[] = [
  {
    id: '1',
    numero: 'A-101',
    edificio: 'Edificio A',
    planta: 1,
    tipo: 'individual',
    camas: 1,
    ocupadas: 1,
    precio: 450,
    estado: 'ocupada',
    amenities: ['Baño privado', 'WiFi', 'Escritorio'],
    residentes: ['María García'],
  },
  {
    id: '2',
    numero: 'A-102',
    edificio: 'Edificio A',
    planta: 1,
    tipo: 'doble',
    camas: 2,
    ocupadas: 1,
    precio: 350,
    estado: 'disponible',
    amenities: ['Baño compartido', 'WiFi', 'Escritorio'],
    residentes: ['Carlos Martínez'],
  },
  {
    id: '3',
    numero: 'B-201',
    edificio: 'Edificio B',
    planta: 2,
    tipo: 'individual',
    camas: 1,
    ocupadas: 0,
    precio: 420,
    estado: 'disponible',
    amenities: ['Baño privado', 'WiFi', 'Escritorio', 'Balcón'],
    residentes: [],
  },
  {
    id: '4',
    numero: 'B-202',
    edificio: 'Edificio B',
    planta: 2,
    tipo: 'triple',
    camas: 3,
    ocupadas: 3,
    precio: 300,
    estado: 'ocupada',
    amenities: ['Baño compartido', 'WiFi', 'Escritorio'],
    residentes: ['Ana López', 'David Ruiz', 'Laura Pérez'],
  },
  {
    id: '5',
    numero: 'C-301',
    edificio: 'Edificio C',
    planta: 3,
    tipo: 'doble',
    camas: 2,
    ocupadas: 0,
    precio: 380,
    estado: 'mantenimiento',
    amenities: ['Baño privado', 'WiFi', 'Escritorio'],
    residentes: [],
  },
  {
    id: '6',
    numero: 'A-201',
    edificio: 'Edificio A',
    planta: 2,
    tipo: 'individual',
    camas: 1,
    ocupadas: 0,
    precio: 450,
    estado: 'reservada',
    amenities: ['Baño privado', 'WiFi', 'Escritorio', 'Vista al jardín'],
    residentes: [],
  },
];

const EDIFICIOS_STATS = [
  { nombre: 'Edificio A', total: 80, ocupadas: 72 },
  { nombre: 'Edificio B', total: 96, ocupadas: 85 },
  { nombre: 'Edificio C', total: 80, ocupadas: 77 },
];

export default function StudentHousingHabitacionesPage() {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>(HABITACIONES_MOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEdificio, setFilterEdificio] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [selectedHabitacion, setSelectedHabitacion] = useState<Habitacion | null>(null);

  const filteredHabitaciones = habitaciones.filter((h) => {
    const matchSearch = h.numero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchEdificio = filterEdificio === 'all' || h.edificio === filterEdificio;
    const matchEstado = filterEstado === 'all' || h.estado === filterEstado;
    const matchTipo = filterTipo === 'all' || h.tipo === filterTipo;

    return matchSearch && matchEdificio && matchEstado && matchTipo;
  });

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge className="bg-green-100 text-green-700">Disponible</Badge>;
      case 'ocupada':
        return <Badge className="bg-blue-100 text-blue-700">Ocupada</Badge>;
      case 'mantenimiento':
        return <Badge className="bg-yellow-100 text-yellow-700">Mantenimiento</Badge>;
      case 'reservada':
        return <Badge className="bg-purple-100 text-purple-700">Reservada</Badge>;
      default:
        return <Badge variant="outline">{estado}</Badge>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case 'individual':
        return <Badge variant="outline">Individual</Badge>;
      case 'doble':
        return <Badge variant="outline">Doble</Badge>;
      case 'triple':
        return <Badge variant="outline">Triple</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  const handleChangeStatus = (habitacionId: string, newStatus: string) => {
    setHabitaciones(
      habitaciones.map((h) =>
        h.id === habitacionId ? { ...h, estado: newStatus as Habitacion['estado'] } : h
      )
    );
    toast.success('Estado actualizado correctamente');
  };

  const totalCamas = habitaciones.reduce((acc, h) => acc + h.camas, 0);
  const camasOcupadas = habitaciones.reduce((acc, h) => acc + h.ocupadas, 0);
  const disponibles = habitaciones.filter((h) => h.estado === 'disponible').length;
  const enMantenimiento = habitaciones.filter((h) => h.estado === 'mantenimiento').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bed className="h-6 w-6" />
            Habitaciones
          </h1>
          <p className="text-muted-foreground">
            Gestión de habitaciones y camas
          </p>
        </div>
        <Button>
          <Home className="h-4 w-4 mr-2" />
          Nueva Habitación
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Camas</p>
                <p className="text-2xl font-bold">{totalCamas}</p>
              </div>
              <Bed className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold">
                  {Math.round((camasOcupadas / totalCamas) * 100)}%
                </p>
              </div>
              <Users className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{disponibles}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mantenimiento</p>
                <p className="text-2xl font-bold text-yellow-600">{enMantenimiento}</p>
              </div>
              <Wrench className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ocupación por Edificio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Ocupación por Edificio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {EDIFICIOS_STATS.map((edificio) => (
              <div key={edificio.nombre} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{edificio.nombre}</span>
                  <span className="text-sm text-muted-foreground">
                    {edificio.ocupadas}/{edificio.total}
                  </span>
                </div>
                <Progress
                  value={(edificio.ocupadas / edificio.total) * 100}
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((edificio.ocupadas / edificio.total) * 100)}% ocupación
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de habitación..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterEdificio} onValueChange={setFilterEdificio}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Edificio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Edificio A">Edificio A</SelectItem>
                <SelectItem value="Edificio B">Edificio B</SelectItem>
                <SelectItem value="Edificio C">Edificio C</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="ocupada">Ocupada</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                <SelectItem value="reservada">Reservada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="doble">Doble</SelectItem>
                <SelectItem value="triple">Triple</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Habitaciones Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredHabitaciones.map((habitacion) => (
          <Card key={habitacion.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    {habitacion.numero}
                  </CardTitle>
                  <CardDescription>
                    {habitacion.edificio} · Planta {habitacion.planta}
                  </CardDescription>
                </div>
                {getEstadoBadge(habitacion.estado)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  {getTipoBadge(habitacion.tipo)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Camas</span>
                  <span className="font-medium">
                    {habitacion.ocupadas}/{habitacion.camas} ocupadas
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Precio/mes</span>
                  <span className="font-medium text-green-600">€{habitacion.precio}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {habitacion.amenities.slice(0, 3).map((amenity, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {habitacion.amenities.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{habitacion.amenities.length - 3}
                    </Badge>
                  )}
                </div>
                {habitacion.residentes.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Residentes:</p>
                    <p className="text-sm">{habitacion.residentes.join(', ')}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedHabitacion(habitacion)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Habitación {habitacion.numero}</DialogTitle>
                        <DialogDescription>
                          {habitacion.edificio} · Planta {habitacion.planta}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Tipo</p>
                            <p className="font-medium capitalize">{habitacion.tipo}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Estado</p>
                            {getEstadoBadge(habitacion.estado)}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Camas</p>
                            <p className="font-medium">
                              {habitacion.ocupadas}/{habitacion.camas}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Precio</p>
                            <p className="font-medium">€{habitacion.precio}/mes</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Amenities</p>
                          <div className="flex flex-wrap gap-1">
                            {habitacion.amenities.map((a, i) => (
                              <Badge key={i} variant="secondary">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {habitacion.residentes.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Residentes Actuales
                            </p>
                            <ul className="list-disc list-inside">
                              {habitacion.residentes.map((r, i) => (
                                <li key={i} className="text-sm">
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Select
                            value={habitacion.estado}
                            onValueChange={(value) =>
                              handleChangeStatus(habitacion.id, value)
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Cambiar estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="disponible">Disponible</SelectItem>
                              <SelectItem value="ocupada">Ocupada</SelectItem>
                              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                              <SelectItem value="reservada">Reservada</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={habitacion.estado !== 'disponible'}
                  >
                    Asignar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHabitaciones.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No se encontraron habitaciones con los filtros aplicados
          </CardContent>
        </Card>
      )}
    </div>
  );
}
