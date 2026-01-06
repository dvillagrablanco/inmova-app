/**
 * SERVICIO DE CHECK-IN / CHECK-OUT DIGITAL
 * 
 * Gestión completa del proceso de entrada y salida para alquileres temporales
 */

import { prisma } from '../db';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { sendNotification } from './notification-service';

// ==========================================
// TIPOS
// ==========================================

export type CheckEventType = 'check_in' | 'check_out';
export type CheckEventStatus = 'scheduled' | 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface CheckEventConfig {
  type: CheckEventType;
  scheduledDate: Date;
  scheduledTime?: string; // HH:mm
  location?: string;
  attendees: {
    role: 'tenant' | 'owner' | 'agent' | 'other';
    userId: string;
    name: string;
    email: string;
    phone?: string;
    confirmed: boolean;
  }[];
  tasks: CheckTask[];
  notes?: string;
}

export interface CheckTask {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  evidence?: {
    photos?: string[];
    signature?: string;
    notes?: string;
  };
}

export interface KeyDelivery {
  keyType: 'main' | 'mailbox' | 'parking' | 'storage' | 'building' | 'other';
  quantity: number;
  delivered: boolean;
  deliveredAt?: Date;
  receivedBy?: string;
  notes?: string;
}

export interface MeterReading {
  meterType: 'electricity' | 'gas' | 'water';
  readingDate: Date;
  reading: number;
  unit: string;
  photo?: string;
  verified: boolean;
}

export interface CheckInData {
  contractId: string;
  eventDate: Date;
  eventTime?: string;
  keys: KeyDelivery[];
  meterReadings: MeterReading[];
  tasks: CheckTask[];
  inventory: {
    completed: boolean;
    items: any[];
    photos: string[];
  };
  signatures: {
    tenant?: { signature: string; signedAt: Date };
    owner?: { signature: string; signedAt: Date };
  };
  documents: {
    contractSigned: boolean;
    inventoryAcknowledged: boolean;
    rulesAccepted: boolean;
  };
  notes?: string;
}

export interface CheckOutData {
  contractId: string;
  eventDate: Date;
  eventTime?: string;
  keys: KeyDelivery[];
  meterReadings: MeterReading[];
  tasks: CheckTask[];
  inventoryComparison: {
    completed: boolean;
    items: any[];
    photos: string[];
    damages: {
      itemId: string;
      description: string;
      estimatedCost: number;
      photos: string[];
    }[];
    totalDamageCost: number;
  };
  cleaning: {
    status: 'clean' | 'acceptable' | 'needs_cleaning';
    cost?: number;
    photos: string[];
  };
  depositReturn: {
    originalAmount: number;
    deductions: {
      reason: string;
      amount: number;
    }[];
    finalAmount: number;
    paymentMethod?: string;
    paymentDate?: Date;
  };
  signatures: {
    tenant?: { signature: string; signedAt: Date };
    owner?: { signature: string; signedAt: Date };
  };
  notes?: string;
}

// ==========================================
// TAREAS PREDEFINIDAS
// ==========================================

const CHECK_IN_TASKS: Omit<CheckTask, 'completed' | 'completedAt' | 'completedBy' | 'evidence'>[] = [
  { id: 'verify_identity', name: 'Verificar identidad del inquilino', description: 'Comprobar DNI/NIE/Pasaporte', required: true },
  { id: 'sign_contract', name: 'Firmar contrato', description: 'Si no se firmó digitalmente', required: true },
  { id: 'collect_deposit', name: 'Recibir fianza', description: 'Confirmar pago de fianza y primer mes', required: true },
  { id: 'deliver_keys', name: 'Entregar llaves', description: 'Entregar todas las llaves y mandos', required: true },
  { id: 'meter_readings', name: 'Lectura de contadores', description: 'Anotar lecturas de luz, agua y gas', required: true },
  { id: 'inventory_check', name: 'Inventario de entrada', description: 'Revisar y documentar estado del inmueble', required: true },
  { id: 'explain_appliances', name: 'Explicar funcionamiento', description: 'Electrodomésticos, calefacción, etc.', required: false },
  { id: 'emergency_contacts', name: 'Compartir contactos', description: 'Números de emergencia y mantenimiento', required: false },
  { id: 'wifi_access', name: 'Acceso WiFi', description: 'Proporcionar datos de conexión', required: false },
  { id: 'building_rules', name: 'Normas del edificio', description: 'Explicar horarios, basuras, etc.', required: false },
];

