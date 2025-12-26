import useSWR, { SWRConfiguration, useSWRConfig } from 'swr';
import { toast } from 'sonner';
import logger from '@/lib/logger';

interface OptimisticUpdateOptions<T> {
  /**
   * Optimistically updates the cache before the request is made
   */
  optimisticData?: T | ((current: T | undefined) => T);
  /**
   * Shows a success toast after the update
   */
  successMessage?: string;
  /**
   * Shows an error toast if the update fails
   */
  errorMessage?: string;
  /**
   * Whether to revalidate after the update
   */
  revalidate?: boolean;
  /**
   * Whether to rollback on error
   */
  rollbackOnError?: boolean;
}

/**
 * Hook for fetching data with SWR
 * @param key - The SWR key (URL or function)
 * @param fetcher - Optional custom fetcher function
 * @param options - SWR configuration options
 */
export function useSWRWithOptimistic<T>(
  key: string | null,
  fetcher?: (url: string) => Promise<T>,
  options?: SWRConfiguration<T>
) {
  const { mutate: globalMutate } = useSWRConfig();

  // Default fetcher using fetch API
  const defaultFetcher = async (url: string): Promise<T> => {
    const res = await fetch(url);
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Error al cargar los datos' }));
      throw new Error(error.error || 'Error al cargar los datos');
    }
    return res.json();
  };

  const { data, error, isLoading, mutate } = useSWR<T>(key, fetcher || defaultFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
    ...options,
  });

  /**
   * Optimistically updates the cache and performs the mutation
   */
  const optimisticUpdate = async (
    updateFn: () => Promise<T>,
    options?: OptimisticUpdateOptions<T>
  ) => {
    const {
      optimisticData,
      successMessage,
      errorMessage = 'Error al actualizar',
      revalidate = true,
      rollbackOnError = true,
    } = options || {};

    try {
      // Store the current data for rollback
      const previousData = data;

      // Optimistically update the UI
      if (optimisticData) {
        const newData =
          typeof optimisticData === 'function'
            ? (optimisticData as (current: T) => T)(data)
            : optimisticData;
        await mutate(newData, false);
      }

      // Perform the actual update
      const result = await updateFn();

      // Update the cache with the result
      await mutate(result, revalidate);

      if (successMessage) {
        toast.success(successMessage);
      }

      return result;
    } catch (error) {
      logger.error('Optimistic update error:', error);

      // Rollback on error
      if (rollbackOnError && data) {
        await mutate(data, false);
      }

      toast.error(errorMessage);
      throw error;
    }
  };

  /**
   * Performs a DELETE operation with optimistic updates
   */
  const optimisticDelete = async <K extends keyof T>(
    id: string | number,
    deleteFn: () => Promise<void>,
    options?: Omit<OptimisticUpdateOptions<T>, 'optimisticData'> & {
      filterKey?: K;
    }
  ) => {
    const { filterKey = 'id' as K, ...restOptions } = options || {};

    return optimisticUpdate(
      async () => {
        await deleteFn();
        // Return the updated data after deletion
        if (Array.isArray(data)) {
          return data.filter((item: any) => item[filterKey] !== id) as T;
        }
        return data as T;
      },
      {
        optimisticData: (current) => {
          if (Array.isArray(current)) {
            return current.filter((item: any) => item[filterKey] !== id) as T;
          }
          return current as T;
        },
        ...restOptions,
      }
    );
  };

  /**
   * Performs a CREATE operation with optimistic updates
   */
  const optimisticCreate = async <Item>(
    createFn: () => Promise<Item>,
    options?: Omit<OptimisticUpdateOptions<T>, 'optimisticData'> & {
      tempItem?: Item;
    }
  ) => {
    const { tempItem, ...restOptions } = options || {};

    return optimisticUpdate(
      async () => {
        const newItem = await createFn();
        // Return the updated data with the new item
        if (Array.isArray(data)) {
          return [...data, newItem] as T;
        }
        return data as T;
      },
      {
        optimisticData: tempItem
          ? (current) => {
              if (Array.isArray(current)) {
                return [...current, tempItem] as T;
              }
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
  options?: SWRConfiguration<T[]>
) {
  return useSWRWithOptimistic<T[]>(key, fetcher, options);
}
