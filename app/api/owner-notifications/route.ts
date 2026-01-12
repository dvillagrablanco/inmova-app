import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedOwner } from '@/lib/owner-auth';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/owner-notifications - Obtener notificaciones del propietario autenticado
export async function GET(req: NextRequest) {
  try {
    const owner = await getAuthenticatedOwner();

    if (!owner) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener notificaciones del propietario
    const notifications = await prisma.ownerNotification.findMany({
      where: {
        ownerId: owner.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limitar a las últimas 50 notificaciones
    });

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    logger.error('Error al obtener notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

// PATCH /api/owner-notifications - Marcar notificación como leída
export async function PATCH(req: NextRequest) {
  try {
    const owner = await getAuthenticatedOwner();

    if (!owner) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { notificationId, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      // Marcar todas las notificaciones como leídas
      await prisma.ownerNotification.updateMany({
        where: {
          ownerId: owner.id,
          leida: false,
        },
        data: {
          leida: true,
          fechaLeida: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Todas las notificaciones marcadas como leídas',
      });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: 'notificationId es requerido' },
        { status: 400 }
      );
    }

    // Marcar notificación específica como leída
    const notification = await prisma.ownerNotification.findFirst({
      where: {
        id: notificationId,
        ownerId: owner.id,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    await prisma.ownerNotification.update({
      where: { id: notificationId },
      data: {
        leida: true,
        fechaLeida: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    logger.error('Error al actualizar notificación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar notificación' },
      { status: 500 }
    );
  }
}
