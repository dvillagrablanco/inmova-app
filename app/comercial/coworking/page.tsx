'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Laptop,
  Plus,
  Search,
  Filter,
  MapPin,
  Euro,
  Users,
  Ruler,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  Calendar,
  Wifi,
  Coffee,
  Clock,
  Printer,
  Phone,
  Video,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { toast } from 'sonner';

interface Coworking {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  capacidad: number;
  ocupados?: number;
  estado: string;
  rentaMensual: number;
  arrendatario?: string | null;
  periodo?: string;
  servicios: string[];
  horasAcceso?: string;
}

interface Stats {
  total: number;
  ocupadas: number;
  disponibles: number;
  reservadas: number;
  rentaMensualTotal: number;
  capacidadTotal: number;
}

const tipoLabels: Record<string, string> = {
  coworking_hot_desk: 'Hot Desk',
  coworking_dedicated: 'Puesto Dedicado',
  coworking_office: 'Oficina Privada',
};

const tipoColors: Record<string, string> = {
  coworking_hot_desk: 'bg-blue-100 text-blue-800',
  coworking_dedicated: 'bg-purple-100 text-purple-800',
  coworking_office: 'bg-green-100 text-green-800',
};

const servicioIcons: Record<string, any> = {
  wifi: { icon: Wifi, label: 'WiFi de alta velocidad' },
  cafe: { icon: Coffee, label: 'Café incluido' },
  impresora: { icon: Printer, label: 'Impresora' },
  salas: { icon: Video, label: 'Salas de reuniones' },
  recepcion: { icon: Phone, label: 'Recepción' },
  eventos: { icon: Users, label: 'Eventos networking' },
};

export default function CoworkingPage() {
  const [espacios, setEspacios] = useState<Coworking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');

  useEffect(() => {
    const fetchCoworking = async () => {
      try {
        const response = await fetch('/api/comercial/spaces?categoria=coworking');
        if (!response.ok) throw new Error('Error al cargar espacios coworking');
        const data = await response.json();
        setEspacios(data.spaces || []);
        setStats(data.stats || null);
      } catch (error) {
        console.error('Error fetching coworking:', error);
        toast.error('Error al cargar los espacios de coworking');
      } finally {
        setLoading(false);
      }
    };

    fetchCoworking();
  }, []);

  const filteredCoworking = espacios.filter((espacio) => {
    const matchesSearch =
      espacio.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      espacio.direccion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || espacio.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  // Calcular métricas adicionales
  const totalPuestos = espacios.reduce((acc, e) => acc + (e.capacidad || 0), 0);
  const ocupacion =
    totalPuestos > 0
      ? Math.round(
          (espacios.reduce(
            (acc, e) => acc + (e.ocupados || (e.estado === 'ocupada' ? e.capacidad : 0)),
            0
          ) /
            totalPuestos) *
            100
        )
      : 0;

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/comercial" className="hover:text-blue-600">
          Alquiler Comercial
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">Coworking</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Laptop className="h-8 w-8 text-purple-600" />
            Espacios Coworking
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona membresías de coworking, hot desks y oficinas flexibles
          </p>
        </div>
        <Button asChild>
          <Link href="/comercial/espacios/nuevo?tipo=coworking">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Espacio
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Espacios Totales</div>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Puestos Totales</div>
            <div className="text-2xl font-bold">{totalPuestos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ocupación</div>
            <div className="text-2xl font-bold text-green-600">{ocupacion}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ingresos/mes</div>
            <div className="text-2xl font-bold">
              {(stats?.rentaMensualTotal || 0).toLocaleString('es-ES')}€
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo de espacio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="coworking_hot_desk">Hot Desk</SelectItem>
                <SelectItem value="coworking_dedicated">Puesto Dedicado</SelectItem>
                <SelectItem value="coworking_office">Oficina Privada</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Más filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredCoworking.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Laptop className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay espacios</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || tipoFilter !== 'todos'
                ? 'No se encontraron espacios con los filtros aplicados'
                : 'Comienza agregando tu primer espacio de coworking'}
            </p>
            {!searchQuery && tipoFilter === 'todos' && (
              <Button asChild>
                <Link href="/comercial/espacios/nuevo?tipo=coworking">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Espacio
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de espacios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCoworking.map((espacio) => (
          <Card key={espacio.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-40 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
              <Laptop className="h-16 w-16 text-purple-300" />
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{espacio.nombre}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="h-3 w-3" />
                    {espacio.direccion}
                  </div>
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      Ver miembros
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="h-4 w-4 mr-2" />
                      Programar tour
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={tipoColors[espacio.tipo] || 'bg-gray-100 text-gray-800'}>
                  {tipoLabels[espacio.tipo] || espacio.tipo}
                </Badge>
                {espacio.horasAcceso && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {espacio.horasAcceso}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">Capacidad</div>
                  <div className="font-semibold flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {espacio.tipo === 'coworking_office'
                      ? `${espacio.capacidad} personas`
                      : `${espacio.ocupados || 0}/${espacio.capacidad} puestos`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Desde</div>
                  <div className="text-xl font-bold text-purple-600">
                    {espacio.rentaMensual.toLocaleString('es-ES')}€
                    <span className="text-sm font-normal">/mes</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {espacio.servicios?.map((servicio) => {
                  const ServicioIcon = servicioIcons[servicio]?.icon || Wifi;
                  return (
                    <div
                      key={servicio}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                      title={servicioIcons[servicio]?.label}
                    >
                      <ServicioIcon className="h-3 w-3" />
                      {servicioIcons[servicio]?.label || servicio}
                    </div>
                  );
                })}
              </div>

              {espacio.arrendatario && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{espacio.arrendatario}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/comercial/espacios/${espacio.id}`}>Ver detalles</Link>
                </Button>
                {espacio.estado === 'disponible' && <Button className="flex-1">Reservar</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Incluidos</CardTitle>
          <CardDescription>Todos nuestros espacios de coworking incluyen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Wifi className="h-6 w-6 text-purple-600" />
              <div>
                <div className="font-medium">WiFi Premium</div>
                <div className="text-sm text-gray-500">1Gbps simétrico</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Coffee className="h-6 w-6 text-purple-600" />
              <div>
                <div className="font-medium">Café & Snacks</div>
                <div className="text-sm text-gray-500">Ilimitado</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Video className="h-6 w-6 text-purple-600" />
              <div>
                <div className="font-medium">Salas de Reuniones</div>
                <div className="text-sm text-gray-500">Reserva incluida</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
              <div>
                <div className="font-medium">Comunidad</div>
                <div className="text-sm text-gray-500">Eventos networking</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
