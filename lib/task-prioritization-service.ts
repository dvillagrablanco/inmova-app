/**
 * Task Prioritization Service for INMOVA
 * Automatically calculates task priority based on multiple factors
 */

import { prisma } from './db';
import {
  differenceInDays,
  differenceInHours,
  isToday,
  isTomorrow,
  isPast,
  startOfDay,
  endOfDay,
} from 'date-fns';

export interface TaskPriorityScore {
  totalScore: number;
  factors: {
    urgency: number; // Based on due date
    importance: number; // Based on task priority
    age: number; // How long task has been pending
    overdue: number; // Penalty for overdue tasks
    relationships: number; // Dependencies and blocking tasks
  };
  level: 'critical' | 'high' | 'medium' | 'low';
  reasons: string[];
}

export interface PrioritizedTask {
  id: string;
  titulo: string;
  descripcion: string | null;
  prioridad: string;
  estado: string;
  fechaLimite: Date | null;
  asignadoA: string | null;
  priorityScore: TaskPriorityScore;
  suggestedTimeSlot?: 'morning' | 'afternoon' | 'evening';
}

/**
 * Calculate priority score for a single task
 */
export function calculateTaskPriorityScore(
  task: {
    prioridad: string;
    fechaLimite: Date | null;
    estado: string;
    createdAt: Date;
  },
  relatedTasksCount: number = 0
): TaskPriorityScore {
  const factors = {
    urgency: 0,
    importance: 0,
    age: 0,
    overdue: 0,
    relationships: 0,
  };

  const reasons: string[] = [];

  // 1. Urgency based on due date (0-40 points)
  if (task.fechaLimite) {
    const daysUntilDue = differenceInDays(task.fechaLimite, new Date());
    const hoursUntilDue = differenceInHours(task.fechaLimite, new Date());

    if (isPast(task.fechaLimite) && task.estado !== 'completada') {
      factors.overdue = 50; // Massive penalty for overdue
      reasons.push('⚠️ Tarea vencida');
    } else if (hoursUntilDue <= 2) {
      factors.urgency = 40;
      reasons.push('🔥 Vence en menos de 2 horas');
    } else if (hoursUntilDue <= 24) {
      factors.urgency = 35;
      reasons.push('⏰ Vence hoy');
    } else if (daysUntilDue <= 1) {
      factors.urgency = 30;
      reasons.push('📅 Vence mañana');
    } else if (daysUntilDue <= 3) {
      factors.urgency = 20;
      reasons.push('📆 Vence esta semana');
    } else if (daysUntilDue <= 7) {
      factors.urgency = 10;
    } else {
      factors.urgency = 5;
    }
  }

  // 2. Importance based on priority level (0-30 points)
  switch (task.prioridad) {
    case 'critica':
      factors.importance = 30;
      reasons.push('🚨 Prioridad crítica');
      break;
    case 'alta':
      factors.importance = 20;
      break;
    case 'media':
      factors.importance = 10;
      break;
    case 'baja':
      factors.importance = 5;
      break;
  }

  // 3. Age factor - older pending tasks get more priority (0-15 points)
  const daysPending = differenceInDays(new Date(), task.createdAt);
  if (daysPending > 14) {
    factors.age = 15;
    reasons.push('⏳ Pendiente más de 2 semanas');
  } else if (daysPending > 7) {
    factors.age = 10;
  } else if (daysPending > 3) {
    factors.age = 5;
  }

  // 4. Relationships - tasks that block others get priority (0-15 points)
  if (relatedTasksCount > 0) {
    factors.relationships = Math.min(15, relatedTasksCount * 5);
    if (relatedTasksCount > 1) {
      reasons.push(`🔗 Bloquea ${relatedTasksCount} tareas`);
    }
  }

  const totalScore = Object.values(factors).reduce((sum, val) => sum + val, 0);

  // Determine priority level
  let level: 'critical' | 'high' | 'medium' | 'low';
  if (totalScore >= 70 || factors.overdue > 0) {
    level = 'critical';
  } else if (totalScore >= 50) {
    level = 'high';
  } else if (totalScore >= 30) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    totalScore,
    factors,
    level,
    reasons,
  };
}

/**
 * Get suggested time slot for task based on priority and type
 */
function getSuggestedTimeSlot(
  priorityLevel: 'critical' | 'high' | 'medium' | 'low'
): 'morning' | 'afternoon' | 'evening' {
  // Critical and high priority tasks should be done in the morning
  if (priorityLevel === 'critical' || priorityLevel === 'high') {
    return 'morning';
  }
  // Medium priority in the afternoon
  if (priorityLevel === 'medium') {
    return 'afternoon';
  }
  // Low priority can be evening
  return 'evening';
}

