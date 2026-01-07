/**
 * Seed: Subscription Plans con Límites de Uso, Verticales y Add-ons
 * 
 * ESTRATEGIA: Todos los planes con margen >70% + Add-ons opcionales
 * 
 * ANÁLISIS DE COSTOS DETALLADO (ver ANALISIS_COSTOS_ESCALABLES.md):
 * 
 * Precios de Proveedores:
 * - Signaturit: €1.00/firma simple
 * - AWS S3: €0.023/GB/mes
 * - Claude IA: €4.70/1M tokens (~€0.005/1K tokens)
 * - Twilio SMS: €0.075/SMS
 * 
 * NUEVOS PRECIOS CON MARGEN >70%:
 * ┌─────────────────┬────────┬──────────┬─────────┬─────────┬─────────┬───────────┬────────┐
 * │ Plan            │ Precio │ Firmas   │ Storage │ IA      │ SMS     │ COSTO     │ MARGEN │
 * ├─────────────────┼────────┼──────────┼─────────┼─────────┼─────────┼───────────┼────────┤
 * │ FREE            │ €0     │ 0=€0     │ 0.5=€0  │ 100=€0  │ 0=€0    │ €0.01     │ -100%  │
 * │ STARTER €35     │ €35    │ 2=€2     │ 1=€0.02 │ 0=€0    │ 0=€0    │ €2.04     │ 94% ✅ │
 * │ PROFESSIONAL €59│ €59    │ 5=€5     │ 5=€0.12 │ 5K=€0.02│ 0=€0    │ €5.14     │ 91% ✅ │
 * │ BUSINESS €129   │ €129   │ 15=€15   │ 20=€0.46│ 50K=€0.2│ 25=€1.88│ €17.58    │ 86% ✅ │
 * │ ENTERPRISE €299 │ €299   │ 50=€50   │ 50=€1.15│ 100K=€0.5│100=€7.5│ €59.12    │ 80% ✅ │
 * └─────────────────┴────────┴──────────┴─────────┴─────────┴─────────┴───────────┴────────┘
 * 
 * ADD-ONS DISPONIBLES (margen 50-95%):
 * - Pack 10 Firmas: €15/mes (costo €10, margen 33%)
 * - Pack 10GB Storage: €5/mes (costo €0.23, margen 95%)
 * - Pack IA 50K tokens: €10/mes (costo €0.25, margen 97%)
 * - Pack 50 SMS: €8/mes (costo €3.75, margen 53%)
 * - White-label: €49/mes (costo ~€5, margen 90%)
 * - API Access: €29/mes (costo ~€0, margen 100%)
 * 
 * Estrategia Competitiva vs Homming/Rentger:
 * - Homming: 1 vertical (solo alquiler), €59-279/mes
 * - Rentger: 1-2 verticales, €39-149/mes
 * - INMOVA: 1-7 verticales según plan, €35-299/mes (mismo precio o menos, 3-7x más verticales)
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
  // PLAN STARTER - €35/mes (1-5 propiedades, 1 vertical)
  // Margen: 94% | Competitivo: -41% vs Homming (€59)
  // Costo: 2 firmas × €1 + 1GB × €0.02 = €2.04
  // ═══════════════════════════════════════════════════════════════
  
  const starterModulos = [
    'dashboard', 'properties', 'tenants', 'contracts', 'payments', 'documents',
    ...VERTICALES_POR_PLAN.STARTER,  // 1 vertical a elegir
  ];
  
  const planStarter = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-starter' },
    update: {
      precioMensual: 35,
      maxUsuarios: 1,
      maxPropiedades: 5,
      descripcion: '1-5 propiedades. 1 VERTICAL a elegir. -41% vs Homming (€59). Ideal para propietarios particulares.',
      signaturesIncludedMonth: 2,  // Reducido de 3 a 2
      storageIncludedGB: 1,
      aiTokensIncludedMonth: 0,
      smsIncludedMonth: 0,
      modulosIncluidos: starterModulos,
    },
    create: {
      id: 'plan-starter',
      nombre: 'Plan Starter',
      tier: SubscriptionTier.STARTER,
      descripcion: '1-5 propiedades. 1 VERTICAL a elegir. -41% vs Homming (€59). Ideal para propietarios particulares.',
      precioMensual: 35,
      maxUsuarios: 1,
      maxPropiedades: 5,
      
      signaturesIncludedMonth: 2,  // Reducido para mejor margen
      storageIncludedGB: 1,
      aiTokensIncludedMonth: 0,
      smsIncludedMonth: 0,
      
      extraSignaturePrice: 1.50,  // Pack 10 firmas = €15
      extraStorageGBPrice: 0.50,  // Pack 10GB = €5
      extraAITokensPrice: 0.0002, // Pack 50K = €10
      extraSMSPrice: 0.16,        // Pack 50 SMS = €8
      
      modulosIncluidos: starterModulos,
      activo: true,
    },
  });
  console.log('✅ Plan STARTER:', planStarter.nombre);
  console.log(`   📊 €35/mes | 1-5 props | 1 VERTICAL | Costo €2.04 | Margen 94%`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN PROFESSIONAL - €59/mes (6-25 propiedades, HASTA 3 verticales)
  // Margen: 91% | Competitivo: -25% vs Homming (€79), pero con 3x más verticales
  // Costo: 5 firmas × €1 + 5GB × €0.02 + 5K tokens × €0.005 = €5.14
  // ═══════════════════════════════════════════════════════════════
  
  const professionalModulos = [
    'dashboard', 'properties', 'tenants', 'contracts', 'payments', 'documents',
    'maintenance', 'reports', 'tenant_portal', 'owner_portal', 'ai_basic',
    ...VERTICALES_POR_PLAN.PROFESSIONAL,  // 3 verticales
  ];
  
  const planProfessional = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-professional' },
    update: {
      precioMensual: 59,
      maxUsuarios: 3,
      maxPropiedades: 25,
      descripcion: '6-25 propiedades. HASTA 3 VERTICALES (Alquiler + STR + Coliving). -25% vs Homming pero 3x más verticales.',
      signaturesIncludedMonth: 5,   // Reducido de 10 a 5
      storageIncludedGB: 5,
      aiTokensIncludedMonth: 5000,
      smsIncludedMonth: 0,
      modulosIncluidos: professionalModulos,
    },
    create: {
      id: 'plan-professional',
      nombre: 'Plan Professional',
      tier: SubscriptionTier.PROFESSIONAL,
      descripcion: '6-25 propiedades. HASTA 3 VERTICALES (Alquiler + STR + Coliving). -25% vs Homming pero 3x más verticales.',
      precioMensual: 59,
      maxUsuarios: 3,
      maxPropiedades: 25,
      
      signaturesIncludedMonth: 5,   // Reducido para mejor margen
      storageIncludedGB: 5,
      aiTokensIncludedMonth: 5000,
      smsIncludedMonth: 0,
      
      extraSignaturePrice: 1.50,  // Pack 10 firmas = €15
      extraStorageGBPrice: 0.50,  // Pack 10GB = €5
      extraAITokensPrice: 0.0002, // Pack 50K = €10
      extraSMSPrice: 0.16,        // Pack 50 SMS = €8
      
      modulosIncluidos: professionalModulos,
      activo: true,
    },
  });
  console.log('✅ Plan PROFESSIONAL:', planProfessional.nombre);
  console.log(`   📊 €59/mes | 6-25 props | 3 VERTICALES | Costo €5.14 | Margen 91%`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN BUSINESS - €129/mes (26-100 propiedades, LOS 7 VERTICALES)
  // Margen: 86% | Competitivo: -19% vs Homming (€159)
  // Costo: 15 firmas × €1 + 20GB × €0.02 + 50K × €0.005 + 25 SMS × €0.075 = €17.58
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
      precioMensual: 129,
      maxUsuarios: 10,
      maxPropiedades: 100,
      descripcion: '26-100 propiedades. LOS 7 VERTICALES. -19% vs Homming (€159). API completa y CRM integrado.',
      signaturesIncludedMonth: 15,   // Reducido de 25 a 15
      storageIncludedGB: 20,
      aiTokensIncludedMonth: 50000,
      smsIncludedMonth: 25,          // Reducido de 50 a 25
      modulosIncluidos: businessModulos,
    },
    create: {
      id: 'plan-business',
      nombre: 'Plan Business',
      tier: SubscriptionTier.BUSINESS,
      descripcion: '26-100 propiedades. LOS 7 VERTICALES. -19% vs Homming (€159). API completa y CRM integrado.',
      precioMensual: 129,
      maxUsuarios: 10,
      maxPropiedades: 100,
      
      signaturesIncludedMonth: 15,   // Reducido para mejor margen
      storageIncludedGB: 20,
      aiTokensIncludedMonth: 50000,
      smsIncludedMonth: 25,          // Reducido para mejor margen
      
      extraSignaturePrice: 1.50,  // Pack 10 firmas = €15
      extraStorageGBPrice: 0.50,  // Pack 10GB = €5
      extraAITokensPrice: 0.0002, // Pack 50K = €10
      extraSMSPrice: 0.16,        // Pack 50 SMS = €8
      
      modulosIncluidos: businessModulos,
      activo: true,
    },
  });
  console.log('✅ Plan BUSINESS:', planBusiness.nombre);
  console.log(`   📊 €129/mes | 26-100 props | 7 VERTICALES | Costo €17.58 | Margen 86%`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN ENTERPRISE - €299/mes (+100 propiedades, 7 verticales + custom)
  // Margen: 80% | White-label, SLA, desarrollos a medida incluidos
  // Costo: 50 firmas × €1 + 50GB × €0.02 + 100K × €0.005 + 100 SMS × €0.075 = €59.12
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
      precioMensual: 299,
      maxUsuarios: 999,
      maxPropiedades: 9999,
      descripcion: '+100 propiedades. 7 VERTICALES + CUSTOM. White-label, SLA 99.9%, desarrollos a medida, soporte 24/7.',
      signaturesIncludedMonth: 50,    // Reducido de 100 a 50
      storageIncludedGB: 50,          // Reducido de 100 a 50
      aiTokensIncludedMonth: 100000,  // Reducido de 200K a 100K
      smsIncludedMonth: 100,          // Reducido de 200 a 100
      modulosIncluidos: enterpriseModulos,
    },
    create: {
      id: 'plan-enterprise',
      nombre: 'Plan Enterprise',
      tier: SubscriptionTier.ENTERPRISE,
      descripcion: '+100 propiedades. 7 VERTICALES + CUSTOM. White-label, SLA 99.9%, desarrollos a medida, soporte 24/7.',
      precioMensual: 299,
      maxUsuarios: 999,
      maxPropiedades: 9999,
      
      signaturesIncludedMonth: 50,    // Reducido para mejor margen
      storageIncludedGB: 50,          // Reducido para mejor margen
      aiTokensIncludedMonth: 100000,  // Reducido para mejor margen
      smsIncludedMonth: 100,          // Reducido para mejor margen
      
      extraSignaturePrice: 1.50,  // Pack 10 firmas = €15
      extraStorageGBPrice: 0.50,  // Pack 10GB = €5
      extraAITokensPrice: 0.0002, // Pack 50K = €10
      extraSMSPrice: 0.16,        // Pack 50 SMS = €8
      
      modulosIncluidos: enterpriseModulos,
      activo: true,
    },
  });
  console.log('✅ Plan ENTERPRISE:', planEnterprise.nombre);
  console.log(`   📊 €299/mes | +100 props | 7 VERTICALES + CUSTOM | Costo €59.12 | Margen 80%`);

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
    { name: 'STARTER', price: 35, props: '1-5', verts: 1, users: 1, api: '❌', comp: '-41% vs Homming (€59)' },
    { name: 'PROFESSIONAL', price: 59, props: '6-25', verts: 3, users: 3, api: '❌', comp: '-25%, 3x verticales' },
    { name: 'BUSINESS', price: 129, props: '26-100', verts: 7, users: 10, api: '✅', comp: '-19% vs Homming €159' },
    { name: 'ENTERPRISE', price: 299, props: '100+', verts: 7, users: '∞', api: '✅', comp: 'White-label, SLA' },
  ];
  
  plansSummary.forEach(plan => {
    const priceLabel = plan.price > 0 ? `€${plan.price.toString().padStart(3)}/mes` : 'Cotizar  ';
    const vertsLabel = plan.verts === 7 ? '7 (TODOS)' : plan.verts.toString();
    
    console.log(`${plan.name.padEnd(15)}| ${priceLabel} | ${plan.props.toString().padStart(6)} | ${vertsLabel.padEnd(9)} | ${plan.users.toString().padStart(8)} | ${plan.api} | ${plan.comp}`);
  });
  
  console.log('───────────────────────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log('💰 ANÁLISIS DE COSTOS Y MÁRGENES (TODOS >70%):');
  console.log('');
  console.log('   Precios proveedores: Signaturit €1/firma, S3 €0.02/GB, Claude €0.005/1K, Twilio €0.075/SMS');
  console.log('');
  console.log('   Plan           | Precio | Firmas  | Storage | IA      | SMS    | COSTO   | MARGEN');
  console.log('   ───────────────┼────────┼─────────┼─────────┼─────────┼────────┼─────────┼────────');
  console.log('   STARTER        | €35    | 2=€2    | 1GB=€0  | 0       | 0      | €2.04   | 94% ✅');
  console.log('   PROFESSIONAL   | €59    | 5=€5    | 5GB=€0.1| 5K=€0   | 0      | €5.14   | 91% ✅');
  console.log('   BUSINESS       | €129   | 15=€15  | 20G=€0.5| 50K=€0.2| 25=€1.9| €17.58  | 86% ✅');
  console.log('   ENTERPRISE     | €299   | 50=€50  | 50G=€1  | 100K=€0.5|100=€7.5| €59.12  | 80% ✅');
  console.log('');
  console.log('🛒 ADD-ONS DISPONIBLES (para quienes necesiten más):');
  console.log('   • Pack 10 Firmas: €15/mes (costo €10, margen 33%)');
  console.log('   • Pack 10GB Storage: €5/mes (costo €0.23, margen 95%)');
  console.log('   • Pack IA 50K tokens: €10/mes (costo €0.25, margen 97%)');
  console.log('   • Pack 50 SMS: €8/mes (costo €3.75, margen 53%)');
  console.log('   • White-label: €49/mes (costo ~€5, margen 90%)');
  console.log('   • API Access: €29/mes (costo ~€0, margen 100%)');
  console.log('');
  console.log('📈 VENTAJA COMPETITIVA CLAVE:');
  console.log('   • Mismo precio o menor que competencia = 3-7x más verticales');
  console.log('   • Business €129/mes incluye TODO lo que Homming cobra €159/mes');
  console.log('   • IA integrada en Professional y superiores');
  console.log('   • API disponible desde Business (Homming solo Enterprise)');
  console.log('   • TODOS los planes con margen >70% garantizado');
  console.log('   • Add-ons flexibles para quienes necesiten más');
  console.log('');
  console.log('🛡️ CONTROL DE COSTOS: Ver CONTROL_COSTOS_IMPLEMENTADO.md');
  console.log('   • Límites estrictos por plan');
  console.log('   • Tracking automático de uso');
  console.log('   • Add-ons para necesidades extra');
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
