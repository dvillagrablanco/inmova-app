/**
 * Script unificado para crear/actualizar planes de suscripción y add-ons
 * 
 * SOURCE OF TRUTH: Los precios de la landing page (PricingSection.tsx + precios/page.tsx)
 * 
 * PLANES:
 *   - Owner:       €0/mes   (interno, no visible en landing, tier ENTERPRISE)
 *   - Starter:     €35/mes  (€350/año, tier STARTER)
 *   - Professional: €59/mes  (€590/año, tier PROFESSIONAL)
 *   - Business:    €129/mes (€1.290/año, tier BUSINESS)
 *   - Enterprise:  €299/mes (€2.990/año, tier ENTERPRISE)
 * 
 * ADD-ONS (3 categorías: usage, feature, premium):
 *   - Packs de firmas (10/50/100)
 *   - Packs de SMS (100/500/1000)
 *   - Packs de IA (50K/200K/500K tokens)
 *   - Packs de almacenamiento (10GB/50GB/100GB)
 *   - Features: Reportes, Multi-idioma, Portales, Recordatorios, Screening, Contabilidad
 *   - Premium: White-label, API, ESG, Pricing IA, Tours VR, IoT, Soporte dedicado
 * 
 * Sincroniza automáticamente con Stripe si STRIPE_SECRET_KEY está configurada.
 * 
 * Ejecutar: npx tsx scripts/seed-plans-and-addons-unified.ts
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// PLANES DE SUSCRIPCIÓN (alineados con landing)
// ═══════════════════════════════════════════════════════════════

const PLANES = [
  {
    nombre: 'Owner',
    tier: 'ENTERPRISE' as const,
    descripcion: 'Plan interno gratuito para empresas del propietario de la plataforma. Incluye todas las funcionalidades sin límites.',
    precioMensual: 0,
    precioAnual: 0,
    maxUsuarios: 999,
    maxPropiedades: 9999,
    modulosIncluidos: ['*'], // Todos los módulos
    esInterno: true,
    signaturesIncludedMonth: 9999,
    storageIncludedGB: 1000,
    aiTokensIncludedMonth: 10000000,
    smsIncludedMonth: 10000,
    extraSignaturePrice: 0,
    extraStorageGBPrice: 0,
    extraAITokensPrice: 0,
    extraSMSPrice: 0,
  },
  {
    nombre: 'Starter',
    tier: 'STARTER' as const,
    descripcion: 'Perfecto para propietarios particulares con 1-5 propiedades',
    precioMensual: 35,
    precioAnual: 350,
    maxUsuarios: 1,
    maxPropiedades: 5,
    modulosIncluidos: [
      'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos',
      'pagos', 'documentos', 'mantenimiento', 'calendario', 'notificaciones',
      'seguros',
    ],
    esInterno: false,
    signaturesIncludedMonth: 2,
    storageIncludedGB: 1,
    aiTokensIncludedMonth: 0,
    smsIncludedMonth: 0,
    extraSignaturePrice: 1.50,
    extraStorageGBPrice: 0.50,
    extraAITokensPrice: 0.20,
    extraSMSPrice: 0.10,
  },
  {
    nombre: 'Professional',
    tier: 'PROFESSIONAL' as const,
    descripcion: 'Para propietarios activos y pequeñas agencias con 6-25 propiedades',
    precioMensual: 59,
    precioAnual: 590,
    maxUsuarios: 3,
    maxPropiedades: 25,
    modulosIncluidos: [
      'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos',
      'pagos', 'documentos', 'mantenimiento', 'calendario', 'notificaciones',
      'seguros', 'gastos', 'reportes', 'proveedores', 'chat',
      'portal_inquilino', 'portal_propietario', 'crm', 'incidencias',
      'anuncios', 'reservas', 'galerias', 'str_listings', 'str_bookings',
      'room_rental', 'usuarios', 'configuracion',
    ],
    esInterno: false,
    signaturesIncludedMonth: 5,
    storageIncludedGB: 5,
    aiTokensIncludedMonth: 5000,
    smsIncludedMonth: 0,
    extraSignaturePrice: 1.20,
    extraStorageGBPrice: 0.40,
    extraAITokensPrice: 0.15,
    extraSMSPrice: 0.08,
  },
  {
    nombre: 'Business',
    tier: 'BUSINESS' as const,
    descripcion: 'Para gestoras profesionales y agencias con 26-100 propiedades',
    precioMensual: 129,
    precioAnual: 1290,
    maxUsuarios: 10,
    maxPropiedades: 100,
    modulosIncluidos: [
      'dashboard', 'edificios', 'unidades', 'inquilinos', 'contratos',
      'pagos', 'documentos', 'mantenimiento', 'calendario', 'notificaciones',
      'seguros', 'gastos', 'reportes', 'proveedores', 'chat',
      'portal_inquilino', 'portal_propietario', 'portal_proveedor',
      'crm', 'incidencias', 'anuncios', 'reservas', 'galerias',
      'str_listings', 'str_bookings', 'str_channels',
      'room_rental', 'flipping_projects', 'construction_projects',
      'professional_projects', 'alquiler_comercial',
      'analytics', 'bi', 'contabilidad', 'legal', 'votaciones', 'reuniones',
      'marketplace', 'screening', 'valoraciones', 'publicaciones',
      'usuarios', 'configuracion', 'auditoria',
      'firma_digital', 'open_banking', 'tareas', 'candidatos',
    ],
    esInterno: false,
    signaturesIncludedMonth: 15,
    storageIncludedGB: 20,
    aiTokensIncludedMonth: 50000,
    smsIncludedMonth: 25,
    extraSignaturePrice: 1.00,
    extraStorageGBPrice: 0.30,
    extraAITokensPrice: 0.10,
    extraSMSPrice: 0.06,
  },
  {
    nombre: 'Enterprise',
    tier: 'ENTERPRISE' as const,
    descripcion: 'Para grandes empresas y SOCIMIs con +100 propiedades. Todo ilimitado.',
    precioMensual: 299,
    precioAnual: 2990,
    maxUsuarios: 999,
    maxPropiedades: 9999,
    modulosIncluidos: ['*'], // Todos los módulos
    esInterno: false,
    signaturesIncludedMonth: 50,
    storageIncludedGB: 50,
    aiTokensIncludedMonth: 100000,
    smsIncludedMonth: 100,
    extraSignaturePrice: 0.80,
    extraStorageGBPrice: 0.20,
    extraAITokensPrice: 0.08,
    extraSMSPrice: 0.05,
  },
];

// ═══════════════════════════════════════════════════════════════
// ADD-ONS (alineados con landing y pricing-config.ts)
// ═══════════════════════════════════════════════════════════════

const ADDONS = [
  // === PACKS DE USO (usage) ===
  {
    codigo: 'signatures_pack_10',
    nombre: 'Pack 10 Firmas Digitales',
    descripcion: 'Pack de 10 firmas con validez legal europea (eIDAS)',
    categoria: 'usage',
    precioMensual: 15,
    precioAnual: 150,
    unidades: 10,
    tipoUnidad: 'firmas',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: true,
    orden: 1,
    costoUnitario: 0.90,
    margenPorcentaje: 40,
  },
  {
    codigo: 'signatures_pack_50',
    nombre: 'Pack 50 Firmas Digitales',
    descripcion: 'Pack de 50 firmas para alto volumen de contratos',
    categoria: 'usage',
    precioMensual: 60,
    precioAnual: 600,
    unidades: 50,
    tipoUnidad: 'firmas',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 2,
    costoUnitario: 0.65,
    margenPorcentaje: 46,
  },
  {
    codigo: 'signatures_pack_100',
    nombre: 'Pack 100 Firmas Digitales',
    descripcion: 'Pack empresarial de 100 firmas. Máximo ahorro.',
    categoria: 'usage',
    precioMensual: 100,
    precioAnual: 1000,
    unidades: 100,
    tipoUnidad: 'firmas',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 3,
    costoUnitario: 0.50,
    margenPorcentaje: 50,
  },
  {
    codigo: 'sms_pack_100',
    nombre: 'Pack 100 SMS/WhatsApp',
    descripcion: 'Notificaciones SMS o WhatsApp para inquilinos',
    categoria: 'usage',
    precioMensual: 10,
    precioAnual: 100,
    unidades: 100,
    tipoUnidad: 'mensajes',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: true,
    orden: 4,
    costoUnitario: 0.053,
    margenPorcentaje: 47,
  },
  {
    codigo: 'sms_pack_500',
    nombre: 'Pack 500 SMS/WhatsApp',
    descripcion: 'Pack de mensajes para gestoras con muchos inquilinos',
    categoria: 'usage',
    precioMensual: 40,
    precioAnual: 400,
    unidades: 500,
    tipoUnidad: 'mensajes',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 5,
    costoUnitario: 0.038,
    margenPorcentaje: 52,
  },
  {
    codigo: 'sms_pack_1000',
    nombre: 'Pack 1000 SMS/WhatsApp',
    descripcion: 'Pack empresarial de 1000 mensajes',
    categoria: 'usage',
    precioMensual: 70,
    precioAnual: 700,
    unidades: 1000,
    tipoUnidad: 'mensajes',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 6,
    costoUnitario: 0.030,
    margenPorcentaje: 57,
  },
  {
    codigo: 'ai_pack_50k',
    nombre: 'Pack IA Básico (50K tokens)',
    descripcion: 'Valoraciones automáticas y asistente virtual',
    categoria: 'usage',
    precioMensual: 10,
    precioAnual: 100,
    unidades: 50000,
    tipoUnidad: 'tokens',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: true,
    orden: 7,
    costoUnitario: 0.006,
    margenPorcentaje: 97,
  },
  {
    codigo: 'ai_pack_200k',
    nombre: 'Pack IA Avanzado (200K tokens)',
    descripcion: 'Incluye acceso a GPT-4 para análisis complejos',
    categoria: 'usage',
    precioMensual: 35,
    precioAnual: 350,
    unidades: 200000,
    tipoUnidad: 'tokens',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 8,
    costoUnitario: 0.015,
    margenPorcentaje: 91,
  },
  {
    codigo: 'ai_pack_500k',
    nombre: 'Pack IA Enterprise (500K tokens)',
    descripcion: 'Acceso GPT-4 para uso intensivo',
    categoria: 'usage',
    precioMensual: 75,
    precioAnual: 750,
    unidades: 500000,
    tipoUnidad: 'tokens',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 9,
    costoUnitario: 0.020,
    margenPorcentaje: 87,
  },
  {
    codigo: 'storage_pack_10gb',
    nombre: 'Pack 10GB Storage',
    descripcion: 'Almacenamiento adicional para documentos y fotos',
    categoria: 'usage',
    precioMensual: 5,
    precioAnual: 50,
    unidades: 10,
    tipoUnidad: 'GB',
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 10,
    costoUnitario: 0.023,
    margenPorcentaje: 95,
  },
  {
    codigo: 'storage_pack_50gb',
    nombre: 'Pack 50GB Storage',
    descripcion: 'Almacenamiento para gestoras con muchas propiedades',
    categoria: 'usage',
    precioMensual: 20,
    precioAnual: 200,
    unidades: 50,
    tipoUnidad: 'GB',
    disponiblePara: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 11,
    costoUnitario: 0.023,
    margenPorcentaje: 94,
  },
  {
    codigo: 'storage_pack_100gb',
    nombre: 'Pack 100GB Storage',
    descripcion: 'Almacenamiento empresarial con CDN incluido',
    categoria: 'usage',
    precioMensual: 35,
    precioAnual: 350,
    unidades: 100,
    tipoUnidad: 'GB',
    disponiblePara: ['BUSINESS', 'ENTERPRISE'],
    incluidoEn: [],
    destacado: false,
    orden: 12,
    costoUnitario: 0.023,
    margenPorcentaje: 93,
  },

  // === FUNCIONALIDADES (feature) ===
  {
    codigo: 'advanced_reports',
    nombre: 'Reportes Avanzados',
    descripcion: 'Informes financieros detallados y proyecciones',
    categoria: 'feature',
    precioMensual: 15,
    precioAnual: 150,
    disponiblePara: ['STARTER', 'PROFESSIONAL'],
    incluidoEn: ['BUSINESS', 'ENTERPRISE'],
    destacado: false,
    orden: 20,
  },
  {
    codigo: 'portal_sync',
    nombre: 'Publicación en Portales',
    descripcion: 'Publica en Idealista, Fotocasa, Habitaclia automáticamente',
    categoria: 'feature',
    precioMensual: 25,
    precioAnual: 250,
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: true,
    orden: 21,
    costoUnitario: 5,
    margenPorcentaje: 80,
  },
  {
    codigo: 'tenant_screening',
    nombre: 'Screening de Inquilinos',
    descripcion: 'Verificación de solvencia y puntuación de riesgo',
    categoria: 'feature',
    precioMensual: 20,
    precioAnual: 200,
    disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 22,
    costoUnitario: 8,
    margenPorcentaje: 60,
  },
  {
    codigo: 'accounting_integration',
    nombre: 'Integración Contabilidad',
    descripcion: 'Conexión con A3, Sage, Holded y más',
    categoria: 'feature',
    precioMensual: 30,
    precioAnual: 300,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 23,
    costoUnitario: 4.50,
    margenPorcentaje: 85,
  },

  // === PREMIUM ===
  {
    codigo: 'whitelabel_basic',
    nombre: 'White-Label Básico',
    descripcion: 'Tu marca, colores y logo personalizados',
    categoria: 'premium',
    precioMensual: 35,
    precioAnual: 350,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: true,
    orden: 30,
  },
  {
    codigo: 'whitelabel_full',
    nombre: 'White-Label Completo',
    descripcion: 'Tu dominio, app móvil y emails personalizados',
    categoria: 'premium',
    precioMensual: 99,
    precioAnual: 990,
    disponiblePara: ['BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 31,
  },
  {
    codigo: 'api_access',
    nombre: 'Acceso API REST',
    descripcion: 'API completa para integraciones personalizadas',
    categoria: 'premium',
    precioMensual: 49,
    precioAnual: 490,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 32,
  },
  {
    codigo: 'pricing_ai',
    nombre: 'Pricing Dinámico IA',
    descripcion: 'Optimiza precios de alquiler con Machine Learning',
    categoria: 'premium',
    precioMensual: 45,
    precioAnual: 450,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: true,
    orden: 33,
    costoUnitario: 6.75,
    margenPorcentaje: 85,
  },
  {
    codigo: 'tours_vr',
    nombre: 'Tours Virtuales 360°',
    descripcion: 'Tours interactivos con integración Matterport',
    categoria: 'premium',
    precioMensual: 35,
    precioAnual: 350,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 34,
    costoUnitario: 7,
    margenPorcentaje: 80,
  },
  {
    codigo: 'esg_module',
    nombre: 'ESG & Sostenibilidad',
    descripcion: 'Huella de carbono, certificaciones verdes, CSRD',
    categoria: 'premium',
    precioMensual: 50,
    precioAnual: 500,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 35,
    costoUnitario: 10,
    margenPorcentaje: 80,
  },
  {
    codigo: 'dedicated_support',
    nombre: 'Soporte Dedicado',
    descripcion: 'Account manager, soporte 24/7, formación mensual',
    categoria: 'premium',
    precioMensual: 99,
    precioAnual: 990,
    disponiblePara: ['PROFESSIONAL', 'BUSINESS'],
    incluidoEn: ['ENTERPRISE'],
    destacado: false,
    orden: 36,
  },
];

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('====================================================================');
  console.log('  SEED UNIFICADO: PLANES + ADD-ONS (Alineado con Landing)');
  console.log('====================================================================\n');

  // ── PASO 1: Planes ──
  console.log('1. Creando/actualizando planes de suscripción...\n');

  for (const plan of PLANES) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { nombre: plan.nombre },
    });

    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: plan,
      });
      console.log(`   Actualizado: ${plan.nombre} (${plan.tier}) - €${plan.precioMensual}/mes`);
    } else {
      await prisma.subscriptionPlan.create({
        data: plan,
      });
      console.log(`   Creado: ${plan.nombre} (${plan.tier}) - €${plan.precioMensual}/mes`);
    }
  }

  // ── PASO 2: Add-ons ──
  console.log('\n2. Creando/actualizando add-ons...\n');

  for (const addon of ADDONS) {
    const existing = await prisma.addOn.findFirst({
      where: { codigo: addon.codigo },
    });

    if (existing) {
      await prisma.addOn.update({
        where: { id: existing.id },
        data: addon,
      });
      console.log(`   Actualizado: ${addon.nombre} - €${addon.precioMensual}/mes`);
    } else {
      await prisma.addOn.create({
        data: {
          ...addon,
          activo: true,
        },
      });
      console.log(`   Creado: ${addon.nombre} - €${addon.precioMensual}/mes`);
    }
  }

  // ── PASO 3: Sincronización con Stripe ──
  if (process.env.STRIPE_SECRET_KEY) {
    console.log('\n3. Sincronizando con Stripe...\n');

    try {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-12-18.acacia' as any,
      });

      // Sincronizar planes (excepto Owner que es gratuito)
      const planesPublicos = await prisma.subscriptionPlan.findMany({
        where: { activo: true, esInterno: false, precioMensual: { gt: 0 } },
      });

      for (const plan of planesPublicos) {
        try {
          // Buscar producto en Stripe
          const existingProducts = await stripe.products.search({
            query: `metadata['inmovaId']:'${plan.id}'`,
          });

          let product: any;
          if (existingProducts.data.length > 0) {
            product = await stripe.products.update(existingProducts.data[0].id, {
              name: `INMOVA ${plan.nombre}`,
              description: plan.descripcion,
              metadata: { inmovaId: plan.id, tier: plan.tier, type: 'subscription_plan' },
            });
          } else {
            product = await stripe.products.create({
              name: `INMOVA ${plan.nombre}`,
              description: plan.descripcion,
              metadata: { inmovaId: plan.id, tier: plan.tier, type: 'subscription_plan' },
            });
          }

          // Crear precios
          const existingPrices = await stripe.prices.list({ product: product.id, active: true });
          let monthlyPrice: any, annualPrice: any;

          for (const price of existingPrices.data) {
            if (price.recurring?.interval === 'month') monthlyPrice = price;
            if (price.recurring?.interval === 'year') annualPrice = price;
          }

          // Precio mensual
          if (!monthlyPrice || monthlyPrice.unit_amount !== Math.round(plan.precioMensual * 100)) {
            if (monthlyPrice) await stripe.prices.update(monthlyPrice.id, { active: false });
            monthlyPrice = await stripe.prices.create({
              product: product.id,
              currency: 'eur',
              unit_amount: Math.round(plan.precioMensual * 100),
              recurring: { interval: 'month' },
              metadata: { inmovaId: plan.id, interval: 'monthly' },
            });
          }

          // Precio anual
          const precioAnual = (plan as any).precioAnual || plan.precioMensual * 10;
          if (!annualPrice || annualPrice.unit_amount !== Math.round(precioAnual * 100)) {
            if (annualPrice) await stripe.prices.update(annualPrice.id, { active: false });
            annualPrice = await stripe.prices.create({
              product: product.id,
              currency: 'eur',
              unit_amount: Math.round(precioAnual * 100),
              recurring: { interval: 'year' },
              metadata: { inmovaId: plan.id, interval: 'annual' },
            });
          }

          // Guardar IDs de Stripe en BD
          await prisma.subscriptionPlan.update({
            where: { id: plan.id },
            data: {
              stripeProductId: product.id,
              stripePriceIdMonthly: monthlyPrice.id,
              stripePriceIdAnnual: annualPrice?.id,
            },
          });

          console.log(`   Plan ${plan.nombre}: synced (product: ${product.id})`);
        } catch (e: any) {
          console.log(`   Plan ${plan.nombre}: error - ${e.message}`);
        }
      }

      // Sincronizar add-ons
      const addons = await prisma.addOn.findMany({ where: { activo: true } });

      for (const addon of addons) {
        try {
          const existingProducts = await stripe.products.search({
            query: `metadata['inmovaAddonId']:'${addon.id}'`,
          });

          let product: any;
          if (existingProducts.data.length > 0) {
            product = await stripe.products.update(existingProducts.data[0].id, {
              name: `INMOVA Add-on: ${addon.nombre}`,
              description: addon.descripcion,
              metadata: { inmovaAddonId: addon.id, codigo: addon.codigo, type: 'addon' },
            });
          } else {
            product = await stripe.products.create({
              name: `INMOVA Add-on: ${addon.nombre}`,
              description: addon.descripcion,
              metadata: { inmovaAddonId: addon.id, codigo: addon.codigo, type: 'addon' },
            });
          }

          const existingPrices = await stripe.prices.list({ product: product.id, active: true });
          let monthlyPrice: any, annualPrice: any;

          for (const price of existingPrices.data) {
            if (price.recurring?.interval === 'month') monthlyPrice = price;
            if (price.recurring?.interval === 'year') annualPrice = price;
          }

          if (!monthlyPrice || monthlyPrice.unit_amount !== Math.round(addon.precioMensual * 100)) {
            if (monthlyPrice) await stripe.prices.update(monthlyPrice.id, { active: false });
            monthlyPrice = await stripe.prices.create({
              product: product.id,
              currency: 'eur',
              unit_amount: Math.round(addon.precioMensual * 100),
              recurring: { interval: 'month' },
              metadata: { inmovaAddonId: addon.id, codigo: addon.codigo },
            });
          }

          if (addon.precioAnual && addon.precioAnual > 0) {
            if (!annualPrice || annualPrice.unit_amount !== Math.round(addon.precioAnual * 100)) {
              if (annualPrice) await stripe.prices.update(annualPrice.id, { active: false });
              annualPrice = await stripe.prices.create({
                product: product.id,
                currency: 'eur',
                unit_amount: Math.round(addon.precioAnual * 100),
                recurring: { interval: 'year' },
                metadata: { inmovaAddonId: addon.id, codigo: addon.codigo },
              });
            }
          }

          await prisma.addOn.update({
            where: { id: addon.id },
            data: {
              stripeProductId: product.id,
              stripePriceIdMonthly: monthlyPrice.id,
              stripePriceIdAnnual: annualPrice?.id,
            },
          });

          console.log(`   Add-on ${addon.nombre}: synced (product: ${product.id})`);
        } catch (e: any) {
          console.log(`   Add-on ${addon.nombre}: error - ${e.message}`);
        }
      }
    } catch (e: any) {
      console.log(`   Error conectando con Stripe: ${e.message}`);
    }
  } else {
    console.log('\n3. Stripe no configurado (STRIPE_SECRET_KEY no definida). Skipping sync.');
  }

  // ── PASO 4: Verificación ──
  console.log('\n4. Verificación final...\n');

  const allPlans = await prisma.subscriptionPlan.findMany({
    where: { activo: true },
    orderBy: { precioMensual: 'asc' },
    include: { _count: { select: { companies: true } } },
  });

  console.log('   PLANES:');
  for (const plan of allPlans) {
    const internal = plan.esInterno ? ' [INTERNO]' : '';
    const stripe = plan.stripeProductId ? ' [STRIPE OK]' : ' [NO STRIPE]';
    console.log(`   - ${plan.nombre}${internal}: €${plan.precioMensual}/mes (${plan.tier}) | ${plan._count.companies} empresas${stripe}`);
  }

  const allAddons = await prisma.addOn.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  });

  console.log(`\n   ADD-ONS: ${allAddons.length} total`);
  for (const addon of allAddons) {
    const stripe = addon.stripeProductId ? ' [STRIPE OK]' : ' [NO STRIPE]';
    console.log(`   - ${addon.nombre}: €${addon.precioMensual}/mes (${addon.categoria})${stripe}`);
  }

  console.log('\n====================================================================');
  console.log('  SEED COMPLETADO');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
