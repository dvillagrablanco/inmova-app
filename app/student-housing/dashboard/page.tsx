'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Building,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Home,
  FileText,
  Wrench,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Stats {
  totalResidentes: number;
  residenciaOcupacion: number;
  totalHabitaciones: number;
  habitacionesDisponibles: number;
  aplicacionesPendientes: number;
  actividadesProximas: number;
  pagosPendientes: number;
  incidenciasAbiertas: number;
}

export default function StudentHousingDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/student-housing/stats');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando estadísticas');
      }
      
      setStats(result.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
      toast.error('Error cargando estadísticas');
      // Fallback a valores por defecto
      setStats({
        totalResidentes: 0,
        residenciaOcupacion: 0,
        totalHabitaciones: 0,
        habitacionesDisponibles: 0,
        aplicacionesPendientes: 0,
        actividadesProximas: 0,
        pagosPendientes: 0,
        incidenciasAbiertas: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Residencia Estudiantil</h1>
          <p className="text-muted-foreground">Gestión integral de tu residencia universitaria</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/student-housing/aplicaciones">
              <FileText className="h-4 w-4 mr-2" />
              Ver Aplicaciones
            </Link>
          </Button>
          <Button asChild>
            <Link href="/student-housing/residentes">
              <Users className="h-4 w-4 mr-2" />
              Gestionar Residentes
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 text-sm">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Mostrando datos de ejemplo. {error}
          </p>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Residentes Activos</p>
                <p className="text-2xl font-bold">{stats?.totalResidentes || 0}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Ocupación al día
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold">{stats?.residenciaOcupacion || 0}%</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.habitacionesDisponibles || 0} disponibles
                </p>
              </div>
              <Building className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aplicaciones</p>
                <p className="text-2xl font-bold">{stats?.aplicacionesPendientes || 0}</p>
                <p className="text-xs text-yellow-600">Pendientes de revisión</p>
              </div>
              <FileText className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Incidencias</p>
                <p className="text-2xl font-bold">{stats?.incidenciasAbiertas || 0}</p>
                <p className="text-xs text-muted-foreground">Abiertas</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen y Actividades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ocupación por edificio */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Ocupación General
            </CardTitle>
            <CardDescription>Estado actual de la residencia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Habitaciones ocupadas</span>
                <span className="font-medium">
                  {(stats?.totalHabitaciones || 0) - (stats?.habitacionesDisponibles || 0)} / {stats?.totalHabitaciones || 0}
                </span>
              </div>
              <Progress value={stats?.residenciaOcupacion || 0} />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">
                  {(stats?.totalHabitaciones || 0) - (stats?.habitacionesDisponibles || 0)}
                </p>
                <p className="text-xs text-green-700">Ocupadas</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <Home className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{stats?.habitacionesDisponibles || 0}</p>
                <p className="text-xs text-blue-700">Disponibles</p>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/student-housing/habitaciones">
                Ver todas las habitaciones
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Alertas y pendientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pendientes y Alertas
            </CardTitle>
            <CardDescription>Tareas que requieren atención</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/student-housing/aplicaciones"
              className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-sm">Aplicaciones pendientes</p>
                  <p className="text-xs text-muted-foreground">Requieren revisión</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-700">
                {stats?.aplicacionesPendientes || 0}
              </Badge>
            </Link>

            <Link
              href="/student-housing/pagos"
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-sm">Pagos pendientes</p>
                  <p className="text-xs text-muted-foreground">Requieren cobro</p>
                </div>
              </div>
              <Badge className="bg-red-100 text-red-700">
                {stats?.pagosPendientes || 0}
              </Badge>
            </Link>

            <Link
              href="/student-housing/mantenimiento"
              className="flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Wrench className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-sm">Incidencias abiertas</p>
                  <p className="text-xs text-muted-foreground">En espera de resolución</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-700">
                {stats?.incidenciasAbiertas || 0}
              </Badge>
            </Link>

            <Link
              href="/student-housing/actividades"
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Actividades próximas</p>
                  <p className="text-xs text-muted-foreground">Eventos programados</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700">
                {stats?.actividadesProximas || 0}
              </Badge>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/student-housing/residentes">
                <Users className="h-6 w-6 mb-2" />
                <span>Residentes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/student-housing/habitaciones">
                <Home className="h-6 w-6 mb-2" />
                <span>Habitaciones</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/student-housing/pagos">
                <DollarSign className="h-6 w-6 mb-2" />
                <span>Pagos</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col" asChild>
              <Link href="/student-housing/actividades">
                <Calendar className="h-6 w-6 mb-2" />
                <span>Actividades</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
