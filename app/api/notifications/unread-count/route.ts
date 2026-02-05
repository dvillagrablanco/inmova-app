export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      return NextResponse.json({
        count: 0,
        success: false,
        error: 'No autenticado',
      });
    }

    const result = await getUnreadCount(session.user.id);

    return NextResponse.json({
      count: result.count ?? 0,
      success: result.success ?? true,
    });
  } catch (error) {
    return NextResponse.json({
      count: 0,
      success: false,
      error: 'Error interno del servidor',
    });
  }
}
