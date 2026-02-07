import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe-config';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe no está configurado en este momento' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { subscriptionId, cancelImmediately } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'ID de suscripción requerido' },
        { status: 400 }
      );
    }

    // Get subscription from database
    const dbSubscription = await prisma.stripeSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!dbSubscription) {
      return NextResponse.json(
        { error: 'Suscripción no encontrada' },
        { status: 404 }
      );
    }

    // Cancel subscription in Stripe
    let stripeSubscription;
    if (cancelImmediately) {
      stripeSubscription = await stripe.subscriptions.cancel(
        dbSubscription.stripeSubscriptionId
      );
    } else {
      stripeSubscription = await stripe.subscriptions.update(
        dbSubscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );
    }

    // Update database
    await prisma.stripeSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: stripeSubscription.status,
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        canceledAt: cancelImmediately ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      status: stripeSubscription.status,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      message: cancelImmediately
        ? 'Suscripción cancelada inmediatamente'
        : 'Suscripción se cancelará al final del período actual',
    });
  } catch (error: unknown) {
    logger.error('Error canceling subscription:', error);
    const message =
      error instanceof Error ? error.message : 'Error al cancelar suscripción';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
