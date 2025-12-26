'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  ripple?: boolean;
}

/**
 * Botón con animaciones de hover, tap y ripple effect
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ children, className, ripple = true, ...props }, ref) => {
    return (
      <Button ref={ref} asChild className={cn('relative overflow-hidden', className)} {...props}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 17,
          }}
        >
          {children}
          {ripple && (
            <motion.span
              className="absolute inset-0 bg-white/20"
              initial={{ scale: 0, opacity: 1 }}
              whileTap={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </motion.button>
      </Button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';
