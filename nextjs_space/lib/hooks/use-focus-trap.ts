/**
 * useFocusTrap Hook
 * Traps focus within a container, useful for modals and dialogs
 */

import { useEffect, useRef, MutableRefObject } from 'react';

interface UseFocusTrapOptions {
  isActive?: boolean;
  initialFocus?: boolean;
  returnFocus?: boolean;
  allowOutsideClick?: boolean;
}

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'button:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  options: UseFocusTrapOptions = {}
): MutableRefObject<T | null> {
  const {
    isActive = true,
    initialFocus = true,
    returnFocus = true,
    allowOutsideClick = false,
  } = options;

  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    
    // Store the element that was focused before the trap
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const getFocusableElements = (): HTMLElement[] => {
      const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
      return Array.from(elements).filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1
      );
    };

    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element if initialFocus is true
    if (initialFocus && firstElement) {
      setTimeout(() => firstElement.focus(), 10);
    }

    // Handle Tab key
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const currentFocusableElements = getFocusableElements();
      const firstEl = currentFocusableElements[0];
      const lastEl = currentFocusableElements[currentFocusableElements.length - 1];

      if (!firstEl || !lastEl) return;

      // Shift + Tab
      if (event.shiftKey) {
        if (document.activeElement === firstEl) {
          event.preventDefault();
          lastEl.focus();
        }
      }
      // Tab
      else {
        if (document.activeElement === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    };

    // Handle clicks outside
    const handleClickOutside = (event: MouseEvent) => {
      if (allowOutsideClick) return;
      
      const target = event.target as Node;
      if (!container.contains(target)) {
        event.preventDefault();
        event.stopPropagation();
        // Return focus to first element
        if (firstElement) {
          firstElement.focus();
        }
      }
    };

    // Add event listeners
    container.addEventListener('keydown', handleTabKey as any);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleTabKey as any);
      document.removeEventListener('mousedown', handleClickOutside);

      // Return focus to previously focused element
      if (returnFocus && previousActiveElement.current) {
        setTimeout(() => {
          previousActiveElement.current?.focus();
        }, 10);
      }
    };
  }, [isActive, initialFocus, returnFocus, allowOutsideClick]);

  return containerRef;
}

/**
 * useFocusReturn
 * Returns focus to the previously focused element when unmounted
 */
export function useFocusReturn() {
  const previousElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousElement.current = document.activeElement as HTMLElement;

    return () => {
      if (previousElement.current) {
        setTimeout(() => {
          previousElement.current?.focus();
        }, 10);
      }
    };
  }, []);
}

/**
 * useFocusOnMount
 * Focuses an element when component mounts
 */
export function useFocusOnMount<T extends HTMLElement = HTMLElement>(): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, []);

  return ref;
}
