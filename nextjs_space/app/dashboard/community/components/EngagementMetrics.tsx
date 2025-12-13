'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from '@/components/ui/lazy-charts-extended';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MessageSquare,
  Heart,
  Eye,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function EngagementMetrics() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/community/engagement?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
            <p className="text-muted-foreground">
              Las métricas se mostrarán cuando haya actividad en la comunidad.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Datos para gráficos
  const interactionData = [
    { name: 'Likes', value: metrics.posts?.totalLikes || 0, color: '#ec4899' },
    { name: 'Comentarios', value: metrics.posts?.totalComentarios || 0, color: '#3b82f6' },
    { name: 'Reacciones', value: metrics.interacciones?.reacciones || 0, color: '#8b5cf6' },
    { name: 'Asistencias', value: metrics.eventos?.asistenciasConfirmadas || 0, color: '#10b981' },
  ];

  const contentData = [
    { name: 'Eventos', value: metrics.eventos?.total || 0 },
    { name: 'Posts', value: metrics.posts?.total || 0 },
    { name: 'Anuncios', value: metrics.anuncios?.total || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Métricas de Engagement</h2>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Interacciones</p>
                <p className="text-3xl font-bold">{metrics.interacciones?.total || 0}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Eventos Realizados</p>
                <p className="text-3xl font-bold">{metrics.eventos?.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.eventos?.asistenciasConfirmadas || 0} asistentes confirmados
                </p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Posts Publicados</p>
                <p className="text-3xl font-bold">{metrics.posts?.total || 0}</p>
                <div className="flex items-center gap-1 mt-1">
                  {Number(metrics.posts?.tendencia) > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : Number(metrics.posts?.tendencia) < 0 ? (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  ) : null}
                  <span
                    className={`text-xs ${Number(metrics.posts?.tendencia) > 0 ? 'text-green-500' : Number(metrics.posts?.tendencia) < 0 ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    {Number(metrics.posts?.tendencia) > 0 ? '+' : ''}
                    {metrics.posts?.tendencia || 0}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Anuncios Activos</p>
                <p className="text-3xl font-bold">{metrics.anuncios?.total || 0}</p>
              </div>
              <div className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactions Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Interacciones</CardTitle>
            <CardDescription>Desglose por tipo de interacción en el periodo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={interactionData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {interactionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Content Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Contenido Publicado</CardTitle>
            <CardDescription>Volumen de contenido por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Actividad</CardTitle>
          <CardDescription>
            Principales métricas del periodo seleccionado ({metrics.periodo})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-pink-500">{metrics.posts?.totalLikes || 0}</p>
              <p className="text-sm text-muted-foreground">Total Likes</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-blue-500">
                {metrics.posts?.totalComentarios || 0}
              </p>
              <p className="text-sm text-muted-foreground">Comentarios</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-green-500">
                {metrics.eventos?.asistenciasConfirmadas || 0}
              </p>
              <p className="text-sm text-muted-foreground">Asistencias</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-purple-500">
                {metrics.interacciones?.reacciones || 0}
              </p>
              <p className="text-sm text-muted-foreground">Reacciones</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
