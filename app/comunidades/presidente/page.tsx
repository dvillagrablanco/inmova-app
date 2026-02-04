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
  Crown,
  ArrowLeft,
  Euro,
  Users,
  FileText,
  Vote,
  AlertTriangle,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Bell,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardPresidente {
  resumen: {
    comunidadesGestionadas: number;
    totalUnidades: number;
  };
  finanzas: {
    cuotasPendientes: number;
    importePendiente: number;
    fondosDisponibles: number;
    totalRecaudadoAnual: number;
    unidadesMorosas: number;
  };
  operativo: {
    incidenciasAbiertas: number;
    incidenciasUrgentes: number;
    votacionesActivas: number;
    actasPendientes: number;
  };
  calendario: {
    reunionesProximas: {
      id: string;
      titulo: string;
      fecha: string;
      tipo: string;
    }[];
  };
}

export default function PresidentePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardPresidente | null>(null);
  const [loading, setLoading] = useState(true);

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
      toast.error('Error al cargar el panel');
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
    fondosDisponibles: 0,
    totalRecaudadoAnual: 0,
    unidadesMorosas: 0,
  };

  const operativo = data?.operativo || {
    incidenciasAbiertas: 0,
    incidenciasUrgentes: 0,
    votacionesActivas: 0,
    actasPendientes: 0,
  };

  const calendario = data?.calendario || { reunionesProximas: [] };

  // Calcular estado general
  const alertas = [];
  if (operativo.incidenciasUrgentes > 0) {
    alertas.push({ tipo: 'urgente', mensaje: `${operativo.incidenciasUrgentes} incidencias urgentes` });
  }
  if (finanzas.unidadesMorosas > 0) {
    alertas.push({ tipo: 'warning', mensaje: `${finanzas.unidadesMorosas} unidades morosas` });
  }
  if (operativo.actasPendientes > 0) {
    alertas.push({ tipo: 'info', mensaje: `${operativo.actasPendientes} actas en borrador` });
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/comunidades')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Crown className="w-8 h-8 text-amber-500" />
              Portal del Presidente
            </h1>
            <p className="text-muted-foreground">
              Panel de control ejecutivo de la comunidad
            </p>
          </div>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="space-y-2">
            {alertas.map((alerta, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-4 rounded-lg ${
                  alerta.tipo === 'urgente'
                    ? 'bg-red-50 border border-red-200'
                    : alerta.tipo === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <Bell
                  className={`w-5 h-5 ${
                    alerta.tipo === 'urgente'
                      ? 'text-red-600'
                      : alerta.tipo === 'warning'
                      ? 'text-yellow-600'
                      : 'text-blue-600'
                  }`}
                />
                <span
                  className={`font-medium ${
                    alerta.tipo === 'urgente'
                      ? 'text-red-800'
                      : alerta.tipo === 'warning'
                      ? 'text-yellow-800'
                      : 'text-blue-800'
                  }`}
                >
                  {alerta.mensaje}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* KPIs Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recaudación Anual</CardTitle>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {finanzas.totalRecaudadoAnual.toLocaleString('es-ES')}€
              </div>
            </CardContent>
          </Card>

          <Card className={finanzas.importePendiente > 0 ? 'border-red-200' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendiente Cobro</CardTitle>
              <Euro className="w-4 h-4 text-red-500" />
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
              <Wallet className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {finanzas.fondosDisponibles.toLocaleString('es-ES')}€
              </div>
            </CardContent>
          </Card>

          <Card className={operativo.incidenciasUrgentes > 0 ? 'border-orange-200' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Incidencias Abiertas</CardTitle>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {operativo.incidenciasAbiertas}
              </div>
              <p className="text-xs text-muted-foreground">
                {operativo.incidenciasUrgentes > 0 && (
                  <span className="text-red-600">{operativo.incidenciasUrgentes} urgentes</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Próximas Reuniones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Próximas Reuniones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calendario.reunionesProximas.length > 0 ? (
                <div className="space-y-3">
                  {calendario.reunionesProximas.map((reunion) => (
                    <div
                      key={reunion.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{reunion.titulo}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(reunion.fecha), "EEEE d 'de' MMMM, HH:mm", {
                            locale: es,
                          })}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {reunion.tipo}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay reuniones programadas</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/comunidades/reuniones')}
                  >
                    Programar reunión
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estado Operativo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estado Operativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Vote className="w-5 h-5 text-purple-600" />
                  <span>Votaciones Activas</span>
                </div>
                <Badge className={operativo.votacionesActivas > 0 ? 'bg-purple-100 text-purple-800' : ''}>
                  {operativo.votacionesActivas}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Actas Pendientes</span>
                </div>
                <Badge className={operativo.actasPendientes > 0 ? 'bg-yellow-100 text-yellow-800' : ''}>
                  {operativo.actasPendientes}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-red-600" />
                  <span>Unidades Morosas</span>
                </div>
                <Badge className={finanzas.unidadesMorosas > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                  {finanzas.unidadesMorosas}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones del Presidente</CardTitle>
            <CardDescription>Gestiones frecuentes</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => router.push('/comunidades/reuniones')}>
              <Calendar className="w-4 h-4 mr-2" />
              Convocar Junta
            </Button>
            <Button variant="outline" onClick={() => router.push('/comunidades/votaciones')}>
              <Vote className="w-4 h-4 mr-2" />
              Nueva Votación
            </Button>
            <Button variant="outline" onClick={() => router.push('/comunidades/incidencias')}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Ver Incidencias
            </Button>
            <Button variant="outline" onClick={() => router.push('/comunidades/finanzas')}>
              <Euro className="w-4 h-4 mr-2" />
              Estado Financiero
            </Button>
            <Button variant="outline" onClick={() => router.push('/comunidades/actas')}>
              <FileText className="w-4 h-4 mr-2" />
              Aprobar Actas
            </Button>
          </CardContent>
        </Card>

        {/* Resumen de Responsabilidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Responsabilidades del Presidente
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Convocar y presidir las juntas de propietarios</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Representar a la comunidad legal y extrajudicialmente</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Visar las actas y certificados de acuerdos</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Ejecutar los acuerdos adoptados en junta</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Autorizar gastos urgentes de conservación</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Firmar contratos en nombre de la comunidad</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
