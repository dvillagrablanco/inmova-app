'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DoorOpen, Plus, Edit, Users, Euro } from 'lucide-react';
import { logError } from '@/lib/logger';

export default function UnitRoomsPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [unit, setUnit] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (params?.unitId && session) {
      Promise.all([
        fetch(`/api/units/${params.unitId}`),
        fetch(`/api/units/${params.unitId}/rooms`)
      ])
        .then(([unitRes, roomsRes]) => Promise.all([unitRes.json(), roomsRes.json()]))
        .then(([unitData, roomsData]) => {
          setUnit(unitData);
          setRooms(roomsData);
        })
        .catch((error) => {
          logError(error, { context: 'loadRoomData', unitId: params.unitId });
          toast.error('Error al cargar datos');
        })
        .finally(() => setLoading(false));
    }
  }, [params, session]);

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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Habitaciones por Habitación</h1>
              <p className="text-muted-foreground">
                {unit?.building?.nombre} - Unidad {unit?.numero}
              </p>
            </div>
            <Button onClick={() => router.push(`/room-rental/${params.unitId}/nueva-habitacion`)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Habitación
            </Button>
          </div>

          {rooms.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <DoorOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay habitaciones</h3>
                <p className="text-muted-foreground">Crea la primera habitación para esta unidad</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room: any) => (
                <Card key={room.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{room.nombre || `Habitación ${room.numero}`}</CardTitle>
                      <Badge variant={room.ocupada ? 'default' : 'secondary'}>
                        {room.ocupada ? 'Ocupada' : 'Disponible'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo:</span>
                        <span className="font-medium">{room.tipoHabitacion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Superficie:</span>
                        <span className="font-medium">{room.superficie}m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Renta:</span>
                        <span className="font-bold text-green-600">€{room.rentaMensual}</span>
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
