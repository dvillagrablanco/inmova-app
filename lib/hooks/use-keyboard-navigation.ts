'use client';

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavigationOptions {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onTab?: () => void;
  onSpace?: () => void;
  enabled?: boolean;
}

/**
 * Hook for handling keyboard navigation
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const {
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onTab,
    onSpace,
    enabled = true,
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          onArrowUp?.();
          break;
        case 'ArrowDown':
          event.preventDefault();
          onArrowDown?.();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onArrowLeft?.();
          break;
        case 'ArrowRight':
          event.preventDefault();
          onArrowRight?.();
          break;
        case 'Enter':
          onEnter?.();
          break;
        case 'Escape':
          onEscape?.();
          break;
        case 'Tab':
          onTab?.();
          break;
        case ' ':
          event.preventDefault();
          onSpace?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    enabled,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
    onTab,
    onSpace,
  ]);
}

/**
 * Hook for managing focus within a list
 */
export function useListKeyboardNavigation<T extends HTMLElement>(
  itemsCount: number,
  options?: {
    onSelect?: (index: number) => void;
    loop?: boolean;
    orientation?: 'vertical' | 'horizontal';
  }
) {
  const { onSelect, loop = true, orientation = 'vertical' } = options || {};
  const currentIndexRef = useRef(0);
  const itemsRef = useRef<T[]>([]);

  const focusItem = useCallback((index: number) => {
    if (itemsRef.current[index]) {
      itemsRef.current[index].focus();
      currentIndexRef.current = index;
    }
  }, []);

  const moveNext = useCallback(() => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < itemsCount) {
      focusItem(nextIndex);
    } else if (loop) {
      focusItem(0);
    }
  }, [itemsCount, loop, focusItem]);

  const movePrevious = useCallback(() => {
    const prevIndex = currentIndexRef.current - 1;
    if (prevIndex >= 0) {
      focusItem(prevIndex);
    } else if (loop) {
      focusItem(itemsCount - 1);
    }
  }, [itemsCount, loop, focusItem]);

  const handleSelect = useCallback(() => {
    onSelect?.(currentIndexRef.current);
  }, [onSelect]);

  useKeyboardNavigation({
    onArrowDown: orientation === 'vertical' ? moveNext : undefined,
    onArrowUp: orientation === 'vertical' ? movePrevious : undefined,
    onArrowRight: orientation === 'horizontal' ? moveNext : undefined,
    onArrowLeft: orientation === 'horizontal' ? movePrevious : undefined,
    onEnter: handleSelect,
    onSpace: handleSelect,
  });

  const setItemRef = useCallback((index: number, element: T | null) => {
    if (element) {
      itemsRef.current[index] = element;
    }
  }, []);

  return {
    setItemRef,
    focusItem,
    currentIndex: currentIndexRef.current,
  };
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = [
        event.ctrlKey && 'ctrl',
        event.metaKey && 'meta',
        event.shiftKey && 'shift',
        event.altKey && 'alt',
        event.key.toLowerCase(),
      ]
        .filter(Boolean)
        .join('+');

      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}
