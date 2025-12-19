'use client';

import { useState } from 'react';
import { Wizard, WizardStep } from '@/components/ui/wizard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  MapPin, 
  Home, 
  Ruler, 
  Calendar,
  User,
  Camera,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { validateRequiredFields, validatePostalCode } from '@/lib/wizard-utils';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PropertyWizardProps {
  onComplete?: (buildingId: string) => void;
  onCancel?: () => void;
  initialData?: Partial<PropertyFormData>;
}

interface PropertyFormData {
  // Basic Info
  nombre: string;
  tipo: string;
  
  // Location
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  pais: string;
  
  // Characteristics
  anoConstructor: number;
  numeroUnidades: number;
  numeroPlants: number;
  metrosCuadrados: number;
  
  // Owner
  nombrePropietario: string;
  emailPropietario: string;
  telefonoPropietario: string;
  
  // Additional
  descripcion: string;
  amenidades: string[];
}

const TIPO_EDIFICIO_OPTIONS = [
  { value: 'residencial', label: 'Residencial' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'mixto', label: 'Mixto' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'turistico', label: 'Turístico/STR' },
];

const AMENIDADES_OPTIONS = [
  'Ascensor',
  'Piscina',
  'Gimnasio',
  'Parking',
  'Jardín',
  'Terraza',
  'Seguridad 24h',
  'Portero',
  'Zona común',
  'Lavandería',
];

