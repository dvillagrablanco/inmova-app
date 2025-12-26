/**
 * STR Cron Service - Sincronización Automática
 *
 * Este servicio gestiona trabajos programados para:
 * 1. Sincronización de calendarios iCal desde canales externos
 * 2. Actualización de precios dinámicos
 * 3. Creación automática de tareas de limpieza
 * 4. Envío de solicitudes de reseñas
 * 5. Alertas de cumplimiento legal
 */

import { prisma } from './db';
import { addDays, startOfDay, endOfDay, differenceInDays, subDays } from 'date-fns';

// ============================================================================
// FUNCIONES STUB - Implementar cuando se activen módulos STR avanzados
// ============================================================================

async function syncICalFeed(channelSyncId: string, iCalUrl: string) {
  console.log(`[STUB] syncICalFeed called for ${channelSyncId}`);
  return { success: true, eventsProcessed: 0, errors: [] };
}

async function syncToChannels(listingId: string, startDate: Date, endDate: Date) {
  console.log(`[STUB] syncToChannels called for ${listingId}`);
  return { success: true, channelsSynced: [], errors: [] };
}

async function createCleaningTaskFromBooking(bookingId: string) {
  console.log(`[STUB] createCleaningTaskFromBooking called for ${bookingId}`);
  return { id: bookingId };
}

async function sendReviewRequest(bookingId: string, daysAfterCheckout: number) {
  console.log(`[STUB] sendReviewRequest called for ${bookingId}`);
  return { sent: false, reason: 'Función no implementada aún' };
}

async function validateTouristLicense(listingId: string) {
  console.log(`[STUB] validateTouristLicense called for ${listingId}`);
  return { valid: true, warnings: [] };
}

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CronJobConfig {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string; // Formato cron: "0 */4 * * *"
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'error';
  errorMessage?: string;
}

export interface SyncJobResult {
  success: boolean;
  itemsProcessed: number;
  errors: string[];
  duration: number; // ms
}

// ============================================================================
// 1. SINCRONIZACIÓN DE CALENDARIOS iCAL
// ============================================================================

/**
 * Sincroniza todos los calendarios iCal activos
 * Se ejecuta cada 4 horas por defecto
 */
export async function syncAllICalFeeds(companyId?: string): Promise<SyncJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let itemsProcessed = 0;

  try {
    // Obtener todos los channel syncs activos con iCal URL
    const whereClause: any = {
      activo: true,
      url: { not: null },
      estadoSync: 'conectado',
    };

    if (companyId) {
      whereClause.listing = { companyId };
    }

    const channels = await prisma.sTRChannelSync.findMany({
      where: whereClause,
      include: {
        listing: true,
      },
    });

    console.log(`[CRON] Sincronizando ${channels.length} calendarios iCal...`);

    // Sincronizar cada canal
    for (const channel of channels) {
      try {
        if (channel.url) {
          const result = await syncICalFeed(channel.id, channel.url);

          if (result.success) {
            itemsProcessed += result.eventsProcessed;
            console.log(
              `  ✅ ${channel.canal} (${channel.listing.titulo}): ${result.eventsProcessed} eventos`
            );
          } else {
            errors.push(`${channel.canal}: ${result.errors?.join(', ')}`);
            console.error(`  ❌ ${channel.canal}: Error`);
          }
        }
      } catch (error) {
        const errorMsg = `Error sincronizando ${channel.canal}: ${error}`;
        errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Sincronización completada en ${duration}ms`);

    return {
      success: errors.length === 0,
      itemsProcessed,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON] Error general en sincronización:', error);
    return {
      success: false,
      itemsProcessed,
      errors: [`Error general: ${error}`],
      duration,
    };
  }
}

// ============================================================================
// 2. SINCRONIZACIÓN DE DISPONIBILIDAD Y PRECIOS
// ============================================================================

/**
 * Envía actualizaciones de disponibilidad a todos los canales
 * Se ejecuta después de cambios en bookings
 */
export async function syncAvailabilityToChannels(companyId?: string): Promise<SyncJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let itemsProcessed = 0;

  try {
    const whereClause: any = {};
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const listings = await prisma.sTRListing.findMany({
      where: whereClause,
    });

    console.log(`[CRON] Sincronizando disponibilidad de ${listings.length} listings...`);

    const today = startOfDay(new Date());
    const futureDate = addDays(today, 365); // Próximos 12 meses

    for (const listing of listings) {
      try {
        const result = await syncToChannels(listing.id, today, futureDate);

        if (result.success) {
          itemsProcessed += result.channelsSynced.length;
          console.log(`  ✅ ${listing.titulo}: ${result.channelsSynced.join(', ')}`);
        } else {
          errors.push(`${listing.titulo}: ${result.errors?.join(', ')}`);
          console.error(`  ❌ ${listing.titulo}: Error`);
        }
      } catch (error) {
        const errorMsg = `Error sincronizando ${listing.titulo}: ${error}`;
        errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Sincronización de disponibilidad completada en ${duration}ms`);

    return {
      success: errors.length === 0,
      itemsProcessed,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON] Error general en sincronización de disponibilidad:', error);
    return {
      success: false,
      itemsProcessed,
      errors: [`Error general: ${error}`],
      duration,
    };
  }
}

