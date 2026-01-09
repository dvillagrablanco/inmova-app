'use client';

import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Botón flotante de acceso rápido a Tours
 * 
 * Se muestra en la esquina inferior derecha (móvil y desktop)
 * Permite al usuario acceder rápidamente a la lista de tours disponibles
 */
export function FloatingTourButton() {
  const [isMinimized, setIsMinimized] = useState(false);
  const router = useRouter();

  const handleClick = () => {
    router.push('/configuracion?tab=tours');
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          // Posicionado arriba del chatbot (bottom-24 para dejar espacio)
          'fixed bottom-24 right-6 z-40',
          'w-12 h-12 rounded-full',
          'bg-gradient-to-br from-indigo-500 to-purple-600',
          'text-white shadow-xl',
          'hover:scale-110 active:scale-95',
          'transition-all duration-200',
          'flex items-center justify-center',
          'lg:bottom-28 lg:right-8',
          // Ocultar en móvil para evitar solapamiento con bottom nav
          'hidden lg:flex'
        )}
        aria-label="Mostrar ayuda de tours"
      >
        <HelpCircle size={20} />
      </button>
    );
  }

  return (
    <div
      className={cn(
        // Posicionado arriba del chatbot
        'fixed bottom-24 right-6 z-40',
        'bg-white rounded-2xl shadow-2xl',
        'border border-gray-200',
        'p-4 max-w-xs',
        'lg:bottom-28 lg:right-8',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        // Ocultar en móvil
        'hidden lg:block'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <HelpCircle size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">¿Necesitas ayuda?</h3>
            <p className="text-xs text-gray-500">Tours interactivos</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Minimizar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-600 mb-4">
        Aprende a usar la plataforma con nuestros tours guiados paso a paso.
      </p>

      {/* CTA Button */}
      <Button
        onClick={handleClick}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
        size="sm"
      >
        Ver tours disponibles
      </Button>

      {/* Footer tip */}
      <p className="text-xs text-gray-400 mt-3 text-center">
        También en <span className="font-medium">Configuración → Tours</span>
      </p>
    </div>
  );
}
