'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { forwardRef, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverScale?: number;
  hoverShadow?: boolean;
  clickable?: boolean;
  delay?: number;
}

/**
 * Card con animaciones de entrada, hover y clic
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  (
    {
      children,
      className,
      hoverScale = 1.02,
      hoverShadow = true,
      clickable = false,
      delay = 0,
      onClick,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay,
          ease: 'easeOut',
        }}
        whileHover={{
          scale: hoverScale,
          boxShadow: hoverShadow ? '0 20px 25px -5px rgba(0, 0, 0, 0.15)' : undefined,
        }}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Card
          className={cn(
            'transition-all duration-200 h-full',
            clickable && 'cursor-pointer',
            className
          )}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedCard.displayName = 'AnimatedCard';

/**
 * Variante de card para listas con animación escalonada
 */
interface AnimatedListItemProps extends HTMLAttributes<HTMLDivElement> {
  index: number;
  clickable?: boolean;
}

export const AnimatedListItem = forwardRef<HTMLDivElement, AnimatedListItemProps>(
  (
    {
      children,
      className,
      index,
      clickable = false,
      onClick,
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: 0.3,
          delay: index * 0.05, // Animación escalonada
          ease: 'easeOut',
        }}
        exit={{ opacity: 0, x: 20 }}
        whileHover={{ x: 4 }}
        whileTap={clickable ? { scale: 0.98 } : undefined}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Card
          className={cn(
            'transition-all duration-200 h-full',
            clickable && 'cursor-pointer hover:shadow-lg',
            className
          )}
          {...props}
        >
          {children}
        </Card>
      </motion.div>
    );
  }
);

AnimatedListItem.displayName = 'AnimatedListItem';
