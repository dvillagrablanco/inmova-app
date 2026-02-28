/**
 * @deprecated This file previously used SWR. Migrated to React Query (@tanstack/react-query).
 * 
 * Use `useQuery` and `useMutation` from @tanstack/react-query directly instead.
 * This file provides backwards-compatible wrappers if needed.
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface OptimisticUpdateOptions<T> {
  optimisticData?: T | ((current: T | undefined) => T);
  successMessage?: string;
  errorMessage?: string;
  revalidate?: boolean;
  rollbackOnError?: boolean;
}

const defaultFetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Error al cargar los datos' }));
    throw new Error(error.error || 'Error al cargar los datos');
  }
  return res.json();
};

/**
 * Hook for fetching data with React Query (migrated from SWR)
 */
export function useSWRWithOptimistic<T>(
  key: string | null,
  fetcher?: (url: string) => Promise<T>,
  options?: Partial<UseQueryOptions<T>>
) {
  const queryClient = useQueryClient();
  const fetchFn = fetcher || defaultFetcher<T>;

  const { data, error, isLoading } = useQuery<T>({
    queryKey: [key],
    queryFn: () => fetchFn(key!),
    enabled: !!key,
    staleTime: 2000,
    refetchOnWindowFocus: false,
    ...options,
  });

  const mutate = async (newData?: T, shouldRevalidate = true) => {
    if (newData !== undefined) {
      queryClient.setQueryData([key], newData);
    }
    if (shouldRevalidate) {
      await queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const optimisticUpdate = async (
    updateFn: () => Promise<T>,
    opts?: OptimisticUpdateOptions<T>
  ) => {
    const {
      optimisticData,
      successMessage,
      errorMessage = 'Error al actualizar',
      revalidate = true,
      rollbackOnError = true,
    } = opts || {};

    const previousData = data;

    try {
      if (optimisticData) {
        const newData = typeof optimisticData === 'function'
          ? (optimisticData as (current: T | undefined) => T)(data)
          : optimisticData;
        queryClient.setQueryData([key], newData);
      }

      const result = await updateFn();
      queryClient.setQueryData([key], result);

      if (revalidate) {
        await queryClient.invalidateQueries({ queryKey: [key] });
      }

      if (successMessage) toast.success(successMessage);
      return result;
    } catch (err) {
      logger.error('Optimistic update error:', err);
      if (rollbackOnError && previousData) {
        queryClient.setQueryData([key], previousData);
      }
      toast.error(errorMessage);
      throw err;
    }
  };

  const optimisticDelete = async <K extends keyof T>(
    id: string | number,
    deleteFn: () => Promise<void>,
    opts?: Omit<OptimisticUpdateOptions<T>, 'optimisticData'> & { filterKey?: K }
  ) => {
    const { filterKey = 'id' as K, ...restOptions } = opts || {};
    return optimisticUpdate(
      async () => {
        await deleteFn();
        if (Array.isArray(data)) return data.filter((item: any) => item[filterKey] !== id) as T;
        return data as T;
      },
      {
        optimisticData: (current) => {
          if (Array.isArray(current)) return current.filter((item: any) => item[filterKey] !== id) as T;
          return current as T;
        },
        ...restOptions,
      }
    );
  };

  const optimisticCreate = async <Item>(
    createFn: () => Promise<Item>,
    opts?: Omit<OptimisticUpdateOptions<T>, 'optimisticData'> & { tempItem?: Item }
  ) => {
    const { tempItem, ...restOptions } = opts || {};
    return optimisticUpdate(
      async () => {
        const newItem = await createFn();
        if (Array.isArray(data)) return [...data, newItem] as T;
        return data as T;
      },
      {
        optimisticData: tempItem
          ? (current) => {
              if (Array.isArray(current)) return [...current, tempItem] as T;
              return current as T;
            }
          : undefined,
        ...restOptions,
      }
    );
  };

  return {
    data,
    error,
    isLoading,
    mutate,
    optimisticUpdate,
    optimisticDelete,
    optimisticCreate,
  };
}

/**
 * Hook for fetching a list of items with optimistic updates
 */
export function useSWRList<T>(
  key: string | null,
  fetcher?: (url: string) => Promise<T[]>,
  options?: Partial<UseQueryOptions<T[]>>
) {
  return useSWRWithOptimistic<T[]>(key, fetcher, options);
}
