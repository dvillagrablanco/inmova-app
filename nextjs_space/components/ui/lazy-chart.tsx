import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export const LazyChart = dynamic<any>(
  () => import('recharts').then(mod => mod.BarChart as any),
  { ssr: false, loading: LoadingFallback }
);

export const LazyAreaChart = dynamic<any>(
  () => import('recharts').then(mod => mod.AreaChart as any),
  { ssr: false, loading: LoadingFallback }
);

export const LazyBarChart = dynamic<any>(
  () => import('recharts').then(mod => mod.BarChart as any),
  { ssr: false, loading: LoadingFallback }
);

export const LazyLineChart = dynamic<any>(
  () => import('recharts').then(mod => mod.LineChart as any),
  { ssr: false, loading: LoadingFallback }
);

export const LazyPieChart = dynamic<any>(
  () => import('recharts').then(mod => mod.PieChart as any),
  { ssr: false, loading: LoadingFallback }
);

export const LazyArea = dynamic<any>(
  () => import('recharts').then(mod => mod.Area as any),
  { ssr: false }
);

export const LazyBar = dynamic<any>(
  () => import('recharts').then(mod => mod.Bar as any),
  { ssr: false }
);

export const LazyLine = dynamic<any>(
  () => import('recharts').then(mod => mod.Line as any),
  { ssr: false }
);

export const LazyPie = dynamic<any>(
  () => import('recharts').then(mod => mod.Pie as any),
  { ssr: false }
);

export const LazyCell = dynamic<any>(
  () => import('recharts').then(mod => mod.Cell as any),
  { ssr: false }
);

export const LazyXAxis = dynamic<any>(
  () => import('recharts').then(mod => mod.XAxis as any),
  { ssr: false }
);

export const LazyYAxis = dynamic<any>(
  () => import('recharts').then(mod => mod.YAxis as any),
  { ssr: false }
);

export const LazyCartesianGrid = dynamic<any>(
  () => import('recharts').then(mod => mod.CartesianGrid as any),
  { ssr: false }
);

export const LazyTooltip = dynamic<any>(
  () => import('recharts').then(mod => mod.Tooltip as any),
  { ssr: false }
);

export const LazyLegend = dynamic<any>(
  () => import('recharts').then(mod => mod.Legend as any),
  { ssr: false }
);

export const LazyResponsiveContainer = dynamic<any>(
  () => import('recharts').then(mod => mod.ResponsiveContainer as any),
  { ssr: false }
);
