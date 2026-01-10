/**
 * Scheduler de llamadas outbound
 * 
 * Gestiona la cola de llamadas salientes con:
 * - Retraso aleatorio entre llamadas (2-10 min)
 * - Respeto de horarios comerciales
 * - Límite de llamadas simultáneas
 * - Reintentos automáticos
 */

import { triggerOutboundCall, canCallLead } from './outbound-caller';

// Configuración
const MIN_DELAY_MINUTES = 2;
const MAX_DELAY_MINUTES = 10;
const MAX_CONCURRENT_CALLS = 1; // Llamadas simultáneas
const BATCH_SIZE = 10; // Leads a procesar por ciclo

// Estado del scheduler
let isRunning = false;
let currentCalls = 0;

/**
 * Calcula un retraso aleatorio en milisegundos
 */
function getRandomDelay(): number {
  const minutes = MIN_DELAY_MINUTES + Math.random() * (MAX_DELAY_MINUTES - MIN_DELAY_MINUTES);
  return Math.round(minutes * 60 * 1000);
}

/**
 * Espera un tiempo determinado
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Obtiene leads pendientes de llamar
 */
async function getPendingLeads(limit: number = BATCH_SIZE) {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  return prisma.lead.findMany({
    where: {
      outboundStatus: 'NEW',
      telefono: { not: null },
      outboundCallScheduledAt: {
        lte: new Date(), // Programados para ahora o antes
      },
      outboundCallAttempts: { lt: 3 }, // Menos de 3 intentos
    },
    orderBy: [
      { outboundCallScheduledAt: 'asc' }, // Más antiguos primero
      { createdAt: 'asc' },
    ],
    take: limit,
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      telefono: true,
      email: true,
      empresa: true,
      cargo: true,
      linkedinUrl: true,
      enrichmentData: true,
      outboundStatus: true,
      outboundCallAttempts: true,
    },
  });
}

/**
 * Reprograma un lead para más tarde
 */
async function rescheduleLead(leadId: string, reason: string) {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  // Programar para mañana a las 9:00 si es fin de semana o fuera de horario
  const tomorrow9am = new Date();
  tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  tomorrow9am.setHours(9, 0, 0, 0);

  // Si es viernes después de las 20:00, programar para lunes
  const dayOfWeek = tomorrow9am.getDay();
  if (dayOfWeek === 0) { // Domingo
    tomorrow9am.setDate(tomorrow9am.getDate() + 1);
  } else if (dayOfWeek === 6) { // Sábado
    tomorrow9am.setDate(tomorrow9am.getDate() + 2);
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      outboundCallScheduledAt: tomorrow9am,
      outboundNotes: `Reprogramado: ${reason}`,
    },
  });

  console.log('[Outbound Scheduler] Lead rescheduled:', {
    leadId,
    reason,
    newSchedule: tomorrow9am,
  });
}

/**
 * Procesa un lead individual
 */
async function processLead(lead: Awaited<ReturnType<typeof getPendingLeads>>[0]): Promise<boolean> {
  // Verificar si se puede llamar
  const { canCall, reason } = canCallLead(lead as any);
  
  if (!canCall) {
    console.log('[Outbound Scheduler] Cannot call lead:', {
      leadId: lead.id,
      reason,
    });
    
    if (reason === 'Weekend' || reason === 'Outside business hours') {
      await rescheduleLead(lead.id, reason);
    }
    
    return false;
  }

  // Disparar llamada
  console.log('[Outbound Scheduler] Calling lead:', {
    leadId: lead.id,
    name: `${lead.nombre} ${lead.apellidos || ''}`,
    company: lead.empresa,
  });

  currentCalls++;
  
  try {
    const result = await triggerOutboundCall(lead as any);
    
    if (result.success) {
      console.log('[Outbound Scheduler] Call initiated:', {
        leadId: lead.id,
        callId: result.callId,
      });
      return true;
    } else {
      console.error('[Outbound Scheduler] Call failed:', {
        leadId: lead.id,
        error: result.error,
      });
      
      // Actualizar estado de error
      const { getPrismaClient } = await import('@/lib/db');
      const prisma = getPrismaClient();
      
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          outboundCallAttempts: { increment: 1 },
          outboundLastAttemptAt: new Date(),
          outboundNotes: `Error: ${result.error}`,
        },
      });
      
      return false;
    }
  } finally {
    currentCalls--;
  }
}

