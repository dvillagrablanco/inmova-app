'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Euro,
  Users,
  Ruler,
  Zap,
  Snowflake,
  Car,
  Wifi,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  FileText,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Oficina {
  id: string;
  nombre: string;
  direccion: string;
  superficie: number;
  superficieUtil: number;
  estado: string;
  rentaMensual: number;
  arrendatario: string | null;
  tipo: string;
  planta: number;
  caracteristicas: string[];
  imagen: string;
}

interface Stats {
  total: number;
  ocupadas: number;
  disponibles: number;
  reservadas: number;
  superficieTotal: number;
  rentaMensualTotal: number;
}

const estadoColors: Record<string, string> = {
  ocupada: 'bg-green-100 text-green-800',
  disponible: 'bg-blue-100 text-blue-800',
  reservada: 'bg-amber-100 text-amber-800',
  mantenimiento: 'bg-gray-100 text-gray-800',
};

const caracteristicasIcons: Record<string, any> = {
  climatizacion: { icon: Snowflake, label: 'Climatización' },
  parking: { icon: Car, label: 'Parking' },
  fibra: { icon: Wifi, label: 'Fibra Óptica' },
  recepcion: { icon: Users, label: 'Recepción 24h' },
  fachada: { icon: Building2, label: 'Fachada' },
};

export default function OficinasPage() {
  const [oficinas, setOficinas] = useState<Oficina[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    ocupadas: 0,
    disponibles: 0,
    reservadas: 0,
    superficieTotal: 0,
    rentaMensualTotal: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchOficinas();
  }, []);

  const fetchOficinas = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/comercial/spaces?categoria=oficinas');
      if (res.ok) {
        const data = await res.json();
        setOficinas(data.spaces || []);
        setStats(data.stats || { total: 0, ocupadas: 0, disponibles: 0, reservadas: 0, superficieTotal: 0, rentaMensualTotal: 0 });
      } else {
        console.error('Error fetching oficinas');
        setOficinas([]);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar oficinas');
      setOficinas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOficinas = oficinas.filter((oficina) => {
    const matchesSearch = oficina.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      oficina.direccion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || oficina.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-16" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
        <Link href="/comercial" className="hover:text-blue-600">Alquiler Comercial</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">Oficinas</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Oficinas
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu cartera de oficinas privadas y espacios de trabajo
          </p>
        </div>
        <Button asChild>
          <Link href="/comercial/espacios/nuevo?tipo=oficina">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Oficina
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Oficinas</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ocupadas</div>
            <div className="text-2xl font-bold text-green-600">{stats.ocupadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Disponibles</div>
            <div className="text-2xl font-bold text-blue-600">{stats.disponibles}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ingresos/mes</div>
            <div className="text-2xl font-bold">{stats.rentaMensualTotal.toLocaleString('es-ES')}€</div>
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
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="disponible">Disponibles</SelectItem>
                <SelectItem value="ocupada">Ocupadas</SelectItem>
                <SelectItem value="reservada">Reservadas</SelectItem>
                <SelectItem value="mantenimiento">En mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Más filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de oficinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOficinas.map((oficina) => (
          <Card key={oficina.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-40 bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <Building2 className="h-16 w-16 text-blue-300" />
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{oficina.nombre}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="h-3 w-3" />
                    {oficina.direccion}
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
                      <FileText className="h-4 w-4 mr-2" />
                      Ver contrato
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Calendar className="h-4 w-4 mr-2" />
                      Programar visita
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Badge className={estadoColors[oficina.estado]}>
                  {oficina.estado.charAt(0).toUpperCase() + oficina.estado.slice(1)}
                </Badge>
                <span className="text-sm text-gray-500">Planta {oficina.planta}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Ruler className="h-4 w-4" />
                  {oficina.superficieUtil} m² útiles
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Euro className="h-4 w-4" />
                  {oficina.rentaMensual.toLocaleString('es-ES')}€/mes
                </div>
              </div>

              <div className="flex gap-1">
                {oficina.caracteristicas.map((car) => {
                  const CarIcon = caracteristicasIcons[car]?.icon || Zap;
                  return (
                    <div
                      key={car}
                      className="p-1.5 bg-gray-100 rounded"
                      title={caracteristicasIcons[car]?.label}
                    >
                      <CarIcon className="h-3 w-3 text-gray-600" />
                    </div>
                  );
                })}
              </div>

              {oficina.arrendatario && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{oficina.arrendatario}</span>
                  </div>
                </div>
              )}

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/comercial/espacios/${oficina.id}`}>
                  Ver detalles
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOficinas.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No se encontraron oficinas</h3>
            <p className="text-gray-600 mt-1">Prueba con otros filtros o añade una nueva oficina</p>
            <Button className="mt-4" asChild>
              <Link href="/comercial/espacios/nuevo?tipo=oficina">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Oficina
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
