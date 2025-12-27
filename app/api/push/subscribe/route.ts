import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/push/subscribe
 * Registra una suscripción push para el usuario
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Suscripción inválida' },
        { status: 400 }
      );
    }

    // Extraer las claves de la suscripción
    const keys = subscription.keys || {};
    const p256dh = keys.p256dh || '';
    const auth = keys.auth || '';

    // Guardar o actualizar la suscripción en la base de datos
    const pushSubscription = await prisma.pushSubscription.upsert({
      where: {
        endpoint: subscription.endpoint
      },
      update: {
        p256dh,
        auth,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        endpoint: subscription.endpoint,
        p256dh,
        auth
      }
    });

    logger.info(`Push subscription registered for user ${session.user.id}`);

    return NextResponse.json({
      success: true,
      subscriptionId: pushSubscription.id
    });
  } catch (error) {
    logger.error('Error registrando push subscription:', error);
    return NextResponse.json(
      { error: 'Error registrando suscripción' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/push/subscribe
 * Elimina una suscripción push
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { endpoint } = body;

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
        endpoint: endpoint
      }
    });

    logger.info(`Push subscription deleted for user ${session.user.id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error eliminando push subscription:', error);
    return NextResponse.json(
      { error: 'Error eliminando suscripción' },
      { status: 500 }
    );
  }
}
