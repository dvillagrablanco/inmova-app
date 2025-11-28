'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';
import { ArrowLeft, Home, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function ContabilidadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ ingresos: 0, gastos: 0, balance: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchData();
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/accounting/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
        
        const ingresos = data.filter((t: any) => t.tipo === 'ingreso').reduce((sum: number, t: any) => sum + t.monto, 0);
        const gastos = data.filter((t: any) => t.tipo === 'gasto').reduce((sum: number, t: any) => sum + t.monto, 0);
        setStats({ ingresos, gastos, balance: ingresos - gastos });
      }
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      const res = await fetch('/api/accounting/sync', { method: 'POST' });
      if (res.ok) {
        toast.success('Sincronización completada');
        fetchData();
      }
    } catch (error) {
      toast.error('Error al sincronizar');
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex h-screen items-center justify-center"><div className="text-lg">Cargando...</div></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Contabilidad</h1>
                <Breadcrumb className="mt-2">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>Contabilidad</BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => router.push('/dashboard')} variant="outline" className="w-full sm:w-auto">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <Button onClick={handleSync} className="w-full sm:w-auto">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sincronizar
                </Button>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">€{stats.ingresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">€{stats.gastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Balance Neto</CardTitle>
                <DollarSign className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{stats.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transacciones Recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Transacciones Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions.slice(0, 10).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between border-b py-2 last:border-0">
                    <div>
                      <div className="font-medium">{t.concepto}</div>
                      <div className="text-sm text-muted-foreground">{format(new Date(t.fecha), 'dd/MM/yyyy')}</div>
                    </div>
                    <div className={`font-bold ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.tipo === 'ingreso' ? '+' : '-'}€{t.monto.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay transacciones. Haz clic en "Sincronizar" para importar datos de pagos y gastos.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
