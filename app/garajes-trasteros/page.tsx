'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Car,
  Plus,
  Search,
  Building2,
  Home,
  MapPin,
  Euro,
  Package,
  Edit,
  Trash2,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { AdvancedFilters, FilterOption, FilterValues } from '@/components/ui/advanced-filters';
import { ExportButton } from '@/components/ui/export-button';
import { formatters } from '@/lib/export-utils';
import logger from '@/lib/logger';

interface Unit {
  id: string;
  numero: string;
  tipo: 'garaje' | 'trastero';
  estado: 'disponible' | 'ocupada' | 'en_mantenimiento';
  superficie: number;
  planta: number | null;
  orientacion: string | null;
  rentaMensual: number;
  building: {
    id: string;
    nombre: string;
    direccion: string;
  };
  tenant: {
    nombreCompleto: string;
  } | null;
}

export default function GarajesTrasterosPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    tipo: 'all',
    estado: 'all',
    superficie_min: '',
    superficie_max: '',
    precio_min: '',
    precio_max: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchUnits();
    }
  }, [session]);

  useEffect(() => {
    filterResults();
  }, [units, filterValues]);

  // Definir columnas de exportación
  const exportColumns = [
    { key: 'numero', label: 'Número' },
    {
      key: 'tipo',
      label: 'Tipo',
      format: (val: string) => (val === 'garaje' ? 'Garaje' : 'Trastero'),
    },
    {
      key: 'estado',
      label: 'Estado',
      format: (val: string) => {
        const estados: Record<string, string> = {
          disponible: 'Disponible',
          ocupada: 'Ocupada',
          en_mantenimiento: 'En Mantenimiento',
        };
        return estados[val] || val;
      },
    },
    { key: 'superficie', label: 'Superficie (m²)' },
    { key: 'precioBase', label: 'Precio', format: formatters.currency },
    { key: 'building.nombre', label: 'Edificio' },
    { key: 'building.direccion', label: 'Dirección' },
    {
      key: 'tenant.nombreCompleto',
      label: 'Inquilino',
      format: (val: string | null) => val || 'Sin asignar',
    },
  ];

  // Definir opciones de filtros
  const filterOptions: FilterOption[] = [
    {
      id: 'search',
      label: 'Buscar',
      type: 'search',
      placeholder: 'Buscar por número, edificio o dirección...',
    },
    {
      id: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: [
        { value: 'garaje', label: 'Garaje' },
        { value: 'trastero', label: 'Trastero' },
      ],
    },
    {
      id: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'disponible', label: 'Disponible' },
        { value: 'ocupada', label: 'Ocupada' },
        { value: 'en_mantenimiento', label: 'En Mantenimiento' },
      ],
    },
    {
      id: 'superficie',
      label: 'Superficie (m²)',
      type: 'range',
      min: 0,
      max: 100,
      step: 5,
    },
    {
      id: 'precio',
      label: 'Precio Mensual (€)',
      type: 'price-range',
      min: 0,
      max: 500,
      step: 10,
    },
  ];

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/units?tipo=garaje,trastero');
      if (response.ok) {
        const data = await response.json();
        setUnits(data);
      } else {
        toast.error('Error al cargar garajes y trasteros');
      }
    } catch (error) {
      logger.error('Error fetching units:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filterResults = () => {
    let filtered = [...units];

    // Filtrar por búsqueda
    if (filterValues.search) {
      const searchLower = filterValues.search.toLowerCase();
      filtered = filtered.filter(
        (unit) =>
          unit.numero.toLowerCase().includes(searchLower) ||
          unit.building.nombre.toLowerCase().includes(searchLower) ||
          unit.building.direccion.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por tipo
    if (filterValues.tipo && filterValues.tipo !== 'all') {
      filtered = filtered.filter((unit) => unit.tipo === filterValues.tipo);
    }

    // Filtrar por estado
    if (filterValues.estado && filterValues.estado !== 'all') {
      filtered = filtered.filter((unit) => unit.estado === filterValues.estado);
    }

    // Filtrar por superficie
    if (filterValues.superficie_min) {
      filtered = filtered.filter((unit) => unit.superficie >= Number(filterValues.superficie_min));
    }
    if (filterValues.superficie_max) {
      filtered = filtered.filter((unit) => unit.superficie <= Number(filterValues.superficie_max));
    }

    // Filtrar por precio
    if (filterValues.precio_min) {
      filtered = filtered.filter((unit) => unit.rentaMensual >= Number(filterValues.precio_min));
    }
    if (filterValues.precio_max) {
      filtered = filtered.filter((unit) => unit.rentaMensual <= Number(filterValues.precio_max));
    }

    setFilteredUnits(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este espacio?')) return;

    try {
      const response = await fetch(`/api/units/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Espacio eliminado correctamente');
        fetchUnits();
      } else {
        toast.error('Error al eliminar el espacio');
      }
    } catch (error) {
      logger.error('Error deleting unit:', error);
      toast.error('Error al eliminar');
    }
  };

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      disponible: { variant: 'default' as any, label: 'Disponible' },
      ocupada: { variant: 'destructive' as any, label: 'Ocupada' },
      en_mantenimiento: { variant: 'secondary' as any, label: 'En Mantenimiento' },
    };
    return variants[estado] || variants.disponible;
  };

  const getTypeIcon = (tipo: string) => {
    return tipo === 'garaje' ? <Car className="h-5 w-5" /> : <Package className="h-5 w-5" />;
  };

  const stats = {
    total: units.length,
    garajes: units.filter((u) => u.tipo === 'garaje').length,
    trasteros: units.filter((u) => u.tipo === 'trastero').length,
    disponibles: units.filter((u) => u.estado === 'disponible').length,
    ocupados: units.filter((u) => u.estado === 'ocupada').length,
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
            <LoadingState message="Cargando garajes y trasteros..." />
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Breadcrumb */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Garajes y Trasteros</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight gradient-text">
                  Garajes y Trasteros
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gestión de espacios de almacenamiento y estacionamiento
                </p>
              </div>
              <div className="flex gap-2">
                <ExportButton
                  data={filteredUnits.map((unit) => ({
                    ...unit,
                    'building.nombre': unit.building.nombre,
                    'building.direccion': unit.building.direccion,
                    'tenant.nombreCompleto': unit.tenant?.nombreCompleto,
                  }))}
                  columns={exportColumns}
                  filename={`garajes-trasteros-${new Date().toISOString().split('T')[0]}`}
                  title="Garajes y Trasteros"
                  subtitle={`Generado el ${new Date().toLocaleDateString('es-ES')}`}
                  disabled={filteredUnits.length === 0}
                />
                <Button onClick={() => router.push('/garajes-trasteros/nuevo')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Añadir Espacio
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Garajes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.garajes}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Trasteros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.trasteros}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.disponibles}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ocupados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.ocupados}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filtros Avanzados */}
            <Card>
              <CardContent className="pt-6">
                <AdvancedFilters
                  filters={filterOptions}
                  values={filterValues}
                  onChange={setFilterValues}
                  onReset={() => {
                    setFilterValues({
                      search: '',
                      tipo: 'all',
                      estado: 'all',
                      superficie_min: '',
                      superficie_max: '',
                      precio_min: '',
                      precio_max: '',
                    });
                  }}
                  showActiveCount
                />
              </CardContent>
            </Card>

            {/* Results */}
            {filteredUnits.length === 0 ? (
              <EmptyState
                icon={<Car className="h-12 w-12" />}
                title="No se encontraron espacios"
                description="No hay garajes o trasteros que coincidan con los criterios de búsqueda."
                actions={[
                  {
                    label: 'Añadir Garaje/Trastero',
                    onClick: () => router.push('/garajes-trasteros/nuevo'),
                    variant: 'default',
                  },
                  {
                    label: 'Limpiar Filtros',
                    onClick: () => {
                      setFilterValues({
                        search: '',
                        tipo: 'all',
                        estado: 'all',
                        superficie_min: '',
                        superficie_max: '',
                        precio_min: '',
                        precio_max: '',
                      });
                    },
                    variant: 'outline',
                  },
                ]}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUnits.map((unit) => {
                  const statusBadge = getStatusBadge(unit.estado);
                  return (
                    <Card key={unit.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(unit.tipo)}
                            <div>
                              <CardTitle className="text-lg">{unit.numero}</CardTitle>
                              <CardDescription className="capitalize">{unit.tipo}</CardDescription>
                            </div>
                          </div>
                          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>{unit.building.nombre}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{unit.building.direccion}</span>
                        </div>
                        {unit.planta !== null && (
                          <div className="text-sm text-muted-foreground">
                            Planta: {unit.planta}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Superficie:</span>
                          <span>{unit.superficie} m²</span>
                        </div>
                        <div className="flex items-center gap-2 text-lg font-bold text-primary">
                          <Euro className="h-5 w-5" />
                          {unit.rentaMensual.toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                          })}
                          <span className="text-sm font-normal text-muted-foreground">/mes</span>
                        </div>
                        {unit.tenant && (
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Ocupado por:</span> {unit.tenant.nombreCompleto}
                          </div>
                        )}
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/unidades/${unit.id}/editar`)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(unit.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </AuthenticatedLayout>
  );
}
