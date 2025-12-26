'use client';

import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { forwardRef, InputHTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

/**
 * Input con animaciones y feedback visual
 */
export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, success, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="relative w-full">
        {label && (
          <motion.label
            initial={{ opacity: 0.7 }}
            animate={{
              opacity: isFocused ? 1 : 0.7,
              y: isFocused ? -2 : 0,
            }}
            className="mb-2 block text-sm font-medium"
          >
            {label}
          </motion.label>
        )}

        <motion.div
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Input
            ref={ref}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              'transition-all duration-200',
              isFocused && 'ring-2 ring-primary ring-offset-2',
              error && 'border-destructive focus-visible:ring-destructive',
              success && 'border-green-500 focus-visible:ring-green-500',
              className
            )}
            {...props}
          />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-1 text-xs text-destructive"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedInput.displayName = 'AnimatedInput';

import { AnimatePresence } from 'framer-motion';
