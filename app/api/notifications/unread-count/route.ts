export const dynamic = 'force-dynamic';

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
import { withDatabaseFallback, DEMO_DATA } from '@/lib/db-status';

/**
 * GET /api/notifications/unread-count
 * Obtiene el número de notificaciones no leídas del usuario
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const result = await withDatabaseFallback(() => getUnreadCount(session.user.id), {
      count: DEMO_DATA.notifications.unreadCount,
    });

    return NextResponse.json({
      count: result.count,
    });
  } catch (error) {
    // Devolver 0 en lugar de error
    return NextResponse.json({
      count: 0,
    });
  }
}
