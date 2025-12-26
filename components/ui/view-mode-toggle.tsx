'use client';

import { LayoutGrid, List, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'compact';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewModeToggle({ value, onChange, className }: ViewModeToggleProps) {
  const modes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'grid', icon: <LayoutGrid className="h-4 w-4" />, label: 'Cuadrícula' },
    { mode: 'list', icon: <LayoutList className="h-4 w-4" />, label: 'Detallada' },
    { mode: 'compact', icon: <List className="h-4 w-4" />, label: 'Compacta' },
  ];

  return (
    <div
      className={cn('inline-flex rounded-lg border bg-background p-1', className)}
      role="group"
      aria-label="Seleccionar modo de visualización"
    >
      {modes.map(({ mode, icon, label }) => (
        <Button
          key={mode}
          variant={value === mode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(mode)}
          className={cn('gap-2', value === mode && 'gradient-primary text-white shadow-primary')}
          title={label}
          aria-label={`Vista ${label.toLowerCase()}`}
          aria-pressed={value === mode}
        >
          <span aria-hidden="true">{icon}</span>
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  );
}
