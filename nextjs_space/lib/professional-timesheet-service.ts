/**
 * PROFESSIONAL TIMESHEET SERVICE
 * Sistema de control de horas para proyectos profesionales
 */

import { prisma } from './db';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, differenceInHours, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export interface TimeEntry {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutos
  description: string;
  task?: string;
  billable: boolean;
  hourlyRate?: number;
  amount?: number;
  status: 'draft' | 'submitted' | 'approved' | 'billed';
  createdAt: Date;
  updatedAt: Date;
}

export interface TimesheetSummary {
  period: string;
  totalHours: number;
  billableHours: number;
  nonBillableHours: number;
  totalAmount: number;
  entries: TimeEntry[];
  byProject: {
    projectId: string;
    projectName: string;
    hours: number;
    amount: number;
  }[];
  byUser: {
    userId: string;
    userName: string;
    hours: number;
    amount: number;
  }[];
}

/**
 * Crea una entrada de tiempo
 */
export async function createTimeEntry(
  projectId: string,
  userId: string,
  data: {
    date: Date;
    startTime: Date;
    endTime?: Date;
    description: string;
    task?: string;
    billable?: boolean;
    hourlyRate?: number;
  }
): Promise<TimeEntry> {
  const duration = data.endTime 
    ? differenceInMinutes(data.endTime, data.startTime)
    : 0;
  
  const hours = duration / 60;
  const amount = data.billable && data.hourlyRate 
    ? hours * data.hourlyRate
    : 0;
  
  // Obtener nombre del usuario
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const entry: TimeEntry = {
    id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    projectId,
    userId,
    userName: user?.name || 'Unknown',
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    duration,
    description: data.description,
    task: data.task,
    billable: data.billable ?? true,
    hourlyRate: data.hourlyRate,
    amount,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  // Guardar en la base de datos (como JSON en el proyecto)
  // En producción, crearías una tabla separada
  
  return entry;
}

/**
 * Inicia un timer (para tracking en tiempo real)
 */
export async function startTimer(
  projectId: string,
  userId: string,
  description: string,
  task?: string
): Promise<TimeEntry> {
  return createTimeEntry(projectId, userId, {
    date: new Date(),
    startTime: new Date(),
    description,
    task,
    billable: true,
  });
}

/**
 * Detiene un timer activo
 */
export async function stopTimer(
  entryId: string,
  endTime?: Date
): Promise<TimeEntry> {
  // Actualizar la entrada con el endTime
  // En producción, buscarías la entrada en la base de datos
  
  const entry = {} as TimeEntry; // Placeholder
  entry.endTime = endTime || new Date();
  entry.duration = differenceInMinutes(entry.endTime, entry.startTime);
  
  if (entry.billable && entry.hourlyRate) {
    entry.amount = (entry.duration / 60) * entry.hourlyRate;
  }
  
  entry.updatedAt = new Date();
  
  return entry;
}

/**
 * Obtiene resumen de timesheet para un periodo
 */
export async function getTimesheetSummary(
  companyId: string,
  startDate: Date,
  endDate: Date,
  projectId?: string
): Promise<TimesheetSummary> {
  // En producción, consultarías la base de datos
  const entries: TimeEntry[] = []; // Placeholder
  
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
  const totalHours = totalMinutes / 60;
  
  const billableEntries = entries.filter(e => e.billable);
  const billableMinutes = billableEntries.reduce((sum, e) => sum + e.duration, 0);
  const billableHours = billableMinutes / 60;
  
  const nonBillableHours = totalHours - billableHours;
  
  const totalAmount = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  
  // Agrupar por proyecto
  const byProjectMap = new Map<string, { projectName: string; hours: number; amount: number }>();
  entries.forEach(e => {
    const existing = byProjectMap.get(e.projectId) || { projectName: 'Project', hours: 0, amount: 0 };
    existing.hours += e.duration / 60;
    existing.amount += e.amount || 0;
    byProjectMap.set(e.projectId, existing);
  });
  
  const byProject = Array.from(byProjectMap.entries()).map(([projectId, data]) => ({
    projectId,
    projectName: data.projectName,
    hours: parseFloat(data.hours.toFixed(2)),
    amount: parseFloat(data.amount.toFixed(2)),
  }));
  
  // Agrupar por usuario
  const byUserMap = new Map<string, { userName: string; hours: number; amount: number }>();
  entries.forEach(e => {
    const existing = byUserMap.get(e.userId) || { userName: e.userName, hours: 0, amount: 0 };
    existing.hours += e.duration / 60;
    existing.amount += e.amount || 0;
    byUserMap.set(e.userId, existing);
  });
  
  const byUser = Array.from(byUserMap.entries()).map(([userId, data]) => ({
    userId,
    userName: data.userName,
    hours: parseFloat(data.hours.toFixed(2)),
    amount: parseFloat(data.amount.toFixed(2)),
  }));
  
  return {
    period: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
    totalHours: parseFloat(totalHours.toFixed(2)),
    billableHours: parseFloat(billableHours.toFixed(2)),
    nonBillableHours: parseFloat(nonBillableHours.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    entries,
    byProject,
    byUser,
  };
}

/**
 * Genera reporte de timesheet
 */
export function generateTimesheetReport(summary: TimesheetSummary): string {
  return `
# REPORTE DE HORAS
## Periodo: ${summary.period}

### Resumen
- **Total Horas:** ${summary.totalHours}h
- **Horas Facturables:** ${summary.billableHours}h
- **Horas No Facturables:** ${summary.nonBillableHours}h
- **Importe Total:** €${summary.totalAmount.toLocaleString()}

### Por Proyecto
${summary.byProject.map(p => `
#### ${p.projectName}
- Horas: ${p.hours}h
- Importe: €${p.amount.toLocaleString()}
`).join('')}

### Por Usuario
${summary.byUser.map(u => `
#### ${u.userName}
- Horas: ${u.hours}h
- Importe: €${u.amount.toLocaleString()}
`).join('')}
  `.trim();
}
