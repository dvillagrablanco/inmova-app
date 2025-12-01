/**
 * useKeyboardNavigation Hook
 * Provides keyboard navigation functionality for lists and menus
 */

import { useEffect, useRef, useState, KeyboardEvent } from 'react';

interface UseKeyboardNavigationOptions {
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  loop?: boolean;
  orientation?: 'vertical' | 'horizontal' | 'both';
}

export function useKeyboardNavigation(
  itemCount: number,
  options: UseKeyboardNavigationOptions = {}
) {
  const {
    onSelect,
    onEscape,
    loop = true,
    orientation = 'vertical',
  } = options;

  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  // Set item ref
  const setItemRef = (index: number) => (element: HTMLElement | null) => {
    itemRefs.current[index] = element;
  };

  // Navigate to specific index
  const navigateTo = (index: number) => {
    if (index < 0 || index >= itemCount) return;
    
    setActiveIndex(index);
    itemRefs.current[index]?.focus();
  };

  // Navigate to next item
  const navigateNext = () => {
    let nextIndex = activeIndex + 1;
    
    if (nextIndex >= itemCount) {
      nextIndex = loop ? 0 : itemCount - 1;
    }
    
    navigateTo(nextIndex);
  };

  // Navigate to previous item
  const navigatePrevious = () => {
    let prevIndex = activeIndex - 1;
    
    if (prevIndex < 0) {
      prevIndex = loop ? itemCount - 1 : 0;
    }
    
    navigateTo(prevIndex);
  };

  // Navigate to first item
  const navigateFirst = () => {
    navigateTo(0);
  };

  // Navigate to last item
  const navigateLast = () => {
    navigateTo(itemCount - 1);
  };

  // Handle keyboard events
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const { key } = event;

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          navigateNext();
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          navigatePrevious();
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          navigateNext();
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          navigatePrevious();
        }
        break;

      case 'Home':
        event.preventDefault();
        navigateFirst();
        break;

      case 'End':
        event.preventDefault();
        navigateLast();
        break;

      case 'Enter':
      case ' ':
        if (activeIndex >= 0 && onSelect) {
          event.preventDefault();
          onSelect(activeIndex);
        }
        break;

      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;

      default:
        // Handle alphanumeric search
        if (key.length === 1 && /[a-z0-9]/i.test(key)) {
          // Implement type-ahead search if needed
        }
        break;
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    navigateTo,
    navigateNext,
    navigatePrevious,
    navigateFirst,
    navigateLast,
    setItemRef,
    handleKeyDown,
    itemRefs,
  };
}

/**
 * useArrowKeyNavigation
 * Simplified hook for basic arrow key navigation
 */
export function useArrowKeyNavigation(itemCount: number, onSelect?: (index: number) => void) {
  return useKeyboardNavigation(itemCount, {
    onSelect,
    loop: true,
    orientation: 'vertical',
  });
}
