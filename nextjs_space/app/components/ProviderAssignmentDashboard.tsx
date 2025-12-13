'use client';

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  ClipboardCheck,
  CheckCircle2,
  TrendingUp,
  Star,
  Award,
  BarChart3,
} from 'lucide-react';
import { useAssignmentStats } from '@/app/hooks/useProviderRecommendations';

export default function ProviderAssignmentDashboard() {
  const { stats, loading, error, fetchStats } = useAssignmentStats();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Sistema de Asignación Inteligente</h2>
        <Badge variant="outline" className="ml-auto">
          Últimas 24h
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Total Proveedores */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proveedores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProviders}</div>
            <p className="text-xs text-muted-foreground">Total en sistema</p>
          </CardContent>
        </Card>

        {/* Total Órdenes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes de Trabajo</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkOrders}</div>
            <p className="text-xs text-muted-foreground">Total registradas</p>
          </CardContent>
        </Card>

        {/* Órdenes Completadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalWorkOrders > 0
                ? `${((stats.completedOrders / stats.totalWorkOrders) * 100).toFixed(1)}% del total`
                : 'Sin datos'}
            </p>
          </CardContent>
        </Card>

        {/* Tasa de Completado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.completionRate >= 80 ? (
                <span className="text-green-600">Excelente rendimiento</span>
              ) : stats.completionRate >= 60 ? (
                <span className="text-yellow-600">Buen rendimiento</span>
              ) : (
                <span className="text-red-600">Necesita mejora</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Rating Promedio */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.avgProviderRating.toFixed(1)}</div>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.avgProviderRating >= 4.5 ? (
                <span className="text-green-600">Calidad excepcional</span>
              ) : stats.avgProviderRating >= 4.0 ? (
                <span className="text-blue-600">Buena calidad</span>
              ) : stats.avgProviderRating >= 3.0 ? (
                <span className="text-yellow-600">Calidad aceptable</span>
              ) : stats.avgProviderRating > 0 ? (
                <span className="text-red-600">Requiere atención</span>
              ) : (
                'Sin evaluaciones'
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Insights del Sistema
          </CardTitle>
          <CardDescription>
            Análisis automático basado en el rendimiento del sistema de asignación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {generateInsights(stats).map((insight, index) => (
              <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                {insight.icon}
                <div className="flex-1">
                  <div className="font-medium text-sm">{insight.title}</div>
                  <div className="text-sm text-muted-foreground">{insight.description}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function generateInsights(stats: any) {
  const insights: any[] = [];

  // Insight sobre proveedores
  if (stats.totalProviders < 5) {
    insights.push({
      icon: <Users className="w-5 h-5 text-orange-600 flex-shrink-0" />,
      title: 'Expandir Red de Proveedores',
      description:
        'Considera agregar más proveedores para mejorar la competencia y disponibilidad.',
    });
  } else if (stats.totalProviders >= 10) {
    insights.push({
      icon: <Users className="w-5 h-5 text-green-600 flex-shrink-0" />,
      title: 'Red de Proveedores Sólida',
      description: `Tienes ${stats.totalProviders} proveedores activos, lo que permite una buena competencia y disponibilidad.`,
    });
  }

  // Insight sobre tasa de completado
  if (stats.completionRate >= 85) {
    insights.push({
      icon: <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0" />,
      title: 'Excelente Tasa de Completado',
      description: `Con ${stats.completionRate.toFixed(1)}% de completado, el sistema está funcionando óptimamente.`,
    });
  } else if (stats.completionRate < 60 && stats.totalWorkOrders > 5) {
    insights.push({
      icon: <TrendingUp className="w-5 h-5 text-red-600 flex-shrink-0" />,
      title: 'Tasa de Completado Baja',
      description:
        'Revisa los proveedores asignados y considera factores que pueden estar afectando el completado.',
    });
  }

  // Insight sobre rating
  if (stats.avgProviderRating >= 4.5 && stats.totalProviders > 0) {
    insights.push({
      icon: <Star className="w-5 h-5 text-yellow-600 flex-shrink-0" />,
      title: 'Calidad Excepcional',
      description:
        'Los proveedores mantienen un rating excepcional. Considera premiar a los de mejor desempeño.',
    });
  } else if (stats.avgProviderRating < 3.5 && stats.avgProviderRating > 0) {
    insights.push({
      icon: <Star className="w-5 h-5 text-red-600 flex-shrink-0" />,
      title: 'Mejorar Calidad de Servicio',
      description:
        'El rating promedio es bajo. Revisa los proveedores con bajo desempeño y considera cambios.',
    });
  }

  // Insight sobre volumen
  if (stats.totalWorkOrders === 0) {
    insights.push({
      icon: <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />,
      title: 'Sistema Listo',
      description:
        'El sistema de asignación inteligente está listo para empezar a gestionar órdenes de trabajo.',
    });
  } else if (stats.totalWorkOrders >= 50) {
    insights.push({
      icon: <ClipboardCheck className="w-5 h-5 text-green-600 flex-shrink-0" />,
      title: 'Alto Volumen de Operaciones',
      description: `Has gestionado ${stats.totalWorkOrders} órdenes. El sistema está optimizando tus asignaciones.`,
    });
  }

  // Si no hay insights, mostrar uno genérico
  if (insights.length === 0) {
    insights.push({
      icon: <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />,
      title: 'Sistema en Operación',
      description:
        'El sistema de asignación inteligente está analizando tus proveedores y optimizando las asignaciones.',
    });
  }

  return insights;
}
