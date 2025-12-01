/**
 * Lazy Chart Component
 * Wrapper for lazy-loaded chart components with loading states
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyChartProps {
  type: 'line' | 'bar' | 'doughnut' | 'pie' | 'plotly';
  data: any;
  options?: any;
  height?: number;
  className?: string;
}

const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full space-y-3" style={{ height: `${height}px` }}>
    <Skeleton className="h-4 w-1/4" />
    <Skeleton className="h-full w-full" />
  </div>
);

// Dynamically import chart components based on type
const getChartComponent = (type: LazyChartProps['type']): ComponentType<any> => {
  switch (type) {
    case 'line':
      return dynamic(
        () => import('react-chartjs-2').then(mod => mod.Line),
        {
          loading: () => <ChartSkeleton />,
          ssr: false,
        }
      );
    case 'bar':
      return dynamic(
        () => import('react-chartjs-2').then(mod => mod.Bar),
        {
          loading: () => <ChartSkeleton />,
          ssr: false,
        }
      );
    case 'doughnut':
      return dynamic(
        () => import('react-chartjs-2').then(mod => mod.Doughnut),
        {
          loading: () => <ChartSkeleton />,
          ssr: false,
        }
      );
    case 'pie':
      return dynamic(
        () => import('react-chartjs-2').then(mod => mod.Pie),
        {
          loading: () => <ChartSkeleton />,
          ssr: false,
        }
      );
    case 'plotly':
      return dynamic(
        () => import('react-plotly.js'),
        {
          loading: () => <ChartSkeleton />,
          ssr: false,
        }
      );
    default:
      return dynamic(
        () => import('react-chartjs-2').then(mod => mod.Line),
        {
          loading: () => <ChartSkeleton />,
          ssr: false,
        }
      );
  }
};

export function LazyChart({ type, data, options, height = 300, className }: LazyChartProps) {
  const ChartComponent = getChartComponent(type);
  
  return (
    <div className={className} style={{ height: `${height}px` }}>
      <ChartComponent data={data} options={options} />
    </div>
  );
}
