'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock, AlertCircle, Info } from 'lucide-react';
import { ReactNode } from 'react';

type StatusType = 'success' | 'error' | 'warning' | 'pending' | 'info' | 'active' | 'inactive';

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<string, { color: string; icon: ReactNode; label: string }> = {
  success: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Éxito',
  },
  error: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Error',
  },
  warning: {
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Advertencia',
  },
  pending: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: <Clock className="h-3 w-3" />,
    label: 'Pendiente',
  },
  info: {
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    icon: <Info className="h-3 w-3" />,
    label: 'Info',
  },
  active: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: <CheckCircle2 className="h-3 w-3" />,
    label: 'Activo',
  },
  inactive: {
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Inactivo',
  },
};

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || statusConfig.info;
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon}
      {displayLabel}
    </Badge>
  );
}