/**
 * Script para cargar los cupones publicados en la landing de INMOVA
 * 
 * Cupones identificados en la landing:
 * - LAUNCH2025: 50% descuento primer mes
 * - LAUNCH2026: 50% descuento primer mes (versión actualizada)
 * - COLIVING50: 50% descuento adicional para coliving
 * - TEST: Cupón de prueba para demos
 * 
 * Ejecutar: npx tsx scripts/seed-landing-coupons.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cupones de la landing
const LANDING_COUPONS = [
  {
    codigo: 'LAUNCH2025',
    nombre: 'Lanzamiento 2025',
    descripcion: 'Campaña de lanzamiento - 50% de descuento en el primer mes de suscripción. Válido para todos los planes.',
    tipo: 'PERCENTAGE' as const,
    valor: 50,
    fechaInicio: new Date('2025-01-01'),
    fechaExpiracion: new Date('2026-03-31'),
    usosMaximos: 500,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: [], // Todos los planes
    destacado: true,
    notas: 'Cupón de lanzamiento publicado en /landing/campanas/launch2025',
  },
  {
    codigo: 'LAUNCH2026',
    nombre: 'Lanzamiento 2026',
    descripcion: 'Campaña de lanzamiento 2026 - 50% de descuento en el primer mes. Solo 150 plazas disponibles.',
    tipo: 'PERCENTAGE' as const,
    valor: 50,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-03-31'),
    usosMaximos: 150,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: [],
    destacado: true,
    notas: 'Cupón de lanzamiento 2026 - Límite 150 usuarios',
  },
  {
    codigo: 'COLIVING50',
    nombre: 'Descuento Coliving',
    descripcion: '50% de descuento adicional para módulo de Coliving. Ideal para gestores de espacios compartidos.',
    tipo: 'PERCENTAGE' as const,
    valor: 50,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-12-31'),
    usosMaximos: 100,
    usosPorUsuario: 1,
    duracionMeses: 3,
    planesPermitidos: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: true,
    notas: 'Cupón específico para vertical de Coliving',
  },
  {
    codigo: 'WELCOME30',
    nombre: 'Bienvenida 30%',
    descripcion: '30% de descuento de bienvenida para nuevos usuarios. Válido durante los primeros 2 meses.',
    tipo: 'PERCENTAGE' as const,
    valor: 30,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-12-31'),
    usosMaximos: null, // Ilimitado
    usosPorUsuario: 1,
    duracionMeses: 2,
    planesPermitidos: [],
    destacado: false,
    notas: 'Cupón de bienvenida estándar',
  },
  {
    codigo: 'MIGRACION',
    nombre: 'Migración Gratuita',
    descripcion: 'Migración de datos gratuita + 1 mes gratis al contratar plan Business o superior.',
    tipo: 'FREE_MONTHS' as const,
    valor: 1,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-06-30'),
    usosMaximos: 50,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: ['BUSINESS', 'ENTERPRISE'],
    destacado: true,
    notas: 'Cupón para migración desde otras plataformas',
  },
  {
    codigo: 'ANUAL20',
    nombre: 'Descuento Anual',
    descripcion: '20% de descuento adicional al contratar plan anual. Acumulable con otros cupones.',
    tipo: 'PERCENTAGE' as const,
    valor: 20,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-12-31'),
    usosMaximos: null,
    usosPorUsuario: 1,
    duracionMeses: 12,
    planesPermitidos: [],
    destacado: false,
    notas: 'Cupón para suscripciones anuales',
  },
  {
    codigo: 'PARTNER15',
    nombre: 'Descuento Partners',
    descripcion: '15% de descuento permanente para clientes referidos por partners de Inmova.',
    tipo: 'PERCENTAGE' as const,
    valor: 15,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2027-12-31'),
    usosMaximos: null,
    usosPorUsuario: 1,
    duracionMeses: 12,
    planesPermitidos: [],
    destacado: false,
    notas: 'Cupón para programa de partners',
  },
  {
    codigo: 'TEST',
    nombre: 'Cupón de Prueba',
    descripcion: 'Cupón de prueba para demos y testing. 100% descuento primer mes.',
    tipo: 'PERCENTAGE' as const,
    valor: 100,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2027-12-31'),
    usosMaximos: 10,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: [],
    destacado: false,
    notas: 'Cupón interno para demos - NO publicar',
  },
];

async function seedCoupons() {
  console.log('🎫 Iniciando carga de cupones de la landing...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const coupon of LANDING_COUPONS) {
    try {
      const existing = await prisma.promoCoupon.findUnique({
        where: { codigo: coupon.codigo },
      });

      if (existing) {
        // Actualizar si ya existe
        await prisma.promoCoupon.update({
          where: { codigo: coupon.codigo },
          data: {
            nombre: coupon.nombre,
            descripcion: coupon.descripcion,
            tipo: coupon.tipo,
            valor: coupon.valor,
            fechaInicio: coupon.fechaInicio,
            fechaExpiracion: coupon.fechaExpiracion,
            usosMaximos: coupon.usosMaximos,
            usosPorUsuario: coupon.usosPorUsuario,
            duracionMeses: coupon.duracionMeses,
            planesPermitidos: coupon.planesPermitidos,
            destacado: coupon.destacado,
            notas: coupon.notas,
          },
        });
        console.log(`✏️  Actualizado: ${coupon.codigo} - ${coupon.nombre}`);
        updated++;
      } else {
        // Crear nuevo
        await prisma.promoCoupon.create({
          data: {
            codigo: coupon.codigo,
            nombre: coupon.nombre,
            descripcion: coupon.descripcion,
            tipo: coupon.tipo,
            valor: coupon.valor,
            fechaInicio: coupon.fechaInicio,
            fechaExpiracion: coupon.fechaExpiracion,
            usosMaximos: coupon.usosMaximos,
            usosPorUsuario: coupon.usosPorUsuario,
            duracionMeses: coupon.duracionMeses,
            planesPermitidos: coupon.planesPermitidos,
            destacado: coupon.destacado,
            notas: coupon.notas,
            estado: 'ACTIVE',
            activo: true,
          },
        });
        console.log(`✅ Creado: ${coupon.codigo} - ${coupon.nombre} (${coupon.valor}% off)`);
        created++;
      }
    } catch (error: any) {
      console.error(`❌ Error con cupón ${coupon.codigo}:`, error.message);
      skipped++;
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   ✅ Creados: ${created}`);
  console.log(`   ✏️  Actualizados: ${updated}`);
  console.log(`   ⚠️  Errores: ${skipped}`);
  console.log(`   📦 Total procesados: ${LANDING_COUPONS.length}`);
}

async function main() {
  try {
    await seedCoupons();
    console.log('\n✅ Cupones cargados correctamente');
  } catch (error) {
    console.error('\n❌ Error general:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
