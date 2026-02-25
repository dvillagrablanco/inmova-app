/**
 * Script: Sincronizar planes de suscripción con la landing page
 *
 * Planes landing: Starter €35, Profesional €59, Business €129, Enterprise €299
 * Plan interno: Owner €0 (acceso total)
 *
 * Acciones:
 * 1. Crear/actualizar los 4 planes de landing + Owner
 * 2. Desactivar planes legacy que no estén en la landing (sin eliminar, por FK)
 * 3. Verificar que Stripe IDs estén asignados
 *
 * Uso: npx tsx scripts/sync-plans-landing.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Módulos base (todos los planes)
const BASE_MODULES = [
  'dashboard',
  'edificios',
  'unidades',
  'inquilinos',
  'contratos',
  'pagos',
  'documentos',
  'mantenimiento',
  'notificaciones',
  'usuarios',
  'configuracion',
];

// Módulos Professional (además de base)
const PROFESSIONAL_MODULES = [
  ...BASE_MODULES,
  'proveedores',
  'gastos',
  'reportes',
  'chat',
  'calendario',
  'incidencias',
  'anuncios',
  'reservas',
  'galerias',
  'portal_inquilino',
];

// Módulos Business (además de professional)
const BUSINESS_MODULES = [
  ...PROFESSIONAL_MODULES,
  'crm',
  'analytics',
  'matching',
  'informes',
  'contabilidad',
  'seguros',
  'comunidades',
  'portal_proveedor',
];

// Todos los módulos (Enterprise + Owner)
const ALL_MODULES = [
  ...BUSINESS_MODULES,
  'marketplace',
  'firma_digital',
  'ia',
  'tours_virtuales',
  'portal_propietario',
  'automatizaciones',
  'energy',
  'flipping',
  'media_estancia',
  'turismo_alquiler',
  'chatbot',
  'social_media',
  'api_publica',
  'white_label',
  'valoraciones',
  'coliving',
  'gestion_legal',
  'screening',
  'bi_analytics',
  'predicciones',
  'mantenimiento_predictivo',
  'auditoria_seguridad',
  'alquiler_residencial',
  'gestion_inmobiliaria',
  'garantias',
  'valoracion_ia',
  'inspecciones',
  'certificaciones',
  'str',
  'str_listings',
  'str_bookings',
  'str_channels',
  'str_housekeeping',
  'str_reviews',
  'hospitality',
  'room_rental',
  'construction_projects',
  'licitaciones',
  'ordenes_trabajo',
  'flipping_projects',
  'ewoorker',
  'real_estate_developer',
  'student_housing',
  'viajes_corporativos',
  'vivienda_social',
  'workspace',
  'warehouse',
  'admin_dashboard',
  'admin_activity',
  'admin_alertas',
];

// Planes que deben existir (sincronizados con landing)
const LANDING_PLANS = [
  {
    nombre: 'Starter',
    tier: 'STARTER' as const,
    descripcion: 'Perfecto para propietarios particulares',
    precioMensual: 35,
    maxUsuarios: 1,
    maxPropiedades: 5,
    modulosIncluidos: BASE_MODULES,
    signaturesIncludedMonth: 5,
    extraSignaturePrice: 2.0,
    storageIncludedGB: 2,
    extraStorageGBPrice: 0.05,
    aiTokensIncludedMonth: 0,
    extraAITokensPrice: 0.01,
    smsIncludedMonth: 0,
    extraSMSPrice: 0.1,
    activo: true,
    esInterno: false,
    stripePriceIdMonthly: 'price_1T067n7ltCPimPyxmXCureYb',
    stripePriceIdAnnual: 'price_1T067n7ltCPimPyxJbrB79vq',
  },
  {
    nombre: 'Profesional',
    tier: 'PROFESSIONAL' as const,
    descripcion: 'Para propietarios activos y pequeñas agencias',
    precioMensual: 59,
    maxUsuarios: 3,
    maxPropiedades: 25,
    modulosIncluidos: PROFESSIONAL_MODULES,
    signaturesIncludedMonth: 20,
    extraSignaturePrice: 1.5,
    storageIncludedGB: 10,
    extraStorageGBPrice: 0.04,
    aiTokensIncludedMonth: 10000,
    extraAITokensPrice: 0.008,
    smsIncludedMonth: 50,
    extraSMSPrice: 0.08,
    activo: true,
    esInterno: false,
    stripePriceIdMonthly: 'price_1T067p7ltCPimPyxRd54doZW',
    stripePriceIdAnnual: 'price_1T067p7ltCPimPyxtOWfEVgU',
  },
  {
    nombre: 'Business',
    tier: 'BUSINESS' as const,
    descripcion: 'Para gestoras profesionales y agencias',
    precioMensual: 129,
    maxUsuarios: 10,
    maxPropiedades: 100,
    modulosIncluidos: BUSINESS_MODULES,
    signaturesIncludedMonth: 50,
    extraSignaturePrice: 1.0,
    storageIncludedGB: 50,
    extraStorageGBPrice: 0.03,
    aiTokensIncludedMonth: 50000,
    extraAITokensPrice: 0.006,
    smsIncludedMonth: 200,
    extraSMSPrice: 0.06,
    activo: true,
    esInterno: false,
    stripePriceIdMonthly: 'price_1T067q7ltCPimPyxPULNS4K3',
    stripePriceIdAnnual: 'price_1T067q7ltCPimPyxTTBwcbhn',
  },
  {
    nombre: 'Enterprise',
    tier: 'ENTERPRISE' as const,
    descripcion: 'Para grandes empresas y SOCIMIs',
    precioMensual: 299,
    maxUsuarios: 999,
    maxPropiedades: 9999,
    modulosIncluidos: ALL_MODULES,
    signaturesIncludedMonth: 9999,
    extraSignaturePrice: 0,
    storageIncludedGB: 999,
    extraStorageGBPrice: 0,
    aiTokensIncludedMonth: 1000000,
    extraAITokensPrice: 0,
    smsIncludedMonth: 9999,
    extraSMSPrice: 0,
    activo: true,
    esInterno: false,
    stripePriceIdMonthly: 'price_1T067s7ltCPimPyxd3xPFZQK',
    stripePriceIdAnnual: 'price_1T067s7ltCPimPyxflVTS0AY',
  },
  {
    nombre: 'Owner',
    tier: 'ENTERPRISE' as const,
    descripcion: 'Plan especial para propietarios de la plataforma. Acceso completo sin coste.',
    precioMensual: 0,
    maxUsuarios: 999,
    maxPropiedades: 9999,
    modulosIncluidos: ALL_MODULES,
    signaturesIncludedMonth: 9999,
    extraSignaturePrice: 0,
    storageIncludedGB: 999,
    extraStorageGBPrice: 0,
    aiTokensIncludedMonth: 1000000,
    extraAITokensPrice: 0,
    smsIncludedMonth: 9999,
    extraSMSPrice: 0,
    activo: true,
    esInterno: true,
    stripePriceIdMonthly: undefined,
    stripePriceIdAnnual: undefined,
  },
];

async function main() {
  console.log('═'.repeat(70));
  console.log('🔄 SINCRONIZACIÓN DE PLANES CON LANDING');
  console.log('═'.repeat(70));
  console.log('');

  // 1. Obtener planes existentes
  const existingPlans = await prisma.subscriptionPlan.findMany({
    include: { _count: { select: { companies: true } } },
  });

  console.log(`📋 Planes existentes en BD: ${existingPlans.length}`);
  for (const p of existingPlans) {
    console.log(
      `  - ${p.nombre} (${p.tier}) €${p.precioMensual}/mes | ${p._count.companies} empresas | ${p.activo ? '✅ activo' : '❌ inactivo'} | interno: ${p.esInterno}`
    );
  }
  console.log('');

  // 2. Crear/actualizar planes de landing + Owner
  console.log('🔄 Sincronizando planes de landing + Owner:');
  const validPlanIds: string[] = [];

  for (const plan of LANDING_PLANS) {
    // Buscar plan existente por nombre exacto
    let existing = existingPlans.find((p) => p.nombre.toLowerCase() === plan.nombre.toLowerCase());

    if (existing) {
      // Actualizar plan existente
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: {
          tier: plan.tier,
          descripcion: plan.descripcion,
          precioMensual: plan.precioMensual,
          maxUsuarios: plan.maxUsuarios,
          maxPropiedades: plan.maxPropiedades,
          modulosIncluidos: plan.modulosIncluidos,
          signaturesIncludedMonth: plan.signaturesIncludedMonth,
          extraSignaturePrice: plan.extraSignaturePrice,
          storageIncludedGB: plan.storageIncludedGB,
          extraStorageGBPrice: plan.extraStorageGBPrice,
          aiTokensIncludedMonth: plan.aiTokensIncludedMonth,
          extraAITokensPrice: plan.extraAITokensPrice,
          smsIncludedMonth: plan.smsIncludedMonth,
          extraSMSPrice: plan.extraSMSPrice,
          activo: plan.activo,
          esInterno: plan.esInterno,
        },
      });
      validPlanIds.push(existing.id);
      console.log(`  ✅ Actualizado: ${plan.nombre} (${plan.tier}) €${plan.precioMensual}/mes`);
    } else {
      // Crear plan nuevo
      const created = await prisma.subscriptionPlan.create({
        data: {
          nombre: plan.nombre,
          tier: plan.tier,
          descripcion: plan.descripcion,
          precioMensual: plan.precioMensual,
          maxUsuarios: plan.maxUsuarios,
          maxPropiedades: plan.maxPropiedades,
          modulosIncluidos: plan.modulosIncluidos,
          signaturesIncludedMonth: plan.signaturesIncludedMonth,
          extraSignaturePrice: plan.extraSignaturePrice,
          storageIncludedGB: plan.storageIncludedGB,
          extraStorageGBPrice: plan.extraStorageGBPrice,
          aiTokensIncludedMonth: plan.aiTokensIncludedMonth,
          extraAITokensPrice: plan.extraAITokensPrice,
          smsIncludedMonth: plan.smsIncludedMonth,
          extraSMSPrice: plan.extraSMSPrice,
          activo: plan.activo,
          esInterno: plan.esInterno,
        },
      });
      validPlanIds.push(created.id);
      console.log(`  🆕 Creado: ${plan.nombre} (${plan.tier}) €${plan.precioMensual}/mes`);
    }
  }

  // 3. Desactivar planes que NO están en la landing ni son Owner
  console.log('');
  console.log('🗑️ Desactivando planes legacy (no en landing):');
  const legacyPlans = existingPlans.filter((p) => !validPlanIds.includes(p.id));

  for (const legacy of legacyPlans) {
    if (legacy._count.companies > 0) {
      // No desactivar si tiene empresas, solo marcar
      console.log(
        `  ⚠️ ${legacy.nombre} (${legacy.tier}) tiene ${legacy._count.companies} empresas - desactivando pero no eliminando`
      );
      await prisma.subscriptionPlan.update({
        where: { id: legacy.id },
        data: { activo: false },
      });
    } else {
      console.log(`  🗑️ ${legacy.nombre} (${legacy.tier}) sin empresas - desactivando`);
      await prisma.subscriptionPlan.update({
        where: { id: legacy.id },
        data: { activo: false },
      });
    }
  }

  // 4. Verificación final
  console.log('');
  console.log('═'.repeat(70));
  console.log('📊 RESULTADO FINAL:');
  console.log('═'.repeat(70));

  const finalPlans = await prisma.subscriptionPlan.findMany({
    orderBy: { precioMensual: 'asc' },
    include: { _count: { select: { companies: true } } },
  });

  const activePlans = finalPlans.filter((p) => p.activo);
  const inactivePlans = finalPlans.filter((p) => !p.activo);

  console.log('');
  console.log('✅ PLANES ACTIVOS:');
  for (const p of activePlans) {
    const tipo = p.esInterno ? ' [INTERNO]' : '';
    console.log(
      `  ${p.nombre}${tipo} | Tier: ${p.tier} | €${p.precioMensual}/mes | ${p._count.companies} empresas`
    );
  }

  if (inactivePlans.length > 0) {
    console.log('');
    console.log('❌ PLANES DESACTIVADOS (legacy):');
    for (const p of inactivePlans) {
      console.log(
        `  ${p.nombre} | Tier: ${p.tier} | €${p.precioMensual}/mes | ${p._count.companies} empresas`
      );
    }
  }

  // 5. Verificar Rovida y Viroda en Owner
  console.log('');
  console.log('🔍 Verificando Rovida y Viroda...');
  const ownerPlan = finalPlans.find((p) => p.nombre === 'Owner' && p.activo);
  if (ownerPlan) {
    const roviViro = await prisma.company.findMany({
      where: {
        OR: [
          { nombre: { contains: 'Rovida', mode: 'insensitive' } },
          { nombre: { contains: 'Viroda', mode: 'insensitive' } },
        ],
      },
      select: { id: true, nombre: true, subscriptionPlanId: true },
    });

    for (const c of roviViro) {
      if (c.subscriptionPlanId === ownerPlan.id) {
        console.log(`  ✅ ${c.nombre} → Plan Owner`);
      } else {
        console.log(
          `  ⚠️ ${c.nombre} → Plan ID ${c.subscriptionPlanId || 'ninguno'} (reasignando a Owner)`
        );
        await prisma.company.update({
          where: { id: c.id },
          data: { subscriptionPlanId: ownerPlan.id },
        });
        console.log(`  ✅ ${c.nombre} → Reasignado a Plan Owner`);
      }
    }
  }

  console.log('');
  console.log('✅ Sincronización completada.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
