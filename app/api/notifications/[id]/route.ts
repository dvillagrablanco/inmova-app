import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PATCH - Marcar notificación como leída
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = (await req.json()) as { read?: boolean };
    const read = typeof body.read === 'boolean' ? body.read : true;

    const result = await prisma.inAppNotification.updateMany({
      where: { id, userId: session.user.id },
      data: {
        read,
        readAt: read ? new Date() : null,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ id, read });
  } catch (error) {
    logger.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la notificación' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar notificación
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    const result = await prisma.inAppNotification.deleteMany({
      where: { id, userId: session.user.id },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Notificación eliminada' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la notificación' },
      { status: 500 }
    );
  }
}
