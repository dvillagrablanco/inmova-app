import { useEffect, useRef } from 'react';

/**
 * Hook para anunciar mensajes a screen readers
 */
export function useAnnouncer() {
  const announcerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Crear el elemento announcer si no existe
    if (!announcerRef.current) {
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      announcer.className = 'sr-only';
      document.body.appendChild(announcer);
      announcerRef.current = announcer;
    }

    return () => {
      if (announcerRef.current) {
        document.body.removeChild(announcerRef.current);
        announcerRef.current = null;
      }
    };
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;

      // Limpiar después de anunciar
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return { announce };
}
