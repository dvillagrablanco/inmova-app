'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home,
  ArrowLeft,
  Building2,
  Plus,
  Search,
  Users,
  Bed,
  Euro,
} from 'lucide-react';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface ColivingProperty {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  totalHabitaciones: number;
  habitacionesOcupadas: number;
  precioMedioHabitacion: number;
  amenities: string[];
  estado: string;
}

export default function ColivingPropertiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [properties, setProperties] = useState<ColivingProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchProperties();
    }
  }, [status, router]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/coliving/properties');
      if (res.ok) {
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : data.properties || []);
      }
    } catch (error) {
      logger.error('Error fetching coliving properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProperties = properties.filter((p) =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRooms = properties.reduce((sum, p) => sum + (p.totalHabitaciones || 0), 0);
  const occupiedRooms = properties.reduce((sum, p) => sum + (p.habitacionesOcupadas || 0), 0);
  const avgPrice = properties.length > 0
    ? properties.reduce((sum, p) => sum + (p.precioMedioHabitacion || 0), 0) / properties.length
    : 0;

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando propiedades coliving...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">
                    <Home className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/coliving">Coliving</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Propiedades</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="text-3xl font-bold mt-2">Propiedades Coliving</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus espacios de coliving y habitaciones
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/coliving')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button onClick={() => router.push('/propiedades/crear?tipo=coliving')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Propiedad
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Propiedades</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{properties.length}</div>
              <p className="text-xs text-muted-foreground">Espacios coliving</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Habitaciones</CardTitle>
              <Bed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">{occupiedRooms} ocupadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ocupación</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Tasa de ocupación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Precio Medio</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{avgPrice.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">Por habitación/mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, dirección o ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Properties List */}
        {filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay propiedades coliving</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm
                  ? 'No se encontraron resultados con los filtros aplicados'
                  : 'Comienza creando tu primera propiedad coliving'}
              </p>
              <Button onClick={() => router.push('/propiedades/crear?tipo=coliving')}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Propiedad Coliving
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.map((property) => (
              <Card key={property.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{property.nombre}</CardTitle>
                      <CardDescription className="mt-1">
                        <Building2 className="h-3 w-3 inline mr-1" />
                        {property.direccion}, {property.ciudad}
                      </CardDescription>
                    </div>
                    <Badge variant={property.estado === 'activo' ? 'default' : 'secondary'}>
                      {property.estado === 'activo' ? 'Activo' : property.estado}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Habitaciones</p>
                        <p className="font-semibold">{property.totalHabitaciones}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ocupadas</p>
                        <p className="font-semibold">{property.habitacionesOcupadas}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <p className="text-muted-foreground text-sm">Precio medio</p>
                      <p className="text-xl font-bold">€{property.precioMedioHabitacion}/mes</p>
                    </div>

                    {property.amenities && property.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {property.amenities.slice(0, 3).map((amenity, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {property.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{property.amenities.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/coliving/propiedades/${property.id}`)}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/room-rental?propertyId=${property.id}`)}
                      >
                        Habitaciones
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
