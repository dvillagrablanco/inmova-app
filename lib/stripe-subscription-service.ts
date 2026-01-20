/**
 * Servicio de Suscripciones con Stripe
 * 
 * Gestiona la sincronización de planes y add-ons con Stripe:
 * - Crear/actualizar productos en Stripe
 * - Crear/actualizar precios en Stripe
 * - Suscribir empresas a planes
 * - Añadir/quitar add-ons a suscripciones
 * 
 * @module StripeSubscriptionService
 */

import Stripe from 'stripe';
import logger from './logger';

// ═══════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance;

  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn('[Stripe Subscription] STRIPE_SECRET_KEY no definida');
    return null;
  }

  try {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    });
    return stripeInstance;
  } catch (error) {
    logger.error('[Stripe Subscription] Error inicializando:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════

export interface PlanForStripe {
  id: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioAnual?: number;
  tier: string;
  features?: string[];
}

export interface AddOnForStripe {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioAnual?: number;
  categoria: string;
}

export interface StripeIds {
  productId: string;
  priceIdMonthly: string;
  priceIdAnnual?: string;
}

// ═══════════════════════════════════════════════════════════════
// SINCRONIZACIÓN DE PRODUCTOS
// ═══════════════════════════════════════════════════════════════

/**
 * Sincroniza un plan de suscripción con Stripe
 * Crea el producto y precios si no existen
 */
export async function syncPlanToStripe(plan: PlanForStripe): Promise<StripeIds | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    // Buscar producto existente por metadata
    const existingProducts = await stripe.products.search({
      query: `metadata['inmovaId']:'${plan.id}'`,
    });

    let product: Stripe.Product;

    if (existingProducts.data.length > 0) {
      // Actualizar producto existente
      product = await stripe.products.update(existingProducts.data[0].id, {
        name: `INMOVA ${plan.nombre}`,
        description: plan.descripcion,
        metadata: {
          inmovaId: plan.id,
          tier: plan.tier,
          type: 'subscription_plan',
        },
      });
      logger.info(`[Stripe] Producto actualizado: ${product.id}`);
    } else {
      // Crear nuevo producto
      product = await stripe.products.create({
        name: `INMOVA ${plan.nombre}`,
        description: plan.descripcion,
        metadata: {
          inmovaId: plan.id,
          tier: plan.tier,
          type: 'subscription_plan',
        },
      });
      logger.info(`[Stripe] Producto creado: ${product.id}`);
    }

    // Buscar precio mensual existente
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    let priceMonthly: Stripe.Price | undefined;
    let priceAnnual: Stripe.Price | undefined;

    for (const price of existingPrices.data) {
      if (price.recurring?.interval === 'month') {
        priceMonthly = price;
      } else if (price.recurring?.interval === 'year') {
        priceAnnual = price;
      }
    }

    // Crear precio mensual si no existe o si cambió
    if (!priceMonthly || priceMonthly.unit_amount !== Math.round(plan.precioMensual * 100)) {
      // Desactivar precio anterior
      if (priceMonthly) {
        await stripe.prices.update(priceMonthly.id, { active: false });
      }

      priceMonthly = await stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: Math.round(plan.precioMensual * 100),
        recurring: { interval: 'month' },
        metadata: {
          inmovaId: plan.id,
          interval: 'monthly',
        },
      });
      logger.info(`[Stripe] Precio mensual creado: ${priceMonthly.id}`);
    }

    // Crear precio anual si se especifica
    if (plan.precioAnual && plan.precioAnual > 0) {
      if (!priceAnnual || priceAnnual.unit_amount !== Math.round(plan.precioAnual * 100)) {
        if (priceAnnual) {
          await stripe.prices.update(priceAnnual.id, { active: false });
        }

        priceAnnual = await stripe.prices.create({
          product: product.id,
          currency: 'eur',
          unit_amount: Math.round(plan.precioAnual * 100),
          recurring: { interval: 'year' },
          metadata: {
            inmovaId: plan.id,
            interval: 'annual',
          },
        });
        logger.info(`[Stripe] Precio anual creado: ${priceAnnual.id}`);
      }
    }

    return {
      productId: product.id,
      priceIdMonthly: priceMonthly.id,
      priceIdAnnual: priceAnnual?.id,
    };
  } catch (error: any) {
    logger.error(`[Stripe] Error sincronizando plan ${plan.id}:`, error);
    return null;
  }
}

