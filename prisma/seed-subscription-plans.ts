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
      tier: SubscriptionTier.free,
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
  // PLAN STARTER
  // ═══════════════════════════════════════════════════════════════
  
  const planStarter = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-starter' },
    update: {},
    create: {
      id: 'plan-starter',
      nombre: 'Plan Starter',
      tier: SubscriptionTier.basico,
      descripcion: 'Plan inicial para propietarios con pocas propiedades. Incluye gestión básica y algunas integraciones.',
      precioMensual: 49,
      maxUsuarios: 2,
      maxPropiedades: 10,
      
      // Límites de integraciones (básicos)
      signaturesIncludedMonth: 3,      // 3 firmas/mes (costo: €3)
      storageIncludedGB: 5,             // 5 GB (costo: €0.12)
      aiTokensIncludedMonth: 5000,      // 5K tokens (costo: €0.024)
      smsIncludedMonth: 0,              // 0 SMS (añadir si lo activan)
      
      // Precios por exceso
      extraSignaturePrice: 2.00,
      extraStorageGBPrice: 0.05,
      extraAITokensPrice: 0.01,  // €0.01 por 1K tokens
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
  console.log(`   💰 Costo estimado para Inmova: €${(3 * 1 + 5 * 0.023 + 5000 * 0.0000047).toFixed(2)}/mes`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN PROFESSIONAL
  // ═══════════════════════════════════════════════════════════════
  
  const planProfessional = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-professional' },
    update: {},
    create: {
      id: 'plan-professional',
      nombre: 'Plan Professional',
      tier: SubscriptionTier.profesional,
      descripcion: 'Plan avanzado para gestores profesionales. Incluye todas las funcionalidades y integraciones completas.',
      precioMensual: 149,
      maxUsuarios: 10,
      maxPropiedades: 50,
      
      // Límites de integraciones (generosos)
      signaturesIncludedMonth: 10,     // 10 firmas/mes (costo: €10)
      storageIncludedGB: 20,            // 20 GB (costo: €0.46)
      aiTokensIncludedMonth: 50000,     // 50K tokens (costo: €0.24)
      smsIncludedMonth: 50,             // 50 SMS (costo: €3.75)
      
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
        'crm',
        'reports',
        'automation',
        'api',
      ],
      activo: true,
    },
  });
  console.log('✅ Plan PROFESSIONAL creado:', planProfessional.nombre);
  console.log(`   💰 Costo estimado para Inmova: €${(10 * 1 + 20 * 0.023 + 50000 * 0.0000047 + 50 * 0.075).toFixed(2)}/mes`);

  // ═══════════════════════════════════════════════════════════════
  // PLAN ENTERPRISE
  // ═══════════════════════════════════════════════════════════════
  
  const planEnterprise = await prisma.subscriptionPlan.upsert({
    where: { id: 'plan-enterprise' },
    update: {},
    create: {
      id: 'plan-enterprise',
      nombre: 'Plan Enterprise',
      tier: SubscriptionTier.enterprise,
      descripcion: 'Plan empresarial para grandes gestoras. Acceso ilimitado a usuarios y propiedades, soporte prioritario.',
      precioMensual: 499,
      maxUsuarios: 100,
      maxPropiedades: 500,
      
      // Límites de integraciones (muy generosos)
      signaturesIncludedMonth: 50,      // 50 firmas/mes (costo: €50)
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
  console.log(`   💰 Costo estimado para Inmova: €${(50 * 1 + 100 * 0.023 + 200000 * 0.0000047 + 200 * 0.075).toFixed(2)}/mes`);

  console.log('\n✨ Seed completado!\n');
  
  // Mostrar resumen de márgenes
  console.log('📊 RESUMEN DE MÁRGENES:');
  console.log('─────────────────────────────────────────────');
  
  const plans = [
    { name: 'FREE', price: 0, cost: 0.01 },
    { name: 'STARTER', price: 49, cost: 3.14 },
    { name: 'PROFESSIONAL', price: 149, cost: 14.45 },
    { name: 'ENTERPRISE', price: 499, cost: 68.24 },
  ];
  
  plans.forEach(plan => {
    const margin = plan.price > 0 ? ((plan.price - plan.cost) / plan.price * 100).toFixed(1) : '-';
    const profit = plan.price - plan.cost;
    
    console.log(`${plan.name.padEnd(15)} | €${plan.price.toString().padStart(3)}/mes | Costo: €${plan.cost.toFixed(2).padStart(5)} | Margen: ${margin.toString().padStart(4)}% | Ganancia: €${profit.toFixed(2)}`);
  });
  
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
