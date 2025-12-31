'use client';

/**
 * Lazy Load Section Component
 * 
 * Carga componentes pesados solo cuando son visibles en viewport
 * Optimiza performance inicial de la página
 */

import { ReactNode, useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyLoadSectionProps {
  children: ReactNode;
  threshold?: number; // 0-1, cuánto del elemento debe ser visible
  rootMargin?: string; // margen de detección (ej: '100px')
  fallback?: ReactNode; // Componente mientras carga
  className?: string;
}

export function LazyLoadSection({
  children,
  threshold = 0.1,
  rootMargin = '100px',
  fallback,
  className,
}: LazyLoadSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <Skeleton className="h-64 w-full" />)}
    </div>
  );
}

/**
 * Uso:
 * 
 * <LazyLoadSection fallback={<ChartSkeleton />}>
 *   <HeavyChartComponent data={data} />
 * </LazyLoadSection>
 */
