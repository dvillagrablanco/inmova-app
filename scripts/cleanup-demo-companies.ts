/**
 * Script para limpiar empresas demo/test/fake
 * Ejecutar: npx tsx scripts/cleanup-demo-companies.ts
 */

import prisma from '../lib/db';

const DEMO_KEYWORDS = [
  'test',
  'demo',
  'prueba',
  'ejemplo',
  'fake',
  'sample',
  'acme',
  'foo',
  'bar',
  'empresa test',
  'company test'
];

async function findDemoCompanies() {
  console.log('🔍 Buscando empresas demo/test...\n');

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      nombre: true,
      email: true,
      createdAt: true,
      subscriptionPlanId: true,
      _count: {
        select: {
          users: true,
          buildings: true,
          properties: true,
          tenants: true,
          contracts: true
        }
      }
    }
  });

  const demoCompanies = companies.filter(company => {
    const nombre = company.nombre.toLowerCase();
    const email = company.email?.toLowerCase() || '';
    
    return DEMO_KEYWORDS.some(keyword => 
      nombre.includes(keyword) || email.includes(keyword)
    );
  });

  return demoCompanies;
}

async function main() {
  console.log('🧹 LIMPIEZA DE EMPRESAS DEMO/TEST\n');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Buscar empresas demo
    const demoCompanies = await findDemoCompanies();

    if (demoCompanies.length === 0) {
      console.log('✅ No se encontraron empresas demo/test para eliminar.\n');
      return;
    }

    console.log(`📋 Se encontraron ${demoCompanies.length} empresas que parecen demo/test:\n`);

    demoCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.nombre}`);
      console.log(`   Email: ${company.email || 'N/A'}`);
      console.log(`   Usuarios: ${company._count.users}`);
      console.log(`   Edificios: ${company._count.buildings}`);
      console.log(`   Propiedades: ${company._count.properties}`);
      console.log(`   Inquilinos: ${company._count.tenants}`);
      console.log(`   Contratos: ${company._count.contracts}`);
      console.log(`   Creada: ${company.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    // Confirmar eliminación
    console.log('⚠️  ¿Deseas eliminar estas empresas? [Ejecutando sin confirmación]\n');

    let deletedCount = 0;

    for (const company of demoCompanies) {
      try {
        // Prisma manejará las eliminaciones en cascada según el schema
        await prisma.company.delete({
          where: { id: company.id }
        });

        console.log(`✅ Eliminada: ${company.nombre}`);
        deletedCount++;
      } catch (error: any) {
        console.error(`❌ Error eliminando ${company.nombre}:`, error.message);
      }
    }

    console.log('');
    console.log('='.repeat(50));
    console.log(`📊 Resumen:`);
    console.log(`   • Empresas encontradas: ${demoCompanies.length}`);
    console.log(`   • Empresas eliminadas: ${deletedCount}`);
    console.log(`   • Errores: ${demoCompanies.length - deletedCount}`);
    console.log('');
    console.log('✅ Limpieza completada!\n');

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
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
