'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
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
  ShoppingBag,
  Utensils,
  Coffee,
  Scissors,
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
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

interface Local {
  id: string;
  nombre: string;
  direccion: string;
  superficie: number;
  superficieUtil: number;
  estado: string;
  rentaMensual: number;
  arrendatario: string | null;
  tipo: string;
  longitudFachada?: number;
  actividad?: string | null;
  caracteristicas: string[];
}

interface Stats {
  total: number;
  ocupadas: number;
  disponibles: number;
  reservadas: number;
  rentaMensualTotal: number;
}

const estadoColors: Record<string, string> = {
  ocupada: 'bg-green-100 text-green-800',
  disponible: 'bg-blue-100 text-blue-800',
  reservada: 'bg-amber-100 text-amber-800',
  mantenimiento: 'bg-gray-100 text-gray-800',
};

const actividadIcons: Record<string, any> = {
  Hostelería: Coffee,
  Alimentación: ShoppingBag,
  Moda: Scissors,
  Restauración: Utensils,
};

export default function LocalesPage() {
  const [locales, setLocales] = useState<Local[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');

  useEffect(() => {
    const fetchLocales = async () => {
      try {
        const response = await fetch('/api/comercial/spaces?categoria=locales');
        if (!response.ok) throw new Error('Error al cargar locales');
        const data = await response.json();
        setLocales(data.spaces || []);
        setStats(data.stats || null);
      } catch (error) {
        console.error('Error fetching locales:', error);
        toast.error('Error al cargar los locales comerciales');
      } finally {
        setLoading(false);
      }
    };

    fetchLocales();
  }, []);

  const filteredLocales = locales.filter((local) => {
    const matchesSearch =
      local.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      local.direccion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEstado = estadoFilter === 'todos' || local.estado === estadoFilter;
    return matchesSearch && matchesEstado;
  });

  if (loading) {
    return (
      <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Link href="/comercial" className="hover:text-blue-600">
          Alquiler Comercial
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-gray-900">Locales Comerciales</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="h-8 w-8 text-green-600" />
            Locales Comerciales
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona locales a pie de calle y en centros comerciales
          </p>
        </div>
        <Button asChild>
          <Link href="/comercial/espacios/nuevo?tipo=local">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Local
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Locales</div>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Ocupados</div>
            <div className="text-2xl font-bold text-green-600">{stats?.ocupadas || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Disponibles</div>
            <div className="text-2xl font-bold text-blue-600">{stats?.disponibles || 0}</div>
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
                <SelectItem value="ocupada">Ocupados</SelectItem>
                <SelectItem value="reservada">Reservados</SelectItem>
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
      {filteredLocales.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Store className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay locales</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || estadoFilter !== 'todos'
                ? 'No se encontraron locales con los filtros aplicados'
                : 'Comienza agregando tu primer local comercial'}
            </p>
            {!searchQuery && estadoFilter === 'todos' && (
              <Button asChild>
                <Link href="/comercial/espacios/nuevo?tipo=local">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Local
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de locales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLocales.map((local) => {
          const ActividadIcon = local.actividad ? actividadIcons[local.actividad] || Store : Store;

          return (
            <Card key={local.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                <Store className="h-16 w-16 text-green-300" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{local.nombre}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <MapPin className="h-3 w-3" />
                      {local.direccion}
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
                  <Badge className={estadoColors[local.estado] || 'bg-gray-100 text-gray-800'}>
                    {local.estado.charAt(0).toUpperCase() + local.estado.slice(1)}
                  </Badge>
                  {local.actividad && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <ActividadIcon className="h-3 w-3" />
                      {local.actividad}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Ruler className="h-4 w-4" />
                    {local.superficieUtil || local.superficie} m² útiles
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Euro className="h-4 w-4" />
                    {local.rentaMensual.toLocaleString('es-ES')}€/mes
                  </div>
                </div>

                {local.longitudFachada && (
                  <div className="text-sm text-gray-600">
                    Fachada: {local.longitudFachada} metros lineales
                  </div>
                )}

                {local.arrendatario && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{local.arrendatario}</span>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/comercial/espacios/${local.id}`}>
                    Ver detalles
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
    </AuthenticatedLayout>
  );
}