/**
 * Sincroniza un add-on con Stripe
 */
export async function syncAddOnToStripe(addon: AddOnForStripe): Promise<StripeIds | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    // Buscar producto existente
    const existingProducts = await stripe.products.search({
      query: `metadata['inmovaAddonId']:'${addon.id}'`,
    });

    let product: Stripe.Product;

    if (existingProducts.data.length > 0) {
      product = await stripe.products.update(existingProducts.data[0].id, {
        name: `INMOVA Add-on: ${addon.nombre}`,
        description: addon.descripcion,
        metadata: {
          inmovaAddonId: addon.id,
          codigo: addon.codigo,
          categoria: addon.categoria,
          type: 'addon',
        },
      });
    } else {
      product = await stripe.products.create({
        name: `INMOVA Add-on: ${addon.nombre}`,
        description: addon.descripcion,
        metadata: {
          inmovaAddonId: addon.id,
          codigo: addon.codigo,
          categoria: addon.categoria,
          type: 'addon',
        },
      });
    }

    // Buscar precios existentes
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    let priceMonthly: Stripe.Price | undefined;
    let priceAnnual: Stripe.Price | undefined;

    for (const price of existingPrices.data) {
      if (price.recurring?.interval === 'month') {
        priceMonthly = price;
      } else if (price.recurring?.interval === 'year') {
        priceAnnual = price;
      }
    }

    // Crear/actualizar precio mensual
    if (!priceMonthly || priceMonthly.unit_amount !== Math.round(addon.precioMensual * 100)) {
      if (priceMonthly) {
        await stripe.prices.update(priceMonthly.id, { active: false });
      }

      priceMonthly = await stripe.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: Math.round(addon.precioMensual * 100),
        recurring: { interval: 'month' },
        metadata: {
          inmovaAddonId: addon.id,
          codigo: addon.codigo,
        },
      });
    }

    // Precio anual
    if (addon.precioAnual && addon.precioAnual > 0) {
      if (!priceAnnual || priceAnnual.unit_amount !== Math.round(addon.precioAnual * 100)) {
        if (priceAnnual) {
          await stripe.prices.update(priceAnnual.id, { active: false });
        }

        priceAnnual = await stripe.prices.create({
          product: product.id,
          currency: 'eur',
          unit_amount: Math.round(addon.precioAnual * 100),
          recurring: { interval: 'year' },
          metadata: {
            inmovaAddonId: addon.id,
            codigo: addon.codigo,
          },
        });
      }
    }

    return {
      productId: product.id,
      priceIdMonthly: priceMonthly.id,
      priceIdAnnual: priceAnnual?.id,
    };
  } catch (error: any) {
    logger.error(`[Stripe] Error sincronizando add-on ${addon.id}:`, error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE SUSCRIPCIONES
// ═══════════════════════════════════════════════════════════════

/**
 * Crea una suscripción para una empresa
 */
export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  metadata?: Record<string, string>;
  trialDays?: number;
}): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId }],
      metadata: params.metadata,
      trial_period_days: params.trialDays,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    logger.info(`[Stripe] Suscripción creada: ${subscription.id}`);
    return subscription;
  } catch (error: any) {
    logger.error('[Stripe] Error creando suscripción:', error);
    return null;
  }
}

/**
 * Añade un add-on a una suscripción existente
 */
export async function addAddOnToSubscription(params: {
  subscriptionId: string;
  addOnPriceId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const subscription = await stripe.subscriptions.update(params.subscriptionId, {
      items: [
        { price: params.addOnPriceId },
      ],
      proration_behavior: 'create_prorations',
      metadata: params.metadata,
    });

    logger.info(`[Stripe] Add-on añadido a suscripción: ${subscription.id}`);
    return subscription;
  } catch (error: any) {
    logger.error('[Stripe] Error añadiendo add-on:', error);
    return null;
  }
}

/**
 * Elimina un add-on de una suscripción
 */
export async function removeAddOnFromSubscription(params: {
  subscriptionId: string;
  subscriptionItemId: string;
}): Promise<boolean> {
  const stripe = getStripe();
  if (!stripe) return false;

  try {
    await stripe.subscriptionItems.del(params.subscriptionItemId, {
      proration_behavior: 'create_prorations',
    });

    logger.info(`[Stripe] Add-on eliminado de suscripción`);
    return true;
  } catch (error: any) {
    logger.error('[Stripe] Error eliminando add-on:', error);
    return false;
  }
}

