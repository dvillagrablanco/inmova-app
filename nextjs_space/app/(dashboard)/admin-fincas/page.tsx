'use client';

import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';

import { useSession } from 'next-auth/react';
import logger from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, FileText, Euro, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface DashboardKPIs {
  totalCommunities: number;
  pendingInvoices: number;
  ingresosMes: number;
  ingresosMesAnterior: number;
  saldoTotal: number;
  vencidas: number;
  informesGenerados: number;
  totalInformes: number;
}

export default function AdminFincasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin-fincas/dashboard');
      if (res.ok) {
        const data = await res.json();
        setKpis(data.kpis);
      }
    } catch (error) {
      logger.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const variacionIngresos = kpis && kpis.ingresosMesAnterior > 0
    ? ((kpis.ingresosMes - kpis.ingresosMesAnterior) / kpis.ingresosMesAnterior) * 100
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portal Administrador de Fincas</h1>
          <p className="text-muted-foreground mt-1">
            Gestión integral de comunidades de propietarios
          </p>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comunidades Activas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalCommunities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total de comunidades gestionadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas Pendientes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.pendingInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {kpis?.vencidas || 0} facturas vencidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Este Mes</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
              }).format(kpis?.ingresosMes || 0)}
            </div>
            <div className="flex items-center text-xs">
              {variacionIngresos > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-green-600">+{variacionIngresos.toFixed(1)}%</span>
                </>
              ) : variacionIngresos < 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-red-600 mr-1 rotate-180" />
                  <span className="text-red-600">{variacionIngresos.toFixed(1)}%</span>
                </>
              ) : (
                <span className="text-muted-foreground">Sin cambios</span>
              )}
              <span className="text-muted-foreground ml-1">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: 'EUR',
              }).format(kpis?.saldoTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Saldo acumulado de todas las comunidades
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Informes Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informes Trimestrales/Anuales</CardTitle>
          <CardDescription>
            Estado de generación de informes del período actual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {kpis?.informesGenerados === kpis?.totalInformes ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium">
                    {kpis?.informesGenerados || 0} de {kpis?.totalInformes || 0} informes generados
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {kpis?.totalInformes && kpis.totalInformes > 0
                      ? `${Math.round(((kpis.informesGenerados || 0) / kpis.totalInformes) * 100)}% completado`
                      : 'No hay comunidades registradas'}
                  </p>
                </div>
              </div>
              <Link href="/admin-fincas/informes">
                <Button variant="outline">Ver Informes</Button>
              </Link>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{
                  width: kpis?.totalInformes
                    ? `${((kpis.informesGenerados || 0) / kpis.totalInformes) * 100}%`
                    : '0%',
                }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin-fincas/comunidades" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Comunidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gestiona las comunidades de propietarios
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin-fincas/facturas" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Facturación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Honorarios y gastos por comunidad
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin-fincas/libro-caja" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Libro de Caja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Movimientos e ingresos/gastos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin-fincas/informes" className="block">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Informes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Informes trimestrales y anuales
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
      </div>
        </main>
      </div>
    </div>
  );
}
