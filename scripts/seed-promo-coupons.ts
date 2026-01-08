/**
 * Script para crear los cupones promocionales iniciales
 * 
 * Cupones:
 * - STARTER26: 50% dto 3 meses en Plan Starter
 * - COLIVING26: 1 mes gratis + 20% dto 6 meses en Plan Professional
 * - SWITCH26: Igualación de precio de competencia
 * 
 * Ejecutar: npx tsx scripts/seed-promo-coupons.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎟️ Creando cupones promocionales...\n');

  // Fecha de expiración: 31 de Marzo 2026
  const fechaExpiracion = new Date('2026-03-31T23:59:59.000Z');
  const fechaInicio = new Date();

  const coupons = [
    {
      codigo: 'STARTER26',
      nombre: '¡Empieza a €17/mes!',
      descripcion: 'Plan Starter al 50% de descuento durante los 3 primeros meses. Ideal para pequeños propietarios y house flippers con hasta 5 propiedades.',
      tipo: 'PERCENTAGE' as const,
      valor: 50, // 50% de descuento
      fechaInicio,
      fechaExpiracion,
      usosMaximos: 500, // Límite de 500 usos
      usosPorUsuario: 1,
      duracionMeses: 3, // Aplica durante 3 meses
      planesPermitidos: ['STARTER'],
      destacado: true,
      notas: 'Campaña lanzamiento Q1 2026. Precio normal €35/mes → €17.50/mes. Ahorro total: €52.50',
      estado: 'ACTIVE' as const,
      activo: true,
    },
    {
      codigo: 'COLIVING26',
      nombre: 'Coliving Sin Complicaciones',
      descripcion: 'Primer mes GRATIS + 20% de descuento durante 6 meses adicionales en Plan Professional. Incluye prorrateo automático de suministros y migración de datos.',
      tipo: 'FREE_MONTHS' as const,
      valor: 1, // 1 mes gratis
      fechaInicio,
      fechaExpiracion,
      usosMaximos: 200, // Límite de 200 usos
      usosPorUsuario: 1,
      duracionMeses: 7, // 1 gratis + 6 con descuento
      planesPermitidos: ['PROFESSIONAL'],
      destacado: true,
      notas: 'Campaña coliving Q1 2026. Mes 1: €0, Meses 2-7: €47/mes (20% dto). Ahorro total: €59 + €72 = €131',
      estado: 'ACTIVE' as const,
      activo: true,
    },
    {
      codigo: 'SWITCH26',
      nombre: 'Cambia y Ahorra',
      descripcion: 'Igualamos el precio de tu competidor actual y te damos el plan superior GRATIS durante 12 meses. Incluye migración completa de datos.',
      tipo: 'PERCENTAGE' as const,
      valor: 100, // Marcador especial - se evalúa manualmente
      fechaInicio,
      fechaExpiracion,
      usosMaximos: 100, // Límite de 100 usos (requiere validación manual)
      usosPorUsuario: 1,
      duracionMeses: 12, // 12 meses
      planesPermitidos: [], // Aplica a cualquier plan
      destacado: true,
      notas: 'Requiere validación manual de factura de competidor. El usuario recibe el plan superior al que tenía en competencia.',
      estado: 'ACTIVE' as const,
      activo: true,
    },
  ];

  for (const coupon of coupons) {
    const existing = await prisma.promoCoupon.findUnique({
      where: { codigo: coupon.codigo },
    });

    if (existing) {
      console.log(`⚠️ Cupón ${coupon.codigo} ya existe, actualizando...`);
      await prisma.promoCoupon.update({
        where: { codigo: coupon.codigo },
        data: coupon,
      });
      console.log(`   ✅ ${coupon.codigo} actualizado`);
    } else {
      await prisma.promoCoupon.create({ data: coupon });
      console.log(`   ✅ ${coupon.codigo} creado`);
    }

    // Mostrar detalles
    console.log(`      📋 ${coupon.nombre}`);
    console.log(`      📅 Válido hasta: ${fechaExpiracion.toLocaleDateString('es-ES')}`);
    console.log(`      🎯 Planes: ${coupon.planesPermitidos.length ? coupon.planesPermitidos.join(', ') : 'Todos'}`);
    console.log(`      📊 Límite: ${coupon.usosMaximos} usos\n`);
  }

  // Resumen
  const allCoupons = await prisma.promoCoupon.findMany({
    where: { activo: true },
  });

  console.log('═══════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE CUPONES ACTIVOS');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total cupones: ${allCoupons.length}`);
  
  for (const c of allCoupons) {
    const diasRestantes = Math.ceil(
      (new Date(c.fechaExpiracion).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    console.log(`
  ${c.codigo}:
    - Estado: ${c.estado}
    - Días restantes: ${diasRestantes}
    - Usos: ${c.usosActuales}/${c.usosMaximos || '∞'}
    - Duración descuento: ${c.duracionMeses} meses`);
  }

  console.log('\n✅ Cupones promocionales configurados correctamente');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
