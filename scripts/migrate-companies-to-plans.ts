/**
 * Script para asignar planes a todas las empresas existentes
 * Antes de hacer subscriptionPlanId obligatorio
 * Ejecutar: npx tsx scripts/migrate-companies-to-plans.ts
 */

import prisma from '../lib/db';

async function main() {
  console.log('🔄 MIGRACIÓN: Asignar planes a empresas existentes\n');
  console.log('='.repeat(60));

  try {
    // Obtener plan Basic como default
    const basicPlan = await prisma.subscriptionPlan.findFirst({
      where: { nombre: 'Basic' }
    });

    if (!basicPlan) {
      console.error('❌ Plan Basic no encontrado. Ejecuta primero: npx tsx scripts/seed-subscription-plans.ts');
      process.exit(1);
    }

    console.log(`\n✅ Plan Basic encontrado: ${basicPlan.id}`);

    // Buscar empresas sin plan asignado
    const companiesWithoutPlan = await prisma.company.findMany({
      where: {
        subscriptionPlanId: null
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        _count: {
          select: {
            users: true,
            properties: true
          }
        }
      }
    });

    if (companiesWithoutPlan.length === 0) {
      console.log('\n✅ Todas las empresas ya tienen un plan asignado.\n');
      return;
    }

    console.log(`\n📋 Encontradas ${companiesWithoutPlan.length} empresas sin plan:\n`);

    let updated = 0;
    let errors = 0;

    for (const company of companiesWithoutPlan) {
      try {
        // Determinar el plan adecuado según el número de propiedades
        let planId = basicPlan.id;
        let planName = 'Basic';

        if (company._count.properties > 25) {
          // Buscar plan Business
          const businessPlan = await prisma.subscriptionPlan.findFirst({
            where: { nombre: 'Business' }
          });
          if (businessPlan) {
            planId = businessPlan.id;
            planName = 'Business';
          }
        } else if (company._count.properties > 5) {
          // Buscar plan Professional
          const professionalPlan = await prisma.subscriptionPlan.findFirst({
            where: { nombre: 'Professional' }
          });
          if (professionalPlan) {
            planId = professionalPlan.id;
            planName = 'Professional';
          }
        }

        // Actualizar empresa
        await prisma.company.update({
          where: { id: company.id },
          data: { subscriptionPlanId: planId }
        });

        console.log(`  ✅ ${company.nombre} → ${planName} (${company._count.properties} propiedades)`);
        updated++;

      } catch (error: any) {
        console.error(`  ❌ Error actualizando ${company.nombre}:`, error.message);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN:');
    console.log(`  • Empresas actualizadas: ${updated}`);
    console.log(`  • Errores: ${errors}`);
    console.log(`  • Total procesadas: ${companiesWithoutPlan.length}`);
    console.log('');

    if (updated === companiesWithoutPlan.length) {
      console.log('✅ Todas las empresas tienen ahora un plan asignado!');
      console.log('');
      console.log('⚠️  Siguiente paso: Hacer subscriptionPlanId obligatorio en schema.prisma');
      console.log('   1. Cambiar: subscriptionPlanId String? → subscriptionPlanId String');
      console.log('   2. Ejecutar: npx prisma migrate dev --name make_plan_required');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
