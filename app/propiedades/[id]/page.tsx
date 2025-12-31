'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import {
  Home,
  Building2,
  MapPin,
  Euro,
  Bed,
  Bath,
  Maximize2,
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Calendar,
  FileText,
  TrendingUp,
  Check,
  X as XIcon,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { PropertyMap } from '@/components/property/PropertyMap';
import { ValuationCard } from '@/components/property/ValuationCard';

interface PropertyDetails {
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
  aireAcondicionado: boolean;
  calefaccion: boolean;
  terraza: boolean;
  balcon: boolean;
  amueblado: boolean;
  imagenes?: string[];
  tourVirtual?: string;
  createdAt: string;
  updatedAt: string;
  building: {
    id: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    codigoPostal?: string;
  };
  tenant?: {
    id: string;
    nombreCompleto: string;
    email: string;
    telefono?: string;
  };
  contracts?: Array<{
    id: string;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
  }>;
}

export default function PropiedadDetallesPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [property, setProperty] = useState<PropertyDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const propertyId = params?.id as string;

  // Redirect si no autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar propiedad
  useEffect(() => {
    const fetchProperty = async () => {
      if (status !== 'authenticated' || !propertyId) return;

      try {
        const response = await fetch(`/api/units/${propertyId}`);
        if (response.ok) {
          const data = await response.json();
          setProperty(data);
        } else if (response.status === 404) {
          toast.error('Propiedad no encontrada');
          router.push('/propiedades');
        } else {
          toast.error('Error al cargar la propiedad');
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        toast.error('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [status, propertyId, router]);

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      ocupada: { variant: 'default', label: 'Ocupada' },
      disponible: { variant: 'secondary', label: 'Disponible' },
      en_mantenimiento: { variant: 'outline', label: 'Mantenimiento' },
    };
    return badges[estado] || { variant: 'default', label: estado };
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

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-96 w-full" />
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session || !property) return null;

  const estadoBadge = getEstadoBadge(property.estado);

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/propiedades')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
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
                <BreadcrumbLink href="/propiedades">Propiedades</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {property.building.nombre} - {property.numero}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {property.building.nombre} - Unidad {property.numero}
              </h1>
              <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {property.building.direccion}, {property.building.ciudad}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{getTipoLabel(property.tipo)}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/propiedades/${property.id}/editar`)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => toast.error('Función en desarrollo')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galería de Imágenes */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-video bg-muted">
                  {property.imagenes && property.imagenes.length > 0 ? (
                    <Image
                      src={property.imagenes[0]}
                      alt={`Propiedad ${property.numero}`}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-16 w-16 mb-2" />
                      <p className="text-sm">Sin imágenes disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Características Principales */}
            <Card>
              <CardHeader>
                <CardTitle>Características Principales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Maximize2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Superficie Total</p>
                      <p className="text-2xl font-bold">{property.superficie}m²</p>
                    </div>
                  </div>

                  {property.superficieUtil && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Maximize2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Superficie Útil</p>
                        <p className="text-2xl font-bold">{property.superficieUtil}m²</p>
                      </div>
                    </div>
                  )}

                  {property.habitaciones && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Bed className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Habitaciones</p>
                        <p className="text-2xl font-bold">{property.habitaciones}</p>
                      </div>
                    </div>
                  )}

                  {property.banos && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Bath className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Baños</p>
                        <p className="text-2xl font-bold">{property.banos}</p>
                      </div>
                    </div>
                  )}

                  {property.planta !== null && property.planta !== undefined && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Planta</p>
                        <p className="text-2xl font-bold">{property.planta}</p>
                      </div>
                    </div>
                  )}

                  {property.orientacion && (
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Orientación</p>
                        <p className="text-2xl font-bold">{property.orientacion}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Características Adicionales */}
            <Card>
              <CardHeader>
                <CardTitle>Equipamiento y Comodidades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { label: 'Aire Acondicionado', value: property.aireAcondicionado },
                    { label: 'Calefacción', value: property.calefaccion },
                    { label: 'Terraza', value: property.terraza },
                    { label: 'Balcón', value: property.balcon },
                    { label: 'Amueblado', value: property.amueblado },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      {item.value ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <XIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span className={item.value ? '' : 'text-muted-foreground'}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tour Virtual */}
            {property.tourVirtual && (
              <Card>
                <CardHeader>
                  <CardTitle>Tour Virtual</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(property.tourVirtual, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Tour Virtual 360°
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna Lateral */}
          <div className="space-y-6">
            {/* Precio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Información Económica
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Renta Mensual</p>
                  <p className="text-4xl font-bold text-green-600">
                    €{property.rentaMensual.toLocaleString('es-ES')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    €{(property.rentaMensual / property.superficie).toFixed(2)}/m²
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Inquilino Actual */}
            {property.tenant && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Inquilino Actual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold">
                        {property.tenant.nombreCompleto.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{property.tenant.nombreCompleto}</p>
                      <p className="text-sm text-muted-foreground">{property.tenant.email}</p>
                      {property.tenant.telefono && (
                        <p className="text-sm text-muted-foreground">{property.tenant.telefono}</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/inquilinos/${property.tenant?.id}`)}
                  >
                    Ver Perfil Completo
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Acciones Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/contratos/nuevo?unitId=${property.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Crear Contrato
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/mantenimiento/nuevo?unitId=${property.id}`)}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Nueva Incidencia
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => toast.info('Próximamente: Análisis de rentabilidad')}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Análisis de Rentabilidad
                </Button>
              </CardContent>
            </Card>

            {/* Información del Edificio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información del Edificio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-semibold">{property.building.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-semibold">{property.building.direccion}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ciudad</p>
                  <p className="font-semibold">{property.building.ciudad}</p>
                </div>
                {property.building.codigoPostal && (
                  <div>
                    <p className="text-sm text-muted-foreground">Código Postal</p>
                    <p className="font-semibold">{property.building.codigoPostal}</p>
                  </div>
                )}
                <Separator className="my-3" />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/edificios/${property.building.id}`)}
                >
                  Ver Edificio Completo
                </Button>
              </CardContent>
            </Card>

            {/* Mapa de Ubicación */}
            <PropertyMap
              address={property.building.direccion}
              city={property.building.ciudad}
              showNearbyPoints={true}
            />

            {/* Valoración con IA */}
            <ValuationCard propertyId={property.id} />

            {/* Metadatos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Metadatos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <p>Creada: {new Date(property.createdAt).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <p>
                    Última actualización: {new Date(property.updatedAt).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-xs">ID: {property.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
