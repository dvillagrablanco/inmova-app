import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe, formatAmountFromStripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe-config';

import Stripe from 'stripe';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy Prisma loading (auditoria 2026-02-11)
async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}


export async function POST(request: NextRequest) {
  const prisma = await getPrisma();
  // Check if Stripe is configured
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe no está configurado en este momento' },
      { status: 503 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET no configurado' },
      { status: 503 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Error verificando firma del webhook';
    logger.error('Webhook signature verification failed:', message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  // Log webhook event
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        data: JSON.stringify(event.data),
        processed: false,
      },
    });
  } catch (error) {
    logger.error('Error logging webhook event:', error);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(
          stripe,
          event.data.object as Stripe.PaymentIntent
        );
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await prisma.stripeWebhookEvent.updateMany({
      where: { stripeEventId: event.id },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    logger.error('Error processing webhook:', error);
    const message =
      error instanceof Error ? error.message : 'Error procesando webhook';

    // Log processing error
    await prisma.stripeWebhookEvent.updateMany({
      where: { stripeEventId: event.id },
      data: {
        processingError: message,
      },
    });

    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent
) {
  const prisma = await getPrisma();
  const paymentId = paymentIntent.metadata.paymentId;

  if (!paymentId) {
    logger.error('No paymentId in metadata');
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    logger.error(`Payment not found: ${paymentId}`);
    return;
  }

  // Calculate Stripe fee
  const charges = await stripe.charges.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });

  const charge = charges.data[0];
  const balanceTransactionId =
    typeof charge?.balance_transaction === 'string'
      ? charge.balance_transaction
      : charge?.balance_transaction?.id;
  const balanceTransaction = balanceTransactionId
    ? await stripe.balanceTransactions.retrieve(balanceTransactionId)
    : null;
  const stripeFee = balanceTransaction
    ? formatAmountFromStripe(balanceTransaction.fee)
    : 0;

  const netAmount = formatAmountFromStripe(paymentIntent.amount) - stripeFee;

  // Update payment
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      estado: 'pagado',
      fechaPago: new Date(),
      metodoPago: 'Stripe',
      stripePaymentStatus: 'succeeded',
      stripeFee,
      stripeNetAmount: netAmount,
    },
  });

  logger.info(`Payment ${paymentId} marked as succeeded`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const prisma = await getPrisma();
  const paymentId = paymentIntent.metadata.paymentId;

  if (!paymentId) {
    logger.error('No paymentId in metadata');
    return;
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      stripePaymentStatus: 'failed',
    },
  });

  logger.info(`Payment ${paymentId} marked as failed`);
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const prisma = await getPrisma();
  const paymentId = paymentIntent.metadata.paymentId;

  if (!paymentId) {
    logger.error('No paymentId in metadata');
    return;
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      stripePaymentStatus: 'canceled',
    },
  });

  logger.info(`Payment ${paymentId} marked as canceled`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const prisma = await getPrisma();
  const contractId = subscription.metadata.contractId;

  if (!contractId) {
    logger.error('No contractId in subscription metadata');
    return;
  }

  const subscriptionItem = subscription.items.data[0];
  const currentPeriodStart = subscriptionItem?.current_period_start;
  const currentPeriodEnd = subscriptionItem?.current_period_end;

  // Upsert subscription
  await prisma.stripeSubscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      contractId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      currentPeriodStart: currentPeriodStart
        ? new Date(currentPeriodStart * 1000)
        : new Date(),
      currentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : new Date(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
    update: {
      status: subscription.status,
      currentPeriodStart: currentPeriodStart
        ? new Date(currentPeriodStart * 1000)
        : new Date(),
      currentPeriodEnd: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000)
        : new Date(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    },
  });

  logger.info(`Subscription ${subscription.id} updated`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const prisma = await getPrisma();
  await prisma.stripeSubscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  logger.info(`Subscription ${subscription.id} deleted`);
}

async function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const prisma = await getPrisma();
  const subscription = invoice.parent?.subscription_details?.subscription;
  if (!subscription) {
    return null;
  }

  return typeof subscription === 'string' ? subscription : subscription.id;
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const prisma = await getPrisma();
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await prisma.stripeSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
    include: {
      contract: true,
    },
  });

  if (!subscription) {
    logger.error(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Create payment record for this invoice
  const periodStartTimestamp =
    invoice.lines.data[0]?.period?.start ?? invoice.created;
  const period = new Date(periodStartTimestamp * 1000).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });
  const dueDateTimestamp = invoice.due_date ?? invoice.created;

  const payment = await prisma.payment.create({
    data: {
      contractId: subscription.contractId,
      periodo: period,
      monto: formatAmountFromStripe(invoice.amount_paid),
      fechaVencimiento: new Date(dueDateTimestamp * 1000),
      fechaPago: new Date(),
      estado: 'pagado',
      metodoPago: 'Stripe (Suscripción)',
      stripePaymentStatus: 'succeeded',
      stripeSubscriptionId: subscription.id,
    },
  });

  logger.info(`Payment created from invoice: ${payment.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const prisma = await getPrisma();
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  const subscription = await prisma.stripeSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!subscription) {
    logger.error(`Subscription not found: ${subscriptionId}`);
    return;
  }

  // Update subscription status
  await prisma.stripeSubscription.update({
    where: { id: subscription.id },
    data: {
      status: 'past_due',
    },
  });

  logger.info(`Subscription ${subscriptionId} marked as past_due`);
}
