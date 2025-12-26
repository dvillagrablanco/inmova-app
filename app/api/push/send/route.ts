import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendPushNotification } from '@/lib/push-service';
import logger from '@/lib/logger';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/push/send
 * Envía una notificación push a uno o más usuarios
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      userIds, // Array de IDs de usuarios o 'all'
      title,
      body: messageBody,
      url,
      icon,
      tag,
      requireInteraction,
      metadata,
    } = body;

    if (!title || !messageBody) {
      return NextResponse.json({ error: 'Título y mensaje son requeridos' }, { status: 400 });
    }

    const notification = {
      title,
      body: messageBody,
      url: url || '/',
      icon: icon || '/icon-192x192.png',
      tag: tag || 'default',
      requireInteraction: requireInteraction || false,
      metadata: metadata || {},
    };

    let targetUserIds: string[] = [];

    if (userIds === 'all') {
      // Enviar a todos los usuarios de la compañía
      const users = await prisma.user.findMany({
        where: { companyId: session.user.companyId },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    } else if (Array.isArray(userIds)) {
      targetUserIds = userIds;
    } else {
      return NextResponse.json({ error: 'userIds debe ser un array o "all"' }, { status: 400 });
    }

    // Enviar notificaciones
    const results = await Promise.allSettled(
      targetUserIds.map((userId) => sendPushNotification(userId, notification))
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    logger.info(`Push notifications sent: ${successful} successful, ${failed} failed`, {
      companyId: session.user.companyId,
    });

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
      total: results.length,
    });
  } catch (error) {
    logger.error('Error enviando push notifications:', error);
    return NextResponse.json({ error: 'Error enviando notificaciones' }, { status: 500 });
  }
}
