/**
 * Accessible status badge with proper ARIA attributes
 * Includes screen reader text for status context
 */

import { Badge, BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps extends Omit<BadgeProps, 'children'> {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label: string;
  screenReaderText?: string;
}

const statusConfig = {
  success: {
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    srPrefix: 'Estado exitoso:',
  },
  warning: {
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    srPrefix: 'Advertencia:',
  },
  error: {
    variant: 'destructive' as const,
    className: '',
    srPrefix: 'Error:',
  },
  info: {
    variant: 'outline' as const,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    srPrefix: 'Información:',
  },
  neutral: {
    variant: 'outline' as const,
    className: '',
    srPrefix: 'Estado:',
  },
};

export function StatusBadge({
  status,
  label,
  screenReaderText,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const srText = screenReaderText || `${config.srPrefix} ${label}`;

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
      role="status"
      aria-label={srText}
      {...props}
    >
      <span aria-hidden="true">{label}</span>
      <span className="sr-only">{srText}</span>
    </Badge>
  );
}
