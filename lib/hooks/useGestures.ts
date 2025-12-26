/**
 * Hook para manejar gestos táctiles (swipe, pull-to-refresh)
 * Optimizado para interfaces mobile-first
 */
import { useRef, useEffect, useCallback } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Mínimo de píxeles para considerar un swipe
}

export function useSwipe(handlers: SwipeHandlers) {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const threshold = handlers.threshold || 50;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // Detectar dirección del swipe
    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Swipe horizontal
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        } else if (diffX < 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        }
      }
    } else {
      // Swipe vertical
      if (Math.abs(diffY) > threshold) {
        if (diffY > 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        } else if (diffY < 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        }
      }
    }
  }, [handlers, threshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Hook para implementar pull-to-refresh
 */
interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // Distancia mínima para activar el refresh
  enabled?: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  enabled = true,
}: PullToRefreshOptions) {
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const isRefreshing = useRef<boolean>(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || window.scrollY > 0) return;
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !isPulling.current || window.scrollY > 0) return;
      currentY.current = e.touches[0].clientY;

      const pullDistance = currentY.current - startY.current;

      if (pullDistance > 0 && pullDistance < threshold * 2) {
        // Prevenir scroll mientras se hace pull
        e.preventDefault();
      }
    },
    [enabled, threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPulling.current || isRefreshing.current) {
      isPulling.current = false;
      return;
    }

    const pullDistance = currentY.current - startY.current;

    if (pullDistance >= threshold) {
      isRefreshing.current = true;
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error en pull-to-refresh:', error);
      } finally {
        isRefreshing.current = false;
      }
    }

    isPulling.current = false;
    startY.current = 0;
    currentY.current = 0;
  }, [enabled, threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isPulling: isPulling.current,
    isRefreshing: isRefreshing.current,
  };
}
