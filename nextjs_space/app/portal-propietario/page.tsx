'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Building2, Euro, TrendingUp, AlertCircle, FileText, Calendar } from 'lucide-react';

export default function PortalPropietarioPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    else if (status === 'authenticated') fetchData();
  }, [status]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [buildingsRes, unitsRes, contractsRes, paymentsRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/units'),
        fetch('/api/contracts'),
        fetch('/api/payments'),
      ]);
      if (buildingsRes.ok) setBuildings(await buildingsRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
      if (contractsRes.ok) setContracts(await contractsRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPropiedades = buildings.length + units.length;
  const unidadesOcupadas = units.filter((u) => u.estado === 'ocupada').length;
  const ingresosMensual = payments
    .filter((p) => p.status === 'pagado')
    .reduce((sum, p) => sum + p.monto, 0);
  const contratosActivos = contracts.filter((c) => c.status === 'activo').length;

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>Portal Propietario</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />Volver
              </Button>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Portal del Propietario</h1>
              <p className="text-muted-foreground">Resumen de inversiones y rentabilidad</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Propiedades</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPropiedades}</div>
                  <p className="text-xs text-muted-foreground">{unidadesOcupadas} ocupadas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Mes</CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">€{ingresosMensual.toLocaleString()}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contratos Activos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{contratosActivos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tasa Ocupación</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {units.length > 0 ? Math.round((unidadesOcupadas / units.length) * 100) : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Funcionalidades del Portal</CardTitle>
                <CardDescription>Vista completa para propietarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <Building2 className="h-6 w-6 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold">Dashboard de Propiedades</h3>
                      <p className="text-sm text-muted-foreground">
                        Visión completa de todas tus propiedades, ocupación y rendimiento
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <Euro className="h-6 w-6 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold">Resumen Financiero</h3>
                      <p className="text-sm text-muted-foreground">
                        Ingresos, gastos, ROI y análisis de rentabilidad por propiedad
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <FileText className="h-6 w-6 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold">Documentación</h3>
                      <p className="text-sm text-muted-foreground">
                        Acceso a contratos, recibos, certificados y documentos legales
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                    <Calendar className="h-6 w-4 mt-1 text-primary" />
                    <div>
                      <h3 className="font-semibold">Notificaciones y Alertas</h3>
                      <p className="text-sm text-muted-foreground">
                        Vencimientos de contratos, pagos pendientes, mantenimientos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
