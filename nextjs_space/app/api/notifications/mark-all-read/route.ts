import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    // Marcar como leídas solo las notificaciones del usuario o globales
    await prisma.notification.updateMany({
      where: {
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
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json({ error: 'Error al marcar notificaciones' }, { status: 500 });
  }
}