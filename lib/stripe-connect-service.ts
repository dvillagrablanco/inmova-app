/**
 * Servicio de Stripe Connect
 * 
 * Multi-tenant payments: cada company tiene su propia cuenta Stripe Connect.
 * Inmova cobra comisión por cada transacción (platform fee).
 * 
 * @module StripeConnectService
 */

import Stripe from 'stripe';
import { prisma } from './db';
import logger from './logger';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripeInstance;
}

// ============================================================================
// TIPOS
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  maxProperties: number;
  maxUsers: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    price: 49,
    interval: 'month',
    features: ['CRM básico', 'Gestión de contratos', 'Hasta 50 propiedades'],
    maxProperties: 50,
    maxUsers: 2,
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    price: 149,
    interval: 'month',
    features: ['CRM avanzado', 'Firma digital', 'API access', 'Hasta 200 propiedades'],
    maxProperties: 200,
    maxUsers: 10,
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    interval: 'month',
    features: ['Todo incluido', 'Valoraciones IA', 'White-label', 'Propiedades ilimitadas'],
    maxProperties: -1, // Unlimited
    maxUsers: -1, // Unlimited
  },
};

// ============================================================================
// STRIPE CONNECT - ONBOARDING
// ============================================================================

/**
 * Crea una cuenta Stripe Connect para una company
 */
export async function createConnectAccount(companyId: string): Promise<{
  accountId: string;
  onboardingUrl: string;
}> {
  try {
    // Obtener company
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Crear cuenta Connect
    const account = await getStripe().accounts.create({
      type: 'express', // Express for simplicity (Standard for more control)
      country: 'ES',
      email: company.contactEmail || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      company: {
        name: company.legalName || company.name,
        tax_id: company.taxId || undefined,
      },
    });

    // Crear link de onboarding
    const accountLink = await getStripe().accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
      type: 'account_onboarding',
    });

    // Guardar en BD
    await prisma.company.update({
      where: { id: companyId },
      data: {
        stripeConnectAccountId: account.id,
      },
    });

    logger.info('✅ Stripe Connect account created', {
      companyId,
      accountId: account.id,
    });

    return {
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error: any) {
    logger.error('❌ Error creating Connect account:', error);
    throw error;
  }
}

/**
 * Obtiene el estado de la cuenta Connect
 */
export async function getConnectAccountStatus(accountId: string): Promise<{
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: any;
}> {
  const account = await getStripe().accounts.retrieve(accountId);

  return {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    requirements: account.requirements,
  };
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

/**
 * Crea una suscripción para una company
 */
export async function createSubscription(
  companyId: string,
  planId: keyof typeof SUBSCRIPTION_PLANS,
  paymentMethodId: string
): Promise<{ subscriptionId: string; clientSecret: string }> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error('Invalid plan');
    }

    // Crear o obtener customer
    let customerId = company.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: company.contactEmail || undefined,
        name: company.name,
        metadata: {
          companyId,
        },
      });

      customerId = customer.id;

      await prisma.company.update({
        where: { id: companyId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Attach payment method
    await getStripe().paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default
    await getStripe().customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Crear o obtener producto y precio
    const product = await getStripe().products.create({
      name: `Inmova ${plan.name}`,
    });

    const price = await getStripe().prices.create({
      product: product.id,
      unit_amount: plan.price * 100, // Centavos
      currency: 'eur',
      recurring: {
        interval: plan.interval,
      },
    });

    // Crear subscripción
    const subscription = await getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Guardar en BD
    await prisma.subscription.create({
      data: {
        companyId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: price.id,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });

    logger.info('✅ Subscription created', {
      companyId,
      subscriptionId: subscription.id,
      plan: planId,
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret!,
    };
  } catch (error: any) {
    logger.error('❌ Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(
  companyId: string,
  immediately: boolean = false
): Promise<void> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: { in: ['active', 'trialing'] },
      },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (immediately) {
      await getStripe().subscriptions.cancel(subscription.stripeSubscriptionId);
    } else {
      await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: immediately ? 'canceled' : 'active',
        cancelAtPeriodEnd: !immediately,
      },
    });

    logger.info('✅ Subscription canceled', {
      companyId,
      subscriptionId: subscription.stripeSubscriptionId,
      immediately,
    });
  } catch (error: any) {
    logger.error('❌ Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Actualiza el plan de suscripción
 */
export async function updateSubscriptionPlan(
  companyId: string,
  newPlanId: keyof typeof SUBSCRIPTION_PLANS
): Promise<void> {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        companyId,
        status: { in: ['active', 'trialing'] },
      },
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const newPlan = SUBSCRIPTION_PLANS[newPlanId];
    if (!newPlan) {
      throw new Error('Invalid plan');
    }

    // Obtener subscripción de Stripe
    const stripeSubscription = await getStripe().subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Crear nuevo precio si no existe
    const product = await getStripe().products.create({
      name: `Inmova ${newPlan.name}`,
    });

    const newPrice = await getStripe().prices.create({
      product: product.id,
      unit_amount: newPlan.price * 100,
      currency: 'eur',
      recurring: {
        interval: newPlan.interval,
      },
    });

    // Actualizar subscripción
    await getStripe().subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPrice.id,
        },
      ],
      proration_behavior: 'create_prorations', // Prorrateado
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripePriceId: newPrice.id,
      },
    });

    logger.info('✅ Subscription plan updated', {
      companyId,
      newPlan: newPlanId,
    });
  } catch (error: any) {
    logger.error('❌ Error updating subscription plan:', error);
    throw error;
  }
}

