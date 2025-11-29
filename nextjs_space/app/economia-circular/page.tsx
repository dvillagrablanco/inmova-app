'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Recycle, Leaf, ShoppingBag, Sprout } from 'lucide-react';

export default function EconomiaCircularPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div>Cargando...</div></div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbLink href="/"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>Economía Circular</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <h1 className="mt-2 text-3xl font-bold">Economía Circular y Sostenibilidad</h1>
            </div>
            <Button variant="outline" onClick={() => router.push('/')}><ArrowLeft className="mr-2 h-4 w-4" />Volver</Button>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Items Circulares</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tasa Reciclaje</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0%</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">CO2 Ahorrado</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0 kg</div></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Jardines Urbanos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">0</div></CardContent></Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" />Marketplace Circular</CardTitle><CardDescription>Intercambio de muebles y electrodomésticos</CardDescription></CardHeader>
              <CardContent><Button className="w-full">Ver Marketplace</Button></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Sprout className="h-5 w-5" />Huertos Urbanos</CardTitle><CardDescription>Parcelas compartidas en azoteas</CardDescription></CardHeader>
              <CardContent><Button className="w-full" variant="outline">Reservar Parcela</Button></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Recycle className="h-5 w-5" />Gestión Residuos</CardTitle><CardDescription>Métricas y gamificación del reciclaje</CardDescription></CardHeader>
              <CardContent><Button className="w-full" variant="outline">Ver Estadísticas</Button></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5" />Certificación Circular</CardTitle><CardDescription>EU Ecolabel y tasa de circularidad</CardDescription></CardHeader>
              <CardContent><Badge>EN DESARROLLO</Badge></CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
