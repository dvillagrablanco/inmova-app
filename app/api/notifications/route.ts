/**
 * API: /api/notifications
 * Gestión de notificaciones in-app
 * 
 * GET: Obtener notificaciones del usuario autenticado
 * POST: Crear una nueva notificación (solo admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  getRecentNotifications,
  createNotification,
  CreateNotificationParams,
} from '@/lib/notification-service';

/**
 * GET /api/notifications
 * Obtiene las notificaciones del usuario autenticado
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

    // Obtener el parámetro limit de la query string
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await getRecentNotifications(session.user.id, limit);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Error al obtener notificaciones' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      notifications: result.notifications,
    });
  } catch (error) {
    console.error('[API] Error in GET /api/notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Crea una nueva notificación (solo admin o sistema)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin o el sistema
    // (Para demo, permitimos a cualquier usuario crear notificaciones propias)
    const body = await request.json();

    const params: CreateNotificationParams = {
      userId: body.userId || session.user.id,
      companyId: body.companyId || session.user.companyId || '',
      type: body.type || 'info',
      title: body.title,
      message: body.message,
      icon: body.icon,
      actionLabel: body.actionLabel,
      actionRoute: body.actionRoute,
    };

    // Validaciones básicas
    if (!params.title || !params.message) {
      return NextResponse.json(
        { error: 'Title y message son requeridos' },
        { status: 400 }
      );
    }

    const result = await createNotification(params);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Error al crear notificación' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { notification: result.notification },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API] Error in POST /api/notifications:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
