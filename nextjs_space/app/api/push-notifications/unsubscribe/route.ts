import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requerido' },
        { status: 400 }
      );
    }

    // Eliminar la suscripción
    await prisma.pushSubscription.deleteMany({
      where: {
        userId: session.user.id,
        endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Error al cancelar suscripción' },
      { status: 500 }
    );
  }
}
