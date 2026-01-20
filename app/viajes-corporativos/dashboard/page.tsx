'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plane,
  Hotel,
  Users,
  Receipt,
  TrendingDown,
  Calendar,
  ArrowRight,
  AlertTriangle,
  DollarSign,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Stats {
  reservasActivas: number;
  reservasMes: number;
  gastoMensual: number;
  presupuestoMes: number;
  ahorroPorPoliticas: number;
  viajerosActivos: number;
  gastosPendientes: number;
}

export default function ViajesCorporativosDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/viajes-corporativos/stats');
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
        reservasActivas: 0,
        reservasMes: 0,
        gastoMensual: 0,
        presupuestoMes: 50000,
        ahorroPorPoliticas: 0,
        viajerosActivos: 0,
        gastosPendientes: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const presupuestoUsado = stats?.presupuestoMes 
    ? Math.round((stats.gastoMensual / stats.presupuestoMes) * 100) 
    : 0;

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
          <h1 className="text-3xl font-bold">Dashboard Viajes Corporativos</h1>
          <p className="text-muted-foreground">Gestión centralizada de viajes de empresa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/viajes-corporativos/expense-reports">
              <Receipt className="h-4 w-4 mr-2" />
              Ver Gastos
            </Link>
          </Button>
          <Button asChild>
            <Link href="/viajes-corporativos/bookings">
              <Plane className="h-4 w-4 mr-2" />
              Nueva Reserva
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
                <p className="text-sm text-muted-foreground">Reservas Activas</p>
                <p className="text-2xl font-bold">{stats?.reservasActivas || 0}</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.reservasMes || 0} este mes
                </p>
              </div>
              <Hotel className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gasto Mensual</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats?.gastoMensual || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  de {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats?.presupuestoMes || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ahorro Políticas</p>
                <p className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats?.ahorroPorPoliticas || 0)}
                </p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  Este mes
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Viajeros Activos</p>
                <p className="text-2xl font-bold">{stats?.viajerosActivos || 0}</p>
                <p className="text-xs text-muted-foreground">Empleados registrados</p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Presupuesto y alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Presupuesto Mensual
            </CardTitle>
            <CardDescription>Control de gasto en viajes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Consumido</span>
                <span className="font-medium">{presupuestoUsado}%</span>
              </div>
              <Progress 
                value={presupuestoUsado} 
                className={`h-3 ${presupuestoUsado > 80 ? 'bg-red-100' : ''}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format((stats?.presupuestoMes || 0) - (stats?.gastoMensual || 0))}
                </p>
                <p className="text-xs text-green-700">Disponible</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <p className="text-xl font-bold text-blue-600">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(stats?.gastoMensual || 0)}
                </p>
                <p className="text-xs text-blue-700">Gastado</p>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/viajes-corporativos/expense-reports">
                Ver desglose completo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/viajes-corporativos/bookings">
                  <Plane className="h-6 w-6 mb-2" />
                  <span>Reservas</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/viajes-corporativos/guests">
                  <Users className="h-6 w-6 mb-2" />
                  <span>Viajeros</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/viajes-corporativos/expense-reports">
                  <Receipt className="h-6 w-6 mb-2" />
                  <span>Gastos</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                <Link href="/viajes-corporativos/policies">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Políticas</span>
                </Link>
              </Button>
            </div>

            {(stats?.gastosPendientes || 0) > 0 && (
              <Link
                href="/viajes-corporativos/expense-reports?estado=pendiente"
                className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors mt-4"
              >
                <div className="flex items-center gap-3">
                  <Receipt className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-sm">Gastos pendientes</p>
                    <p className="text-xs text-muted-foreground">Requieren aprobación</p>
                  </div>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700">
                  {stats?.gastosPendientes || 0}
                </Badge>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
