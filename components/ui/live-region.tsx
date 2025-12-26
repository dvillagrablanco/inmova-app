'use client';

import { useEffect, useRef } from 'react';

interface LiveRegionProps {
  message: string;
  role?: 'status' | 'alert';
  'aria-live'?: 'polite' | 'assertive' | 'off';
}

export function LiveRegion({
  message,
  role = 'status',
  'aria-live': ariaLive = 'polite',
}: LiveRegionProps) {
  return (
    <div role={role} aria-live={ariaLive} aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

// Hook para anunciar mensajes dinámicamente
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

  const AnnouncerComponent = () => (
    <div ref={announcer} role="status" aria-live="polite" aria-atomic="true" className="sr-only" />
  );

  return { announce, Announcer: AnnouncerComponent };
}
