/**
 * Custom hook for data fetching with error handling, loading states, and retry logic
 * Replaces repetitive fetch patterns across the app
 */

import { useState, useEffect, useCallback } from 'react';
import logger, { logError } from '@/lib/logger';

interface UseFetchOptions {
  enabled?: boolean; // Whether to fetch automatically
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseFetchResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (data: T) => void; // For optimistic updates
}

export function useFetch<T = any>(
  url: string | null,
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const { enabled = true, onSuccess, onError, retryCount = 0, retryDelay = 1000 } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const fetchData = useCallback(async () => {
    if (!url || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      onSuccess?.(result);
      setAttemptCount(0); // Reset on success
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');

      logError(error, {
        context: 'useFetch',
        url,
        attemptCount,
      });

      setError(error);
      onError?.(error);

      // Retry logic
      if (attemptCount < retryCount) {
        setTimeout(
          () => {
            setAttemptCount((prev) => prev + 1);
          },
          retryDelay * (attemptCount + 1)
        ); // Exponential backoff
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, enabled, onSuccess, onError, retryCount, retryDelay, attemptCount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Retry effect
  useEffect(() => {
    if (attemptCount > 0 && attemptCount <= retryCount) {
      fetchData();
    }
  }, [attemptCount, retryCount, fetchData]);

  const mutate = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
    mutate,
  };
}
