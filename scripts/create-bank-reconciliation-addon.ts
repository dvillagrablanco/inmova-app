/**
 * Script para crear el addon de Conciliación Bancaria en la BD y sincronizarlo con Stripe
 * 
 * Ejecutar: npx tsx scripts/create-bank-reconciliation-addon.ts
 */

import { prisma } from '../lib/db';
import Stripe from 'stripe';

const ADDON_CONFIG = {
  codigo: 'bank_reconciliation',
  nombre: 'Conciliación Bancaria Avanzada',
  descripcion: 'Conciliación automática de movimientos bancarios con IA, conexión Open Banking y sincronización en tiempo real. Incluye: auto-matching inteligente, reglas personalizadas, integración PSD2 y reportes de conciliación.',
  categoria: 'feature',
  precioMensual: 29,
  precioAnual: 290,
  unidades: null,
  tipoUnidad: null,
  disponiblePara: ['STARTER', 'PROFESSIONAL', 'BUSINESS'],
  incluidoEn: ['ENTERPRISE'],
  margenPorcentaje: 83,
  costoUnitario: 5,
  destacado: true,
  activo: true,
  orden: 10,
  vertical: 'inmova',
};

async function main() {
  console.log('🏦 Creando addon de Conciliación Bancaria...\n');

  // Verificar si ya existe
  const existing = await prisma.addOn.findUnique({
    where: { codigo: ADDON_CONFIG.codigo }
  });

  if (existing) {
    console.log('⚠️  El addon ya existe en la BD:', existing.id);
    console.log('   Actualizando configuración...\n');
    
    const updated = await prisma.addOn.update({
      where: { codigo: ADDON_CONFIG.codigo },
      data: {
        nombre: ADDON_CONFIG.nombre,
        descripcion: ADDON_CONFIG.descripcion,
        precioMensual: ADDON_CONFIG.precioMensual,
        precioAnual: ADDON_CONFIG.precioAnual,
        disponiblePara: ADDON_CONFIG.disponiblePara,
        incluidoEn: ADDON_CONFIG.incluidoEn,
        margenPorcentaje: ADDON_CONFIG.margenPorcentaje,
        costoUnitario: ADDON_CONFIG.costoUnitario,
        destacado: ADDON_CONFIG.destacado,
        activo: ADDON_CONFIG.activo,
      }
    });
    
    console.log('✅ Addon actualizado:', updated.id);
    return;
  }

  // Crear addon en la BD
  const addon = await prisma.addOn.create({
    data: ADDON_CONFIG
  });

  console.log('✅ Addon creado en BD:', addon.id);

  // Sincronizar con Stripe si está configurado
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (stripeKey && stripeKey.startsWith('sk_')) {
    console.log('\n📦 Sincronizando con Stripe...');
    
    try {
      const stripe = new Stripe(stripeKey, {
        apiVersion: '2024-12-18.acacia'
      });

      // Crear producto en Stripe
      const product = await stripe.products.create({
        name: ADDON_CONFIG.nombre,
        description: ADDON_CONFIG.descripcion,
        metadata: {
          addon_id: addon.id,
          codigo: ADDON_CONFIG.codigo,
          categoria: ADDON_CONFIG.categoria,
          vertical: ADDON_CONFIG.vertical,
        }
      });

      console.log('   Producto Stripe creado:', product.id);

      // Crear precio mensual
      const priceMonthly = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(ADDON_CONFIG.precioMensual * 100), // En céntimos
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: {
          addon_id: addon.id,
          type: 'monthly'
        }
      });

      console.log('   Precio mensual Stripe:', priceMonthly.id);

      // Crear precio anual
      const priceAnnual = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(ADDON_CONFIG.precioAnual * 100), // En céntimos
        currency: 'eur',
        recurring: { interval: 'year' },
        metadata: {
          addon_id: addon.id,
          type: 'annual'
        }
      });

      console.log('   Precio anual Stripe:', priceAnnual.id);

      // Actualizar addon con IDs de Stripe
      await prisma.addOn.update({
        where: { id: addon.id },
        data: {
          stripeProductId: product.id,
          stripePriceIdMonthly: priceMonthly.id,
          stripePriceIdAnnual: priceAnnual.id,
        }
      });

      console.log('\n✅ Addon sincronizado con Stripe correctamente');
    } catch (stripeError: any) {
      console.error('\n❌ Error sincronizando con Stripe:', stripeError.message);
      console.log('   El addon se creó en la BD pero sin sincronizar con Stripe');
    }
  } else {
    console.log('\n⚠️  STRIPE_SECRET_KEY no configurado, addon creado solo en BD');
  }

  console.log('\n📋 Resumen del addon:');
  console.log('   Código:', ADDON_CONFIG.codigo);
  console.log('   Nombre:', ADDON_CONFIG.nombre);
  console.log('   Precio mensual:', ADDON_CONFIG.precioMensual, '€');
  console.log('   Precio anual:', ADDON_CONFIG.precioAnual, '€');
  console.log('   Disponible para:', ADDON_CONFIG.disponiblePara.join(', '));
  console.log('   Incluido en:', ADDON_CONFIG.incluidoEn.join(', '));
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
