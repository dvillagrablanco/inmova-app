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
import { Home, ArrowLeft, ClipboardList, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface WorkOrder {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  estado: string;
  prioridad: string;
  provider: { nombre: string };
  building: { nombre: string };
  unit?: { numero: string };
  fechaAsignacion: string;
  fechaEstimada?: string;
  costoTotal?: number;
}

export default function OrdenesTrabajoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ordenes, setOrdenes] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/ordenes-trabajo');
      const data = await res.json();
      setOrdenes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error:', error);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  const asignadas = ordenes.filter((o) => o.estado === 'asignada').length;
  const enProceso = ordenes.filter((o) => o.estado === 'en_progreso').length;
  const completadas = ordenes.filter((o) => o.estado === 'completada').length;

  if (loading || !session?.user) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6 lg:p-8">
           <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard')} className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard"><Home className="w-4 h-4" /></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Órdenes de Trabajo</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Órdenes de Trabajo</h1>
            <p className="text-gray-600">Gestiona trabajos asignados a proveedores</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ordenes.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Asignadas</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{asignadas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{enProceso}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completadas}</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {ordenes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-gray-500">No hay órdenes de trabajo</p>
                </CardContent>
              </Card>
            ) : (
              ordenes.map((orden) => (
                <Card key={orden.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{orden.titulo}</h3>
                        <p className="text-gray-600 mb-3">{orden.descripcion}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <Badge variant="outline">{orden.provider.nombre}</Badge>
                          <Badge variant="outline">{orden.building.nombre}</Badge>
                          {orden.unit && <Badge variant="outline">Unidad {orden.unit.numero}</Badge>}
                          <Badge className="capitalize" variant="secondary">{orden.estado.replace('_', ' ')}</Badge>
                          <Badge className="capitalize" variant="outline">{orden.tipo}</Badge>
                        </div>
                      </div>
                      {orden.costoTotal && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Costo</p>
                          <p className="text-xl font-bold">{orden.costoTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
           </div>
        </main>
      </div>
    </div>
  );
}
