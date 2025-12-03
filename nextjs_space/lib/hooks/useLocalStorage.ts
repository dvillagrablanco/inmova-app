/**
 * Safe localStorage hook that prevents hydration issues
 * by only accessing localStorage on the client side
 */

import { useState, useEffect } from 'react';
import logger, { logError } from '@/lib/logger';

type SetValue<T> = T | ((val: T) => T);

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, boolean] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load value from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      logError(
        error instanceof Error ? error : new Error('localStorage read error'),
        { context: 'useLocalStorage', key }
      );
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage.
  const setValue = (value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      logError(
        error instanceof Error ? error : new Error('localStorage write error'),
        { context: 'useLocalStorage', key }
      );
    }
  };

  return [storedValue, setValue, isLoaded];
}
