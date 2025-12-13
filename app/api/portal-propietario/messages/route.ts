import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/portal-propietario/messages
 * Obtiene los mensajes del propietario
 */
export async function GET(request: NextRequest) {
  try {
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const owner = await prisma.owner.findUnique({
      where: { id: ownerId },
    });

    if (!owner) {
      return NextResponse.json(
        { error: 'Propietario no encontrado' },
        { status: 404 }
      );
    }

    // For now, we'll use the notification system as messages
    // In a full implementation, you might want a separate messaging table
    const notifications = await prisma.ownerNotification.findMany({
      where: {
        ownerId: owner.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return NextResponse.json({
      messages: notifications,
      unreadCount: notifications.filter(n => !n.leida).length,
    });
  } catch (error: any) {
    logger.error('Error al obtener mensajes del propietario:', error);
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/portal-propietario/messages
 * Marca mensajes como leídos
 */
export async function POST(request: NextRequest) {
  try {
    const ownerId = request.headers.get('x-owner-id');
    if (!ownerId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messageIds } = body;

    await prisma.ownerNotification.updateMany({
      where: {
        id: { in: messageIds },
        ownerId: ownerId,
      },
      data: {
        leida: true,
        fechaLeida: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error al marcar mensajes como leídos:', error);
    return NextResponse.json(
      { error: 'Error al actualizar mensajes' },
      { status: 500 }
    );
  }
}