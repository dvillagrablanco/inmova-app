/**
 * Script para sincronizar los planes de suscripción desde la configuración a la base de datos
 * 
 * Uso:
 *   npx tsx scripts/sync-planes-to-db.ts
 * 
 * Este script:
 * 1. Lee los planes de PRICING_PLANS en lib/pricing-config.ts
 * 2. Crea o actualiza los planes en la tabla subscription_plans
 * 3. Mapea los tiers correctamente
 */

import { PrismaClient } from '@prisma/client';
import { PRICING_PLANS, ADD_ONS } from '../lib/pricing-config';

const prisma = new PrismaClient();

// Mapeo de tiers del config a enum de Prisma
const tierMapping: Record<string, string> = {
  'basic': 'STARTER',
  'professional': 'PROFESSIONAL', 
  'business': 'BUSINESS',
  'enterprise': 'ENTERPRISE',
};

// Módulos base por tier
const modulosPorTier: Record<string, string[]> = {
  'STARTER': [
    'edificios',
    'unidades', 
    'inquilinos',
    'contratos',
    'pagos_basico',
    'documentos',
  ],
  'PROFESSIONAL': [
    'edificios',
    'unidades',
    'inquilinos', 
    'contratos',
    'pagos',
    'documentos',
    'mantenimiento',
    'comunicaciones',
    'firma_digital',
    'reportes',
    'crm_basico',
  ],
  'BUSINESS': [
    'edificios',
    'unidades',
    'inquilinos',
    'contratos',
    'pagos',
    'documentos',
    'mantenimiento',
    'comunicaciones',
    'firma_digital',
    'reportes',
    'crm',
    'analytics',
    'api_access',
    'white_label',
    'construccion',
    'str',
    'coliving',
  ],
  'ENTERPRISE': [
    'all', // Todos los módulos
  ],
};

// Límites de integraciones por tier
const limitesPorTier: Record<string, any> = {
  'STARTER': {
    signaturesIncludedMonth: 5,
    extraSignaturePrice: 2.50,
    storageIncludedGB: 2,
    extraStorageGBPrice: 0.10,
    aiTokensIncludedMonth: 10000,
    extraAITokensPrice: 0.02,
    smsIncludedMonth: 0,
    extraSMSPrice: 0.12,
  },
  'PROFESSIONAL': {
    signaturesIncludedMonth: 25,
    extraSignaturePrice: 2.00,
    storageIncludedGB: 10,
    extraStorageGBPrice: 0.08,
    aiTokensIncludedMonth: 50000,
    extraAITokensPrice: 0.015,
    smsIncludedMonth: 50,
    extraSMSPrice: 0.10,
  },
  'BUSINESS': {
    signaturesIncludedMonth: 100,
    extraSignaturePrice: 1.50,
    storageIncludedGB: 50,
    extraStorageGBPrice: 0.05,
    aiTokensIncludedMonth: 200000,
    extraAITokensPrice: 0.01,
    smsIncludedMonth: 200,
    extraSMSPrice: 0.08,
  },
  'ENTERPRISE': {
    signaturesIncludedMonth: 999999, // Ilimitado
    extraSignaturePrice: 1.00,
    storageIncludedGB: 500,
    extraStorageGBPrice: 0.03,
    aiTokensIncludedMonth: 999999, // Ilimitado
    extraAITokensPrice: 0.008,
    smsIncludedMonth: 1000,
    extraSMSPrice: 0.05,
  },
};

async function syncPlanes() {
  console.log('🔄 Sincronizando planes de suscripción...\n');

  for (const [key, plan] of Object.entries(PRICING_PLANS)) {
    const tier = tierMapping[key] || 'STARTER';
    const modulos = modulosPorTier[tier] || [];
    const limites = limitesPorTier[tier] || {};

    console.log(`📦 Procesando plan: ${plan.name} (${tier})`);

    // Buscar si ya existe
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { nombre: plan.name },
          { tier: tier as any },
        ],
      },
    });

    const planData = {
      nombre: plan.name,
      tier: tier as any,
      descripcion: plan.description,
      precioMensual: plan.monthlyPrice,
      maxUsuarios: typeof plan.maxUsers === 'number' ? plan.maxUsers : 999,
      maxPropiedades: typeof plan.maxProperties === 'number' ? plan.maxProperties : 9999,
      modulosIncluidos: modulos,
      ...limites,
      activo: true,
    };

    if (existingPlan) {
      // Actualizar
      await prisma.subscriptionPlan.update({
        where: { id: existingPlan.id },
        data: planData,
      });
      console.log(`   ✅ Actualizado (ID: ${existingPlan.id})`);
    } else {
      // Crear
      const newPlan = await prisma.subscriptionPlan.create({
        data: planData,
      });
      console.log(`   ✅ Creado (ID: ${newPlan.id})`);
    }

    // Mostrar detalles
    console.log(`   💰 Precio: €${plan.monthlyPrice}/mes`);
    console.log(`   👥 Usuarios: ${plan.maxUsers}`);
    console.log(`   🏠 Propiedades: ${plan.maxProperties}`);
    console.log(`   ✍️ Firmas/mes: ${limites.signaturesIncludedMonth}`);
    console.log(`   💾 Storage: ${limites.storageIncludedGB} GB`);
    console.log(`   🤖 AI Tokens: ${limites.aiTokensIncludedMonth.toLocaleString()}`);
    console.log('');
  }

  // Añadir plan FREE si no existe
  const freePlan = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'FREE' as any },
  });

  if (!freePlan) {
    console.log('📦 Creando plan FREE...');
    await prisma.subscriptionPlan.create({
      data: {
        nombre: 'Free',
        tier: 'FREE' as any,
        descripcion: 'Plan gratuito con funcionalidades básicas',
        precioMensual: 0,
        maxUsuarios: 1,
        maxPropiedades: 3,
        modulosIncluidos: ['edificios', 'unidades', 'inquilinos_basico'],
        signaturesIncludedMonth: 0,
        storageIncludedGB: 0.5,
        aiTokensIncludedMonth: 1000,
        smsIncludedMonth: 0,
        activo: true,
      },
    });
    console.log('   ✅ Plan FREE creado\n');
  }

  // Resumen final
  const totalPlanes = await prisma.subscriptionPlan.count();
  const planesActivos = await prisma.subscriptionPlan.count({ where: { activo: true } });
  
  console.log('=' .repeat(50));
  console.log('📊 RESUMEN');
  console.log('=' .repeat(50));
  console.log(`Total planes: ${totalPlanes}`);
  console.log(`Planes activos: ${planesActivos}`);
  
  const planes = await prisma.subscriptionPlan.findMany({
    orderBy: { precioMensual: 'asc' },
    select: {
      nombre: true,
      tier: true,
      precioMensual: true,
      maxUsuarios: true,
      maxPropiedades: true,
      activo: true,
    },
  });

  console.log('\n📋 Planes en BD:');
  planes.forEach(p => {
    const status = p.activo ? '✅' : '❌';
    console.log(`   ${status} ${p.nombre} (${p.tier}): €${p.precioMensual}/mes | ${p.maxUsuarios} usuarios | ${p.maxPropiedades} propiedades`);
  });
}

async function main() {
  try {
    await syncPlanes();
    console.log('\n✅ Sincronización completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
