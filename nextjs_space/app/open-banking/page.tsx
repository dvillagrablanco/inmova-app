'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Building2, CreditCard, Home, ArrowLeft, RefreshCw, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function OpenBankingPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [conexiones, setConexiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) cargarConexiones();
  }, [session]);

  const cargarConexiones = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/open-banking/connections');
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      setConexiones(data);
    } catch (error) {
      toast.error('Error al cargar conexiones');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden ml-0 lg:ml-64">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="gap-2 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Open Banking</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="mt-2 text-2xl font-bold md:text-3xl">🏦 Open Banking</h1>
            <p className="text-muted-foreground">
              <Badge variant="outline" className="mr-2">MODO DEMO</Badge>
              Verificación automática de ingresos y conciliación bancaria
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Conexiones Activas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conexiones.filter(c => c.estado === 'conectado').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Transacciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{conexiones.reduce((acc, c) => acc + (c.transactions?.length || 0), 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Modo Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Funcionalidad de demostración
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {conexiones.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No hay conexiones bancarias</p>
                </CardContent>
              </Card>
            ) : (
              conexiones.map((conn) => (
                <Card key={conn.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{conn.nombreBanco}</h3>
                          <p className="text-sm text-muted-foreground">
                            {conn.tipoCuenta} - ****{conn.ultimosDigitos}
                          </p>
                          <div className="mt-2">
                            <Badge variant={conn.estado === 'conectado' ? 'default' : 'secondary'}>
                              {conn.estado}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {conn.transactions?.length || 0} transacciones
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-950/30">
            <p className="text-sm">
              <strong>💡 Modo Demo:</strong> Las conexiones bancarias son simuladas. 
              En producción, integrar con Plaid o Tink para verificación real de ingresos.
            </p>
          </div>
                  </div>
        </main>
      </div>
    </div>
  );
}
