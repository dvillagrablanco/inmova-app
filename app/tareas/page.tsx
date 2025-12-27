'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CheckSquare, Plus, Search, Calendar } from 'lucide-react';

export default function TareasPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [tareas, setTareas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch('/api/tareas')
        .then((res) => res.json())
        .then(setTareas)
        .catch(() => toast.error('Error al cargar tareas'))
        .finally(() => setIsLoading(false));
    }
  }, [session]);

  if (status === 'loading' || isLoading) {
    return (
      <AuthenticatedLayout>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="text-center py-12">Cargando tareas...</div>
        </main>
      </AuthenticatedLayout>
    );
  }

  const filteredTareas = tareas.filter((tarea) =>
    tarea.titulo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthenticatedLayout>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CheckSquare className="h-6 w-6" />
              Tareas
            </h1>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Buscar Tareas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar por título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredTareas.map((tarea) => (
              <Card key={tarea.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={tarea.completada}
                      onCheckedChange={() => {
                        // Toggle completada
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${tarea.completada ? 'line-through text-muted-foreground' : ''}`}>
                          {tarea.titulo}
                        </h3>
                        <Badge variant={tarea.prioridad === 'alta' ? 'destructive' : 'default'}>
                          {tarea.prioridad || 'normal'}
                        </Badge>
                      </div>
                      {tarea.descripcion && (
                        <p className="text-sm text-muted-foreground mt-1">{tarea.descripcion}</p>
                      )}
                      {tarea.fechaVencimiento && (
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(tarea.fechaVencimiento).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTareas.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">No se encontraron tareas</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
