'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibleIconProps {
  icon: LucideIcon;
  label: string;
  decorative?: boolean;
  className?: string;
  size?: number;
}

/**
 * Icono accesible con aria-label apropiado
 */
export function AccessibleIcon({
  icon: Icon,
  label,
  decorative = false,
  className,
  size = 20,
}: AccessibleIconProps) {
  return (
    <Icon
      className={cn(className)}
      size={size}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative ? 'true' : 'false'}
      role={decorative ? 'presentation' : 'img'}
    />
  );
}
