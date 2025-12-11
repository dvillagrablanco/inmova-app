/**
 * Chart Components Wrapper
 * 
 * Re-exporta componentes de Recharts sin lazy loading para evitar
 * el error "WidthProvider is not a function" en producción de Vercel.
 * 
 * Este archivo se marca como 'use client' para asegurar que todo
 * recharts se ejecute solo en el cliente.
 * 
 * IMPORTANTE: NO usar dynamic() con recharts - causa errores con WidthProvider
 */

'use client';

// Importar todos los componentes directamente desde recharts
// Sin dynamic loading para evitar problemas con WidthProvider
export {
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  RadarChart,
  ScatterChart,
  ComposedChart,
  Line,
  Bar,
  Area,
  Pie,
  Radar,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  Brush,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Label,
  LabelList,
} from 'recharts';
