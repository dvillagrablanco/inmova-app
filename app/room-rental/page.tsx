'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building, Plus, Bed } from 'lucide-react';

export default function RoomRentalPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/units/room-rental')
        .then((res) => res.json())
        .then(setUnits)
        .catch(() => toast.error('Error al cargar unidades'))
        .finally(() => setLoading(false));
    }
  }, [session]);

  if (loading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">Cargando...</div>
        </main>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Alquiler por Habitaciones</h1>
            <Button onClick={() => router.push('/room-rental/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Unidad
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <Card key={unit.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push(`/room-rental/${unit.id}`)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {unit.building?.nombre || 'Sin nombre'} - {unit.numero}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{unit.rooms?.length || 0} habitaciones</span>
                    </div>
                    <Badge variant={unit.active ? 'default' : 'secondary'}>
                      {unit.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {units.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No hay unidades configuradas para alquiler por habitaciones</p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/room-rental/new')}>
                  Crear primera unidad
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
