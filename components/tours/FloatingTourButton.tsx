'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useOnboardingElement } from '@/lib/hooks/useOnboardingManager';

/**
 * Botón flotante de acceso rápido a Tours
 *
 * Se muestra en la esquina inferior derecha (móvil y desktop)
 * Permite al usuario acceder rápidamente a la lista de tours disponibles
 * 
 * IMPORTANTE: Solo se muestra si no hay otros elementos de onboarding activos
 * (wizard, tour, checklist) para evitar solapamientos
 */
export function FloatingTourButton() {
  const [isMinimized, setIsMinimized] = useState(true); // Iniciar minimizado
  const router = useRouter();
  const { canShow, dismiss } = useOnboardingElement('tour-button');

  const handleClick = () => {
    router.push('/configuracion?tab=tours');
  };

  const handleDismiss = () => {
    setIsMinimized(true);
    dismiss();
  };

  // No mostrar si hay otros elementos de onboarding activos
  if (!canShow) {
    return null;
  }

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={cn(
          // Posicionamiento controlado por CSS global via data-floating-widget
          'floating-tour-button',
          'w-12 h-12 rounded-full',
          'bg-gradient-to-br from-indigo-500 to-purple-600',
          'text-white shadow-xl',
          'hover:scale-110 active:scale-95',
          'transition-all duration-200',
          'flex items-center justify-center',
          // Ocultar en móvil para evitar solapamiento
          'hidden lg:flex'
        )}
        data-floating-widget="tour-button"
        aria-label="Mostrar ayuda de tours"
      >
        <HelpCircle size={20} />
      </button>
    );
  }

  return (
    <div
      className={cn(
        // Posicionamiento controlado por CSS global via data-floating-widget
        'floating-tour-button',
        'bg-white rounded-2xl shadow-2xl',
        'border border-gray-200',
        'p-4 max-w-xs',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        // Ocultar en móvil
        'hidden lg:block'
      )}
      data-floating-widget="tour-button"
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
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          aria-label="Cerrar"
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
