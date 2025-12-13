/**
 * Hook for screen reader announcements
 * Implements WCAG 2.1 ARIA live region standards
 */

import { useEffect, useCallback, useState } from 'react';
import logger from '@/lib/logger';

type AriaLive = 'polite' | 'assertive' | 'off';

interface UseAnnouncerOptions {
  liveRegionId?: string;
  politeness?: AriaLive;
}

export function useAnnouncer(options: UseAnnouncerOptions = {}) {
  const { liveRegionId = 'aria-live-region', politeness = 'polite' } = options;
  const [announcement, setAnnouncement] = useState<string>('');

  // Create or get the live region element
  useEffect(() => {
    if (typeof document === 'undefined') return;

    let liveRegion = document.getElementById(liveRegionId);

    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = liveRegionId;
      liveRegion.setAttribute('aria-live', politeness);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.setAttribute('role', 'status');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
      logger.info(`ARIA live region created with politeness: ${politeness}`);
    }

    return () => {
      // Don't remove the live region on unmount as it might be used by other components
    };
  }, [liveRegionId, politeness]);

  // Update the live region with the announcement
  useEffect(() => {
    if (typeof document === 'undefined' || !announcement) return;

    const liveRegion = document.getElementById(liveRegionId);
    if (liveRegion) {
      liveRegion.textContent = announcement;
      logger.info(`Screen reader announcement: ${announcement}`);

      // Clear the announcement after a delay
      const timer = setTimeout(() => {
        setAnnouncement('');
        liveRegion.textContent = '';
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [announcement, liveRegionId]);

  const announce = useCallback(
    (message: string, politeness?: AriaLive) => {
      if (politeness) {
        const liveRegion = document.getElementById(liveRegionId);
        if (liveRegion) {
          liveRegion.setAttribute('aria-live', politeness);
        }
      }
      setAnnouncement(message);
    },
    [liveRegionId]
  );

  return { announce };
}
