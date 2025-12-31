export const dynamic = 'force-dynamic';

/**
 * API: /api/notifications/[id]/read
 * Marcar una notificación como leída
 * 
 * PATCH: Marcar como leída
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { markAsRead } from '@/lib/notification-service';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PATCH /api/notifications/[id]/read
 * Marca una notificación como leída
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { id } = context.params;

    const result = await markAsRead(id, session.user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al marcar notificación como leída' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notification: result.notification,
    });
  } catch (error) {
    console.error('[API] Error in PATCH /api/notifications/[id]/read:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
