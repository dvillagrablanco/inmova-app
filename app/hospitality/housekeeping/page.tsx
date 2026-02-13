'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  Home, ArrowLeft, ClipboardList, CheckCircle, Clock, AlertTriangle,
  Sparkles, User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface HousekeepingTask {
  id: string;
  unitNumero: string;
  buildingNombre: string;
  tipo: 'checkout_clean' | 'stay_clean' | 'deep_clean' | 'inspection';
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'verificada';
  prioridad: 'alta' | 'media' | 'baja';
  asignadoA?: string;
  checkoutDate?: string;
  checkinDate?: string;
  notas?: string;
}

export default function HousekeepingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
    if (status === 'authenticated') fetchTasks();
  }, [status]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/hospitality/housekeeping');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newEstado: string) => {
    try {
      const res = await fetch('/api/hospitality/housekeeping', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, estado: newEstado }),
      });
      if (res.ok) {
        toast.success('Estado actualizado');
        fetchTasks();
      }
    } catch { toast.error('Error al actualizar'); }
  };

  const filtered = tasks.filter(t => filter === 'all' || t.estado === filter);

  const stats = {
    pendientes: tasks.filter(t => t.estado === 'pendiente').length,
    enProgreso: tasks.filter(t => t.estado === 'en_progreso').length,
    completadas: tasks.filter(t => t.estado === 'completada' || t.estado === 'verificada').length,
  };

  const getPrioridadColor = (p: string) => {
    if (p === 'alta') return 'bg-red-100 text-red-700';
    if (p === 'media') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getTipoLabel = (t: string) => {
    const map: Record<string, string> = {
      checkout_clean: 'Limpieza Check-out',
      stay_clean: 'Limpieza Estancia',
      deep_clean: 'Limpieza Profunda',
      inspection: 'Inspección',
    };
    return map[t] || t;
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/hospitality')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard"><Home className="h-4 w-4" /></BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/hospitality">Hospitality</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Housekeeping</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Housekeeping
          </h1>
          <p className="text-muted-foreground">Gestión de limpieza y preparación de habitaciones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-3xl font-bold">{stats.pendientes}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-3xl font-bold">{stats.enProgreso}</p>
                  <p className="text-xs text-muted-foreground">En progreso</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-3xl font-bold">{stats.completadas}</p>
                  <p className="text-xs text-muted-foreground">Completadas hoy</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Tareas de Limpieza</CardTitle>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pendiente">Pendientes</SelectItem>
                  <SelectItem value="en_progreso">En progreso</SelectItem>
                  <SelectItem value="completada">Completadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Sin tareas de limpieza</p>
                <p className="text-sm">Las tareas se generan automáticamente con los check-outs</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        task.estado === 'completada' || task.estado === 'verificada' ? 'bg-green-100' :
                        task.estado === 'en_progreso' ? 'bg-blue-100' : 'bg-orange-100'
                      }`}>
                        {task.estado === 'completada' || task.estado === 'verificada' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : task.estado === 'en_progreso' ? (
                          <ClipboardList className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{task.buildingNombre} - {task.unitNumero}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{getTipoLabel(task.tipo)}</Badge>
                          <Badge className={`text-xs ${getPrioridadColor(task.prioridad)}`}>{task.prioridad}</Badge>
                        </div>
                        {task.asignadoA && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <User className="h-3 w-3" /> {task.asignadoA}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {task.estado === 'pendiente' && (
                        <Button size="sm" onClick={() => updateTaskStatus(task.id, 'en_progreso')}>
                          Iniciar
                        </Button>
                      )}
                      {task.estado === 'en_progreso' && (
                        <Button size="sm" onClick={() => updateTaskStatus(task.id, 'completada')}>
                          Completar
                        </Button>
                      )}
                      {task.estado === 'completada' && (
                        <Button size="sm" variant="outline" onClick={() => updateTaskStatus(task.id, 'verificada')}>
                          Verificar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