const CHECK_OUT_TASKS: Omit<CheckTask, 'completed' | 'completedAt' | 'completedBy' | 'evidence'>[] = [
  { id: 'collect_keys', name: 'Recoger llaves', description: 'Recibir todas las llaves y mandos', required: true },
  { id: 'meter_readings', name: 'Lectura de contadores', description: 'Anotar lecturas finales', required: true },
  { id: 'inventory_comparison', name: 'Comparar inventario', description: 'Verificar estado vs. entrada', required: true },
  { id: 'check_damages', name: 'Revisar daños', description: 'Documentar desperfectos', required: true },
  { id: 'check_cleaning', name: 'Verificar limpieza', description: 'Estado general de limpieza', required: true },
  { id: 'collect_mail', name: 'Verificar correo', description: 'Asegurar que no queda correo pendiente', required: false },
  { id: 'cancel_utilities', name: 'Baja suministros', description: 'Si aplica, dar de baja', required: false },
  { id: 'calculate_deposit', name: 'Calcular devolución', description: 'Determinar fianza a devolver', required: true },
  { id: 'sign_checkout', name: 'Firmar acta de salida', description: 'Documento de fin de contrato', required: true },
];

// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================

/**
 * Programa un evento de check-in o check-out
 */
export async function scheduleCheckEvent(
  config: CheckEventConfig
): Promise<{ eventId: string; confirmationUrl: string }> {
  // Crear tareas basadas en el tipo
  const baseTasks = config.type === 'check_in' ? CHECK_IN_TASKS : CHECK_OUT_TASKS;
  const tasks = baseTasks.map(t => ({
    ...t,
    completed: false,
  }));

  // Combinar con tareas personalizadas
  const allTasks = [...tasks, ...config.tasks];

  // Crear evento en BD
  const event = await prisma.checkEvent.create({
    data: {
      contractId: config.type === 'check_in' 
        ? (await findContractByScheduledDate(config.scheduledDate, 'inicio'))?.id 
        : (await findContractByScheduledDate(config.scheduledDate, 'fin'))?.id,
      type: config.type,
      status: 'scheduled',
      scheduledDate: config.scheduledDate,
      scheduledTime: config.scheduledTime,
      location: config.location,
      attendees: config.attendees,
      tasks: allTasks,
      notes: config.notes,
    },
  });

  // Enviar notificaciones a los asistentes
  for (const attendee of config.attendees) {
    await sendNotification({
      recipientId: attendee.userId,
      recipientEmail: attendee.email,
      recipientPhone: attendee.phone,
      recipientName: attendee.name,
      contractId: event.contractId || '',
      type: 'inventory_pending',
      data: {
        inventoryType: config.type === 'check_in' ? 'entrada' : 'salida',
        inventoryDate: format(config.scheduledDate, "d 'de' MMMM", { locale: es }),
        inventoryTime: config.scheduledTime || 'Por confirmar',
        propertyAddress: config.location,
        confirmUrl: `${process.env.NEXTAUTH_URL}/portal/check-events/${event.id}/confirm`,
      },
    });
  }

  return {
    eventId: event.id,
    confirmationUrl: `${process.env.NEXTAUTH_URL}/portal/check-events/${event.id}`,
  };
}

/**
 * Confirma asistencia a un evento
 */
export async function confirmAttendance(
  eventId: string,
  attendeeEmail: string,
  confirmed: boolean
): Promise<void> {
  const event = await prisma.checkEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error('Evento no encontrado');

  const attendees = (event.attendees as any[]) || [];
  const updatedAttendees = attendees.map(a => 
    a.email === attendeeEmail ? { ...a, confirmed } : a
  );

  const allConfirmed = updatedAttendees.every(a => a.confirmed);

  await prisma.checkEvent.update({
    where: { id: eventId },
    data: {
      attendees: updatedAttendees,
      status: allConfirmed ? 'confirmed' : 'pending_confirmation',
    },
  });
}

/**
 * Inicia el proceso de check-in
 */