// ============================================================================
// PLATFORM FEES (Comisión de Inmova)
// ============================================================================

/**
 * Crea un payment con platform fee (comisión)
 * 
 * Ejemplo: Propietario recibe pago de inquilino.
 * - Inmova cobra 5% de comisión
 * - 95% va al propietario (Connect account)
 */
export async function createPaymentWithFee(data: {
  amount: number; // En euros
  currency: string;
  connectedAccountId: string; // Cuenta del propietario
  platformFeePercentage: number; // Ej: 5 (5%)
  metadata?: Record<string, string>;
}): Promise<{ paymentIntentId: string; clientSecret: string }> {
  try {
    const platformFeeAmount = Math.round((data.amount * data.platformFeePercentage) / 100);

    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(data.amount * 100), // Centavos
      currency: data.currency,
      application_fee_amount: platformFeeAmount * 100, // Comisión de Inmova
      transfer_data: {
        destination: data.connectedAccountId, // 95% al propietario
      },
      metadata: data.metadata,
    });

    logger.info('✅ Payment with platform fee created', {
      paymentIntentId: paymentIntent.id,
      amount: data.amount,
      platformFee: platformFeeAmount,
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
    };
  } catch (error: any) {
    logger.error('❌ Error creating payment with fee:', error);
    throw error;
  }
}

/**
 * Webhook handler para eventos de Stripe
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  try {
    switch (event.type) {
      case 'account.updated':
        // Cuenta Connect actualizada
        const account = event.data.object as Stripe.Account;
        await prisma.company.updateMany({
          where: { stripeConnectAccountId: account.id },
          data: {
            stripeAccountComplete: account.charges_enabled && account.payouts_enabled,
          },
        });
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;

      case 'customer.subscription.deleted':
        const deletedSub = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: deletedSub.id },
          data: {
            status: 'canceled',
          },
        });
        break;

      case 'invoice.payment_succeeded':
        // Pago exitoso
        const invoice = event.data.object as Stripe.Invoice;
        logger.info('💰 Invoice payment succeeded', {
          invoiceId: invoice.id,
          amount: invoice.amount_paid / 100,
        });
        break;

      case 'invoice.payment_failed':
        // Pago fallido
        const failedInvoice = event.data.object as Stripe.Invoice;
        logger.warn('⚠️ Invoice payment failed', {
          invoiceId: failedInvoice.id,
        });
        break;

      default:
        logger.info('Unhandled Stripe event', { type: event.type });
    }
  } catch (error: any) {
    logger.error('❌ Error handling Stripe webhook:', error);
    throw error;
  }
}

export default {
  createConnectAccount,
  getConnectAccountStatus,
  createSubscription,
  cancelSubscription,
  updateSubscriptionPlan,
  createPaymentWithFee,
  handleStripeWebhook,
  SUBSCRIPTION_PLANS,
};
