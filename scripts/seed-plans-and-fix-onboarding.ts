#!/usr/bin/env node
/**
 * @deprecated Use `scripts/sync-plans-landing.ts` instead.
 * This script has outdated plan definitions that don't match the landing page.
 * Run: npx tsx scripts/sync-plans-landing.ts
 */
/**
 * Script para:
 * 1. Cargar planes de suscripción en la BD
 * 2. Reset de onboarding para usuarios de prueba
 */

import prisma from '../lib/db';

const planes = [
  {
    nombre: 'Básico',
    descripcion: 'Plan inicial para pequeñas inmobiliarias o propietarios individuales',
    tier: 'basico',
    precioMensual: 49,
    maxUsuarios: 2,
    maxPropiedades: 50,
    modulosIncluidos: [
      'Dashboard básico',
      'Gestión de propiedades',
      'Gestión de inquilinos',
      'Contratos digitales',
      'Notificaciones por email',
    ],
    activo: true,
    // Límites de integraciones
    signaturesIncludedMonth: 10,
    storageIncludedGB: 5,
    aiTokensIncludedMonth: 10000,
    smsIncludedMonth: 50,
  },
  {
    nombre: 'Profesional',
    descripcion: 'Para agentes inmobiliarios y gestores profesionales',
    tier: 'profesional',
    precioMensual: 149,
    maxUsuarios: 10,
    maxPropiedades: 200,
    modulosIncluidos: [
      'Todo lo del plan Básico',
      'CRM con pipeline de ventas',
      'Automatizaciones básicas',
      'Informes personalizados',
      'Portal para inquilinos',
      'Integraciones con terceros',
      'Firma digital de contratos',
      'API access básico',
      'Soporte prioritario 24h',
    ],
    activo: true,
    signaturesIncludedMonth: 50,
    storageIncludedGB: 25,
    aiTokensIncludedMonth: 50000,
    smsIncludedMonth: 200,
  },
  {
    nombre: 'Empresarial',
    descripcion: 'Para gestoras y empresas inmobiliarias',
    tier: 'empresarial',
    precioMensual: 499,
    maxUsuarios: null, // Ilimitado
    maxPropiedades: null, // Ilimitado
    modulosIncluidos: [
      'Todo lo del plan Profesional',
      'Multi-empresa',
      'Workflows personalizados',
      'Integraciones avanzadas',
      'White-label opcional',
      'API access completo',
      'Soporte 24/7',
      'Account manager dedicado',
      'Capacitación incluida',
      'SLA 99.9%',
    ],
    activo: true,
    signaturesIncludedMonth: 200,
    storageIncludedGB: 100,
    aiTokensIncludedMonth: 200000,
    smsIncludedMonth: 1000,
  },
  {
    nombre: 'Premium',
    descripcion: 'Solución enterprise con características a medida',
    tier: 'premium',
    precioMensual: 999,
    maxUsuarios: null,
    maxPropiedades: null,
    modulosIncluidos: [
      'Todo lo del plan Empresarial',
      'Desarrollo a medida',
      'White-label completo',
      'Infraestructura dedicada',
      'Todos los add-ons incluidos',
      'Consultoría estratégica',
      'Soporte premium 24/7',
      'Account manager senior',
      'Acceso anticipado a features',
      'Integraciones custom',
      'Capacitación ilimitada',
    ],
    activo: true,
    signaturesIncludedMonth: null, // Ilimitado
    storageIncludedGB: 500,
    aiTokensIncludedMonth: 1000000,
    smsIncludedMonth: 5000,
  },
];

