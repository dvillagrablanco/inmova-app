"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedDropdownProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
}

const alignClasses = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

/**
 * Dropdown animado con transiciones suaves
 */
export function AnimatedDropdown({
  isOpen,
  children,
  className,
  align = 'start',
}: AnimatedDropdownProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 400,
          }}
          className={cn(
            'absolute z-50 mt-2 rounded-md border bg-popover shadow-lg',
            alignClasses[align],
            className
          )}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Item de dropdown con hover animation
 */
export function AnimatedDropdownItem({
  children,
  onClick,
  className,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <motion.div
      whileHover={!disabled ? { x: 4, backgroundColor: 'rgba(0, 0, 0, 0.05)' } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.15 }}
      onClick={disabled ? undefined : onClick}
      className={cn(
        'cursor-pointer px-4 py-2 text-sm transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
