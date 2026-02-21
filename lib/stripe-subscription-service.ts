import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe-config';
import logger from '@/lib/logger';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

interface SyncProductResult {
  productId: string;
  priceIdMonthly: string;
  priceIdAnnual?: string;
}

interface CustomerParams {
  email: string;
  name: string;
  companyId: string;
}

interface CheckoutParams {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string | null>;
  trialDays?: number;
  stripeCouponId?: string;
}

async function syncProductToStripe(
  name: string,
  description: string,
  metaKey: string,
  metaValue: string,
  monthlyAmountCents: number,
  annualAmountCents: number,
  extraMeta: Record<string, string> = {}
): Promise<SyncProductResult | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const existing = await stripe.products.search({
      query: `metadata['${metaKey}']:'${metaValue}'`,
    });

    let product: Stripe.Product;
    if (existing.data.length > 0) {
      product = await stripe.products.update(existing.data[0].id, {
        name,
        description,
        metadata: { [metaKey]: metaValue, ...extraMeta },
      });
    } else {
      product = await stripe.products.create({
        name,
        description,
        metadata: { [metaKey]: metaValue, ...extraMeta },
      });
    }

    const prices = await stripe.prices.list({ product: product.id, active: true });
    let priceMonthly = prices.data.find((p) => p.recurring?.interval === 'month');
    let priceAnnual = prices.data.find((p) => p.recurring?.interval === 'year');

    if (!priceMonthly || priceMonthly.unit_amount !== monthlyAmountCents) {
      if (priceMonthly) await stripe.prices.update(priceMonthly.id, { active: false });
      priceMonthly = await stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: monthlyAmountCents,
        recurring: { interval: 'month' },
        metadata: { [metaKey]: metaValue, interval: 'monthly' },
      });
    }

    if (!priceAnnual || priceAnnual.unit_amount !== annualAmountCents) {
      if (priceAnnual) await stripe.prices.update(priceAnnual.id, { active: false });
      priceAnnual = await stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: annualAmountCents,
        recurring: { interval: 'year' },
        metadata: { [metaKey]: metaValue, interval: 'annual' },
      });
    }

    return {
      productId: product.id,
      priceIdMonthly: priceMonthly.id,
      priceIdAnnual: priceAnnual.id,
    };
  } catch (error) {
    logger.error(`[StripeSubscriptionService] Error syncing product ${name}:`, error);
    return null;
  }
}

export const stripeSubscriptionService = {
  async syncPlanToStripe(plan: {
    id: string;
    nombre: string;
    descripcion: string;
    precioMensual: number;
    precioAnual: number;
    tier: string;
  }): Promise<SyncProductResult | null> {
    return syncProductToStripe(
      `INMOVA ${plan.nombre}`,
      plan.descripcion,
      'inmovaId',
      plan.id,
      Math.round(plan.precioMensual * 100),
      Math.round(plan.precioAnual * 100),
      { tier: plan.tier, type: 'subscription_plan' }
    );
  },

  async syncAddOnToStripe(addon: {
    id: string;
    codigo: string;
    nombre: string;
    descripcion: string;
    precioMensual: number;
    precioAnual?: number;
    categoria: string;
  }): Promise<SyncProductResult | null> {
    const annualPrice = addon.precioAnual || addon.precioMensual * 10;
    return syncProductToStripe(
      `INMOVA Add-on: ${addon.nombre}`,
      addon.descripcion,
      'inmovaAddonId',
      addon.id,
      Math.round(addon.precioMensual * 100),
      Math.round(annualPrice * 100),
      { codigo: addon.codigo, categoria: addon.categoria, type: 'addon' }
    );
  },

  async getOrCreateCustomer(params: CustomerParams): Promise<string | null> {
    const stripe = getStripe();
    if (!stripe) return null;
    const prisma = await getPrisma();

    try {
      const company = await prisma.company.findUnique({
        where: { id: params.companyId },
        select: { stripeCustomerId: true },
      });

      if (company?.stripeCustomerId) {
        return company.stripeCustomerId;
      }

      const existingCustomers = await stripe.customers.list({
        email: params.email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        const customerId = existingCustomers.data[0].id;
        await prisma.company.update({
          where: { id: params.companyId },
          data: { stripeCustomerId: customerId },
        });
        return customerId;
      }

      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: { companyId: params.companyId },
      });

      await prisma.company.update({
        where: { id: params.companyId },
        data: { stripeCustomerId: customer.id },
      });

      return customer.id;
    } catch (error) {
      logger.error('[StripeSubscriptionService] Error creating customer:', error);
      return null;
    }
  },

  async createCheckoutSession(params: CheckoutParams): Promise<string | null> {
    const stripe = getStripe();
    if (!stripe) return null;

    try {
      const cleanMetadata: Record<string, string> = {};
      for (const [key, value] of Object.entries(params.metadata)) {
        if (value !== null && value !== undefined) {
          cleanMetadata[key] = value;
        }
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: params.customerId,
        mode: 'subscription',
        line_items: [{ price: params.priceId, quantity: 1 }],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: {
          metadata: cleanMetadata,
          ...(params.trialDays && params.trialDays > 0
            ? { trial_period_days: params.trialDays }
            : {}),
        },
        metadata: cleanMetadata,
      };

      if (params.stripeCouponId) {
        sessionParams.discounts = [{ coupon: params.stripeCouponId }];
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      return session.url;
    } catch (error) {
      logger.error('[StripeSubscriptionService] Error creating checkout session:', error);
      return null;
    }
  },

  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<boolean> {
    const stripe = getStripe();
    if (!stripe) return false;

    try {
      if (immediately) {
        await stripe.subscriptions.cancel(subscriptionId);
      } else {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }
      return true;
    } catch (error) {
      logger.error('[StripeSubscriptionService] Error canceling subscription:', error);
      return false;
    }
  },

  async syncAllToStripe(): Promise<{
    plans: { synced: number; failed: number };
    addons: { synced: number; failed: number };
  }> {
    const prisma = await getPrisma();
    const result = {
      plans: { synced: 0, failed: 0 },
      addons: { synced: 0, failed: 0 },
    };

    const plans = await prisma.subscriptionPlan.findMany({ where: { activo: true } });
    for (const plan of plans) {
      const synced = await this.syncPlanToStripe({
        id: plan.id,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precioMensual: plan.precioMensual,
        precioAnual: plan.precioMensual * 10,
        tier: plan.tier,
      });
      if (synced) {
        result.plans.synced++;
      } else {
        result.plans.failed++;
      }
    }

    const addons = await prisma.addOn.findMany({ where: { activo: true } });
    for (const addon of addons) {
      const synced = await this.syncAddOnToStripe({
        id: addon.id,
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual || undefined,
        categoria: addon.categoria,
      });

      if (synced) {
        await prisma.addOn.update({
          where: { id: addon.id },
          data: {
            stripeProductId: synced.productId,
            stripePriceIdMonthly: synced.priceIdMonthly,
            stripePriceIdAnnual: synced.priceIdAnnual,
          },
        });
        result.addons.synced++;
      } else {
        result.addons.failed++;
      }
    }

    return result;
  },
};
