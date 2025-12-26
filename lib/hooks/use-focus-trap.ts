'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to trap focus within a container (useful for modals, dialogs)
 */
export function useFocusTrap(enabled = true) {
  const containerRef = useRef<HTMLElement>(null);

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors));
  }, []);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Store the element that had focus before trap was activated
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Focus the first element
    firstElement.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      previouslyFocusedElement?.focus();
    };
  }, [enabled, getFocusableElements]);

  return containerRef;
}

/**
 * Hook to manage focus for a roving tabindex pattern
 * (useful for lists, toolbars, etc.)
 */
export function useRovingTabIndex(itemsCount: number) {
  const itemsRef = useRef<(HTMLElement | null)[]>([]);
  const currentIndexRef = useRef(0);

  const setItemRef = useCallback((index: number, element: HTMLElement | null) => {
    itemsRef.current[index] = element;

    // Update tabindex
    itemsRef.current.forEach((item, i) => {
      if (item) {
        item.tabIndex = i === currentIndexRef.current ? 0 : -1;
      }
    });
  }, []);

  const focusItem = useCallback(
    (index: number) => {
      if (index < 0 || index >= itemsCount) return;

      currentIndexRef.current = index;

      // Update tabindex for all items
      itemsRef.current.forEach((item, i) => {
        if (item) {
          item.tabIndex = i === index ? 0 : -1;
        }
      });

      // Focus the item
      itemsRef.current[index]?.focus();
    },
    [itemsCount]
  );

  return {
    setItemRef,
    focusItem,
    currentIndex: currentIndexRef.current,
  };
}
