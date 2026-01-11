'use client';

import { useState, useRef, useEffect } from 'react';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  GripVertical,
  User,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos
export interface GanttTask {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  status: 'pendiente' | 'en_progreso' | 'completada' | 'retrasada' | 'cancelada';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  assignee?: string;
  dependencies?: string[]; // IDs de tareas de las que depende
  color?: string;
  category?: string;
  estimatedCost?: number;
  actualCost?: number;
}

export interface GanttProject {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  tasks: GanttTask[];
  budget?: number;
  actualSpent?: number;
}

interface GanttChartProps {
  project: GanttProject;
  onTaskCreate?: (task: Omit<GanttTask, 'id'>) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<GanttTask>) => void;
  onTaskDelete?: (taskId: string) => void;
  readOnly?: boolean;
  showCosts?: boolean;
}

// Colores por estado
const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  pendiente: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  en_progreso: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
  completada: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-400' },
  retrasada: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400' },
  cancelada: { bg: 'bg-gray-200', text: 'text-gray-500', border: 'border-gray-400' },
};

// Colores por prioridad para las barras
const priorityBarColors: Record<string, string> = {
  baja: 'bg-slate-400',
  media: 'bg-blue-500',
  alta: 'bg-amber-500',
  critica: 'bg-red-500',
};

// Iconos de estado
const statusIcons: Record<string, any> = {
  pendiente: Clock,
  en_progreso: MoreHorizontal,
  completada: CheckCircle2,
  retrasada: AlertCircle,
  cancelada: AlertCircle,
};

// Formato de moneda
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
};

