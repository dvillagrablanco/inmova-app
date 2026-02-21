/**
 * API Route: Webhook de Stripe
 * POST /api/webhooks/stripe
 *
 * Maneja eventos de Stripe para AMBAS plataformas:
 *
 * 1. INMOVA - Pagos 100% para la plataforma
 *    - Suscripciones de gestores inmobiliarios
 *    - Pagos de alquiler (con comisión)
 *
 * 2. EWOORKER - Pagos con división 50/50
 *    - 50% para socio fundador
 *    - 50% para plataforma
 *    - Identificados por metadata.platform === 'ewoorker'
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getInmovaContasimpleBridge } from '@/lib/inmova-contasimple-bridge';
import { handleEwoorkerStripeWebhook } from '@/lib/ewoorker-stripe-service';
import logger from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripeInstance;
}

// Webhook secret (obtener de Stripe Dashboard)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const getPrisma = async () => {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    // Verificar firma del webhook
    let event: Stripe.Event;

    try {
      if (!webhookSecret) {
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Webhook secret no configurado' }, { status: 503 });
        }
        logger.warn('[Stripe Webhook] No webhook secret configured (dev)');
        event = JSON.parse(body);
      } else {
        event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('[Stripe Webhook] Signature verification failed:', { message });
      Sentry.captureException(err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Manejar eventos
    logger.info(`[Stripe Webhook] Received event: ${event.type}`);

    // ══════════════════════════════════════════════════════════════════
    // PASO 1: Verificar si es un evento de eWoorker
    // Los pagos de eWoorker tienen metadata.platform === 'ewoorker'
    // y se dividen 50/50 entre socio y plataforma
    // ══════════════════════════════════════════════════════════════════

    const ewoorkerResult = await handleEwoorkerStripeWebhook(event);
    if (ewoorkerResult.handled) {
      logger.info(`[Stripe Webhook] Evento manejado por eWoorker: ${ewoorkerResult.message}`);
      return NextResponse.json({
        received: true,
        platform: 'ewoorker',
        message: ewoorkerResult.message,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    // PASO 2: Si no es eWoorker, es un pago de Inmova (100% plataforma)
    // ══════════════════════════════════════════════════════════════════

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

      // Eventos de facturas B2B (Invoices de Stripe)
      case 'invoice.payment_succeeded':
        await handleB2BInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleB2BInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.created':
        await handleB2BInvoiceCreated(event.data.object as Stripe.Invoice);
        break;

      // Eventos de suscripciones
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event);
        break;

      default:
        logger.info(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, platform: 'inmova' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Stripe Webhook Error]:', { message });
    Sentry.captureException(error);
    return NextResponse.json({ error: 'Webhook error', message }, { status: 500 });
  }
}

// Handlers

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info(`[Stripe] Payment succeeded: ${paymentIntent.id}`);

  const prisma = await getPrisma();

  // Actualizar payment en BD
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        estado: 'pagado',
        fechaPago: new Date(),
        stripePaymentStatus: 'succeeded',
      },
    });

    logger.info(`[Stripe] Payment ${payment.id} marcado como pagado`);

    // Si está asociado a un contrato, actualizar
    if (payment.contractId) {
      const contract = await prisma.contract.findUnique({
        where: { id: payment.contractId },
        select: {
          unit: {
            select: {
              building: {
                select: { companyId: true },
              },
            },
          },
        },
      });

      const companyId = contract?.unit?.building?.companyId;
      if (companyId) {
        await prisma.notification.create({
          data: {
            companyId,
            tipo: 'info',
            titulo: 'Pago recibido',
            mensaje: `Se recibió el pago asociado al contrato ${payment.contractId}.`,
            entityId: payment.id,
            entityType: 'PAYMENT',
          },
        });
      }
    }
  } else {
    logger.warn(`[Stripe] Payment not found for PI: ${paymentIntent.id}`);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.warn(`[Stripe] Payment failed: ${paymentIntent.id}`);

  const prisma = await getPrisma();

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        estado: 'atrasado',
        stripePaymentStatus: 'failed',
      },
    });

    logger.warn(`[Stripe] Payment ${payment.id} marcado como fallido`);

    const contract = await prisma.contract.findUnique({
      where: { id: payment.contractId },
      select: {
        unit: {
          select: {
            building: {
              select: { companyId: true },
            },
          },
        },
      },
    });

    const companyId = contract?.unit?.building?.companyId;
    if (companyId) {
      await prisma.notification.create({
        data: {
          companyId,
          tipo: 'pago_atrasado',
          titulo: 'Pago fallido',
          mensaje:
            `El pago asociado al contrato ${payment.contractId} falló. ` +
            'Revisa la información de cobro.',
          entityId: payment.id,
          entityType: 'PAYMENT',
        },
      });
    }
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  logger.warn(`[Stripe] Payment canceled: ${paymentIntent.id}`);

  const prisma = await getPrisma();

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        estado: 'pendiente',
        stripePaymentStatus: 'canceled',
      },
    });

    logger.warn(`[Stripe] Payment ${payment.id} marcado como cancelado`);
  }
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.warn(`[Stripe] Charge refunded: ${charge.id}`);

  const prisma = await getPrisma();
  const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
  const payment = paymentIntentId
    ? await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
      })
    : null;

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        estado: 'pendiente',
        fechaPago: null,
        stripePaymentStatus: 'refunded',
      },
    });

    logger.warn(`[Stripe] Payment ${payment.id} marcado como reembolsado`);
  }
}

// ═══════════════════════════════════════════════════════════════
// HANDLERS DE FACTURAS B2B
// ═══════════════════════════════════════════════════════════════

/**
 * Cuando Stripe crea una factura, sincronizarla con Contasimple
 */
