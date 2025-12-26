'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface AnimatedToastProps {
  isVisible: boolean;
  type?: ToastType;
  title?: string;
  message: ReactNode;
  onClose?: () => void;
  duration?: number;
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const typeConfig = {
  success: {
    icon: CheckCircle,
    className: 'bg-green-50 border-green-200 text-green-800',
    iconClassName: 'text-green-500',
  },
  error: {
    icon: XCircle,
    className: 'bg-red-50 border-red-200 text-red-800',
    iconClassName: 'text-red-500',
  },
  warning: {
    icon: AlertCircle,
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    iconClassName: 'text-yellow-500',
  },
  info: {
    icon: Info,
    className: 'bg-blue-50 border-blue-200 text-blue-800',
    iconClassName: 'text-blue-500',
  },
};

/**
 * Toast animado con múltiples tipos y posiciones
 */
export function AnimatedToast({
  isVisible,
  type = 'info',
  title,
  message,
  onClose,
  position = 'top-right',
}: AnimatedToastProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
          className={cn(
            'fixed z-50 flex min-w-[300px] max-w-md items-start gap-3 rounded-lg border p-4 shadow-lg',
            positionClasses[position],
            config.className
          )}
        >
          <motion.div
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Icon className={cn('h-5 w-5', config.iconClassName)} />
          </motion.div>

          <div className="flex-1">
            {title && (
              <motion.h4
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="font-semibold"
              >
                {title}
              </motion.h4>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm"
            >
              {message}
            </motion.p>
          </div>

          {onClose && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="flex-shrink-0 rounded-md p-1 hover:bg-black/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
