'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Warehouse,
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
  Truck,
  Package,
  Zap,
  ArrowUp,
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

interface Nave {
  id: string;
  nombre: string;
  direccion: string;
  superficie: number;
  superficieUtil: number;
  estado: string;
  rentaMensual: number;
  arrendatario: string | null;
  tipo: string;
  alturaLibre?: number;
  cargaSuelo?: number;
  muelles?: number;
  caracteristicas: string[];
}

interface Stats {
  total: number;
  ocupadas: number;
  disponibles: number;
  reservadas: number;
  rentaMensualTotal: number;
  superficieTotal: number;
}

const estadoColors: Record<string, string> = {
  ocupada: 'bg-green-100 text-green-800',
  disponible: 'bg-blue-100 text-blue-800',
  reservada: 'bg-amber-100 text-amber-800',
  mantenimiento: 'bg-gray-100 text-gray-800',
};

export default function NavesPage() {
  const [naves, setNaves] = useState<Nave[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');

  useEffect(() => {
    const fetchNaves = async () => {
      try {
        const response = await fetch('/api/comercial/spaces?categoria=naves');
        if (!response.ok) throw new Error('Error al cargar naves');
        const data = await response.json();
        setNaves(data.spaces || []);
        setStats(data.stats || null);
      } catch (error) {
        console.error('Error fetching naves:', error);
        toast.error('Error al cargar las naves industriales');
      } finally {
        setLoading(false);
      }
    };

    fetchNaves();
  }, []);

  const filteredNaves = naves.filter((nave) => {
    const matchesSearch =
      nave.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nave.direccion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || nave.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
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
        <span className="font-medium text-gray-900">Naves Industriales</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Warehouse className="h-8 w-8 text-amber-600" />
            Naves Industriales
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona naves industriales, almacenes logísticos y talleres
          </p>
        </div>
        <Button asChild>
          <Link href="/comercial/espacios/nuevo?tipo=nave">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Nave
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Naves</div>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ocupadas</div>
            <div className="text-2xl font-bold text-green-600">{stats?.ocupadas || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Superficie Total</div>
            <div className="text-2xl font-bold">
              {(stats?.superficieTotal || 0).toLocaleString('es-ES')} m²
            </div>
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
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="disponible">Disponibles</SelectItem>
                <SelectItem value="ocupada">Ocupadas</SelectItem>
                <SelectItem value="reservada">Reservadas</SelectItem>
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
      {filteredNaves.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Warehouse className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay naves</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || estadoFilter !== 'todos'
                ? 'No se encontraron naves con los filtros aplicados'
                : 'Comienza agregando tu primera nave industrial'}
            </p>
            {!searchQuery && estadoFilter === 'todos' && (
              <Button asChild>
                <Link href="/comercial/espacios/nuevo?tipo=nave">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Nave
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de naves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredNaves.map((nave) => (
          <Card key={nave.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
              <Warehouse className="h-20 w-20 text-amber-300" />
            </div>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{nave.nombre}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin className="h-3 w-3" />
                    {nave.direccion}
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
                <Badge className={estadoColors[nave.estado] || 'bg-gray-100 text-gray-800'}>
                  {nave.estado.charAt(0).toUpperCase() + nave.estado.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {nave.tipo === 'nave_industrial'
                    ? 'Nave Industrial'
                    : nave.tipo === 'almacen'
                      ? 'Almacén'
                      : 'Taller'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm bg-gray-50 p-3 rounded-lg">
                <div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Ruler className="h-4 w-4" />
                    Superficie
                  </div>
                  <div className="font-semibold">
                    {(nave.superficieUtil || nave.superficie).toLocaleString('es-ES')} m²
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <ArrowUp className="h-4 w-4" />
                    Altura libre
                  </div>
                  <div className="font-semibold">{nave.alturaLibre || '-'} m</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Package className="h-4 w-4" />
                    Carga suelo
                  </div>
                  <div className="font-semibold">
                    {nave.cargaSuelo ? `${nave.cargaSuelo.toLocaleString('es-ES')} kg/m²` : '-'}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Truck className="h-4 w-4" />
                    Muelles
                  </div>
                  <div className="font-semibold">{nave.muelles || '-'}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <div className="text-sm text-gray-500">Renta mensual</div>
                  <div className="text-xl font-bold text-gray-900">
                    {nave.rentaMensual.toLocaleString('es-ES')}€
                  </div>
                </div>
                {nave.arrendatario && (
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Arrendatario</div>
                    <div className="font-medium">{nave.arrendatario}</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {nave.caracteristicas?.includes('muelle_carga') && (
                  <Badge variant="secondary" className="text-xs">
                    <Truck className="h-3 w-3 mr-1" />
                    Muelle de carga
                  </Badge>
                )}
                {nave.caracteristicas?.includes('trifasica') && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Trifásica
                  </Badge>
                )}
              </div>

              <Button variant="outline" className="w-full" asChild>
                <Link href={`/comercial/espacios/${nave.id}`}>
                  Ver detalles completos
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
