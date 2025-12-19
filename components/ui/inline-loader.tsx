'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InlineLoader({ text, size = 'md', className }: InlineLoaderProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-6 w-6',
  };

  return (
    <div className={cn('flex items-center gap-2 text-muted-foreground', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}

export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

export function FullScreenLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
        <p className="text-lg text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
