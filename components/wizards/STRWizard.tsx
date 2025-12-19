'use client';

import { useState } from 'react';
import { Wizard, WizardStep } from '@/components/ui/wizard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Home,
  CheckCircle,
  AlertCircle,
  Wifi,
  Link2,
  Upload,
  DollarSign,
  Calendar,
  Settings,
  Sparkles
} from 'lucide-react';
import { validateRequiredFields } from '@/lib/wizard-utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface STRWizardProps {
  onComplete?: (config: any) => void;
  onCancel?: () => void;
}

interface STRFormData {
  // Channel Selection
  hasExistingListings: boolean;
  selectedChannels: string[];
  
  // Import Options
  importMethod: 'oauth' | 'manual' | 'api';
  listingsToImport: string[];
  
  // Property Selection
  propertyId?: string;
  createNewProperty: boolean;
  
  // Pricing Strategy
  enableDynamicPricing: boolean;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  
  // Calendar Sync
  enableCalendarSync: boolean;
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  
  // Automation
  autoAcceptBookings: boolean;
  autoMessageGuests: boolean;
  enableInstantBook: boolean;
}

const AVAILABLE_CHANNELS = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    logo: '/channels/airbnb-logo.svg',
    description: 'La plataforma líder mundial',
    features: ['Alcance global', 'Instant Book', 'Mensajería integrada'],
    supported: true,
  },
  {
    id: 'booking',
    name: 'Booking.com',
    logo: '/channels/booking-logo.svg',
    description: 'Red global de viajes',
    features: ['Gran tráfico', 'Diversos tipos de alojamiento', 'Soporte 24/7'],
    supported: true,
  },
  {
    id: 'vrbo',
    name: 'Vrbo',
    logo: '/channels/vrbo-logo.svg',
    description: 'Vacation Rentals by Owner',
    features: ['Estancias largas', 'Familias', 'Casas completas'],
    supported: true,
  },
  {
    id: 'expedia',
    name: 'Expedia',
    logo: '/channels/expedia-logo.svg',
    description: 'Portal de viajes completo',
    features: ['Paquetes de viaje', 'Puntos de fidelidad', 'Integración con vuelos'],
    supported: false,
  },
  {
    id: 'tripadvisor',
    name: 'TripAdvisor',
    logo: '/channels/tripadvisor-logo.svg',
    description: 'Reseñas y reservas',
    features: ['Reseñas de confianza', 'Comparación de precios', 'Visibilidad'],
    supported: false,
  },
];

