'use client';

import { useState, useEffect } from 'react';

export function useSidebarCounts() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/sidebar/counts');
        if (res.ok) {
          const data = await res.json();
          setCounts(data);
        }
      } catch {
        setCounts({});
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  return { counts, isLoading };
}
