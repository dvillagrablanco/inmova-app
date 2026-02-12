'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
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

interface DashboardData {
  kpis: {
    facturacion: number;
    operaciones: number;
    conversionRate: number;
    ticketMedio: number;
    totalAgents: number;
    activeAgents: number;
  };
  metricasAgentes: Array<{
    nombre: string;
    operaciones: number;
    conversion: number;
    comisiones: number;
    leads: number;
    status: string;
  }>;
  objetivos: Array<{
    nombre: string;
    actual: number;
    objetivo: number;
    unidad: string;
  }>;
}

export default function RedAgentesDashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [periodo, setPeriodo] = useState('mes');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status, periodo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/red-agentes/dashboard?periodo=${periodo}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Error loading agent dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis;
  const metricasAgentes = data?.metricasAgentes || [];
  const objetivos = data?.objetivos || [];

  const kpiCards = [
    { label: 'Facturación Total', value: kpis ? `€${kpis.facturacion.toLocaleString('es-ES')}` : '€0', icon: DollarSign, color: 'text-green-600' },
    { label: 'Operaciones Cerradas', value: String(kpis?.operaciones || 0), icon: Building2, color: 'text-blue-600' },
    { label: 'Tasa de Conversión', value: `${kpis?.conversionRate || 0}%`, icon: Target, color: 'text-purple-600' },
    { label: 'Ticket Medio', value: kpis ? `€${kpis.ticketMedio.toLocaleString('es-ES')}` : '€0', icon: TrendingUp, color: 'text-amber-600' },
  ];

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
          {kpiCards.map((kpi, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
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
                const progreso = obj.objetivo > 0 ? (obj.actual / obj.objetivo) * 100 : 0;
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
            {metricasAgentes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay agentes registrados</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
