/**
 * API Routes: Subscriptions
 * 
 * POST /api/v1/billing/subscriptions - Crear suscripción
 * GET /api/v1/billing/subscriptions - Obtener suscripción actual
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { createSubscription, SUBSCRIPTION_PLANS } from '@/lib/stripe-connect-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSubscriptionSchema = z.object({
  planId: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  paymentMethodId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const validated = createSubscriptionSchema.parse(body);

    const result = await createSubscription(
      session.user.companyId,
      validated.planId,
      validated.paymentMethodId
    );

    return NextResponse.json(result);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Error interno', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId: session.user.companyId,
        status: { in: ['active', 'trialing', 'past_due'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return NextResponse.json({ hasSubscription: false, plans: SUBSCRIPTION_PLANS });
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription,
      plans: SUBSCRIPTION_PLANS,
    });

  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
