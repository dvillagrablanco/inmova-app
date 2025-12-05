/**
 * Componentes de Recharts con lazy loading para reducir el tamaño del bundle inicial
 */
import dynamic from 'next/dynamic';
import React from 'react';

// Loading component para charts
const ChartLoader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-2">
      <div className="h-4 w-32 bg-gray-200 rounded"></div>
      <div className="h-48 w-full bg-gray-100 rounded"></div>
    </div>
  </div>
);

// Lazy load de todos los componentes de Recharts
export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false, loading: () => <ChartLoader /> }
);

export const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { ssr: false }
);

export const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { ssr: false }
);

export const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart),
  { ssr: false }
);

export const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);

export const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);

export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);

export const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);

export const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
);

export const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);

export const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar),
  { ssr: false }
);

export const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area),
  { ssr: false }
);

export const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie),
  { ssr: false }
);

export const Cell = dynamic(
  () => import('recharts').then((mod) => mod.Cell),
  { ssr: false }
);
