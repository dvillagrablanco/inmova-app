'use client';

import { useEffect, useState } from 'react';

export function useIsMobile(breakpoint: number = 1024) {
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Initial check
    checkIsMobile();

    // Listen for resize
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [breakpoint]);

  // Durante SSR, retornar false
  if (!isClient) {
    return false;
  }

  return isMobile;
}
