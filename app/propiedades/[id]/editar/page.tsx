'use client';

import { useState, useEffect } from 'react';
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
  Save,
  Info,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { PhotoUploader } from '@/components/property/PhotoUploader';

interface Building {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
}

export default function EditarPropiedadPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);

  const propertyId = params?.id as string;

  // Datos del formulario
  const [formData, setFormData] = useState({
    numero: '',
    buildingId: '',
    tipo: 'vivienda',
    estado: 'disponible',
    superficie: '',
    superficieUtil: '',
    habitaciones: '',
    banos: '',
    planta: '',
    orientacion: '',
    rentaMensual: '',
    
    // Características
    aireAcondicionado: false,
    calefaccion: false,
    terraza: false,
    balcon: false,
    amueblado: false,
    
    // Opcional
    tourVirtual: '',
  });

  // Redirect si no autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar edificios y propiedad
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated' || !propertyId) return;

      try {
        // Cargar edificios
        const buildingsResponse = await fetch('/api/buildings');
        if (buildingsResponse.ok) {
          const buildingsData = await buildingsResponse.json();
          setBuildings(buildingsData);
        }

        // Cargar propiedad existente
        const propertyResponse = await fetch(`/api/units/${propertyId}`);
        if (propertyResponse.ok) {
          const property = await propertyResponse.json();
          
          // Pre-llenar formulario
          setFormData({
            numero: property.numero || '',
            buildingId: property.buildingId || '',
            tipo: property.tipo || 'vivienda',
            estado: property.estado || 'disponible',
            superficie: property.superficie?.toString() || '',
            superficieUtil: property.superficieUtil?.toString() || '',
            habitaciones: property.habitaciones?.toString() || '',
            banos: property.banos?.toString() || '',
            planta: property.planta?.toString() || '',
            orientacion: property.orientacion || '',
            rentaMensual: property.rentaMensual?.toString() || '',
            aireAcondicionado: property.aireAcondicionado || false,
            calefaccion: property.calefaccion || false,
            terraza: property.terraza || false,
            balcon: property.balcon || false,
            amueblado: property.amueblado || false,
            tourVirtual: property.tourVirtual || '',
          });
          
          // Cargar fotos existentes
          if (property.imagenes && Array.isArray(property.imagenes)) {
            setPhotos(property.imagenes);
          }
        } else if (propertyResponse.status === 404) {
          toast.error('Propiedad no encontrada');
          router.push('/propiedades');
        } else {
          toast.error('Error al cargar la propiedad');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error de conexión');
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [status, propertyId, router]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const validateForm = () => {
    if (!formData.numero.trim()) {
      toast.error('El número de unidad es obligatorio');
      return false;
    }
    if (!formData.buildingId) {
      toast.error('Debes seleccionar un edificio');
      return false;
    }
    if (!formData.superficie || parseFloat(formData.superficie) <= 0) {
      toast.error('La superficie debe ser mayor a 0');
      return false;
    }
    if (!formData.rentaMensual || parseFloat(formData.rentaMensual) <= 0) {
      toast.error('La renta mensual debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload = {
        numero: formData.numero.trim(),
        buildingId: formData.buildingId,
        tipo: formData.tipo,
        estado: formData.estado,
        superficie: parseFloat(formData.superficie),
        superficieUtil: formData.superficieUtil ? parseFloat(formData.superficieUtil) : null,
        habitaciones: formData.habitaciones ? parseInt(formData.habitaciones) : null,
        banos: formData.banos ? parseInt(formData.banos) : null,
        planta: formData.planta ? parseInt(formData.planta) : null,
        orientacion: formData.orientacion.trim() || null,
        rentaMensual: parseFloat(formData.rentaMensual),
        aireAcondicionado: formData.aireAcondicionado,
        calefaccion: formData.calefaccion,
        terraza: formData.terraza,
        balcon: formData.balcon,
        amueblado: formData.amueblado,
        tourVirtual: formData.tourVirtual.trim() || null,
      };

      const response = await fetch(`/api/units/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success('¡Propiedad actualizada exitosamente!');
        router.push(`/propiedades/${propertyId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar la propiedad');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || loadingData) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/propiedades/${propertyId}`)}
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
                <BreadcrumbLink href={`/propiedades/${propertyId}`}>
                  Detalles
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Editar</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Propiedad</h1>
          <p className="text-muted-foreground">
            Actualiza la información de la unidad inmobiliaria
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numero">
                    Número de Unidad <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="numero"
                    placeholder="ej: 1A, 2B, 301..."
                    value={formData.numero}
                    onChange={(e) => handleInputChange('numero', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buildingId">
                    Edificio <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.buildingId}
                    onValueChange={(value) => handleInputChange('buildingId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un edificio" />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map((building) => (
                        <SelectItem key={building.id} value={building.id}>
                          {building.nombre} - {building.ciudad}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Propiedad</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleInputChange('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vivienda">Vivienda</SelectItem>
                      <SelectItem value="local">Local Comercial</SelectItem>
                      <SelectItem value="oficina">Oficina</SelectItem>
                      <SelectItem value="garaje">Garaje</SelectItem>
                      <SelectItem value="trastero">Trastero</SelectItem>
                      <SelectItem value="nave_industrial">Nave Industrial</SelectItem>
                      <SelectItem value="coworking_space">Coworking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => handleInputChange('estado', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="ocupada">Ocupada</SelectItem>
                      <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características Físicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Maximize2 className="h-5 w-5" />
                Características Físicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="superficie">
                    Superficie Total (m²) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="superficie"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ej: 85.5"
                    value={formData.superficie}
                    onChange={(e) => handleInputChange('superficie', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="superficieUtil">Superficie Útil (m²)</Label>
                  <Input
                    id="superficieUtil"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ej: 75"
                    value={formData.superficieUtil}
                    onChange={(e) => handleInputChange('superficieUtil', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="planta">Planta</Label>
                  <Input
                    id="planta"
                    type="number"
                    placeholder="ej: 3"
                    value={formData.planta}
                    onChange={(e) => handleInputChange('planta', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="habitaciones" className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    Habitaciones
                  </Label>
                  <Input
                    id="habitaciones"
                    type="number"
                    min="0"
                    placeholder="ej: 3"
                    value={formData.habitaciones}
                    onChange={(e) => handleInputChange('habitaciones', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banos" className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    Baños
                  </Label>
                  <Input
                    id="banos"
                    type="number"
                    min="0"
                    placeholder="ej: 2"
                    value={formData.banos}
                    onChange={(e) => handleInputChange('banos', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientacion">Orientación</Label>
                  <Select
                    value={formData.orientacion || undefined}
                    onValueChange={(value) => handleInputChange('orientacion', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Norte">Norte</SelectItem>
                      <SelectItem value="Sur">Sur</SelectItem>
                      <SelectItem value="Este">Este</SelectItem>
                      <SelectItem value="Oeste">Oeste</SelectItem>
                      <SelectItem value="Noreste">Noreste</SelectItem>
                      <SelectItem value="Noroeste">Noroeste</SelectItem>
                      <SelectItem value="Sureste">Sureste</SelectItem>
                      <SelectItem value="Suroeste">Suroeste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Características Adicionales */}
              <div className="pt-4 border-t">
                <Label className="mb-3 block">Características Adicionales</Label>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="aireAcondicionado"
                      checked={formData.aireAcondicionado}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('aireAcondicionado', checked as boolean)
                      }
                    />
                    <label
                      htmlFor="aireAcondicionado"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Aire Acondicionado
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="calefaccion"
                      checked={formData.calefaccion}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('calefaccion', checked as boolean)
                      }
                    />
                    <label
                      htmlFor="calefaccion"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Calefacción
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terraza"
                      checked={formData.terraza}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('terraza', checked as boolean)
                      }
                    />
                    <label
                      htmlFor="terraza"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Terraza
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="balcon"
                      checked={formData.balcon}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('balcon', checked as boolean)
                      }
                    />
                    <label
                      htmlFor="balcon"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Balcón
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="amueblado"
                      checked={formData.amueblado}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange('amueblado', checked as boolean)
                      }
                    />
                    <label
                      htmlFor="amueblado"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Amueblado
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Económica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Información Económica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="rentaMensual">
                  Renta Mensual (€) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="rentaMensual"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="ej: 1200.00"
                  value={formData.rentaMensual}
                  onChange={(e) => handleInputChange('rentaMensual', e.target.value)}
                  required
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Información Adicional */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Información Adicional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tourVirtual">Tour Virtual (URL)</Label>
                <Input
                  id="tourVirtual"
                  type="url"
                  placeholder="https://example.com/tour-virtual"
                  value={formData.tourVirtual}
                  onChange={(e) => handleInputChange('tourVirtual', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fotos de la Propiedad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Fotos de la Propiedad
              </CardTitle>
              <CardDescription>
                Sube hasta 10 fotos de la propiedad. La primera será la foto principal.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PhotoUploader
                propertyId={propertyId}
                existingPhotos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={10}
              />
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/propiedades/${propertyId}`)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
