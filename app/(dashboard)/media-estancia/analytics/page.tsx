'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Euro,
  Calendar,
  Home,
  Globe,
  Briefcase,
  GraduationCap,
  Heart,
  Clock,
  Download,
  RefreshCw,
} from 'lucide-react';

// ==========================================
// TIPOS
// ==========================================

interface TimeSeriesData {
  period: string;
  value: number;
  change?: number;
}

interface TenantDemographic {
  category: string;
  percentage: number;
  count: number;
  icon?: any;
}

interface PropertyPerformance {
  name: string;
  address: string;
  occupancy: number;
  revenue: number;
  avgRent: number;
  rating: number;
}

interface SeasonalData {
  month: string;
  occupancy: number;
  revenue: number;
  demand: 'low' | 'medium' | 'high' | 'peak';
}

// ==========================================
// DATOS DE EJEMPLO
// ==========================================

const REVENUE_DATA: TimeSeriesData[] = [
  { period: 'Ene', value: 4200, change: 5 },
  { period: 'Feb', value: 4800, change: 14 },
  { period: 'Mar', value: 4500, change: -6 },
  { period: 'Abr', value: 5100, change: 13 },
  { period: 'May', value: 4900, change: -4 },
  { period: 'Jun', value: 5500, change: 12 },
];

const OCCUPANCY_DATA: TimeSeriesData[] = [
  { period: 'Ene', value: 85 },
  { period: 'Feb', value: 92 },
  { period: 'Mar', value: 78 },
  { period: 'Abr', value: 88 },
  { period: 'May', value: 75 },
  { period: 'Jun', value: 95 },
];

const TENANT_BY_PURPOSE: TenantDemographic[] = [
  { category: 'Trabajo', percentage: 42, count: 25, icon: Briefcase },
  { category: 'Estudios', percentage: 28, count: 17, icon: GraduationCap },
  { category: 'Proyecto temporal', percentage: 15, count: 9, icon: Clock },
  { category: 'Tratamiento médico', percentage: 8, count: 5, icon: Heart },
  { category: 'Otros', percentage: 7, count: 4, icon: Users },
];

const TENANT_BY_NATIONALITY: TenantDemographic[] = [
  { category: 'España', percentage: 35, count: 21 },
  { category: 'Alemania', percentage: 18, count: 11 },
  { category: 'Francia', percentage: 14, count: 8 },
  { category: 'Italia', percentage: 12, count: 7 },
  { category: 'Reino Unido', percentage: 8, count: 5 },
  { category: 'Otros', percentage: 13, count: 8 },
];

const PROPERTY_PERFORMANCE: PropertyPerformance[] = [
  { name: 'Piso Gran Vía', address: 'Gran Vía 42', occupancy: 92, revenue: 16200, avgRent: 1350, rating: 4.8 },
  { name: 'Apt. Castellana', address: 'P. Castellana 120', occupancy: 85, revenue: 21600, avgRent: 1800, rating: 4.6 },
  { name: 'Estudio Serrano', address: 'Serrano 85', occupancy: 78, revenue: 11400, avgRent: 950, rating: 4.9 },
  { name: 'Loft Malasaña', address: 'Fuencarral 67', occupancy: 88, revenue: 14400, avgRent: 1200, rating: 4.7 },
];

const SEASONALITY_DATA: SeasonalData[] = [
  { month: 'Enero', occupancy: 90, revenue: 5400, demand: 'high' },
  { month: 'Febrero', occupancy: 85, revenue: 5100, demand: 'high' },
  { month: 'Marzo', occupancy: 75, revenue: 4500, demand: 'medium' },
  { month: 'Abril', occupancy: 70, revenue: 4200, demand: 'medium' },
  { month: 'Mayo', occupancy: 65, revenue: 3900, demand: 'low' },
  { month: 'Junio', occupancy: 80, revenue: 4800, demand: 'medium' },
  { month: 'Julio', occupancy: 85, revenue: 5100, demand: 'high' },
  { month: 'Agosto', occupancy: 75, revenue: 4500, demand: 'medium' },
  { month: 'Septiembre', occupancy: 95, revenue: 5700, demand: 'peak' },
  { month: 'Octubre', occupancy: 90, revenue: 5400, demand: 'high' },
  { month: 'Noviembre', occupancy: 85, revenue: 5100, demand: 'high' },
  { month: 'Diciembre', occupancy: 60, revenue: 3600, demand: 'low' },
];

const MARKET_COMPARISON = [
  { metric: 'Ocupación', yours: 82, market: 75, percentile: 75 },
  { metric: 'Renta media', yours: 1200, market: 1050, percentile: 80 },
  { metric: 'Tasa renovación', yours: 65, market: 45, percentile: 85 },
  { metric: 'Tiempo respuesta', yours: 4, market: 12, percentile: 90 },
];

// ==========================================
// COMPONENTES
// ==========================================

