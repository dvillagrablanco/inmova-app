/**
 * Servicio de Gestión de Órdenes de Trabajo para Operadores
 * 
 * Este servicio gestiona todas las operaciones relacionadas con las órdenes de trabajo
 * asignadas a operadores de campo, incluyendo check-in/check-out, actualización de estado,
 * adjuntar fotos, y reporte de finalización.
 * 
 * Nota: Adaptado para usar los campos del modelo ProviderWorkOrder existente
 */

import { prisma } from './db';
import { addHours, differenceInMinutes } from 'date-fns';

export interface WorkOrderCheckIn {
  workOrderId: string;
  operatorId: string;
  checkInTime: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

export interface WorkOrderCheckOut {
  workOrderId: string;
  operatorId: string;
  checkOutTime: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  workCompleted: boolean;
  completionNotes?: string;
  nextActions?: string;
}

export interface WorkReport {
  workOrderId: string;
  operatorId: string;
  description: string;
  timeSpent: number; // minutos (guardado como horasTrabajadas / 60)
  materials?: string[];
  photos?: string[];
  issuesFound?: string;
  recommendations?: string;
}

/**
 * Registra el check-in de un operador en una orden de trabajo
 * Usa fechaInicio del modelo existente
 */
export async function checkInWorkOrder(data: WorkOrderCheckIn) {
  const { workOrderId, operatorId, checkInTime } = data;

  // Verificar que la orden existe y está asignada al operador (providerId)
  const workOrder = await prisma.providerWorkOrder.findFirst({
    where: {
      id: workOrderId,
      providerId: operatorId,
    },
  });

  if (!workOrder) {
    throw new Error('Orden de trabajo no encontrada o no asignada a este operador');
  }

  // Actualizar orden con check-in (usando fechaInicio)
  const updated = await prisma.providerWorkOrder.update({
    where: { id: workOrderId },
    data: {
      estado: 'en_progreso',
      fechaInicio: checkInTime,
    },
  });

  return updated;
}

/**
 * Registra el check-out de un operador de una orden de trabajo
 * Usa fechaCompletado y horasTrabajadas del modelo existente
 */
export async function checkOutWorkOrder(data: WorkOrderCheckOut) {
  const { workOrderId, operatorId, checkOutTime, workCompleted, completionNotes } = data;

  // Verificar que la orden existe y está en progreso
  const workOrder = await prisma.providerWorkOrder.findFirst({
    where: {
      id: workOrderId,
      providerId: operatorId,
      estado: 'en_progreso',
    },
  });

  if (!workOrder) {
    throw new Error('Orden de trabajo no encontrada o no en progreso');
  }

  // Calcular tiempo dedicado en horas
  const horasTrabajadas = workOrder.fechaInicio
    ? differenceInMinutes(checkOutTime, workOrder.fechaInicio) / 60
    : 0;

  // Actualizar orden con check-out
  const updated = await prisma.providerWorkOrder.update({
    where: { id: workOrderId },
    data: {
      estado: workCompleted ? 'completada' : 'pausada',
      horasTrabajadas,
      comentarios: completionNotes || workOrder.comentarios,
      fechaCompletado: workCompleted ? checkOutTime : null,
    },
  });

  return updated;
}

/**
 * Obtiene órdenes de trabajo asignadas al operador para el día actual
 */
export async function getTodayWorkOrders(operatorId: string, companyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addHours(today, 24);

  const workOrders = await prisma.providerWorkOrder.findMany({
    where: {
      providerId: operatorId,
      companyId,
      OR: [
        {
          fechaAsignacion: {
            gte: today,
            lt: tomorrow,
          },
        },
        {
          fechaEstimada: {
            gte: today,
            lt: tomorrow,
          },
        },
        {
          estado: 'en_progreso',
        },
      ],
    },
    include: {
      building: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
        },
      },
      unit: {
        select: {
          id: true,
          numero: true,
        },
      },
    },
    orderBy: {
      fechaEstimada: 'asc',
    },
  });

  return workOrders;
}

/**
 * Obtiene el historial completo de órdenes de trabajo del operador
 */
export async function getOperatorWorkHistory(
  operatorId: string,
  companyId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    estado?: string;
    buildingId?: string;
  }
) {
  const where: any = {
    providerId: operatorId,
    companyId,
  };

  if (filters?.startDate || filters?.endDate) {
    where.fechaAsignacion = {};
    if (filters.startDate) where.fechaAsignacion.gte = filters.startDate;
    if (filters.endDate) where.fechaAsignacion.lte = filters.endDate;
  }

  if (filters?.estado) {
    where.estado = filters.estado;
  }

  if (filters?.buildingId) {
    where.buildingId = filters.buildingId;
  }

  const workOrders = await prisma.providerWorkOrder.findMany({
    where,
    include: {
      building: {
        select: {
          id: true,
          nombre: true,
          direccion: true,
        },
      },
      unit: {
        select: {
          id: true,
          numero: true,
        },
      },
    },
    orderBy: {
      fechaAsignacion: 'desc',
    },
  });

  return workOrders;
}

/**
 * Añade fotos a una orden de trabajo
 * Usa fotosAntes o fotosDespues según el estado
 */
