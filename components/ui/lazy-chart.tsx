'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentType } from 'react';

// Re-exportar directamente desde recharts (sin dynamic loading)
// para evitar problemas con WidthProvider
import {
  BarChart,
  LineChart,
  PieChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Area,
  Pie,
  Cell,
} from 'recharts';

// Import SSR-safe ResponsiveContainer wrapper
import { ClientResponsiveContainer } from './client-responsive-container';

// Exports con el prefijo "Lazy" para mantener compatibilidad
export const LazyBarChart = BarChart;
export const LazyLineChart = LineChart;
export const LazyPieChart = PieChart;
export const LazyAreaChart = AreaChart;
export const LazyXAxis = XAxis;
export const LazyYAxis = YAxis;
export const LazyCartesianGrid = CartesianGrid;
export const LazyTooltip = Tooltip;
export const LazyLegend = Legend;
export const LazyResponsiveContainer = ClientResponsiveContainer;
export const LazyBar = Bar;
export const LazyLine = Line;
export const LazyArea = Area;
export const LazyPie = Pie;
export const LazyCell = Cell;

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
