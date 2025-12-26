'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdvancedKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  progress?: {
    value: number;
    max: number;
    label?: string;
  };
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantStyles = {
  default: 'border-gray-200',
  success: 'border-green-200 bg-green-50/50',
  warning: 'border-yellow-200 bg-yellow-50/50',
  danger: 'border-red-200 bg-red-50/50',
  info: 'border-blue-200 bg-blue-50/50',
};

const iconVariantStyles = {
  default: 'text-gray-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
  info: 'text-blue-600',
};

export function AdvancedKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  progress,
  badge,
  variant = 'default',
  className,
}: AdvancedKPICardProps) {
  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg',
        variantStyles[variant],
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
          {Icon && (
            <div className={cn('p-2 rounded-full bg-white/80', iconVariantStyles[variant])}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Valor principal */}
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            {trend && (
              <div
                className={cn(
                  'flex items-center text-sm font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                <span className="mr-1">{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
                {trend.label && (
                  <span className="ml-1 text-xs text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>

          {/* Subtitulo */}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}

          {/* Barra de progreso */}
          {progress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{progress.label || 'Progreso'}</span>
                <span>
                  {progress.value} / {progress.max}
                </span>
              </div>
              <Progress value={(progress.value / progress.max) * 100} className="h-2" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
