/**
 * useSwipe Hook - Touch gesture detection for mobile
 * 
 * Usage:
 * const { onTouchStart, onTouchEnd } = useSwipe({
 *   onSwipeLeft: () => handleNext(),
 *   onSwipeRight: () => handlePrev(),
 *   threshold: 50,
 * });
 * 
 * <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>...</div>
 */

import { useCallback, useRef } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum px to trigger swipe (default: 50)
}

export function useSwipe(options: SwipeOptions) {
  const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = options;
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const elapsed = Date.now() - touchStartRef.current.time;

    // Only trigger if swipe was fast enough (< 500ms) and long enough
    if (elapsed > 500) {
      touchStartRef.current = null;
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe (must be more horizontal than vertical)
    if (absX > absY && absX > threshold) {
      if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      } else if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      }
    }

    // Vertical swipe
    if (absY > absX && absY > threshold) {
      if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      } else if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      }
    }

    touchStartRef.current = null;
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return { onTouchStart, onTouchEnd };
}
