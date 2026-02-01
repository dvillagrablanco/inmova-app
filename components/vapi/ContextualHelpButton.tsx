'use client';

/**
 * Botón de Ayuda Contextual
 * Se adapta al contexto de la página mostrando el agente más apropiado
 */

import { useState } from 'react';
import { HelpCircle, Phone, Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Tipos de agentes
export type AgentType = 
  | 'sales' | 'customer_service' | 'incidents' | 'valuations' 
  | 'acquisition' | 'coliving' | 'communities' | 'receptionist';

// Info de agentes
const AGENT_INFO: Record<AgentType, { name: string; title: string; emoji: string; color: string }> = {
  receptionist: { name: 'Ana', title: 'Recepcionista', emoji: '👩‍💻', color: 'bg-indigo-500' },
  sales: { name: 'Elena', title: 'Ventas', emoji: '👩‍💼', color: 'bg-blue-500' },
  customer_service: { name: 'María', title: 'Soporte', emoji: '👩‍🔧', color: 'bg-green-500' },
  incidents: { name: 'Carlos', title: 'Incidencias', emoji: '👨‍🔧', color: 'bg-orange-500' },
  valuations: { name: 'Patricia', title: 'Valoraciones', emoji: '👩‍💻', color: 'bg-purple-500' },
  acquisition: { name: 'Roberto', title: 'Captación', emoji: '👨‍💼', color: 'bg-cyan-500' },
  coliving: { name: 'Laura', title: 'Coliving', emoji: '👩‍🎨', color: 'bg-pink-500' },
  communities: { name: 'Antonio', title: 'Comunidades', emoji: '👨‍⚖️', color: 'bg-amber-500' },
};

const PHONE_NUMBER = process.env.NEXT_PUBLIC_VAPI_PHONE_NUMBER || '+1 (XXX) XXX-XXXX';

interface ContextualHelpButtonProps {
  agentType: AgentType;
  context?: string;
  variant?: 'icon' | 'text' | 'full';
  className?: string;
}

export function ContextualHelpButton({
  agentType,
  context,
  variant = 'icon',
  className,
}: ContextualHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const agent = AGENT_INFO[agentType];

  const startCall = () => {
    // Iniciar llamada web con Vapi
    console.log('Iniciando llamada con', agent.name);
    // Aquí iría la integración con Vapi
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {variant === 'icon' ? (
          <Button
            variant="ghost"
            size="icon"
            className={cn('rounded-full', className)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        ) : variant === 'text' ? (
          <Button variant="outline" size="sm" className={cn('gap-2', className)}>
            <Bot className="h-4 w-4" />
            Ayuda
          </Button>
        ) : (
          <Button variant="outline" className={cn('gap-2', className)}>
            <span className="text-lg">{agent.emoji}</span>
            ¿Necesitas ayuda? Pregunta a {agent.name}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          {/* Header del agente */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full text-2xl',
              agent.color
            )}>
              {agent.emoji}
            </div>
            <div>
              <h4 className="font-semibold">{agent.name}</h4>
              <p className="text-xs text-muted-foreground">{agent.title}</p>
            </div>
          </div>

          {/* Contexto */}
          {context && (
            <p className="text-sm text-muted-foreground">
              {context}
            </p>
          )}

          {/* Botones de acción */}
          <div className="space-y-2">
            <Button className="w-full gap-2" onClick={startCall}>
              <Bot className="h-4 w-4" />
              Hablar con {agent.name}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.open(`tel:${PHONE_NUMBER}`, '_self')}
            >
              <Phone className="h-4 w-4" />
              Llamar: {PHONE_NUMBER}
            </Button>
          </div>

          {/* Info adicional */}
          <p className="text-xs text-center text-muted-foreground">
            Atención inmediata con IA
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default ContextualHelpButton;
