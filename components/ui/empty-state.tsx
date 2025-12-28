/**
 * Empty State Component
 * Estados vacíos mejorados con CTAs claros
 */

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  className,
  size = 'md',
}: EmptyStateProps) {
  // Check if icon is a component or a ReactNode
  const Icon = typeof icon === 'function' ? icon : null;
  const iconNode = typeof icon !== 'function' ? icon : null;

  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'h-12 w-12 mb-3',
      iconBg: 'h-16 w-16',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'h-16 w-16 mb-4',
      iconBg: 'h-20 w-20',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'h-20 w-20 mb-6',
      iconBg: 'h-24 w-24',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center justify-center', sizes.container, className)}>
      <div className="max-w-md w-full text-center space-y-4">
        {/* Icon */}
        {(Icon || iconNode) && (
          <div className="flex justify-center">
            <div
              className={cn(
                sizes.iconBg,
                'rounded-full bg-gray-100 flex items-center justify-center'
              )}
            >
              {Icon ? <Icon className={cn(sizes.icon, 'text-gray-400')} /> : iconNode}
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className={cn('font-semibold text-gray-900', sizes.title)}>{title}</h3>

        {/* Description */}
        <p className={cn('text-gray-600', sizes.description)}>{description}</p>

        {/* Custom children */}
        {children}

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
            {action && (
              <Button onClick={action.onClick} variant={action.variant || 'default'} size={size}>
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline" size={size}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Variantes pre-configuradas de Empty States
 */

import {
  Building2,
  Home,
  UserPlus,
  FileText,
  DollarSign,
  Search,
  Inbox,
  AlertCircle,
} from 'lucide-react';

export const EmptyStates = {
  NoBuildings: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Building2}
      title="No tienes edificios"
      description="Crea tu primer edificio para empezar a gestionar tus propiedades"
      action={{
        label: 'Crear edificio',
        onClick: () => {},
      }}
      {...props}
    />
  ),

  NoUnits: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Home}
      title="No hay unidades"
      description="Agrega unidades (pisos, locales) a este edificio"
      action={{
        label: 'Agregar unidad',
        onClick: () => {},
      }}
      {...props}
    />
  ),

  NoTenants: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={UserPlus}
      title="No hay inquilinos registrados"
      description="Registra tus inquilinos para poder crear contratos de alquiler"
      action={{
        label: 'Registrar inquilino',
        onClick: () => {},
      }}
      {...props}
    />
  ),

  NoContracts: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={FileText}
      title="No hay contratos"
      description="Crea contratos de alquiler para gestionar tus arrendamientos"
      action={{
        label: 'Crear contrato',
        onClick: () => {},
      }}
      secondaryAction={{
        label: 'Ver tutorial',
        onClick: () => {},
      }}
      {...props}
    />
  ),

  NoPayments: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={DollarSign}
      title="No hay pagos registrados"
      description="Aquí aparecerán los pagos de tus inquilinos"
      action={{
        label: 'Registrar pago',
        onClick: () => {},
      }}
      {...props}
    />
  ),

  NoSearchResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Search}
      title="No se encontraron resultados"
      description="Intenta con otros términos de búsqueda"
      size="sm"
      {...props}
    />
  ),

  EmptyInbox: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={Inbox}
      title="No tienes mensajes"
      description="Cuando recibas notificaciones aparecerán aquí"
      size="sm"
      {...props}
    />
  ),

  Error: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      icon={AlertCircle}
      title="Error al cargar los datos"
      description="Ha ocurrido un error. Por favor, intenta de nuevo."
      action={{
        label: 'Reintentar',
        onClick: () => window.location.reload(),
      }}
      {...props}
    />
  ),
};
