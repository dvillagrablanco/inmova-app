"use client";

/**
 * 📊 HOOK: useAnalytics
 * 
 * Custom hook para enviar eventos de analytics desde componentes React.
 * 
 * Uso:
 * ```tsx
 * const { track } = useAnalytics();
 * 
 * // En algún evento:
 * track('onboarding_task_completed', {
 *   taskType: 'CREATE_BUILDING',
 *   timeToComplete: 120,
 * });
 * ```
 */

import { useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { AnalyticsEventName } from '@/lib/analytics-service';

export function useAnalytics() {
  const { data: session } = useSession() || {};
  const userId = (session?.user as any)?.id;

  const track = useCallback(
    async (eventName: AnalyticsEventName, properties: Record<string, any> = {}) => {
      try {
        // Client-side tracking
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', eventName, {
            ...properties,
            user_id: userId,
          });
        }

        // Server-side tracking (opcional)
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventName, properties }),
        }).catch(err => {
          // Silently fail to not interrupt UX
          console.error('[Analytics] Error tracking event:', err);
        });
      } catch (error) {
        console.error('[Analytics] Error in track:', error);
      }
    },
    [userId]
  );

  return { track, userId };
}
