'use client';

import React, { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className
}: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const PULL_THRESHOLD = 80; // Distancia mínima para activar refresh

  const handleTouchStart = (e: React.TouchEvent) => {
    // Solo activar si estamos en el top del scroll
    const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    // Solo permitir pull hacia abajo
    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, PULL_THRESHOLD + 20)); // Efecto de resistencia
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;

    setIsPulling(false);

    // Si se alcanzó el threshold, ejecutar refresh
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div
      className={cn('relative overflow-y-auto', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Indicador de pull to refresh */}
      <div
        className={cn(
          'pull-to-refresh-indicator',
          (isPulling || isRefreshing) && 'active'
        )}
        style={{
          top: isPulling ? `${pullDistance - 60}px` : '-60px',
          transition: isPulling ? 'none' : 'top 0.3s ease'
        }}
      >
        <RefreshCw
          className={cn(
            'h-6 w-6 text-primary',
            isRefreshing && 'animate-spin'
          )}
          style={{
            transform: `rotate(${pullDistance * 3}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.2s ease'
          }}
        />
      </div>

      {/* Contenido */}
      <div
        style={{
          transform: `translateY(${isPulling ? pullDistance : 0}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
}
