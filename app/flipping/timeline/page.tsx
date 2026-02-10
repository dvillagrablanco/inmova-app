'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  name: string;
  phase: string;
  startDate: string;
  endDate: string;
  duration: number; // días
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  dependencies: string[];
  assignedTo?: string;
  cost: number;
}

interface Project {
  id: string;
  name: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  tasks: Task[];
}

export default function FlippingTimelinePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState('all');

  const phases = [
    { id: 'acquisition', name: 'Adquisición', color: 'bg-blue-500' },
    { id: 'planning', name: 'Planificación', color: 'bg-purple-500' },
    { id: 'demolition', name: 'Demolición', color: 'bg-red-500' },
    { id: 'structural', name: 'Estructura', color: 'bg-orange-500' },
    { id: 'systems', name: 'Instalaciones', color: 'bg-yellow-500' },
    { id: 'finishes', name: 'Acabados', color: 'bg-green-500' },
    { id: 'staging', name: 'Home Staging', color: 'bg-pink-500' },
    { id: 'marketing', name: 'Marketing/Venta', color: 'bg-indigo-500' },
  ];

  useEffect(() => {
    if (status === 'authenticated') {
      loadProject();
    }
  }, [status]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/proyectos/flipping');
      if (response.ok) {
        const data = await response.json();
        const projects = data.projects || [];
        if (projects.length > 0) {
          setProject(projects[0]);
        }
      }
      /* Data structure reference: {
        id: 'proj_1',
        name: 'Reforma Integral',
        startDate: '2025-01-15',
        expectedEndDate: '2025-05-15',
        tasks: [
          {
            id: 't1',
            name: 'Compra y cierre',
            phase: 'acquisition',
            startDate: '2025-01-15',
            endDate: '2025-01-30',
            duration: 15,
            status: 'completed',
            progress: 100,
            dependencies: [],
            cost: 153500,
          },
          {
            id: 't2',
            name: 'Permisos y licencias',
            phase: 'planning',
            startDate: '2025-01-25',
            endDate: '2025-02-15',
            duration: 21,
            status: 'in_progress',
            progress: 65,
            dependencies: ['t1'],
            assignedTo: 'Gestoría López',
            cost: 2500,
          },
          {
            id: 't3',
            name: 'Demolición interior',
            phase: 'demolition',
            startDate: '2025-02-10',
            endDate: '2025-02-20',
            duration: 10,
            status: 'not_started',
            progress: 0,
            dependencies: ['t2'],
            assignedTo: 'Demoliciones Rápidas SL',
            cost: 5000,
          },
          {
            id: 't4',
            name: 'Refuerzo estructural',
            phase: 'structural',
            startDate: '2025-02-21',
            endDate: '2025-03-05',
            duration: 12,
            status: 'not_started',
            progress: 0,
            dependencies: ['t3'],
            assignedTo: 'Estructuras García',
            cost: 8000,
          },
          {
            id: 't5',
            name: 'Instalación eléctrica',
            phase: 'systems',
            startDate: '2025-03-06',
            endDate: '2025-03-18',
            duration: 12,
            status: 'not_started',
            progress: 0,
            dependencies: ['t4'],
            assignedTo: 'Electricidad Moderna',
            cost: 6500,
          },
          {
            id: 't6',
            name: 'Instalación fontanería',
            phase: 'systems',
            startDate: '2025-03-06',
            endDate: '2025-03-18',
            duration: 12,
            status: 'not_started',
            progress: 0,
            dependencies: ['t4'],
            assignedTo: 'Fontanería Express',
            cost: 5000,
          },
          {
            id: 't7',
            name: 'Suelos y alicatados',
            phase: 'finishes',
            startDate: '2025-03-19',
            endDate: '2025-04-05',
            duration: 17,
            status: 'not_started',
            progress: 0,
            dependencies: ['t5', 't6'],
            cost: 12000,
          },
          {
            id: 't8',
            name: 'Pintura completa',
            phase: 'finishes',
            startDate: '2025-04-06',
            endDate: '2025-04-15',
            duration: 9,
            status: 'not_started',
            progress: 0,
            dependencies: ['t7'],
            assignedTo: 'Pintura Profesional',
            cost: 4500,
          },
          {
            id: 't9',
            name: 'Muebles y decoración',
            phase: 'staging',
            startDate: '2025-04-16',
            endDate: '2025-04-25',
            duration: 9,
            status: 'not_started',
            progress: 0,
            dependencies: ['t8'],
            cost: 8000,
          },
          {
            id: 't10',
            name: 'Fotos profesionales',
            phase: 'marketing',
            startDate: '2025-04-26',
            endDate: '2025-04-28',
            duration: 2,
            status: 'not_started',
            progress: 0,
            dependencies: ['t9'],
            assignedTo: 'FotoInmobiliaria Pro',
            cost: 500,
          },
          {
            id: 't11',
            name: 'Publicación y venta',
            phase: 'marketing',
            startDate: '2025-04-29',
            endDate: '2025-05-15',
            duration: 16,
            status: 'not_started',
            progress: 0,
            dependencies: ['t10'],
            cost: 3000,
          },
        ],
      };
      */ // End of data structure reference
    } catch (error) {
      toast.error('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      not_started: { color: 'bg-gray-500', label: 'Pendiente', icon: Clock },
      in_progress: { color: 'bg-blue-500', label: 'En Progreso', icon: Play },
      completed: { color: 'bg-green-500', label: 'Completado', icon: CheckCircle },
      delayed: { color: 'bg-red-500', label: 'Retrasado', icon: AlertCircle },
    };
    const { color, label, icon: Icon } = config[status as keyof typeof config] || config.not_started;
    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
    });
  };

  const calculateGanttPosition = (startDate: string, endDate: string) => {
    if (!project) return { left: 0, width: 0 };
    
    const projectStart = new Date(project.startDate).getTime();
    const projectEnd = new Date(project.expectedEndDate).getTime();
    const taskStart = new Date(startDate).getTime();
    const taskEnd = new Date(endDate).getTime();
    
    const totalDuration = projectEnd - projectStart;
    const left = ((taskStart - projectStart) / totalDuration) * 100;
    const width = ((taskEnd - taskStart) / totalDuration) * 100;
    
    return { left: `${left}%`, width: `${width}%` };
  };

  const filteredTasks = project?.tasks.filter(
    (task) => selectedPhase === 'all' || task.phase === selectedPhase
  ) || [];

  const overallProgress = project 
    ? Math.round(project.tasks.reduce((sum, t) => sum + t.progress, 0) / project.tasks.length)
    : 0;

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (loading || !project) {
    return (
      <AuthenticatedLayout>
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Cargando timeline...</p>
            </div>
          </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
          <div className="max-w-full mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">{project.name}</h1>
                <p className="text-muted-foreground mt-2">
                  Timeline y Diagrama de Gantt Interactivo
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push('/flipping')}>
                  Volver
                </Button>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Tarea
                </Button>
              </div>
            </div>

            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Progreso General</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{overallProgress}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Tareas Completadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {project.tasks.filter((t) => t.status === 'completed').length} / {project.tasks.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Días Restantes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.ceil(
                      (new Date(project.expectedEndDate).getTime() - new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Presupuesto Usado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round(
                      (project.tasks.reduce((sum, t) => sum + (t.progress / 100) * t.cost, 0) /
                        project.tasks.reduce((sum, t) => sum + t.cost, 0)) *
                        100
                    )}
                    %
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Phase Filter */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <Button
                    variant={selectedPhase === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPhase('all')}
                  >
                    Todas las Fases
                  </Button>
                  {phases.map((phase) => (
                    <Button
                      key={phase.id}
                      variant={selectedPhase === phase.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPhase(phase.id)}
                      className="whitespace-nowrap"
                    >
                      <div className={`w-3 h-3 rounded-full ${phase.color} mr-2`} />
                      {phase.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gantt Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Diagrama de Gantt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Time axis */}
                  <div className="flex justify-between mb-4 px-4 text-xs text-muted-foreground">
                    <span>{formatDate(project.startDate)}</span>
                    <span>{formatDate(project.expectedEndDate)}</span>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-3">
                    {filteredTasks.map((task) => {
                      const phaseColor =
                        phases.find((p) => p.id === task.phase)?.color || 'bg-gray-500';
                      const position = calculateGanttPosition(task.startDate, task.endDate);

                      return (
                        <div key={task.id} className="relative">
                          <div className="flex items-center gap-4 mb-1">
                            <div className="w-64 flex-shrink-0">
                              <p className="font-medium text-sm">{task.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusBadge(task.status)}
                                {task.assignedTo && (
                                  <span className="text-xs text-muted-foreground">
                                    {task.assignedTo}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 relative h-10 bg-gray-100 rounded">
                              <div
                                className={`absolute h-full ${phaseColor} rounded transition-all`}
                                style={{
                                  left: position.left,
                                  width: position.width,
                                  opacity: task.status === 'completed' ? 1 : 0.7,
                                }}
                              >
                                <div className="h-full flex items-center justify-center text-white text-xs font-medium">
                                  {task.progress}%
                                </div>
                                {task.progress > 0 && task.progress < 100 && (
                                  <div
                                    className="absolute top-0 left-0 h-full bg-black opacity-20 rounded"
                                    style={{ width: `${100 - task.progress}%`, right: 0, left: 'auto' }}
                                  />
                                )}
                              </div>
                            </div>
                            <div className="w-32 text-right flex-shrink-0">
                              <p className="text-sm font-medium">{task.duration} días</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(task.startDate)} - {formatDate(task.endDate)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card>
              <CardHeader>
                <CardTitle>Leyenda de Fases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {phases.map((phase) => (
                    <div key={phase.id} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${phase.color}`} />
                      <span className="text-sm">{phase.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </AuthenticatedLayout>
  );
}
