/**
 * Script para crear cupones en Stripe y sincronizarlos con la BD
 * 
 * Uso: npx tsx scripts/sync-coupons-stripe.ts
 * 
 * Según directrices cursorrules:
 * - Los cupones deben existir tanto en BD como en Stripe
 * - Los IDs de Stripe se almacenan para validación
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Verificar que tenemos la API key de Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY no configurada');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

// Cupones a crear (de la landing + test)
const CUPONES = [
  {
    codigo: 'STARTER26',
    tipo: 'PERCENTAGE' as const,
    valor: 50, // 50% descuento
    descripcion: '50% de descuento en Plan Starter durante 3 meses. Perfecto para pequeños propietarios y house flippers.',
    duracion: 'repeating' as const,
    duracionMeses: 3,
    usosMaximos: 1000,
    fechaExpiracion: new Date('2026-03-31'),
    planesPermitidos: ['starter'],
  },
  {
    codigo: 'COLIVING26',
    tipo: 'PERCENTAGE' as const,
    valor: 100, // 100% = primer mes gratis
    descripcion: '30 días gratis en Plan Professional. Ideal para gestores de coliving.',
    duracion: 'once' as const,
    duracionMeses: 1,
    usosMaximos: 500,
    fechaExpiracion: new Date('2026-03-31'),
    planesPermitidos: ['professional'],
  },
  {
    codigo: 'SWITCH26',
    tipo: 'PERCENTAGE' as const,
    valor: 50, // 50% descuento por cambio de competencia
    descripcion: 'Programa Cambia y Ahorra: 50% descuento 12 meses por migrar desde competencia.',
    duracion: 'repeating' as const,
    duracionMeses: 12,
    usosMaximos: 200,
    fechaExpiracion: new Date('2026-03-31'),
    planesPermitidos: ['professional', 'business', 'enterprise'],
  },
  {
    codigo: 'NEWCLIENT2026',
    tipo: 'PERCENTAGE' as const,
    valor: 25, // 25% descuento primer mes
    descripcion: 'Cupón de bienvenida para nuevos clientes. 25% de descuento en el primer mes.',
    duracion: 'once' as const,
    duracionMeses: 1,
    usosMaximos: 5000,
    fechaExpiracion: new Date('2026-12-31'),
    planesPermitidos: ['starter', 'professional', 'business', 'enterprise'],
  },
  {
    codigo: 'TEST2026',
    tipo: 'PERCENTAGE' as const,
    valor: 100, // 100% gratis para testing
    descripcion: 'Cupón de TEST - Primer mes GRATIS para pruebas internas. Solo uso administrativo.',
    duracion: 'once' as const,
    duracionMeses: 1,
    usosMaximos: 100,
    fechaExpiracion: new Date('2026-12-31'),
    planesPermitidos: ['starter', 'professional', 'business', 'enterprise'],
  },
];

async function createStripeCoupon(cupon: typeof CUPONES[0]): Promise<{ couponId: string; promoCodeId: string }> {
  console.log(`\n📦 Creando cupón en Stripe: ${cupon.codigo}`);

  // 1. Verificar si ya existe el cupón en Stripe
  try {
    const existingCoupons = await stripe.coupons.list({ limit: 100 });
    const existing = existingCoupons.data.find(c => c.name === cupon.codigo || c.id === cupon.codigo.toLowerCase());
    
    if (existing) {
      console.log(`  ⚠️ Cupón ya existe en Stripe: ${existing.id}`);
      
      // Buscar promotion code existente
      const promoCodes = await stripe.promotionCodes.list({ coupon: existing.id, limit: 10 });
      const promoCode = promoCodes.data.find(p => p.code === cupon.codigo);
      
      if (promoCode) {
        return { couponId: existing.id, promoCodeId: promoCode.id };
      }
      
      // Crear promotion code si no existe
      const newPromoCode = await stripe.promotionCodes.create({
        coupon: existing.id,
        code: cupon.codigo,
        max_redemptions: cupon.usosMaximos,
        expires_at: Math.floor(cupon.fechaExpiracion.getTime() / 1000),
      });
      
      return { couponId: existing.id, promoCodeId: newPromoCode.id };
    }
  } catch (error) {
    // Continuar si no existe
  }

  // 2. Crear cupón en Stripe
  const stripeCoupon = await stripe.coupons.create({
    id: cupon.codigo.toLowerCase(),
    name: cupon.codigo,
    percent_off: cupon.tipo === 'PERCENTAGE' ? cupon.valor : undefined,
    amount_off: cupon.tipo === 'FIXED' ? Math.round(cupon.valor * 100) : undefined,
    currency: cupon.tipo === 'FIXED' ? 'eur' : undefined,
    duration: cupon.duracion,
    duration_in_months: cupon.duracion === 'repeating' ? cupon.duracionMeses : undefined,
    max_redemptions: cupon.usosMaximos,
    redeem_by: Math.floor(cupon.fechaExpiracion.getTime() / 1000),
    metadata: {
      descripcion: cupon.descripcion,
      planes_permitidos: cupon.planesPermitidos.join(','),
      source: 'inmova_landing',
    },
  });

  console.log(`  ✅ Cupón creado: ${stripeCoupon.id}`);

  // 3. Crear código promocional (el código que usan los clientes)
  const promoCode = await stripe.promotionCodes.create({
    coupon: stripeCoupon.id,
    code: cupon.codigo,
    max_redemptions: cupon.usosMaximos,
    expires_at: Math.floor(cupon.fechaExpiracion.getTime() / 1000),
    metadata: {
      descripcion: cupon.descripcion,
    },
  });

  console.log(`  ✅ Código promocional creado: ${promoCode.code}`);

  return {
    couponId: stripeCoupon.id,
    promoCodeId: promoCode.id,
  };
}

async function syncCouponToDatabase(
  cupon: typeof CUPONES[0],
  stripeIds: { couponId: string; promoCodeId: string }
) {
  console.log(`  💾 Guardando en BD...`);

  // Buscar empresa principal (para cupones globales)
  let company = await prisma.company.findFirst({
    where: { id: 'company_default' },
  });

  if (!company) {
    // Crear empresa por defecto si no existe
    company = await prisma.company.create({
      data: {
        id: 'company_default',
        plan: 'enterprise',
        activo: true,
      },
    });
  }

  // Upsert del cupón en BD
  const dbCoupon = await prisma.discountCoupon.upsert({
    where: {
      companyId_codigo: {
        companyId: company.id,
        codigo: cupon.codigo,
      },
    },
    create: {
      companyId: company.id,
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: cupon.valor,
      descripcion: cupon.descripcion,
      usosMaximos: cupon.usosMaximos,
      usosActuales: 0,
      usosPorUsuario: 1,
      fechaInicio: new Date(),
      fechaExpiracion: cupon.fechaExpiracion,
      aplicaATodos: true,
      planesPermitidos: cupon.planesPermitidos,
      estado: 'activo',
      activo: true,
      creadoPor: 'system',
      // @ts-ignore - campos añadidos dinámicamente
      stripeCouponId: stripeIds.couponId,
      stripePromotionCodeId: stripeIds.promoCodeId,
    },
    update: {
      valor: cupon.valor,
      descripcion: cupon.descripcion,
      usosMaximos: cupon.usosMaximos,
      fechaExpiracion: cupon.fechaExpiracion,
      planesPermitidos: cupon.planesPermitidos,
      // @ts-ignore
      stripeCouponId: stripeIds.couponId,
      stripePromotionCodeId: stripeIds.promoCodeId,
    },
  });

  console.log(`  ✅ Guardado en BD: ${dbCoupon.id}`);
  return dbCoupon;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  SINCRONIZACIÓN DE CUPONES - INMOVA + STRIPE               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📅 Fecha: ${new Date().toISOString()}`);
  console.log(`🔑 Stripe API: ${process.env.STRIPE_SECRET_KEY?.substring(0, 10)}...`);
  console.log(`📊 Cupones a procesar: ${CUPONES.length}`);

  const results: Array<{ codigo: string; success: boolean; error?: string }> = [];

  for (const cupon of CUPONES) {
    try {
      // 1. Crear en Stripe
      const stripeIds = await createStripeCoupon(cupon);

      // 2. Guardar en BD
      await syncCouponToDatabase(cupon, stripeIds);

      results.push({ codigo: cupon.codigo, success: true });
    } catch (error: any) {
      console.error(`  ❌ Error: ${error.message}`);
      results.push({ codigo: cupon.codigo, success: false, error: error.message });
    }
  }

  // Resumen
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  RESUMEN                                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const exitosos = results.filter(r => r.success);
  const fallidos = results.filter(r => !r.success);

  console.log(`✅ Exitosos: ${exitosos.length}`);
  exitosos.forEach(r => console.log(`   - ${r.codigo}`));

  if (fallidos.length > 0) {
    console.log(`\n❌ Fallidos: ${fallidos.length}`);
    fallidos.forEach(r => console.log(`   - ${r.codigo}: ${r.error}`));
  }

  // Listar cupones en BD
  console.log('\n📋 Cupones en Base de Datos:');
  const dbCoupons = await prisma.discountCoupon.findMany({
    select: {
      codigo: true,
      tipo: true,
      valor: true,
      estado: true,
      fechaExpiracion: true,
      usosMaximos: true,
    },
    orderBy: { codigo: 'asc' },
  });

  console.log('┌─────────────────┬────────────┬───────┬─────────┬────────────┬──────────┐');
  console.log('│ Código          │ Tipo       │ Valor │ Estado  │ Expira     │ Max Usos │');
  console.log('├─────────────────┼────────────┼───────┼─────────┼────────────┼──────────┤');
  dbCoupons.forEach(c => {
    const expira = c.fechaExpiracion.toISOString().split('T')[0];
    console.log(
      `│ ${c.codigo.padEnd(15)} │ ${c.tipo.padEnd(10)} │ ${String(c.valor).padStart(5)}${c.tipo === 'PERCENTAGE' ? '%' : '€'} │ ${c.estado.padEnd(7)} │ ${expira} │ ${String(c.usosMaximos || '-').padStart(8)} │`
    );
  });
  console.log('└─────────────────┴────────────┴───────┴─────────┴────────────┴──────────┘');

  await prisma.$disconnect();
  console.log('\n✅ Sincronización completada');
}

main().catch(async (error) => {
  console.error('Error fatal:', error);
  await prisma.$disconnect();
  process.exit(1);
});
