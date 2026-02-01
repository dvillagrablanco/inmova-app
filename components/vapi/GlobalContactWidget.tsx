'use client';

/**
 * Widget de Contacto Global
 * Se muestra en toda la aplicación con acceso al asistente IA
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Phone, MessageCircle, Bot, X, ChevronUp, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { VapiAssistantButton, AgentType } from './VapiAssistantButton';

// Número de teléfono de USA (Twilio)
const USA_PHONE_NUMBER = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER || '+1 (XXX) XXX-XXXX';
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+34600000000';

// Mapeo de rutas a agentes
const ROUTE_TO_AGENT: Record<string, AgentType> = {
  '/dashboard': 'receptionist',
  '/dashboard/properties': 'sales',
  '/dashboard/tenants': 'customer_service',
  '/dashboard/contracts': 'customer_service',
  '/dashboard/payments': 'customer_service',
  '/dashboard/messages': 'customer_service',
  '/dashboard/maintenance': 'incidents',
  '/dashboard/herramientas': 'valuations',
  '/dashboard/analytics': 'valuations',
  '/dashboard/community': 'communities',
  '/coliving': 'coliving',
  '/media-estancia': 'coliving',
  '/admin-fincas': 'communities',
};

// Información de agentes para el widget
const AGENT_INFO: Record<AgentType, { name: string; emoji: string; color: string }> = {
  receptionist: { name: 'Ana', emoji: '👩‍💻', color: 'bg-indigo-500' },
  sales: { name: 'Elena', emoji: '👩‍💼', color: 'bg-blue-500' },
  customer_service: { name: 'María', emoji: '👩‍🔧', color: 'bg-green-500' },
  incidents: { name: 'Carlos', emoji: '👨‍🔧', color: 'bg-orange-500' },
  valuations: { name: 'Patricia', emoji: '👩‍💻', color: 'bg-purple-500' },
  acquisition: { name: 'Roberto', emoji: '👨‍💼', color: 'bg-cyan-500' },
  coliving: { name: 'Laura', emoji: '👩‍🎨', color: 'bg-pink-500' },
  communities: { name: 'Antonio', emoji: '👨‍⚖️', color: 'bg-amber-500' },
};

interface GlobalContactWidgetProps {
  className?: string;
}

export function GlobalContactWidget({ className }: GlobalContactWidgetProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPhoneTooltip, setShowPhoneTooltip] = useState(false);

  // Determinar el agente apropiado según la ruta
  const getAgentForPath = (): AgentType => {
    // Buscar coincidencia exacta
    if (ROUTE_TO_AGENT[pathname]) {
      return ROUTE_TO_AGENT[pathname];
    }
    
    // Buscar coincidencia por inicio de ruta
    for (const [route, agent] of Object.entries(ROUTE_TO_AGENT)) {
      if (pathname.startsWith(route)) {
        return agent;
      }
    }
    
    // Default: recepcionista
    return 'receptionist';
  };

  const currentAgent = getAgentForPath();
  const agentInfo = AGENT_INFO[currentAgent];

  // Mostrar tooltip del teléfono brevemente al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPhoneTooltip(true);
      setTimeout(() => setShowPhoneTooltip(false), 5000);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn('fixed bottom-6 right-6 z-50', className)}>
      {/* Tooltip del teléfono */}
      {showPhoneTooltip && !isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border">
            <p className="text-sm font-medium">¿Necesitas ayuda?</p>
            <p className="text-xs text-muted-foreground">
              Llámanos: <span className="font-mono">{USA_PHONE_NUMBER}</span>
            </p>
          </div>
        </div>
      )}

      {/* Panel expandido */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className={cn('p-4 text-white', agentInfo.color)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{agentInfo.emoji}</span>
                <div>
                  <h3 className="font-semibold">{agentInfo.name}</h3>
                  <p className="text-xs opacity-90">Asistente IA</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Opciones de contacto */}
          <div className="p-4 space-y-3">
            {/* Hablar con IA */}
            <VapiAssistantButton
              agentType={currentAgent}
              variant="default"
              size="md"
              showLabel
              className="w-full justify-start"
            />

            {/* Llamar por teléfono */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => window.open(`tel:${USA_PHONE_NUMBER}`, '_self')}
            >
              <Phone className="h-5 w-5 text-green-500" />
              <div className="text-left">
                <p className="text-sm font-medium">Llamar</p>
                <p className="text-xs text-muted-foreground font-mono">{USA_PHONE_NUMBER}</p>
              </div>
            </Button>

            {/* WhatsApp */}
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}`, '_blank')}
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
              <div className="text-left">
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Escríbenos</p>
              </div>
            </Button>
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <div className="text-xs text-center text-muted-foreground">
              <p>Atención 24/7 con IA</p>
              <p>Agentes humanos: L-V 9:00-21:00</p>
            </div>
          </div>
        </div>
      )}

      {/* Botón principal */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center gap-2 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95',
          agentInfo.color,
          'text-white px-4 py-3',
          isExpanded && 'rounded-full px-3'
        )}
      >
        {isExpanded ? (
          <ChevronUp className="h-6 w-6" />
        ) : (
          <>
            <Headphones className="h-6 w-6" />
            <span className="font-medium">
              ¿Ayuda? Habla con {agentInfo.name}
            </span>
          </>
        )}
      </button>
    </div>
  );
}

export default GlobalContactWidget;