export async function addWorkOrderPhotos(
  workOrderId: string,
  operatorId: string,
  photoUrls: string[]
) {
  // Verificar que la orden existe y está asignada al operador
  const workOrder = await prisma.providerWorkOrder.findFirst({
    where: {
      id: workOrderId,
      providerId: operatorId,
    },
  });

  if (!workOrder) {
    throw new Error('Orden de trabajo no encontrada o no asignada a este operador');
  }

  // Si la orden está completada, añadir a fotosDespues, si no a fotosAntes
  const isCompleted = workOrder.estado === 'completada';
  const existingPhotos = isCompleted ? workOrder.fotosDespues : workOrder.fotosAntes;
  const updatedPhotos = [...existingPhotos, ...photoUrls];

  // Actualizar orden
  const updated = await prisma.providerWorkOrder.update({
    where: { id: workOrderId },
    data: isCompleted
      ? { fotosDespues: updatedPhotos }
      : { fotosAntes: updatedPhotos },
  });

  return updated;
}

/**
 * Crea un reporte de trabajo completado
 */
export async function createWorkReport(data: WorkReport) {
  const { workOrderId, operatorId, description, timeSpent, materials, photos, issuesFound, recommendations } = data;

  // Verificar que la orden existe
  const workOrder = await prisma.providerWorkOrder.findFirst({
    where: {
      id: workOrderId,
      providerId: operatorId,
    },
  });

  if (!workOrder) {
    throw new Error('Orden de trabajo no encontrada');
  }

  // Preparar materiales usados
  const materialesUsados = materials
    ? materials.map((m) => ({ nombre: m, cantidad: 1, costo: 0 }))
    : undefined;

  // Actualizar orden con información del reporte
  const updated = await prisma.providerWorkOrder.update({
    where: { id: workOrderId },
    data: {
      descripcion: `${workOrder.descripcion}\n\n--- REPORTE DE TRABAJO ---\n${description}`,
      horasTrabajadas: timeSpent / 60, // Convertir minutos a horas
      ...(materialesUsados && { materialesUsados }),
      fotosDespues: photos || workOrder.fotosDespues,
      comentarios: issuesFound || recommendations
        ? `${issuesFound ? `Problemas: ${issuesFound}\n` : ''}${recommendations ? `Recomendaciones: ${recommendations}` : ''}`
        : workOrder.comentarios,
    },
  });

  return updated;
}

/**
 * Obtiene estadísticas del operador
 */
export async function getOperatorStats(operatorId: string, companyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Trabajos completados hoy
  const completedToday = await prisma.providerWorkOrder.count({
    where: {
      providerId: operatorId,
      companyId,
      estado: 'completada',
      fechaCompletado: {
        gte: today,
      },
    },
  });

  // Trabajos completados este mes
  const completedThisMonth = await prisma.providerWorkOrder.count({
    where: {
      providerId: operatorId,
      companyId,
      estado: 'completada',
      fechaCompletado: {
        gte: thisMonthStart,
      },
    },
  });

  // Trabajos pendientes
  const pending = await prisma.providerWorkOrder.count({
    where: {
      providerId: operatorId,
      companyId,
      estado: {
        in: ['asignada', 'pausada'],
      },
    },
  });

  // Trabajos en progreso
  const inProgress = await prisma.providerWorkOrder.count({
    where: {
      providerId: operatorId,
      companyId,
      estado: 'en_progreso',
    },
  });

  // Tiempo total dedicado este mes (en minutos)
  const workOrders = await prisma.providerWorkOrder.findMany({
    where: {
      providerId: operatorId,
      companyId,
      fechaCompletado: {
        gte: thisMonthStart,
      },
    },
    select: {
      horasTrabajadas: true,
    },
  });

  // horasTrabajadas está en horas, convertir a minutos para consistencia con la interfaz
  const totalTimeSpent = workOrders.reduce((acc, wo) => acc + ((wo.horasTrabajadas || 0) * 60), 0);

  return {
    completedToday,
    completedThisMonth,
    pending,
    inProgress,
    totalTimeSpent, // en minutos
  };
}

/**
 * Obtiene el historial completo de mantenimiento (todas las solicitudes de la empresa)
 * Nota: MaintenanceRequest solo tiene relación con Unit, no con Building directamente
 */
export async function getMaintenanceHistory(
  companyId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    estado?: string;
    buildingId?: string;
    prioridad?: string;
  }
) {
  // Primero necesitamos obtener los IDs de las unidades de la empresa
  // Unit no tiene companyId directamente, lo obtenemos a través de Building
  const units = await prisma.unit.findMany({
    where: {
      building: {
        companyId,
      },
    },
    select: { id: true },
  });

  const unitIds = units.map(u => u.id);

  const where: any = {
    unitId: {
      in: unitIds,
    },
  };

  if (filters?.startDate || filters?.endDate) {
    where.fechaSolicitud = {};
    if (filters.startDate) where.fechaSolicitud.gte = filters.startDate;
    if (filters.endDate) where.fechaSolicitud.lte = filters.endDate;
  }

  if (filters?.estado) {
    where.estado = filters.estado;
  }

  if (filters?.prioridad) {
    where.prioridad = filters.prioridad;
  }

  // Si se filtra por edificio, obtener unidades del edificio
  if (filters?.buildingId) {
    const buildingUnits = await prisma.unit.findMany({
      where: {
        buildingId: filters.buildingId,
      },
      select: { id: true },
    });
    
    const buildingUnitIds = buildingUnits.map(u => u.id);
    where.unitId = {
      in: buildingUnitIds,
    };
  }

  const maintenanceRequests = await prisma.maintenanceRequest.findMany({
    where,
    include: {
      unit: {
        select: {
          id: true,
          numero: true,
          building: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
            },
          },
        },
      },
    },
    orderBy: {
      fechaSolicitud: 'desc',
    },
    take: 100, // Limitar para rendimiento
  });

  return maintenanceRequests;
}
