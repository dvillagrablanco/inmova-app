"use client";

import React, { useState, useEffect } from 'react';
import { useWizard } from '@/lib/hooks/useWizard';
import { WizardContainer } from './WizardContainer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, Home, User, Image, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface PropertyWizardProps {
  /**
   * Callback al completar
   */
  onComplete?: (data: any) => void;
}

/**
 * PROPERTY WIZARD - Wizard de creación de propiedad en 5 pasos
 * 
 * Pasos:
 * 1. Datos Básicos (dirección, tipo, referencia)
 * 2. Características (m2, habitaciones, baños)
 * 3. Propietario (nombre, contacto)
 * 4. Fotos (opcional)
 * 5. Resumen y confirmación
 */
export function PropertyWizard({ onComplete }: PropertyWizardProps) {
  const router = useRouter();

  const wizard = useWizard({
    steps: [
      {
        id: 'basic',
        title: 'Datos Básicos',
        description: 'Información principal de la propiedad',
      },
      {
        id: 'features',
        title: 'Características',
        description: 'Detalles técnicos de la propiedad',
      },
      {
        id: 'owner',
        title: 'Propietario',
        description: 'Información del propietario',
      },
      {
        id: 'photos',
        title: 'Fotos',
        description: 'Imágenes de la propiedad',
        isOptional: true,
      },
      {
        id: 'summary',
        title: 'Resumen',
        description: 'Revisa y confirma la información',
      },
    ],
    persistKey: 'property-creation',
    onComplete: async (data) => {
      try {
        // Llamar a la API para crear la propiedad
        const res = await fetch('/api/edificios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data.basic,
            ...data.features,
            ownerName: data.owner?.name,
            ownerEmail: data.owner?.email,
            ownerPhone: data.owner?.phone,
            // Fotos se enviarían en una petición separada
          }),
        });

        if (res.ok) {
          toast.success('¡Propiedad creada exitosamente!');
          if (onComplete) {
            onComplete(data);
          } else {
            router.push('/edificios');
          }
        } else {
          throw new Error('Error al crear propiedad');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al crear la propiedad');
        throw error;
      }
    },
  });

  // Estado local de cada paso
  const [basicData, setBasicData] = useState({
    direccion: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    tipo: 'residencial',
    referencia: '',
  });

  const [featuresData, setFeaturesData] = useState({
    superficie: '',
    habitaciones: '',
    banos: '',
    planta: '',
    ascensor: 'false',
    parking: 'false',
  });

  const [ownerData, setOwnerData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [photos, setPhotos] = useState<string[]>([]);

  // Validación del paso actual
  const isCurrentStepValid = () => {
    const { currentStepIndex } = wizard.state;

    switch (currentStepIndex) {
      case 0: // Datos básicos
        return (
          basicData.direccion.length > 0 &&
          basicData.ciudad.length > 0 &&
          basicData.provincia.length > 0
        );
      case 1: // Características
        return (
          parseFloat(featuresData.superficie) > 0 &&
          parseInt(featuresData.habitaciones) >= 0 &&
          parseInt(featuresData.banos) >= 0
        );
      case 2: // Propietario
        return ownerData.name.length > 0 && ownerData.email.length > 0;
      case 3: // Fotos (opcional)
        return true;
      case 4: // Resumen
        return true;
      default:
        return false;
    }
  };

  // Actualizar datos del wizard cuando cambien
  useEffect(() => {
    wizard.actions.updateData('basic', basicData);
  }, [basicData]);

  useEffect(() => {
    wizard.actions.updateData('features', featuresData);
  }, [featuresData]);

  useEffect(() => {
    wizard.actions.updateData('owner', ownerData);
  }, [ownerData]);

  useEffect(() => {
    wizard.actions.updateData('photos', photos);
  }, [photos]);

  // Renderizar contenido del paso actual
  const renderStepContent = () => {
    switch (wizard.state.currentStepIndex) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="direccion">Dirección *</Label>
              <Input
                id="direccion"
                placeholder="Calle Principal 123"
                value={basicData.direccion}
                onChange={(e) => setBasicData({ ...basicData, direccion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ciudad">Ciudad *</Label>
                <Input
                  id="ciudad"
                  placeholder="Madrid"
                  value={basicData.ciudad}
                  onChange={(e) => setBasicData({ ...basicData, ciudad: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="provincia">Provincia *</Label>
                <Input
                  id="provincia"
                  placeholder="Madrid"
                  value={basicData.provincia}
                  onChange={(e) => setBasicData({ ...basicData, provincia: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="codigoPostal">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  placeholder="28001"
                  value={basicData.codigoPostal}
                  onChange={(e) => setBasicData({ ...basicData, codigoPostal: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo de Propiedad</Label>
                <Select
                  value={basicData.tipo}
                  onValueChange={(value) => setBasicData({ ...basicData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residencial">Residencial</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="oficina">Oficina</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="referencia">Referencia Catastral</Label>
              <Input
                id="referencia"
                placeholder="1234567AB1234C0001AB"
                value={basicData.referencia}
                onChange={(e) => setBasicData({ ...basicData, referencia: e.target.value })}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="superficie">Superficie (m²) *</Label>
                <Input
                  id="superficie"
                  type="number"
                  placeholder="80"
                  value={featuresData.superficie}
                  onChange={(e) => setFeaturesData({ ...featuresData, superficie: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="habitaciones">Habitaciones *</Label>
                <Input
                  id="habitaciones"
                  type="number"
                  placeholder="3"
                  value={featuresData.habitaciones}
                  onChange={(e) => setFeaturesData({ ...featuresData, habitaciones: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="banos">Baños *</Label>
                <Input
                  id="banos"
                  type="number"
                  placeholder="2"
                  value={featuresData.banos}
                  onChange={(e) => setFeaturesData({ ...featuresData, banos: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="planta">Planta</Label>
                <Input
                  id="planta"
                  placeholder="3"
                  value={featuresData.planta}
                  onChange={(e) => setFeaturesData({ ...featuresData, planta: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ascensor"
                  checked={featuresData.ascensor === 'true'}
                  onChange={(e) =>
                    setFeaturesData({
                      ...featuresData,
                      ascensor: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="ascensor">Ascensor</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="parking"
                  checked={featuresData.parking === 'true'}
                  onChange={(e) =>
                    setFeaturesData({
                      ...featuresData,
                      parking: e.target.checked ? 'true' : 'false',
                    })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="parking">Parking</Label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="ownerName">Nombre del Propietario *</Label>
              <Input
                id="ownerName"
                placeholder="Juan Pérez"
                value={ownerData.name}
                onChange={(e) => setOwnerData({ ...ownerData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="ownerEmail">Email *</Label>
              <Input
                id="ownerEmail"
                type="email"
                placeholder="juan@example.com"
                value={ownerData.email}
                onChange={(e) => setOwnerData({ ...ownerData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="ownerPhone">Teléfono</Label>
              <Input
                id="ownerPhone"
                type="tel"
                placeholder="+34 600 000 000"
                value={ownerData.phone}
                onChange={(e) => setOwnerData({ ...ownerData, phone: e.target.value })}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Arrastra imágenes aquí o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                id="photo-upload"
                onChange={(e) => {
                  // Lógica de subida de fotos
                  const files = Array.from(e.target.files || []);
                  toast.success(`${files.length} foto(s) seleccionada(s)`);
                }}
              />
              <label
                htmlFor="photo-upload"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
              >
                Seleccionar Fotos
              </label>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Puedes saltar este paso y añadir fotos más tarde
            </p>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Datos Básicos</h3>
                    <p className="text-sm text-muted-foreground">
                      {basicData.direccion}, {basicData.ciudad}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {basicData.provincia} - {basicData.codigoPostal || 'Sin CP'}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      Tipo: {basicData.tipo}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Home className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Características</h3>
                    <p className="text-sm text-muted-foreground">
                      {featuresData.superficie} m², {featuresData.habitaciones} habitaciones,{' '}
                      {featuresData.banos} baños
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {featuresData.ascensor === 'true' ? '✓ Ascensor' : ''}{' '}
                      {featuresData.parking === 'true' ? '✓ Parking' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">Propietario</h3>
                    <p className="text-sm text-muted-foreground">{ownerData.name}</p>
                    <p className="text-sm text-muted-foreground">{ownerData.email}</p>
                    {ownerData.phone && (
                      <p className="text-sm text-muted-foreground">{ownerData.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Todo listo</p>
                <p className="text-sm text-green-700">
                  Revisa la información y haz clic en "Finalizar" para crear la propiedad
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <WizardContainer
      state={wizard.state}
      title="Crear Nueva Propiedad"
      description="Sigue los pasos para añadir una propiedad a tu cartera"
      isStepValid={isCurrentStepValid()}
      isSubmitting={wizard.isSubmitting}
      onNext={wizard.actions.goToNext}
      onPrevious={wizard.actions.goToPrevious}
      onComplete={wizard.actions.complete}
    >
      {renderStepContent()}
    </WizardContainer>
  );
}

export default PropertyWizard;