async function handleB2BInvoiceCreated(stripeInvoice: Stripe.Invoice) {
  logger.info(`[Stripe Webhook] Factura B2B creada: ${stripeInvoice.id}`);

  const prisma = await getPrisma();

  try {
    // Buscar factura en BD por stripeInvoiceId
    const b2bInvoice = await prisma.b2BInvoice.findFirst({
      where: { stripeInvoiceId: stripeInvoice.id },
    });

    if (!b2bInvoice) {
      logger.warn(
        `[Stripe Webhook] No se encontró B2BInvoice para Stripe Invoice ${stripeInvoice.id}`
      );
      return;
    }

    const inmovaContasimpleBridge = getInmovaContasimpleBridge();
    // Sincronizar con Contasimple si está configurado
    if (inmovaContasimpleBridge.isConfigured()) {
      await inmovaContasimpleBridge.syncB2BInvoiceToContasimple(b2bInvoice.id);
      logger.info(
        `[Stripe Webhook] ✅ Factura ${b2bInvoice.numeroFactura} sincronizada con Contasimple`
      );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Stripe Webhook] Error sincronizando factura con Contasimple:', { message });
    Sentry.captureException(error);
    // No lanzar error para no fallar el webhook
  }
}

/**
 * Cuando se paga una factura en Stripe, actualizar en BD y Contasimple
 */
