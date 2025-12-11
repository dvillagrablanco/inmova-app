import { prisma } from '../lib/db';
import { CouponType, CouponStatus } from '@prisma/client';

/**
 * Script para crear los cupones promocionales LAUNCH2025 y COLIVING50
 * 
 * Ejecutar con: yarn tsx scripts/create-promo-coupons.ts
 */

async function createPromoCoupons() {
  console.log('▶️ Iniciando creación de cupones promocionales...');

  try {
    // Obtener todas las empresas existentes
    const companies = await prisma.company.findMany({
      select: { id: true, nombre: true }
    });

    if (companies.length === 0) {
      console.log('⚠️  No hay empresas registradas. Los cupones se crearán cuando se registren empresas.');
      return;
    }

    console.log(`🏫 Encontradas ${companies.length} empresas`);

    // Fechas de vigencia
    const fechaInicio = new Date('2025-01-01T00:00:00Z');
    const fechaExpiracionLaunch = new Date('2025-03-31T23:59:59Z'); // Q1 2025
    const fechaExpiracionColiving = new Date('2025-12-31T23:59:59Z'); // Todo 2025

    let createdCount = 0;
    let skippedCount = 0;

    // Para cada empresa, crear los cupones
    for (const company of companies) {
      console.log(`\n🏪 Procesando empresa: ${company.nombre}`);

      // Cupón LAUNCH2025 - 50% descuento primer mes
      const existingLaunch = await prisma.discountCoupon.findFirst({
        where: {
          companyId: company.id,
          codigo: 'LAUNCH2025'
        }
      });

      if (!existingLaunch) {
        await prisma.discountCoupon.create({
          data: {
            companyId: company.id,
            codigo: 'LAUNCH2025',
            tipo: 'PERCENTAGE' as CouponType,
            valor: 50, // 50% de descuento
            descripcion: 'Campaña de Lanzamiento Q1 2025 - 50% de descuento en el primer mes. Oferta válida hasta el 31 de marzo de 2025.',
            usosMaximos: 100, // Objetivo de 100 clientes en Q1
            usosActuales: 0,
            usosPorUsuario: 1, // Solo 1 vez por usuario
            montoMinimo: 0, // Sin mínimo
            fechaInicio,
            fechaExpiracion: fechaExpiracionLaunch,
            aplicaATodos: true,
            unidadesPermitidas: [],
            planesPermitidos: [], // Aplica a todos los planes
            estado: 'activo' as CouponStatus,
            activo: true,
            creadoPor: 'SYSTEM_PROMO'
          }
        });
        console.log('  ✅ Cupón LAUNCH2025 creado');
        createdCount++;
      } else {
        console.log('  ⏭️  Cupón LAUNCH2025 ya existe');
        skippedCount++;
      }

      // Cupón COLIVING50 - 50% descuento anual para gestores de coliving
      const existingColiving = await prisma.discountCoupon.findFirst({
        where: {
          companyId: company.id,
          codigo: 'COLIVING50'
        }
      });

      if (!existingColiving) {
        await prisma.discountCoupon.create({
          data: {
            companyId: company.id,
            codigo: 'COLIVING50',
            tipo: 'PERCENTAGE' as CouponType,
            valor: 50, // 50% de descuento
            descripcion: 'Descuento especial para gestores de Coliving - 50% en suscripción anual. Válido todo 2025.',
            usosMaximos: 50, // Nicho específico de coliving
            usosActuales: 0,
            usosPorUsuario: 1,
            montoMinimo: 0,
            fechaInicio,
            fechaExpiracion: fechaExpiracionColiving,
            aplicaATodos: true,
            unidadesPermitidas: [],
            planesPermitidos: [], // Aplica a planes con pago anual
            estado: 'activo' as CouponStatus,
            activo: true,
            creadoPor: 'SYSTEM_PROMO'
          }
        });
        console.log('  ✅ Cupón COLIVING50 creado');
        createdCount++;
      } else {
        console.log('  ⏭️  Cupón COLIVING50 ya existe');
        skippedCount++;
      }
    }

    console.log('\n🎉 Proceso completado!');
    console.log(`✅ Cupones creados: ${createdCount}`);
    console.log(`⏭️  Cupones omitidos (ya existían): ${skippedCount}`);
    
    // Mostrar resumen de cupones activos
    console.log('\n📋 Resumen de cupones activos:');
    const activeCoupons = await prisma.discountCoupon.findMany({
      where: {
        activo: true,
        codigo: { in: ['LAUNCH2025', 'COLIVING50'] }
      },
      include: {
        company: { select: { nombre: true } }
      }
    });

    for (const coupon of activeCoupons) {
      console.log(`\n  Código: ${coupon.codigo}`);
      console.log(`  Empresa: ${coupon.company.nombre}`);
      console.log(`  Descuento: ${coupon.valor}%`);
      console.log(`  Usos: ${coupon.usosActuales}/${coupon.usosMaximos || '∞'}`);
      console.log(`  Válido hasta: ${coupon.fechaExpiracion.toLocaleDateString('es-ES')}`);
    }

  } catch (error) {
    console.error('❌ Error creando cupones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
createPromoCoupons()
  .then(() => {
    console.log('\n✅ Script ejecutado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en el script:', error);
    process.exit(1);
  });
