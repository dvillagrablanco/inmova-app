"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton para gráficos mientras cargan
 */
function ChartSkeleton() {
  return (
    <div className="w-full h-full min-h-[300px] space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-8 w-5/6" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-4/5" />
      </div>
      <div className="flex gap-4 justify-center pt-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

/**
 * Lazy loading para componentes de Recharts
 * Reduce significativamente el bundle inicial
 */
export const LazyAreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyBarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyLineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyPieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Exportar componentes de Recharts directamente (no se pueden lazy-load individualmente)
// Solo lazy-loadear los contenedores principales de charts
export { Area as LazyArea, Bar as LazyBar, Line as LazyLine, Pie as LazyPie, XAxis as LazyXAxis, YAxis as LazyYAxis, CartesianGrid as LazyCartesianGrid, Tooltip as LazyTooltip, Legend as LazyLegend, ResponsiveContainer as LazyResponsiveContainer } from 'recharts';

/**
 * Lazy loading para Plotly
 * Nota: Descomentar y ajustar tipos cuando sea necesario usar Plotly
 */
// export const LazyPlot = dynamic(
//   () => import('react-plotly.js'),
//   {
//     loading: () => <ChartSkeleton />,
//     ssr: false,
//   }
// );

/**
 * Lazy loading para React Big Calendar
 * Nota: Descomentar y ajustar tipos cuando sea necesario usar Big Calendar
 */
// export const LazyCalendar = dynamic(
//   () => import('react-big-calendar').then((mod) => mod.Calendar),
//   {
//     loading: () => (
//       <div className="w-full h-full min-h-[600px]">
//         <Skeleton className="w-full h-full" />
//       </div>
//     ),
//     ssr: false,
//   }
// );

/**
 * Lazy loading para Chart.js (si se usa)
 */
export const LazyChartJS = dynamic(
  () => import('react-chartjs-2').then((mod) => ({ default: mod.Chart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);
