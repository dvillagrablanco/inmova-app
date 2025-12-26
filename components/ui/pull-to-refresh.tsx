'use client';

import { ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/lib/hooks/useMediaQuery';

/**
 * Componente Pull-to-Refresh para móvil
 * Permite actualizar el contenido arrastrando hacia abajo
 */

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number; // Distancia mínima para activar (px)
  maxPullDistance?: number; // Máxima distancia de arrastre (px)
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  maxPullDistance = 150,
  disabled = false,
}: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!isMobile || disabled || isRefreshing) return;

      const scrollTop = containerRef.current?.scrollTop || 0;
      if (scrollTop > 0) return; // Solo si estamos en el top

      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    },
    [isMobile, disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isPulling || !isMobile || disabled) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      if (distance > 0) {
        // Aplicar resistencia: pull distance se reduce mientras más se arrastra
        const resistance = 0.5;
        const adjustedDistance = Math.min(distance * resistance, maxPullDistance);
        setPullDistance(adjustedDistance);

        // Prevenir scroll mientras se hace pull
        if (distance > 10) {
          e.preventDefault();
        }
      }
    },
    [isPulling, isMobile, disabled, maxPullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || !isMobile) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error en pull-to-refresh:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animación de rebote si no se llegó al threshold
      setPullDistance(0);
    }
  }, [isPulling, isMobile, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    if (!isMobile || disabled) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, disabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const pullProgress = Math.min((pullDistance / threshold) * 100, 100);
  const isReady = pullDistance >= threshold;

  if (!isMobile) {
    return <div>{children}</div>;
  }

  return (
    <div ref={containerRef} className="relative h-full overflow-auto">
      {/* Indicador de pull-to-refresh */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex justify-center overflow-hidden transition-all duration-200"
        style={{
          height: `${pullDistance}px`,
        }}
      >
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 transition-all',
            pullDistance > 0 && 'animate-in fade-in'
          )}
        >
          <div
            className={cn(
              'rounded-full bg-background p-2 shadow-lg transition-all',
              isRefreshing && 'animate-spin'
            )}
            style={{
              transform: `rotate(${pullProgress * 3.6}deg)`,
            }}
          >
            <RefreshCw
              className={cn(
                'h-5 w-5 transition-colors',
                isReady ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>
          <p
            className={cn(
              'text-xs font-medium transition-colors',
              isReady ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {isRefreshing
              ? 'Actualizando...'
              : isReady
                ? 'Suelta para actualizar'
                : 'Arrastra para actualizar'}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div
        className="transition-transform duration-200"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
