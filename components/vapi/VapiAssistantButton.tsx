// @ts-nocheck
'use client';

/**
 * Botón de Asistente IA de Voz
 * Permite al usuario iniciar una conversación con un agente IA específico
 */

import { useState, useCallback } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Bot, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Tipos de agentes disponibles
export type AgentType =
  | 'sales' // Elena - Ventas
  | 'customer_service' // María - Atención al Cliente
  | 'incidents' // Carlos - Incidencias
  | 'valuations' // Patricia - Valoraciones
  | 'acquisition' // Roberto - Captación
  | 'coliving' // Laura - Coliving
  | 'communities' // Antonio - Comunidades
  | 'receptionist'; // Recepcionista - Derivación

// Información de cada agente
const AGENT_INFO: Record<
  AgentType,
  {
    name: string;
    title: string;
    description: string;
    avatar: string;
    color: string;
    greeting: string;
  }
> = {
  sales: {
    name: 'Elena',
    title: 'Asesora Comercial',
    description: 'Experta en ventas inmobiliarias y captación de clientes',
    avatar: '👩‍💼',
    color: 'bg-blue-500',
    greeting: '¡Hola! Soy Elena, tu asesora comercial. ¿Buscas comprar, vender o alquilar?',
  },
  customer_service: {
    name: 'María',
    title: 'Atención al Cliente',
    description: 'Especialista en soporte y consultas de inquilinos',
    avatar: '👩‍🔧',
    color: 'bg-green-500',
    greeting: '¡Hola! Soy María, del equipo de atención al cliente. ¿En qué puedo ayudarte?',
  },
  incidents: {
    name: 'Carlos',
    title: 'Técnico de Incidencias',
    description: 'Gestión y resolución de averías y emergencias',
    avatar: '👨‍🔧',
    color: 'bg-orange-500',
    greeting:
      '¡Hola! Soy Carlos, del departamento técnico. ¿Tienes alguna incidencia que reportar?',
  },
  valuations: {
    name: 'Patricia',
    title: 'Tasadora Inmobiliaria',
    description: 'Experta en valoraciones y análisis de mercado',
    avatar: '👩‍💻',
    color: 'bg-purple-500',
    greeting:
      '¡Hola! Soy Patricia, tasadora inmobiliaria. ¿Te gustaría conocer el valor de tu propiedad?',
  },
  acquisition: {
    name: 'Roberto',
    title: 'Captador de Propiedades',
    description: 'Especialista en captación de inmuebles para venta/alquiler',
    avatar: '👨‍💼',
    color: 'bg-cyan-500',
    greeting:
      '¡Hola! Soy Roberto, del equipo de captación. ¿Estás pensando en vender o alquilar tu propiedad?',
  },
  coliving: {
    name: 'Laura',
    title: 'Especialista Coliving',
    description: 'Experta en espacios compartidos y comunidades',
    avatar: '👩‍🎨',
    color: 'bg-pink-500',
    greeting: '¡Hola! Soy Laura, especialista en coliving. ¿Buscas una comunidad donde vivir?',
  },
  communities: {
    name: 'Antonio',
    title: 'Administrador de Fincas',
    description: 'Experto en comunidades de propietarios',
    avatar: '👨‍⚖️',
    color: 'bg-amber-500',
    greeting:
      '¡Hola! Soy Antonio, administrador de fincas. ¿En qué puedo ayudarle con su comunidad?',
  },
  receptionist: {
    name: 'Ana',
    title: 'Recepcionista Virtual',
    description: 'Te conecta con el especialista adecuado',
    avatar: '👩‍💻',
    color: 'bg-indigo-500',
    greeting:
      '¡Hola! Soy Ana, tu asistente virtual de Inmova. ¿Con qué departamento deseas hablar?',
  },
};

// Número de teléfono de contacto (configurable por entorno)
const CONTACT_PHONE = (process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER ?? '').trim();

interface VapiAssistantButtonProps {
  agentType: AgentType;
  variant?: 'default' | 'outline' | 'ghost' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function VapiAssistantButton({
  agentType,
  variant = 'default',
  size = 'md',
  showLabel = true,
  className,
}: VapiAssistantButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callStatus, setCallStatus] = useState<string>('');

  const agent = AGENT_INFO[agentType];
  const hasContactPhone = CONTACT_PHONE.length > 0;

  // Iniciar llamada web con Vapi
  const startWebCall = useCallback(async () => {
    setIsConnecting(true);
    setCallStatus('Conectando...');

    try {
      const response = await fetch('/api/vapi/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callType: 'web',
          agentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al conectar');
      }

      const data = await response.json();

      // Aquí se conectaría con el WebSocket de Vapi
      // Por ahora simulamos la conexión
      setIsConnected(true);
      setCallStatus('Conectado');
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('Error al conectar');
    } finally {
      setIsConnecting(false);
    }
  }, [agentType]);

