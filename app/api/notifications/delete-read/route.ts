export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API: /api/notifications/delete-read
 * Eliminar todas las notificaciones leídas del usuario
 *
 * DELETE: Eliminar leídas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { deleteReadNotifications } from '@/lib/notification-service';
import logger from '@/lib/logger';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const result = await deleteReadNotifications(session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al eliminar notificaciones leídas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      count: result.count,
      message: `${result.count} notificaciones leídas eliminadas`,
    });
  } catch (error) {
    logger.error('[API] Error in DELETE /api/notifications/delete-read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
