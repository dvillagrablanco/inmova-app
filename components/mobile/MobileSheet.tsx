'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function MobileSheet({
  isOpen,
  onClose,
  title,
  children,
  className
}: MobileSheetProps) {
  // Prevenir scroll del body cuando el sheet está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'mobile-sheet-overlay',
          isOpen && 'open'
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'mobile-sheet',
          isOpen && 'open',
          className
        )}
      >
        {/* Handle para indicar que es arrastrable */}
        <div className="mobile-sheet-handle" />

        {/* Header con título y botón de cerrar */}
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Contenido */}
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}
