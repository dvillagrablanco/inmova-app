"use client";

import { motion } from 'framer-motion';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedBadgeProps extends BadgeProps {
  pulse?: boolean;
  bounce?: boolean;
}

/**
 * Badge animado con efectos opcionales de pulse y bounce
 */
export const AnimatedBadge = forwardRef<HTMLDivElement, AnimatedBadgeProps>(
  ({ children, className, pulse = false, bounce = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 17,
        }}
      >
        <Badge
          className={cn(
            'transition-all duration-200',
            pulse && 'animate-pulse',
            bounce && 'animate-bounce',
            className
          )}
          {...props}
        >
          {children}
        </Badge>
      </motion.div>
    );
  }
);

AnimatedBadge.displayName = 'AnimatedBadge';