async function seedPlans() {
  console.log('🌱 Seeding subscription plans...\n');

  // Verificar si ya existen planes
  const existingPlans = await prisma.subscriptionPlan.count();

  if (existingPlans > 0) {
    console.log(`⚠️  Ya existen ${existingPlans} planes en la BD`);
    console.log('   ¿Deseas eliminarlos y recrearlos? (NO - solo se añadirán los faltantes)\n');
  }

  let created = 0;
  let skipped = 0;

  for (const planData of planes) {
    try {
      // Verificar si el plan ya existe por tier
      const existing = await prisma.subscriptionPlan.findFirst({
        where: { tier: planData.tier },
      });

      if (existing) {
        console.log(`⏭️  Plan "${planData.nombre}" ya existe (${planData.tier})`);
        skipped++;
        continue;
      }

      // Crear plan
      const plan = await prisma.subscriptionPlan.create({
        data: planData,
      });

      console.log(`✅ Creado: ${plan.nombre} - €${plan.precioMensual}/mes`);
      console.log(`   Tier: ${plan.tier}`);
      console.log(
        `   Límites: ${plan.signaturesIncludedMonth || '∞'} firmas, ${plan.storageIncludedGB || '∞'}GB storage`
      );
      console.log();

      created++;
    } catch (error: any) {
      console.error(`❌ Error creando plan ${planData.nombre}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`📊 Resumen:`);
  console.log(`   Planes creados: ${created}`);
  console.log(`   Planes omitidos (ya existían): ${skipped}`);
  console.log(`   Total en BD: ${await prisma.subscriptionPlan.count()}`);
  console.log('='.repeat(70));
}

async function fixOnboarding() {
  console.log('\n🔧 Configurando onboarding para usuarios de prueba...\n');

  // Usuario de test común
  const testEmails = ['admin@inmova.app', 'test@inmova.app', 'demo@inmova.app'];

  let updated = 0;

  for (const email of testEmails) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        // Crear o actualizar preferencias de usuario
        await prisma.userPreferences.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            onboardingCompleted: false, // Forzar a que se muestre el onboarding
            theme: 'light',
            language: 'es',
          },
          update: {
            onboardingCompleted: false, // Reset onboarding
          },
        });

        console.log(`✅ Reset onboarding para: ${email}`);
        updated++;
      } else {
        console.log(`⏭️  Usuario no encontrado: ${email}`);
      }
    } catch (error: any) {
      console.error(`❌ Error procesando ${email}:`, error.message);
    }
  }

  console.log(`\n   Total usuarios actualizados: ${updated}`);
}

async function assignDefaultPlans() {
  console.log('\n💳 Asignando plan por defecto a empresas sin plan...\n');

  // Obtener el plan básico
  const basicPlan = await prisma.subscriptionPlan.findFirst({
    where: { tier: 'basico' },
  });

  if (!basicPlan) {
    console.log('⚠️  No se encontró el plan básico. Omitiendo asignación.');
    return;
  }

  // Encontrar empresas sin plan
  const companies = await prisma.company.findMany({
    where: {
      subscriptionPlanId: null,
    },
  });

  console.log(`   Empresas sin plan: ${companies.length}`);

  let assigned = 0;

  for (const company of companies) {
    try {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionPlanId: basicPlan.id,
        },
      });

      console.log(`✅ Asignado plan Básico a: ${company.nombre}`);
      assigned++;
    } catch (error: any) {
      console.error(`❌ Error asignando plan a ${company.nombre}:`, error.message);
    }
  }

  console.log(`\n   Total empresas actualizadas: ${assigned}`);
}

async function main() {
  console.log('='.repeat(70));
  console.log('🚀 SEED: PLANES DE FACTURACIÓN Y FIX ONBOARDING');
  console.log('='.repeat(70));
  console.log();

  try {
    // 1. Seed de planes
    await seedPlans();

    // 2. Asignar planes a empresas
    await assignDefaultPlans();

    // 3. Fix onboarding
    await fixOnboarding();

    console.log('\n' + '='.repeat(70));
    console.log('✅ PROCESO COMPLETADO EXITOSAMENTE');
    console.log('='.repeat(70));
    console.log();
    console.log('Próximos pasos:');
    console.log('  1. Verificar planes: https://inmovaapp.com/planes');
    console.log('  2. Login: https://inmovaapp.com/login');
    console.log('  3. El tutorial debería aparecer automáticamente');
    console.log();
    console.log('IMPORTANTE:');
    console.log('  - Si el tutorial no aparece, limpia localStorage del navegador');
    console.log('  - O ejecuta en DevTools: localStorage.clear()');
    console.log();
  } catch (error: any) {
    console.error('\n❌ ERROR FATAL:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
