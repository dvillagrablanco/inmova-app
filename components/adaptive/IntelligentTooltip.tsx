'use client';

import React, { useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface IntelligentTooltipProps {
  /**
   * Contenido del tooltip
   */
  content: string;

  /**
   * Título opcional
   */
  title?: string;

  /**
   * Si debe mostrarse siempre o solo para principiantes
   */
  forceShow?: boolean;

  /**
   * Nivel de importancia: info, warning, tip
   */
  variant?: 'info' | 'warning' | 'tip';

  /**
   * Posición del tooltip
   */
  side?: 'top' | 'right' | 'bottom' | 'left';

  /**
   * Si se puede cerrar permanentemente
   */
  dismissible?: boolean;

  /**
   * ID único para recordar si fue cerrado
   */
  tooltipId?: string;

  /**
   * Children (el elemento que activa el tooltip)
   */
  children?: React.ReactNode;

  /**
   * Mostrar icono de ayuda automáticamente
   */
  showIcon?: boolean;
}

/**
 * INTELLIGENT TOOLTIP - Tooltips contextuales para principiantes
 *
 * Características:
 * - Se ocultan automáticamente para usuarios avanzados
 * - Pueden ser cerrados permanentemente (localStorage)
 * - Diferentes variantes visuales (info, warning, tip)
 * - Soporte para título y contenido largo
 */
export function IntelligentTooltip({
  content,
  title,
  forceShow = false,
  variant = 'info',
  side = 'top',
  dismissible = false,
  tooltipId,
  children,
  showIcon = false,
}: IntelligentTooltipProps) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (!dismissible || !tooltipId) return false;
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(`tooltip-dismissed-${tooltipId}`) === 'true';
  });

  const handleDismiss = () => {
    if (dismissible && tooltipId) {
      localStorage.setItem(`tooltip-dismissed-${tooltipId}`, 'true');
      setDismissed(true);
    }
  };

  // Si fue cerrado permanentemente, no mostrar
  if (dismissed && !forceShow) {
    return <>{children}</>;
  }

  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-orange-50 border-orange-200 text-orange-900',
    tip: 'bg-green-50 border-green-200 text-green-900',
  };

  const variantIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    tip: '💡',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children ||
            (showIcon ? (
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            ) : (
              <span className="cursor-help">{content}</span>
            ))}
        </TooltipTrigger>
        <TooltipContent side={side} className={cn('max-w-sm border', variantStyles[variant])}>
          <div className="space-y-2">
            {/* Header con icono y título */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{variantIcons[variant]}</span>
                {title && <p className="font-semibold text-sm">{title}</p>}
              </div>
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Cerrar ayuda"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Contenido */}
            <p className="text-sm leading-relaxed">{content}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Hook para gestionar tooltips inteligentes
 */
export function useIntelligentTooltips() {
  const clearAllTooltips = () => {
    if (typeof window === 'undefined') return;

    const keys = Object.keys(localStorage).filter((key) => key.startsWith('tooltip-dismissed-'));

    keys.forEach((key) => localStorage.removeItem(key));
  };

  const clearTooltip = (tooltipId: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`tooltip-dismissed-${tooltipId}`);
  };

  return {
    clearAllTooltips,
    clearTooltip,
  };
}
