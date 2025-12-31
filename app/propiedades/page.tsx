'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Home,
  Plus,
  Building2,
  MapPin,
  Filter,
  Search,
  Grid3x3,
  List,
  LayoutGrid,
  Euro,
  Bed,
  Bath,
  Maximize2,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Star,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Image from 'next/image';

interface Property {
  id: string;
  numero: string;
  tipo: string;
  estado: string;
  superficie: number;
  superficieUtil?: number;
  habitaciones?: number;
  banos?: number;
  planta?: number;
  orientacion?: string;
  rentaMensual: number;
  imagenes?: string[];
  building: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
  };
  tenant?: {
    nombreCompleto: string;
    email: string;
  };
}

type ViewMode = 'grid' | 'list' | 'map';

export default function PropiedadesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [precioMin, setPrecioMin] = useState<string>('');
  const [precioMax, setPrecioMax] = useState<string>('');
  const [habitacionesMin, setHabitacionesMin] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest'); // newest, oldest, price-asc, price-desc, size-asc, size-desc

  // Redirect si no autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar propiedades
  useEffect(() => {
    const fetchProperties = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/units');
        if (response.ok) {
          const data = await response.json();
          setProperties(data);
          setFilteredProperties(data);
        } else {
          toast.error('Error al cargar propiedades');
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast.error('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [status]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = properties;

    // Búsqueda por texto
    if (searchTerm) {
      filtered = filtered.filter(
        (prop) =>
          prop.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prop.building.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prop.building.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prop.building.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por estado
    if (estadoFilter && estadoFilter !== 'all') {
      filtered = filtered.filter((prop) => prop.estado === estadoFilter);
    }

    // Filtro por tipo
    if (tipoFilter && tipoFilter !== 'all') {
      filtered = filtered.filter((prop) => prop.tipo === tipoFilter);
    }

    // Filtro por rango de precio
    if (precioMin) {
      filtered = filtered.filter((prop) => prop.rentaMensual >= parseFloat(precioMin));
    }
    if (precioMax) {
      filtered = filtered.filter((prop) => prop.rentaMensual <= parseFloat(precioMax));
    }

    // Filtro por habitaciones mínimas
    if (habitacionesMin) {
      filtered = filtered.filter(
        (prop) => (prop.habitaciones || 0) >= parseInt(habitacionesMin)
      );
    }

    // Aplicar ordenamiento
    const sorted = [...filtered];
    switch (sortBy) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.rentaMensual - b.rentaMensual);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.rentaMensual - a.rentaMensual);
        break;
      case 'size-asc':
        sorted.sort((a, b) => a.superficie - b.superficie);
        break;
      case 'size-desc':
        sorted.sort((a, b) => b.superficie - a.superficie);
        break;
    }

    setFilteredProperties(sorted);
  }, [searchTerm, estadoFilter, tipoFilter, precioMin, precioMax, habitacionesMin, sortBy, properties]);

  // Funciones de utilidad
  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string; color: string }> = {
      ocupada: { variant: 'default', label: 'Ocupada', color: 'bg-green-500' },
      disponible: { variant: 'secondary', label: 'Disponible', color: 'bg-blue-500' },
      en_mantenimiento: { variant: 'outline', label: 'Mantenimiento', color: 'bg-yellow-500' },
    };
    return badges[estado] || { variant: 'default', label: estado, color: 'bg-gray-500' };
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      vivienda: 'Vivienda',
      local: 'Local Comercial',
      oficina: 'Oficina',
      estudio: 'Estudio',
      garaje: 'Garaje',
      trastero: 'Trastero',
    };
    return tipos[tipo] || tipo;
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'vivienda':
      case 'estudio':
        return Home;
      case 'local':
      case 'oficina':
        return Building2;
      default:
        return Building2;
    }
  };

  // Estadísticas
  const totalProperties = properties.length;
  const ocupadas = properties.filter((p) => p.estado === 'ocupada').length;
  const disponibles = properties.filter((p) => p.estado === 'disponible').length;
  const ocupacionRate =
    totalProperties > 0 ? Math.round((ocupadas / totalProperties) * 100) : 0;
  const ingresosMensuales = properties
    .filter((p) => p.estado === 'ocupada')
    .reduce((sum, p) => sum + p.rentaMensual, 0);

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setEstadoFilter('all');
    setTipoFilter('all');
    setPrecioMin('');
    setPrecioMax('');
    setHabitacionesMin('');
    setSortBy('newest');
  };

  const hasActiveFilters =
    searchTerm ||
    (estadoFilter && estadoFilter !== 'all') ||
    (tipoFilter && tipoFilter !== 'all') ||
    precioMin ||
    precioMax ||
    habitacionesMin;

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardContent className="pt-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs y Botón Volver */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Gestión de Propiedades</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Propiedades</h1>
            <p className="text-muted-foreground">
              Administra tu portfolio inmobiliario completo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/propiedades/crear')}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Propiedad
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProperties}</div>
              <p className="text-xs text-muted-foreground">En tu portfolio</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupadas</CardTitle>
              <Home className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{ocupadas}</div>
              <p className="text-xs text-muted-foreground">{ocupacionRate}% ocupación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <Maximize2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{disponibles}</div>
              <p className="text-xs text-muted-foreground">Listas para alquilar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                €{ingresosMensuales.toLocaleString('es-ES')}
              </div>
              <p className="text-xs text-muted-foreground">De propiedades ocupadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y Búsqueda */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                <CardTitle>Filtros</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-muted' : ''}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-muted' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por dirección, ciudad, número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros en Grid */}
            <div className="grid gap-4 md:grid-cols-5">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="ocupada">Ocupada</SelectItem>
                  <SelectItem value="en_mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>

              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="vivienda">Vivienda</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="estudio">Estudio</SelectItem>
                  <SelectItem value="garaje">Garaje</SelectItem>
                  <SelectItem value="trastero">Trastero</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Precio mín (€)"
                value={precioMin}
                onChange={(e) => setPrecioMin(e.target.value)}
              />

              <Input
                type="number"
                placeholder="Precio máx (€)"
                value={precioMax}
                onChange={(e) => setPrecioMax(e.target.value)}
              />

              <Input
                type="number"
                placeholder="Hab. mín"
                value={habitacionesMin}
                onChange={(e) => setHabitacionesMin(e.target.value)}
              />
            </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-muted-foreground">Ordenar por:</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Más recientes</SelectItem>
                  <SelectItem value="oldest">Más antiguos</SelectItem>
                  <SelectItem value="price-desc">Precio: Mayor a menor</SelectItem>
                  <SelectItem value="price-asc">Precio: Menor a mayor</SelectItem>
                  <SelectItem value="size-desc">Superficie: Mayor a menor</SelectItem>
                  <SelectItem value="size-asc">Superficie: Menor a mayor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón limpiar filtros */}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        {filteredProperties.length === 0 ? (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No hay propiedades</h3>
                <p className="text-muted-foreground">
                  {hasActiveFilters
                    ? 'No se encontraron propiedades con estos filtros'
                    : 'Comienza creando tu primera propiedad'}
                </p>
              </div>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                <Button onClick={() => router.push('/propiedades/crear')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Propiedad
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <>
            {/* Contador de resultados */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredProperties.length} {filteredProperties.length === 1 ? 'propiedad' : 'propiedades'}{' '}
                {hasActiveFilters && `de ${totalProperties} totales`}
              </p>
            </div>

            {/* Vista Grid */}
            {viewMode === 'grid' && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProperties.map((property) => {
                  const estadoBadge = getEstadoBadge(property.estado);
                  const TipoIcon = getTipoIcon(property.tipo);

                  return (
                    <Card
                      key={property.id}
                      className="overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
                      onClick={() => router.push(`/propiedades/${property.id}`)}
                    >
                      {/* Imagen */}
                      <div className="relative aspect-video bg-muted">
                        {property.imagenes && property.imagenes.length > 0 ? (
                          <Image
                            src={property.imagenes[0]}
                            alt={`Propiedad ${property.numero}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 className="h-12 w-12 text-muted-foreground/50" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                        </div>
                      </div>

                      {/* Contenido */}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg line-clamp-1">
                              {property.building.nombre} - {property.numero}
                            </CardTitle>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">
                                {property.building.direccion}, {property.building.ciudad}
                              </span>
                            </div>
                          </div>
                          <TipoIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Características */}
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Maximize2 className="h-4 w-4 text-muted-foreground" />
                            <span>{property.superficie}m²</span>
                          </div>
                          {property.habitaciones && (
                            <div className="flex items-center gap-1">
                              <Bed className="h-4 w-4 text-muted-foreground" />
                              <span>{property.habitaciones}</span>
                            </div>
                          )}
                          {property.banos && (
                            <div className="flex items-center gap-1">
                              <Bath className="h-4 w-4 text-muted-foreground" />
                              <span>{property.banos}</span>
                            </div>
                          )}
                        </div>

                        {/* Inquilino */}
                        {property.tenant && (
                          <div className="p-2 bg-muted/50 rounded-lg text-sm">
                            <p className="font-medium truncate">{property.tenant.nombreCompleto}</p>
                            <p className="text-xs text-muted-foreground">Inquilino actual</p>
                          </div>
                        )}

                        {/* Precio */}
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Renta mensual</span>
                            <span className="text-xl font-bold text-green-600">
                              €{property.rentaMensual.toLocaleString('es-ES')}
                            </span>
                          </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/propiedades/${property.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/propiedades/${property.id}/editar`);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/propiedades/${property.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/propiedades/${property.id}/editar`);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.error('Función en desarrollo');
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Vista Lista */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {filteredProperties.map((property) => {
                  const estadoBadge = getEstadoBadge(property.estado);
                  const TipoIcon = getTipoIcon(property.tipo);

                  return (
                    <Card
                      key={property.id}
                      className="hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => router.push(`/propiedades/${property.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                          {/* Imagen */}
                          <div className="relative w-full lg:w-48 aspect-video bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            {property.imagenes && property.imagenes.length > 0 ? (
                              <Image
                                src={property.imagenes[0]}
                                alt={`Propiedad ${property.numero}`}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Building2 className="h-8 w-8 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          {/* Información */}
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-xl font-bold">
                                    {property.building.nombre} - {property.numero}
                                  </h3>
                                  <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-4 w-4" />
                                  <span>
                                    {property.building.direccion}, {property.building.ciudad}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <TipoIcon className="h-4 w-4" />
                                  <span>{getTipoLabel(property.tipo)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Características */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Superficie</p>
                                <p className="text-lg font-semibold">{property.superficie}m²</p>
                              </div>
                              {property.habitaciones && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Habitaciones</p>
                                  <p className="text-lg font-semibold">{property.habitaciones}</p>
                                </div>
                              )}
                              {property.banos && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Baños</p>
                                  <p className="text-lg font-semibold">{property.banos}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-muted-foreground">Renta/mes</p>
                                <p className="text-lg font-semibold text-green-600">
                                  €{property.rentaMensual.toLocaleString('es-ES')}
                                </p>
                              </div>
                            </div>

                            {/* Inquilino */}
                            {property.tenant && (
                              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-semibold">
                                    {property.tenant.nombreCompleto.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-medium">{property.tenant.nombreCompleto}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {property.tenant.email}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="flex lg:flex-col gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 lg:flex-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/propiedades/${property.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 lg:flex-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/propiedades/${property.id}/editar`);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
