import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const user = session.user as any;
  const userId = user.id;
  const companyId = user.companyId;

  try {
    // Marcar como leídas solo las notificaciones del usuario en su empresa
    await prisma.notification.updateMany({
      where: {
        companyId: companyId,
        OR: [
          { userId: userId },
          { userId: null },
        ],
        leida: false,
      },
      data: { leida: true },
    });

    return NextResponse.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Error al marcar notificaciones' }, { status: 500 });
  }
}
