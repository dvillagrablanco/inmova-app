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
 * Estrategia Competitiva:
 * - Competencia: 1-2 verticales, €59-279/mes
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
  console.log('  • Competencia: 1-2 verticales, €59-279/mes');
  console.log('  • INMOVA: 1-7 verticales según plan, €35-299/mes');
  console.log('');

  // ═══════════════════════════════════════════════════════════════
  // PLAN PRO - €349/mes (Hasta 50 propiedades, 5 usuarios)
  // Plan principal para gestores profesionales
  // ═══════════════════════════════════════════════════════════════
  
  const proModulos = [
    'dashboard', 'properties', 'tenants', 'contracts', 'payments', 'documents',
    'maintenance', 'crm', 'reports', 'automation', 'api', 'ai_basic',
    'tenant_portal', 'owner_portal', 'integrations',
    ...VERTICALES_POR_PLAN.PROFESSIONAL,  // 3 verticales
  ];
  
  const planPro = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-pro' },
    update: {
      nombre: 'Plan PRO',
      precioMensual: 349,
      maxUsuarios: 5,
      maxPropiedades: 50,
      descripcion: 'Para gestorías que quieren escalar. Hasta 50 propiedades, 5 usuarios. API abierta e integraciones.',
      signaturesIncludedMonth: 10,
      storageIncludedGB: 10,
      aiTokensIncludedMonth: 10000,
      smsIncludedMonth: 50,
      modulosIncluidos: proModulos,
      activo: true,
    },
    create: {
      id: 'plan-pro',
      nombre: 'Plan PRO',
      tier: SubscriptionTier.PROFESSIONAL,
      descripcion: 'Para gestorías que quieren escalar. Hasta 50 propiedades, 5 usuarios. API abierta e integraciones.',
      precioMensual: 349,
      maxUsuarios: 5,
      maxPropiedades: 50,
      
      signaturesIncludedMonth: 10,
      storageIncludedGB: 10,
      aiTokensIncludedMonth: 10000,
      smsIncludedMonth: 50,
      
      extraSignaturePrice: 1.50,
      extraStorageGBPrice: 0.50,
      extraAITokensPrice: 0.0002,
      extraSMSPrice: 0.16,
      
      modulosIncluidos: proModulos,
      activo: true,
    },
  });
  console.log('✅ Plan PRO:', planPro.nombre);
  console.log(`   📊 €349/mes | Hasta 50 props | 5 usuarios | API abierta`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN ENTERPRISE - €749/mes (Propiedades y usuarios ilimitados)
  // White-label, SLA, desarrollos a medida incluidos
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
      nombre: 'Plan Enterprise',
      precioMensual: 749,
      maxUsuarios: 999,
      maxPropiedades: 9999,
      descripcion: 'Solución enterprise sin límites. White-label, SLA 99.9%, account manager dedicado, soporte 24/7.',
      signaturesIncludedMonth: 100,
      storageIncludedGB: 100,
      aiTokensIncludedMonth: 200000,
      smsIncludedMonth: 200,
      modulosIncluidos: enterpriseModulos,
      activo: true,
    },
    create: {
      id: 'plan-enterprise',
      nombre: 'Plan Enterprise',
      tier: SubscriptionTier.ENTERPRISE,
      descripcion: 'Solución enterprise sin límites. White-label, SLA 99.9%, account manager dedicado, soporte 24/7.',
      precioMensual: 749,
      maxUsuarios: 999,
      maxPropiedades: 9999,
      
      signaturesIncludedMonth: 100,
      storageIncludedGB: 100,
      aiTokensIncludedMonth: 200000,
      smsIncludedMonth: 200,
      
      extraSignaturePrice: 1.50,
      extraStorageGBPrice: 0.50,
      extraAITokensPrice: 0.0002,
      extraSMSPrice: 0.16,
      
      modulosIncluidos: enterpriseModulos,
      activo: true,
    },
  });
  console.log('✅ Plan ENTERPRISE:', planEnterprise.nombre);
  console.log(`   📊 €749/mes | Ilimitado | White-label, SLA 99.9%`);

  // ═══════════════════════════════════════════════════════════════
  // DESACTIVAR PLANES ANTIGUOS (Free, Starter, Professional, Business)
  // ═══════════════════════════════════════════════════════════════
  
  console.log('\n🔄 Desactivando planes antiguos...');
  
  const planesAntiguos = ['plan-free', 'plan-starter', 'plan-professional', 'plan-business'];
  
  for (const planId of planesAntiguos) {
    try {
      await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: { activo: false },
      });
      console.log(`   ⏸️  Plan ${planId} desactivado`);
    } catch (e) {
      // Plan no existe, ignorar
      console.log(`   ℹ️  Plan ${planId} no encontrado (OK)`);
    }
  }

  console.log('\n✨ Seed completado!\n');
  
  // Mostrar resumen de planes activos
  console.log('═══════════════════════════════════════════════════════════════════════════════════════');
  console.log('📊 PLANES ACTIVOS - INMOVA');
  console.log('═══════════════════════════════════════════════════════════════════════════════════════');
  console.log('');
  console.log('───────────────────────────────────────────────────────────────────────────────────────');
  console.log('Plan           | Precio   | Props     | Usuarios | Features principales');
  console.log('───────────────────────────────────────────────────────────────────────────────────────');
  console.log('PRO            | €349/mes | Hasta 50  | 5        | API, Integraciones, Multi-usuario');
  console.log('ENTERPRISE     | €749/mes | Ilimitado | Ilimitado| White-label, SLA 99.9%, Account Mgr');
  console.log('───────────────────────────────────────────────────────────────────────────────────────');
  console.log('');
  console.log('🛒 ADD-ONS DISPONIBLES (planes adicionales especializados):');
  console.log('   • AGENCIA (€449/mes): CRM especializado, Lead scoring IA');
  console.log('   • COLIVING (€599/mes): Room Rental PRO, Matching IA');
  console.log('   • ADMIN FINCAS (€299/mes): Votaciones, Portal propietario');
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
