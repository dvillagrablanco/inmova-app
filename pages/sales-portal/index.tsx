import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Euro, Target, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardData {
  salesRep: {
    id: string;
    nombreCompleto: string;
    email: string;
    codigoReferido: string;
    totalLeadsGenerados: number;
    totalConversiones: number;
    tasaConversion: number;
    totalComisionGenerada: number;
  };
  estadisticas: {
    leadsEsteMes: number;
    conversionesEsteMes: number;
    comisionesPendientes: number;
    comisionesPagadasMes: number;
    leadsSeguimiento: number;
  };
  objetivoActual: {
    periodo: string;
    objetivoLeads: number;
    objetivoConversiones: number;
    leadsGenerados: number;
    conversionesLogradas: number;
    porcentajeLeads: number;
    porcentajeConversiones: number;
    cumplido: boolean;
  } | null;
}

export default function SalesPortalDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salesRepId, setSalesRepId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // Aquí deberías implementar lógica para obtener el ID del comercial logueado
    // Por ahora, asumimos que está en la sesión o en localStorage
    const repId = localStorage.getItem('salesRepId');
    if (repId) {
      setSalesRepId(repId);
      loadDashboard(repId);
    } else {
      router.push('/login');
    }
  }, [session, status, router]);

  const loadDashboard = async (repId: string) => {
    try {
      const response = await fetch(`/api/sales-team/representatives/${repId}/dashboard`);
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Error cargando datos</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Portal Comercial - INMOVA</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hola, {dashboard.salesRep.nombreCompleto}
            </h1>
            <p className="text-gray-600">
              Código de Referido: <code className="bg-gray-200 px-2 py-1 rounded text-sm">{dashboard.salesRep.codigoReferido}</code>
            </p>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Leads Este Mes</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{dashboard.estadisticas.leadsEsteMes}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {dashboard.salesRep.totalLeadsGenerados}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Conversiones Este Mes</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{dashboard.estadisticas.conversionesEsteMes}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Tasa de conversión: {dashboard.salesRep.tasaConversion.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Comisiones Pendientes</CardTitle>
                <Euro className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                    dashboard.estadisticas.comisionesPendientes
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Pagado Este Mes</CardTitle>
                <Euro className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                    dashboard.estadisticas.comisionesPagadasMes
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total histórico: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                    dashboard.salesRep.totalComisionGenerada
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Objetivo del mes */}
          {dashboard.objetivoActual && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Objetivo del Mes - {dashboard.objetivoActual.periodo}</span>
                  {dashboard.objetivoActual.cumplido && (
                    <span className="text-green-600 text-sm font-normal">✅ ¡Objetivo Cumplido!</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Leads</span>
                      <span className="text-sm text-gray-600">
                        {dashboard.objetivoActual.leadsGenerados} / {dashboard.objetivoActual.objetivoLeads}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(dashboard.objetivoActual.porcentajeLeads, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {dashboard.objetivoActual.porcentajeLeads.toFixed(0)}% completado
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Conversiones</span>
                      <span className="text-sm text-gray-600">
                        {dashboard.objetivoActual.conversionesLogradas} / {dashboard.objetivoActual.objetivoConversiones}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(dashboard.objetivoActual.porcentajeConversiones, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {dashboard.objetivoActual.porcentajeConversiones.toFixed(0)}% completado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Nuevo Lead</span>
                  <Plus className="h-5 w-5 text-blue-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Registra un nuevo lead captado
                </p>
                <Link href="/sales-portal/leads/new">
                  <Button className="w-full">
                    Agregar Lead
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Mis Leads</span>
                  <Eye className="h-5 w-5 text-purple-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Ver y gestionar tus leads
                </p>
                <Link href="/sales-portal/leads">
                  <Button className="w-full" variant="outline">
                    Ver Leads
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Mis Comisiones</span>
                  <Euro className="h-5 w-5 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Ver historial de comisiones
                </p>
                <Link href="/sales-portal/commissions">
                  <Button className="w-full" variant="outline">
                    Ver Comisiones
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Alertas */}
          {dashboard.estadisticas.leadsSeguimiento > 0 && (
            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Target className="h-6 w-6 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Tienes {dashboard.estadisticas.leadsSeguimiento} leads pendientes de seguimiento
                    </h3>
                    <p className="text-sm text-gray-600">
                      Estos leads requieren tu atención en los próximos 7 días
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