export async function startCheckIn(eventId: string): Promise<{ sessionId: string }> {
  const event = await prisma.checkEvent.findUnique({
    where: { id: eventId },
    include: {
      contract: {
        include: {
          unit: { include: { building: true } },
          tenant: true,
        },
      },
    },
  });

  if (!event) throw new Error('Evento no encontrado');
  if (event.type !== 'check_in') throw new Error('Este evento no es un check-in');

  await prisma.checkEvent.update({
    where: { id: eventId },
    data: {
      status: 'in_progress',
      startedAt: new Date(),
    },
  });

  // Crear sesión de check-in
  return { sessionId: `checkin-${eventId}-${Date.now()}` };
}

/**
 * Registra una tarea completada
 */
export async function completeTask(
  eventId: string,
  taskId: string,
  evidence?: {
    photos?: string[];
    signature?: string;
    notes?: string;
  }
): Promise<void> {
  const event = await prisma.checkEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error('Evento no encontrado');

  const tasks = (event.tasks as CheckTask[]) || [];
  const updatedTasks = tasks.map(t => 
    t.id === taskId
      ? {
          ...t,
          completed: true,
          completedAt: new Date(),
          evidence,
        }
      : t
  );

  await prisma.checkEvent.update({
    where: { id: eventId },
    data: { tasks: updatedTasks },
  });
}

/**
 * Registra entrega/recogida de llaves
 */
export async function recordKeyDelivery(
  eventId: string,
  keys: KeyDelivery[]
): Promise<void> {
  await prisma.checkEvent.update({
    where: { id: eventId },
    data: {
      keyDeliveries: keys,
    },
  });
}

/**
 * Registra lecturas de contadores
 */
export async function recordMeterReadings(
  eventId: string,
  readings: MeterReading[]
): Promise<void> {
  await prisma.checkEvent.update({
    where: { id: eventId },
    data: {
      meterReadings: readings,
    },
  });
}

/**
 * Captura firma digital
 */
export async function captureSignature(
  eventId: string,
  role: 'tenant' | 'owner',
  signatureData: string // Base64 de la imagen de firma
): Promise<void> {
  const event = await prisma.checkEvent.findUnique({
    where: { id: eventId },
  });

  if (!event) throw new Error('Evento no encontrado');

  const signatures = (event.signatures as any) || {};
  signatures[role] = {
    signature: signatureData,
    signedAt: new Date(),
  };

  await prisma.checkEvent.update({
    where: { id: eventId },
    data: { signatures },
  });
}

/**
 * Finaliza el check-in
 */
export async function completeCheckIn(
  eventId: string,
  checkInData: CheckInData
): Promise<{ success: boolean; documentUrl?: string }> {
  const event = await prisma.checkEvent.findUnique({
    where: { id: eventId },
    include: {
      contract: true,
    },
  });

  if (!event) throw new Error('Evento no encontrado');

  // Verificar que todas las tareas requeridas están completadas
  const tasks = (event.tasks as CheckTask[]) || [];
  const incompleteTasks = tasks.filter(t => t.required && !t.completed);

  if (incompleteTasks.length > 0) {
    throw new Error(`Tareas pendientes: ${incompleteTasks.map(t => t.name).join(', ')}`);
  }

  // Actualizar evento
  await prisma.checkEvent.update({
    where: { id: eventId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      checkInData,
      keyDeliveries: checkInData.keys,
      meterReadings: checkInData.meterReadings,
      signatures: checkInData.signatures,
    },
  });

  // Actualizar contrato
  if (event.contract) {
    await prisma.contract.update({
      where: { id: event.contract.id },
      data: {
        estadoInventario: 'entrada_completado',
        inventarioEntrada: checkInData.inventory,
        fotosEntrada: checkInData.inventory.photos,
        fechaInventarioEntrada: new Date(),
        checklistEntradaPath: `/documents/checkin-${eventId}.pdf`,
      },
    });
  }

  // Enviar notificación de bienvenida
  if (event.contract) {
    await sendNotification({
      recipientId: event.contract.tenantId,
      recipientEmail: '', // Se obtiene del tenant
      recipientName: '',
      contractId: event.contract.id,
      type: 'welcome_message',
      data: {},
    });
  }

  return {
    success: true,
    documentUrl: `/api/contracts/${event.contractId}/checkin-report`,
  };
}

/**
 * Finaliza el check-out y calcula devolución de fianza
 */
