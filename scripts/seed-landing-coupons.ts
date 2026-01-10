/**
 * Seed script para cargar los cupones de la landing en la base de datos
 * 
 * Ejecutar: npx tsx scripts/seed-landing-coupons.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cupones de la landing de INMOVA
const LANDING_COUPONS = [
  {
    codigo: 'LAUNCH2025',
    nombre: 'Campaña Lanzamiento 2025',
    descripcion: '50% de descuento en el primer mes para nuevos usuarios',
    tipo: 'PERCENTAGE' as const,
    valor: 50,
    fechaInicio: new Date('2025-01-01'),
    fechaExpiracion: new Date('2026-03-31'),
    usosMaximos: 500,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: true,
    estado: 'ACTIVE' as const,
  },
  {
    codigo: 'LAUNCH2026',
    nombre: 'Campaña Lanzamiento 2026',
    descripcion: '50% de descuento en el primer mes - Nueva campaña',
    tipo: 'PERCENTAGE' as const,
    valor: 50,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-06-30'),
    usosMaximos: 150,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: true,
    estado: 'ACTIVE' as const,
  },
  {
    codigo: 'STARTER26',
    nombre: 'Descuento Plan Starter',
    descripcion: 'Oferta especial para el plan Starter',
    tipo: 'PERCENTAGE' as const,
    valor: 30,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-12-31'),
    usosMaximos: null,
    usosPorUsuario: 1,
    duracionMeses: 3,
    planesPermitidos: ['STARTER'],
    destacado: false,
    estado: 'ACTIVE' as const,
  },
  {
    codigo: 'COLIVING26',
    nombre: 'Descuento Coliving',
    descripcion: 'Oferta especial para gestores de coliving',
    tipo: 'PERCENTAGE' as const,
    valor: 25,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-12-31'),
    usosMaximos: null,
    usosPorUsuario: 1,
    duracionMeses: 3,
    planesPermitidos: ['PROFESSIONAL', 'BUSINESS'],
    destacado: false,
    estado: 'ACTIVE' as const,
  },
  {
    codigo: 'COLIVING50',
    nombre: 'Coliving 50% Off',
    descripcion: '50% de descuento adicional para módulo coliving',
    tipo: 'PERCENTAGE' as const,
    valor: 50,
    fechaInicio: new Date('2026-01-01'),
    fechaExpiracion: new Date('2026-12-31'),
    usosMaximos: 100,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: ['PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: true,
    estado: 'ACTIVE' as const,
  },
  {
    codigo: 'WELCOME25',
    nombre: 'Bienvenida 25%',
    descripcion: '25% de descuento de bienvenida para nuevos usuarios',
    tipo: 'PERCENTAGE' as const,
    valor: 25,
    fechaInicio: new Date('2025-01-01'),
    fechaExpiracion: new Date('2026-12-31'),
    usosMaximos: null,
    usosPorUsuario: 1,
    duracionMeses: 1,
    planesPermitidos: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: false,
    estado: 'ACTIVE' as const,
  },
  {
    codigo: 'TEST',
    nombre: 'Cupón de Prueba',
    descripcion: 'Cupón para testing interno - 100% descuento',
    tipo: 'PERCENTAGE' as const,
    valor: 100,
    fechaInicio: new Date('2025-01-01'),
    fechaExpiracion: new Date('2030-12-31'),
    usosMaximos: null,
    usosPorUsuario: 999,
    duracionMeses: 12,
    planesPermitidos: ['STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'],
    destacado: false,
    estado: 'ACTIVE' as const,
    notas: 'Solo para uso interno de desarrollo y testing',
  },
];

async function main() {
  console.log('🎟️ Cargando cupones de la landing...\n');

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const coupon of LANDING_COUPONS) {
    try {
      // Verificar si ya existe
      const existing = await prisma.promoCoupon.findUnique({
        where: { codigo: coupon.codigo },
      });

      if (existing) {
        console.log(`⏭️  ${coupon.codigo} - Ya existe, omitiendo`);
        skipped++;
        continue;
      }

      // Crear cupón
      await prisma.promoCoupon.create({
        data: {
          ...coupon,
          activo: true,
        },
      });

      console.log(`✅ ${coupon.codigo} - Creado (${coupon.valor}% off)`);
      created++;
    } catch (error: any) {
      console.error(`❌ ${coupon.codigo} - Error: ${error.message}`);
      errors++;
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   Creados: ${created}`);
  console.log(`   Omitidos: ${skipped}`);
  console.log(`   Errores: ${errors}`);
  console.log('\n✅ Proceso completado');
}

main()
  .catch((e) => {
    console.error('Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
