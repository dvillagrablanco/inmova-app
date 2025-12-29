/**
 * Custom Hook for Landing Page Tracking
 */

'use client';

import { useEffect } from 'react';
import { LandingEvents } from '@/lib/analytics/landing-events';

export function useLandingTracking() {
  // Scroll Depth Tracking
  useEffect(() => {
    const scrollDepthMarkers = [25, 50, 75, 100];
    const reachedMarkers = new Set<number>();

    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      scrollDepthMarkers.forEach((marker) => {
        if (scrollPercent >= marker && !reachedMarkers.has(marker)) {
          reachedMarkers.add(marker);
          LandingEvents.scrollDepth(marker);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Time on Page Tracking
  useEffect(() => {
    const startTime = Date.now();
    const timeMarkers = [30, 60, 120, 300]; // 30s, 1m, 2m, 5m
    const reachedTimeMarkers = new Set<number>();

    const interval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      timeMarkers.forEach((marker) => {
        if (timeSpent >= marker && !reachedTimeMarkers.has(marker)) {
          reachedTimeMarkers.add(marker);
          LandingEvents.timeOnPage(marker);
        }
      });
    }, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  // Exit Intent Tracking
  useEffect(() => {
    let exitIntentShown = false;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentShown) {
        exitIntentShown = true;
        LandingEvents.exitIntentPopup();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  return {
    // Export events for manual tracking
    LandingEvents,
  };
}
