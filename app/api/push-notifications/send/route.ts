import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'administrador' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, title, message, type } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Se requiere title y message' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const companyId = session.user.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'Company requerida' }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        companyId,
        userId: userId || (session.user as any).id,
        tipo: type || 'info',
        titulo: title,
        mensaje: message,
        leida: false,
      },
    });

    logger.info('[push-notifications] Notification created', {
      notificationId: notification.id,
      userId,
      type,
    });

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      message: 'Notificación creada correctamente',
    });
  } catch (error) {
    logError(error as Error, {
      context: 'POST /api/push-notifications/send',
    });
    return NextResponse.json({ error: 'Error al enviar notificación' }, { status: 500 });
  }
}
