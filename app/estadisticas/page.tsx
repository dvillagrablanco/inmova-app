'use client';

export const dynamic = 'force-dynamic';

/**
 * Estadísticas Avanzadas
 * 
 * Panel de estadísticas y métricas del negocio
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface StatCard {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: typeof BarChart3;
  color: string;
}

const STATS: StatCard[] = [
  {
    title: 'Propiedades Totales',
    value: '156',
    change: 8,
    trend: 'up',
    icon: Building2,
    color: 'text-blue-500',
  },
  {
    title: 'Ocupación Media',
    value: '92.4%',
    change: 3.2,
    trend: 'up',
    icon: Percent,
    color: 'text-green-500',
  },
  {
    title: 'Ingresos Mensuales',
    value: '€124,500',
    change: 12.5,
    trend: 'up',
    icon: Euro,
    color: 'text-emerald-500',
  },
  {
    title: 'Inquilinos Activos',
    value: '312',
    change: -2.1,
    trend: 'down',
    icon: Users,
    color: 'text-purple-500',
  },
];

// Datos mock (cargados desde API /api/estadisticas en producción)
const MONTHLY_DATA = [
  { mes: 'Jul', ingresos: 118500, ocupacion: 89 },
  { mes: 'Ago', ingresos: 121200, ocupacion: 90 },
  { mes: 'Sep', ingresos: 119800, ocupacion: 91 },
  { mes: 'Oct', ingresos: 122500, ocupacion: 92 },
  { mes: 'Nov', ingresos: 123800, ocupacion: 91 },
  { mes: 'Dic', ingresos: 124500, ocupacion: 92 },
];

const PROPERTY_TYPES = [
  { tipo: 'Apartamentos', count: 89, ocupacion: 94, ingresos: 68500 },
  { tipo: 'Pisos', count: 45, ocupacion: 91, ingresos: 38200 },
  { tipo: 'Estudios', count: 22, ocupacion: 88, ingresos: 17800 },
];

const TOP_PROPERTIES = [
  { nombre: 'Edificio Centro', unidades: 24, ocupacion: 96, ingresos: 28500 },
  { nombre: 'Residencial Playa', unidades: 18, ocupacion: 94, ingresos: 24200 },
  { nombre: 'Apartamentos Norte', unidades: 32, ocupacion: 91, ingresos: 35800 },
  { nombre: 'Torres del Mar', unidades: 15, ocupacion: 93, ingresos: 18900 },
];

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6m');
  const [monthlyData, setMonthlyData] = useState<{mes: string; ingresos: number; ocupacion: number}[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{tipo: string; count: number; ocupacion: number; ingresos: number}[]>([]);
  const [topProperties, setTopProperties] = useState<{nombre: string; unidades: number; ocupacion: number; ingresos: number}[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/estadisticas');
        if (response.ok) {
          const result = await response.json();
          setMonthlyData(result.data?.monthlyData || []);
          setPropertyTypes(result.data?.propertyTypes || []);
          setTopProperties(result.data?.topProperties || []);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleExport = () => {
    toast.success('Exportando estadísticas...');
  };

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

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div className={`flex items-center text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUp className="h-3 w-3 mr-1" />
                  ) : stat.trend === 'down' ? (
                    <ArrowDown className="h-3 w-3 mr-1" />
                  ) : null}
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trends */}
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
            <div className="space-y-4">
              {MONTHLY_DATA.map((data, index) => {
                const prevData = MONTHLY_DATA[index - 1];
                const change = prevData 
                  ? ((data.ingresos - prevData.ingresos) / prevData.ingresos * 100).toFixed(1)
                  : 0;
                
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
                      <p className="font-semibold">€{data.ingresos.toLocaleString()}</p>
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
          </CardContent>
        </Card>

        {/* Property Types */}
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
            <div className="space-y-4">
              {PROPERTY_TYPES.map((type) => (
                <div key={type.tipo} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{type.tipo}</span>
                    <span className="text-muted-foreground">
                      {type.count} unidades · €{type.ingresos.toLocaleString()}/mes
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
          </CardContent>
        </Card>
      </div>

      {/* Top Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Propiedades con Mayor Rendimiento
          </CardTitle>
          <CardDescription>
            Top 4 por ingresos mensuales
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                {TOP_PROPERTIES.map((prop, index) => (
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
                      €{prop.ingresos.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      €{Math.round(prop.ingresos / prop.unidades).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Tiempo medio de pago</p>
                <p className="text-2xl font-bold">3.2 días</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Contratos renovados</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">NPS Inquilinos</p>
                <p className="text-2xl font-bold">72</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">ROI Medio</p>
                <p className="text-2xl font-bold">6.8%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