export function PropertyWizard({ 
  onComplete, 
  onCancel,
  initialData = {} 
}: PropertyWizardProps) {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<any>(null);

  const steps: WizardStep[] = [
    {
      id: 'basic-info',
      title: 'Información Básica',
      description: 'Identifica tu propiedad',
      icon: <Building2 className="h-5 w-5" />,
      helpText: 'El nombre debe ser único y descriptivo para identificar fácilmente la propiedad.',
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre de la Propiedad *</Label>
            <Input
              id="nombre"
              value={data.nombre || ''}
              onChange={(e) => updateData({ nombre: e.target.value })}
              placeholder="Ej: Edificio Vista Mar, Torre Central"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Propiedad *</Label>
            <Select
              value={data.tipo || 'residencial'}
              onValueChange={(value) => updateData({ tipo: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_EDIFICIO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              value={data.descripcion || ''}
              onChange={(e) => updateData({ descripcion: e.target.value })}
              placeholder="Breve descripción de la propiedad..."
              rows={3}
            />
          </div>

          {data.tipo === 'turistico' && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                Para propiedades turísticas, recomendamos configurar el Channel Manager después de crear la propiedad.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ),
      validate: async (data) => {
        return validateRequiredFields(data, ['nombre', 'tipo']);
      },
    },
    {
      id: 'location',
      title: 'Ubicación',
      description: 'Dónde se encuentra la propiedad',
      icon: <MapPin className="h-5 w-5" />,
      helpText: 'La dirección completa ayuda a identificar la propiedad en mapas y documentos.',
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección Completa *</Label>
            <Input
              id="direccion"
              value={data.direccion || ''}
              onChange={(e) => updateData({ direccion: e.target.value })}
              placeholder="Calle y número"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ciudad">Ciudad *</Label>
              <Input
                id="ciudad"
                value={data.ciudad || ''}
                onChange={(e) => updateData({ ciudad: e.target.value })}
                placeholder="Madrid, Barcelona..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigoPostal">Código Postal *</Label>
              <Input
                id="codigoPostal"
                value={data.codigoPostal || ''}
                onChange={(e) => updateData({ codigoPostal: e.target.value })}
                placeholder="28001"
                maxLength={5}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provincia">Provincia *</Label>
              <Input
                id="provincia"
                value={data.provincia || ''}
                onChange={(e) => updateData({ provincia: e.target.value })}
                placeholder="Madrid"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pais">País *</Label>
              <Input
                id="pais"
                value={data.pais || 'España'}
                onChange={(e) => updateData({ pais: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
      ),
      validate: async (data) => {
        const requiredValid = validateRequiredFields(data, [
          'direccion',
          'ciudad',
          'codigoPostal',
          'provincia',
          'pais',
        ]);

        if (requiredValid !== true) return requiredValid;

        // Validate postal code format
        if (data.pais === 'España' && !validatePostalCode(data.codigoPostal)) {
          return 'Código postal inválido (debe ser 5 dígitos)';
        }

        return true;
      },
    },
    {
      id: 'characteristics',
      title: 'Características',
      description: 'Detalles de la propiedad',
      icon: <Ruler className="h-5 w-5" />,
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="anoConstructor">Año de Construcción *</Label>
              <Input
                id="anoConstructor"
                type="number"
                value={data.anoConstructor || new Date().getFullYear()}
                onChange={(e) => updateData({ anoConstructor: parseInt(e.target.value) })}
                min={1800}
                max={new Date().getFullYear() + 2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroPlants">Número de Plantas *</Label>
              <Input
                id="numeroPlants"
                type="number"
                value={data.numeroPlants || 1}
                onChange={(e) => updateData({ numeroPlants: parseInt(e.target.value) })}
                min={1}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroUnidades">Número de Unidades *</Label>
              <Input
                id="numeroUnidades"
                type="number"
                value={data.numeroUnidades || 1}
                onChange={(e) => updateData({ numeroUnidades: parseInt(e.target.value) })}
                min={1}
                required
              />
              <p className="text-xs text-muted-foreground">
                Número total de apartamentos, locales u oficinas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metrosCuadrados">Metros Cuadrados Totales</Label>
              <Input
                id="metrosCuadrados"
                type="number"
                value={data.metrosCuadrados || ''}
                onChange={(e) => updateData({ metrosCuadrados: parseInt(e.target.value) })}
                placeholder="Superficie total"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Amenidades (Opcional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {AMENIDADES_OPTIONS.map((amenidad) => {
                const isSelected = data.amenidades?.includes(amenidad);
                return (
                  <Badge
                    key={amenidad}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer justify-center py-2"
                    onClick={() => {
                      const current = data.amenidades || [];
                      const updated = isSelected
                        ? current.filter((a: string) => a !== amenidad)
                        : [...current, amenidad];
                      updateData({ amenidades: updated });
                    }}
                  >
                    {amenidad}
                  </Badge>
                );
              })}
            </div>
          </div>
        </div>
      ),
      validate: async (data) => {
        const requiredValid = validateRequiredFields(data, [
          'anoConstructor',
          'numeroUnidades',
          'numeroPlants',
        ]);

        if (requiredValid !== true) return requiredValid;

        // Validate year range
        const currentYear = new Date().getFullYear();
        if (data.anoConstructor < 1800 || data.anoConstructor > currentYear + 2) {
          return `El año debe estar entre 1800 y ${currentYear + 2}`;
        }

        if (data.numeroUnidades < 1) {
          return 'Debe haber al menos 1 unidad';
        }

        return true;
      },
    },
    {
      id: 'owner',
      title: 'Información del Propietario',
      description: 'Datos de contacto del dueño',
      icon: <User className="h-5 w-5" />,
      optional: true,
      helpText: 'Esta información es opcional pero recomendada para gestionar contratos y comunicaciones.',
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Puedes añadir esta información más tarde o dejarla en blanco si eres el propietario.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="nombrePropietario">Nombre del Propietario</Label>
            <Input
              id="nombrePropietario"
              value={data.nombrePropietario || ''}
              onChange={(e) => updateData({ nombrePropietario: e.target.value })}
              placeholder="Nombre completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emailPropietario">Email</Label>
              <Input
                id="emailPropietario"
                type="email"
                value={data.emailPropietario || ''}
                onChange={(e) => updateData({ emailPropietario: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefonoPropietario">Teléfono</Label>
              <Input
                id="telefonoPropietario"
                type="tel"
                value={data.telefonoPropietario || ''}
                onChange={(e) => updateData({ telefonoPropietario: e.target.value })}
                placeholder="+34 XXX XXX XXX"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'summary',
      title: '¡Todo Listo!',
      description: 'Revisa y confirma la información',
      icon: <CheckCircle className="h-5 w-5" />,
      fields: () => (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            La propiedad será creada con la información proporcionada. Podrás editarla en cualquier momento.
          </AlertDescription>
        </Alert>
      ),
    },
  ];

  const handleComplete = async (data: PropertyFormData) => {
    try {
      const response = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: data.nombre,
          tipo: data.tipo,
          direccion: data.direccion,
          ciudad: data.ciudad,
          codigoPostal: data.codigoPostal,
          provincia: data.provincia,
          pais: data.pais,
          anoConstructor: data.anoConstructor,
          numeroUnidades: data.numeroUnidades,
          numeroPlants: data.numeroPlants,
          metrosCuadrados: data.metrosCuadrados,
          descripcion: data.descripcion,
          amenidades: data.amenidades,
          nombrePropietario: data.nombrePropietario,
          emailPropietario: data.emailPropietario,
          telefonoPropietario: data.telefonoPropietario,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la propiedad');
      }

      const result = await response.json();
      toast.success('¡Propiedad creada con éxito!');
      
      if (onComplete) {
        onComplete(result.building?.id);
      } else {
        router.push(`/edificios/${result.building?.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la propiedad');
      throw error;
    }
  };

  const PreviewComponent = ({ data }: { data: PropertyFormData }) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {data.nombre || 'Sin nombre'}
          </CardTitle>
          <CardDescription>
            {TIPO_EDIFICIO_OPTIONS.find((t) => t.value === data.tipo)?.label || data.tipo}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4" />
              Ubicación
            </h4>
            <p className="text-sm text-muted-foreground">
              {data.direccion}<br />
              {data.ciudad}, {data.codigoPostal}<br />
              {data.provincia}, {data.pais}
            </p>
          </div>

          {/* Characteristics */}
          <div>
            <h4 className="font-semibold flex items-center gap-2 mb-2">
              <Ruler className="h-4 w-4" />
              Características
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Año:</span>{' '}
                <span className="font-medium">{data.anoConstructor}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Plantas:</span>{' '}
                <span className="font-medium">{data.numeroPlants}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Unidades:</span>{' '}
                <span className="font-medium">{data.numeroUnidades}</span>
              </div>
              {data.metrosCuadrados && (
                <div>
                  <span className="text-muted-foreground">M²:</span>{' '}
                  <span className="font-medium">{data.metrosCuadrados}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amenidades */}
          {data.amenidades && data.amenidades.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Amenidades</h4>
              <div className="flex flex-wrap gap-2">
                {data.amenidades.map((amenidad) => (
                  <Badge key={amenidad} variant="secondary">
                    {amenidad}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Owner */}
          {data.nombrePropietario && (
            <div>
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <User className="h-4 w-4" />
                Propietario
              </h4>
              <p className="text-sm">
                {data.nombrePropietario}<br />
                {data.emailPropietario && <>{data.emailPropietario}<br /></>}
                {data.telefonoPropietario && <>{data.telefonoPropietario}</>}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Wizard
      steps={steps}
      title="Crear Nueva Propiedad"
      description="Sigue los pasos para registrar una nueva propiedad en tu cartera"
      initialData={initialData}
      onComplete={handleComplete}
      onCancel={onCancel}
      showPreview={true}
      previewComponent={(data) => <PreviewComponent data={data as PropertyFormData} />}
      className="max-w-3xl"
    />
  );
}
