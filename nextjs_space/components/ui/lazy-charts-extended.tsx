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

// Componente de carga genérico
const ChartLoader = () => (
  <div className="flex items-center justify-center w-full h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Lazy load Recharts components
export const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { loading: () => <ChartLoader />, ssr: false }
) as any;

export const BarChart = dynamic(
  () => import('recharts').then((mod) => mod.BarChart),
  { loading: () => <ChartLoader />, ssr: false }
) as any;

export const AreaChart = dynamic(
  () => import('recharts').then((mod) => mod.AreaChart),
  { loading: () => <ChartLoader />, ssr: false }
) as any;

export const PieChart = dynamic(
  () => import('recharts').then((mod) => mod.PieChart),
  { loading: () => <ChartLoader />, ssr: false }
) as any;

export const RadarChart = dynamic(
  () => import('recharts').then((mod) => mod.RadarChart),
  { loading: () => <ChartLoader />, ssr: false }
) as any;

export const ScatterChart = dynamic(
  () => import('recharts').then((mod) => mod.ScatterChart),
  { loading: () => <ChartLoader />, ssr: false }
) as any;

export const ComposedChart = dynamic(
  () => import('recharts').then((mod) => mod.ComposedChart),
  { loading: () => <ChartLoader />, ssr: false }
) as any;

// Chart elements
export const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
) as any;

export const Bar = dynamic(
  () => import('recharts').then((mod) => mod.Bar),
  { ssr: false }
) as any;

export const Area = dynamic(
  () => import('recharts').then((mod) => mod.Area),
  { ssr: false }
) as any;

export const Pie = dynamic(
  () => import('recharts').then((mod) => mod.Pie),
  { ssr: false }
) as any;

export const Radar = dynamic(
  () => import('recharts').then((mod) => mod.Radar),
  { ssr: false }
) as any;

export const Scatter = dynamic(
  () => import('recharts').then((mod) => mod.Scatter),
  { ssr: false }
) as any;

// Axes and Grid
export const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
) as any;

export const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
) as any;

export const ZAxis = dynamic(
  () => import('recharts').then((mod) => mod.ZAxis),
  { ssr: false }
) as any;

export const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
) as any;

export const PolarGrid = dynamic(
  () => import('recharts').then((mod) => mod.PolarGrid),
  { ssr: false }
) as any;

export const PolarAngleAxis = dynamic(
  () => import('recharts').then((mod) => mod.PolarAngleAxis),
  { ssr: false }
) as any;

export const PolarRadiusAxis = dynamic(
  () => import('recharts').then((mod) => mod.PolarRadiusAxis),
  { ssr: false }
) as any;

// Accessories
export const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
) as any;

export const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
) as any;

export const Cell = dynamic(
  () => import('recharts').then((mod) => mod.Cell),
  { ssr: false }
) as any;

export const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
) as any;

export const Brush = dynamic(
  () => import('recharts').then((mod) => mod.Brush),
  { ssr: false }
) as any;

export const ReferenceLine = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceLine),
  { ssr: false }
) as any;

export const ReferenceArea = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceArea),
  { ssr: false }
) as any;

export const ReferenceDot = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceDot),
  { ssr: false }
) as any;

export const Label = dynamic(
  () => import('recharts').then((mod) => mod.Label),
  { ssr: false }
) as any;

export const LabelList = dynamic(
  () => import('recharts').then((mod) => mod.LabelList),
  { ssr: false }
) as any;
