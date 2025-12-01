/**
 * Lazy Loading Components
 * Componentes optimizados para carga diferida con fallbacks
 */

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Skeleton fallback para charts
const ChartSkeleton = () => (
  <div className="w-full h-[300px] space-y-3">
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-[250px] w-full" />
  </div>
);

// Skeleton fallback para calendar
const CalendarSkeleton = () => (
  <div className="w-full space-y-3">
    <Skeleton className="h-10 w-full" />
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  </div>
);

// Skeleton fallback para analytics complejos
const AnalyticsSkeleton = () => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Skeleton className="h-[400px] w-full" />
  </div>
);

// Lazy loaded components
export const LazyChart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Line),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyBarChart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Bar),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyDoughnutChart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Doughnut),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyPieChart = dynamic(
  () => import('react-chartjs-2').then(mod => mod.Pie),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyPlotly = dynamic<any>(
  () => import('react-plotly.js').then(mod => (mod.default || mod) as any),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyCalendar = dynamic(
  () => import('react-datepicker').then(mod => mod.default),
  {
    loading: () => <CalendarSkeleton />,
    ssr: false,
  }
);

// Analytics component (hypothetical - adapt to your needs)
export const LazyAnalyticsDashboard = dynamic(
  () => import('@/components/dashboard/AdvancedAnalytics').then(mod => mod.default),
  {
    loading: () => <AnalyticsSkeleton />,
    ssr: false,
  }
);

// Export skeleton components for reuse
export { ChartSkeleton, CalendarSkeleton, AnalyticsSkeleton };
