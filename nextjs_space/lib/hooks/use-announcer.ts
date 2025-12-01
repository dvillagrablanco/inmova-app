/**
 * useAnnouncer Hook
 * Creates accessible announcements for screen readers
 */

import { useEffect, useRef } from 'react';

type AnnouncerPriority = 'polite' | 'assertive';

export function useAnnouncer() {
  const politeRef = useRef<HTMLDivElement | null>(null);
  const assertiveRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create polite announcer
    if (!politeRef.current) {
      const politeDiv = document.createElement('div');
      politeDiv.setAttribute('role', 'status');
      politeDiv.setAttribute('aria-live', 'polite');
      politeDiv.setAttribute('aria-atomic', 'true');
      politeDiv.className = 'sr-only';
      document.body.appendChild(politeDiv);
      politeRef.current = politeDiv;
    }

    // Create assertive announcer
    if (!assertiveRef.current) {
      const assertiveDiv = document.createElement('div');
      assertiveDiv.setAttribute('role', 'alert');
      assertiveDiv.setAttribute('aria-live', 'assertive');
      assertiveDiv.setAttribute('aria-atomic', 'true');
      assertiveDiv.className = 'sr-only';
      document.body.appendChild(assertiveDiv);
      assertiveRef.current = assertiveDiv;
    }

    // Cleanup
    return () => {
      if (politeRef.current) {
        document.body.removeChild(politeRef.current);
        politeRef.current = null;
      }
      if (assertiveRef.current) {
        document.body.removeChild(assertiveRef.current);
        assertiveRef.current = null;
      }
    };
  }, []);

  const announce = (message: string, priority: AnnouncerPriority = 'polite') => {
    const announcer = priority === 'assertive' ? assertiveRef.current : politeRef.current;
    
    if (announcer) {
      // Clear previous message
      announcer.textContent = '';
      
      // Set new message after a brief delay to ensure it's announced
      setTimeout(() => {
        announcer.textContent = message;
      }, 100);
    }
  };

  return { announce };
}

// Note: LiveRegion component has been moved to components/ui/live-region.tsx
// to avoid TypeScript/JSX issues in .ts files
