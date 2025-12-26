'use client';

/**
 * 📊 ANALYTICS PROVIDER
 *
 * Proveedor de contexto para inicializar Google Analytics y tracking global.
 * Debe wrappear toda la aplicación.
 */

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { initializeGoogleAnalytics, trackEvent } from '@/lib/analytics-service';

interface AnalyticsProviderProps {
  children: React.ReactNode;
  measurementId?: string;
}

export default function AnalyticsProvider({ children, measurementId }: AnalyticsProviderProps) {
  const { data: session } = useSession() || {};
  const pathname = usePathname();
  const userId = (session?.user as any)?.id;

  // Inicializar Google Analytics
  useEffect(() => {
    if (measurementId && typeof window !== 'undefined') {
      initializeGoogleAnalytics(measurementId);
    }
  }, [measurementId]);

  // Track page views
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag && pathname) {
      (window as any).gtag('config', measurementId, {
        page_path: pathname,
        user_id: userId,
      });
    }
  }, [pathname, userId, measurementId]);

  // Track user login
  useEffect(() => {
    if (userId && typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('set', { user_id: userId });
    }
  }, [userId]);

  return <>{children}</>;
}