/**
 * Obtiene los detalles de una suscripción
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price.product', 'customer'],
    });
  } catch (error: any) {
    logger.error('[Stripe] Error obteniendo suscripción:', error);
    return null;
  }
}

/**
 * Cancela una suscripción
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    if (immediately) {
      return await stripe.subscriptions.cancel(subscriptionId);
    } else {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
  } catch (error: any) {
    logger.error('[Stripe] Error cancelando suscripción:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE CLIENTES
// ═══════════════════════════════════════════════════════════════

/**
 * Crea o recupera un cliente de Stripe
 */
export async function getOrCreateCustomer(params: {
  email: string;
  name: string;
  companyId: string;
  metadata?: Record<string, string>;
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    // Buscar cliente existente
    const existingCustomers = await stripe.customers.search({
      query: `metadata['companyId']:'${params.companyId}'`,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0].id;
    }

    // Crear nuevo cliente
    const customer = await stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        companyId: params.companyId,
        ...params.metadata,
      },
    });

    logger.info(`[Stripe] Cliente creado: ${customer.id}`);
    return customer.id;
  } catch (error: any) {
    logger.error('[Stripe] Error creando cliente:', error);
    return null;
  }
}

/**
 * Crea una sesión de checkout para suscripción
 */
export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  trialDays?: number;
  mode?: 'subscription' | 'payment';
}): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const session = await stripe.checkout.sessions.create({
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.customerEmail,
      mode: params.mode || 'subscription',
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: params.metadata,
      subscription_data: params.mode === 'subscription' ? {
        trial_period_days: params.trialDays,
        metadata: params.metadata,
      } : undefined,
    });

    logger.info(`[Stripe] Checkout session creada: ${session.id}`);
    return session.url;
  } catch (error: any) {
    logger.error('[Stripe] Error creando checkout session:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// SINCRONIZACIÓN MASIVA
// ═══════════════════════════════════════════════════════════════

/**
 * Sincroniza todos los planes y add-ons con Stripe
 */
export async function syncAllToStripe(): Promise<{
  plans: { synced: number; failed: number };
  addons: { synced: number; failed: number };
}> {
  const result = {
    plans: { synced: 0, failed: 0 },
    addons: { synced: 0, failed: 0 },
  };

  try {
    // Lazy load Prisma
    const { getPrismaClient } = await import('./db');
    const prisma = getPrismaClient();

    // Sincronizar planes
    const plans = await prisma.subscriptionPlan.findMany({
      where: { activo: true },
    });

    for (const plan of plans) {
      const stripeIds = await syncPlanToStripe({
        id: plan.id,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precioMensual: plan.precioMensual,
        precioAnual: plan.precioMensual * 10, // 2 meses gratis
        tier: plan.tier,
      });

      if (stripeIds) {
        // Actualizar IDs en BD
        await prisma.subscriptionPlan.update({
          where: { id: plan.id },
          data: {
            // stripePriceIdMonthly: stripeIds.priceIdMonthly,
            // stripePriceIdAnnual: stripeIds.priceIdAnnual,
          },
        });
        result.plans.synced++;
      } else {
        result.plans.failed++;
      }
    }

    // Sincronizar add-ons
    const addons = await prisma.addOn.findMany({
      where: { activo: true },
    });

    for (const addon of addons) {
      const stripeIds = await syncAddOnToStripe({
        id: addon.id,
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual || undefined,
        categoria: addon.categoria,
      });

      if (stripeIds) {
        await prisma.addOn.update({
          where: { id: addon.id },
          data: {
            stripePriceIdMonthly: stripeIds.priceIdMonthly,
            stripePriceIdAnnual: stripeIds.priceIdAnnual,
          },
        });
        result.addons.synced++;
      } else {
        result.addons.failed++;
      }
    }

    logger.info('[Stripe] Sincronización completada:', result);
    return result;
  } catch (error: any) {
    logger.error('[Stripe] Error en sincronización masiva:', error);
    return result;
  }
}

export default {
  syncPlanToStripe,
  syncAddOnToStripe,
  createSubscription,
  addAddOnToSubscription,
  removeAddOnFromSubscription,
  getSubscription,
  cancelSubscription,
  getOrCreateCustomer,
  createCheckoutSession,
  syncAllToStripe,
};
