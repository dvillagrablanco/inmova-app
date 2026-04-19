// @ts-nocheck
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
  ExternalLink,
  Sparkles,
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
import { PropertyMap } from '@/components/property/PropertyMap';
import { ValuationCard } from '@/components/property/ValuationCard';
import { DeletePropertyDialog } from '@/components/property/DeletePropertyDialog';
import { InsuranceCoverageCard } from '@/components/property/InsuranceCoverageCard';
import { CatastroPlanoViewer } from '@/components/property/CatastroPlanoViewer';
import { AutoFillDimensionsButton } from '@/components/property/AutoFillDimensionsButton';
import { EditableMainCharacteristics } from '@/components/property/EditableMainCharacteristics';
import { OwnerCompanyEditor } from '@/components/property/OwnerCompanyEditor';
import { PhotoGallery } from '@/components/ui/photo-gallery';
import { EntityDocuments } from '@/components/ui/entity-documents';
import { cn } from '@/lib/utils';

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
  referenciaCatastral?: string;
  rentaMensual: number;
  gastosComunidad?: number;
  ibiAnual?: number;
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
    referenciaCatastral?: string;
    latitud?: number;
    longitud?: number;
  };
  tenant?: {
    id: string;
    nombreCompleto: string;
    empresa?: string | null;
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
  const [images, setImages] = useState<string[]>([]);

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
          setImages(data?.imagenes || []);
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

  const handleImagesChange = async (newImages: string[]) => {
    setImages(newImages);
    try {
      const response = await fetch(`/api/units/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagenes: newImages }),
      });
      if (!response.ok) throw new Error('Error al guardar las fotos');
      setProperty((prev) => (prev ? { ...prev, imagenes: newImages } : null));
      toast.success('Fotos actualizadas');
    } catch {
      toast.error('Error al guardar las fotos');
      setImages(property?.imagenes || []);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { variant: any; label: string; className: string }> = {
      ocupada: {
        variant: 'default',
        label: 'Ocupada',
        className: 'bg-green-600 text-white border-green-600 hover:bg-green-700',
      },
      disponible: {
        variant: 'default',
        label: 'Disponible',
        className: 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700',
      },
      en_mantenimiento: {
        variant: 'default',
        label: 'Mantenimiento',
        className: 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600',
      },
    };
    return (
      badges[estado] || {
        variant: 'default',
        label: estado,
        className: 'bg-gray-600 text-white border-gray-600',
      }
    );
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
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/propiedades')}
            className="gap-2 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
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
                <BreadcrumbPage className="truncate max-w-[200px]">
                  {property.building.nombre} - {property.numero}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight break-words">
                {property.building.nombre} - {property.numero}
              </h1>
              <Badge variant={estadoBadge.variant} className={estadoBadge.className}>
                {estadoBadge.label}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="break-words">
                {property.building.direccion}, {property.building.ciudad}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm text-muted-foreground">{getTipoLabel(property.tipo)}</p>
              {(property.referenciaCatastral || property.building.referenciaCatastral) && (
                <Badge
                  variant="outline"
                  className="text-xs font-mono bg-amber-50 text-amber-800 border-amber-200"
                >
                  RC: {property.referenciaCatastral || property.building.referenciaCatastral}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/propiedades/${property.id}/editar`)}
            >
              <Edit className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <DeletePropertyDialog
              propertyId={property.id}
              propertyName={`${property.building.nombre} - ${property.numero}`}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Columna Principal */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Galería de Imágenes */}
            <PhotoGallery
              images={images}
              onImagesChange={handleImagesChange}
              folder="properties"
              title="Fotos de la propiedad"
              description="Sube fotos para documentar el estado de la propiedad"
              editable={true}
            />

            {/* Documentos de la Unidad */}
            <EntityDocuments
              entityType="unit"
              entityId={propertyId}
              buildingId={property.building?.id}
            />

            {/* Características Principales (editable inline) */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <CardTitle>Características Principales</CardTitle>
                  <AutoFillDimensionsButton unitId={property.id} />
                </div>
              </CardHeader>
              <CardContent>
                <EditableMainCharacteristics
                  unitId={property.id}
                  initialData={{
                    superficie: property.superficie,
                    superficieUtil: property.superficieUtil,
                    habitaciones: property.habitaciones,
                    banos: property.banos,
                    planta: property.planta,
                    orientacion: property.orientacion,
                    aireAcondicionado: property.aireAcondicionado,
                    calefaccion: property.calefaccion,
                    terraza: property.terraza,
                    balcon: property.balcon,
                    amueblado: property.amueblado,
                    rentaMensual: property.rentaMensual,
                    gastosComunidad: property.gastosComunidad,
                    ibiAnual: property.ibiAnual,
                  }}
                />
              </CardContent>
            </Card>

            {/* Sociedad propietaria (relevante en grupos de empresas) */}
            <OwnerCompanyEditor
              unitId={property.id}
              initialOwnerCompanyId={(property as any).ownerCompanyId || null}
              initialOwnerCompanyName={(property as any).ownerCompany?.nombre || null}
              buildingCompanyId={(property as any).building?.companyId || null}
              buildingCompanyName={(property as any).building?.company?.nombre || null}
            />

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

            {/* Historial / Timeline */}
            {property.contracts && property.contracts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Historial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-6 space-y-4">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
                    {property.contracts
                      .sort(
                        (a, b) =>
                          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
                      )
                      .map((contract) => (
                        <div key={contract.id} className="relative">
                          <div
                            className={`absolute -left-4 top-1 w-3 h-3 rounded-full border-2 border-white ${
                              contract.estado === 'activo' ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={contract.estado === 'activo' ? 'default' : 'secondary'}
                                className={
                                  contract.estado === 'activo' ? 'bg-green-600 text-white' : ''
                                }
                              >
                                {contract.estado}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(contract.fechaInicio).toLocaleDateString('es-ES')} —{' '}
                                {new Date(contract.fechaFin).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Columna Lateral */}
          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-6 lg:self-start">
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
                {(property.gastosComunidad || property.ibiAnual) && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {property.gastosComunidad != null && property.gastosComunidad > 0 && (
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-xs text-muted-foreground">Comunidad</p>
                        <p className="text-lg font-bold text-blue-600">
                          €{property.gastosComunidad.toLocaleString('es-ES')}/mes
                        </p>
                      </div>
                    )}
                    {property.ibiAnual != null && property.ibiAnual > 0 && (
                      <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                        <p className="text-xs text-muted-foreground">IBI Anual</p>
                        <p className="text-lg font-bold text-amber-600">
                          €{property.ibiAnual.toLocaleString('es-ES')}/año
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cobertura de Seguro */}
            <InsuranceCoverageCard unitId={property.id} />

            {/* Plano Catastral */}
            <CatastroPlanoViewer
              referenciaCatastral={
                property.referenciaCatastral || property.building.referenciaCatastral
              }
              latitud={property.building.latitud}
              longitud={property.building.longitud}
            />

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
                        {(property.tenant.empresa || property.tenant.nombreCompleto).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {property.tenant.empresa || property.tenant.nombreCompleto}
                      </p>
                      {property.tenant.empresa && (
                        <p className="text-xs text-muted-foreground">
                          Contacto: {property.tenant.nombreCompleto}
                        </p>
                      )}
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
                  onClick={() => router.push(`/valoracion-ia?unitId=${property.id}`)}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Valoración con IA
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    const renta = property?.rentaMensual || property?.price || 0;
                    if (renta > 0) {
                      const ingresosAnuales = renta * 12;
                      const gastosEstimados = ingresosAnuales * 0.15;
                      const beneficioNeto = ingresosAnuales - gastosEstimados;
                      const sup = property?.superficie || 1;
                      const precioM2Madrid = 4500;
                      const valorEstimado = sup * precioM2Madrid;
                      const roi = ((beneficioNeto / valorEstimado) * 100).toFixed(2);
                      const rentaM2 = (renta / sup).toFixed(2);

                      toast.success(`ROI estimado: ${roi}% anual`, {
                        description: `Renta: ${renta.toLocaleString('es-ES')}€/mes | ${rentaM2}€/m² | Ingreso anual: ${ingresosAnuales.toLocaleString('es-ES')}€ | Valor est.: ${valorEstimado.toLocaleString('es-ES')}€`,
                        duration: 8000,
                      });
                    } else {
                      toast.info('Sin datos de renta para calcular rentabilidad', {
                        description: 'Asigna una renta mensual al inmueble para ver el análisis.',
                      });
                    }
                  }}
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
                {property.referenciaCatastral && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ref. Catastral (Unidad)</p>
                    <p className="font-mono text-xs sm:text-sm font-semibold break-all">
                      {property.referenciaCatastral}
                    </p>
                  </div>
                )}
                {!property.referenciaCatastral && property.building.referenciaCatastral && (
                  <div>
                    <p className="text-sm text-muted-foreground">Ref. Catastral (Edificio)</p>
                    <p className="font-mono text-xs sm:text-sm font-semibold break-all">
                      {property.building.referenciaCatastral}
                    </p>
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
              address={property.building?.direccion || ''}
              city={property.building?.ciudad || ''}
              latitude={property.building?.latitud ?? undefined}
              longitude={property.building?.longitud ?? undefined}
              showNearbyPoints={true}
              buildingId={property.building?.id}
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
