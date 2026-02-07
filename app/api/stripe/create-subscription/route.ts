import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getStripe, formatAmountForStripe } from '@/lib/stripe-config';
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer';
import logger from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para crear suscripción
const createSubscriptionSchema = z.object({
  contractId: z.string().uuid({ message: 'ID de contrato inválido' }),
});

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

    const body = await request.json();

    // Validación con Zod
    const validationResult = createSubscriptionSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error creating subscription:', { errors });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
    }

    const { contractId } = validationResult.data;

    // Get contract details
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        tenant: true,
        unit: {
          include: {
            building: true,
          },
        },
        stripeSubscription: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contrato no encontrado' }, { status: 404 });
    }

    // Check if subscription already exists
    if (contract.stripeSubscription) {
      return NextResponse.json(
        { error: 'Este contrato ya tiene una suscripción activa' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      contract.tenant.id,
      contract.tenant.email,
      contract.tenant.nombreCompleto
    );

    // Create a price for this subscription
    const price = await stripe.prices.create({
      currency: 'eur',
      unit_amount: formatAmountForStripe(contract.rentaMensual),
      recurring: {
        interval: 'month',
        interval_count: 1,
      },
      product_data: {
        name: `Renta mensual - ${contract.unit.building.nombre} - Unidad ${contract.unit.numero}`,
        metadata: {
          contractId: contract.id,
          buildingId: contract.unit.buildingId,
          unitId: contract.unitId,
        },
      },
    });

    // Calculate billing cycle anchor (next payment day)
    const now = new Date();
    const billingCycleAnchor = new Date(now.getFullYear(), now.getMonth(), contract.diaPago);

    // If the day has passed this month, set it for next month
    if (billingCycleAnchor < now) {
      billingCycleAnchor.setMonth(billingCycleAnchor.getMonth() + 1);
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: price.id }],
      billing_cycle_anchor: Math.floor(billingCycleAnchor.getTime() / 1000),
      proration_behavior: 'none',
      metadata: {
        contractId: contract.id,
        tenantId: contract.tenantId,
        unitId: contract.unitId,
        buildingId: contract.unit.buildingId,
      },
      description: `Suscripción de renta - ${contract.unit.building.nombre} - Unidad ${contract.unit.numero}`,
    });

    // Save subscription to database
    await prisma.stripeSubscription.create({
      data: {
        contractId: contract.id,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: stripeCustomerId,
        stripePriceId: price.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      nextBillingDate: new Date(subscription.current_period_end * 1000),
    });
  } catch (error: unknown) {
    logger.error('Error creating subscription:', error);
    const message =
      error instanceof Error ? error.message : 'Error al crear suscripción';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
