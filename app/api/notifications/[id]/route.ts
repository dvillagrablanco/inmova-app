import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma (auditoria V2)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

// PATCH - Marcar notificación como leída
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const notification = await prisma.notification.update({
      where: { id },
      data: { leida: body.leida },
    });

    return NextResponse.json(notification);
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
  const prisma = await getPrisma();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    await prisma.notification.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Notificación eliminada' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la notificación' },
      { status: 500 }
    );
  }
}
