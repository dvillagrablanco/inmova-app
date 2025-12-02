'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentType } from 'react';

// Componentes lazy-loaded con fallbacks
export const LazyCalendar = dynamic(
  () => import('./calendar').then((mod) => ({ default: mod.Calendar })),
  {
    loading: () => <Skeleton className="w-full h-[350px] rounded-md" />,
    ssr: false,
  }
);

export const LazyDateRangePicker = dynamic(
  () => import('./date-range-picker').then((mod) => ({ default: mod.DateRangePicker })),
  {
    loading: () => <Skeleton className="w-full h-10 rounded-md" />,
    ssr: false,
  }
);

export const LazyPhotoGallery = dynamic(
  () => import('./photo-gallery').then((mod) => ({ default: mod.PhotoGallery })),
  {
    loading: () => <Skeleton className="w-full h-[400px] rounded-md" />,
    ssr: false,
  }
);

export const LazyDataTable = dynamic(
  () => import('./data-table').then((mod) => ({ default: mod.DataTable })),
  {
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="w-full h-12" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full h-16" />
        ))}
      </div>
    ),
    ssr: false,
  }
);

// Factory para crear componentes lazy con configuración personalizada
export function createLazyComponent<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options?: {
    fallback?: React.ReactNode;
    ssr?: boolean;
  }
) {
  return dynamic(loader, {
    loading: () => <>{options?.fallback || <Skeleton className="w-full h-[200px]" />}</>,
    ssr: options?.ssr ?? false,
  });
}