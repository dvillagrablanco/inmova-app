'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentType } from 'react';

// Lazy loading de componentes de gráficos principales
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

// Lazy loading de componentes auxiliares de recharts
export const LazyXAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis as any),
  { ssr: false }
);

export const LazyYAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis as any),
  { ssr: false }
);

export const LazyCartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid as any),
  { ssr: false }
);

export const LazyTooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip as any),
  { ssr: false }
);

export const LazyLegend = dynamic(
  () => import('recharts').then((mod) => mod.Legend as any),
  { ssr: false }
);

export const LazyResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer as any),
  { ssr: false }
);

export const LazyBar = dynamic(
  () => import('recharts').then((mod) => mod.Bar as any),
  { ssr: false }
);

export const LazyLine = dynamic(
  () => import('recharts').then((mod) => mod.Line as any),
  { ssr: false }
);

export const LazyArea = dynamic(
  () => import('recharts').then((mod) => mod.Area as any),
  { ssr: false }
);

export const LazyPie = dynamic(
  () => import('recharts').then((mod) => mod.Pie as any),
  { ssr: false }
);

export const LazyCell = dynamic(
  () => import('recharts').then((mod) => mod.Cell as any),
  { ssr: false }
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

// Lazy loading de tablas grandes
export const LazyDataTable = dynamic(
  () => import('@/components/ui/data-table').then((mod) => ({ default: mod.DataTable })),
  {
    loading: () => <Skeleton className="w-full h-[400px]" />,
    ssr: false,
  }
);