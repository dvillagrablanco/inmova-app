/**
 * Script para inicializar cupones promocionales
 * Campañas de Estrategia de Lanzamiento 2025
 * 
 * Uso: npx tsx scripts/init-promo-coupons.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PROMO_CAMPAIGNS } from '../lib/pricing-config';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

// ID de la empresa principal (ajustar según tu base de datos)
const MAIN_COMPANY_ID = 'sistema'; // o el ID que uses para cupones globales
const CREATED_BY = 'sistema'; // Usuario que crea los cupones

async function main() {
  console.log('🎉 Inicializando cupones promocionales INMOVA...');
  console.log('Estrategia de Lanzamiento 2025\n');

  for (const [key, campaign] of Object.entries(PROMO_CAMPAIGNS)) {
    console.log(`🎫 Procesando campaña: ${campaign.name} (${campaign.code})`);

    try {
      // Buscar si ya existe el cupón
      const existingCoupon = await prisma.discountCoupon.findFirst({
        where: {
          codigo: campaign.code
        }
      });

      const couponData = {
        companyId: MAIN_COMPANY_ID,
        codigo: campaign.code,
        tipo: campaign.discountType === 'percentage' ? 'percentage' as const : 'fixed_amount' as const,
        valor: campaign.discountValue,
        descripcion: `${campaign.name} - ${campaign.description}\n\n${campaign.message}`,
        
        // Límites
        usosMaximos: campaign.maxUses || null,
        usosActuales: 0,
        usosPorUsuario: 1,
        montoMinimo: null,
        
        // Vigencia
        fechaInicio: campaign.validFrom,
        fechaExpiracion: campaign.validUntil,
        
        // Restricciones
        aplicaATodos: true,
        unidadesPermitidas: [],
        planesPermitidos: [campaign.targetPlan],
        
        // Estado
        estado: 'activo' as const,
        activo: true,
        
        // Metadata
        creadoPor: CREATED_BY,
      };

      if (existingCoupon) {
        // Actualizar cupón existente
        const updated = await prisma.discountCoupon.update({
          where: { id: existingCoupon.id },
          data: couponData
        });
        console.log(`   ✅ Cupón actualizado: ${updated.codigo}`);
        console.log(`      Tipo: ${updated.tipo} - Valor: ${updated.valor}${updated.tipo === 'percentage' ? '%' : '€'}`);
        console.log(`      Vigencia: ${updated.fechaInicio.toLocaleDateString()} - ${updated.fechaExpiracion.toLocaleDateString()}`);
      } else {
        // Crear nuevo cupón
        const created = await prisma.discountCoupon.create({
          data: couponData
        });
        console.log(`   ✨ Cupón creado: ${created.codigo}`);
        console.log(`      Tipo: ${created.tipo} - Valor: ${created.valor}${created.tipo === 'percentage' ? '%' : '€'}`);
        console.log(`      Vigencia: ${created.fechaInicio.toLocaleDateString()} - ${created.fechaExpiracion.toLocaleDateString()}`);
        if (created.usosMaximos) {
          console.log(`      Usos máximos: ${created.usosMaximos}`);
        }
      }
      console.log();

    } catch (error) {
      console.error(`   ❌ Error procesando campaña ${campaign.name}:`, error);
    }
  }

  // Mostrar resumen
  console.log('\n📊 Resumen de cupones promocionales:');
  const allCoupons = await prisma.discountCoupon.findMany({
    where: {
      codigo: {
        in: Object.values(PROMO_CAMPAIGNS).map(c => c.code)
      }
    },
    include: {
      _count: {
        select: {
          usos: true
        }
      }
    },
    orderBy: { fechaInicio: 'asc' },
  });

  console.table(allCoupons.map(c => ({
    Código: c.codigo,
    Tipo: c.tipo,
    Valor: `${c.valor}${c.tipo === 'percentage' ? '%' : '€'}`,
    'Usos': `${c.usosActuales}/${c.usosMaximos || '∞'}`,
    Vigencia: `${c.fechaInicio.toLocaleDateString()} - ${c.fechaExpiracion.toLocaleDateString()}`,
    Estado: c.activo ? '✅ Activo' : '❌ Inactivo'
  })));

  console.log('\n✅ Inicialización de cupones completada!');
  console.log('\n📝 Instrucciones de uso:');
  console.log('1. Los usuarios pueden aplicar estos códigos durante el proceso de suscripción');
  console.log('2. El sistema validará automáticamente la vigencia y límites de uso');
  console.log('3. Monitorea las estadísticas en el panel de administración');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
