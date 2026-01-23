'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Home as HomeIcon, ArrowLeft, Save, Building2, Users, Info, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { toast } from 'sonner';
import logger, { logError } from '@/lib/logger';
import { BackButton } from '@/components/ui/back-button';
import { MobileFormWizard, FormStep } from '@/components/ui/mobile-form-wizard';

// AI Components - Dynamic imports for client-side only
const FormAIAssistant = dynamic(
  () => import('@/components/ai/FormAIAssistant').then(mod => ({ default: mod.FormAIAssistant })),
  { ssr: false }
);

const AIDocumentAssistant = dynamic(
  () => import('@/components/ai/AIDocumentAssistant').then(mod => ({ default: mod.AIDocumentAssistant })),
  { ssr: false }
);

interface Building {
  id: string;
  nombre: string;
}

export default function NuevaUnidadPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};
  const [isLoading, setIsLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [formData, setFormData] = useState({
    numero: '',
    edificioId: '',
    tipo: 'apartamento',
    modoAlquiler: 'tradicional', // 'tradicional' | 'coliving'
    superficie: '0',
    habitaciones: '1',
    banos: '1',
    precio: '0',
    descripcion: '',
    caracteristicas: '',
  });

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const response = await fetch('/api/buildings');
        if (response.ok) {
          const data = await response.json();
          setBuildings(data);
        }
      } catch (error) {
        logger.error('Error fetching buildings:', error);
      }
    };

    if (status === 'authenticated') {
      fetchBuildings();
    }
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: formData.numero,
          buildingId: formData.edificioId,
          tipo: formData.tipo,
          modoAlquiler: formData.modoAlquiler,
          superficie: parseFloat(formData.superficie),
          habitaciones: parseInt(formData.habitaciones),
          banos: parseInt(formData.banos),
          precioAlquiler: parseFloat(formData.precio),
          estado: 'disponible',
          descripcion: formData.descripcion || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Unidad creada correctamente');
        // Redirigir según el modo de alquiler
        if (formData.modoAlquiler === 'coliving') {
          toast.info('Para configurar habitaciones individuales, ve a la sección de Coliving');
        }
        router.push('/unidades');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al crear la unidad');
      }
    } catch (error) {
      logger.error('Error:', error);
      toast.error('Error al crear la unidad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // AI Form Assistant handler
  const handleAISuggestions = (suggestions: Record<string, any>) => {
    setFormData(prev => ({
      ...prev,
      ...suggestions,
    }));
  };

  // Handler para datos extraídos de documentos
  const handleDocumentData = (data: Record<string, any>) => {
    // Mapear los campos extraídos a los campos del formulario
    const mappedData: Record<string, any> = {};
    
    // Superficie
    if (data.superficie || data.superficie_m2 || data.superficieUtil) {
      mappedData.superficie = String(data.superficie || data.superficie_m2 || data.superficieUtil);
    }
    
    // Habitaciones
    if (data.habitaciones || data.dormitorios || data.numHabitaciones) {
      mappedData.habitaciones = String(data.habitaciones || data.dormitorios || data.numHabitaciones);
    }
    
    // Baños
    if (data.banos || data.numBanos) {
      mappedData.banos = String(data.banos || data.numBanos);
    }
    
    // Precio
    if (data.precio || data.precioAlquiler || data.rentaMensual) {
      mappedData.precio = String(data.precio || data.precioAlquiler || data.rentaMensual);
    }
    
    // Tipo de unidad
    if (data.tipo || data.tipoVivienda) {
      const tipoMap: Record<string, string> = {
        'piso': 'apartamento',
        'apartamento': 'apartamento',
        'estudio': 'estudio',
        'local': 'local',
        'oficina': 'oficina',
        'duplex': 'duplex',
        'ático': 'apartamento',
        'bajo': 'apartamento',
      };
      const tipoInput = (data.tipo || data.tipoVivienda).toLowerCase();
      mappedData.tipo = tipoMap[tipoInput] || 'apartamento';
    }
    
    // Número/Identificador
    if (data.numero || data.puerta || data.identificador) {
      mappedData.numero = String(data.numero || data.puerta || data.identificador);
    }
    
    // Descripción
    if (data.descripcion || data.caracteristicas) {
      mappedData.descripcion = data.descripcion || data.caracteristicas;
    }
    
    setFormData(prev => ({
      ...prev,
      ...mappedData,
    }));
    
    toast.success('Datos del documento aplicados al formulario');
  };

  // Form fields definition for AI Assistant
  const formFields = [
    { name: 'numero', label: 'Número de Unidad', type: 'text' as const, required: true },
    { name: 'tipo', label: 'Tipo de Unidad', type: 'select' as const, options: [
      { value: 'apartamento', label: 'Apartamento' },
      { value: 'estudio', label: 'Estudio' },
      { value: 'duplex', label: 'Dúplex' },
      { value: 'local', label: 'Local Comercial' },
      { value: 'oficina', label: 'Oficina' },
      { value: 'garaje', label: 'Garaje' },
      { value: 'trastero', label: 'Trastero' },
    ]},
    { name: 'modoAlquiler', label: 'Modo de Alquiler', type: 'select' as const, options: [
      { value: 'tradicional', label: 'Alquiler Tradicional (12+ meses)' },
      { value: 'media_estancia', label: 'Media Estancia (1-11 meses)' },
      { value: 'coliving', label: 'Coliving (Por habitaciones)' },
    ], description: 'El modo de alquiler determina cómo se gestionará esta unidad' },
    { name: 'superficie', label: 'Superficie (m²)', type: 'number' as const, required: true },
    { name: 'habitaciones', label: 'Habitaciones', type: 'number' as const },
    { name: 'banos', label: 'Baños', type: 'number' as const },
    { name: 'precio', label: 'Precio Alquiler (€)', type: 'currency' as const, required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' as const },
  ];

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
                onClick={() => router.push('/unidades')}
                className="gap-2 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Unidades
              </Button>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard">
                      <HomeIcon className="h-4 w-4" />
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/unidades">Unidades</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nueva Unidad</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Header Section */}
            <div className="space-y-4">
              <BackButton href="/unidades" label="Volver a Unidades" />
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">Nueva Unidad</h1>
                  <p className="text-muted-foreground">Registra una nueva unidad en un edificio</p>
                </div>
                <div className="flex items-center gap-2">
                  <FormAIAssistant
                    formContext="propiedad"
                    fields={formFields}
                    currentValues={formData}
                    onSuggestionsApply={handleAISuggestions}
                    additionalContext={buildings.length > 0 ? `Edificios disponibles: ${buildings.map(b => b.nombre).join(', ')}` : undefined}
                  />
                </div>
              </div>
            </div>

            {/* Asistente IA Documental - Flotante */}
            <AIDocumentAssistant
              context="propiedades"
              onApplyData={handleDocumentData}
              variant="floating"
              position="bottom-right"
            />

            {/* Formulario con Wizard para móvil */}
            <form onSubmit={handleSubmit}>
              <MobileFormWizard
                steps={[
                  {
                    id: 'basic',
                    title: 'Información Básica',
                    description: 'Selecciona el edificio y define la identificación',
                    fields: (
                      <div className="space-y-4">
                        {/* Edificio */}
                        <div className="space-y-2">
                          <Label htmlFor="edificioId">Edificio *</Label>
                          <Select
                            value={formData.edificioId}
                            onValueChange={(value) =>
                              setFormData({ ...formData, edificioId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona un edificio" />
                            </SelectTrigger>
                            <SelectContent>
                              {buildings.map((building) => (
                                <SelectItem key={building.id} value={building.id}>
                                  {building.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Número */}
                        <div className="space-y-2">
                          <Label htmlFor="numero">Número/Identificador *</Label>
                          <Input
                            id="numero"
                            name="numero"
                            value={formData.numero}
                            onChange={handleChange}
                            required
                            placeholder="Ej: 101, A1, Planta 3"
                          />
                        </div>

                        {/* Tipo */}
                        <div className="space-y-2">
                          <Label htmlFor="tipo">Tipo de Unidad *</Label>
                          <Select
                            value={formData.tipo}
                            onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="apartamento">Apartamento</SelectItem>
                              <SelectItem value="local">Local Comercial</SelectItem>
                              <SelectItem value="oficina">Oficina</SelectItem>
                              <SelectItem value="estudio">Estudio</SelectItem>
                              <SelectItem value="duplex">Dúplex</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Modo de Alquiler */}
                        <div className="space-y-2">
                          <Label htmlFor="modoAlquiler">Modo de Alquiler *</Label>
                          <Select
                            value={formData.modoAlquiler}
                            onValueChange={(value) => setFormData({ ...formData, modoAlquiler: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="tradicional">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  <span>Alquiler Tradicional (12+ meses)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="media_estancia">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  <span>Media Estancia (1-11 meses)</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="coliving">
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <span>Coliving (Por habitaciones)</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {/* Info sobre el modo seleccionado */}
                          {formData.modoAlquiler === 'tradicional' && (
                            <Alert className="mt-2">
                              <Building2 className="h-4 w-4" />
                              <AlertTitle className="text-sm">Alquiler Tradicional</AlertTitle>
                              <AlertDescription className="text-xs">
                                Contratos de larga duración (12 meses o más). La unidad se alquila completa a un único inquilino o familia.
                              </AlertDescription>
                            </Alert>
                          )}
                          {formData.modoAlquiler === 'media_estancia' && (
                            <Alert className="mt-2 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <AlertTitle className="text-sm text-blue-800 dark:text-blue-200">Media Estancia</AlertTitle>
                              <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                                Contratos temporales de 1 a 11 meses. Ideal para estudiantes, profesionales desplazados o alquileres de temporada.
                              </AlertDescription>
                            </Alert>
                          )}
                          {formData.modoAlquiler === 'coliving' && (
                            <Alert className="mt-2 border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
                              <Users className="h-4 w-4 text-purple-600" />
                              <AlertTitle className="text-sm text-purple-800 dark:text-purple-200">Modo Coliving</AlertTitle>
                              <AlertDescription className="text-xs text-purple-700 dark:text-purple-300">
                                Podrás crear habitaciones individuales después de guardar la unidad. 
                                Cada habitación se podrá alquilar por separado.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'characteristics',
                    title: 'Características',
                    description: 'Define el tamaño y distribución de la unidad',
                    fields: (
                      <div className="space-y-4">
                        {/* Superficie */}
                        <div className="space-y-2">
                          <Label htmlFor="superficie">Superficie (m²) *</Label>
                          <Input
                            id="superficie"
                            name="superficie"
                            type="number"
                            step="0.01"
                            value={formData.superficie}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Ej: 85.5"
                          />
                        </div>

                        {/* Habitaciones */}
                        <div className="space-y-2">
                          <Label htmlFor="habitaciones">Habitaciones *</Label>
                          <Input
                            id="habitaciones"
                            name="habitaciones"
                            type="number"
                            value={formData.habitaciones}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Número de habitaciones"
                          />
                        </div>

                        {/* Baños */}
                        <div className="space-y-2">
                          <Label htmlFor="banos">Baños *</Label>
                          <Input
                            id="banos"
                            name="banos"
                            type="number"
                            value={formData.banos}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Número de baños"
                          />
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'price',
                    title: 'Precio y Confirmación',
                    description: 'Establece el precio de alquiler y confirma la información',
                    fields: (
                      <div className="space-y-4">
                        {/* Precio */}
                        <div className="space-y-2">
                          <Label htmlFor="precio">Precio de Alquiler (€/mes) *</Label>
                          <Input
                            id="precio"
                            name="precio"
                            type="number"
                            step="0.01"
                            value={formData.precio}
                            onChange={handleChange}
                            required
                            min="0"
                            placeholder="Ej: 850.00"
                          />
                        </div>

                        {/* Resumen */}
                        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                          <p className="font-medium">Resumen:</p>
                          <div className="space-y-1">
                            <p>
                              <span className="text-muted-foreground">Tipo:</span> {formData.tipo}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Superficie:</span>{' '}
                              {formData.superficie} m²
                            </p>
                            <p>
                              <span className="text-muted-foreground">Habitaciones:</span>{' '}
                              {formData.habitaciones}
                            </p>
                            <p>
                              <span className="text-muted-foreground">Baños:</span> {formData.banos}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                ]}
                submitButton={
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={isLoading || !formData.edificioId}
                      className="flex-1 sm:flex-initial"
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Crear Unidad
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/unidades')}
                      disabled={isLoading}
                      className="flex-1 sm:flex-initial"
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
