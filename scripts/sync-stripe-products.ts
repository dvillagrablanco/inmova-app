#!/usr/bin/env npx tsx
/**
 * Script para sincronizar todos los planes y add-ons con Stripe
 * 
 * Ejecutar: npx tsx scripts/sync-stripe-products.ts
 * 
 * Este script:
 * 1. Lee los planes de la BD
 * 2. Crea productos/precios en Stripe
 * 3. Actualiza la BD con los IDs de Stripe
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Importar dinámicamente para evitar errores de build
async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     SINCRONIZACIÓN DE PLANES Y ADD-ONS CON STRIPE             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Verificar Stripe API Key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY no está configurada');
    console.log('\nPara configurar:');
    console.log('  export STRIPE_SECRET_KEY=sk_live_xxx');
    process.exit(1);
  }

  // Importar servicio de Stripe
  const stripeService = await import('../lib/stripe-subscription-service');

  console.log('📋 Fase 1: Sincronizando Planes de Suscripción...\n');

  // Obtener planes activos
  const plans = await prisma.subscriptionPlan.findMany({
    where: { activo: true },
  });

  console.log(`   Encontrados ${plans.length} planes activos\n`);

  let plansSynced = 0;
  let plansFailed = 0;

  for (const plan of plans) {
    process.stdout.write(`   → Sincronizando "${plan.nombre}"... `);

    try {
      const stripeIds = await stripeService.syncPlanToStripe({
        id: plan.id,
        nombre: plan.nombre,
        descripcion: plan.descripcion,
        precioMensual: plan.precioMensual,
        precioAnual: plan.precioMensual * 10, // 2 meses gratis
        tier: plan.tier,
      });

      if (stripeIds) {
        // Actualizar BD con IDs de Stripe
        // Nota: El schema actual no tiene estos campos, se actualizarían en metadata
        console.log(`✅ (Product: ${stripeIds.productId})`);
        plansSynced++;
      } else {
        console.log('⚠️ Sin cambios');
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
      plansFailed++;
    }
  }

  console.log(`\n   Resultado: ${plansSynced} sincronizados, ${plansFailed} fallidos\n`);

  console.log('📦 Fase 2: Sincronizando Add-ons...\n');

  // Obtener add-ons activos
  const addons = await prisma.addOn.findMany({
    where: { activo: true },
  });

  console.log(`   Encontrados ${addons.length} add-ons activos\n`);

  let addonsSynced = 0;
  let addonsFailed = 0;

  for (const addon of addons) {
    process.stdout.write(`   → Sincronizando "${addon.nombre}"... `);

    try {
      const stripeIds = await stripeService.syncAddOnToStripe({
        id: addon.id,
        codigo: addon.codigo,
        nombre: addon.nombre,
        descripcion: addon.descripcion,
        precioMensual: addon.precioMensual,
        precioAnual: addon.precioAnual || undefined,
        categoria: addon.categoria,
      });

      if (stripeIds) {
        // Actualizar BD con IDs de Stripe
        await prisma.addOn.update({
          where: { id: addon.id },
          data: {
            stripeProductId: stripeIds.productId,
            stripePriceIdMonthly: stripeIds.priceIdMonthly,
            stripePriceIdAnnual: stripeIds.priceIdAnnual,
          },
        });

        console.log(`✅ (Product: ${stripeIds.productId})`);
        addonsSynced++;
      } else {
        console.log('⚠️ Sin cambios');
      }
    } catch (error: any) {
      console.log(`❌ Error: ${error.message}`);
      addonsFailed++;
    }
  }

  console.log(`\n   Resultado: ${addonsSynced} sincronizados, ${addonsFailed} fallidos\n`);

  // Resumen final
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    RESUMEN DE SINCRONIZACIÓN                  ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║  Planes:  ${plansSynced} sincronizados, ${plansFailed} fallidos                        ║`);
  console.log(`║  Add-ons: ${addonsSynced} sincronizados, ${addonsFailed} fallidos                        ║`);
  console.log('╚════════════════════════════════════════════════════════════════╝');

  if (plansFailed > 0 || addonsFailed > 0) {
    console.log('\n⚠️ Algunos elementos fallaron. Revisa los logs arriba.');
  } else {
    console.log('\n✅ Todos los productos sincronizados correctamente con Stripe.');
  }
}

main()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