/**
 * Ejecuta un ciclo del scheduler
 */
async function runCycle(): Promise<number> {
  const leads = await getPendingLeads();
  
  if (leads.length === 0) {
    return 0;
  }

  console.log('[Outbound Scheduler] Processing batch:', {
    count: leads.length,
    currentCalls,
  });

  let processed = 0;

  for (const lead of leads) {
    // Verificar límite de llamadas simultáneas
    while (currentCalls >= MAX_CONCURRENT_CALLS) {
      await sleep(1000); // Esperar 1 segundo
    }

    const success = await processLead(lead);
    if (success) {
      processed++;
      
      // Esperar entre llamadas para no parecer spam
      const delay = getRandomDelay();
      console.log('[Outbound Scheduler] Waiting before next call:', {
        delaySeconds: Math.round(delay / 1000),
      });
      await sleep(delay);
    }
  }

  return processed;
}

/**
 * Inicia el scheduler de llamadas outbound
 */
export async function scheduleOutboundCalls(): Promise<void> {
  if (isRunning) {
    console.log('[Outbound Scheduler] Already running');
    return;
  }

  isRunning = true;
  console.log('[Outbound Scheduler] Starting...');

  try {
    const processed = await runCycle();
    console.log('[Outbound Scheduler] Cycle completed:', { processed });
  } catch (error) {
    console.error('[Outbound Scheduler] Error:', error);
  } finally {
    isRunning = false;
  }
}

/**
 * Programa un lead específico para llamada
 */
export async function scheduleLeadCall(
  leadId: string, 
  delayMinutes?: number
): Promise<Date> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  // Calcular tiempo de llamada
  const delay = delayMinutes 
    ? delayMinutes * 60 * 1000
    : getRandomDelay();
  
  const scheduledAt = new Date(Date.now() + delay);

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      outboundStatus: 'NEW',
      outboundCallScheduledAt: scheduledAt,
    },
  });

  console.log('[Outbound Scheduler] Lead scheduled:', {
    leadId,
    scheduledAt,
    delayMinutes: Math.round(delay / 60000),
  });

  return scheduledAt;
}

/**
 * Cancela llamada programada para un lead
 */
export async function cancelScheduledCall(leadId: string): Promise<void> {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      outboundStatus: 'REJECTED',
      outboundCallScheduledAt: null,
      outboundNotes: 'Llamada cancelada manualmente',
    },
  });

  console.log('[Outbound Scheduler] Call cancelled:', { leadId });
}

/**
 * Obtiene estadísticas del scheduler
 */
export async function getSchedulerStats() {
  const { getPrismaClient } = await import('@/lib/db');
  const prisma = getPrismaClient();

  const [pending, contacted, qualified, rejected, incomplete] = await Promise.all([
    prisma.lead.count({ where: { outboundStatus: 'NEW' } }),
    prisma.lead.count({ where: { outboundStatus: 'CONTACTED' } }),
    prisma.lead.count({ where: { outboundStatus: 'QUALIFIED' } }),
    prisma.lead.count({ where: { outboundStatus: 'REJECTED' } }),
    prisma.lead.count({ where: { outboundStatus: 'INCOMPLETE' } }),
  ]);

  const scheduledToday = await prisma.lead.count({
    where: {
      outboundStatus: 'NEW',
      outboundCallScheduledAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  });

  return {
    isRunning,
    currentCalls,
    stats: {
      pending,
      contacted,
      qualified,
      rejected,
      incomplete,
      scheduledToday,
    },
  };
}
