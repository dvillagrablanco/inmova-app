/**
 * API: /api/notifications/unread-count
 * Obtener el número de notificaciones no leídas
 * 
 * GET: Obtener contador
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getUnreadCount } from '@/lib/notification-service';

/**
 * GET /api/notifications/unread-count
 * Obtiene el número de notificaciones no leídas del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const result = await getUnreadCount(session.user.id);

    return NextResponse.json({
      count: result.count,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
