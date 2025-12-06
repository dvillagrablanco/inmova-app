import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, Euro, Target, ArrowRight, CheckCircle, Clock } from 'lucide-react';

interface DashboardData {
  resumen: {
    comercialesActivos: number;
    totalLeads: number;
    leadsConvertidos: number;
    tasaConversionGlobal: number;
    comisionesPendientes: {
      cantidad: number;
      monto: number;
    };
    comisionesPagadas: number;
  };
  topComerciales: Array<{
    id: string;
    nombreCompleto: string;
    totalLeadsGenerados: number;
    totalConversiones: number;
    tasaConversion: number;
    totalComisionGenerada: number;
  }>;
}

export default function SalesTeamDashboard() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user?.role !== 'super_admin' && session?.user?.role !== 'administrador') {
      router.push('/dashboard');
      return;
    }

    loadDashboard();
  }, [session, status, router]);

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/sales-team/dashboard');
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
        <title>Equipo Comercial Externo - INMOVA</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Equipo Comercial Externo</h1>
            <p className="text-gray-600">
              Gestión de comerciales autónomos, leads, comisiones y objetivos
            </p>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Comerciales Activos</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{dashboard.resumen.comercialesActivos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Tasa de Conversión</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {dashboard.resumen.tasaConversionGlobal.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboard.resumen.leadsConvertidos} de {dashboard.resumen.totalLeads} leads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Comisiones Pendientes</CardTitle>
                <Clock className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                    dashboard.resumen.comisionesPendientes.monto
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {dashboard.resumen.comisionesPendientes.cantidad} comisiones
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Comisiones Pagadas</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                    dashboard.resumen.comisionesPagadas
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Comerciales</span>
                  <Users className="h-5 w-5 text-blue-600" />
                </CardTitle>
                <CardDescription>Gestionar equipo comercial externo</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/sales-team/representatives">
                  <Button className="w-full" variant="outline">
                    Ver Comerciales <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Leads</span>
                  <Target className="h-5 w-5 text-purple-600" />
                </CardTitle>
                <CardDescription>Gestionar leads captados</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/sales-team/leads">
                  <Button className="w-full" variant="outline">
                    Ver Leads <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Comisiones</span>
                  <Euro className="h-5 w-5 text-green-600" />
                </CardTitle>
                <CardDescription>Gestionar comisiones y pagos</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/sales-team/commissions">
                  <Button className="w-full" variant="outline">
                    Ver Comisiones <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Top Comerciales */}
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Comerciales</CardTitle>
              <CardDescription>Comerciales con mejor rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Comercial</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Leads</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Conversiones</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Tasa</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Comisiones</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.topComerciales.map((comercial, index) => (
                      <tr key={comercial.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                            </div>
                            <span className="font-medium text-gray-900">{comercial.nombreCompleto}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 px-4 text-gray-700">{comercial.totalLeadsGenerados}</td>
                        <td className="text-center py-3 px-4 text-gray-700">{comercial.totalConversiones}</td>
                        <td className="text-center py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {comercial.tasaConversion.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 px-4 font-semibold text-gray-900">
                          {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(
                            comercial.totalComisionGenerada
                          )}
                        </td>
                        <td className="text-center py-3 px-4">
                          <Link href={`/admin/sales-team/representatives/${comercial.id}`}>
                            <Button size="sm" variant="ghost">
                              Ver
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
