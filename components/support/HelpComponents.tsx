'use client';

import React from 'react';
import { HelpCircle, ExternalLink, MessageCircle, Book } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { crispUtils } from './ChatWidget';

/**
 * 🆘 SOPORTE INTEGRADO - Componentes de Ayuda
 * 
 * Soporte preventivo es mejor que reactivo.
 * Estos componentes ayudan al usuario antes de que contacte soporte.
 */

interface HelpTooltipProps {
  /**
   * Texto de ayuda a mostrar
   */
  content: string;
  /**
   * Posición del tooltip
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * Tamaño del icono
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Tooltip de ayuda con icono de interrogación
 * 
 * @example
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <label>IBAN</label>
 *   <HelpTooltip content="Introduce tu código IBAN de 24 dígitos (ES...)" />
 * </div>
 * ```
 */
export function HelpTooltip({ content, side = 'top', size = 'sm' }: HelpTooltipProps) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-help"
            aria-label="Ayuda"
          >
            <HelpCircle className={sizeClasses[size]} />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface DocLinkProps {
  /**
   * URL de la documentación
   */
  href: string;
  /**
   * Texto del enlace
   */
  children?: React.ReactNode;
  /**
   * Mostrar como botón o como link
   */
  variant?: 'button' | 'link';
}

/**
 * Enlace a documentación externa
 * 
 * @example
 * ```tsx
 * <DocLink href="/docs/contratos/crear">
 *   ¿Cómo crear un contrato?
 * </DocLink>
 * ```
 */
export function DocLink({ href, children, variant = 'link' }: DocLinkProps) {
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        asChild
        className="text-gray-600 hover:text-gray-900"
      >
        <a href={href} target="_blank" rel="noopener noreferrer">
          <Book className="h-4 w-4 mr-2" />
          {children || 'Ver documentación'}
          <ExternalLink className="h-3 w-3 ml-2" />
        </a>
      </Button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
    >
      {children || 'Ver documentación'}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

interface QuickHelpProps {
  /**
   * Título de la ayuda
   */
  title: string;
  /**
   * Pasos de ayuda
   */
  steps: string[];
  /**
   * URL de documentación (opcional)
   */
  docUrl?: string;
  /**
   * Mensaje pre-escrito para chat (opcional)
   */
  chatMessage?: string;
}

/**
 * Panel de ayuda rápida con pasos
 * 
 * @example
 * ```tsx
 * <QuickHelp
 *   title="Cómo crear una propiedad"
 *   steps={[
 *     'Haz click en "Nueva Propiedad"',
 *     'Completa los datos básicos',
 *     'Sube fotos de la propiedad',
 *     'Guarda los cambios'
 *   ]}
 *   docUrl="/docs/propiedades"
 * />
 * ```
 */
export function QuickHelp({ title, steps, docUrl, chatMessage }: QuickHelpProps) {
  const handleOpenChat = () => {
    if (chatMessage) {
      crispUtils.setMessage(chatMessage);
    }
    crispUtils.open();
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">{title}</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside mb-3">
            {steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-2">
            {docUrl && (
              <DocLink href={docUrl} variant="button">
                Documentación
              </DocLink>
            )}
            {chatMessage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenChat}
                className="text-gray-600 hover:text-gray-900"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Preguntar al soporte
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface EmptyStateHelpProps {
  /**
   * Título del estado vacío
   */
  title: string;
  /**
   * Descripción
   */
  description: string;
  /**
   * Acción principal
   */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * URL de documentación (opcional)
   */
  docUrl?: string;
}

/**
 * Estado vacío con ayuda integrada
 * 
 * @example
 * ```tsx
 * {properties.length === 0 && (
 *   <EmptyStateHelp
 *     title="No tienes propiedades"
 *     description="Crea tu primera propiedad para empezar a gestionar tu cartera inmobiliaria."
 *     primaryAction={{
 *       label: 'Crear Primera Propiedad',
 *       onClick: () => router.push('/dashboard/properties/new')
 *     }}
 *     docUrl="/docs/getting-started"
 *   />
 * )}
 * ```
 */
export function EmptyStateHelp({
  title,
  description,
  primaryAction,
  docUrl,
}: EmptyStateHelpProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-gray-100 rounded-full p-4 mb-4">
        <HelpCircle className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 max-w-md mb-6">{description}</p>
      <div className="flex flex-wrap gap-3 justify-center">
        {primaryAction && (
          <Button onClick={primaryAction.onClick} size="lg">
            {primaryAction.label}
          </Button>
        )}
        {docUrl && (
          <DocLink href={docUrl} variant="button">
            Ver guía completa
          </DocLink>
        )}
      </div>
    </div>
  );
}

interface FeatureTourProps {
  /**
   * Título del tour
   */
  title: string;
  /**
   * Características destacadas
   */
  features: Array<{
    icon: React.ReactNode;
    title: string;
    description: string;
  }>;
  /**
   * URL de video tutorial (opcional)
   */
  videoUrl?: string;
}

/**
 * Tour de características para páginas nuevas
 * 
 * @example
 * ```tsx
 * <FeatureTour
 *   title="Bienvenido al Dashboard de Pagos"
 *   features={[
 *     {
 *       icon: <CreditCard />,
 *       title: 'Pagos Recurrentes',
 *       description: 'Cobra automáticamente cada mes'
 *     },
 *     {
 *       icon: <Bell />,
 *       title: 'Recordatorios',
 *       description: 'Notifica a inquilinos morosos'
 *     }
 *   ]}
 * />
 * ```
 */
export function FeatureTour({ title, features, videoUrl }: FeatureTourProps) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-shrink-0 text-indigo-600">{feature.icon}</div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
      {videoUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={videoUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver video tutorial
          </a>
        </Button>
      )}
    </div>
  );
}
