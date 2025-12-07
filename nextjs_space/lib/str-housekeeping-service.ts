/**
 * STR Housekeeping Service
 * Servicio completo para gestión de limpieza y turnover en propiedades STR
 */

import { prisma } from './db';
import { HousekeepingStatus, TurnoverType } from '@prisma/client';
import { addDays, addHours, differenceInHours, startOfDay, endOfDay } from 'date-fns';

// ==================== INTERFACES ====================

export interface CreateTaskInput {
  listingId: string;
  companyId: string;
  tipoTurnover: TurnoverType;
  fechaProgramada: Date;
  horaInicio?: Date;
  horaFin?: Date;
  staffId?: string;
  checklistId?: string;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  instruccionesEspeciales?: string;
  bookingId?: string;
}

export interface UpdateTaskInput {
  status?: HousekeepingStatus;
  staffId?: string;
  horaInicioReal?: Date;
  horaFinReal?: Date;
  fotosAntes?: string[];
  fotosDespues?: string[];
  problemasEncontrados?: string;
  articulosUsados?: Record<string, number>;
  calificacionCalidad?: number;
  notasInternas?: string;
}

export interface StaffInput {
  nombre: string;
  email?: string;
  telefono?: string;
  tipo: 'interno' | 'externo' | 'freelance';
  tarifaHora?: number;
  tarifaPorTurnover?: number;
  zonasTrabajo?: string[];
  especialidades?: string[];
  disponibilidad?: Record<string, any>;
  capacidadDiaria?: number;
}

export interface InventoryInput {
  nombre: string;
  categoria: 'amenity' | 'limpieza' | 'ropa_cama' | 'consumible' | 'herramienta';
  stockActual: number;
  stockMinimo: number;
  costoUnitario?: number;
  ubicacion?: string;
}

export interface ChecklistTemplateInput {
  nombre: string;
  descripcion?: string;
  tipo: TurnoverType;
  items: Array<{
    id: string;
    nombre: string;
    categoria: string;
    obligatorio: boolean;
    orden: number;
  }>;
  tiempoEstimadoMin?: number;
}

export interface TaskStats {
  totalTareas: number;
  pendientes: number;
  enProgreso: number;
  completadas: number;
  conIncidencias: number;
  tiempoPromedioCompletado: number;
  tasaCompletadoATiempo: number;
  costoPromedioPorTarea: number;
}

export interface StaffPerformance {
  staffId: string;
  nombreStaff: string;
  tareasCompletadas: number;
  tiempoPromedio: number;
  calificacionPromedio: number;
  tasaPuntualidad: number;
  incidenciasReportadas: number;
}

// ==================== TAREAS DE HOUSEKEEPING ====================

/**
 * Crea una nueva tarea de housekeeping/turnover
 */
export async function createHousekeepingTask(input: CreateTaskInput) {
  const { companyId, listingId, tipoTurnover, fechaProgramada, ...rest } = input;

  // Validar que el listing pertenece a la compañía
  const listing = await prisma.sTRListing.findFirst({
    where: { id: listingId, companyId },
    include: { unit: true }
  });

  if (!listing) {
    throw new Error('Listing no encontrado o no pertenece a esta compañía');
  }

  // Si hay checklist, cargarla
  let checklistData = null;
  if (rest.checklistId) {
    const checklist = await prisma.sTRHousekeepingChecklist.findUnique({
      where: { id: rest.checklistId }
    });
    if (checklist) {
      checklistData = checklist.items;
    }
  }

  // Calcular tiempo estimado basado en tipo de turnover
  const tiempoEstimado = calculateEstimatedTime(tipoTurnover, listing.unit?.habitaciones || 2);

  // Mapear prioridad de string a número
  const prioridadMap = { 'baja': 0, 'media': 0, 'alta': 1, 'urgente': 2 };
  const prioridadNum = prioridadMap[rest.prioridad || 'media'];

  // Crear la tarea
  const task = await prisma.sTRHousekeepingTask.create({
    data: {
      companyId,
      listingId,
      bookingId: rest.bookingId,
      tipo: tipoTurnover,
      status: HousekeepingStatus.pendiente,
      fechaProgramada: startOfDay(fechaProgramada),
      fechaInicio: rest.horaInicio,
      fechaFin: rest.horaFin,
      asignadoA: rest.staffId,
      instruccionesEspeciales: rest.instruccionesEspeciales,
      prioridad: prioridadNum,
      tiempoEstimadoMin: tiempoEstimado,
      checklistCompletado: checklistData ? JSON.parse(JSON.stringify(checklistData)) : null
    }
  });

  return task;
}

/**
 * Actualiza una tarea de housekeeping
 */
