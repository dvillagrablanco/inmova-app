'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Megaphone,
  BarChart3,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Stats {
  proyectosActivos: number;
  totalVentas: number;
  unidadesVendidas: number;
  margenPromedio: number;
  leadsActivos: number;
  conversionRate: number;
}

export default function RealEstateDeveloperDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/real-estate-developer/stats');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error cargando estadísticas');
      }
      
      setStats(result.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      setError(err.message);
      setStats({
        proyectosActivos: 0,
        totalVentas: 0,
        unidadesVendidas: 0,
        margenPromedio: 0,
        leadsActivos: 0,
        conversionRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
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
          <h1 className="text-3xl font-bold">Dashboard Promotora</h1>
          <p className="text-muted-foreground">Gestión de promociones inmobiliarias</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/real-estate-developer/sales">
              <DollarSign className="h-4 w-4 mr-2" />
              Ver Ventas
            </Link>
          </Button>
          <Button asChild>
            <Link href="/real-estate-developer/projects">
              <Building2 className="h-4 w-4 mr-2" />
              Gestionar Proyectos
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
                <p className="text-sm text-muted-foreground">Proyectos Activos</p>
                <p className="text-2xl font-bold">{stats?.proyectosActivos || 0}</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  En construcción
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unidades Vendidas</p>
                <p className="text-2xl font-bold">{stats?.unidadesVendidas || 0}</p>
                <p className="text-xs text-muted-foreground">Total histórico</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Activos</p>
                <p className="text-2xl font-bold">{stats?.leadsActivos || 0}</p>
                <p className="text-xs text-muted-foreground">En pipeline</p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa Conversión</p>
                <p className="text-2xl font-bold">{stats?.conversionRate || 0}%</p>
                <p className="text-xs text-muted-foreground">Lead a venta</p>
              </div>
              <Target className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumen y acciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rendimiento Comercial
            </CardTitle>
            <CardDescription>Métricas de ventas y marketing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Margen Promedio</span>
                <span className="font-medium">{stats?.margenPromedio || 0}%</span>
              </div>
              <Progress value={stats?.margenPromedio || 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conversión de Leads</span>
                <span className="font-medium">{stats?.conversionRate || 0}%</span>
              </div>
              <Progress value={stats?.conversionRate || 0} className="h-2" />
            </div>

            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/real-estate-developer/sales">
                Ver análisis detallado
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/real-estate-developer/projects">
                  <Building2 className="h-6 w-6 mb-2" />
                  <span>Proyectos</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/real-estate-developer/sales">
                  <DollarSign className="h-6 w-6 mb-2" />
                  <span>Ventas</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/real-estate-developer/marketing">
                  <Megaphone className="h-6 w-6 mb-2" />
                  <span>Marketing</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/real-estate-developer/commercial">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Comerciales</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
