'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  ArrowLeft,
  Euro,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  CheckCircle,
  PieChart,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  finanzas: {
    cuotasPendientes: number;
    importePendiente: number;
    cuotasCobradas30d: number;
    importeCobrado30d: number;
    totalRecaudadoAnual: number;
    unidadesMorosas: number;
    fondosDisponibles: number;
    totalFondos: number;
  };
  graficos: {
    evolucionRecaudacion: { mes: string; recaudado: number }[];
  };
}

export default function FinanzasPage() {
  const router = useRouter();

  const handleInformeMorosos = () => {
    toast.info('Informe de morosos en preparación');
  };

  const handleExportarBalance = () => {
    toast.success('Balance exportado');
  };
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('anual');

  const comunidadId = searchParams.get('comunidadId');
  const buildingId = searchParams.get('buildingId');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchDashboard();
    }
  }, [status, router, comunidadId, buildingId]);

  const fetchDashboard = async () => {
    try {
      const params = new URLSearchParams();
      if (comunidadId) params.append('comunidadId', comunidadId);
      if (buildingId) params.append('buildingId', buildingId);

      const res = await fetch(`/api/comunidades/dashboard?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  const finanzas = data?.finanzas || {
    cuotasPendientes: 0,
    importePendiente: 0,
    cuotasCobradas30d: 0,
    importeCobrado30d: 0,
    totalRecaudadoAnual: 0,
    unidadesMorosas: 0,
    fondosDisponibles: 0,
    totalFondos: 0,
  };

  const tasaCobro = finanzas.cuotasCobradas30d + finanzas.cuotasPendientes > 0
    ? Math.round((finanzas.cuotasCobradas30d / (finanzas.cuotasCobradas30d + finanzas.cuotasPendientes)) * 100)
    : 100;

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Finanzas de la Comunidad</h1>
            <p className="text-muted-foreground">
              Cash flow, recaudación e impagos
            </p>
          </div>
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mensual">Mensual</SelectItem>
              <SelectItem value="trimestral">Trimestral</SelectItem>
              <SelectItem value="anual">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {finanzas.totalRecaudadoAnual.toLocaleString('es-ES')}€
              </div>
              <p className="text-xs text-muted-foreground">Este año</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
              <AlertCircle className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {finanzas.importePendiente.toLocaleString('es-ES')}€
              </div>
              <p className="text-xs text-muted-foreground">{finanzas.cuotasPendientes} cuotas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Fondos Disponibles</CardTitle>
              <Wallet className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {finanzas.fondosDisponibles.toLocaleString('es-ES')}€
              </div>
              <p className="text-xs text-muted-foreground">{finanzas.totalFondos} fondos activos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Cobro</CardTitle>
              <PieChart className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{tasaCobro}%</div>
              <Progress value={tasaCobro} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Detalle de cobros últimos 30 días */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Últimos 30 días
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="font-medium">Cuotas Cobradas</div>
                    <div className="text-sm text-muted-foreground">
                      {finanzas.cuotasCobradas30d} cuotas
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  +{finanzas.importeCobrado30d.toLocaleString('es-ES')}€
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <div className="font-medium">Cuotas Pendientes</div>
                    <div className="text-sm text-muted-foreground">
                      {finanzas.cuotasPendientes} cuotas
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {finanzas.importePendiente.toLocaleString('es-ES')}€
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estado de Morosidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-6xl font-bold text-red-600">{finanzas.unidadesMorosas}</div>
                <p className="text-muted-foreground mt-2">Unidades con cuotas pendientes</p>
              </div>

              {finanzas.unidadesMorosas > 0 ? (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800">Atención requerida</div>
                      <p className="text-sm text-yellow-700">
                        Hay unidades con cuotas pendientes de pago. Se recomienda iniciar
                        proceso de reclamación.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800">Sin morosidad</div>
                      <p className="text-sm text-green-700">
                        Todas las unidades están al día con sus pagos.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Evolución de recaudación */}
        <Card>
          <CardHeader>
            <CardTitle>Evolución de Recaudación</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.graficos?.evolucionRecaudacion && data.graficos.evolucionRecaudacion.length > 0 ? (
              <div className="space-y-3">
                {data.graficos.evolucionRecaudacion.map((mes, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-muted-foreground">{mes.mes}</div>
                    <div className="flex-1">
                      <div className="h-6 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              (mes.recaudado /
                                Math.max(...data.graficos.evolucionRecaudacion.map((m) => m.recaudado), 1)) *
                                100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right font-medium">
                      {mes.recaudado.toLocaleString('es-ES')}€
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de recaudación disponibles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => router.push('/comunidades/cuotas')}>
              <Euro className="w-4 h-4 mr-2" />
              Gestionar Cuotas
            </Button>
            <Button variant="outline" onClick={() => router.push('/comunidades/fondos')}>
              <Wallet className="w-4 h-4 mr-2" />
              Ver Fondos
            </Button>
            <Button variant="outline" onClick={handleInformeMorosos}>
              <TrendingDown className="w-4 h-4 mr-2" />
              Informe de Morosos
            </Button>
            <Button variant="outline" onClick={handleExportarBalance}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Exportar Balance
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
