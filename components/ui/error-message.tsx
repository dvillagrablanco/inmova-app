import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Button } from './button';
import { cn } from '@/lib/utils';

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  title?: string;
  message: string | ReactNode;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const severityConfig = {
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-900 dark:text-red-100',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/10',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    textColor: 'text-yellow-900 dark:text-yellow-100',
  },
  info: {
    icon: AlertCircle,
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-900 dark:text-blue-100',
  },
};

/**
 * Componente para mostrar mensajes de error user-friendly
 * - Sin stack traces técnicos
 * - Iconos visuales claros
 * - Opciones de retry y dismiss
 * - Accesible con ARIA roles
 */
export function ErrorMessage({
  title,
  message,
  severity = 'error',
  onRetry,
  onDismiss,
  className,
}: ErrorMessageProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <Alert
      role="alert"
      aria-live="assertive"
      className={cn(config.bgColor, config.borderColor, 'border-l-4', className)}
    >
      <Icon className={cn('h-5 w-5', config.iconColor)} aria-hidden="true" />

      {title && (
        <AlertTitle className={cn('mb-2 font-semibold', config.textColor)}>{title}</AlertTitle>
      )}

      <AlertDescription className={cn(config.textColor, 'text-sm')}>{message}</AlertDescription>

      {(onRetry || onDismiss) && (
        <div className="mt-4 flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="text-sm">
              Reintentar
            </Button>
          )}
          {onDismiss && (
            <Button onClick={onDismiss} variant="ghost" size="sm" className="text-sm">
              Descartar
            </Button>
          )}
        </div>
      )}
    </Alert>
  );
}
