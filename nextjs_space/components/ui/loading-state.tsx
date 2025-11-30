'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
};

export function LoadingState({ message = 'Cargando...', submessage, className, size = 'md' }: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 gap-4", className)}>
      <Loader2 className={cn("animate-spin text-indigo-600", sizeClasses[size])} />
      {message && <p className="text-sm text-gray-600 animate-pulse">{message}</p>}
      {submessage && <p className="text-xs text-gray-500">{submessage}</p>}
    </div>
  );
}