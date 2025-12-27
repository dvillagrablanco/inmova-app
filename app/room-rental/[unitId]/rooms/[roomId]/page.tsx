'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Bed, ArrowLeft, User, Calendar } from 'lucide-react';

export default function RoomDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (params?.roomId && session) {
      fetch(`/api/rooms/${params.roomId}`)
        .then((res) => res.json())
        .then(setRoom)
        .catch(() => toast.error('Error al cargar habitación'))
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
          <div className="mb-6">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="h-6 w-6" />
                Habitación {room?.numero || 'Sin número'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Estado</p>
                  <Badge variant={room?.ocupada ? 'default' : 'secondary'}>
                    {room?.ocupada ? 'Ocupada' : 'Disponible'}
                  </Badge>
                </div>

                {room?.inquilino && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Inquilino
                    </p>
                    <p className="text-muted-foreground">{room.inquilino.nombre}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Última actualización
                  </p>
                  <p className="text-muted-foreground">
                    {room?.updatedAt ? new Date(room.updatedAt).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
