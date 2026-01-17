/**
 * Webhook de Stripe para Módulos Add-on
 * 
 * Maneja eventos:
 * - checkout.session.completed: Activar módulo tras pago exitoso
 * - invoice.paid: Confirmar pago de factura mensual
 * - invoice.payment_failed: Notificar fallo de pago
 * - customer.subscription.deleted: Desactivar módulo
 */
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handleModuleWebhook } from '@/lib/stripe-module-addons';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// En Next.js App Router, el body parser se maneja automáticamente
// No necesita configuración adicional para webhooks

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  const reader = req.body?.getReader();
  
  if (!reader) {
    throw new Error('No body available');
  }
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que Stripe está configurado
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey) {
      console.error('[Stripe Webhook] STRIPE_SECRET_KEY no configurada');
      return NextResponse.json(
        { error: 'Stripe no configurado' },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Obtener raw body y signature
    const rawBody = await getRawBody(request);
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook] Missing signature');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verificar firma del webhook
    let event: Stripe.Event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret
        );
      } else {
        // Sin webhook secret (solo para desarrollo)
        console.warn('[Stripe Webhook] STRIPE_WEBHOOK_SECRET no configurado - skipping signature verification');
        event = JSON.parse(rawBody.toString()) as Stripe.Event;
      }
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }

    console.log(`[Stripe Webhook] Received event: ${event.type}`);

    // Procesar eventos específicos de módulos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('[Stripe Webhook] Checkout completed', {
          sessionId: session.id,
          customerEmail: session.customer_email,
          metadata: session.metadata,
        });

        // Si es una compra de módulo add-on
        if (session.metadata?.type === 'module_addon' || session.metadata?.addOnCodigo) {
          const moduleId = session.metadata.module_id || session.metadata.addOnCodigo;
          const companyId = session.metadata.company_id || session.metadata.companyId;
          
          console.log(`[Stripe Webhook] Module add-on purchased: ${moduleId} for company: ${companyId}`);
          
          // TODO: Activar módulo en la base de datos
          // const { prisma } = await import('@/lib/db');
          // await prisma.companyModule.upsert({
          //   where: { companyId_moduleId: { companyId, moduleId } },
          //   create: {
          //     companyId,
          //     moduleId,
          //     activo: true,
          //     stripeSubscriptionId: session.subscription as string,
          //   },
          //   update: {
          //     activo: true,
          //     stripeSubscriptionId: session.subscription as string,
          //   },
          // });

          // TODO: Enviar email de confirmación
          // await sendModuleActivationEmail(session.customer_email, moduleId);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Stripe Webhook] Invoice paid', {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
          customerEmail: invoice.customer_email,
          subscriptionId: invoice.subscription,
        });

        // La factura ya se envió automáticamente por Stripe
        // Solo registrar en logs y posiblemente notificar al usuario
        
        // TODO: Registrar pago en base de datos
        // const { prisma } = await import('@/lib/db');
        // await prisma.paymentLog.create({
        //   data: {
        //     stripeInvoiceId: invoice.id,
        //     amount: invoice.amount_paid / 100,
        //     customerEmail: invoice.customer_email,
        //     status: 'paid',
        //     paidAt: new Date(),
        //   },
        // });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn('[Stripe Webhook] Invoice payment failed', {
          invoiceId: invoice.id,
          customerEmail: invoice.customer_email,
          attemptCount: invoice.attempt_count,
        });

        // TODO: Enviar notificación al usuario sobre fallo de pago
        // await sendPaymentFailedEmail(invoice.customer_email, invoice);

        // TODO: Si es el 3er intento fallido, considerar desactivar módulos
        // if (invoice.attempt_count >= 3) {
        //   await deactivateModulesForCustomer(invoice.customer);
        // }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('[Stripe Webhook] Subscription updated', {
          subscriptionId: subscription.id,
          status: subscription.status,
          metadata: subscription.metadata,
        });

        // Verificar si la suscripción está activa o cancelada
        if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
          const moduleId = subscription.metadata?.module_id;
          const companyId = subscription.metadata?.company_id;

          if (moduleId && companyId) {
            console.log(`[Stripe Webhook] Module subscription inactive: ${moduleId} for company: ${companyId}`);
            
            // TODO: Desactivar módulo
            // await deactivateModuleForCompany(companyId, moduleId);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const moduleId = subscription.metadata?.module_id || subscription.metadata?.addOnCodigo;
        const companyId = subscription.metadata?.company_id || subscription.metadata?.companyId;

        console.log('[Stripe Webhook] Subscription deleted', {
          subscriptionId: subscription.id,
          moduleId,
          companyId,
        });

        if (moduleId && companyId) {
          // TODO: Desactivar módulo en base de datos
          // const { prisma } = await import('@/lib/db');
          // await prisma.companyModule.update({
          //   where: { companyId_moduleId: { companyId, moduleId } },
          //   data: { activo: false },
          // });
        }
        break;
      }

      case 'invoice.finalized': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('[Stripe Webhook] Invoice finalized', {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          total: invoice.total,
          customerEmail: invoice.customer_email,
        });
        // La factura está lista para envío
        // Stripe la enviará automáticamente si está configurado
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Procesar evento con handler genérico
    await handleModuleWebhook(event);

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
