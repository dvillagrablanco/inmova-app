'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';
import { PerformanceMonitor } from './PerformanceMonitor';

export function WebVitalsInit() {
  useEffect(() => {
    // Inicializar Web Vitals cuando el componente se monta
    initWebVitals();
  }, []);

  return (
    <>
      {/* Monitor visual solo en desarrollo */}
      <PerformanceMonitor />
    </>
  );
}
