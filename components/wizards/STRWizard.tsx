"use client";

import React, { useState, useEffect } from 'react';
import { useWizard } from '@/lib/hooks/useWizard';
import { WizardContainer } from './WizardContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Link as LinkIcon, 
  Check, 
  AlertCircle, 
  Home,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface STRWizardProps {
  onComplete?: (data: any) => void;
}

/**
 * STR WIZARD - Wizard de configuración STR en 4 pasos
 * 
 * Pasos:
 * 1. Selección de Canales (Airbnb, Booking, etc.)
 * 2. Conexión OAuth (simulado)
 * 3. Importación de Anuncios
 * 4. Configuración de Sincronización
 */
export function STRWizard({ onComplete }: STRWizardProps) {
  const router = useRouter();

  const wizard = useWizard({
    steps: [
      {
        id: 'channels',
        title: 'Seleccionar Canales',
        description: '¿Dónde están tus anuncios?',
      },
      {
        id: 'connect',
        title: 'Conectar Cuentas',
        description: 'Autoriza el acceso a tus plataformas',
      },
      {
        id: 'import',
        title: 'Importar Anuncios',
        description: 'Selecciona qué anuncios quieres sincronizar',
      },
      {
        id: 'sync',
        title: 'Configurar Sincronización',
        description: 'Define cómo mantener todo actualizado',
      },
    ],
    persistKey: 'str-setup',
    onComplete: async (data) => {
      try {
        const res = await fetch('/api/str/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (res.ok) {
          toast.success('¡Configuración STR completada!');
          if (onComplete) {
            onComplete(data);
          } else {
            router.push('/str');
          }
        } else {
          throw new Error('Error al configurar STR');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al configurar STR');
        throw error;
      }
    },
  });

  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [connectedChannels, setConnectedChannels] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [syncConfig, setSyncConfig] = useState({
    realTime: true,
    priceSync: true,
    availabilitySync: true,
    reviewSync: false,
  });

  const channels = [
    { id: 'airbnb', name: 'Airbnb', color: 'bg-pink-100 text-pink-700', icon: '🏠' },
    { id: 'booking', name: 'Booking.com', color: 'bg-blue-100 text-blue-700', icon: '🌐' },
    { id: 'vrbo', name: 'VRBO', color: 'bg-purple-100 text-purple-700', icon: '🏡' },
    { id: 'homeaway', name: 'HomeAway', color: 'bg-orange-100 text-orange-700', icon: '🏘️' },
    { id: 'tripadvisor', name: 'TripAdvisor', color: 'bg-green-100 text-green-700', icon: '🦉' },
  ];

  // Simulación de conexión OAuth
  const handleConnect = async (channelId: string) => {
    setIsConnecting(true);
    // Simular delay de OAuth
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setConnectedChannels([...connectedChannels, channelId]);
    toast.success(`Conectado a ${channels.find((c) => c.id === channelId)?.name}`);
    setIsConnecting(false);

    // Simular carga de anuncios
    if (channelId === 'airbnb') {
      setListings([
        { id: '1', title: 'Apartamento Centro Madrid', channel: 'airbnb', price: 75 },
        { id: '2', title: 'Estudio Malasaña', channel: 'airbnb', price: 60 },
      ]);
    } else if (channelId === 'booking') {
      setListings((prev) => [
        ...prev,
        { id: '3', title: 'Piso Retiro', channel: 'booking', price: 80 },
      ]);
    }
  };

  // Actualizar datos del wizard
  useEffect(() => {
    wizard.actions.updateData('channels', selectedChannels);
  }, [selectedChannels]);

  useEffect(() => {
    wizard.actions.updateData('connected', connectedChannels);
  }, [connectedChannels]);

  useEffect(() => {
    wizard.actions.updateData('listings', selectedListings);
  }, [selectedListings]);

  useEffect(() => {
    wizard.actions.updateData('sync', syncConfig);
  }, [syncConfig]);

  // Validación
  const isCurrentStepValid = () => {
    const { currentStepIndex } = wizard.state;

    switch (currentStepIndex) {
      case 0:
        return selectedChannels.length > 0;
      case 1:
        return connectedChannels.length === selectedChannels.length;
      case 2:
        return selectedListings.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (wizard.state.currentStepIndex) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona las plataformas donde tienes anuncios activos:
            </p>

            <div className="grid gap-3">
              {channels.map((channel) => (
                <Card
                  key={channel.id}
                  className={
                    selectedChannels.includes(channel.id)
                      ? 'border-primary cursor-pointer'
                      : 'cursor-pointer hover:border-primary/50'
                  }
                  onClick={() => {
                    if (selectedChannels.includes(channel.id)) {
                      setSelectedChannels(selectedChannels.filter((id) => id !== channel.id));
                    } else {
                      setSelectedChannels([...selectedChannels, channel.id]);
                    }
                  }}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{channel.icon}</div>
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Sincroniza precios, disponibilidad y reservas
                        </p>
                      </div>
                    </div>
                    <Checkbox
                      checked={selectedChannels.includes(channel.id)}
                      onCheckedChange={() => {}} // Manejado por el onClick del Card
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-blue-900">
                <strong>Tip:</strong> Puedes conectar múltiples canales para centralizar toda tu gestión STR.
              </p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Conecta tus cuentas de cada plataforma para importar tus anuncios:
            </p>

            <div className="space-y-3">
              {selectedChannels.map((channelId) => {
                const channel = channels.find((c) => c.id === channelId);
                const isConnected = connectedChannels.includes(channelId);

                return (
                  <Card key={channelId}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{channel?.icon}</div>
                        <div>
                          <p className="font-medium">{channel?.name}</p>
                          {isConnected ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              <Check className="h-3 w-3 mr-1" />
                              Conectado
                            </Badge>
                          ) : (
                            <p className="text-xs text-muted-foreground">No conectado</p>
                          )}
                        </div>
                      </div>
                      {!isConnected && (
                        <Button
                          onClick={() => handleConnect(channelId)}
                          disabled={isConnecting}
                          size="sm"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Conectar
                            </>
                          )}
                        </Button>
                      )}
                      {isConnected && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-900">
                  <strong>Nota:</strong> Esta es una demostración. En producción, se abrirá una ventana de OAuth
                  real para autorizar el acceso.
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Encontramos {listings.length} anuncios. Selecciona cuáles quieres sincronizar:
            </p>

            {listings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Importando anuncios...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map((listing) => (
                  <Card
                    key={listing.id}
                    className={
                      selectedListings.includes(listing.id)
                        ? 'border-primary cursor-pointer'
                        : 'cursor-pointer hover:border-primary/50'
                    }
                    onClick={() => {
                      if (selectedListings.includes(listing.id)) {
                        setSelectedListings(selectedListings.filter((id) => id !== listing.id));
                      } else {
                        setSelectedListings([...selectedListings, listing.id]);
                      }
                    }}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Home className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{listing.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {channels.find((c) => c.id === listing.channel)?.name}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              €{listing.price}/noche
                            </span>
                          </div>
                        </div>
                      </div>
                      <Checkbox
                        checked={selectedListings.includes(listing.id)}
                        onCheckedChange={() => {}}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground mb-4">
              Configura cómo quieres que INMOVA sincronice tus anuncios:
            </p>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="font-medium">Sincronización en Tiempo Real</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Los cambios se sincronizan instantáneamente en todos los canales
                    </p>
                  </div>
                  <Checkbox
                    checked={syncConfig.realTime}
                    onCheckedChange={(checked) =>
                      setSyncConfig({ ...syncConfig, realTime: checked as boolean })
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Sincronizar Precios</p>
                    <p className="text-sm text-muted-foreground">
                      Actualiza precios automáticamente en todas las plataformas
                    </p>
                  </div>
                  <Checkbox
                    checked={syncConfig.priceSync}
                    onCheckedChange={(checked) =>
                      setSyncConfig({ ...syncConfig, priceSync: checked as boolean })
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Sincronizar Disponibilidad</p>
                    <p className="text-sm text-muted-foreground">
                      Evita dobles reservas sincronizando calendarios
                    </p>
                  </div>
                  <Checkbox
                    checked={syncConfig.availabilitySync}
                    onCheckedChange={(checked) =>
                      setSyncConfig({ ...syncConfig, availabilitySync: checked as boolean })
                    }
                  />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium mb-1">Sincronizar Reseñas</p>
                    <p className="text-sm text-muted-foreground">
                      Importa reseñas de todas las plataformas a INMOVA
                    </p>
                  </div>
                  <Checkbox
                    checked={syncConfig.reviewSync}
                    onCheckedChange={(checked) =>
                      setSyncConfig({ ...syncConfig, reviewSync: checked as boolean })
                    }
                  />
                </CardContent>
              </Card>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                <strong>✓ Listo para sincronizar</strong>
                <br />
                Haz clic en "Finalizar" para activar tu Channel Manager STR.
              </p>
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
      title="Configurar Channel Manager STR"
      description="Conecta tus canales de alquiler vacacional en minutos"
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
