/**
 * Script para crear los cupones promocionales iniciales
 * 
 * Cupones actualizados para los nuevos planes (PRO €349, ENTERPRISE €749):
 * - PRO2MESES: 2 meses gratis en Plan PRO
 * - ENTERPRISE2MESES: 2 meses gratis en Plan Enterprise
 * - SWITCH26: Igualación de precio de competencia
 * - WELCOME30: 30% descuento primer año
 * 
 * Ejecutar: npx tsx scripts/seed-promo-coupons.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🎟️ Creando cupones promocionales...\n');

  // Fecha de expiración: 31 de Diciembre 2026
  const fechaExpiracion = new Date('2026-12-31T23:59:59.000Z');
  const fechaInicio = new Date();

  const coupons = [
    {
      codigo: 'PRO2MESES',
      nombre: '2 Meses GRATIS Plan PRO',
      descripcion: '2 meses completamente gratis en el Plan PRO (€349/mes). Ideal para gestores profesionales que quieren probar sin compromiso.',
      tipo: 'FREE_MONTHS' as const,
      valor: 2, // 2 meses gratis
      fechaInicio,
      fechaExpiracion,
      usosMaximos: 500,
      usosPorUsuario: 1,
      duracionMeses: 2,
      planesPermitidos: ['PRO', 'PROFESSIONAL'],
      destacado: true,
      notas: 'Campaña 2026. Ahorro total: €698 (2 x €349)',
      estado: 'ACTIVE' as const,
      activo: true,
    },
    {
      codigo: 'ENTERPRISE2MESES',
      nombre: '2 Meses GRATIS Enterprise',
      descripcion: '2 meses completamente gratis en el Plan Enterprise (€749/mes). Para empresas y fondos que buscan la solución completa.',
      tipo: 'FREE_MONTHS' as const,
      valor: 2, // 2 meses gratis
      fechaInicio,
      fechaExpiracion,
      usosMaximos: 100,
      usosPorUsuario: 1,
      duracionMeses: 2,
      planesPermitidos: ['ENTERPRISE'],
      destacado: true,
      notas: 'Campaña 2026. Ahorro total: €1,498 (2 x €749)',
      estado: 'ACTIVE' as const,
      activo: true,
    },
    {
      codigo: 'SWITCH26',
      nombre: 'Cambia y Ahorra',
      descripcion: 'Igualamos el precio de tu competidor actual y te damos 3 meses gratis. Incluye migración completa de datos sin coste.',
      tipo: 'FREE_MONTHS' as const,
      valor: 3, // 3 meses gratis
      fechaInicio,
      fechaExpiracion,
      usosMaximos: 100,
      usosPorUsuario: 1,
      duracionMeses: 3,
      planesPermitidos: [], // Aplica a cualquier plan
      destacado: true,
      notas: 'Requiere validación de factura de competidor. Migración de datos incluida.',
      estado: 'ACTIVE' as const,
      activo: true,
    },
    {
      codigo: 'WELCOME30',
      nombre: '30% Descuento Primer Año',
      descripcion: '30% de descuento durante los primeros 12 meses en cualquier plan. Sin compromiso de permanencia.',
      tipo: 'PERCENTAGE' as const,
      valor: 30, // 30% de descuento
      fechaInicio,
      fechaExpiracion,
      usosMaximos: 1000,
      usosPorUsuario: 1,
      duracionMeses: 12,
      planesPermitidos: [], // Aplica a cualquier plan
      destacado: true,
      notas: 'Cupón de bienvenida 2026. Plan PRO: €244/mes. Enterprise: €524/mes.',
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
