/**
 * Seed: Subscription Plans con Límites de Uso
 * 
 * Crea los planes de suscripción con límites definidos
 * para control de costos de integraciones
 * 
 * Ejecutar: npx tsx prisma/seed-subscription-plans.ts
 */

import { PrismaClient, SubscriptionTier } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Subscription Plans con Límites de Uso...\n');

  // ═══════════════════════════════════════════════════════════════
  // PLAN FREE
  // ═══════════════════════════════════════════════════════════════
  
  const planFree = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-free' },
    update: {},
    create: {
      id: 'plan-free',
      nombre: 'Plan Free',
      tier: SubscriptionTier.FREE,
      descripcion: 'Plan gratuito con funcionalidades básicas. Ideal para probar la plataforma.',
      precioMensual: 0,
      maxUsuarios: 1,
      maxPropiedades: 1,
      
      // Límites de integraciones (muy limitados en free)
      signaturesIncludedMonth: 0,      // 0 firmas incluidas
      storageIncludedGB: 0.5,           // 500 MB
      aiTokensIncludedMonth: 100,       // 100 tokens (casi nada)
      smsIncludedMonth: 0,              // 0 SMS
      
      // Precios por exceso (no se espera que use el free)
      extraSignaturePrice: 2.50,
      extraStorageGBPrice: 0.10,
      extraAITokensPrice: 0.02,
      extraSMSPrice: 0.15,
      
      modulosIncluidos: ['dashboard', 'properties', 'tenants'],
      activo: true,
    },
  });
  console.log('✅ Plan FREE creado:', planFree.nombre);

  // ═══════════════════════════════════════════════════════════════
  // PLAN STARTER - €29/mes (hasta 5 propiedades)
  // Competitivo: 26% más barato que Rentger básico
  // ═══════════════════════════════════════════════════════════════
  
  const planStarter = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-starter' },
    update: {
      precioMensual: 29,
      maxUsuarios: 1,
      maxPropiedades: 5,
      descripcion: 'Plan inicial para propietarios particulares. Gestión básica de 1-5 propiedades.',
      signaturesIncludedMonth: 3,
      storageIncludedGB: 1,
      aiTokensIncludedMonth: 0,
      smsIncludedMonth: 0,
    },
    create: {
      id: 'plan-starter',
      nombre: 'Plan Starter',
      tier: SubscriptionTier.STARTER,
      descripcion: 'Plan inicial para propietarios particulares. Gestión básica de 1-5 propiedades.',
      precioMensual: 29,
      maxUsuarios: 1,
      maxPropiedades: 5,
      
      // Límites de integraciones (mínimos)
      signaturesIncludedMonth: 3,      // 3 firmas/mes (costo: €3)
      storageIncludedGB: 1,             // 1 GB (costo: €0.02)
      aiTokensIncludedMonth: 0,         // Sin IA
      smsIncludedMonth: 0,              // Sin SMS
      
      // Precios por exceso
      extraSignaturePrice: 2.00,
      extraStorageGBPrice: 0.05,
      extraAITokensPrice: 0.01,
      extraSMSPrice: 0.10,
      
      modulosIncluidos: [
        'dashboard',
        'properties',
        'tenants',
        'contracts',
        'payments',
        'documents',
      ],
      activo: true,
    },
  });
  console.log('✅ Plan STARTER creado:', planStarter.nombre);
  console.log(`   💰 Precio: €29/mes | Hasta 5 propiedades | €5.80/propiedad`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN PROFESSIONAL - €39/mes (hasta 25 propiedades)
  // Competitivo: 44% más barato que Homming Pro (€69)
  // ═══════════════════════════════════════════════════════════════
  
  const planProfessional = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-professional' },
    update: {
      precioMensual: 39,
      maxUsuarios: 3,
      maxPropiedades: 25,
      descripcion: 'Plan para pequeños gestores e inversores. 6-25 propiedades con funcionalidades avanzadas.',
      signaturesIncludedMonth: 10,
      storageIncludedGB: 5,
      aiTokensIncludedMonth: 5000,
      smsIncludedMonth: 0,
    },
    create: {
      id: 'plan-professional',
      nombre: 'Plan Professional',
      tier: SubscriptionTier.PROFESSIONAL,
      descripcion: 'Plan para pequeños gestores e inversores. 6-25 propiedades con funcionalidades avanzadas.',
      precioMensual: 39,
      maxUsuarios: 3,
      maxPropiedades: 25,
      
      // Límites de integraciones (moderados)
      signaturesIncludedMonth: 10,     // 10 firmas/mes (costo: €10)
      storageIncludedGB: 5,             // 5 GB (costo: €0.12)
      aiTokensIncludedMonth: 5000,      // 5K tokens (costo: €0.024)
      smsIncludedMonth: 0,              // Sin SMS
      
      // Precios por exceso
      extraSignaturePrice: 1.80,
      extraStorageGBPrice: 0.04,
      extraAITokensPrice: 0.008,
      extraSMSPrice: 0.09,
      
      modulosIncluidos: [
        'dashboard',
        'properties',
        'tenants',
        'contracts',
        'payments',
        'documents',
        'maintenance',
        'reports',
        'tenant_portal',
        'owner_portal',
      ],
      activo: true,
    },
  });
  console.log('✅ Plan PROFESSIONAL creado:', planProfessional.nombre);
  console.log(`   💰 Precio: €39/mes | Hasta 25 propiedades | €1.56/propiedad`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN BUSINESS - €99/mes (hasta 100 propiedades)
  // Competitivo: Mejor coste unitario del mercado (€0.99/propiedad)
  // ═══════════════════════════════════════════════════════════════
  
  const planBusiness = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-business' },
    update: {
      precioMensual: 99,
      maxUsuarios: 10,
      maxPropiedades: 100,
      descripcion: 'Plan para agencias y gestoras profesionales. 26-100 propiedades con todas las funcionalidades.',
      signaturesIncludedMonth: 25,
      storageIncludedGB: 20,
      aiTokensIncludedMonth: 50000,
      smsIncludedMonth: 50,
    },
    create: {
      id: 'plan-business',
      nombre: 'Plan Business',
      tier: SubscriptionTier.BUSINESS,
      descripcion: 'Plan para agencias y gestoras profesionales. 26-100 propiedades con todas las funcionalidades.',
      precioMensual: 99,
      maxUsuarios: 10,
      maxPropiedades: 100,
      
      // Límites de integraciones (generosos)
      signaturesIncludedMonth: 25,      // 25 firmas/mes (costo: €25)
      storageIncludedGB: 20,            // 20 GB (costo: €0.46)
      aiTokensIncludedMonth: 50000,     // 50K tokens (costo: €0.24)
      smsIncludedMonth: 50,             // 50 SMS (costo: €3.75)
      
      // Precios por exceso
      extraSignaturePrice: 1.50,
      extraStorageGBPrice: 0.03,
      extraAITokensPrice: 0.007,
      extraSMSPrice: 0.08,
      
      modulosIncluidos: [
        'dashboard',
        'properties',
        'tenants',
        'contracts',
        'payments',
        'documents',
        'maintenance',
        'crm',
        'reports',
        'automation',
        'api',
        'tenant_portal',
        'owner_portal',
        'custom_branding',
      ],
      activo: true,
    },
  });
  console.log('✅ Plan BUSINESS creado:', planBusiness.nombre);
  console.log(`   💰 Precio: €99/mes | Hasta 100 propiedades | €0.99/propiedad`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN ENTERPRISE - €199+/mes (100+ propiedades, cotización)
  // Para grandes gestoras y promotoras
  // ═══════════════════════════════════════════════════════════════
  
  const planEnterprise = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-enterprise' },
    update: {
      precioMensual: 199,
      maxUsuarios: 999,
      maxPropiedades: 9999,
      descripcion: 'Plan para grandes gestoras y promotoras. +100 propiedades con desarrollos a medida y soporte 24/7.',
      signaturesIncludedMonth: 100,
      storageIncludedGB: 100,
      aiTokensIncludedMonth: 200000,
      smsIncludedMonth: 200,
    },
    create: {
      id: 'plan-enterprise',
      nombre: 'Plan Enterprise',
      tier: SubscriptionTier.ENTERPRISE,
      descripcion: 'Plan para grandes gestoras y promotoras. +100 propiedades con desarrollos a medida y soporte 24/7.',
      precioMensual: 199,
      maxUsuarios: 999,
      maxPropiedades: 9999,
      
      // Límites de integraciones (muy generosos)
      signaturesIncludedMonth: 100,     // 100 firmas/mes (costo: €100)
      storageIncludedGB: 100,           // 100 GB (costo: €2.30)
      aiTokensIncludedMonth: 200000,    // 200K tokens (costo: €0.94)
      smsIncludedMonth: 200,            // 200 SMS (costo: €15)
      
      // Precios por exceso (más baratos para enterprise)
      extraSignaturePrice: 1.50,
      extraStorageGBPrice: 0.03,
      extraAITokensPrice: 0.006,
      extraSMSPrice: 0.08,
      
      modulosIncluidos: [
        'dashboard',
        'properties',
        'tenants',
        'contracts',
        'payments',
        'documents',
        'maintenance',
        'crm',
        'reports',
        'automation',
        'api',
        'advanced_analytics',
        'white_label',
        'priority_support',
      ],
      activo: true,
    },
  });
  console.log('✅ Plan ENTERPRISE creado:', planEnterprise.nombre);
  console.log(`   💰 Precio: €199+/mes | +100 propiedades | Cotización`);

  console.log('\n✨ Seed completado!\n');
  
  // Mostrar resumen de márgenes
  console.log('📊 RESUMEN DE MÁRGENES (Nueva Estructura Competitiva):');
  console.log('──────────────────────────────────────────────────────────────────────');
  console.log('Plan           | Precio   | Props  | €/Prop | Costo Est. | Margen | vs Competencia');
  console.log('──────────────────────────────────────────────────────────────────────');
  
  const plans = [
    { name: 'FREE', price: 0, props: 1, cost: 0.01, comp: '-' },
    { name: 'STARTER', price: 29, props: 5, cost: 2.04, comp: '-26% vs Rentger' },
    { name: 'PROFESSIONAL', price: 39, props: 25, cost: 10.14, comp: '-44% vs Homming' },
    { name: 'BUSINESS', price: 99, props: 100, cost: 29.45, comp: '-34% vs Homming' },
    { name: 'ENTERPRISE', price: 199, props: 9999, cost: 118.24, comp: 'Competitivo' },
  ];
  
  plans.forEach(plan => {
    const margin = plan.price > 0 ? ((plan.price - plan.cost) / plan.price * 100).toFixed(0) : '-';
    const costPerProp = plan.props > 0 ? (plan.price / plan.props).toFixed(2) : '-';
    const propsLabel = plan.props >= 9999 ? '∞' : plan.props.toString();
    
    console.log(`${plan.name.padEnd(15)}| €${plan.price.toString().padStart(3)}/mes | ${propsLabel.padStart(5)} | €${costPerProp.padStart(5)} | €${plan.cost.toFixed(2).padStart(6)} | ${margin.padStart(3)}%  | ${plan.comp}`);
  });
  
  console.log('──────────────────────────────────────────────────────────────────────');
  console.log('\n💡 Posicionamiento: 20-44% más barato que competencia con 7 verticales vs 1-2\n');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
