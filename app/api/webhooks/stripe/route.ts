/**
 * API Route: Webhook de Stripe
 * POST /api/webhooks/stripe
 * 
 * Maneja eventos de Stripe:
 * - payment_intent.succeeded
 * - payment_intent.failed
 * - payment_intent.canceled
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// Webhook secret (obtener de Stripe Dashboard)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verificar firma del webhook
    let event: Stripe.Event;

    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } else {
        // En desarrollo sin webhook secret
        console.warn('[Stripe Webhook] No webhook secret configured');
        event = JSON.parse(body);
      }
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Manejar eventos
    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('[Stripe Webhook Error]:', error);
    return NextResponse.json(
      { error: 'Webhook error', message: error.message },
      { status: 500 }
    );
  }
}

// Handlers

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Stripe] Payment succeeded:', paymentIntent.id);

  // Actualizar payment en BD
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        stripeChargeId: paymentIntent.latest_charge as string,
      },
    });

    console.log(`[Stripe] Payment ${payment.id} marked as PAID`);

    // Si está asociado a un contrato, actualizar
    if (payment.contractId) {
      // TODO: Lógica específica de contrato
      // Ej: Marcar mes como pagado, generar recibo, etc.
    }
  } else {
    console.warn(`[Stripe] Payment not found for PI: ${paymentIntent.id}`);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Stripe] Payment failed:', paymentIntent.id);

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    });

    console.log(`[Stripe] Payment ${payment.id} marked as FAILED`);

    // TODO: Notificar al usuario del fallo
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('[Stripe] Payment canceled:', paymentIntent.id);

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELLED',
      },
    });

    console.log(`[Stripe] Payment ${payment.id} marked as CANCELLED`);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('[Stripe] Charge refunded:', charge.id);

  const payment = await prisma.payment.findFirst({
    where: { stripeChargeId: charge.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: charge.amount_refunded / 100,
      },
    });

    console.log(`[Stripe] Payment ${payment.id} marked as REFUNDED`);
  }
}
