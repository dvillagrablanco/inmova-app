'use client';

import { useEffect, useRef, RefObject } from 'react';

interface UseFocusTrapOptions {
  active?: boolean;
  initialFocus?: RefObject<HTMLElement>;
}

export function useFocusTrap<T extends HTMLElement>(
  options: UseFocusTrapOptions = {}
): RefObject<T> {
  const { active = true, initialFocus } = options;
  const containerRef = useRef<T>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Enfocar el elemento inicial o el primer elemento
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Si estamos en el primer elemento, ir al último
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Si estamos en el último elemento, ir al primero
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [active, initialFocus]);

  return containerRef;
}