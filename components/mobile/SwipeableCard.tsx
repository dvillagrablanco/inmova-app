'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Edit, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'secondary';
  onAction: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  actions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right') => void;
  className?: string;
}

export function SwipeableCard({
  children,
  actions = [],
  onSwipe,
  className
}: SwipeableCardProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Solo permitir swipe hacia la izquierda (mostrar acciones a la derecha)
    if (diff < 0) {
      setTranslateX(Math.max(diff, -120)); // Máximo 120px de swipe
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    
    // Si el swipe fue suficiente, mantener las acciones visibles
    if (translateX < -60) {
      setTranslateX(-100);
      onSwipe?.('left');
    } else {
      setTranslateX(0);
    }
  };

  // Cerrar acciones si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (translateX !== 0) {
        setTranslateX(0);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [translateX]);

  return (
    <div className={cn('swipeable relative', className)}>
      {/* Contenido deslizable */}
      <div
        className="swipeable-content bg-white"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.3s ease'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>

      {/* Acciones reveladas al hacer swipe */}
      {actions.length > 0 && (
        <div className="swipeable-actions">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                action.onAction();
                setTranslateX(0);
              }}
              className="h-10 w-10"
            >
              {action.icon}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