export async function updateHousekeepingTask(taskId: string, companyId: string, input: UpdateTaskInput) {
  // Verificar que la tarea pertenece a la compañía
  const existingTask = await prisma.sTRHousekeepingTask.findFirst({
    where: { id: taskId, companyId }
  });

  if (!existingTask) {
    throw new Error('Tarea no encontrada');
  }

  const updateData: any = {};

  if (input.status) {
    updateData.status = input.status;

    // Si se completa, calcular tiempo real y actualizar stats del staff
    if (input.status === HousekeepingStatus.completado && input.horaInicioReal && input.horaFinReal) {
      const tiempoReal = differenceInHours(input.horaFinReal, input.horaInicioReal) * 60;
      updateData.tiempoRealMin = tiempoReal;

      // Actualizar performance del staff
      if (existingTask.asignadoA && input.calificacionCalidad) {
        await updateStaffPerformance(existingTask.asignadoA, {
          tareasCompletadas: 1,
          calificacionPromedio: input.calificacionCalidad
        });
      }
    }
  }

  if (input.staffId) updateData.asignadoA = input.staffId;
  if (input.horaInicioReal) updateData.horaInicioReal = input.horaInicioReal;
  if (input.horaFinReal) updateData.horaFinReal = input.horaFinReal;
  if (input.fotosAntes) updateData.fotosAntes = input.fotosAntes;
  if (input.fotosDespues) updateData.fotosDespues = input.fotosDespues;
  if (input.problemasEncontrados) updateData.problemasEncontrados = input.problemasEncontrados;
  if (input.calificacionCalidad) updateData.calificacionCalidad = input.calificacionCalidad;
  if (input.notasInternas) updateData.notasInternas = input.notasInternas;

  // Procesar artículos usados y actualizar inventario
  if (input.articulosUsados) {
    updateData.articulosUsados = input.articulosUsados;
    await processInventoryUsage(companyId, input.articulosUsados);
  }

  const updatedTask = await prisma.sTRHousekeepingTask.update({
    where: { id: taskId },
    data: updateData,
    include: {
      listing: { include: { unit: true } },
      staff: true
    }
  });

  return updatedTask;
}

/**
 * Obtiene tareas de housekeeping con filtros
 */
export async function getHousekeepingTasks(
  companyId: string,
  filters?: {
    status?: HousekeepingStatus;
    staffId?: string;
    listingId?: string;
    fechaInicio?: Date;
    fechaFin?: Date;
    prioridad?: string;
  }
) {
  const where: any = { companyId };

  if (filters?.status) where.status = filters.status;
  if (filters?.staffId) where.staffId = filters.staffId;
  if (filters?.listingId) where.listingId = filters.listingId;
  if (filters?.prioridad) where.prioridad = filters.prioridad;

  if (filters?.fechaInicio && filters?.fechaFin) {
    where.fechaProgramada = {
      gte: startOfDay(filters.fechaInicio),
      lte: endOfDay(filters.fechaFin)
    };
  }

  const tasks = await prisma.sTRHousekeepingTask.findMany({
    where,
    include: {
      listing: {
        include: {
          unit: { include: { building: true } }
        }
      },
      staff: true,
      booking: true
    },
    orderBy: [
      { fechaProgramada: 'asc' },
      { prioridad: 'desc' }
    ]
  });

  return tasks;
}

/**
 * Obtiene estadísticas de housekeeping
 */
export async function getHousekeepingStats(companyId: string, fechaInicio?: Date, fechaFin?: Date): Promise<TaskStats> {
  const where: any = { companyId };

  if (fechaInicio && fechaFin) {
    where.fechaProgramada = {
      gte: startOfDay(fechaInicio),
      lte: endOfDay(fechaFin)
    };
  }

  const tasks = await prisma.sTRHousekeepingTask.findMany({ where });

  const totalTareas = tasks.length;
  const pendientes = tasks.filter(t => t.status === HousekeepingStatus.pendiente).length;
  const enProgreso = tasks.filter(t => t.status === HousekeepingStatus.en_progreso).length;
  const completadas = tasks.filter(t => t.status === HousekeepingStatus.completado).length;
  const conIncidencias = tasks.filter(t => t.status === HousekeepingStatus.incidencia).length;

  // Calcular tiempo promedio de completado
  const tareasConTiempo = tasks.filter(t => t.tiempoRealMin !== null && t.tiempoRealMin > 0);
  const tiempoPromedioCompletado = tareasConTiempo.length > 0
    ? tareasConTiempo.reduce((sum, t) => sum + (t.tiempoRealMin || 0), 0) / tareasConTiempo.length
    : 0;

  // Calcular tasa de completado a tiempo
  const tareasATiempo = tasks.filter(t =>
    t.status === HousekeepingStatus.completado &&
    t.tiempoRealMin !== null &&
    t.tiempoRealMin <= (t.tiempoEstimadoMin || 0)
  ).length;
  const tasaCompletadoATiempo = completadas > 0 ? (tareasATiempo / completadas) * 100 : 0;

  // Calcular costo promedio por tarea
  const tareasConCosto = tasks.filter(t => {
    const costoTotal = t.costoMateriales + t.costoManoObra;
    return costoTotal > 0;
  });
  const costoPromedioPorTarea = tareasConCosto.length > 0
    ? tareasConCosto.reduce((sum, t) => sum + (t.costoMateriales + t.costoManoObra), 0) / tareasConCosto.length
    : 0;

  return {
    totalTareas,
    pendientes,
    enProgreso,
    completadas,
    conIncidencias,
    tiempoPromedioCompletado: Math.round(tiempoPromedioCompletado),
    tasaCompletadoATiempo: Math.round(tasaCompletadoATiempo * 10) / 10,
    costoPromedioPorTarea: Math.round(costoPromedioPorTarea * 100) / 100
  };
}

