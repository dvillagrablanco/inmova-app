import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { removePushSubscription } from '@/lib/push-notifications';
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

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requerido' },
        { status: 400 }
      );
    }

    await removePushSubscription(endpoint);

    return NextResponse.json({
      success: true,
      message: 'Suscripción eliminada exitosamente'
    });
  } catch (error: any) {
    logger.error('Error removing push subscription:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la suscripción', details: error.message },
      { status: 500 }
    );
  }
}