export async function completeCheckOut(
  eventId: string,
  checkOutData: CheckOutData
): Promise<{
  success: boolean;
  depositReturn: {
    originalAmount: number;
    deductions: { reason: string; amount: number }[];
    finalAmount: number;
  };
}> {
  const event = await prisma.checkEvent.findUnique({
    where: { id: eventId },
    include: {
      contract: {
        include: {
          tenant: true,
        },
      },
    },
  });

  if (!event) throw new Error('Evento no encontrado');

  // Calcular devolución de fianza
  const deductions: { reason: string; amount: number }[] = [];

  // Daños en inventario
  if (checkOutData.inventoryComparison.totalDamageCost > 0) {
    deductions.push({
      reason: 'Daños en inventario',
      amount: checkOutData.inventoryComparison.totalDamageCost,
    });
  }

  // Limpieza
  if (checkOutData.cleaning.status === 'needs_cleaning' && checkOutData.cleaning.cost) {
    deductions.push({
      reason: 'Limpieza del inmueble',
      amount: checkOutData.cleaning.cost,
    });
  }

  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const finalAmount = Math.max(0, checkOutData.depositReturn.originalAmount - totalDeductions);

  // Actualizar datos de devolución
  checkOutData.depositReturn = {
    ...checkOutData.depositReturn,
    deductions,
    finalAmount,
  };

  // Actualizar evento
  await prisma.checkEvent.update({
    where: { id: eventId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      checkOutData,
      keyDeliveries: checkOutData.keys,
      meterReadings: checkOutData.meterReadings,
      signatures: checkOutData.signatures,
    },
  });

  // Actualizar contrato
  if (event.contract) {
    await prisma.contract.update({
      where: { id: event.contract.id },
      data: {
        estadoInventario: 'salida_completado',
        inventarioSalida: checkOutData.inventoryComparison,
        fotosSalida: checkOutData.inventoryComparison.photos,
        fechaInventarioSalida: new Date(),
        incidenciasInventario: checkOutData.inventoryComparison.damages,
        importeIncidencias: checkOutData.inventoryComparison.totalDamageCost,
        checklistSalidaPath: `/documents/checkout-${eventId}.pdf`,
        status: 'finalizado',
      },
    });

    // Crear registro de devolución de fianza
    await prisma.depositReturn.create({
      data: {
        contractId: event.contract.id,
        tenantId: event.contract.tenantId,
        originalAmount: checkOutData.depositReturn.originalAmount,
        deductions,
        finalAmount,
        status: 'pending',
      },
    });

    // Enviar notificación de fin de estancia
    await sendNotification({
      recipientId: event.contract.tenantId,
      recipientEmail: event.contract.tenant.email,
      recipientName: event.contract.tenant.nombre,
      contractId: event.contract.id,
      type: 'goodbye_message',
      data: {
        depositStatus: finalAmount > 0 ? 'pending' : 'no_return',
        depositReturnAmount: finalAmount,
      },
    });
  }

  return {
    success: true,
    depositReturn: {
      originalAmount: checkOutData.depositReturn.originalAmount,
      deductions,
      finalAmount,
    },
  };
}

/**
 * Genera enlace de check-in remoto (para self check-in)
 */
export async function generateSelfCheckInLink(
  contractId: string,
  expiresIn: number = 24 * 60 // minutos
): Promise<{ url: string; expiresAt: Date; accessCode: string }> {
  const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const expiresAt = addMinutes(new Date(), expiresIn);

  await prisma.selfCheckInToken.create({
    data: {
      contractId,
      accessCode,
      expiresAt,
      used: false,
    },
  });

  return {
    url: `${process.env.NEXTAUTH_URL}/self-checkin/${contractId}?code=${accessCode}`,
    expiresAt,
    accessCode,
  };
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

async function findContractByScheduledDate(
  date: Date,
  dateType: 'inicio' | 'fin'
): Promise<any> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return prisma.contract.findFirst({
    where: {
      [dateType === 'inicio' ? 'fechaInicio' : 'fechaFin']: {
        gte: startOfDay,
        lte: endOfDay,
      },
      tipoArrendamiento: 'temporada',
    },
  });
}

export default {
  CHECK_IN_TASKS,
  CHECK_OUT_TASKS,
  scheduleCheckEvent,
  confirmAttendance,
  startCheckIn,
  completeTask,
  recordKeyDelivery,
  recordMeterReadings,
  captureSignature,
  completeCheckIn,
  completeCheckOut,
  generateSelfCheckInLink,
};
