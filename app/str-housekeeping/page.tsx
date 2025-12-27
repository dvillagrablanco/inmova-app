'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Calendar, Package, CheckCircle, Clock } from 'lucide-react';

export default function STRHousekeepingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      Promise.all([
        fetch('/api/housekeeping/tasks').then((r) => r.json()),
        fetch('/api/housekeeping/stats').then((r) => r.json()),
      ])
        .then(([tasksData, statsData]) => {
          setTasks(tasksData);
          setStats(statsData);
        })
        .catch(() => toast.error('Error al cargar datos'))
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
              <Sparkles className="h-6 w-6" />
              Housekeeping STR
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/str-housekeeping/inventory')}>
                <Package className="h-4 w-4 mr-2" />
                Inventario
              </Button>
              <Button onClick={() => router.push('/str-housekeeping/schedule')}>
                <Calendar className="h-4 w-4 mr-2" />
                Programar
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tareas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{task.propiedad}</p>
                      <p className="text-sm text-muted-foreground">{task.tipo}</p>
                    </div>
                    <Badge variant={task.estado === 'completed' ? 'default' : 'secondary'}>
                      {task.estado}
                    </Badge>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No hay tareas registradas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AuthenticatedLayout>
  );
}