/**
 * Get prioritized tasks for "My Day" view
 */
export async function getMyDayTasks(userId: string, companyId: string): Promise<PrioritizedTask[]> {
  const today = new Date();

  // Fetch all pending and in-progress tasks
  const tasks = await prisma.task.findMany({
    where: {
      companyId,
      OR: [{ asignadoA: userId }, { creadoPor: userId }],
      estado: {
        in: ['pendiente', 'en_progreso'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Calculate priority scores
  const prioritizedTasks: PrioritizedTask[] = tasks.map((task) => {
    const priorityScore = calculateTaskPriorityScore(task, 0);
    return {
      id: task.id,
      titulo: task.titulo,
      descripcion: task.descripcion,
      prioridad: task.prioridad,
      estado: task.estado,
      fechaLimite: task.fechaLimite,
      asignadoA: task.asignadoA,
      priorityScore,
      suggestedTimeSlot: getSuggestedTimeSlot(priorityScore.level),
    };
  });

  // Filter tasks for "My Day":
  // 1. All overdue tasks
  // 2. Tasks due today
  // 3. Tasks due tomorrow (if high/critical priority)
  // 4. High/critical priority tasks without due date
  const myDayTasks = prioritizedTasks.filter((task) => {
    const { fechaLimite, priorityScore } = task;

    // Include all overdue
    if (fechaLimite && isPast(fechaLimite) && task.estado !== 'completada') {
      return true;
    }

    // Include all due today
    if (fechaLimite && isToday(fechaLimite)) {
      return true;
    }

    // Include high/critical due tomorrow
    if (
      fechaLimite &&
      isTomorrow(fechaLimite) &&
      (priorityScore.level === 'critical' || priorityScore.level === 'high')
    ) {
      return true;
    }

    // Include critical/high priority without due date
    if (!fechaLimite && (priorityScore.level === 'critical' || priorityScore.level === 'high')) {
      return true;
    }

    return false;
  });

  // Sort by priority score descending
  return myDayTasks.sort((a, b) => b.priorityScore.totalScore - a.priorityScore.totalScore);
}

/**
 * Get all prioritized tasks sorted by priority
 */
export async function getPrioritizedTasks(
  companyId: string,
  userId?: string
): Promise<PrioritizedTask[]> {
  const tasks = await prisma.task.findMany({
    where: {
      companyId,
      ...(userId && {
        OR: [{ asignadoA: userId }, { creadoPor: userId }],
      }),
      estado: {
        in: ['pendiente', 'en_progreso'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const prioritizedTasks: PrioritizedTask[] = tasks.map((task) => {
    const priorityScore = calculateTaskPriorityScore(task, 0);
    return {
      id: task.id,
      titulo: task.titulo,
      descripcion: task.descripcion,
      prioridad: task.prioridad,
      estado: task.estado,
      fechaLimite: task.fechaLimite,
      asignadoA: task.asignadoA,
      priorityScore,
      suggestedTimeSlot: getSuggestedTimeSlot(priorityScore.level),
    };
  });

  // Sort by priority score descending
  return prioritizedTasks.sort((a, b) => b.priorityScore.totalScore - a.priorityScore.totalScore);
}

/**
 * Get task statistics for dashboard
 */
export async function getTaskStats(companyId: string, userId?: string) {
  const tasks = await prisma.task.findMany({
    where: {
      companyId,
      ...(userId && {
        OR: [{ asignadoA: userId }, { creadoPor: userId }],
      }),
    },
  });

  const prioritizedTasks = tasks.map((task) => {
    const priorityScore = calculateTaskPriorityScore(task, 0);
    return { ...task, priorityScore };
  });

  const stats = {
    total: tasks.length,
    pendiente: tasks.filter((t) => t.estado === 'pendiente').length,
    enProgreso: tasks.filter((t) => t.estado === 'en_progreso').length,
    completada: tasks.filter((t) => t.estado === 'completada').length,
    critical: prioritizedTasks.filter((t) => t.priorityScore.level === 'critical').length,
    high: prioritizedTasks.filter((t) => t.priorityScore.level === 'high').length,
    overdue: prioritizedTasks.filter(
      (t) => t.fechaLimite && isPast(t.fechaLimite) && t.estado !== 'completada'
    ).length,
    dueToday: prioritizedTasks.filter(
      (t) => t.fechaLimite && isToday(t.fechaLimite) && t.estado !== 'completada'
    ).length,
  };

  return stats;
}
