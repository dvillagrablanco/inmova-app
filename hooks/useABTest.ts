/**
 * Hook: useABTest
 * 
 * Hook de React para usar A/B tests en Client Components.
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ABTestVariant {
  id: string;
  name: string;
  config: Record<string, any>;
}

export function useABTest(testId: string) {
  const { data: session } = useSession();
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    fetchVariant();
  }, [session, testId]);

  const fetchVariant = async () => {
    try {
      const response = await fetch(`/api/v1/ab-tests/${testId}/assign`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setVariant(data.variant);
      }
    } catch (error) {
      console.error('Error fetching A/B test variant:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (eventType: string, metadata?: Record<string, any>) => {
    if (!variant) return;

    try {
      await fetch('/api/v1/ab-tests/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          eventType,
          metadata,
        }),
      });
    } catch (error) {
      console.error('Error tracking A/B test event:', error);
    }
  };

  return {
    variant,
    loading,
    trackEvent,
    isVariant: (name: string) => variant?.name === name,
    getConfig: (key: string, defaultValue?: any) => 
      variant?.config?.[key] ?? defaultValue,
  };
}
