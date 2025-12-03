import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { stripe, formatAmountForStripe } from '@/lib/stripe-config';
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer';
import logger, { logError } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { contractId } = await request.json();

    if (!contractId) {
      return NextResponse.json({ error: 'ID de contrato requerido' }, { status: 400 });
    }

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
    const billingCycleAnchor = new Date(
      now.getFullYear(),
      now.getMonth(),
      contract.diaPago
    );

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
        currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      status: subscription.status,
      nextBillingDate: new Date((subscription as any).current_period_end * 1000),
    });
  } catch (error: any) {
    logger.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear suscripción' },
      { status: 500 }
    );
  }
}