function MetricCard({ title, value, change, icon: Icon, format = 'number' }: {
  title: string;
  value: number;
  change?: number;
  icon: any;
  format?: 'number' | 'currency' | 'percent';
}) {
  const formatValue = (v: number) => {
    switch (format) {
      case 'currency': return `${v.toLocaleString('es-ES')}€`;
      case 'percent': return `${v}%`;
      default: return v.toLocaleString('es-ES');
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{formatValue(value)}</p>
            {change !== undefined && (
              <div className={`flex items-center mt-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                <span>{change >= 0 ? '+' : ''}{change}%</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BarChartSimple({ data, title }: { data: TimeSeriesData[]; title: string }) {
  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-40 gap-2">
          {data.map((item, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div 
                className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                style={{ height: `${(item.value / maxValue) * 100}%` }}
              />
              <span className="text-xs text-muted-foreground mt-2">{item.period}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DemographicsChart({ data, title }: { data: TenantDemographic[]; title: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{item.category}</span>
                </div>
                <span className="text-sm text-muted-foreground">{item.count} ({item.percentage}%)</span>
              </div>
              <Progress value={item.percentage} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PropertyRanking({ properties }: { properties: PropertyPerformance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Rendimiento por Propiedad</CardTitle>
        <CardDescription>Ordenado por ingresos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {properties.sort((a, b) => b.revenue - a.revenue).map((prop, i) => (
            <div key={prop.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-300'
                }`}>
                  {i + 1}
                </div>
                <div>
                  <p className="font-medium">{prop.name}</p>
                  <p className="text-sm text-muted-foreground">{prop.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Ocupación</p>
                  <p className="font-medium">{prop.occupancy}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Ingresos</p>
                  <p className="font-medium">{prop.revenue.toLocaleString()}€</p>
                </div>
                <Badge variant="secondary">⭐ {prop.rating}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SeasonalityHeatmap({ data }: { data: SeasonalData[] }) {
  const getDemandColor = (demand: string) => {
    switch (demand) {
      case 'peak': return 'bg-red-500';
      case 'high': return 'bg-orange-400';
      case 'medium': return 'bg-yellow-300';
      case 'low': return 'bg-green-300';
      default: return 'bg-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Estacionalidad</CardTitle>
        <CardDescription>Demanda y ocupación por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {data.map((item) => (
            <div
              key={item.month}
              className={`p-3 rounded-lg text-center ${getDemandColor(item.demand)} text-white`}
            >
              <p className="text-xs font-medium">{item.month.substring(0, 3)}</p>
              <p className="text-lg font-bold">{item.occupancy}%</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-300" />
            <span className="text-xs">Baja</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-yellow-300" />
            <span className="text-xs">Media</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-orange-400" />
            <span className="text-xs">Alta</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs">Pico</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketComparison({ data }: { data: typeof MARKET_COMPARISON }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparación con el Mercado</CardTitle>
        <CardDescription>Tu rendimiento vs. media del sector</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item) => (
            <div key={item.metric} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.metric}</span>
                <Badge variant={item.percentile >= 75 ? 'default' : 'secondary'}>
                  Top {100 - item.percentile}%
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative h-2 bg-gray-200 rounded-full">
                    <div 
                      className="absolute h-full bg-blue-500 rounded-full"
                      style={{ width: `${(item.yours / Math.max(item.yours, item.market * 1.5)) * 100}%` }}
                    />
                    <div 
                      className="absolute h-full w-1 bg-red-500"
                      style={{ left: `${(item.market / Math.max(item.yours, item.market * 1.5)) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-32 text-right">
                  <span className="text-blue-600 font-medium">{item.yours}</span>
                  <span className="text-gray-400 mx-1">vs</span>
                  <span className="text-gray-600">{item.market}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6m');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Métricas y rendimiento de media estancia
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mes</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Ingresos Totales" value={45600} change={12} icon={Euro} format="currency" />
        <MetricCard title="Ocupación Media" value={82} change={5} icon={Home} format="percent" />
        <MetricCard title="Inquilinos Activos" value={18} change={8} icon={Users} />
        <MetricCard title="Renta Media" value={1200} change={3} icon={BarChart3} format="currency" />
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartSimple data={REVENUE_DATA} title="Ingresos Mensuales (€)" />
        <BarChartSimple data={OCCUPANCY_DATA} title="Tasa de Ocupación (%)" />
      </div>

      {/* Tabs de análisis */}
      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tenants">Inquilinos</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
          <TabsTrigger value="seasonality">Estacionalidad</TabsTrigger>
          <TabsTrigger value="market">Mercado</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DemographicsChart data={TENANT_BY_PURPOSE} title="Inquilinos por Motivo" />
            <DemographicsChart data={TENANT_BY_NATIONALITY} title="Inquilinos por Nacionalidad" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-blue-600">4.2</p>
                <p className="text-sm text-muted-foreground mt-2">Meses de estancia media</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-green-600">65%</p>
                <p className="text-sm text-muted-foreground mt-2">Tasa de renovación</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-purple-600">18%</p>
                <p className="text-sm text-muted-foreground mt-2">Inquilinos repetidores</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <PropertyRanking properties={PROPERTY_PERFORMANCE} />
        </TabsContent>

        <TabsContent value="seasonality">
          <SeasonalityHeatmap data={SEASONALITY_DATA} />
        </TabsContent>

        <TabsContent value="market">
          <MarketComparison data={MARKET_COMPARISON} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
