'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type InfoCardVariant = 'info' | 'success' | 'warning' | 'error';

interface InfoCardProps {
  variant?: InfoCardVariant;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

const variantConfig: Record<
  InfoCardVariant,
  { bgColor: string; iconColor: string; icon: ReactNode }
> = {
  info: {
    bgColor: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    icon: <Info className="h-5 w-5" />,
  },
  success: {
    bgColor: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  warning: {
    bgColor: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  error: {
    bgColor: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    icon: <XCircle className="h-5 w-5" />,
  },
};

export function InfoCard({ variant = 'info', title, children, icon, className }: InfoCardProps) {
  const config = variantConfig[variant];
  const displayIcon = icon || config.icon;

  return (
    <Card className={cn(config.bgColor, 'border', className)}>
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <div className={cn('flex-shrink-0', config.iconColor)}>{displayIcon}</div>
          <div className="flex-1 space-y-1">
            {title && <h4 className={cn('font-semibold text-sm', config.iconColor)}>{title}</h4>}
            <div className="text-sm text-muted-foreground">{children}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