// ==================== PERSONAL (STAFF) ====================

/**
 * Crea un nuevo miembro del personal de housekeeping
 */
export async function createHousekeepingStaff(companyId: string, input: StaffInput) {
  const staff = await prisma.sTRHousekeepingStaff.create({
    data: {
      companyId,
      nombre: input.nombre,
      email: input.email || null,
      telefono: input.telefono || '',
      tipo: input.tipo || 'interno',
      tarifaPorHora: input.tarifaHora || null,
      tarifaPorTurnover: input.tarifaPorTurnover || null,
      zonasTrabajo: input.zonasTrabajo || [],
      capacidadDiaria: input.capacidadDiaria || 4,
      activo: true
    }
  });

  return staff;
}

/**
 * Actualiza performance de un miembro del staff
 */
export async function updateStaffPerformance(
  staffId: string,
  performance: {
    tareasCompletadas?: number;
    calificacionPromedio?: number;
  }
) {
  const staff = await prisma.sTRHousekeepingStaff.findUnique({
    where: { id: staffId }
  });

  if (!staff) return;

  const updates: any = {};

  if (performance.tareasCompletadas) {
    updates.tareasCompletadas = (staff.tareasCompletadas || 0) + performance.tareasCompletadas;
  }

  if (performance.calificacionPromedio) {
    const totalCalificaciones = staff.tareasCompletadas || 1;
    const calificacionActual = staff.calificacionPromedio || 0;
    const nuevaCalificacion = (
      (calificacionActual * totalCalificaciones + performance.calificacionPromedio) /
      (totalCalificaciones + 1)
    );
    updates.calificacionPromedio = nuevaCalificacion;
  }

  if (Object.keys(updates).length > 0) {
    await prisma.sTRHousekeepingStaff.update({
      where: { id: staffId },
      data: updates
    });
  }
}

/**
 * Obtiene performance del personal
 */
export async function getStaffPerformance(companyId: string): Promise<StaffPerformance[]> {
  const staff = await prisma.sTRHousekeepingStaff.findMany({
    where: { companyId, activo: true },
    include: {
      _count: {
        select: { tasks: true }
      }
    }
  });

  const performance: StaffPerformance[] = await Promise.all(
    staff.map(async (s) => {
      const tareasCompletadas = await prisma.sTRHousekeepingTask.count({
        where: {
          asignadoA: s.id,
          status: HousekeepingStatus.completado
        }
      });

      const tareas = await prisma.sTRHousekeepingTask.findMany({
        where: {
          asignadoA: s.id,
          status: HousekeepingStatus.completado,
          tiempoRealMin: { not: null }
        },
        select: {
          tiempoRealMin: true,
          tiempoEstimadoMin: true
        }
      });

      const tiempoPromedio = tareas.length > 0
        ? tareas.reduce((sum, t) => sum + (t.tiempoRealMin || 0), 0) / tareas.length
        : 0;

      const tareasATiempo = tareas.filter(t =>
        t.tiempoRealMin && t.tiempoEstimadoMin &&
        t.tiempoRealMin <= t.tiempoEstimadoMin
      ).length;
      const tasaPuntualidad = tareas.length > 0 ? (tareasATiempo / tareas.length) * 100 : 0;

      const incidenciasReportadas = await prisma.sTRHousekeepingTask.count({
        where: {
          asignadoA: s.id,
          status: HousekeepingStatus.incidencia
        }
      });

      return {
        staffId: s.id,
        nombreStaff: s.nombre,
        tareasCompletadas,
        tiempoPromedio: Math.round(tiempoPromedio),
        calificacionPromedio: s.calificacionPromedio || 0,
        tasaPuntualidad: Math.round(tasaPuntualidad * 10) / 10,
        incidenciasReportadas
      };
    })
  );

  return performance.sort((a, b) => b.calificacionPromedio - a.calificacionPromedio);
}