async function handleB2BInvoicePaymentSucceeded(stripeInvoice: Stripe.Invoice) {
  logger.info(`[Stripe Webhook] Pago de factura B2B exitoso: ${stripeInvoice.id}`);

  const prisma = await getPrisma();

  try {
    // Buscar factura en BD
    const b2bInvoice = await prisma.b2BInvoice.findFirst({
      where: { stripeInvoiceId: stripeInvoice.id },
    });

    if (!b2bInvoice) {
      logger.warn(
        `[Stripe Webhook] No se encontró B2BInvoice para Stripe Invoice ${stripeInvoice.id}`
      );
      return;
    }

    // Actualizar estado en BD
    await prisma.b2BInvoice.update({
      where: { id: b2bInvoice.id },
      data: {
        estado: 'PAGADA',
        fechaPago: new Date(),
        metodoPago: 'stripe',
        stripePaymentIntentId: (stripeInvoice.payment_intent as string) || null,
      },
    });

    logger.info(`[Stripe Webhook] ✅ Factura ${b2bInvoice.numeroFactura} marcada como PAGADA`);

    // Registrar historial de pago
    await prisma.b2BPaymentHistory.create({
      data: {
        companyId: b2bInvoice.companyId,
        invoiceId: b2bInvoice.id,
        monto: stripeInvoice.amount_paid / 100,
        metodoPago: 'stripe',
        fechaPago: new Date(),
        estado: 'completado',
        stripePaymentId:
          typeof stripeInvoice.payment_intent === 'string' ? stripeInvoice.payment_intent : null,
      },
    });

    const inmovaContasimpleBridge = getInmovaContasimpleBridge();
    // Sincronizar pago con Contasimple
    if (inmovaContasimpleBridge.isConfigured()) {
      await inmovaContasimpleBridge.syncPaymentToContasimple(b2bInvoice.id, {
        amount: stripeInvoice.amount_paid / 100,
        date: new Date(),
        stripePaymentIntentId: (stripeInvoice.payment_intent as string) || 'unknown',
        method: 'card',
      });

      logger.info(`[Stripe Webhook] ✅ Pago sincronizado con Contasimple`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Stripe Webhook] Error procesando pago de factura B2B:', { message });
    Sentry.captureException(error);
  }
}

/**
 * Cuando falla el pago de una factura
 */
async function handleB2BInvoicePaymentFailed(stripeInvoice: Stripe.Invoice) {
  logger.warn(`[Stripe Webhook] Pago de factura B2B falló: ${stripeInvoice.id}`);

  const prisma = await getPrisma();

  try {
    const b2bInvoice = await prisma.b2BInvoice.findFirst({
      where: { stripeInvoiceId: stripeInvoice.id },
    });

    if (!b2bInvoice) {
      return;
    }

    // Actualizar estado
    await prisma.b2BInvoice.update({
      where: { id: b2bInvoice.id },
      data: {
        estado: 'VENCIDA', // Marcar como vencida si el pago falla
      },
    });

    await prisma.notification.create({
      data: {
        companyId: b2bInvoice.companyId,
        tipo: 'alerta_sistema',
        titulo: 'Pago de factura fallido',
        mensaje: `El pago de la factura ${b2bInvoice.numeroFactura} falló en Stripe.`,
        entityId: b2bInvoice.id,
        entityType: 'B2B_INVOICE',
      },
    });

    logger.info(`[Stripe Webhook] Factura ${b2bInvoice.numeroFactura} marcada como VENCIDA`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Stripe Webhook] Error procesando fallo de pago:', { message });
    Sentry.captureException(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// HANDLERS DE SUSCRIPCIONES INMOVA (100% plataforma)
// ═══════════════════════════════════════════════════════════════

/**
 * Maneja eventos de suscripciones de Inmova
 * Nota: Los pagos de Inmova van 100% a la plataforma
 */
async function handleSubscriptionEvent(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const prisma = await getPrisma();

  // Verificar que NO sea una suscripción de eWoorker
  if (subscription.metadata?.platform === 'ewoorker') {
    return; // Ya manejado por handleEwoorkerStripeWebhook
  }

  logger.info(`[Stripe Webhook] Evento de suscripción Inmova: ${event.type}`, {
    subscriptionId: subscription.id,
    status: subscription.status,
    metadata: subscription.metadata,
  });

  try {
    // ═══════════════════════════════════════════════════════════════
    // VERIFICAR SI ES UN ADD-ON
    // Los add-ons tienen metadata.type === 'addon'
    // ═══════════════════════════════════════════════════════════════

    if (subscription.metadata?.type === 'addon') {
      await handleAddOnSubscription(event, subscription);
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // VERIFICAR SI ES UN PLAN DE SUSCRIPCIÓN
    // Los planes tienen metadata.planId y metadata.companyId
    // ═══════════════════════════════════════════════════════════════

    if (subscription.metadata?.planId && subscription.metadata?.companyId) {
      await handlePlanSubscription(event, subscription);
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // SUSCRIPCIONES DE CONTRATOS (alquiler)
    // ═══════════════════════════════════════════════════════════════

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await prisma.stripeSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;

      case 'customer.subscription.deleted':
        await prisma.stripeSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'canceled' },
        });
        break;
    }

    logger.info(`[Stripe Webhook] ✅ Suscripción Inmova actualizada: ${subscription.id}`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Stripe Webhook] Error actualizando suscripción Inmova:', { message });
    Sentry.captureException(error);
  }
}

/**
 * Maneja eventos de suscripción de add-ons
 */
async function handleAddOnSubscription(event: Stripe.Event, subscription: Stripe.Subscription) {
  const prisma = await getPrisma();
  const addOnId = subscription.metadata?.addOnId;
  const companyId = subscription.metadata?.companyId;

  if (!addOnId || !companyId) {
    logger.warn('[Stripe Webhook] Add-on subscription sin metadata requerida');
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        // Crear o activar CompanyAddOn
        await prisma.companyAddOn.upsert({
          where: {
            companyId_addOnId: { companyId, addOnId },
          },
          update: {
            activo: true,
            stripeSubscriptionId: subscription.id,
            fechaActivacion: new Date(),
            fechaCancelacion: null,
          },
          create: {
            companyId,
            addOnId,
            activo: true,
            stripeSubscriptionId: subscription.id,
            fechaActivacion: new Date(),
          },
        });
        logger.info(`[Stripe Webhook] ✅ Add-on ${addOnId} activado para empresa ${companyId}`);
        break;

      case 'customer.subscription.updated':
        // Actualizar estado
        await prisma.companyAddOn.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            activo: subscription.status === 'active',
          },
        });
        break;

      case 'customer.subscription.deleted':
        // Marcar como inactivo
        await prisma.companyAddOn.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            activo: false,
            fechaCancelacion: new Date(),
          },
        });
        logger.info(`[Stripe Webhook] ✅ Add-on cancelado para empresa ${companyId}`);
        break;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Stripe Webhook] Error procesando add-on subscription:', { message });
    Sentry.captureException(error);
  }
}