export function GanttChart({
  project,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  readOnly = false,
  showCosts = false,
}: GanttChartProps) {
  const [viewStart, setViewStart] = useState<Date>(() => {
    if (project.startDate) {
      return startOfMonth(parseISO(project.startDate));
    }
    return startOfMonth(new Date());
  });
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('day');
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [newTask, setNewTask] = useState<Partial<GanttTask>>({
    name: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    progress: 0,
    status: 'pendiente',
    priority: 'media',
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Calcular rango de fechas visible
  const viewEnd = zoomLevel === 'month' 
    ? addDays(viewStart, 90) 
    : zoomLevel === 'week' 
      ? addDays(viewStart, 42)
      : addDays(viewStart, 30);
  
  const days = eachDayOfInterval({ start: viewStart, end: viewEnd });
  
  // Ancho de cada celda según zoom
  const cellWidth = zoomLevel === 'day' ? 40 : zoomLevel === 'week' ? 20 : 12;
  
  // Calcular posición y ancho de una barra de tarea
  const getTaskBarStyle = (task: GanttTask) => {
    const taskStart = parseISO(task.startDate);
    const taskEnd = parseISO(task.endDate);
    
    const startOffset = differenceInDays(taskStart, viewStart);
    const duration = differenceInDays(taskEnd, taskStart) + 1;
    
    return {
      left: Math.max(0, startOffset * cellWidth),
      width: Math.max(cellWidth, duration * cellWidth),
      visible: startOffset + duration >= 0 && startOffset <= days.length,
    };
  };
  
  // Navegar en el tiempo
  const navigateTime = (direction: 'prev' | 'next') => {
    const amount = zoomLevel === 'month' ? 30 : zoomLevel === 'week' ? 14 : 7;
    setViewStart(prev => addDays(prev, direction === 'next' ? amount : -amount));
  };
  
  // Cambiar zoom
  const changeZoom = (direction: 'in' | 'out') => {
    if (direction === 'in') {
      if (zoomLevel === 'month') setZoomLevel('week');
      else if (zoomLevel === 'week') setZoomLevel('day');
    } else {
      if (zoomLevel === 'day') setZoomLevel('week');
      else if (zoomLevel === 'week') setZoomLevel('month');
    }
  };
  
  // Ir a hoy
  const goToToday = () => {
    setViewStart(startOfMonth(new Date()));
  };
  
  // Calcular estadísticas
  const stats = {
    total: project.tasks.length,
    completadas: project.tasks.filter(t => t.status === 'completada').length,
    enProgreso: project.tasks.filter(t => t.status === 'en_progreso').length,
    retrasadas: project.tasks.filter(t => t.status === 'retrasada').length,
    progresoTotal: project.tasks.length > 0 
      ? Math.round(project.tasks.reduce((sum, t) => sum + t.progress, 0) / project.tasks.length)
      : 0,
  };
  
  // Abrir dialog para crear tarea
  const handleCreateTask = () => {
    setEditingTask(null);
    setNewTask({
      name: '',
      description: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
      progress: 0,
      status: 'pendiente',
      priority: 'media',
    });
    setShowTaskDialog(true);
  };
  
  // Abrir dialog para editar tarea
  const handleEditTask = (task: GanttTask) => {
    setEditingTask(task);
    setNewTask({
      name: task.name,
      description: task.description,
      startDate: task.startDate,
      endDate: task.endDate,
      progress: task.progress,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      category: task.category,
      estimatedCost: task.estimatedCost,
      actualCost: task.actualCost,
    });
    setShowTaskDialog(true);
  };
  
  // Guardar tarea
  const handleSaveTask = () => {
    if (!newTask.name || !newTask.startDate || !newTask.endDate) return;
    
    if (editingTask) {
      onTaskUpdate?.(editingTask.id, newTask);
    } else {
      onTaskCreate?.(newTask as Omit<GanttTask, 'id'>);
    }
    
    setShowTaskDialog(false);
    setEditingTask(null);
  };
  
  // Eliminar tarea
  const handleDeleteTask = (taskId: string) => {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      onTaskDelete?.(taskId);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header con controles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Estadísticas rápidas */}
          <div className="flex items-center gap-3 mr-4">
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {stats.completadas}/{stats.total}
            </Badge>
            {stats.retrasadas > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {stats.retrasadas} retrasadas
              </Badge>
            )}
            <Badge variant="secondary">
              {stats.progresoTotal}% completado
            </Badge>
          </div>
          
          {/* Controles de navegación */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateTime('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={goToToday}>
              Hoy
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigateTime('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Controles de zoom */}
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => changeZoom('in')}
              disabled={zoomLevel === 'day'}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-xs px-2 text-muted-foreground capitalize">{zoomLevel}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => changeZoom('out')}
              disabled={zoomLevel === 'month'}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Crear tarea */}
          {!readOnly && (
            <Button onClick={handleCreateTask} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nueva Tarea
            </Button>
          )}
        </div>
      </div>
      
      {/* Barra de progreso general */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progreso del proyecto</span>
          <span className="font-medium">{stats.progresoTotal}%</span>
        </div>
        <Progress value={stats.progresoTotal} className="h-2" />
      </div>
      
      {/* Diagrama de Gantt */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full" ref={scrollRef}>
            <div className="min-w-max">
              {/* Header con fechas */}
              <div className="flex border-b bg-muted/50 sticky top-0 z-10">
                {/* Columna de nombres */}
                <div className="w-64 min-w-64 border-r p-2 font-medium text-sm sticky left-0 bg-muted/50 z-20">
                  Tareas
                </div>
                
                {/* Días/Semanas/Meses */}
                <div className="flex">
                  {days.map((day, i) => {
                    const isToday = isSameDay(day, new Date());
                    const isWeekendDay = isWeekend(day);
                    
                    // Mostrar solo ciertos días según zoom
                    const showLabel = zoomLevel === 'day' 
                      ? true 
                      : zoomLevel === 'week' 
                        ? day.getDay() === 1 
                        : day.getDate() === 1;
                    
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex flex-col items-center justify-center border-r text-xs",
                          isToday && "bg-blue-50",
                          isWeekendDay && !isToday && "bg-gray-50"
                        )}
                        style={{ width: cellWidth, minWidth: cellWidth }}
                      >
                        {showLabel && (
                          <>
                            <span className="font-medium">
                              {zoomLevel === 'month' 
                                ? format(day, 'MMM', { locale: es })
                                : format(day, 'd')}
                            </span>
                            {zoomLevel !== 'month' && (
                              <span className="text-muted-foreground text-[10px]">
                                {format(day, 'EEE', { locale: es })}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Filas de tareas */}
              {project.tasks.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay tareas en este proyecto</p>
                    {!readOnly && (
                      <Button variant="outline" size="sm" className="mt-2" onClick={handleCreateTask}>
                        <Plus className="h-4 w-4 mr-1" />
                        Crear primera tarea
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                project.tasks.map((task) => {
                  const barStyle = getTaskBarStyle(task);
                  const StatusIcon = statusIcons[task.status];
                  const colors = statusColors[task.status];
                  
                  return (
                    <div key={task.id} className="flex border-b hover:bg-muted/30">
                      {/* Info de tarea */}
                      <div className="w-64 min-w-64 border-r p-2 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          {!readOnly && (
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <StatusIcon className={cn("h-3 w-3", colors.text)} />
                              <span className="text-sm font-medium truncate">{task.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{format(parseISO(task.startDate), 'dd/MM')} - {format(parseISO(task.endDate), 'dd/MM')}</span>
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                {task.progress}%
                              </Badge>
                            </div>
                          </div>
                          {!readOnly && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleEditTask(task)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Barra de Gantt */}
                      <div className="flex-1 relative" style={{ height: 48 }}>
                        {/* Grid de días */}
                        <div className="absolute inset-0 flex">
                          {days.map((day, i) => (
                            <div
                              key={i}
                              className={cn(
                                "border-r",
                                isSameDay(day, new Date()) && "bg-blue-50",
                                isWeekend(day) && !isSameDay(day, new Date()) && "bg-gray-50"
                              )}
                              style={{ width: cellWidth, minWidth: cellWidth }}
                            />
                          ))}
                        </div>
                        
                        {/* Barra de tarea */}
                        {barStyle.visible && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "absolute top-2 h-8 rounded-md shadow-sm border cursor-pointer transition-all hover:shadow-md",
                                    priorityBarColors[task.priority],
                                    task.status === 'cancelada' && "opacity-50"
                                  )}
                                  style={{
                                    left: barStyle.left,
                                    width: barStyle.width - 4,
                                  }}
                                  onClick={() => !readOnly && handleEditTask(task)}
                                >
                                  {/* Progreso dentro de la barra */}
                                  <div
                                    className="absolute inset-0 bg-white/30 rounded-l-md"
                                    style={{ width: `${task.progress}%` }}
                                  />
                                  {/* Texto */}
                                  <div className="relative z-10 px-2 h-full flex items-center">
                                    <span className="text-xs text-white font-medium truncate">
                                      {barStyle.width > 80 ? task.name : ''}
                                    </span>
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="font-semibold">{task.name}</p>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground">{task.description}</p>
                                  )}
                                  <div className="flex gap-2 text-xs">
                                    <span>{format(parseISO(task.startDate), 'dd/MM/yyyy')} - {format(parseISO(task.endDate), 'dd/MM/yyyy')}</span>
                                  </div>
                                  <div className="flex gap-2 text-xs">
                                    <Badge variant="outline" className={colors.bg}>{task.status}</Badge>
                                    <span>{task.progress}% completado</span>
                                  </div>
                                  {task.assignee && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <User className="h-3 w-3" />
                                      {task.assignee}
                                    </div>
                                  )}
                                  {showCosts && task.estimatedCost && (
                                    <div className="text-xs">
                                      Presupuesto: {formatCurrency(task.estimatedCost)}
                                      {task.actualCost && ` / Real: ${formatCurrency(task.actualCost)}`}
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        {/* Línea de hoy */}
                        {days.some(d => isSameDay(d, new Date())) && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                            style={{
                              left: differenceInDays(new Date(), viewStart) * cellWidth + cellWidth / 2,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="font-medium">Prioridad:</span>
        {Object.entries(priorityBarColors).map(([priority, color]) => (
          <div key={priority} className="flex items-center gap-1">
            <div className={cn("w-4 h-3 rounded", color)} />
            <span className="capitalize">{priority}</span>
          </div>
        ))}
        <span className="border-l pl-4 font-medium">Estado:</span>
        {Object.entries(statusColors).map(([status, colors]) => {
          const Icon = statusIcons[status];
          return (
            <div key={status} className="flex items-center gap-1">
              <Icon className={cn("h-3 w-3", colors.text)} />
              <span className="capitalize">{status.replace('_', ' ')}</span>
            </div>
          );
        })}
      </div>
      
      {/* Dialog para crear/editar tarea */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
            </DialogTitle>
            <DialogDescription>
              {editingTask ? 'Modifica los detalles de la tarea' : 'Añade una nueva tarea al proyecto'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Nombre de la tarea *</Label>
              <Input
                placeholder="Ej: Demolición de tabiques"
                value={newTask.name || ''}
                onChange={(e) => setNewTask(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción detallada de la tarea..."
                value={newTask.description || ''}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha inicio *</Label>
                <Input
                  type="date"
                  value={newTask.startDate || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha fin *</Label>
                <Input
                  type="date"
                  value={newTask.endDate || ''}
                  onChange={(e) => setNewTask(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={newTask.status}
                  onValueChange={(v: any) => setNewTask(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en_progreso">En progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="retrasada">Retrasada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(v: any) => setNewTask(prev => ({ ...prev, priority: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Progreso: {newTask.progress}%</Label>
              <Input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newTask.progress || 0}
                onChange={(e) => setNewTask(prev => ({ ...prev, progress: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Asignado a</Label>
              <Input
                placeholder="Nombre del responsable"
                value={newTask.assignee || ''}
                onChange={(e) => setNewTask(prev => ({ ...prev, assignee: e.target.value }))}
              />
            </div>
            
            {showCosts && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coste estimado (€)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newTask.estimatedCost || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, estimatedCost: parseFloat(e.target.value) || undefined }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Coste real (€)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newTask.actualCost || ''}
                    onChange={(e) => setNewTask(prev => ({ ...prev, actualCost: parseFloat(e.target.value) || undefined }))}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaskDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTask} disabled={!newTask.name || !newTask.startDate || !newTask.endDate}>
              {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GanttChart;
