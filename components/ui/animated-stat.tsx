'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedStatProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon?: LucideIcon;
  trend?: number;
  decimals?: number;
  className?: string;
  duration?: number;
}

/**
 * Componente de estadística con contador animado
 */
export function AnimatedStat({
  title,
  value,
  suffix = '',
  prefix = '',
  icon: Icon,
  trend,
  decimals = 0,
  className,
  duration = 1,
}: AnimatedStatProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => {
    return latest.toFixed(decimals);
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut',
    });

    return controls.stop;
  }, [motionValue, value, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('hover:shadow-lg transition-shadow', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {Icon && (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {prefix}
            <motion.span>{rounded}</motion.span>
            {suffix}
          </div>
          {trend !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'text-xs mt-1',
                trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
              )}
            >
              {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
