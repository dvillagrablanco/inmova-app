import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { savePushSubscription } from '@/lib/push-notifications';
import logger, { logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const subscription = await request.json();

    if (!subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Suscripción inválida' },
        { status: 400 }
      );
    }

    await savePushSubscription(session.user.id, subscription);

    return NextResponse.json({
      success: true,
      message: 'Suscripción guardada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Error al guardar la suscripción', details: error.message },
      { status: 500 }
    );
  }
}
