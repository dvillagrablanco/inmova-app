'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Home,
} from 'lucide-react';

export default function HousekeepingPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch('/api/str-advanced/housekeeping');
        if (res.ok) {
          const json = await res.json();
          setTasks(json.data || []);
        }
      } catch (error) {
        console.error('Error loading housekeeping tasks:', error);
      }
    };
    fetchTasks();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'secondary';
      case 'en_progreso':
        return 'default';
      case 'completada':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta':
        return 'destructive';
      case 'media':
        return 'default';
      case 'baja':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <AuthenticatedLayout>
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold">Housekeeping</h1>
                  <p className="text-muted-foreground">
                    Gestión profesional de limpieza y mantenimiento
                  </p>
                </div>
                <Button onClick={() => router.push('/str-advanced')}>Volver al Dashboard</Button>
              </div>
            </div>

            {/* Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes Hoy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{tasks.filter(t => t.status === 'pendiente').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{tasks.filter(t => t.status === 'en_progreso').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{tasks.filter(t => t.status === 'completada').length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{tasks.length > 0 ? Math.round(tasks.reduce((a, t) => a + (t.estimatedTime || 0), 0) / tasks.length) : 0}min</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="schedule" className="space-y-6">
              <TabsList>
                <TabsTrigger value="schedule">Calendario</TabsTrigger>
                <TabsTrigger value="tasks">Tareas</TabsTrigger>
                <TabsTrigger value="team">Equipo</TabsTrigger>
              </TabsList>

              <TabsContent value="schedule" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tareas Programadas</CardTitle>
                    <CardDescription>Vista de calendario de limpieza</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tasks.map((task) => (
                        <Card key={task.id} className="border-2">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                  <Home className="h-5 w-5 text-muted-foreground" />
                                  <h3 className="font-semibold">{task.property}</h3>
                                  <Badge variant={getStatusColor(task.status)}>
                                    {task.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge variant={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{task.date}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{task.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    <span>{task.cleaner}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                                    <span>{task.estimatedTime} min</span>
                                  </div>
                                </div>
                                {task.progress !== undefined && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Progreso</span>
                                      <span className="font-medium">{task.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button variant="outline" size="sm">
                                  Ver Checklist
                                </Button>
                                {task.status === 'pendiente' && <Button size="sm">Iniciar</Button>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tasks">
                <Card>
                  <CardHeader>
                    <CardTitle>Gestión de Tareas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground p-8">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Vista de gestión de tareas</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team">
                <Card>
                  <CardHeader>
                    <CardTitle>Equipo de Limpieza</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-muted-foreground p-8">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Gestión del equipo de limpieza</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </AuthenticatedLayout>
  );
}
