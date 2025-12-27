'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { HelpCircle, Plus, MessageSquare, CheckCircle } from 'lucide-react';

export default function SoportePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/support-tickets')
        .then((res) => res.json())
        .then(setTickets)
        .catch(() => toast.error('Error al cargar tickets'))
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
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6" />
              Soporte
            </h1>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ticket
            </Button>
          </div>

          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <Card key={ticket.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      {ticket.asunto || 'Sin asunto'}
                    </span>
                    <Badge variant={ticket.estado === 'cerrado' ? 'secondary' : 'default'}>
                      {ticket.estado}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{ticket.descripcion}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    {ticket.fecha && new Date(ticket.fecha).toLocaleDateString('es-ES')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {tickets.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No hay tickets de soporte</p>
                <Button variant="outline" className="mt-4">
                  Crear primer ticket
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
