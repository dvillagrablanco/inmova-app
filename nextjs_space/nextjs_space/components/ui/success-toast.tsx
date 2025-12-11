/**
 * Success toast component with proper ARIA live region
 * Ensures success messages are announced to screen readers
 */

import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SuccessToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function SuccessToast({
  message,
  duration = 3000,
  onClose,
}: SuccessToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'flex items-center gap-2',
        'bg-green-50 dark:bg-green-900',
        'border border-green-200 dark:border-green-700',
        'rounded-lg shadow-lg',
        'px-4 py-3',
        'animate-in slide-in-from-bottom-5',
        'max-w-md'
      )}
    >
      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
      <p className="text-sm font-medium text-green-800 dark:text-green-100">
        {message}
      </p>
    </div>
  );
}
