/**
 * Hook for trapping focus within a container (dialogs, modals, etc.)
 * Implements WCAG 2.1 focus management standards
 */

import { useEffect, RefObject } from 'react';
import logger from '@/lib/logger';

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
  'select:not([disabled]):not([aria-hidden])',
  'textarea:not([disabled]):not([aria-hidden])',
  'button:not([disabled]):not([aria-hidden])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex^="-"])',
];

interface UseFocusTrapOptions {
  enabled?: boolean;
  restoreFocus?: boolean;
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  options: UseFocusTrapOptions = {}
) {
  const { enabled = true, restoreFocus = true } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const previouslyFocusedElement = document.activeElement as HTMLElement;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS.join(','))
      ).filter(
        (el) =>
          !el.hasAttribute('disabled') &&
          !el.getAttribute('aria-hidden') &&
          el.offsetParent !== null
      );
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
      logger.info('Focus trap activated');
    }

    // Handle Tab key
    const handleTabKey = (e: KeyboardEvent) => {
      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      if (restoreFocus && previouslyFocusedElement) {
        previouslyFocusedElement.focus();
        logger.info('Focus restored to previous element');
      }
    };
  }, [containerRef, enabled, restoreFocus]);
}
