'use client';

export const dynamic = 'force-dynamic';

/**
 * Estadísticas Avanzadas
 * 
 * Panel de estadísticas y métricas del negocio
 * DATOS REALES desde la API /api/estadisticas
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  Building2,
  Users,
  Euro,
  Percent,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Home,
  FileText,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface StatsData {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  monthlyIncome: number;
  activeTenantsCount: number;
  changes: {
    properties: number;
    occupancy: number;
    income: number;
    tenants: number;
  };
}

interface MonthlyData {
  mes: string;
  ingresos: number;
  ocupacion: number;
}

interface PropertyType {
  tipo: string;
  count: number;
  ocupacion: number;
  ingresos: number;
}

interface TopProperty {
  nombre: string;
  unidades: number;
  ocupacion: number;
  ingresos: number;
}

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('6m');
  
  // Estados para datos reales de la API
  const [stats, setStats] = useState<StatsData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [topProperties, setTopProperties] = useState<TopProperty[]>([]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/estadisticas');
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setStats(result.data.stats);
        setMonthlyData(result.data.monthlyData || []);
        setPropertyTypes(result.data.propertyTypes || []);
        setTopProperties(result.data.topProperties || []);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = () => {
    toast.success('Exportando estadísticas...');
  };

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  // Generar stats cards con datos reales
  const statsCards = [
    {
      title: 'Total Unidades',
      value: stats?.totalUnits?.toString() || '0',
      change: stats?.changes?.properties || 0,
      trend: (stats?.changes?.properties || 0) >= 0 ? 'up' : 'down',
      icon: Building2,
      color: 'text-blue-500',
    },
    {
      title: 'Ocupación Media',
      value: `${stats?.occupancyRate?.toFixed(1) || '0'}%`,
      change: stats?.changes?.occupancy || 0,
      trend: (stats?.changes?.occupancy || 0) >= 0 ? 'up' : 'down',
      icon: Percent,
      color: 'text-green-500',
    },
    {
      title: 'Ingresos Mensuales',
      value: formatCurrency(stats?.monthlyIncome || 0),
      change: stats?.changes?.income || 0,
      trend: (stats?.changes?.income || 0) >= 0 ? 'up' : 'down',
      icon: Euro,
      color: 'text-emerald-500',
    },
    {
      title: 'Inquilinos Activos',
      value: stats?.activeTenantsCount?.toString() || '0',
      change: stats?.changes?.tenants || 0,
      trend: (stats?.changes?.tenants || 0) >= 0 ? 'up' : 'down',
      icon: Users,
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">
            Métricas y análisis del rendimiento del negocio
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={fetchStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">Último mes</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="1y">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Main Stats - DATOS REALES */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div className={`flex items-center text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {stat.change !== 0 && (
                    <>
                      {stat.trend === 'up' ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                    </>
                  )}
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trends - DATOS REALES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia Mensual
            </CardTitle>
            <CardDescription>
              Evolución de ingresos y ocupación
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <div className="space-y-4">
                {monthlyData.map((data, index) => {
                  const prevData = monthlyData[index - 1];
                  const change = prevData && prevData.ingresos > 0
                    ? ((data.ingresos - prevData.ingresos) / prevData.ingresos * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <div key={data.mes} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium w-10">{data.mes}</span>
                        <Progress value={data.ocupacion} className="w-24" />
                        <span className="text-sm text-muted-foreground">
                          {data.ocupacion}%
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(data.ingresos)}</p>
                        {prevData && (
                          <p className={`text-xs ${Number(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {Number(change) >= 0 ? '+' : ''}{change}%
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay datos históricos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Property Types - DATOS REALES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Por Tipo de Propiedad
            </CardTitle>
            <CardDescription>
              Distribución por categoría
            </CardDescription>
          </CardHeader>
          <CardContent>
            {propertyTypes.length > 0 ? (
              <div className="space-y-4">
                {propertyTypes.map((type) => (
                  <div key={type.tipo} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{type.tipo}</span>
                      <span className="text-muted-foreground">
                        {type.count} unidades · {formatCurrency(type.ingresos)}/mes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={type.ocupacion} className="flex-1" />
                      <Badge variant={type.ocupacion >= 90 ? 'default' : 'secondary'}>
                        {type.ocupacion}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Home className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay propiedades registradas</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Properties - DATOS REALES */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Propiedades con Mayor Rendimiento
          </CardTitle>
          <CardDescription>
            Top 5 por ingresos mensuales
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topProperties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Propiedad</th>
                    <th className="pb-3 font-medium text-right">Unidades</th>
                    <th className="pb-3 font-medium text-right">Ocupación</th>
                    <th className="pb-3 font-medium text-right">Ingresos/mes</th>
                    <th className="pb-3 font-medium text-right">€/Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {topProperties.map((prop, index) => (
                    <tr key={prop.nombre} className="border-t">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="font-medium">{prop.nombre}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right">{prop.unidades}</td>
                      <td className="py-3 text-right">
                        <Badge variant={prop.ocupacion >= 90 ? 'default' : 'secondary'}>
                          {prop.ocupacion}%
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-semibold text-green-600">
                        {formatCurrency(prop.ingresos)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {prop.unidades > 0 ? formatCurrency(Math.round(prop.ingresos / prop.unidades)) : '€0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay propiedades registradas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs adicionales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Unidades Ocupadas</p>
                <p className="text-2xl font-bold">{stats?.occupiedUnits || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Unidades Disponibles</p>
                <p className="text-2xl font-bold">{(stats?.totalUnits || 0) - (stats?.occupiedUnits || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Edificios</p>
                <p className="text-2xl font-bold">{stats?.totalProperties || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tasa Ocupación</p>
                <p className="text-2xl font-bold">{stats?.occupancyRate?.toFixed(1) || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
