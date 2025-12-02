'use client';

import { useRef } from 'react';

export function useAnnouncer() {
  const announcer = useRef<HTMLDivElement>(null);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcer.current) {
      announcer.current.textContent = '';
      // Forzar re-render para que el lector de pantalla detecte el cambio
      setTimeout(() => {
        if (announcer.current) {
          announcer.current.setAttribute('aria-live', priority);
          announcer.current.textContent = message;
        }
      }, 100);
    }
  };

  return { announce, announcer };
}