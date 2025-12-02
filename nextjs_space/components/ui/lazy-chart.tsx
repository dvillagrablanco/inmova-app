'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentType } from 'react';

// Lazy loading de componentes de gráficos
export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart as any),
  {
    loading: () => <Skeleton className="w-full h-[300px]" />,
    ssr: false,
  }
);

export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart as any),
  {
    loading: () => <Skeleton className="w-full h-[300px]" />,
    ssr: false,
  }
);

export const LazyPieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart as any),
  {
    loading: () => <Skeleton className="w-full h-[300px]" />,
    ssr: false,
  }
);

export const LazyAreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart as any),
  {
    loading: () => <Skeleton className="w-full h-[300px]" />,
    ssr: false,
  }
);

// Componente genérico para lazy loading de cualquier componente
interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

export function createLazyComponent(
  loader: () => Promise<{ default: ComponentType<any> }>,
  fallback?: React.ReactNode
) {
  return dynamic(loader, {
    loading: () => <>{fallback || <Skeleton className="w-full h-[200px]" />}</>,
    ssr: false,
  });
}