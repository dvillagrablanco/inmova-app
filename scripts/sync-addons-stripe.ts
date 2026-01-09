#!/usr/bin/env npx tsx
/**
 * Script: Sincronizar Add-ons con Stripe
 * 
 * Ejecutar: npx tsx scripts/sync-addons-stripe.ts
 * 
 * Este script:
 * 1. Lee todos los add-ons activos de la base de datos
 * 2. Crea/actualiza productos en Stripe para cada add-on
 * 3. Crea precios mensuales y anuales en Stripe
 * 4. Guarda los IDs de Stripe en la base de datos
 */

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const prisma = new PrismaClient();

let stripe: Stripe | null = null;

function getStripe(): Stripe | null {
  if (stripe) return stripe;
  
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY no está configurada');
    return null;
  }
  
  stripe = new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
  
  return stripe;
}

// ═══════════════════════════════════════════════════════════════
// SINCRONIZACIÓN
// ═══════════════════════════════════════════════════════════════

interface SyncResult {
  id: string;
  codigo: string;
  nombre: string;
  status: 'synced' | 'updated' | 'failed' | 'skipped';
  stripeProductId?: string;
  stripePriceIdMonthly?: string;
  stripePriceIdAnnual?: string;
  error?: string;
}

async function syncAddOnToStripe(addon: {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioMensual: number;
  precioAnual: number | null;
  categoria: string;
}): Promise<SyncResult> {
  const stripeClient = getStripe();
  if (!stripeClient) {
    return {
      id: addon.id,
      codigo: addon.codigo,
      nombre: addon.nombre,
      status: 'skipped',
      error: 'Stripe no configurado',
    };
  }

  try {
    // Buscar producto existente por metadata
    const existingProducts = await stripeClient.products.search({
      query: `metadata['inmovaAddonId']:'${addon.id}'`,
    });

    let product: Stripe.Product;
    let isUpdate = false;

    if (existingProducts.data.length > 0) {
      // Actualizar producto existente
      product = await stripeClient.products.update(existingProducts.data[0].id, {
        name: `INMOVA Add-on: ${addon.nombre}`,
        description: addon.descripcion,
        metadata: {
          inmovaAddonId: addon.id,
          codigo: addon.codigo,
          categoria: addon.categoria,
          type: 'addon',
        },
      });
      isUpdate = true;
      console.log(`  📝 Producto actualizado: ${product.id}`);
    } else {
      // Crear nuevo producto
      product = await stripeClient.products.create({
        name: `INMOVA Add-on: ${addon.nombre}`,
        description: addon.descripcion,
        metadata: {
          inmovaAddonId: addon.id,
          codigo: addon.codigo,
          categoria: addon.categoria,
          type: 'addon',
        },
      });
      console.log(`  ✨ Producto creado: ${product.id}`);
    }

    // Buscar precios existentes
    const existingPrices = await stripeClient.prices.list({
      product: product.id,
      active: true,
    });

    let priceMonthly: Stripe.Price | undefined;
    let priceAnnual: Stripe.Price | undefined;

    for (const price of existingPrices.data) {
      if (price.recurring?.interval === 'month') {
        priceMonthly = price;
      } else if (price.recurring?.interval === 'year') {
        priceAnnual = price;
      }
    }

    // Crear/actualizar precio mensual
    const targetMonthlyAmount = Math.round(addon.precioMensual * 100);
    if (!priceMonthly || priceMonthly.unit_amount !== targetMonthlyAmount) {
      // Desactivar precio anterior si existe y es diferente
      if (priceMonthly && priceMonthly.unit_amount !== targetMonthlyAmount) {
        await stripeClient.prices.update(priceMonthly.id, { active: false });
        console.log(`  🔄 Precio mensual anterior desactivado`);
      }

      priceMonthly = await stripeClient.prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: targetMonthlyAmount,
        recurring: { interval: 'month' },
        metadata: {
          inmovaAddonId: addon.id,
          codigo: addon.codigo,
          interval: 'monthly',
        },
      });
      console.log(`  💰 Precio mensual creado: €${addon.precioMensual}/mes`);
    }

    // Crear/actualizar precio anual si existe
    if (addon.precioAnual && addon.precioAnual > 0) {
      const targetAnnualAmount = Math.round(addon.precioAnual * 100);
      if (!priceAnnual || priceAnnual.unit_amount !== targetAnnualAmount) {
        if (priceAnnual && priceAnnual.unit_amount !== targetAnnualAmount) {
          await stripeClient.prices.update(priceAnnual.id, { active: false });
        }

        priceAnnual = await stripeClient.prices.create({
          product: product.id,
          currency: 'eur',
          unit_amount: targetAnnualAmount,
          recurring: { interval: 'year' },
          metadata: {
            inmovaAddonId: addon.id,
            codigo: addon.codigo,
            interval: 'annual',
          },
        });
        console.log(`  💰 Precio anual creado: €${addon.precioAnual}/año`);
      }
    }

    return {
      id: addon.id,
      codigo: addon.codigo,
      nombre: addon.nombre,
      status: isUpdate ? 'updated' : 'synced',
      stripeProductId: product.id,
      stripePriceIdMonthly: priceMonthly?.id,
      stripePriceIdAnnual: priceAnnual?.id,
    };
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`);
    return {
      id: addon.id,
      codigo: addon.codigo,
      nombre: addon.nombre,
      status: 'failed',
      error: error.message,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log('');
  console.log('═'.repeat(70));
  console.log('🔄 SINCRONIZACIÓN DE ADD-ONS CON STRIPE');
  console.log('═'.repeat(70));
  console.log('');

  // Verificar Stripe
  const stripeClient = getStripe();
  if (!stripeClient) {
    console.error('❌ No se puede continuar sin STRIPE_SECRET_KEY');
    process.exit(1);
  }
  console.log('✅ Stripe configurado correctamente');
  console.log('');

  // Obtener add-ons activos
  const addons = await prisma.addOn.findMany({
    where: { activo: true },
    orderBy: { orden: 'asc' },
  });

  console.log(`📦 Add-ons a sincronizar: ${addons.length}`);
  console.log('─'.repeat(70));
  console.log('');

  const results: SyncResult[] = [];
  let synced = 0, updated = 0, failed = 0, skipped = 0;

  for (const addon of addons) {
    console.log(`🔄 ${addon.nombre} (${addon.codigo})`);
    
    const result = await syncAddOnToStripe({
      id: addon.id,
      codigo: addon.codigo,
      nombre: addon.nombre,
      descripcion: addon.descripcion,
      precioMensual: addon.precioMensual,
      precioAnual: addon.precioAnual,
      categoria: addon.categoria,
    });

    results.push(result);

    if (result.status === 'synced') {
      synced++;
      // Actualizar BD
      await prisma.addOn.update({
        where: { id: addon.id },
        data: {
          stripeProductId: result.stripeProductId,
          stripePriceIdMonthly: result.stripePriceIdMonthly,
          stripePriceIdAnnual: result.stripePriceIdAnnual,
        },
      });
    } else if (result.status === 'updated') {
      updated++;
      await prisma.addOn.update({
        where: { id: addon.id },
        data: {
          stripeProductId: result.stripeProductId,
          stripePriceIdMonthly: result.stripePriceIdMonthly,
          stripePriceIdAnnual: result.stripePriceIdAnnual,
        },
      });
    } else if (result.status === 'failed') {
      failed++;
    } else {
      skipped++;
    }

    console.log('');
  }

  // Resumen
  console.log('═'.repeat(70));
  console.log('📊 RESUMEN');
  console.log('═'.repeat(70));
  console.log('');
  console.log(`  Total: ${addons.length}`);
  console.log(`  ✨ Nuevos sincronizados: ${synced}`);
  console.log(`  📝 Actualizados: ${updated}`);
  console.log(`  ❌ Fallidos: ${failed}`);
  console.log(`  ⏭️  Omitidos: ${skipped}`);
  console.log('');

  // Tabla de resultados
  console.log('DETALLE:');
  console.log('┌─────────────────────────────────────┬──────────┬─────────────────────────┐');
  console.log('│ Add-on                              │ Status   │ Stripe Product ID       │');
  console.log('├─────────────────────────────────────┼──────────┼─────────────────────────┤');
  for (const r of results) {
    const nombre = r.nombre.substring(0, 35).padEnd(35);
    const status = r.status.padEnd(8);
    const productId = (r.stripeProductId || r.error || '-').substring(0, 23).padEnd(23);
    console.log(`│ ${nombre} │ ${status} │ ${productId} │`);
  }
  console.log('└─────────────────────────────────────┴──────────┴─────────────────────────┘');
  console.log('');

  if (failed === 0) {
    console.log('✅ Sincronización completada exitosamente');
  } else {
    console.log(`⚠️  Sincronización completada con ${failed} errores`);
  }
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
