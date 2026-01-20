export const dynamic = 'force-dynamic';

/**
 * API: /api/notifications/mark-all-read
 * Marcar todas las notificaciones del usuario como leídas
 * 
 * PATCH: Marcar todas como leídas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { markAllAsRead } from '@/lib/notification-service';

import logger from '@/lib/logger';
/**
 * PATCH /api/notifications/mark-all-read
 * Marca todas las notificaciones del usuario como leídas
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const result = await markAllAsRead(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al marcar todas como leídas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: result.count,
      message: `${result.count} notificaciones marcadas como leídas`,
    });
  } catch (error) {
    logger.error('[API] Error in PATCH /api/notifications/mark-all-read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
