'use client';

/**
 * Tooltips Contextuales Inteligentes
 * 
 * Se adaptan según:
 * - Perfil del usuario (rol + experiencia)
 * - Página actual
 * - Acciones realizadas
 * 
 * Features:
 * - Auto-hide para usuarios avanzados
 * - Persistencia de "no mostrar de nuevo"
 * - Hints progresivos (aparecen según avanza el usuario)
 */

import { useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { X, HelpCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { needsExtraHelp } from '@/lib/user-profiles-config';

interface ContextualTooltipProps {
  id: string; // ID único del tooltip
  children: ReactNode; // El elemento que dispara el tooltip
  title: string;
  content: string | ReactNode;
  type?: 'info' | 'tip' | 'warning';
  trigger?: 'hover' | 'click';
  persistent?: boolean; // Si true, no se puede cerrar permanentemente
  minExperience?: 'principiante' | 'intermedio' | 'avanzado'; // Nivel mínimo para mostrar
}

export function ContextualTooltip({
  id,
  children,
  title,
  content,
  type = 'info',
  trigger = 'hover',
  persistent = false,
  minExperience,
}: ContextualTooltipProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Verificar si el usuario ha cerrado este tooltip permanentemente
  useEffect(() => {
    if (persistent) return;

    const dismissed = localStorage.getItem(`tooltip_dismissed_${id}`);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, [id, persistent]);

  // Verificar si debe mostrarse según el perfil del usuario
  const shouldShow = () => {
    if (isDismissed) return false;
    if (!session?.user) return false;

    const userProfile = {
      role: (session.user as any).role || 'gestor',
      experienceLevel: (session.user as any).experienceLevel || 'principiante',
      techSavviness: (session.user as any).techSavviness || 'medio',
    };

    // Si el usuario es avanzado, solo mostrar tooltips críticos
    if (userProfile.experienceLevel === 'avanzado' && type === 'info') {
      return false;
    }

    // Filtrar por nivel de experiencia mínimo
    if (minExperience) {
      const levels = ['principiante', 'intermedio', 'avanzado'];
      const userLevel = levels.indexOf(userProfile.experienceLevel);
      const minLevel = levels.indexOf(minExperience);
      if (userLevel > minLevel) return false;
    }

    // Mostrar siempre para usuarios que necesitan ayuda extra
    if (needsExtraHelp(userProfile)) return true;

    return true;
  };

  const handleDismiss = () => {
    if (!persistent) {
      localStorage.setItem(`tooltip_dismissed_${id}`, 'true');
      setIsDismissed(true);
    }
    setIsOpen(false);
  };

  const getIcon = () => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'tip':
        return 'bg-yellow-50 border-yellow-200';
      case 'warning':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  if (!shouldShow()) {
    return <>{children}</>;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div 
          className="relative inline-flex"
          onMouseEnter={() => trigger === 'hover' && setIsOpen(true)}
          onMouseLeave={() => trigger === 'hover' && setIsOpen(false)}
          onClick={() => trigger === 'click' && setIsOpen(!isOpen)}
        >
          {children}
          {/* Indicador visual de tooltip disponible */}
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className={`w-80 ${getBgColor()} border-2 shadow-lg`}
        side="top"
        align="center"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getIcon()}
              <h4 className="font-semibold text-sm text-gray-900">{title}</h4>
            </div>
            {!persistent && (
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Cerrar y no volver a mostrar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="text-sm text-gray-700">
            {typeof content === 'string' ? <p>{content}</p> : content}
          </div>
          {!persistent && (
            <div className="pt-2 border-t border-gray-200">
              <button
                onClick={handleDismiss}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                No volver a mostrar este mensaje
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Componente de Ayuda Flotante (FloatingHelp)
 * Botón persistente de ayuda en la esquina de la pantalla
 */

export function FloatingHelp() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const userProfile = {
    role: (session?.user as any)?.role || 'gestor',
    experienceLevel: (session?.user as any)?.experienceLevel || 'principiante',
    techSavviness: (session?.user as any)?.techSavviness || 'medio',
  };

  const needsHelp = needsExtraHelp(userProfile);

  // Solo mostrar para usuarios que necesitan ayuda
  if (!needsHelp) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 animate-bounce-slow"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" side="left">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-lg mb-2">¿Necesitas Ayuda? 💡</h3>
            <p className="text-sm text-gray-600">
              Estamos aquí para ayudarte a aprovechar al máximo Inmova.
            </p>
          </div>
          
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <HelpCircle className="mr-2 h-4 w-4" />
              Iniciar Tutorial Interactivo
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Lightbulb className="mr-2 h-4 w-4" />
              Ver Videos Tutoriales
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <AlertCircle className="mr-2 h-4 w-4" />
              Contactar Soporte 24/7
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
