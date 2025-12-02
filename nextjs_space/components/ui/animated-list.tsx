"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  direction?: 'vertical' | 'horizontal';
}

const directionVariants = {
  vertical: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  horizontal: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

/**
 * Lista animada con efectos de entrada escalonados
 */
export function AnimatedList({
  children,
  className,
  staggerDelay = 0.05,
  direction = 'vertical',
}: AnimatedListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <AnimatePresence mode="popLayout">
        {Array.isArray(children) &&
          children.map((child, index) => (
            <motion.div
              key={index}
              variants={directionVariants[direction]}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.3,
                delay: index * staggerDelay,
                ease: 'easeOut',
              }}
              layout
            >
              {child}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}

interface AnimatedGridProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
  columns?: 1 | 2 | 3 | 4;
}

const gridClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

/**
 * Grid animado con efectos de entrada escalonados
 */
export function AnimatedGrid({
  children,
  className,
  staggerDelay = 0.05,
  columns = 3,
}: AnimatedGridProps) {
  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      <AnimatePresence mode="popLayout">
        {Array.isArray(children) &&
          children.map((child, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.3,
                delay: index * staggerDelay,
                ease: 'easeOut',
              }}
              layout
            >
              {child}
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
