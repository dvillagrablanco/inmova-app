/**
 * Seed: Subscription Plans con Límites de Uso y Verticales
 * 
 * Estrategia Competitiva vs Homming/Rentger:
 * - Homming: 1 vertical (solo alquiler), €59-279/mes
 * - Rentger: 1-2 verticales, €39-149/mes
 * - INMOVA: 1-7 verticales según plan, €29-99/mes
 * 
 * Ejecutar: npx tsx prisma/seed-subscription-plans.ts
 */

import { PrismaClient, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

// Los 7 verticales de INMOVA
const VERTICALES = {
  ALQUILER: 'alquiler_residencial',      // Incluye tradicional + media estancia
  STR: 'str_vacacional',                  // Airbnb, Booking, VRBO
  COLIVING: 'coliving',                   // Habitaciones y prorrateo
  FLIPPING: 'house_flipping',             // Compra-reforma-venta
  CONSTRUCCION: 'construccion',           // ewoorker marketplace
  COMUNIDADES: 'comunidades',             // Administración de fincas
  SERVICIOS: 'servicios_profesionales',   // Property management
};

// Verticales por plan
const VERTICALES_POR_PLAN = {
  FREE: [VERTICALES.ALQUILER],  // Solo 1 vertical demo
  STARTER: [VERTICALES.ALQUILER],  // 1 vertical a elegir
  PROFESSIONAL: [VERTICALES.ALQUILER, VERTICALES.STR, VERTICALES.COLIVING],  // Hasta 3 verticales
  BUSINESS: Object.values(VERTICALES),  // Los 7 verticales
  ENTERPRISE: Object.values(VERTICALES),  // Los 7 verticales + custom
};

async function main() {
  console.log('🌱 Seeding Subscription Plans con Verticales y Límites...\n');
  console.log('📊 ESTRATEGIA VS COMPETENCIA:');
  console.log('  • Homming: 1 vertical (solo alquiler), €59-279/mes');
  console.log('  • Rentger: 1-2 verticales, €39-149/mes');
  console.log('  • INMOVA: 1-7 verticales según plan, €29-99/mes');
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // PLAN FREE - Trial/Demo
  // ═══════════════════════════════════════════════════════════════
  
  const planFree = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-free' },
    update: {
      descripcion: 'Trial 30 días. 1 vertical (Alquiler). Ideal para probar la plataforma.',
      modulosIncluidos: ['dashboard', 'properties', 'tenants', VERTICALES.ALQUILER],
    },
    create: {
      id: 'plan-free',
      nombre: 'Plan Free',
      tier: SubscriptionTier.FREE,
      descripcion: 'Trial 30 días. 1 vertical (Alquiler). Ideal para probar la plataforma.',
      precioMensual: 0,
      maxUsuarios: 1,
      maxPropiedades: 1,
      
      // Límites de integraciones (muy limitados en free)
      signaturesIncludedMonth: 0,
      storageIncludedGB: 0.5,
      aiTokensIncludedMonth: 100,
      smsIncludedMonth: 0,
      
      extraSignaturePrice: 2.50,
      extraStorageGBPrice: 0.10,
      extraAITokensPrice: 0.02,
      extraSMSPrice: 0.15,
      
      // 1 vertical incluido
      modulosIncluidos: ['dashboard', 'properties', 'tenants', VERTICALES.ALQUILER],
      activo: true,
    },
  });
  console.log('✅ Plan FREE:', planFree.nombre, '| 1 vertical | Demo');

  // ═══════════════════════════════════════════════════════════════
  // PLAN STARTER - €29/mes (1-5 propiedades, 1 vertical)
  // Competitivo: -51% vs Homming (€59)
  // ═══════════════════════════════════════════════════════════════
  
  const starterModulos = [
    'dashboard', 'properties', 'tenants', 'contracts', 'payments', 'documents',
    ...VERTICALES_POR_PLAN.STARTER,  // 1 vertical a elegir
  ];
  
  const planStarter = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-starter' },
    update: {
      precioMensual: 29,
      maxUsuarios: 1,
      maxPropiedades: 5,
      descripcion: '1-5 propiedades. 1 VERTICAL a elegir. -51% vs Homming (€59). Ideal para propietarios particulares.',
      signaturesIncludedMonth: 3,
      storageIncludedGB: 1,
      aiTokensIncludedMonth: 0,
      smsIncludedMonth: 0,
      modulosIncluidos: starterModulos,
    },
    create: {
      id: 'plan-starter',
      nombre: 'Plan Starter',
      tier: SubscriptionTier.STARTER,
      descripcion: '1-5 propiedades. 1 VERTICAL a elegir. -51% vs Homming (€59). Ideal para propietarios particulares.',
      precioMensual: 29,
      maxUsuarios: 1,
      maxPropiedades: 5,
      
      signaturesIncludedMonth: 3,
      storageIncludedGB: 1,
      aiTokensIncludedMonth: 0,
      smsIncludedMonth: 0,
      
      extraSignaturePrice: 2.00,
      extraStorageGBPrice: 0.05,
      extraAITokensPrice: 0.01,
      extraSMSPrice: 0.10,
      
      modulosIncluidos: starterModulos,
      activo: true,
    },
  });
  console.log('✅ Plan STARTER:', planStarter.nombre);
  console.log(`   📊 €29/mes | 1-5 props | 1 VERTICAL | -51% vs Homming`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN PROFESSIONAL - €49/mes (6-25 propiedades, HASTA 3 verticales)
  // Competitivo: -38% vs Homming (€79), pero con 3x más verticales
  // ═══════════════════════════════════════════════════════════════
  
  const professionalModulos = [
    'dashboard', 'properties', 'tenants', 'contracts', 'payments', 'documents',
    'maintenance', 'reports', 'tenant_portal', 'owner_portal', 'ai_basic',
    ...VERTICALES_POR_PLAN.PROFESSIONAL,  // 3 verticales
  ];
  
  const planProfessional = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-professional' },
    update: {
      precioMensual: 49,
      maxUsuarios: 3,
      maxPropiedades: 25,
      descripcion: '6-25 propiedades. HASTA 3 VERTICALES (Alquiler + STR + Coliving). -38% vs Homming pero 3x más verticales.',
      signaturesIncludedMonth: 10,
      storageIncludedGB: 5,
      aiTokensIncludedMonth: 5000,
      smsIncludedMonth: 0,
      modulosIncluidos: professionalModulos,
    },
    create: {
      id: 'plan-professional',
      nombre: 'Plan Professional',
      tier: SubscriptionTier.PROFESSIONAL,
      descripcion: '6-25 propiedades. HASTA 3 VERTICALES (Alquiler + STR + Coliving). -38% vs Homming pero 3x más verticales.',
      precioMensual: 49,
      maxUsuarios: 3,
      maxPropiedades: 25,
      
      signaturesIncludedMonth: 10,
      storageIncludedGB: 5,
      aiTokensIncludedMonth: 5000,
      smsIncludedMonth: 0,
      
      extraSignaturePrice: 1.80,
      extraStorageGBPrice: 0.04,
      extraAITokensPrice: 0.008,
      extraSMSPrice: 0.09,
      
      modulosIncluidos: professionalModulos,
      activo: true,
    },
  });
  console.log('✅ Plan PROFESSIONAL:', planProfessional.nombre);
  console.log(`   📊 €49/mes | 6-25 props | 3 VERTICALES | -38% vs Homming | 3x más verticales`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN BUSINESS - €99/mes (26-100 propiedades, LOS 7 VERTICALES)
  // Competitivo: 2x más propiedades que Homming, 7x más verticales
  // ═══════════════════════════════════════════════════════════════
  
  const businessModulos = [
    'dashboard', 'properties', 'tenants', 'contracts', 'payments', 'documents',
    'maintenance', 'crm', 'reports', 'automation', 'api', 'ai_advanced',
    'tenant_portal', 'owner_portal', 'custom_branding', 'integrations',
    ...VERTICALES_POR_PLAN.BUSINESS,  // Los 7 verticales
  ];
  
  const planBusiness = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-business' },
    update: {
      precioMensual: 99,
      maxUsuarios: 10,
      maxPropiedades: 100,
      descripcion: '26-100 propiedades. LOS 7 VERTICALES. 2x más propiedades que Homming. API completa y CRM integrado.',
      signaturesIncludedMonth: 25,
      storageIncludedGB: 20,
      aiTokensIncludedMonth: 50000,
      smsIncludedMonth: 50,
      modulosIncluidos: businessModulos,
    },
    create: {
      id: 'plan-business',
      nombre: 'Plan Business',
      tier: SubscriptionTier.BUSINESS,
      descripcion: '26-100 propiedades. LOS 7 VERTICALES. 2x más propiedades que Homming. API completa y CRM integrado.',
      precioMensual: 99,
      maxUsuarios: 10,
      maxPropiedades: 100,
      
      signaturesIncludedMonth: 25,
      storageIncludedGB: 20,
      aiTokensIncludedMonth: 50000,
      smsIncludedMonth: 50,
      
      extraSignaturePrice: 1.50,
      extraStorageGBPrice: 0.03,
      extraAITokensPrice: 0.007,
      extraSMSPrice: 0.08,
      
      modulosIncluidos: businessModulos,
      activo: true,
    },
  });
  console.log('✅ Plan BUSINESS:', planBusiness.nombre);
  console.log(`   📊 €99/mes | 26-100 props | 7 VERTICALES | 2x props vs Homming | API + CRM`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN ENTERPRISE - A cotizar (+100 propiedades, 7 verticales + custom)
  // Para grandes gestoras y promotoras. White-label, SLA, desarrollos a medida.
  // ═══════════════════════════════════════════════════════════════
  
  const enterpriseModulos = [
    'dashboard', 'properties', 'tenants', 'contracts', 'payments', 'documents',
    'maintenance', 'crm', 'reports', 'automation', 'api', 'ai_unlimited',
    'advanced_analytics', 'white_label', 'priority_support', 'custom_integrations',
    'sla_99_9', 'dedicated_account_manager', 'onsite_training',
    ...VERTICALES_POR_PLAN.ENTERPRISE,  // Los 7 verticales + custom
  ];
  
  const planEnterprise = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-enterprise' },
    update: {
      precioMensual: 199,
      maxUsuarios: 999,
      maxPropiedades: 9999,
      descripcion: '+100 propiedades. 7 VERTICALES + CUSTOM. White-label, SLA 99.9%, desarrollos a medida, soporte 24/7.',
      signaturesIncludedMonth: 100,
      storageIncludedGB: 100,
      aiTokensIncludedMonth: 200000,
      smsIncludedMonth: 200,
      modulosIncluidos: enterpriseModulos,
    },
    create: {
      id: 'plan-enterprise',
      nombre: 'Plan Enterprise',
      tier: SubscriptionTier.ENTERPRISE,
      descripcion: '+100 propiedades. 7 VERTICALES + CUSTOM. White-label, SLA 99.9%, desarrollos a medida, soporte 24/7.',
      precioMensual: 199,
      maxUsuarios: 999,
      maxPropiedades: 9999,
      
      signaturesIncludedMonth: 100,
      storageIncludedGB: 100,
      aiTokensIncludedMonth: 200000,
      smsIncludedMonth: 200,
      
      extraSignaturePrice: 1.50,
      extraStorageGBPrice: 0.03,
      extraAITokensPrice: 0.006,
      extraSMSPrice: 0.08,
      
      modulosIncluidos: enterpriseModulos,
      activo: true,
    },
  });
  console.log('✅ Plan ENTERPRISE:', planEnterprise.nombre);
  console.log(`   📊 A cotizar | +100 props | 7 VERTICALES + CUSTOM | White-label | SLA 99.9%`);

  console.log('\n✨ Seed completado!\n');
  
  // Mostrar resumen de márgenes y verticales
  console.log('═══════════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN: PLANES INMOVA vs COMPETENCIA (Verticales + Limitaciones)');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('🏢 LOS 7 VERTICALES DE INMOVA:');
  console.log('   1. Alquiler Residencial (tradicional + media estancia)');
  console.log('   2. STR / Vacacional (Airbnb, Booking, VRBO)');
  console.log('   3. Coliving (habitaciones y prorrateo)');
  console.log('   4. House Flipping (compra-reforma-venta)');
  console.log('   5. Construcción (ewoorker marketplace)');
  console.log('   6. Comunidades (administración de fincas)');
  console.log('   7. Servicios Profesionales (property management)');
  console.log('');
  console.log('   ⚠️  Homming: SOLO 1 vertical (alquiler tradicional)');
  console.log('   ⚠️  Rentger: SOLO 1-2 verticales');
  console.log('');
  console.log('───────────────────────────────────────────────────────────────────────────────────────');
  console.log('Plan           | Precio   | Props  | Verts | Usuarios | API | vs Competencia');
  console.log('───────────────────────────────────────────────────────────────────────────────────────');
  
  const plansSummary = [
    { name: 'FREE', price: 0, props: '1', verts: 1, users: 1, api: '❌', comp: 'Trial 30 días' },
    { name: 'STARTER', price: 29, props: '1-5', verts: 1, users: 1, api: '❌', comp: '-51% vs Homming (€59)' },
    { name: 'PROFESSIONAL', price: 49, props: '6-25', verts: 3, users: 3, api: '❌', comp: '-38%, 3x verticales' },
    { name: 'BUSINESS', price: 99, props: '26-100', verts: 7, users: 10, api: '✅', comp: '2x props, 7x verticales' },
    { name: 'ENTERPRISE', price: 0, props: '100+', verts: 7, users: '∞', api: '✅', comp: 'White-label, SLA' },
  ];
  
  plansSummary.forEach(plan => {
    const priceLabel = plan.price > 0 ? `€${plan.price.toString().padStart(3)}/mes` : 'Cotizar  ';
    const vertsLabel = plan.verts === 7 ? '7 (TODOS)' : plan.verts.toString();
    
    console.log(`${plan.name.padEnd(15)}| ${priceLabel} | ${plan.props.toString().padStart(6)} | ${vertsLabel.padEnd(9)} | ${plan.users.toString().padStart(8)} | ${plan.api} | ${plan.comp}`);
  });
  
  console.log('───────────────────────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log('📈 VENTAJA COMPETITIVA CLAVE:');
  console.log('   • Mismo precio que competencia = 3-7x más verticales');
  console.log('   • Business €99/mes incluye TODO lo que Homming cobra €279/mes');
  console.log('   • IA integrada en Professional y superiores');
  console.log('   • API disponible desde Business (Homming solo Enterprise)');
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════');
}


main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
