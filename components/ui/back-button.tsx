'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function BackButton({
  fallbackUrl = '/dashboard',
  label = 'Volver',
  variant = 'ghost',
  size = 'default',
  className
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    // Intentar ir atrás en el historial
    if (window.history.length > 1) {
      router.back();
    } else {
      // Si no hay historial, ir a la URL de fallback
      router.push(fallbackUrl);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={cn('flex items-center gap-2', className)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
