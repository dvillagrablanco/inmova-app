/**
 * Accessible form error component
 * Properly announces errors to screen readers
 */

import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormErrorProps {
  error?: string | string[];
  className?: string;
  id?: string;
}

export function FormError({ error, className, id }: FormErrorProps) {
  if (!error) return null;

  const errors = Array.isArray(error) ? error : [error];

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className={cn('flex items-start gap-2 text-sm text-destructive mt-1', className)}
    >
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex-1">
        {errors.map((err, index) => (
          <p key={index}>{err}</p>
        ))}
      </div>
    </div>
  );
}
