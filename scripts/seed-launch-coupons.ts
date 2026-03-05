/**
 * Seed: Cupones de Lanzamiento 2026
 * 
 * Crea los cupones promocionales en la BD y los sincroniza con Stripe.
 * 
 * Cupones:
 * - LAUNCH2026: 50% dto. 3 meses en cualquier plan
 * - IAFREE2026: Addon IA gratis 2 meses  
 * - SWITCH2026: 30% dto. 6 meses para migraciones
 * - PACK2026: 50% dto. 1 mes en Pack Completo
 * 
 * Uso: npx tsx scripts/seed-launch-coupons.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.production' });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia' as any,
});

const COUPONS = [
  {
    codigo: 'LAUNCH2026',
    nombre: 'Lanzamiento 2026 — 50% descuento 3 meses',
    descripcion: 'Oferta de lanzamiento: 50% de descuento los 3 primeros meses en cualquier plan base.',
    tipo: 'porcentaje_temporal' as const,
    valor: 50,
    duracionMeses: 3,
    fechaInicio: new Date('2026-03-01'),
    fechaExpiracion: new Date('2026-06-30'),
    maxUsos: 500,
    planesAplicables: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    codigo: 'IAFREE2026',
    nombre: 'IA Inmobiliaria — 2 meses gratis',
    descripcion: 'Addon IA Inmobiliaria (€149/mes) gratis durante 2 meses al contratar cualquier plan.',
    tipo: 'meses_gratis' as const,
    valor: 2,
    duracionMeses: 2,
    fechaInicio: new Date('2026-03-01'),
    fechaExpiracion: new Date('2026-06-30'),
    maxUsos: 200,
    planesAplicables: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    codigo: 'SWITCH2026',
    nombre: 'Migración — 30% descuento 6 meses',
    descripcion: '30% de descuento durante 6 meses para clientes que migran desde otra plataforma. Incluye migración de datos gratuita.',
    tipo: 'porcentaje_temporal' as const,
    valor: 30,
    duracionMeses: 6,
    fechaInicio: new Date('2026-03-01'),
    fechaExpiracion: new Date('2026-12-31'),
    maxUsos: 100,
    planesAplicables: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
  },
  {
    codigo: 'PACK2026',
    nombre: 'Pack Completo — 50% primer mes',
    descripcion: 'Pack Completo de addons (5 addons por €499/mes) al 50% el primer mes: solo €249.',
    tipo: 'porcentaje_temporal' as const,
    valor: 50,
    duracionMeses: 1,
    fechaInicio: new Date('2026-03-01'),
    fechaExpiracion: new Date('2026-06-30'),
    maxUsos: 100,
    planesAplicables: ['BUSINESS', 'ENTERPRISE'],
  },
];

async function main() {
  console.log('====================================================================');
  console.log('  SEED: Cupones de Lanzamiento 2026');
  console.log('====================================================================\n');

  let created = 0;
  let updated = 0;
  let stripeSync = 0;

  for (const coupon of COUPONS) {
    console.log(`📋 ${coupon.codigo}: ${coupon.nombre}`);

    // Upsert in BD
    const existing = await prisma.promoCoupon.findUnique({
      where: { codigo: coupon.codigo },
    });

    const data = {
      nombre: coupon.nombre,
      descripcion: coupon.descripcion,
      tipo: coupon.tipo,
      valor: coupon.valor,
      fechaInicio: coupon.fechaInicio,
      fechaExpiracion: coupon.fechaExpiracion,
      maxUsos: coupon.maxUsos,
      activo: true,
      planesAplicables: coupon.planesAplicables,
    };

    if (existing) {
      await prisma.promoCoupon.update({
        where: { id: existing.id },
        data,
      });
      updated++;
      console.log(`  ✅ Actualizado en BD`);
    } else {
      await prisma.promoCoupon.create({
        data: { codigo: coupon.codigo, ...data },
      });
      created++;
      console.log(`  ✅ Creado en BD`);
    }

    // Sync to Stripe
    if (process.env.STRIPE_SECRET_KEY) {
      try {
        // Check if coupon exists in Stripe
        try {
          await stripe.coupons.retrieve(coupon.codigo);
          // Update existing
          // Stripe doesn't allow updating coupons, so we just log it
          console.log(`  ✅ Ya existe en Stripe`);
          stripeSync++;
        } catch {
          // Create new in Stripe
          const stripeCoupon = await stripe.coupons.create({
            id: coupon.codigo,
            percent_off: coupon.tipo === 'porcentaje_temporal' ? coupon.valor : undefined,
            duration: coupon.duracionMeses === 1 ? 'once' : 'repeating',
            duration_in_months: coupon.duracionMeses > 1 ? coupon.duracionMeses : undefined,
            max_redemptions: coupon.maxUsos,
            redeem_by: Math.floor(coupon.fechaExpiracion.getTime() / 1000),
            metadata: {
              inmova_coupon: coupon.codigo,
              description: coupon.nombre,
            },
          });
          console.log(`  ✅ Creado en Stripe: ${stripeCoupon.id}`);
          stripeSync++;

          // Update BD with Stripe ID
          await prisma.promoCoupon.updateMany({
            where: { codigo: coupon.codigo },
            data: { stripeCouponId: stripeCoupon.id },
          });
        }
      } catch (err: any) {
        console.log(`  ⚠️ Error Stripe: ${err.message}`);
      }
    }
    console.log('');
  }

  console.log('====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  BD: ${created} creados, ${updated} actualizados`);
  console.log(`  Stripe: ${stripeSync} sincronizados`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
