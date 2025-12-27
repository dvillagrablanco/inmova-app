'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Calendar, Plus, Search, MapPin, Clock } from 'lucide-react';

export default function VisitasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/visitas')
        .then((res) => res.json())
        .then(setVisitas)
        .catch(() => toast.error('Error al cargar visitas'))
        .finally(() => setIsLoading(false));
    }
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">Cargando...</div>
        </main>
      </AuthenticatedLayout>
    );
  }

  const filteredVisitas = visitas.filter((visita) =>
    visita.propiedad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visita.visitante?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Visitas
            </h1>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Visita
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Visitas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por propiedad o visitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredVisitas.map((visita) => (
              <Card key={visita.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {visita.propiedad}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{visita.visitante}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {visita.fecha && new Date(visita.fecha).toLocaleDateString('es-ES')}
                      {visita.hora && ` - ${visita.hora}`}
                    </div>
                    <Badge variant={visita.confirmada ? 'default' : 'secondary'}>
                      {visita.confirmada ? 'Confirmada' : 'Pendiente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVisitas.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron visitas</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
