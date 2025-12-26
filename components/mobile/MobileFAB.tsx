'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileFABProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export function MobileFAB({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  label,
  className,
}: MobileFABProps) {
  return (
    <Button
      onClick={onClick}
      className={cn('mobile-fab bg-primary hover:bg-primary/90 text-white shadow-lg', className)}
      size="lg"
      aria-label={label || 'Añadir'}
    >
      {icon}
    </Button>
  );
}
