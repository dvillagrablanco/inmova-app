'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Building2, 
  Home, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  MapPin,
  Users,
  DollarSign,
  Percent,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  numeroUnidades: number;
  totalUnidades?: number;
  unidadesOcupadas?: number;
  unidadesDisponibles?: number;
  metrics?: {
    totalUnits: number;
    occupiedUnits: number;
    ocupacionPct: number;
    ingresosMensuales: number;
  };
  createdAt: string;
}

interface Unit {
  id: string;
  numero: string;
  tipo: string;
  estado: string;
  planta: number | null;
  superficie: number;
  habitaciones: number | null;
  banos: number | null;
  rentaMensual: number;
  building?: {
    id: string;
    nombre: string;
    direccion: string;
  };
  tenant?: {
    id: string;
    nombreCompleto: string;
  } | null;
}

export default function PropertiesPage() {
  const { data: session } = useSession();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'buildings' | 'units'>('buildings');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [buildingsRes, unitsRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/units'),
      ]);

      if (buildingsRes.ok) {
        const buildingsData = await buildingsRes.json();
        setBuildings(Array.isArray(buildingsData) ? buildingsData : buildingsData.data || []);
      }

      if (unitsRes.ok) {
        const unitsData = await unitsRes.json();
        setUnits(Array.isArray(unitsData) ? unitsData : unitsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar propiedades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredBuildings = buildings.filter(building => 
    building.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    building.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnits = units.filter(unit => {
    const matchesSearch = 
      unit.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unit.building?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = filterEstado === 'all' || unit.estado === filterEstado;
    
    return matchesSearch && matchesEstado;
  });

  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.estado === 'ocupada').length;
  const availableUnits = units.filter(u => u.estado === 'disponible').length;
  const totalIncome = units
    .filter(u => u.estado === 'ocupada')
    .reduce((sum, u) => sum + (u.rentaMensual || 0), 0);

  const estadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'ocupada': return 'bg-green-100 text-green-800';
      case 'disponible': return 'bg-blue-100 text-blue-800';
      case 'mantenimiento': return 'bg-yellow-100 text-yellow-800';
      case 'reservada': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Propiedades</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu cartera de propiedades inmobiliarias
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" asChild>
            <Link href="/edificios/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Edificio
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Edificios</p>
                <p className="text-2xl font-bold">{buildings.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Unidades</p>
                <p className="text-2xl font-bold">{totalUnits}</p>
              </div>
              <Home className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ocupación</p>
                <p className="text-2xl font-bold">
                  {totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0}%
                </p>
              </div>
              <Percent className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ingresos/mes</p>
                <p className="text-2xl font-bold">€{totalIncome.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={viewMode} onValueChange={(v: 'buildings' | 'units') => setViewMode(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Vista" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buildings">Edificios</SelectItem>
              <SelectItem value="units">Unidades</SelectItem>
            </SelectContent>
          </Select>
          {viewMode === 'units' && (
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[150px]">
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
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'buildings' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBuildings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay edificios</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No se encontraron edificios con ese criterio' : 'Comienza agregando tu primer edificio'}
              </p>
              <Button asChild>
                <Link href="/edificios/nuevo">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Edificio
                </Link>
              </Button>
            </div>
          ) : (
            filteredBuildings.map((building) => (
              <Card key={building.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{building.nombre}</CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {building.direccion || 'Sin dirección'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => undefined}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/edificios/${building.id}`}>Ver detalles</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/edificios/${building.id}/editar`}>Editar</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Unidades</p>
                      <p className="text-lg font-semibold">{building.metrics?.totalUnits || building.totalUnidades || 0}</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500">Ocupación</p>
                      <p className="text-lg font-semibold">{building.metrics?.ocupacionPct || 0}%</p>
                    </div>
                  </div>
                  {building.metrics?.ingresosMensuales && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs text-gray-500">Ingresos mensuales</p>
                      <p className="text-lg font-semibold text-green-600">
                        €{building.metrics.ingresosMensuales.toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay unidades</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterEstado !== 'all' 
                  ? 'No se encontraron unidades con ese criterio' 
                  : 'Agrega unidades a tus edificios'}
              </p>
            </div>
          ) : (
            filteredUnits.map((unit) => (
              <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {unit.building?.nombre || 'Edificio'} - {unit.numero}
                        <Badge className={estadoBadgeColor(unit.estado)}>
                          {unit.estado}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {unit.tipo} • {unit.superficie}m²
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => undefined}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/unidades/${unit.id}`}>Ver detalles</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/unidades/${unit.id}/editar`}>Editar</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {unit.habitaciones !== null && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Hab.</p>
                        <p className="font-semibold">{unit.habitaciones}</p>
                      </div>
                    )}
                    {unit.banos !== null && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Baños</p>
                        <p className="font-semibold">{unit.banos}</p>
                      </div>
                    )}
                    {unit.planta !== null && (
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500">Planta</p>
                        <p className="font-semibold">{unit.planta}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Renta mensual</p>
                      <p className="text-lg font-semibold text-green-600">
                        €{unit.rentaMensual?.toLocaleString() || 0}
                      </p>
                    </div>
                    {unit.tenant && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Inquilino</p>
                        <p className="text-sm font-medium flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          {unit.tenant.nombreCompleto}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
