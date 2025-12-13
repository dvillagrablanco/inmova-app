'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  wizard?: boolean; // Indica si abre un wizard guiado
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ActionButton; // Mantener retrocompatibilidad
  actions?: ActionButton[]; // Múltiples acciones
  illustration?: ReactNode; // Ilustración opcional
  helpText?: string; // Texto de ayuda
  chatSupport?: boolean; // Mostrar botón de chat
  className?: string;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  actions, 
  illustration,
  helpText,
  chatSupport = false,
  className 
}: EmptyStateProps) {
  // Si se proporciona 'action', usarla como única acción (retrocompatibilidad)
  const allActions = actions || (action ? [action] : []);

  const handleChatSupport = () => {
    // Abrir chat de soporte (puede integrarse con chatbot existente)
    if (typeof window !== 'undefined') {
      window.location.href = '/chat';
    }
  };

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      {/* Ilustración opcional */}
      {illustration && (
        <div className="mb-6 max-w-md w-full">
          {illustration}
        </div>
      )}
      
      {/* Icono */}
      <div className="mb-4 text-gray-400">
        {typeof icon === 'string' ? (
          <div className="text-6xl">{icon}</div>
        ) : (
          <div className="w-16 h-16 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      {/* Título */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2 text-center">
        {title}
      </h3>

      {/* Descripción */}
      <p className="text-gray-600 text-center max-w-md mb-6">
        {description}
      </p>

      {/* Acciones */}
      {allActions.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          {allActions.map((actionItem, index) => (
            <Button
              key={index}
              onClick={actionItem.onClick}
              variant={actionItem.variant || (index === 0 ? 'default' : 'outline')}
              className={cn(
                index === 0 && !actionItem.variant && "gradient-primary shadow-primary",
                actionItem.wizard && "relative"
              )}
            >
              {actionItem.icon && <span className="mr-2">{actionItem.icon}</span>}
              {actionItem.label}
              {actionItem.wizard && (
                <span className="ml-2 text-xs bg-white/20 px-1.5 py-0.5 rounded">Asistente</span>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Texto de ayuda */}
      {helpText && (
        <p className="text-sm text-gray-500 text-center mt-4">
          {helpText}
        </p>
      )}

      {/* Chat support */}
      {chatSupport && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleChatSupport}
          className="mt-3 text-indigo-600 hover:text-indigo-700"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Hablar con soporte
        </Button>
      )}
    </div>
  );
}