export function STRWizard({ onComplete, onCancel }: STRWizardProps) {
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] = useState<Record<string, 'pending' | 'connecting' | 'connected' | 'error'>>({});

  const steps: WizardStep[] = [
    {
      id: 'intro',
      title: '¡Bienvenido al Channel Manager!',
      description: 'Conecta tus canales de alquiler vacacional',
      icon: <Wifi className="h-5 w-5" />,
      fields: ({ data, updateData }) => (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Wifi className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Gestiona todos tus canales desde un solo lugar
              </h3>
              <p className="text-muted-foreground">
                Sincroniza calendarios, precios y reservas automáticamente
              </p>
            </div>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Beneficios del Channel Manager</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Evita sobrevalorados con sincronización en tiempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Actualiza precios en todos los canales instantáneamente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Centraliza mensajes y reservas en un panel único</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Aumenta tu visibilidad y reservas hasta un 40%</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Label className="text-base">¿Ya tienes anuncios activos en alguna plataforma?</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={data.hasExistingListings === true ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => updateData({ hasExistingListings: true })}
              >
                Sí, tengo anuncios
              </Button>
              <Button
                type="button"
                variant={data.hasExistingListings === false ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => updateData({ hasExistingListings: false })}
              >
                No, empezar de cero
              </Button>
            </div>
          </div>
        </div>
      ),
      validate: async (data) => {
        if (data.hasExistingListings === undefined) {
          return 'Por favor, indica si tienes anuncios existentes';
        }
        return true;
      },
    },
    {
      id: 'channels',
      title: 'Selecciona tus Canales',
      description: '¿Dónde están tus anuncios?',
      icon: <Link2 className="h-5 w-5" />,
      helpText: 'Puedes conectar múltiples canales simultáneamente. Solo selecciona los que uses.',
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_CHANNELS.map((channel) => {
              const isSelected = data.selectedChannels?.includes(channel.id);
              const status = connectionStatus[channel.id] || 'pending';

              return (
                <Card
                  key={channel.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'border-primary border-2' : ''
                  } ${
                    !channel.supported ? 'opacity-60' : ''
                  }`}
                  onClick={() => {
                    if (!channel.supported) {
                      toast.info(`${channel.name} estará disponible próximamente`);
                      return;
                    }
                    const current = data.selectedChannels || [];
                    const updated = isSelected
                      ? current.filter((id: string) => id !== channel.id)
                      : [...current, channel.id];
                    updateData({ selectedChannels: updated });
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Home className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {channel.name}
                            {!channel.supported && (
                              <Badge variant="secondary" className="text-xs">
                                Próximamente
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {channel.description}
                          </CardDescription>
                        </div>
                      </div>
                      {isSelected && channel.supported && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-1">
                      {channel.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data.hasExistingListings && data.selectedChannels?.length > 0 && (
            <Alert>
              <Upload className="h-4 w-4" />
              <AlertDescription>
                En el siguiente paso podrás importar tus anuncios existentes desde {data.selectedChannels.length} canal(es).
              </AlertDescription>
            </Alert>
          )}
        </div>
      ),
      validate: async (data) => {
        if (!data.selectedChannels || data.selectedChannels.length === 0) {
          return 'Selecciona al menos un canal para continuar';
        }
        return true;
      },
    },
    {
      id: 'connection',
      title: 'Conectar Canales',
      description: 'Autoriza el acceso a tus cuentas',
      icon: <Settings className="h-5 w-5" />,
      shouldSkip: (data) => !data.hasExistingListings,
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Necesitamos permiso para acceder a tus cuentas. Esto es seguro y puedes revocar el acceso en cualquier momento.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {data.selectedChannels?.map((channelId: string) => {
              const channel = AVAILABLE_CHANNELS.find((c) => c.id === channelId);
              if (!channel) return null;

              const status = (connectionStatus[channelId] || 'pending') as 'pending' | 'connecting' | 'connected' | 'error';

              return (
                <Card key={channelId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <Home className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-sm">{channel.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {status === 'pending' && 'Esperando conexión'}
                            {status === 'connecting' && 'Conectando...'}
                            {status === 'connected' && 'Conectado correctamente'}
                            {status === 'error' && 'Error al conectar'}
                          </CardDescription>
                        </div>
                      </div>
                      {status === 'connected' ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : status === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {status === 'pending' && (
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={async () => {
                          setConnectionStatus({ ...connectionStatus, [channelId]: 'connecting' });
                          
                          try {
                            // Simulate OAuth connection
                            await new Promise((resolve) => setTimeout(resolve, 2000));
                            
                            const response = await fetch(`/api/str/channels/connect`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ channel: channelId }),
                            });

                            if (response.ok) {
                              setConnectionStatus({ ...connectionStatus, [channelId]: 'connected' });
                              toast.success(`${channel.name} conectado correctamente`);
                            } else {
                              throw new Error('Connection failed');
                            }
                          } catch (error) {
                            setConnectionStatus({ ...connectionStatus, [channelId]: 'error' });
                            toast.error(`Error al conectar ${channel.name}`);
                          }
                        }}
                      >
                        {status === 'connecting' ? 'Conectando...' : `Conectar ${channel.name}`}
                      </Button>
                    )}
                    {status === 'error' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => setConnectionStatus({ ...connectionStatus, [channelId]: 'pending' })}
                      >
                        Reintentar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ),
      validate: async (data) => {
        // Check if all selected channels are connected
        const allConnected = data.selectedChannels?.every(
          (channelId: string) => connectionStatus[channelId] === 'connected'
        );

        if (!allConnected) {
          return 'Por favor, conecta todos los canales seleccionados antes de continuar';
        }

        return true;
      },
    },
    {
      id: 'pricing',
      title: 'Estrategia de Precios',
      description: 'Configura tus precios',
      icon: <DollarSign className="h-5 w-5" />,
      helpText: 'El precio dinámico ajusta automáticamente según demanda, temporada y competencia.',
      fields: ({ data, updateData }) => (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Precio Dinámico (Recomendado)</Label>
                <p className="text-sm text-muted-foreground">
                  Optimiza tus ingresos automáticamente
                </p>
              </div>
              <Checkbox
                checked={data.enableDynamicPricing}
                onCheckedChange={(checked) => updateData({ enableDynamicPricing: checked })}
              />
            </div>
          </div>

          {data.enableDynamicPricing ? (
            <Card className="border-primary/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Configuración de Precios Dinámicos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="minPrice" className="text-xs">Precio Mínimo *</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      value={data.minPrice || ''}
                      onChange={(e) => updateData({ minPrice: parseFloat(e.target.value) })}
                      placeholder="50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basePrice" className="text-xs">Precio Base *</Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={data.basePrice || ''}
                      onChange={(e) => updateData({ basePrice: parseFloat(e.target.value) })}
                      placeholder="100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxPrice" className="text-xs">Precio Máximo *</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      value={data.maxPrice || ''}
                      onChange={(e) => updateData({ maxPrice: parseFloat(e.target.value) })}
                      placeholder="200"
                      required
                    />
                  </div>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    El sistema ajustará tus precios entre €{data.minPrice || 50} y €{data.maxPrice || 200} según la demanda.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="basePrice">Precio por Noche *</Label>
              <Input
                id="basePrice"
                type="number"
                value={data.basePrice || ''}
                onChange={(e) => updateData({ basePrice: parseFloat(e.target.value) })}
                placeholder="100"
                required
              />
            </div>
          )}
        </div>
      ),
      validate: async (data) => {
        if (!data.basePrice || data.basePrice <= 0) {
          return 'El precio base es requerido y debe ser mayor a 0';
        }

        if (data.enableDynamicPricing) {
          if (!data.minPrice || !data.maxPrice) {
            return 'Configura los precios mínimo y máximo para precio dinámico';
          }
          if (data.minPrice >= data.maxPrice) {
            return 'El precio mínimo debe ser menor que el máximo';
          }
          if (data.basePrice < data.minPrice || data.basePrice > data.maxPrice) {
            return 'El precio base debe estar entre el mínimo y el máximo';
          }
        }

        return true;
      },
    },
    {
      id: 'automation',
      title: 'Automatización',
      description: 'Configura las funciones automáticas',
      icon: <Calendar className="h-5 w-5" />,
      optional: true,
      fields: ({ data, updateData }) => (
        <div className="space-y-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Sincronización de Calendario</CardTitle>
                    <CardDescription className="text-xs">
                      Evita sobrevalorados automáticamente
                    </CardDescription>
                  </div>
                  <Checkbox
                    checked={data.enableCalendarSync !== false}
                    onCheckedChange={(checked) => updateData({ enableCalendarSync: checked })}
                  />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Aceptación Automática de Reservas</CardTitle>
                    <CardDescription className="text-xs">
                      Acepta reservas instantáneamente sin tu intervención
                    </CardDescription>
                  </div>
                  <Checkbox
                    checked={data.autoAcceptBookings}
                    onCheckedChange={(checked) => updateData({ autoAcceptBookings: checked })}
                  />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Mensajes Automáticos a Huéspedes</CardTitle>
                    <CardDescription className="text-xs">
                      Envía instrucciones de check-in y bienvenida
                    </CardDescription>
                  </div>
                  <Checkbox
                    checked={data.autoMessageGuests}
                    onCheckedChange={(checked) => updateData({ autoMessageGuests: checked })}
                  />
                </div>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Instant Book en Airbnb</CardTitle>
                    <CardDescription className="text-xs">
                      Aumenta reservas hasta 50% (requiere buen historial)
                    </CardDescription>
                  </div>
                  <Checkbox
                    checked={data.enableInstantBook}
                    onCheckedChange={(checked) => updateData({ enableInstantBook: checked })}
                    disabled={!data.selectedChannels?.includes('airbnb')}
                  />
                </div>
              </CardHeader>
            </Card>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-700">
              Puedes modificar estas configuraciones en cualquier momento desde el panel de control.
            </AlertDescription>
          </Alert>
        </div>
      ),
    },
    {
      id: 'complete',
      title: '¡Todo Listo!',
      description: 'Tu Channel Manager está configurado',
      icon: <CheckCircle className="h-5 w-5" />,
      fields: ({ data }) => (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">
              ¡Channel Manager Configurado!
            </h3>
            <p className="text-muted-foreground">
              Has conectado {data.selectedChannels?.length || 0} canal(es) y configurado tus preferencias
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Próximos Pasos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-left">
              <div className="flex items-start gap-2">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Importa tus anuncios existentes</p>
                  <p className="text-xs text-muted-foreground">o crea nuevos desde cero</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Configura tus calendarios</p>
                  <p className="text-xs text-muted-foreground">para sincronizar disponibilidad</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Monitorea tu rendimiento</p>
                  <p className="text-xs text-muted-foreground">en el dashboard de STR</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  const handleComplete = async (data: STRFormData) => {
    try {
      const response = await fetch('/api/str/channel-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: data.selectedChannels,
          dynamicPricing: data.enableDynamicPricing,
          basePrice: data.basePrice,
          minPrice: data.minPrice,
          maxPrice: data.maxPrice,
          calendarSync: data.enableCalendarSync,
          autoAccept: data.autoAcceptBookings,
          autoMessage: data.autoMessageGuests,
          instantBook: data.enableInstantBook,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al configurar STR');
      }

      toast.success('¡Channel Manager configurado con éxito!');
      
      if (onComplete) {
        onComplete(data);
      } else {
        router.push('/str/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al configurar STR');
      throw error;
    }
  };

  return (
    <Wizard
      steps={steps}
      initialData={{
        hasExistingListings: undefined,
        selectedChannels: [],
        enableDynamicPricing: true,
        enableCalendarSync: true,
        autoAcceptBookings: false,
        autoMessageGuests: true,
        enableInstantBook: false,
      }}
      onComplete={handleComplete}
      onCancel={onCancel}
      showPreview={false}
      className="max-w-3xl"
    />
  );
}
