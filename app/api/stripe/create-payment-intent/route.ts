import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getStripe, formatAmountForStripe } from '@/lib/stripe-config';
import { getOrCreateStripeCustomer } from '@/lib/stripe-customer';
import logger, { logError } from '@/lib/logger';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Schema de validación para crear payment intent
const createPaymentIntentSchema = z.object({
  paymentId: z.string().uuid({ message: 'ID de pago inválido' }),
});

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe no está configurado en este momento' },
        { status: 503 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validación con Zod
    const validationResult = createPaymentIntentSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      logger.warn('Validation error creating payment intent:', { errors });
      return NextResponse.json({ error: 'Datos inválidos', details: errors }, { status: 400 });
    }

    const { paymentId } = validationResult.data;

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        contract: {
          include: {
            tenant: true,
            unit: {
              include: {
                building: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 });
    }

    // Verify tenant access (for tenant portal)
    // Note: Tenant portal uses separate authentication, so this check is for admin/gestor roles
    if (session.user.email !== payment.contract.tenant.email && session.user.role === 'operador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if payment already has a payment intent
    if (payment.stripePaymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

      if (existingIntent.status === 'succeeded') {
        return NextResponse.json({ error: 'Este pago ya ha sido procesado' }, { status: 400 });
      }

      // Return existing intent if not succeeded
      return NextResponse.json({
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
      });
    }

    // Get or create Stripe customer
    const stripeCustomerId = await getOrCreateStripeCustomer(
      payment.contract.tenant.id,
      payment.contract.tenant.email,
      payment.contract.tenant.nombreCompleto
    );

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(payment.monto),
      currency: 'eur',
      customer: stripeCustomerId,
      metadata: {
        paymentId: payment.id,
        contractId: payment.contractId,
        tenantId: payment.contract.tenantId,
        periodo: payment.periodo,
        buildingName: payment.contract.unit.building.nombre,
        unitNumber: payment.contract.unit.numero,
      },
      description: `Pago de renta - ${payment.contract.unit.building.nombre} - Unidad ${payment.contract.unit.numero} - ${payment.periodo}`,
      receipt_email: payment.contract.tenant.email,
    });

    // Update payment with Stripe info
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        stripePaymentStatus: 'pending',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    logger.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'Error al crear intención de pago' },
      { status: 500 }
    );
  }
}
