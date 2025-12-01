/**
 * Webhook de Stripe para eventos de facturación B2B
 * Maneja eventos de pago exitoso, fallido, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { registerInvoicePayment } from '@/lib/b2b-billing-service';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Signature missing' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'invoice.payment_succeeded':
        // Para suscripciones recurrentes de Stripe
        await handleStripeInvoiceSuccess(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Manejar pago exitoso
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { invoiceId } = paymentIntent.metadata;

  if (!invoiceId) {
    console.warn('Payment intent without invoiceId:', paymentIntent.id);
    return;
  }

  const invoice = await prisma.b2BInvoice.findUnique({
    where: { id: invoiceId },
  });

  if (!invoice) {
    console.warn('Invoice not found:', invoiceId);
    return;
  }

  // Ya está pagada?
  if (invoice.estado === 'PAGADA') {
    console.log('Invoice already paid:', invoiceId);
    return;
  }

  // Obtener información del charge
  let charge: Stripe.Charge | null = null;
  let stripeFee = 0;

  // Recuperar el payment intent con charges expandidos
  const fullPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntent.id, {
    expand: ['latest_charge'],
  });
  
  charge = fullPaymentIntent.latest_charge as Stripe.Charge | null;

  if (charge?.balance_transaction) {
    const balanceTransaction = await stripe.balanceTransactions.retrieve(
      charge.balance_transaction as string
    );
    stripeFee = balanceTransaction.fee / 100;
  }

  // Registrar el pago
  await registerInvoicePayment(invoice.id, {
    monto: invoice.total,
    metodoPago: 'stripe',
    stripePaymentId: paymentIntent.id,
    stripeChargeId: charge?.id,
    stripeFee,
  });

  console.log('Payment registered for invoice:', invoiceId);
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { invoiceId } = paymentIntent.metadata;

  if (!invoiceId) {
    return;
  }

  // Aquí podríamos enviar notificaciones, actualizar estado, etc.
  console.log('Payment failed for invoice:', invoiceId);
  
  // Registrar el intento fallido
  await prisma.b2BPaymentHistory.create({
    data: {
      companyId: paymentIntent.metadata.companyId || '',
      invoiceId,
      monto: paymentIntent.amount / 100,
      metodoPago: 'stripe',
      stripePaymentId: paymentIntent.id,
      estado: 'fallido',
      notas: `Pago fallido: ${paymentIntent.last_payment_error?.message || 'Error desconocido'}`,
    }
  });
}

/**
 * Manejar facturas de suscripción de Stripe
 */
async function handleStripeInvoiceSuccess(stripeInvoice: Stripe.Invoice) {
  // Si usamos Stripe Billing para suscripciones recurrentes
  // Este handler sincronizaría las facturas de Stripe con nuestro sistema
  
  const customerId = stripeInvoice.customer as string;
  
  // Buscar empresa por Stripe Customer ID
  const company = await prisma.company.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!company) {
    console.warn('Company not found for customer:', customerId);
    return;
  }

  // Buscar o crear factura en nuestro sistema
  const existingInvoice = await prisma.b2BInvoice.findFirst({
    where: { stripeInvoiceId: stripeInvoice.id },
  });

  if (existingInvoice) {
    // Actualizar estado
    await prisma.b2BInvoice.update({
      where: { id: existingInvoice.id },
      data: {
        estado: 'PAGADA',
        fechaPago: new Date(),
        stripePdfUrl: stripeInvoice.invoice_pdf || undefined,
      }
    });
  }

  console.log('Stripe invoice synced:', stripeInvoice.id);
}
