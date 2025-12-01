/**
 * LiveRegion Component
 * Wrapper component for live regions for screen reader announcements
 */

import { ReactNode } from 'react';

type AnnouncerPriority = 'polite' | 'assertive';

interface LiveRegionProps {
  children: ReactNode;
  priority?: AnnouncerPriority;
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'additions text',
}: LiveRegionProps) {
  const role = priority === 'assertive' ? 'alert' : 'status';

  return (
    <div
      role={role}
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}
