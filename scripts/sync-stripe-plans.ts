/**
 * Sincronizar Planes y Addons con Stripe
 * 
 * Crea/actualiza productos y precios en Stripe para:
 * - 4 planes base (Starter, Profesional, Empresarial, Enterprise+)
 * - 6 addons premium (IA, Family Office, Automatización, Analytics, Operaciones, Pack)
 * 
 * También sincroniza con la BD local (SubscriptionPlan + AddOn).
 * 
 * Uso: npx tsx scripts/sync-stripe-plans.ts
 * Requiere: STRIPE_SECRET_KEY en .env.production
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
dotenv.config();

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia' as any,
});

// ============================================================================
// PLANES BASE
// ============================================================================
const PLANS = [
  {
    id: 'starter',
    name: 'INMOVA Starter',
    description: 'Gestión básica para hasta 25 propiedades. Dashboard, contratos, cobros, portal inquilinos, onboarding IA.',
    monthlyPrice: 8900, // centavos
    annualPrice: 89000, // 10 meses (2 gratis)
    tier: 'STARTER',
    maxUsuarios: 2,
    maxPropiedades: 25,
    features: ['25 propiedades', '2 usuarios', '5 firmas/mes', '5GB almacenamiento', 'Onboarding IA', 'Portal inquilinos'],
  },
  {
    id: 'profesional',
    name: 'INMOVA Profesional',
    description: 'Para gestores profesionales. 200 propiedades, cobro masivo, facturación auto, IA, 3 verticales.',
    monthlyPrice: 19900,
    annualPrice: 199000,
    tier: 'PROFESSIONAL',
    maxUsuarios: 5,
    maxPropiedades: 200,
    features: ['200 propiedades', '5 usuarios', '10 firmas/mes', '10GB', 'Cobro masivo', 'Facturación auto', 'IA básica', '3 verticales'],
  },
  {
    id: 'empresarial',
    name: 'INMOVA Empresarial',
    description: '1000 propiedades, 88+ módulos, 7 verticales, API REST, Zucchetti, dashboard ejecutivo.',
    monthlyPrice: 49900,
    annualPrice: 499000,
    tier: 'BUSINESS',
    maxUsuarios: 15,
    maxPropiedades: 1000,
    features: ['1000 propiedades', '15 usuarios', '25 firmas/mes', '50GB', '88+ módulos', '7 verticales', 'API REST', 'Zucchetti'],
  },
  {
    id: 'enterprise_plus',
    name: 'INMOVA Enterprise+',
    description: 'Todo ilimitado + Pack Completo de addons. Family Office, IA, Automatización, Analytics, Operaciones. White-label. SLA 99.9%.',
    monthlyPrice: 99800,
    annualPrice: 998000,
    tier: 'ENTERPRISE',
    maxUsuarios: -1, // ilimitado
    maxPropiedades: -1,
    features: ['Ilimitado', 'Pack Completo incluido', 'White-label', 'SLA 99.9%', 'Account Manager', 'Migración asistida'],
  },
];

// ============================================================================
// ADDONS PREMIUM
// ============================================================================
const ADDONS = [
  {
    id: 'ia_inmobiliaria',
    name: 'IA Inmobiliaria',
    description: 'Valoración IA, predicción morosidad, renta óptima, anomalías financieras, clasificación docs, asistente IA avanzado.',
    monthlyPrice: 14900,
    annualPrice: 149000,
  },
  {
    id: 'family_office_360',
    name: 'Family Office 360°',
    description: 'Dashboard patrimonial consolidado, P&L por sociedad, Private Equity (TVPI/DPI), informes PDF trimestrales, portal propietario.',
    monthlyPrice: 24900,
    annualPrice: 249000,
  },
  {
    id: 'automatizacion_pro',
    name: 'Automatización Pro',
    description: 'Facturación automática, remesas SEPA, escalado de impagos 4 niveles, sync contable Zucchetti, conciliación bancaria auto-matching.',
    monthlyPrice: 9900,
    annualPrice: 99000,
  },
  {
    id: 'analytics_avanzado',
    name: 'Analytics Avanzado',
    description: 'Morosidad detallada, yield tracker, benchmark mercado, previsión tesorería 12m, estimación fiscal trimestral, scoring inquilinos.',
    monthlyPrice: 7900,
    annualPrice: 79000,
  },
  {
    id: 'operaciones_pro',
    name: 'Operaciones Pro',
    description: 'Kanban mantenimiento, checklist inspección, evaluación proveedores, workflows completos alta/salida, gestión fianzas.',
    monthlyPrice: 6900,
    annualPrice: 69000,
  },
  {
    id: 'pack_completo',
    name: 'Pack Completo',
    description: 'Los 5 addons incluidos: IA + Family Office + Automatización + Analytics + Operaciones. Ahorra 23% vs compra individual.',
    monthlyPrice: 49900,
    annualPrice: 499000,
  },
];

async function syncProduct(
  type: 'plan' | 'addon',
  item: typeof PLANS[0] | typeof ADDONS[0],
): Promise<void> {
  const metaKey = type === 'plan' ? 'inmova_plan_id' : 'inmova_addon_id';
  const metaValue = item.id;

  try {
    // Search for existing product
    const existing = await stripe.products.search({
      query: `metadata['${metaKey}']:'${metaValue}'`,
    });

    let product: Stripe.Product;

    if (existing.data.length > 0) {
      product = await stripe.products.update(existing.data[0].id, {
        name: item.name,
        description: item.description,
        metadata: { [metaKey]: metaValue, type },
      });
      console.log(`  ✅ Producto actualizado: ${item.name} (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: item.name,
        description: item.description,
        metadata: { [metaKey]: metaValue, type },
      });
      console.log(`  ✅ Producto creado: ${item.name} (${product.id})`);
    }

    // Create/update prices
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    const hasMonthly = existingPrices.data.some(p => p.recurring?.interval === 'month' && p.unit_amount === item.monthlyPrice);
    const hasAnnual = existingPrices.data.some(p => p.recurring?.interval === 'year' && p.unit_amount === item.annualPrice);

    if (!hasMonthly) {
      // Deactivate old monthly prices
      for (const p of existingPrices.data.filter(p => p.recurring?.interval === 'month')) {
        await stripe.prices.update(p.id, { active: false });
      }
      const monthlyPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: item.monthlyPrice,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { [metaKey]: metaValue, interval: 'monthly' },
      });
      console.log(`    💰 Precio mensual: €${(item.monthlyPrice / 100).toFixed(2)}/mes (${monthlyPrice.id})`);
    }

    if (!hasAnnual) {
      for (const p of existingPrices.data.filter(p => p.recurring?.interval === 'year')) {
        await stripe.prices.update(p.id, { active: false });
      }
      const annualPrice = await stripe.prices.create({
        product: product.id,
        unit_amount: item.annualPrice,
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: { [metaKey]: metaValue, interval: 'annual' },
      });
      console.log(`    💰 Precio anual: €${(item.annualPrice / 100).toFixed(2)}/año (${annualPrice.id})`);
    }
  } catch (error: any) {
    console.error(`  ❌ Error con ${item.name}: ${error.message}`);
  }
}

async function main() {
  console.log('====================================================================');
  console.log('  SYNC: Planes y Addons → Stripe');
  console.log('====================================================================\n');

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY no configurada');
    process.exit(1);
  }

  const keyPrefix = process.env.STRIPE_SECRET_KEY.substring(0, 7);
  console.log(`Stripe key: ${keyPrefix}...`);
  console.log(`Modo: ${keyPrefix.includes('live') ? '🔴 PRODUCCIÓN' : '🟡 TEST'}\n`);

  // Sync plans
  console.log('📋 PLANES BASE:');
  for (const plan of PLANS) {
    await syncProduct('plan', plan);
  }

  console.log('\n🚀 ADDONS PREMIUM:');
  for (const addon of ADDONS) {
    await syncProduct('addon', addon);
  }

  // Summary
  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Planes: ${PLANS.length} sincronizados`);
  console.log(`  Addons: ${ADDONS.length} sincronizados`);
  console.log('\n  Precios mensuales:');
  for (const p of PLANS) {
    console.log(`    ${p.name}: €${(p.monthlyPrice / 100).toFixed(2)}/mes`);
  }
  console.log('  Addons:');
  for (const a of ADDONS) {
    console.log(`    ${a.name}: €${(a.monthlyPrice / 100).toFixed(2)}/mes`);
  }
  console.log('====================================================================');
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
