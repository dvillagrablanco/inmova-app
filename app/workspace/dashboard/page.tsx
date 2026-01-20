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
  TrendingUp,
  Monitor,
  Briefcase,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Stats {
  totalEspacios: number;
  espaciosOcupados: number;
  ocupacion: number;
  miembrosActivos: number;
  reservasHoy: number;
  ingresosMes: number;
}

export default function WorkspaceDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workspace/stats');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando estadísticas');
      }
      
      setStats(result.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
      // Fallback a valores por defecto
      setStats({
        totalEspacios: 0,
        espaciosOcupados: 0,
        ocupacion: 0,
        miembrosActivos: 0,
        reservasHoy: 0,
        ingresosMes: 0,
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
          <h1 className="text-3xl font-bold">Dashboard Coworking</h1>
          <p className="text-muted-foreground">Gestión de espacios de trabajo compartido</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/workspace/booking">
              <Calendar className="h-4 w-4 mr-2" />
              Ver Reservas
            </Link>
          </Button>
          <Button asChild>
            <Link href="/workspace/members">
              <Users className="h-4 w-4 mr-2" />
              Gestionar Miembros
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
                <p className="text-sm text-muted-foreground">Espacios Totales</p>
                <p className="text-2xl font-bold">{stats?.totalEspacios || 0}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {stats?.espaciosOcupados || 0} ocupados
                </p>
              </div>
              <Monitor className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ocupación</p>
                <p className="text-2xl font-bold">{stats?.ocupacion || 0}%</p>
                <Progress value={stats?.ocupacion || 0} className="mt-2 h-2" />
              </div>
              <Building className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Miembros Activos</p>
                <p className="text-2xl font-bold">{stats?.miembrosActivos || 0}</p>
                <p className="text-xs text-muted-foreground">En el sistema</p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ingresos del Mes</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(stats?.ingresosMes || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats?.reservasHoy || 0} reservas hoy
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Actividad de Hoy
            </CardTitle>
            <CardDescription>Resumen de reservas del día</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium">Reservas Activas</p>
                  <p className="text-sm text-muted-foreground">Para hoy</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700 text-lg px-3">
                {stats?.reservasHoy || 0}
              </Badge>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <Link href="/workspace/booking">
                Ver calendario completo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/workspace/coworking">
                  <Monitor className="h-6 w-6 mb-2" />
                  <span>Espacios</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/workspace/booking">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span>Reservas</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/workspace/members">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Miembros</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/configuracion">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Tarifas</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
