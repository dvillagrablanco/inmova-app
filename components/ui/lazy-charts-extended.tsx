/**
 * Lazy-loaded Chart Components
 * 
 * Este archivo proporciona componentes de Recharts cargados de forma perezosa
 * para reducir el tamaño inicial del bundle.
 * 
 * Uso:
 * import { LineChart, BarChart, ... } from '@/components/ui/lazy-charts-extended';
 * 
 * Los componentes se cargan solo cuando se renderizan por primera vez.
 */

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Componente de carga genérico
const ChartLoader = () => (
  <div className="flex items-center justify-center w-full h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load Recharts components
export const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart as ComponentType<any>),
  { loading: () => <ChartLoader />, ssr: false }
);

export const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart as ComponentType<any>),
  { loading: () => <ChartLoader />, ssr: false }
);

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart as ComponentType<any>),
  { loading: () => <ChartLoader />, ssr: false }
);

export const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart as ComponentType<any>),
  { loading: () => <ChartLoader />, ssr: false }
);

export const RadarChart = dynamic(
  () => import('recharts').then((mod) => mod.RadarChart as ComponentType<any>),
  { loading: () => <ChartLoader />, ssr: false }
);

export const ScatterChart = dynamic(
  () => import('recharts').then((mod) => mod.ScatterChart as ComponentType<any>),
  { loading: () => <ChartLoader />, ssr: false }
);

export const ComposedChart = dynamic(
  () => import('recharts').then((mod) => mod.ComposedChart as ComponentType<any>),
  { loading: () => <ChartLoader />, ssr: false }
);

// Chart elements
export const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line as ComponentType<any>),
  { ssr: false }
);

export const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar as ComponentType<any>),
  { ssr: false }
);

export const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area as ComponentType<any>),
  { ssr: false }
);

export const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie as ComponentType<any>),
  { ssr: false }
);

export const Radar = dynamic(
  () => import('recharts').then((mod) => mod.Radar as ComponentType<any>),
  { ssr: false }
);

export const Scatter = dynamic(
  () => import('recharts').then((mod) => mod.Scatter as ComponentType<any>),
  { ssr: false }
);

// Axes and Grid
export const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis as ComponentType<any>),
  { ssr: false }
);

export const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis as ComponentType<any>),
  { ssr: false }
);

export const ZAxis = dynamic(
  () => import('recharts').then((mod) => mod.ZAxis as ComponentType<any>),
  { ssr: false }
);

export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid as ComponentType<any>),
  { ssr: false }
);

export const PolarGrid = dynamic(
  () => import('recharts').then((mod) => mod.PolarGrid as ComponentType<any>),
  { ssr: false }
);

export const PolarAngleAxis = dynamic(
  () => import('recharts').then((mod) => mod.PolarAngleAxis as ComponentType<any>),
  { ssr: false }
);

export const PolarRadiusAxis = dynamic(
  () => import('recharts').then((mod) => mod.PolarRadiusAxis as ComponentType<any>),
  { ssr: false }
);

// Accessories
export const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip as ComponentType<any>),
  { ssr: false }
);

export const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend as ComponentType<any>),
  { ssr: false }
);

export const Cell = dynamic(
  () => import('recharts').then((mod) => mod.Cell as ComponentType<any>),
  { ssr: false }
);

export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer as ComponentType<any>),
  { ssr: false }
);

export const Brush = dynamic(
  () => import('recharts').then((mod) => mod.Brush as ComponentType<any>),
  { ssr: false }
);

export const ReferenceLine = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceLine as ComponentType<any>),
  { ssr: false }
);

export const ReferenceArea = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceArea as ComponentType<any>),
  { ssr: false }
);

export const ReferenceDot = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceDot as ComponentType<any>),
  { ssr: false }
);

export const Label = dynamic(
  () => import('recharts').then((mod) => mod.Label as ComponentType<any>),
  { ssr: false }
);

export const LabelList = dynamic(
  () => import('recharts').then((mod) => mod.LabelList as ComponentType<any>),
  { ssr: false }
);
