'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Target,
  Award,
  Calendar,
  ArrowLeft,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

// KPIs principales
const kpis = [
  { label: 'Facturación Total', value: '€145.200', change: '+18%', trend: 'up', icon: DollarSign, color: 'text-green-600' },
  { label: 'Operaciones Cerradas', value: '23', change: '+5', trend: 'up', icon: Building2, color: 'text-blue-600' },
  { label: 'Tasa de Conversión', value: '34%', change: '+2.5%', trend: 'up', icon: Target, color: 'text-purple-600' },
  { label: 'Ticket Medio', value: '€6.313', change: '-3%', trend: 'down', icon: TrendingUp, color: 'text-amber-600' },
];

// Datos de rendimiento mensual
const rendimientoMensual = [
  { mes: 'Ene', operaciones: 18, comisiones: 112000 },
  { mes: 'Feb', operaciones: 21, comisiones: 128000 },
  { mes: 'Mar', operaciones: 19, comisiones: 118000 },
  { mes: 'Abr', operaciones: 25, comisiones: 152000 },
  { mes: 'May', operaciones: 22, comisiones: 138000 },
  { mes: 'Jun', operaciones: 23, comisiones: 145200 },
];

// Distribución por tipo de operación
const tiposOperacion = [
  { tipo: 'Venta', cantidad: 12, porcentaje: 52, color: 'bg-blue-500' },
  { tipo: 'Alquiler', cantidad: 8, porcentaje: 35, color: 'bg-green-500' },
  { tipo: 'Gestión', cantidad: 3, porcentaje: 13, color: 'bg-purple-500' },
];

// Objetivos
const objetivos = [
  { nombre: 'Facturación Q2', actual: 145200, objetivo: 200000, unidad: '€' },
  { nombre: 'Operaciones Mes', actual: 23, objetivo: 30, unidad: '' },
  { nombre: 'Nuevos Agentes', actual: 5, objetivo: 8, unidad: '' },
  { nombre: 'Tasa Retención', actual: 92, objetivo: 95, unidad: '%' },
];

// Métricas por agente
const metricasAgentes = [
  { nombre: 'María García', operaciones: 8, conversion: 42, comisiones: 12400, leads: 19, status: 'excellent' },
  { nombre: 'Carlos Rodríguez', operaciones: 6, conversion: 38, comisiones: 9200, leads: 16, status: 'good' },
  { nombre: 'Ana Martínez', operaciones: 5, conversion: 35, comisiones: 7800, leads: 14, status: 'good' },
  { nombre: 'Pedro Sánchez', operaciones: 4, conversion: 28, comisiones: 5600, leads: 14, status: 'average' },
];

export default function RedAgentesDashboardPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState('mes');

  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/red-agentes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Dashboard de Rendimiento</h1>
              <p className="text-muted-foreground">
                Métricas y KPIs de la red de agentes
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
                <SelectItem value="trimestre">Este trimestre</SelectItem>
                <SelectItem value="año">Este año</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <Badge variant={kpi.trend === 'up' ? 'default' : 'destructive'} className="text-xs">
                    {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {kpi.change}
                  </Badge>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Gráficos y métricas */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Evolución mensual */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolución Mensual
              </CardTitle>
              <CardDescription>Operaciones y comisiones por mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rendimientoMensual.map((mes, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-12 text-sm font-medium">{mes.mes}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded"
                          style={{ width: `${(mes.operaciones / 30) * 100}%` }}
                        />
                        <span className="text-sm font-medium">{mes.operaciones} ops</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-4 bg-gradient-to-r from-green-500 to-green-600 rounded opacity-70"
                          style={{ width: `${(mes.comisiones / 200000) * 100}%` }}
                        />
                        <span className="text-xs text-muted-foreground">€{(mes.comisiones/1000).toFixed(0)}K</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribución por tipo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Por Tipo de Operación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tiposOperacion.map((tipo, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{tipo.tipo}</span>
                      <span>{tipo.cantidad} ({tipo.porcentaje}%)</span>
                    </div>
                    <Progress value={tipo.porcentaje} className={tipo.color} />
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Total: 23 operaciones</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objetivos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progreso de Objetivos
            </CardTitle>
            <CardDescription>Seguimiento de metas del período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {objetivos.map((obj, index) => {
                const progreso = (obj.actual / obj.objetivo) * 100;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{obj.nombre}</span>
                      <Badge variant={progreso >= 100 ? 'default' : progreso >= 70 ? 'secondary' : 'destructive'}>
                        {progreso.toFixed(0)}%
                      </Badge>
                    </div>
                    <Progress value={Math.min(progreso, 100)} />
                    <p className="text-xs text-muted-foreground">
                      {obj.unidad === '€' ? `€${obj.actual.toLocaleString()}` : `${obj.actual}${obj.unidad}`} / 
                      {obj.unidad === '€' ? ` €${obj.objetivo.toLocaleString()}` : ` ${obj.objetivo}${obj.unidad}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Métricas por agente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Rendimiento por Agente
            </CardTitle>
            <CardDescription>Comparativa de métricas individuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Agente</th>
                    <th className="text-center py-3 px-4 font-medium">Operaciones</th>
                    <th className="text-center py-3 px-4 font-medium">Conversión</th>
                    <th className="text-center py-3 px-4 font-medium">Comisiones</th>
                    <th className="text-center py-3 px-4 font-medium">Leads</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metricasAgentes.map((agente, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{agente.nombre}</td>
                      <td className="text-center py-3 px-4">{agente.operaciones}</td>
                      <td className="text-center py-3 px-4">{agente.conversion}%</td>
                      <td className="text-center py-3 px-4 text-green-600 font-semibold">€{agente.comisiones.toLocaleString()}</td>
                      <td className="text-center py-3 px-4">{agente.leads}</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={
                          agente.status === 'excellent' ? 'default' :
                          agente.status === 'good' ? 'secondary' : 'outline'
                        }>
                          {agente.status === 'excellent' && <Award className="h-3 w-3 mr-1" />}
                          {agente.status === 'excellent' ? 'Excelente' :
                           agente.status === 'good' ? 'Bueno' : 'Regular'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
