'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from '@/components/ui/lazy-charts-extended';
import { TrendingUp, TrendingDown, Calendar, Euro } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdvancedAnalyticsProps {
  monthlyData: Array<{
    mes: string;
    ingresos: number;
    gastos: number;
    neto: number;
  }>;
}

export function AdvancedAnalytics({ monthlyData }: AdvancedAnalyticsProps) {
  // Calcular tendencias
  const lastMonth = monthlyData[monthlyData.length - 1]?.neto || 0;
  const previousMonth = monthlyData[monthlyData.length - 2]?.neto || 0;
  const trend = lastMonth > previousMonth ? 'up' : 'down';
  const trendPercentage = previousMonth > 0
    ? (((lastMonth - previousMonth) / previousMonth) * 100).toFixed(1)
    : 0;

  // Calcular promedios
  const avgIngresos = monthlyData.length > 0
    ? monthlyData.reduce((sum, m) => sum + m.ingresos, 0) / monthlyData.length
    : 0;
  const avgGastos = monthlyData.length > 0
    ? monthlyData.reduce((sum, m) => sum + m.gastos, 0) / monthlyData.length
    : 0;
  const avgNeto = monthlyData.length > 0
    ? monthlyData.reduce((sum, m) => sum + m.neto, 0) / monthlyData.length
    : 0;

  // Proyección simple para los próximos 3 meses
  const projectionData = [
    ...monthlyData.slice(-6),
    {
      mes: 'Proyección 1',
      ingresos: avgIngresos,
      gastos: avgGastos,
      neto: avgNeto,
      isProjection: true,
    },
    {
      mes: 'Proyección 2',
      ingresos: avgIngresos * 1.02,
      gastos: avgGastos * 0.98,
      neto: avgNeto * 1.05,
      isProjection: true,
    },
    {
      mes: 'Proyección 3',
      ingresos: avgIngresos * 1.04,
      gastos: avgGastos * 0.96,
      neto: avgNeto * 1.08,
      isProjection: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tendencia Mensual */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tendencia de Ingresos Netos</CardTitle>
              <CardDescription>Últimos meses y proyecciones</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {trend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <Badge variant={trend === 'up' ? 'default' : 'destructive'}>
                {trend === 'up' ? '+' : ''}{trendPercentage}%
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData}>
              <defs>
                <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `€${Number(value).toFixed(0)}`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="neto"
                stroke="#000000"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorNeto)"
                name="Ingreso Neto"
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Promedio Ingresos</p>
              <p className="text-lg font-bold">€{avgIngresos.toFixed(0)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Promedio Gastos</p>
              <p className="text-lg font-bold text-red-500">€{avgGastos.toFixed(0)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Promedio Neto</p>
              <p className="text-lg font-bold text-green-500">€{avgNeto.toFixed(0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingresos vs Gastos */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativa Ingresos vs Gastos</CardTitle>
          <CardDescription>Análisis mensual detallado</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `€${Number(value).toFixed(0)}`} />
              <Legend />
              <Bar dataKey="ingresos" fill="#000000" name="Ingresos" />
              <Bar dataKey="gastos" fill="#EF4444" name="Gastos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Flujo de Caja */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo de Caja Mensual</CardTitle>
          <CardDescription>Visualización de ingresos netos mensuales</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value) => `€${Number(value).toFixed(0)}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="neto"
                stroke="#10B981"
                strokeWidth={3}
                name="Flujo Neto"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
