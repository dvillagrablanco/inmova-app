/**
 * Componente de seguimiento de progreso del onboarding
 * Muestra tareas, progreso y permite navegar entre acciones
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  Loader2, 
  SkipForward, 
  ArrowRight, 
  Clock, 
  PlayCircle,
  FileText,
  Zap,
  AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  trackOnboardingTaskComplete,
  trackOnboardingTaskSkip,
  trackOnboardingComplete,
} from '@/lib/analytics-service';

interface OnboardingTask {
  id: string;
  taskId: string;
  title: string;
  description: string;
  type: 'wizard' | 'video' | 'action' | 'form';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  order: number;
  isMandatory: boolean;
  estimatedTime: number; // segundos
  route?: string;
  videoUrl?: string;
  helpArticle?: string;
  unlocks: string[];
  completedAt?: Date | null;
  skippedAt?: Date | null;
}

interface OnboardingProgress {
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  estimatedTimeRemaining: number; // segundos
  tasks: OnboardingTask[];
}

interface OnboardingProgressTrackerProps {
  userId?: string;
  onTaskComplete?: (taskId: string) => void;
  onTaskSkip?: (taskId: string) => void;
  className?: string;
}

export function OnboardingProgressTracker({ 
  userId, 
  onTaskComplete, 
  onTaskSkip,
  className 
}: OnboardingProgressTrackerProps) {
  const router = useRouter();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // Cargar progreso del onboarding
  useEffect(() => {
    loadProgress();
  }, [userId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/onboarding/progress');
      
      if (!response.ok) {
        throw new Error('Error al cargar progreso');
      }

      const data = await response.json();
      setProgress(data);
      
      // Establecer tarea actual (primera no completada)
      const currentTask = data.tasks.find(
        (t: OnboardingTask) => t.status === 'pending' || t.status === 'in_progress'
      );
      if (currentTask) {
        setCurrentTaskId(currentTask.taskId);
      }
    } catch (err: any) {
      console.error('Error cargando progreso:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (task: OnboardingTask) => {
    if (task.route) {
      // Navegar a la ruta del wizard/acción
      router.push(task.route);
    } else if (task.videoUrl) {
      // Abrir video en modal o nueva pestaña
      window.open(task.videoUrl, '_blank');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.taskId === taskId);
      const response = await fetch('/api/onboarding/task/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });

      if (response.ok) {
        await loadProgress(); // Recargar progreso
        onTaskComplete?.(taskId);
        
        // Track analytics
        if (task) {
          trackOnboardingTaskComplete(taskId, task.title, progress);
        }
        
        // Si el progreso es 100%, trackear completación total
        if (progress >= 100) {
          trackOnboardingComplete('user', estimatedTimeRemaining, tasks.length);
        }
      }
    } catch (err) {
      console.error('Error completando tarea:', err);
    }
  };

  const handleSkipTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.taskId === taskId);
      const response = await fetch('/api/onboarding/task/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });

      if (response.ok) {
        await loadProgress();
        onTaskSkip?.(taskId);
        
        // Track analytics
        if (task) {
          trackOnboardingTaskSkip(taskId, task.title, progress);
        }
      }
    } catch (err) {
      console.error('Error saltando tarea:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    if (minutes === 0) return `${seconds}s`;
    if (minutes === 1) return '1 minuto';
    return `${minutes} minutos`;
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'wizard':
        return <Zap className="h-5 w-5" />;
      case 'video':
        return <PlayCircle className="h-5 w-5" />;
      case 'form':
        return <FileText className="h-5 w-5" />;
      case 'action':
        return <ArrowRight className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      case 'skipped':
        return <SkipForward className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Cargando progreso...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full border-red-200", className)}>
        <CardContent className="p-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-red-900">Error al cargar progreso</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={loadProgress}
              >
                Reintentar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Tu Progreso de Configuración</CardTitle>
            <CardDescription className="mt-1">
              Completa estos pasos para activar todas las funcionalidades
            </CardDescription>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            {Math.round(progress.percentage)}%
          </Badge>
        </div>
        
        <div className="mt-6">
          <Progress value={progress.percentage} className="h-3" />
          <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
            <span>
              {progress.completedTasks} de {progress.totalTasks} tareas completadas
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatTime(progress.estimatedTimeRemaining)} restantes
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-3">
          <AnimatePresence>
            {progress.tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border-2 transition-all',
                    task.taskId === currentTaskId && task.status !== 'completed' && 'border-primary bg-primary/5',
                    task.status === 'completed' && 'border-green-200 bg-green-50/50 opacity-70',
                    task.status === 'skipped' && 'border-gray-200 bg-gray-50 opacity-60',
                    task.status === 'pending' && task.taskId !== currentTaskId && 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  {/* Número de orden o icono de estado */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold border-2">
                    {task.status === 'completed' || task.status === 'skipped' ? (
                      getStatusIcon(task.status)
                    ) : (
                      <span className={cn(
                        task.taskId === currentTaskId ? 'text-primary' : 'text-gray-400'
                      )}>
                        {task.order + 1}
                      </span>
                    )}
                  </div>
                  
                  {/* Contenido de la tarea */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1 flex items-center gap-2">
                          {task.title}
                          {task.isMandatory && (
                            <Badge variant="destructive" className="text-xs">Obligatorio</Badge>
                          )}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {task.description}
                        </p>
                        
                        {/* Metadata de la tarea */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            {getTaskIcon(task.type)}
                            {task.type === 'wizard' && 'Asistente guiado'}
                            {task.type === 'video' && 'Video tutorial'}
                            {task.type === 'action' && 'Acción rápida'}
                            {task.type === 'form' && 'Formulario'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(task.estimatedTime)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Botones de acción */}
                      {task.status !== 'completed' && task.status !== 'skipped' && (
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleTaskAction(task)}
                            size="sm"
                            className={cn(
                              task.taskId === currentTaskId ? 'bg-primary' : 'bg-secondary'
                            )}
                          >
                            {task.type === 'wizard' && 'Iniciar asistente'}
                            {task.type === 'video' && 'Ver video'}
                            {task.type === 'action' && 'Ir'}
                            {task.type === 'form' && 'Completar'}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                          
                          {!task.isMandatory && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSkipTask(task.taskId)}
                              className="text-xs"
                            >
                              Saltar
                            </Button>
                          )}
                        </div>
                      )}
                      
                      {/* Estado completado */}
                      {task.status === 'completed' && (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="h-3 w-3 mr-1" />
                          Completado
                        </Badge>
                      )}
                      
                      {/* Estado saltado */}
                      {task.status === 'skipped' && (
                        <Badge variant="secondary">
                          Saltado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
      
      {progress.percentage === 100 && (
        <CardFooter className="border-t bg-green-50">
          <div className="w-full text-center py-4">
            <h3 className="text-2xl font-bold text-green-900 mb-2">
              🎉 ¡Configuración completada!
            </h3>
            <p className="text-green-700 mb-4">
              Ya tienes acceso completo a todas las funcionalidades de INMOVA.
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="bg-green-600 hover:bg-green-700"
            >
              Ir al Dashboard
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
