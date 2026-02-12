/**
 * Script para sincronizar planes y add-ons con Stripe LIVE
 * Ejecutar: npx tsx scripts/sync-stripe-products.ts
 */
import 'dotenv/config';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_KEY) {
  console.error('STRIPE_SECRET_KEY no configurada');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2024-12-18.acacia' as any });

// Planes desde pricing-config.ts
const PLANS = [
  { id: 'starter', name: 'Starter', description: 'Perfecto para propietarios particulares', monthly: 3500, annual: 35000, tier: 'starter' },
  { id: 'professional', name: 'Profesional', description: 'Para propietarios activos y pequeñas agencias', monthly: 5900, annual: 59000, tier: 'professional' },
  { id: 'business', name: 'Business', description: 'Para gestoras profesionales y agencias', monthly: 12900, annual: 129000, tier: 'business' },
  { id: 'enterprise', name: 'Enterprise', description: 'Para grandes empresas y SOCIMIs', monthly: 29900, annual: 299000, tier: 'enterprise' },
];

// Add-ons desde pricing-config.ts
const ADDONS = [
  // Usage packs
  { id: 'signatures_pack_10', code: 'signatures_10', name: 'Pack 10 Firmas Digitales', cat: 'usage', monthly: 1500, annual: 15000 },
  { id: 'signatures_pack_50', code: 'signatures_50', name: 'Pack 50 Firmas Digitales', cat: 'usage', monthly: 6000, annual: 60000 },
  { id: 'signatures_pack_100', code: 'signatures_100', name: 'Pack 100 Firmas Digitales', cat: 'usage', monthly: 10000, annual: 100000 },
  { id: 'sms_pack_100', code: 'sms_100', name: 'Pack 100 SMS/WhatsApp', cat: 'usage', monthly: 1000, annual: 10000 },
  { id: 'sms_pack_500', code: 'sms_500', name: 'Pack 500 SMS/WhatsApp', cat: 'usage', monthly: 4000, annual: 40000 },
  { id: 'sms_pack_1000', code: 'sms_1000', name: 'Pack 1000 SMS/WhatsApp', cat: 'usage', monthly: 7000, annual: 70000 },
  { id: 'ai_pack_50k', code: 'ai_50k', name: 'Pack IA Básico (50K tokens)', cat: 'usage', monthly: 1000, annual: 10000 },
  { id: 'ai_pack_200k', code: 'ai_200k', name: 'Pack IA Avanzado (200K tokens)', cat: 'usage', monthly: 3500, annual: 35000 },
  { id: 'ai_pack_500k', code: 'ai_500k', name: 'Pack IA Enterprise (500K tokens)', cat: 'usage', monthly: 7500, annual: 75000 },
  { id: 'storage_pack_10gb', code: 'storage_10gb', name: 'Pack 10GB Storage', cat: 'usage', monthly: 500, annual: 5000 },
  { id: 'storage_pack_50gb', code: 'storage_50gb', name: 'Pack 50GB Storage', cat: 'usage', monthly: 2000, annual: 20000 },
  { id: 'storage_pack_100gb', code: 'storage_100gb', name: 'Pack 100GB Storage', cat: 'usage', monthly: 3500, annual: 35000 },
  // Feature add-ons
  { id: 'advanced_reports', code: 'advanced_reports', name: 'Reportes Avanzados', cat: 'feature', monthly: 1500, annual: 15000 },
  { id: 'multi_language', code: 'multi_language', name: 'Multi-idioma', cat: 'feature', monthly: 1000, annual: 10000 },
  { id: 'portal_sync', code: 'portal_sync', name: 'Publicación en Portales', cat: 'feature', monthly: 2500, annual: 25000 },
  { id: 'auto_reminders', code: 'auto_reminders', name: 'Recordatorios Automáticos', cat: 'feature', monthly: 800, annual: 8000 },
  { id: 'tenant_screening', code: 'tenant_screening', name: 'Screening de Inquilinos', cat: 'feature', monthly: 2000, annual: 20000 },
  { id: 'accounting_integration', code: 'accounting_integration', name: 'Integración Contabilidad', cat: 'feature', monthly: 3000, annual: 30000 },
  // Premium add-ons
  { id: 'whitelabel_basic', code: 'whitelabel_basic', name: 'White-Label Básico', cat: 'premium', monthly: 3500, annual: 35000 },
  { id: 'whitelabel_full', code: 'whitelabel_full', name: 'White-Label Completo', cat: 'premium', monthly: 9900, annual: 99000 },
  { id: 'api_access', code: 'api_access', name: 'Acceso API REST', cat: 'premium', monthly: 4900, annual: 49000 },
  { id: 'esg_module', code: 'esg_module', name: 'ESG & Sostenibilidad', cat: 'premium', monthly: 5000, annual: 50000 },
  { id: 'pricing_ai', code: 'pricing_ai', name: 'Pricing Dinámico IA', cat: 'premium', monthly: 4500, annual: 45000 },
  { id: 'tours_vr', code: 'tours_vr', name: 'Tours Virtuales 360°', cat: 'premium', monthly: 3500, annual: 35000 },
  { id: 'iot_smart', code: 'iot_smart', name: 'IoT & Smart Buildings', cat: 'premium', monthly: 7500, annual: 75000 },
  { id: 'dedicated_support', code: 'dedicated_support', name: 'Soporte Dedicado', cat: 'premium', monthly: 9900, annual: 99000 },
];

async function syncProduct(name: string, description: string, metaKey: string, metaValue: string, monthly: number, annual: number, extraMeta: Record<string, string> = {}) {
  // Search existing
  const existing = await stripe.products.search({ query: `metadata['${metaKey}']:'${metaValue}'` });
  
  let product: Stripe.Product;
  if (existing.data.length > 0) {
    product = await stripe.products.update(existing.data[0].id, {
      name, description,
      metadata: { [metaKey]: metaValue, ...extraMeta },
    });
  } else {
    product = await stripe.products.create({
      name, description,
      metadata: { [metaKey]: metaValue, ...extraMeta },
    });
  }

  // Get existing prices
  const prices = await stripe.prices.list({ product: product.id, active: true });
  let priceMonthly = prices.data.find(p => p.recurring?.interval === 'month');
  let priceAnnual = prices.data.find(p => p.recurring?.interval === 'year');

  // Monthly
  if (!priceMonthly || priceMonthly.unit_amount !== monthly) {
    if (priceMonthly) await stripe.prices.update(priceMonthly.id, { active: false });
    priceMonthly = await stripe.prices.create({
      product: product.id, currency: 'eur', unit_amount: monthly,
      recurring: { interval: 'month' },
      metadata: { [metaKey]: metaValue, interval: 'monthly' },
    });
  }

  // Annual
  if (!priceAnnual || priceAnnual.unit_amount !== annual) {
    if (priceAnnual) await stripe.prices.update(priceAnnual.id, { active: false });
    priceAnnual = await stripe.prices.create({
      product: product.id, currency: 'eur', unit_amount: annual,
      recurring: { interval: 'year' },
      metadata: { [metaKey]: metaValue, interval: 'annual' },
    });
  }

  return { productId: product.id, monthlyPriceId: priceMonthly.id, annualPriceId: priceAnnual.id };
}

async function main() {
  console.log('=' .repeat(70));
  console.log('SINCRONIZACION DE PLANES Y ADD-ONS CON STRIPE');
  console.log('=' .repeat(70));
  
  // Verify Stripe connection
  const balance = await stripe.balance.retrieve();
  console.log(`Stripe conectado: ${balance.available[0]?.amount ?? 0} ${balance.available[0]?.currency ?? 'eur'} cents disponible\n`);

  // === PLANS ===
  console.log('--- PLANES DE SUSCRIPCION ---\n');
  const planResults: Record<string, any> = {};
  
  for (const plan of PLANS) {
    try {
      const result = await syncProduct(
        `INMOVA ${plan.name}`,
        plan.description,
        'inmovaId', plan.id,
        plan.monthly, plan.annual,
        { tier: plan.tier, type: 'subscription_plan' }
      );
      planResults[plan.id] = result;
      console.log(`  ✅ ${plan.name}: prod=${result.productId} | month=${result.monthlyPriceId} | year=${result.annualPriceId}`);
      
      // Update DB
      await prisma.subscriptionPlan.updateMany({
        where: { tier: plan.tier as any },
        data: {
          stripeProductId: result.productId,
          stripePriceId: result.monthlyPriceId,
        },
      });
    } catch (e: any) {
      console.log(`  ❌ ${plan.name}: ${e.message}`);
    }
  }

  // === ADD-ONS ===
  console.log('\n--- ADD-ONS ---\n');
  let syncedAddons = 0;
  let failedAddons = 0;

  for (const addon of ADDONS) {
    try {
      const result = await syncProduct(
        `INMOVA Add-on: ${addon.name}`,
        addon.name,
        'inmovaAddonId', addon.id,
        addon.monthly, addon.annual,
        { codigo: addon.code, categoria: addon.cat, type: 'addon' }
      );

      // Update addon in DB
      const updated = await prisma.addOn.updateMany({
        where: { codigo: addon.code },
        data: {
          stripeProductId: result.productId,
          stripePriceIdMonthly: result.monthlyPriceId,
          stripePriceIdAnnual: result.annualPriceId,
        },
      });

      syncedAddons++;
      console.log(`  ✅ ${addon.name} (€${addon.monthly/100}/mes): prod=${result.productId}`);
    } catch (e: any) {
      failedAddons++;
      console.log(`  ❌ ${addon.name}: ${e.message}`);
    }
  }

  console.log('\n' + '=' .repeat(70));
  console.log(`RESULTADO: ${PLANS.length} planes + ${syncedAddons} add-ons sincronizados (${failedAddons} fallos)`);
  console.log('=' .repeat(70));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
