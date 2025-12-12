import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger, { logError } from '@/lib/logger';
// Temporarily disabled - function not implemented
// import { sendPushNotificationToUser } from '@/lib/push-notifications';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo administradores pueden enviar notificaciones push
    if (session.user.role !== 'administrador') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // Temporarily disabled - function not implemented
    return NextResponse.json(
      { error: 'Funcionalidad en desarrollo' },
      { status: 501 }
    );

  } catch (error) {
    logError(error as Error, {
      context: 'POST /api/push-notifications/send',
    });
    return NextResponse.json(
      { error: 'Error al enviar notificación push' },
      { status: 500 }
    );
  }
}
