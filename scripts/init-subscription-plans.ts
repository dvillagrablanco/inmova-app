/**
 * Script para inicializar planes de suscripción en la base de datos
 * Estrategia de Precios 2025
 * 
 * Uso: npx tsx scripts/init-subscription-plans.ts
 */

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PRICING_PLANS } from '../lib/pricing-config';

// Cargar variables de entorno
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Inicializando planes de suscripción INMOVA...');
  console.log('Estrategia de Precios 2025\n');

  for (const [key, plan] of Object.entries(PRICING_PLANS)) {
    console.log(`💳 Procesando plan: ${plan.name}`);

    try {
      // Buscar si ya existe el plan
      const existingPlan = await prisma.subscriptionPlan.findFirst({
        where: {
          tier: plan.tier
        }
      });

      const planData = {
        nombre: plan.name,
        tier: plan.tier,
        descripcion: plan.description,
        precioMensual: plan.monthlyPrice,
        maxUsuarios: typeof plan.maxUsers === 'number' ? plan.maxUsers : 999,
        maxPropiedades: typeof plan.maxProperties === 'number' ? plan.maxProperties : 999999,
        modulosIncluidos: plan.features
          .filter(f => f.included)
          .map(f => f.text),
        activo: true,
      };

      if (existingPlan) {
        // Actualizar plan existente
        const updated = await prisma.subscriptionPlan.update({
          where: { id: existingPlan.id },
          data: planData
        });
        console.log(`   ✅ Plan actualizado: ${updated.nombre} - €${updated.precioMensual}/mes`);
      } else {
        // Crear nuevo plan
        const created = await prisma.subscriptionPlan.create({
          data: planData
        });
        console.log(`   ✨ Plan creado: ${created.nombre} - €${created.precioMensual}/mes`);
      }

    } catch (error) {
      console.error(`   ❌ Error procesando plan ${plan.name}:`, error);
    }
  }

  // Mostrar resumen
  console.log('\n📊 Resumen de planes:');
  const allPlans = await prisma.subscriptionPlan.findMany({
    orderBy: { precioMensual: 'asc' },
    include: {
      _count: {
        select: {
          companies: true
        }
      }
    }
  });

  console.table(allPlans.map(p => ({
    Nombre: p.nombre,
    Tier: p.tier,
    'Precio/mes': `€${p.precioMensual}`,
    'Máx Usuarios': p.maxUsuarios,
    'Máx Propiedades': p.maxPropiedades,
    'Empresas': p._count.companies,
    Activo: p.activo ? '✅' : '❌'
  })));

  console.log('\n✅ Inicialización completada!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
