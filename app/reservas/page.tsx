'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Home, ArrowLeft, Calendar, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Reserva {
  id: string;
  titulo: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  space: { nombre: string };
  tenant: { nombreCompleto: string };
}

export default function ReservasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/reservas')
        .then((res) => res.ok ? res.json() : [])
        .then(setReservas)
        .catch(() => toast.error('Error al cargar reservas'))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </AuthenticatedLayout>
    );
  }

  if (!session) return null;

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Reservas</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Reservas</h1>
              <p className="text-muted-foreground">Gestiona las reservas de espacios comunes</p>
            </div>
            <Button onClick={() => router.push('/reservas/nueva')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Reserva
            </Button>
          </div>

          {reservas.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay reservas</h3>
                <p className="text-muted-foreground">Crea tu primera reserva</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {reservas.map((reserva) => (
                <Card key={reserva.id}>
                  <CardHeader>
                    <div className="flex justify-between">
                      <CardTitle>{reserva.titulo}</CardTitle>
                      <Badge>{reserva.estado}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Espacio</p>
                        <p className="font-medium">{reserva.space.nombre}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Inquilino</p>
                        <p className="font-medium">{reserva.tenant.nombreCompleto}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Inicio</p>
                        <p className="font-medium">{format(new Date(reserva.fechaInicio), 'dd MMM yyyy HH:mm', { locale: es })}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fin</p>
                        <p className="font-medium">{format(new Date(reserva.fechaFin), 'dd MMM yyyy HH:mm', { locale: es })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
