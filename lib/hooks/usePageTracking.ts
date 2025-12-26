/**
 * CUSTOM HOOK: usePageTracking
 * Hook para tracking automático de page views y time on page
 *
 * Usage:
 * ```tsx
 * usePageTracking('/onboarding', 'Onboarding Page');
 * ```
 */

'use client';

import { useEffect } from 'react';
import { trackPageView, startPageTimer, trackTimeOnPage } from '@/lib/analytics-service';

export function usePageTracking(pagePath: string, pageTitle?: string) {
  useEffect(() => {
    // Track page view
    trackPageView(pagePath, pageTitle);

    // Start timer
    startPageTimer();

    // Track time on page when unmounting
    return () => {
      trackTimeOnPage(pageTitle || pagePath);
    };
  }, [pagePath, pageTitle]);
}