  // Finalizar llamada
  const endCall = useCallback(() => {
    setIsConnected(false);
    setCallStatus('Llamada finalizada');
    setTimeout(() => {
      setCallStatus('');
      setIsOpen(false);
    }, 2000);
  }, []);

  // Alternar mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Estilos según tamaño
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  // Botón flotante
  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full shadow-lg transition-all hover:scale-105',
            agent.color,
            'text-white px-4 py-3',
            className
          )}
        >
          <Bot className="h-6 w-6" />
          {showLabel && <span className="font-medium">Hablar con {agent.name}</span>}
        </button>
        <AssistantDialog
          agent={agent}
          agentType={agentType}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          isConnecting={isConnecting}
          isConnected={isConnected}
          isMuted={isMuted}
          callStatus={callStatus}
          onStartCall={startWebCall}
          onEndCall={endCall}
          onToggleMute={toggleMute}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant={variant === 'default' ? 'default' : variant}
        size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        onClick={() => setIsOpen(true)}
        className={cn('gap-2', variant === 'default' && agent.color, className)}
      >
        <Bot
          className={cn(
            size === 'sm' && 'h-4 w-4',
            size === 'md' && 'h-5 w-5',
            size === 'lg' && 'h-6 w-6'
          )}
        />
        {showLabel && <span>{size === 'sm' ? agent.name : `Hablar con ${agent.name}`}</span>}
      </Button>
      <AssistantDialog
        agent={agent}
        agentType={agentType}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isConnecting={isConnecting}
        isConnected={isConnected}
        isMuted={isMuted}
        callStatus={callStatus}
        onStartCall={startWebCall}
        onEndCall={endCall}
        onToggleMute={toggleMute}
      />
    </>
  );
}

// Componente del diálogo
function AssistantDialog({
  agent,
  agentType,
  isOpen,
  setIsOpen,
  isConnecting,
  isConnected,
  isMuted,
  callStatus,
  onStartCall,
  onEndCall,
  onToggleMute,
}: {
  agent: (typeof AGENT_INFO)[AgentType];
  agentType: AgentType;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isConnecting: boolean;
  isConnected: boolean;
  isMuted: boolean;
  callStatus: string;
  onStartCall: () => void;
  onEndCall: () => void;
  onToggleMute: () => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full text-3xl',
                agent.color
              )}
            >
              {agent.avatar}
            </div>
            <div>
              <DialogTitle className="text-xl">{agent.name}</DialogTitle>
              <DialogDescription>{agent.title}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Estado de la llamada */}
          {callStatus && (
            <div className="flex items-center justify-center">
              <Badge variant={isConnected ? 'default' : 'secondary'}>{callStatus}</Badge>
            </div>
          )}

          {/* Descripción del agente */}
          {!isConnected && !isConnecting && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">{agent.description}</p>
              <p className="mt-2 text-sm italic">"{agent.greeting}"</p>
            </div>
          )}

          {/* Área de llamada activa */}
          {isConnected && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-full text-5xl animate-pulse',
                  agent.color
                )}
              >
                {agent.avatar}
              </div>
              <p className="text-lg font-medium">Hablando con {agent.name}...</p>

              {/* Visualización de audio (simulada) */}
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1 rounded-full bg-primary transition-all',
                      isConnected && !isMuted ? 'animate-pulse' : ''
                    )}
                    style={{
                      height: `${Math.random() * 24 + 8}px`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Controles */}
          <div className="flex justify-center gap-4">
            {!isConnected ? (
              <>
                {/* Botón de llamar */}
                <Button
                  size="lg"
                  className={cn('gap-2', agent.color)}
                  onClick={onStartCall}
                  disabled={isConnecting}
                >
                  {isConnecting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Phone className="h-5 w-5" />
                  )}
                  {isConnecting ? 'Conectando...' : 'Iniciar conversación'}
                </Button>

                {/* Opción de llamar por teléfono */}
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    if (hasContactPhone) {
                      window.open(`tel:${CONTACT_PHONE}`, '_self');
                    }
                  }}
                  disabled={!hasContactPhone}
                >
                  <Phone className="h-5 w-5" />
                  {hasContactPhone ? 'Llamar' : 'Teléfono no configurado'}
                </Button>
              </>
            ) : (
              <>
                {/* Botón de mute */}
                <Button
                  size="lg"
                  variant={isMuted ? 'destructive' : 'outline'}
                  onClick={onToggleMute}
                  className="rounded-full h-14 w-14"
                >
                  {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>

                {/* Botón de colgar */}
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={onEndCall}
                  className="rounded-full h-14 w-14"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Información adicional */}
          {!isConnected && !isConnecting && (
            <div className="text-center text-xs text-muted-foreground">
              <p>También puedes llamar directamente al:</p>
              <p className="font-mono font-medium">
                {hasContactPhone ? CONTACT_PHONE : 'Teléfono no configurado'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VapiAssistantButton;
