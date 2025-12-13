/**
 * Componente mejorado de Empty State con presets
 * Usa configuraciones predefinidas para consistencia
 */

'use client';

import React from 'react';
import { EmptyState } from './empty-state';
import { EMPTY_STATE_PRESETS, EmptyStatePresetKey } from '@/lib/empty-state-presets';
import { Button } from './button';
import { PlusCircle } from 'lucide-react';

interface ActionButton {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
}

interface EnhancedEmptyStateProps {
  preset: EmptyStatePresetKey;
  primaryAction?: ActionButton;
  secondaryActions?: ActionButton[];
  chatSupport?: boolean;
  className?: string;
  // Props personalizadas para sobrescribir el preset
  customTitle?: string;
  customDescription?: string;
  customHelpText?: string;
}

/**
 * Componente Enhanced Empty State
 * Usa presets predefinidos pero permite personalización
 */
export function EnhancedEmptyState({
  preset,
  primaryAction,
  secondaryActions = [],
  chatSupport = false,
  className,
  customTitle,
  customDescription,
  customHelpText,
}: EnhancedEmptyStateProps) {
  const config = EMPTY_STATE_PRESETS[preset];

  if (!config) {
    console.error(`Preset "${preset}" no encontrado en EMPTY_STATE_PRESETS`);
    return null;
  }

  // Construir array de acciones
  const actions = [];
  
  if (primaryAction) {
    actions.push({
      ...primaryAction,
      icon: primaryAction.icon || <PlusCircle className="h-4 w-4" aria-hidden="true" />,
    });
  }

  if (secondaryActions.length > 0) {
    actions.push(...secondaryActions);
  }

  return (
    <EmptyState
      icon={config.icon}
      title={customTitle || config.title}
      description={customDescription || config.description}
      illustration={'illustration' in config ? config.illustration : undefined}
      helpText={customHelpText || ('helpText' in config ? config.helpText : undefined)}
      actions={actions.length > 0 ? actions : undefined}
      chatSupport={chatSupport}
      className={className}
    />
  );
}
