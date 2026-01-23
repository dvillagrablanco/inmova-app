'use client';

export const dynamic = 'force-dynamic';

/**
 * Partners - Analíticas
 * 
 * Dashboard de métricas y rendimiento para partners
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Euro,
  Eye,
  MousePointer,
  UserPlus,
  Target,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: typeof BarChart3;
  color: string;
}

const METRICS: MetricCard[] = [
  {
    title: 'Visitas Totales',
    value: '12,543',
    change: 12.5,
    changeLabel: 'vs mes anterior',
    icon: Eye,
    color: 'text-blue-500',
  },
  {
    title: 'Clicks en Links',
    value: '4,892',
    change: 8.3,
    changeLabel: 'vs mes anterior',
    icon: MousePointer,
    color: 'text-purple-500',
  },
  {
    title: 'Leads Generados',
    value: '234',
    change: -2.1,
    changeLabel: 'vs mes anterior',
    icon: UserPlus,
    color: 'text-green-500',
  },
  {
    title: 'Conversiones',
    value: '89',
    change: 15.7,
    changeLabel: 'vs mes anterior',
    icon: Target,
    color: 'text-orange-500',
  },
];

// Datos cargados desde API /api/partners/analytics

export default function PartnersAnaliticasPage() {
  const [period, setPeriod] = useState('30d');
  const [funnelData, setFunnelData] = useState<{stage: string; count: number; percentage: number}[]>([]);
  const [channelData, setChannelData] = useState<{channel: string; leads: number; conversiones: number; revenue: number}[]>([]);
  const [monthlyData, setMonthlyData] = useState<{mes: string; leads: number; conversiones: number; revenue: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/partners/analytics');
        if (response.ok) {
          const result = await response.json();
          setFunnelData(result.data?.funnelData || []);
          setChannelData(result.data?.channelData || []);
          setMonthlyData(result.data?.monthlyData || []);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analíticas</h1>
          <p className="text-muted-foreground">
            Métricas y rendimiento de tus campañas
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 días</SelectItem>
              <SelectItem value="30d">Últimos 30 días</SelectItem>
              <SelectItem value="90d">Últimos 90 días</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {METRICS.map((metric, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
                <div className={`flex items-center text-sm ${
                  metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change >= 0 ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Embudo de Conversión
            </CardTitle>
            <CardDescription>
              Seguimiento del recorrido de los usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{stage.stage}</span>
                    <span className="text-muted-foreground">
                      {stage.count.toLocaleString()} ({stage.percentage}%)
                    </span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${index === 0 ? 100 : (funnelData[0]?.count ? (stage.count / funnelData[0].count) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Tasa de conversión global</p>
              <p className="text-3xl font-bold text-green-600">
                {((89 / 12543) * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">
                De visita a cliente
              </p>
            </div>
          </CardContent>
        </Card>

        {/* By Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rendimiento por Canal
            </CardTitle>
            <CardDescription>
              Comparativa de resultados por fuente de tráfico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelData.map((channel) => (
                <div
                  key={channel.channel}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{channel.channel}</p>
                    <p className="text-sm text-muted-foreground">
                      {channel.leads} leads · {channel.conversiones} conversiones
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">€{channel.revenue}</p>
                    <p className="text-xs text-muted-foreground">
                      CVR: {channel.leads > 0 ? ((channel.conversiones / channel.leads) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolución Mensual
          </CardTitle>
          <CardDescription>
            Tendencia de los últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3 font-medium">Mes</th>
                  <th className="pb-3 font-medium text-right">Leads</th>
                  <th className="pb-3 font-medium text-right">Conversiones</th>
                  <th className="pb-3 font-medium text-right">CVR</th>
                  <th className="pb-3 font-medium text-right">Comisiones</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month, index) => {
                  const prevMonth = monthlyData[index - 1];
                  const leadChange = prevMonth && prevMonth.leads > 0
                    ? ((month.leads - prevMonth.leads) / prevMonth.leads) * 100
                    : 0;

                  return (
                    <tr key={month.mes} className="border-t">
                      <td className="py-3 font-medium">{month.mes} 2025</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {month.leads}
                          {prevMonth && (
                            <span className={`text-xs ${leadChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {leadChange >= 0 ? '+' : ''}{leadChange.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right">{month.conversiones}</td>
                      <td className="py-3 text-right">
                        {month.leads > 0 ? ((month.conversiones / month.leads) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-3 text-right font-medium text-green-600">
                        €{month.revenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2">
                <tr className="font-bold">
                  <td className="py-3">Total</td>
                  <td className="py-3 text-right">
                    {monthlyData.reduce((sum, m) => sum + m.leads, 0)}
                  </td>
                  <td className="py-3 text-right">
                    {monthlyData.reduce((sum, m) => sum + m.conversiones, 0)}
                  </td>
                  <td className="py-3 text-right">
                    {monthlyData.reduce((sum, m) => sum + m.leads, 0) > 0
                      ? ((monthlyData.reduce((sum, m) => sum + m.conversiones, 0) /
                          monthlyData.reduce((sum, m) => sum + m.leads, 0)) * 100).toFixed(1)
                      : 0}%
                  </td>
                  <td className="py-3 text-right text-green-600">
                    €{monthlyData.reduce((sum, m) => sum + m.revenue, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Destacadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Mejor Mes</p>
              <p className="text-2xl font-bold">Diciembre 2025</p>
              <p className="text-sm text-green-600">234 leads · 89 conversiones</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Mejor Canal</p>
              <p className="text-2xl font-bold">Link Directo</p>
              <p className="text-sm text-blue-600">42.9% de tasa de conversión</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor Promedio</p>
              <p className="text-2xl font-bold">€50</p>
              <p className="text-sm text-purple-600">por cliente convertido</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
