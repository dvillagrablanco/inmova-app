/**
 * Generic hook for data fetching with loading, error, and caching
 * Eliminates code duplication across the app
 */

import { useState, useEffect, useCallback } from 'react';
import logger, { logError } from '@/lib/logger';

interface UseFetchDataOptions<T> {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  refetchInterval?: number;
}

interface UseFetchDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useFetchData<T = any>(options: UseFetchDataOptions<T>): UseFetchDataResult<T> {
  const {
    url,
    method = 'GET',
    body,
    enabled = true,
    onSuccess,
    onError,
    refetchInterval,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      logger.info(`Fetching data from ${url}`);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      logger.info(`Successfully fetched data from ${url}`);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      logError(error, { context: 'useFetchData', url, method });
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [url, method, body, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refetch at interval if specified
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const intervalId = setInterval(() => {
      fetchData();
    }, refetchInterval);

    return () => clearInterval(intervalId);
  }, [refetchInterval, enabled, fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}