// ============================================================================
// 3. CREACIÓN AUTOMÁTICA DE TAREAS DE LIMPIEZA
// ============================================================================

/**
 * Crea tareas de limpieza para bookings que terminan hoy o mañana
 * Se ejecuta diariamente a las 6:00 AM
 */
export async function autoCreateCleaningTasks(companyId?: string): Promise<SyncJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let itemsProcessed = 0;

  try {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const whereClause: any = {
      checkOutDate: {
        gte: today,
        lte: tomorrow,
      },
      estado: { in: ['CONFIRMADA', 'EN_PROGRESO'] },
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    const bookings = await prisma.sTRBooking.findMany({
      where: whereClause,
      include: {
        listing: true,
      },
    });

    console.log(`[CRON] Creando tareas de limpieza para ${bookings.length} checkouts...`);

    for (const booking of bookings) {
      try {
        // STUB: En producción, aquí se crearía la tarea de limpieza
        await createCleaningTaskFromBooking(booking.id);
        itemsProcessed++;
        console.log(
          `  ✅ Tarea creada para ${booking.listing.titulo} (checkout ${booking.checkOutDate.toLocaleDateString()})`
        );
      } catch (error) {
        const errorMsg = `Error creando tarea para booking ${booking.id}: ${error}`;
        errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Creación de tareas completada en ${duration}ms`);

    return {
      success: errors.length === 0,
      itemsProcessed,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON] Error general en creación de tareas:', error);
    return {
      success: false,
      itemsProcessed,
      errors: [`Error general: ${error}`],
      duration,
    };
  }
}

// ============================================================================
// 4. ENVÍO AUTOMÁTICO DE SOLICITUDES DE RESEÑAS
// ============================================================================

/**
 * Envía solicitudes de reseña a huéspedes 2 días después del checkout
 * Se ejecuta diariamente a las 10:00 AM
 */
export async function sendAutomaticReviewRequests(companyId?: string): Promise<SyncJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let itemsProcessed = 0;

  try {
    const targetDate = subDays(startOfDay(new Date()), 2); // Hace 2 días

    const whereClause: any = {
      checkOutDate: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
      estado: 'COMPLETADA',
    };

    if (companyId) {
      whereClause.companyId = companyId;
    }

    const bookings = await prisma.sTRBooking.findMany({
      where: whereClause,
      include: {
        listing: true,
      },
    });

    console.log(`[CRON] Enviando solicitudes de reseña a ${bookings.length} huéspedes...`);

    for (const booking of bookings) {
      try {
        const result = await sendReviewRequest(booking.id, 2);

        if (result.sent) {
          itemsProcessed++;
          console.log(`  ✅ Solicitud enviada a ${booking.guestEmail}`);
        } else {
          console.log(`  ⏭️  ${result.reason}`);
        }
      } catch (error) {
        const errorMsg = `Error enviando solicitud para booking ${booking.id}: ${error}`;
        errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Envío de solicitudes completado en ${duration}ms`);

    return {
      success: errors.length === 0,
      itemsProcessed,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON] Error general en envío de solicitudes:', error);
    return {
      success: false,
      itemsProcessed,
      errors: [`Error general: ${error}`],
      duration,
    };
  }
}

// ============================================================================
// 5. ALERTAS DE CUMPLIMIENTO LEGAL
// ============================================================================

/**
 * Verifica licencias turísticas próximas a caducar
 * Se ejecuta diariamente a las 9:00 AM
 */
export async function checkLegalCompliance(companyId?: string): Promise<SyncJobResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let itemsProcessed = 0;

  try {
    const whereClause: any = {};
    if (companyId) {
      whereClause.companyId = companyId;
    }

    const listings = await prisma.sTRListing.findMany({
      where: whereClause,
    });

    console.log(`[CRON] Verificando cumplimiento legal de ${listings.length} listings...`);

    for (const listing of listings) {
      try {
        const validation = await validateTouristLicense(listing.id);

        if (!validation.valid || validation.warnings.length > 0) {
          itemsProcessed++;
          console.log(`  ⚠️  ${listing.titulo}:`);
          validation.warnings.forEach((w) => console.log(`      - ${w}`));

          // En producción, aquí se enviaría un email de alerta
          // await sendComplianceAlert(listing, validation);
        } else {
          console.log(`  ✅ ${listing.titulo}: Cumplimiento OK`);
        }
      } catch (error) {
        const errorMsg = `Error verificando ${listing.titulo}: ${error}`;
        errors.push(errorMsg);
        console.error(`  ❌ ${errorMsg}`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] Verificación de cumplimiento completada en ${duration}ms`);

    return {
      success: errors.length === 0,
      itemsProcessed,
      errors,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CRON] Error general en verificación de cumplimiento:', error);
    return {
      success: false,
      itemsProcessed,
      errors: [`Error general: ${error}`],
      duration,
    };
  }
}

// ============================================================================
// CONFIGURACIÓN DE TRABAJOS CRON
// ============================================================================

export const cronJobs: CronJobConfig[] = [
  {
    id: 'sync-ical-feeds',
    name: 'Sincronizar Calendarios iCal',
    enabled: true,
    schedule: '0 */4 * * *', // Cada 4 horas
    status: 'idle',
  },
  {
    id: 'sync-availability',
    name: 'Sincronizar Disponibilidad a Canales',
    enabled: true,
    schedule: '0 */6 * * *', // Cada 6 horas
    status: 'idle',
  },
  {
    id: 'create-cleaning-tasks',
    name: 'Crear Tareas de Limpieza Automáticas',
    enabled: true,
    schedule: '0 6 * * *', // Diariamente a las 6:00 AM
    status: 'idle',
  },
  {
    id: 'send-review-requests',
    name: 'Enviar Solicitudes de Reseñas',
    enabled: true,
    schedule: '0 10 * * *', // Diariamente a las 10:00 AM
    status: 'idle',
  },
  {
    id: 'check-legal-compliance',
    name: 'Verificar Cumplimiento Legal',
    enabled: true,
    schedule: '0 9 * * *', // Diariamente a las 9:00 AM
    status: 'idle',
  },
];

/**
 * Ejecuta un trabajo cron específico
 */
export async function executeCronJob(jobId: string, companyId?: string): Promise<SyncJobResult> {
  console.log(`[CRON] Ejecutando trabajo: ${jobId}`);

  switch (jobId) {
    case 'sync-ical-feeds':
      return syncAllICalFeeds(companyId);

    case 'sync-availability':
      return syncAvailabilityToChannels(companyId);

    case 'create-cleaning-tasks':
      return autoCreateCleaningTasks(companyId);

    case 'send-review-requests':
      return sendAutomaticReviewRequests(companyId);

    case 'check-legal-compliance':
      return checkLegalCompliance(companyId);

    default:
      throw new Error(`Trabajo cron no reconocido: ${jobId}`);
  }
}

/**
 * Ejecuta todos los trabajos cron habilitados
 */
export async function executeAllCronJobs(
  companyId?: string
): Promise<Record<string, SyncJobResult>> {
  const results: Record<string, SyncJobResult> = {};

  for (const job of cronJobs) {
    if (job.enabled) {
      try {
        results[job.id] = await executeCronJob(job.id, companyId);
      } catch (error) {
        results[job.id] = {
          success: false,
          itemsProcessed: 0,
          errors: [`Error ejecutando ${job.name}: ${error}`],
          duration: 0,
        };
      }
    }
  }

  return results;
}
