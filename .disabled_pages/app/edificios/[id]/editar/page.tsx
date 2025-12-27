'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Building2, Home, ArrowLeft, Save, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';
import { LoadingState } from '@/components/ui/loading-state';
import { MobileFormWizard, FormStep } from '@/components/ui/mobile-form-wizard';

export default function EditarEdificioPage() {
  const router = useRouter();
  const params = useParams();
  const buildingId = params?.id as string;
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    tipo: 'residencial',
    anoConstructor: new Date().getFullYear().toString(),
    numeroUnidades: '0',
  });

  // Cargar datos existentes del edificio
  useEffect(() => {
    const fetchBuilding = async () => {
      if (!buildingId) return;

      try {
        setIsFetchingData(true);
        const response = await fetch(`/api/buildings/${buildingId}`);
        
        if (!response.ok) {
          throw new Error('Error al cargar el edificio');
        }

        const building = await response.json();
        
        setFormData({
          nombre: building.nombre || '',
          direccion: building.direccion || '',
          tipo: building.tipo || 'residencial',
          anoConstructor: building.anoConstructor?.toString() || new Date().getFullYear().toString(),
          numeroUnidades: building.numeroUnidades?.toString() || '0',
        });
      } catch (error) {
        logger.error('Error fetching building:', error);
        toast.error('Error al cargar los datos del edificio');
        router.push('/edificios');
      } finally {
        setIsFetchingData(false);
      }
    };

    if (session) {
      fetchBuilding();
    }
  }, [buildingId, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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
        }),
      });

      if (response.ok) {
        toast.success('Edificio actualizado correctamente');
        router.push('/edificios');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al actualizar el edificio');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al actualizar el edificio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (status === 'loading' || isFetchingData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-bg">
        <LoadingState message="Cargando datos del edificio..." size="lg" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <AuthenticatedLayout>
          <div className="container mx-auto p-6 space-y-6">
            {/* Botón Volver y Breadcrumbs */}
            <div className="flex items-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/edificios')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Edificios
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
                    <BreadcrumbPage>Editar Edificio</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Pencil className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Editar Edificio</h1>
                <p className="text-muted-foreground">Actualiza la información del edificio</p>
              </div>
            </div>

            {/* Formulario con Wizard para móvil */}
            <form onSubmit={handleSubmit}>
              <MobileFormWizard
                steps={[
                  {
                    id: 'basic',
                    title: 'Información Básica',
                    description: 'Identifica el edificio y su ubicación',
                    fields: (
                      <div className="space-y-4">
                        {/* Nombre */}
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

                        {/* Dirección */}
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
                      </div>
                    ),
                  },
                  {
                    id: 'characteristics',
                    title: 'Características',
                    description: 'Define las propiedades del edificio',
                    fields: (
                      <div className="space-y-4">
                        {/* Tipo */}
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

                        {/* Año de Construcción */}
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
                            placeholder="2020"
                          />
                        </div>

                        {/* Número de Unidades */}
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
                            placeholder="12"
                          />
                        </div>

                        {/* Resumen */}
                        {formData.nombre && formData.direccion && (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                            <h4 className="font-medium text-sm">Resumen del Edificio</h4>
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="text-muted-foreground">Nombre:</span> {formData.nombre}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Dirección:</span>{' '}
                                {formData.direccion}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Tipo:</span> {formData.tipo}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Año:</span>{' '}
                                {formData.anoConstructor}
                              </p>
                              {formData.numeroUnidades !== '0' && (
                                <p>
                                  <span className="text-muted-foreground">Unidades:</span>{' '}
                                  {formData.numeroUnidades}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]}
                submitButton={
                  <div className="flex gap-3">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/edificios')}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                }
              />
            </form>
          </div>
        </AuthenticatedLayout>
  );
}
