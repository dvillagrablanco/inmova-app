// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { sendPushNotificationToUser, sendPushNotificationToUsers, sendPushNotificationToCompany } from '@/lib/push-notifications';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { userId, userIds, companyId, payload } = await request.json();

    if (!payload || !payload.title || !payload.body) {
      return NextResponse.json(
        { error: 'Payload inválido. Se requieren title y body.' },
        { status: 400 }
      );
    }

    let result;

    if (userId) {
      // Enviar a un usuario específico
      result = await sendPushNotificationToUser(userId, payload);
    } else if (userIds && Array.isArray(userIds)) {
      // Enviar a múltiples usuarios
      result = await sendPushNotificationToUsers(userIds, payload);
    } else if (companyId) {
      // Enviar a todos los usuarios de una empresa
      result = await sendPushNotificationToCompany(companyId, payload);
    } else {
      return NextResponse.json(
        { error: 'Se requiere userId, userIds o companyId' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Notificaciones enviadas: ${result.success} exitosas, ${result.failed} fallidas`,
      ...result
    });
  } catch (error: any) {
    logger.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Error al enviar notificación', details: error.message },
      { status: 500 }
    );
  }
}
