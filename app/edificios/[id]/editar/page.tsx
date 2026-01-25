'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Building2, Home, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import logger from '@/lib/logger';

interface BuildingData {
  id: string;
  nombre: string;
  direccion: string;
  tipo: string;
  anoConstructor: number;
  numeroUnidades: number;
  estadoConservacion?: string;
  certificadoEnergetico?: string;
  ascensor: boolean;
  garaje: boolean;
  trastero: boolean;
  piscina: boolean;
  jardin: boolean;
  gastosComunidad?: number;
  ibiAnual?: number;
}

export default function EditarEdificioPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    tipo: 'residencial',
    anoConstructor: '',
    numeroUnidades: '',
    estadoConservacion: '',
    certificadoEnergetico: '',
    ascensor: false,
    garaje: false,
    trastero: false,
    piscina: false,
    jardin: false,
    gastosComunidad: '',
    ibiAnual: '',
  });

  const buildingId = params?.id as string;

  // Redirect si no autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Cargar datos del edificio
  useEffect(() => {
    const fetchBuilding = async () => {
      if (status !== 'authenticated' || !buildingId) return;

      try {
        const response = await fetch(`/api/buildings/${buildingId}`);
        if (response.ok) {
          const data: BuildingData = await response.json();
          setFormData({
            nombre: data.nombre || '',
            direccion: data.direccion || '',
            tipo: data.tipo || 'residencial',
            anoConstructor: data.anoConstructor?.toString() || '',
            numeroUnidades: data.numeroUnidades?.toString() || '',
            estadoConservacion: data.estadoConservacion || '',
            certificadoEnergetico: data.certificadoEnergetico || '',
            ascensor: data.ascensor || false,
            garaje: data.garaje || false,
            trastero: data.trastero || false,
            piscina: data.piscina || false,
            jardin: data.jardin || false,
            gastosComunidad: data.gastosComunidad?.toString() || '',
            ibiAnual: data.ibiAnual?.toString() || '',
          });
        } else if (response.status === 404) {
          toast.error('Edificio no encontrado');
          router.push('/edificios');
        } else {
          toast.error('Error al cargar el edificio');
        }
      } catch (error) {
        console.error('Error fetching building:', error);
        toast.error('Error de conexión');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilding();
  }, [status, buildingId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          direccion: formData.direccion,
          tipo: formData.tipo,
          anoConstructor: parseInt(formData.anoConstructor),
          numeroUnidades: parseInt(formData.numeroUnidades),
          estadoConservacion: formData.estadoConservacion || null,
          certificadoEnergetico: formData.certificadoEnergetico || null,
          ascensor: formData.ascensor,
          garaje: formData.garaje,
          trastero: formData.trastero,
          piscina: formData.piscina,
          jardin: formData.jardin,
          gastosComunidad: formData.gastosComunidad ? parseFloat(formData.gastosComunidad) : null,
          ibiAnual: formData.ibiAnual ? parseFloat(formData.ibiAnual) : null,
        }),
      });

      if (response.ok) {
        toast.success('Edificio actualizado correctamente');
        router.push(`/edificios/${buildingId}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar el edificio');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar el edificio');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({ ...formData, [name]: checked });
  };

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
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
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Botón Volver y Breadcrumbs */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/edificios/${buildingId}`)}
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
                <BreadcrumbLink href="/edificios">Edificios</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={`/edificios/${buildingId}`}>{formData.nombre}</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Editar</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Edificio</h1>
            <p className="text-muted-foreground">Modifica los datos del edificio</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>Datos principales del edificio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Edificio *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Torre Vista Hermosa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Edificio *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residencial">Residencial</SelectItem>
                      <SelectItem value="comercial">Comercial</SelectItem>
                      <SelectItem value="mixto">Mixto</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección Completa *</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  placeholder="Calle, número, ciudad, código postal"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="anoConstructor">Año de Construcción *</Label>
                  <Input
                    id="anoConstructor"
                    name="anoConstructor"
                    type="number"
                    value={formData.anoConstructor}
                    onChange={handleChange}
                    required
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroUnidades">Número de Unidades *</Label>
                  <Input
                    id="numeroUnidades"
                    name="numeroUnidades"
                    type="number"
                    value={formData.numeroUnidades}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Técnica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Técnica</CardTitle>
              <CardDescription>Estado y certificaciones del edificio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="estadoConservacion">Estado de Conservación</Label>
                  <Select
                    value={formData.estadoConservacion}
                    onValueChange={(value) => setFormData({ ...formData, estadoConservacion: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excelente">Excelente</SelectItem>
                      <SelectItem value="bueno">Bueno</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="necesita_reformas">Necesita Reformas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificadoEnergetico">Certificado Energético</Label>
                  <Select
                    value={formData.certificadoEnergetico}
                    onValueChange={(value) => setFormData({ ...formData, certificadoEnergetico: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                      <SelectItem value="G">G</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Servicios y Equipamiento */}
          <Card>
            <CardHeader>
              <CardTitle>Servicios y Equipamiento</CardTitle>
              <CardDescription>Instalaciones disponibles en el edificio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="ascensor"
                    checked={formData.ascensor}
                    onCheckedChange={(checked) => handleCheckboxChange('ascensor', checked as boolean)}
                  />
                  <Label htmlFor="ascensor" className="cursor-pointer">Ascensor</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="garaje"
                    checked={formData.garaje}
                    onCheckedChange={(checked) => handleCheckboxChange('garaje', checked as boolean)}
                  />
                  <Label htmlFor="garaje" className="cursor-pointer">Garaje</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="trastero"
                    checked={formData.trastero}
                    onCheckedChange={(checked) => handleCheckboxChange('trastero', checked as boolean)}
                  />
                  <Label htmlFor="trastero" className="cursor-pointer">Trastero</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="piscina"
                    checked={formData.piscina}
                    onCheckedChange={(checked) => handleCheckboxChange('piscina', checked as boolean)}
                  />
                  <Label htmlFor="piscina" className="cursor-pointer">Piscina</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="jardin"
                    checked={formData.jardin}
                    onCheckedChange={(checked) => handleCheckboxChange('jardin', checked as boolean)}
                  />
                  <Label htmlFor="jardin" className="cursor-pointer">Jardín</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Económica */}
          <Card>
            <CardHeader>
              <CardTitle>Información Económica</CardTitle>
              <CardDescription>Gastos e impuestos del edificio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gastosComunidad">Gastos de Comunidad (€/mes)</Label>
                  <Input
                    id="gastosComunidad"
                    name="gastosComunidad"
                    type="number"
                    value={formData.gastosComunidad}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ibiAnual">IBI Anual (€)</Label>
                  <Input
                    id="ibiAnual"
                    name="ibiAnual"
                    type="number"
                    value={formData.ibiAnual}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/edificios/${buildingId}`)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
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