// ==================== INVENTARIO ====================

/**
 * Crea un nuevo item de inventario
 */
export async function createInventoryItem(companyId: string, input: InventoryInput) {
  const item = await prisma.sTRHousekeepingInventory.create({
    data: {
      companyId,
      nombre: input.nombre,
      categoria: input.categoria,
      stockActual: input.stockActual,
      stockMinimo: input.stockMinimo,
      costoUnitario: input.costoUnitario || null,
      ubicacion: input.ubicacion || null,
      alertaStockBajo: input.stockActual <= input.stockMinimo
    }
  });

  return item;
}

/**
 * Procesa el uso de inventario de una tarea
 */
export async function processInventoryUsage(
  companyId: string,
  articulosUsados: Record<string, number>
) {
  for (const [itemId, cantidad] of Object.entries(articulosUsados)) {
    const item = await prisma.sTRHousekeepingInventory.findFirst({
      where: { id: itemId, companyId }
    });

    if (!item) continue;

    const nuevaCantidad = (item.stockActual || 0) - cantidad;

    await prisma.sTRHousekeepingInventory.update({
      where: { id: itemId },
      data: {
        stockActual: Math.max(0, nuevaCantidad),
        alertaStockBajo: nuevaCantidad <= (item.stockMinimo || 0)
      }
    });

    // Registrar movimiento
    await prisma.sTRInventoryMovement.create({
      data: {
        inventoryId: itemId,
        tipo: 'uso',
        cantidad: -cantidad,
        motivo: 'Uso en tarea de housekeeping'
      }
    });
  }
}

/**
 * Obtiene items de inventario con bajo stock
 */
export async function getLowStockItems(companyId: string) {
  const items = await prisma.sTRHousekeepingInventory.findMany({
    where: {
      companyId,
      alertaStockBajo: true
    },
    orderBy: {
      stockActual: 'asc'
    }
  });

  return items;
}

// ==================== CHECKLISTS ====================

/**
 * Crea un template de checklist
 */
export async function createChecklistTemplate(companyId: string, input: ChecklistTemplateInput) {
  const template = await prisma.sTRHousekeepingChecklist.create({
    data: {
      companyId,
      nombre: input.nombre,
      descripcion: input.descripcion || null,
      tipo: input.tipo,
      items: input.items,
      tiempoEstimadoMin: input.tiempoEstimadoMin || null,
      activo: true
    }
  });

  return template;
}

// ==================== UTILIDADES ====================

/**
 * Calcula tiempo estimado basado en tipo de turnover y capacidad
 */
function calculateEstimatedTime(tipo: TurnoverType, capacidad: number): number {
  const baseTime: Record<TurnoverType, number> = {
    check_out: 45,
    check_in: 30,
    limpieza_profunda: 120,
    mantenimiento: 60,
    inspeccion: 20
  };

  const base = baseTime[tipo] || 60;
  const multiplier = Math.max(1, capacidad / 2);

  return Math.round(base * multiplier);
}

/**
 * Genera tareas automáticas para las próximas reservas
 */
export async function generateAutomaticTasks(companyId: string, diasAnticipacion: number = 7) {
  const fechaFin = addDays(new Date(), diasAnticipacion);

  // Obtener reservas próximas
  const bookings = await prisma.sTRBooking.findMany({
    where: {
      companyId,
      estado: { in: ['CONFIRMADA', 'PENDIENTE'] },
      checkInDate: {
        gte: new Date(),
        lte: fechaFin
      }
    },
    include: {
      listing: true
    }
  });

  const tareasCreadas: any[] = [];

  for (const booking of bookings) {
    // Verificar si ya existe tarea para este booking
    const existingTasks = await prisma.sTRHousekeepingTask.findMany({
      where: {
        bookingId: booking.id
      }
    });

    // Si ya hay tareas creadas para este booking, saltar
    if (existingTasks.length > 0) continue;

    // Crear tarea de check-in
    const checkInTask = await createHousekeepingTask({
      companyId,
      listingId: booking.listingId,
      tipoTurnover: TurnoverType.check_in,
      fechaProgramada: booking.checkInDate,
      horaInicio: addHours(booking.checkInDate, -2),
      horaFin: booking.checkInDate,
      prioridad: 'alta',
      bookingId: booking.id
    });

    tareasCreadas.push(checkInTask);

    // Crear tarea de check-out
    const checkOutTask = await createHousekeepingTask({
      companyId,
      listingId: booking.listingId,
      tipoTurnover: TurnoverType.check_out,
      fechaProgramada: booking.checkOutDate,
      horaInicio: booking.checkOutDate,
      horaFin: addHours(booking.checkOutDate, 3),
      prioridad: 'alta',
      bookingId: booking.id
    });

    tareasCreadas.push(checkOutTask);
  }

  return tareasCreadas;
}