/**
 * Maneja eventos de suscripción a planes
 */
async function handlePlanSubscription(event: Stripe.Event, subscription: Stripe.Subscription) {
  const prisma = await getPrisma();
  const planId = subscription.metadata?.planId;
  const companyId = subscription.metadata?.companyId;

  if (!planId || !companyId) {
    logger.warn('[Stripe Webhook] Plan subscription sin metadata requerida');
    return;
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Actualizar plan de la empresa
        await prisma.company.update({
          where: { id: companyId },
          data: {
            subscriptionPlanId: planId,
            estadoCliente:
              subscription.status === 'active'
                ? 'activo'
                : subscription.status === 'trialing'
                  ? 'prueba'
                  : 'suspendido',
          },
        });

        // Registrar cambio de suscripción
        await prisma.b2BSubscriptionHistory.create({
          data: {
            companyId,
            accion: event.type === 'customer.subscription.created' ? 'nueva' : 'actualizacion',
            planNuevoId: planId,
            razon: `Stripe subscription ${subscription.id}`,
          },
        });

        logger.info(`[Stripe Webhook] ✅ Empresa ${companyId} suscrita a plan ${planId}`);
        break;

      case 'customer.subscription.deleted':
        // Cancelar plan de la empresa
        await prisma.company.update({
          where: { id: companyId },
          data: {
            subscriptionPlanId: null,
            estadoCliente: 'suspendido',
          },
        });

        await prisma.b2BSubscriptionHistory.create({
          data: {
            companyId,
            accion: 'cancelacion',
            planAnteriorId: planId,
            razon: `Stripe subscription ${subscription.id}`,
          },
        });

        logger.info(`[Stripe Webhook] ✅ Suscripción cancelada para empresa ${companyId}`);
        break;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('[Stripe Webhook] Error procesando plan subscription:', { message });
    Sentry.captureException(error);
  }
}
