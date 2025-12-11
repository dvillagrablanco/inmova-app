"use client";

import { useEffect, useState } from 'react';

/**
 * Hook to detect and apply high contrast mode
 */
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    // Check if user prefers high contrast
    const checkHighContrast = () => {
      const highContrastQuery = window.matchMedia(
        '(prefers-contrast: more), (prefers-contrast: high)'
      );
      setIsHighContrast(highContrastQuery.matches);
    };

    checkHighContrast();

    // Listen for changes
    const mediaQuery = window.matchMedia(
      '(prefers-contrast: more), (prefers-contrast: high)'
    );
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsHighContrast(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange as any);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange as any);
      }
    };
  }, []);

  const toggleHighContrast = () => {
    const newValue = !isHighContrast;
    setIsHighContrast(newValue);
    
    // Store preference
    localStorage.setItem('high-contrast', newValue.toString());
    
    // Apply CSS class
    if (newValue) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  useEffect(() => {
    // Check stored preference on mount
    const stored = localStorage.getItem('high-contrast');
    if (stored === 'true') {
      setIsHighContrast(true);
      document.documentElement.classList.add('high-contrast');
    }
  }, []);

  return {
    isHighContrast,
    toggleHighContrast,
  };
}
