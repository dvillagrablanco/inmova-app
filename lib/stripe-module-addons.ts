/**
 * Servicio de Stripe para Módulos Add-on
 * 
 * Gestiona:
 * - Sincronización de módulos add-on con Stripe (productos y precios)
 * - Compra y activación de add-ons
 * - Facturación automática mensual
 * - Envío de facturas por email
 * 
 * @module StripeModuleAddons
 */

import Stripe from 'stripe';
import { MODULE_ADDON_PRICES, PLAN_INFO, type PlanTier } from './modules-pricing-config';
import logger from './logger';

// Lazy initialization de Stripe
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe | null {
  if (stripeInstance) return stripeInstance;
  
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[Stripe Module Addons] STRIPE_SECRET_KEY no definida');
    return null;
  }

  try {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
    return stripeInstance;
  } catch (error) {
    console.error('[Stripe Module Addons] Error inicializando:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════════════════════

export interface ModuleAddonStripeIds {
  productId: string;
  priceIdMonthly: string;
  priceIdAnnual?: string;
}

export interface AddonPurchaseResult {
  success: boolean;
  subscriptionId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface InvoiceResult {
  success: boolean;
  invoiceId?: string;
  invoiceUrl?: string;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// SINCRONIZACIÓN CON STRIPE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sincroniza todos los módulos add-on con Stripe
 * Crea productos y precios si no existen
 */
export async function syncAllModuleAddonsToStripe(): Promise<{
  synced: number;
  errors: string[];
}> {
  const stripe = getStripe();
  if (!stripe) {
    return { synced: 0, errors: ['Stripe no configurado'] };
  }

  const results = { synced: 0, errors: [] as string[] };

  for (const [moduleId, addon] of Object.entries(MODULE_ADDON_PRICES)) {
    try {
      await syncModuleAddonToStripe(moduleId, addon);
      results.synced++;
      logger.info(`[Stripe] Módulo add-on sincronizado: ${moduleId}`);
    } catch (error: any) {
      results.errors.push(`${moduleId}: ${error.message}`);
      logger.error(`[Stripe] Error sincronizando ${moduleId}:`, error);
    }
  }

  return results;
}

/**
 * Sincroniza un módulo add-on específico con Stripe
 */
async function syncModuleAddonToStripe(
  moduleId: string,
  addon: typeof MODULE_ADDON_PRICES[string]
): Promise<ModuleAddonStripeIds> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error('Stripe no configurado');
  }

  const productKey = `inmova_module_${moduleId}`;

  // 1. Buscar o crear producto
  let product: Stripe.Product;
  const existingProducts = await stripe.products.search({
    query: `metadata['module_id']:'${moduleId}'`,
  });

  if (existingProducts.data.length > 0) {
    product = await stripe.products.update(existingProducts.data[0].id, {
      name: `INMOVA - ${addon.description.split(' - ')[0] || moduleId}`,
      description: addon.description,
      metadata: {
        module_id: moduleId,
        category: addon.category,
        type: 'module_addon',
      },
    });
  } else {
    product = await stripe.products.create({
      name: `INMOVA - ${addon.description.split(' - ')[0] || moduleId}`,
      description: addon.description,
      metadata: {
        module_id: moduleId,
        category: addon.category,
        type: 'module_addon',
      },
    });
  }

  // 2. Buscar o crear precios
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

  // Crear precio mensual si no existe o tiene precio diferente
  const monthlyAmount = Math.round(addon.monthlyPrice * 100);
  if (!priceMonthly || priceMonthly.unit_amount !== monthlyAmount) {
    // Desactivar precio anterior si existe
    if (priceMonthly) {
      await stripe.prices.update(priceMonthly.id, { active: false });
    }
    priceMonthly = await stripe.prices.create({
      product: product.id,
      unit_amount: monthlyAmount,
      currency: 'eur',
      recurring: { interval: 'month' },
      metadata: { module_id: moduleId, interval: 'monthly' },
    });
  }

  // Crear precio anual si aplica
  const annualAmount = Math.round(addon.annualPrice * 100);
  if (addon.annualPrice && (!priceAnnual || priceAnnual.unit_amount !== annualAmount)) {
    if (priceAnnual) {
      await stripe.prices.update(priceAnnual.id, { active: false });
    }
    priceAnnual = await stripe.prices.create({
      product: product.id,
      unit_amount: annualAmount,
      currency: 'eur',
      recurring: { interval: 'year' },
      metadata: { module_id: moduleId, interval: 'annual' },
    });
  }

  return {
    productId: product.id,
    priceIdMonthly: priceMonthly.id,
    priceIdAnnual: priceAnnual?.id,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPRA DE ADD-ONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Crea una sesión de Stripe Checkout para comprar un módulo add-on
 */
export async function purchaseModuleAddon(params: {
  moduleId: string;
  companyId: string;
  userId: string;
  userEmail: string;
  stripeCustomerId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<AddonPurchaseResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe no configurado' };
  }

  const addon = MODULE_ADDON_PRICES[params.moduleId];
  if (!addon) {
    return { success: false, error: 'Módulo add-on no encontrado' };
  }

  try {
    // 1. Obtener o crear customer de Stripe
    let customerId = params.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: params.userEmail,
        metadata: {
          company_id: params.companyId,
          user_id: params.userId,
        },
      });
      customerId = customer.id;
    }

    // 2. Buscar el precio del módulo en Stripe
    const products = await stripe.products.search({
      query: `metadata['module_id']:'${params.moduleId}'`,
    });

    if (products.data.length === 0) {
      // Sincronizar si no existe
      await syncModuleAddonToStripe(params.moduleId, addon);
    }

    // 3. Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `INMOVA Add-on: ${params.moduleId}`,
              description: addon.description,
              metadata: {
                module_id: params.moduleId,
                type: 'module_addon',
              },
            },
            recurring: { interval: 'month' },
            unit_amount: Math.round(addon.monthlyPrice * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
      subscription_data: {
        metadata: {
          company_id: params.companyId,
          module_id: params.moduleId,
          type: 'module_addon',
        },
      },
      // Configurar facturación automática
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `INMOVA - Add-on: ${addon.description}`,
          metadata: {
            company_id: params.companyId,
            module_id: params.moduleId,
          },
          footer: 'Gracias por confiar en INMOVA. Este cargo se realizará mensualmente.',
        },
      },
      // Enviar factura por email automáticamente
      automatic_tax: { enabled: false },
    });

    return {
      success: true,
      checkoutUrl: session.url || undefined,
    };
  } catch (error: any) {
    logger.error('[Stripe] Error en purchaseModuleAddon:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Añade un módulo add-on a una suscripción existente
 */
export async function addModuleToSubscription(params: {
  subscriptionId: string;
  moduleId: string;
  companyId: string;
}): Promise<AddonPurchaseResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe no configurado' };
  }

  const addon = MODULE_ADDON_PRICES[params.moduleId];
  if (!addon) {
    return { success: false, error: 'Módulo add-on no encontrado' };
  }

  try {
    // Obtener suscripción actual
    const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);

    // Buscar precio del módulo
    const products = await stripe.products.search({
      query: `metadata['module_id']:'${params.moduleId}'`,
    });

    let priceId: string;
    if (products.data.length > 0) {
      const prices = await stripe.prices.list({
        product: products.data[0].id,
        active: true,
      });
      const monthlyPrice = prices.data.find(p => p.recurring?.interval === 'month');
      if (!monthlyPrice) {
        throw new Error('Precio mensual no encontrado');
      }
      priceId = monthlyPrice.id;
    } else {
      // Sincronizar y obtener precio
      const ids = await syncModuleAddonToStripe(params.moduleId, addon);
      priceId = ids.priceIdMonthly;
    }

    // Añadir item a la suscripción
    const updatedSubscription = await stripe.subscriptions.update(params.subscriptionId, {
      items: [
        ...subscription.items.data.map(item => ({ id: item.id })),
        { price: priceId },
      ],
      proration_behavior: 'create_prorations', // Prorrateo automático
    });

    return {
      success: true,
      subscriptionId: updatedSubscription.id,
    };
  } catch (error: any) {
    logger.error('[Stripe] Error en addModuleToSubscription:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Elimina un módulo add-on de una suscripción
 */
export async function removeModuleFromSubscription(params: {
  subscriptionId: string;
  moduleId: string;
}): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe no configurado' };
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);

    // Buscar el item del módulo
    const moduleItem = subscription.items.data.find(item => {
      const product = item.price.product as Stripe.Product;
      return product.metadata?.module_id === params.moduleId;
    });

    if (!moduleItem) {
      return { success: false, error: 'Módulo no encontrado en la suscripción' };
    }

    // Eliminar item
    await stripe.subscriptionItems.del(moduleItem.id, {
      proration_behavior: 'create_prorations',
    });

    return { success: true };
  } catch (error: any) {
    logger.error('[Stripe] Error en removeModuleFromSubscription:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FACTURACIÓN AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Configura la facturación automática para una empresa
 */
export async function setupAutomaticBilling(params: {
  customerId: string;
  email: string;
  companyName: string;
  taxId?: string;
  address?: {
    line1: string;
    city: string;
    postal_code: string;
    country: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe no configurado' };
  }

  try {
    // Actualizar cliente con datos de facturación
    await stripe.customers.update(params.customerId, {
      name: params.companyName,
      email: params.email,
      tax_exempt: 'none',
      address: params.address,
      invoice_settings: {
        default_payment_method: undefined, // Se configurará al añadir tarjeta
        footer: 'INMOVA PropTech Solutions - www.inmovaapp.com',
      },
      metadata: {
        company_name: params.companyName,
        billing_email: params.email,
      },
    });

    // Añadir NIF/CIF si está disponible
    if (params.taxId) {
      await stripe.customers.createTaxId(params.customerId, {
        type: 'es_cif', // CIF español
        value: params.taxId,
      });
    }

    return { success: true };
  } catch (error: any) {
    logger.error('[Stripe] Error en setupAutomaticBilling:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Genera y envía una factura manual
 */
export async function generateInvoice(params: {
  customerId: string;
  items: Array<{
    description: string;
    amount: number; // En euros
    quantity?: number;
  }>;
  sendEmail?: boolean;
}): Promise<InvoiceResult> {
  const stripe = getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe no configurado' };
  }

  try {
    // Crear items de factura
    for (const item of params.items) {
      await stripe.invoiceItems.create({
        customer: params.customerId,
        amount: Math.round(item.amount * 100),
        currency: 'eur',
        description: item.description,
        quantity: item.quantity || 1,
      });
    }

    // Crear factura
    const invoice = await stripe.invoices.create({
      customer: params.customerId,
      auto_advance: true, // Finalizar automáticamente
      collection_method: 'charge_automatically',
      description: 'Factura INMOVA - Servicios de gestión inmobiliaria',
    });

    // Finalizar factura
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    // Enviar por email si se solicita
    if (params.sendEmail) {
      await stripe.invoices.sendInvoice(finalizedInvoice.id);
    }

    return {
      success: true,
      invoiceId: finalizedInvoice.id,
      invoiceUrl: finalizedInvoice.hosted_invoice_url || undefined,
    };
  } catch (error: any) {
    logger.error('[Stripe] Error en generateInvoice:', error);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Procesa eventos de webhook de Stripe relacionados con módulos
 */
export async function handleModuleWebhook(event: Stripe.Event): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.type === 'module_addon') {
        logger.info('[Stripe Webhook] Módulo add-on comprado', {
          moduleId: session.metadata.module_id,
          companyId: session.metadata.company_id,
        });
        // Aquí se activaría el módulo en la BD
        // await activateModuleForCompany(session.metadata.company_id, session.metadata.module_id)
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      logger.info('[Stripe Webhook] Factura pagada', {
        invoiceId: invoice.id,
        amount: invoice.amount_paid,
        customerEmail: invoice.customer_email,
      });
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      logger.warn('[Stripe Webhook] Pago de factura fallido', {
        invoiceId: invoice.id,
        customerEmail: invoice.customer_email,
      });
      // Enviar notificación al usuario
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.metadata?.type === 'module_addon') {
        logger.info('[Stripe Webhook] Suscripción de módulo cancelada', {
          moduleId: subscription.metadata.module_id,
          companyId: subscription.metadata.company_id,
        });
        // Desactivar módulo en la BD
        // await deactivateModuleForCompany(subscription.metadata.company_id, subscription.metadata.module_id)
      }
      break;
    }

    default:
      // Evento no manejado
      break;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Obtiene el historial de facturas de un cliente
 */
export async function getCustomerInvoices(customerId: string): Promise<Stripe.Invoice[]> {
  const stripe = getStripe();
  if (!stripe) return [];

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
    });
    return invoices.data;
  } catch (error) {
    logger.error('[Stripe] Error obteniendo facturas:', error);
    return [];
  }
}

/**
 * Obtiene los módulos add-on activos de un cliente
 */
export async function getActiveModuleAddons(customerId: string): Promise<string[]> {
  const stripe = getStripe();
  if (!stripe) return [];

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });

    const moduleIds: string[] = [];
    for (const sub of subscriptions.data) {
      if (sub.metadata?.type === 'module_addon' && sub.metadata?.module_id) {
        moduleIds.push(sub.metadata.module_id);
      }
      // También buscar en items individuales
      for (const item of sub.items.data) {
        const product = item.price.product as Stripe.Product;
        if (product.metadata?.module_id) {
          moduleIds.push(product.metadata.module_id);
        }
      }
    }

    return [...new Set(moduleIds)]; // Eliminar duplicados
  } catch (error) {
    logger.error('[Stripe] Error obteniendo módulos activos:', error);
    return [];
  }
}
