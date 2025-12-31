'use server';

/**
 * 🚀 INMOVA AUTO-GROWTH ENGINE
 * Server Actions para gestionar contenido automático en redes sociales
 */

import { prisma } from '@/lib/db';
import { SocialPlatform, SocialPostStatus, SocialPostTopic } from '@prisma/client';

interface WeeklyContentPlan {
  topic: SocialPostTopic;
  platform: SocialPlatform;
  scheduledAt: Date;
  imagePrompt: string;
}

/**
 * Genera plan de contenido para la próxima semana
 *
 * Calendario:
 * - LinkedIn: Lunes, Miércoles, Viernes (9:00 AM)
 * - X: Martes, Jueves (12:00 PM)
 * - Instagram: Lunes, Jueves (6:00 PM)
 *
 * Total: 7 posts/semana
 */
export async function generateWeeklyContent(userId?: string) {
  try {
    const now = new Date();
    const nextWeek = getNextWeekDates();

    // Definir plan de contenido
    const contentPlan: WeeklyContentPlan[] = [
      // LUNES
      {
        topic: 'AUTOMATIZACION' as SocialPostTopic,
        platform: 'LINKEDIN' as SocialPlatform,
        scheduledAt: nextWeek.monday9AM,
        imagePrompt: 'Dashboard con gráfico de barras ascendente verde mostrando ahorro de tiempo',
      },
      {
        topic: 'ROI_INMOBILIARIO' as SocialPostTopic,
        platform: 'INSTAGRAM' as SocialPlatform,
        scheduledAt: nextWeek.monday6PM,
        imagePrompt: 'Notificación móvil: "✅ Alquiler c/Goya: Cobrado 1,200€"',
      },

      // MARTES
      {
        topic: 'TIEMPO_LIBERTAD' as SocialPostTopic,
        platform: 'X' as SocialPlatform,
        scheduledAt: nextWeek.tuesday12PM,
        imagePrompt: 'Mockup de móvil con dashboard simplificado',
      },

      // MIÉRCOLES
      {
        topic: 'GESTION_ALQUILERES' as SocialPostTopic,
        platform: 'LINKEDIN' as SocialPlatform,
        scheduledAt: nextWeek.wednesday9AM,
        imagePrompt: 'Panel de control con propiedades y estados de pago',
      },

      // JUEVES
      {
        topic: 'ESCALABILIDAD' as SocialPostTopic,
        platform: 'X' as SocialPlatform,
        scheduledAt: nextWeek.thursday12PM,
        imagePrompt: 'Gráfico simple: 5 propiedades → 50 propiedades',
      },
      {
        topic: 'COLIVING' as SocialPostTopic,
        platform: 'INSTAGRAM' as SocialPlatform,
        scheduledAt: nextWeek.thursday6PM,
        imagePrompt: 'Interfaz moderna de gestión de espacios compartidos',
      },

      // VIERNES
      {
        topic: 'FIRMA_DIGITAL' as SocialPostTopic,
        platform: 'LINKEDIN' as SocialPlatform,
        scheduledAt: nextWeek.friday9AM,
        imagePrompt: 'Notificación: "📝 Contrato firmado digitalmente"',
      },
    ];

    // Crear posts en BD con estado DRAFT (el copywriter los completará)
    const createdPosts = await prisma.socialPost.createMany({
      data: contentPlan.map((plan) => ({
        topic: plan.topic,
        platform: plan.platform,
        scheduledAt: plan.scheduledAt,
        imagePrompt: plan.imagePrompt,
        content: '', // Se generará con IA en el siguiente paso
        status: 'DRAFT' as SocialPostStatus,
        createdBy: userId,
      })),
    });

    console.log(`[Auto-Growth] ✅ Generados ${createdPosts.count} posts para la semana`);

    return {
      success: true,
      count: createdPosts.count,
      message: `${createdPosts.count} posts programados para la próxima semana`,
    };
  } catch (error) {
    console.error('[Auto-Growth] Error generando contenido:', error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Obtiene los posts pendientes de generar contenido (DRAFT sin content)
 */
export async function getPendingDraftPosts() {
  try {
    const posts = await prisma.socialPost.findMany({
      where: {
        status: 'DRAFT',
        content: '',
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
    });

    return { success: true, posts };
  } catch (error) {
    console.error('[Auto-Growth] Error obteniendo drafts:', error);
    return { success: false, error: String(error), posts: [] };
  }
}

/**
 * Obtiene posts programados para publicar
 */
export async function getScheduledPosts() {
  try {
    const posts = await prisma.socialPost.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: new Date() },
        webhookSent: false,
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    return { success: true, posts };
  } catch (error) {
    console.error('[Auto-Growth] Error obteniendo scheduled posts:', error);
    return { success: false, error: String(error), posts: [] };
  }
}

/**
 * Marca un post como publicado
 */
export async function markPostAsPublished(postId: string) {
  try {
    const post = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        webhookSent: true,
      },
    });

    return { success: true, post };
  } catch (error) {
    console.error('[Auto-Growth] Error marcando post como publicado:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Marca un post como fallido
 */
export async function markPostAsFailed(postId: string, errorMessage: string) {
  try {
    const post = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        status: 'FAILED',
        errorLog: errorMessage,
      },
    });

    return { success: true, post };
  } catch (error) {
    console.error('[Auto-Growth] Error marcando post como fallido:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Actualiza el contenido de un post (llamado por el copywriter)
 */
export async function updatePostContent(postId: string, content: string, imageUrl?: string) {
  try {
    const post = await prisma.socialPost.update({
      where: { id: postId },
      data: {
        content,
        imageUrl,
        status: 'SCHEDULED', // Cambia de DRAFT a SCHEDULED
      },
    });

    return { success: true, post };
  } catch (error) {
    console.error('[Auto-Growth] Error actualizando post:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Obtiene estadísticas de posts
 */
export async function getPostStats() {
  try {
    const [total, draft, scheduled, published, failed] = await Promise.all([
      prisma.socialPost.count(),
      prisma.socialPost.count({ where: { status: 'DRAFT' } }),
      prisma.socialPost.count({ where: { status: 'SCHEDULED' } }),
      prisma.socialPost.count({ where: { status: 'PUBLISHED' } }),
      prisma.socialPost.count({ where: { status: 'FAILED' } }),
    ]);

    return {
      success: true,
      stats: { total, draft, scheduled, published, failed },
    };
  } catch (error) {
    console.error('[Auto-Growth] Error obteniendo stats:', error);
    return { success: false, error: String(error) };
  }
}

// ============================================
// HELPERS
// ============================================

function getNextWeekDates() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domingo, 1 = lunes, ...
  const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

  const nextMonday = new Date(now);
  nextMonday.setDate(now.getDate() + daysUntilNextMonday);

  return {
    // Lunes
    monday9AM: setTime(new Date(nextMonday), 9, 0),
    monday6PM: setTime(new Date(nextMonday), 18, 0),

    // Martes
    tuesday12PM: setTime(addDays(new Date(nextMonday), 1), 12, 0),

    // Miércoles
    wednesday9AM: setTime(addDays(new Date(nextMonday), 2), 9, 0),

    // Jueves
    thursday12PM: setTime(addDays(new Date(nextMonday), 3), 12, 0),
    thursday6PM: setTime(addDays(new Date(nextMonday), 3), 18, 0),

    // Viernes
    friday9AM: setTime(addDays(new Date(nextMonday), 4), 9, 0),
  };
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
