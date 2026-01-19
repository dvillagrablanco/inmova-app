'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Euro,
  Calendar,
  Home,
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
}

interface PropertyPerformance {
  name: string;
  address: string;
  occupancy: number;
  revenue: number;
  avgRent: number;
  rating: number;
}

interface KPIs {
  totalRevenue: number;
  revenueChange: number;
  avgOccupancy: number;
  occupancyChange: number;
  activeTenants: number;
  tenantsChange: number;
  avgRent: number;
  rentChange: number;
}

interface Metrics {
  avgStayMonths: number;
  renewalRate: number;
  repeatTenantRate: number;
}

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
            {change !== undefined && change !== 0 && (
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
  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

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
                style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
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
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

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
                <span className="text-sm font-medium">{item.category}</span>
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
  if (properties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rendimiento por Propiedad</CardTitle>
          <CardDescription>Ordenado por ingresos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-muted-foreground">
            No hay datos de propiedades disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  <p className="text-sm text-muted-foreground">Ocupacion</p>
                  <p className="font-medium">{prop.occupancy}%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Ingresos</p>
                  <p className="font-medium">{prop.revenue.toLocaleString()}€</p>
                </div>
                <Badge variant="secondary">⭐ {prop.rating.toFixed(1)}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// PAGINA PRINCIPAL
// ==========================================

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6m');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [kpis, setKpis] = useState<KPIs>({
    totalRevenue: 0,
    revenueChange: 0,
    avgOccupancy: 0,
    occupancyChange: 0,
    activeTenants: 0,
    tenantsChange: 0,
    avgRent: 0,
    rentChange: 0,
  });
  const [revenueData, setRevenueData] = useState<TimeSeriesData[]>([]);
  const [occupancyData, setOccupancyData] = useState<TimeSeriesData[]>([]);
  const [tenantsByPurpose, setTenantsByPurpose] = useState<TenantDemographic[]>([]);
  const [tenantsByNationality, setTenantsByNationality] = useState<TenantDemographic[]>([]);
  const [propertyPerformance, setPropertyPerformance] = useState<PropertyPerformance[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    avgStayMonths: 0,
    renewalRate: 0,
    repeatTenantRate: 0,
  });

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/media-estancia/analytics?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setKpis(data.kpis || {
          totalRevenue: 0,
          revenueChange: 0,
          avgOccupancy: 0,
          occupancyChange: 0,
          activeTenants: 0,
          tenantsChange: 0,
          avgRent: 0,
          rentChange: 0,
        });
        setRevenueData(data.revenueData || []);
        setOccupancyData(data.occupancyData || []);
        setTenantsByPurpose(data.tenantsByPurpose || []);
        setTenantsByNationality(data.tenantsByNationality || []);
        setPropertyPerformance(data.propertyPerformance || []);
        setMetrics(data.metrics || {
          avgStayMonths: 0,
          renewalRate: 0,
          repeatTenantRate: 0,
        });
      } else {
        toast.error('Error al cargar analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error al cargar analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Metricas y rendimiento de media estancia
            </p>
          </div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Metricas y rendimiento de media estancia
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Ultimo mes</SelectItem>
              <SelectItem value="3m">Ultimos 3 meses</SelectItem>
              <SelectItem value="6m">Ultimos 6 meses</SelectItem>
              <SelectItem value="12m">Ultimo año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
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
        <MetricCard 
          title="Ingresos Totales" 
          value={kpis.totalRevenue} 
          change={kpis.revenueChange} 
          icon={Euro} 
          format="currency" 
        />
        <MetricCard 
          title="Ocupacion Media" 
          value={kpis.avgOccupancy} 
          change={kpis.occupancyChange} 
          icon={Home} 
          format="percent" 
        />
        <MetricCard 
          title="Inquilinos Activos" 
          value={kpis.activeTenants} 
          change={kpis.tenantsChange} 
          icon={Users} 
        />
        <MetricCard 
          title="Renta Media" 
          value={kpis.avgRent} 
          change={kpis.rentChange} 
          icon={BarChart3} 
          format="currency" 
        />
      </div>

      {/* Graficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartSimple data={revenueData} title="Ingresos Mensuales (€)" />
        <BarChartSimple data={occupancyData} title="Tasa de Ocupacion (%)" />
      </div>

      {/* Tabs de analisis */}
      <Tabs defaultValue="tenants" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tenants">Inquilinos</TabsTrigger>
          <TabsTrigger value="properties">Propiedades</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DemographicsChart data={tenantsByPurpose} title="Inquilinos por Motivo" />
            <DemographicsChart data={tenantsByNationality} title="Inquilinos por Nacionalidad" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-blue-600">{metrics.avgStayMonths}</p>
                <p className="text-sm text-muted-foreground mt-2">Meses de estancia media</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-green-600">{metrics.renewalRate}%</p>
                <p className="text-sm text-muted-foreground mt-2">Tasa de renovacion</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-purple-600">{metrics.repeatTenantRate}%</p>
                <p className="text-sm text-muted-foreground mt-2">Inquilinos repetidores</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="properties">
          <PropertyRanking properties={propertyPerformance} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
