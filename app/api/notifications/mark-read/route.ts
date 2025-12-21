/**
 * API: POST /api/notifications/mark-read
 * Marca notificaciones como leídas
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { markAsRead, markAllAsRead } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obtener el ID de la notificación (opcional)
    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Marcar todas como leídas
      const result = await markAllAsRead(session.user.id);
      return NextResponse.json({ 
        success: result.success, 
        count: result.count || 0 
      });
    } else if (notificationId) {
      // Marcar una específica como leída
      const result = await markAsRead(notificationId, session.user.id);
      return NextResponse.json({ 
        success: result.success, 
        count: result.success ? 1 : 0 
      });
    } else {
      return NextResponse.json(
        { error: 'Must provide notificationId or markAll=true' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[API /notifications/mark-read] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
