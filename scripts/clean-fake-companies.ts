/**
 * Script para limpiar datos falsos de empresas de la base de datos
 * 
 * ⚠️ PELIGROSO: Este script elimina datos permanentemente
 * 
 * Uso:
 *   npx tsx scripts/clean-fake-companies.ts --dry-run   # Ver qué se eliminaría
 *   npx tsx scripts/clean-fake-companies.ts --confirm   # Ejecutar eliminación
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanFakeCompanies() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isConfirmed = args.includes('--confirm');

  if (!isDryRun && !isConfirmed) {
    console.log('⚠️  Este script elimina TODAS las empresas de la base de datos');
    console.log('');
    console.log('Uso:');
    console.log('  npx tsx scripts/clean-fake-companies.ts --dry-run   # Ver qué se eliminaría');
    console.log('  npx tsx scripts/clean-fake-companies.ts --confirm   # Ejecutar eliminación');
    console.log('');
    process.exit(1);
  }

  try {
    console.log('\n🔍 Buscando empresas en la base de datos...\n');

    // Obtener todas las empresas
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        nombre: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            buildings: true,
            tenants: true,
          }
        }
      }
    });

    if (companies.length === 0) {
      console.log('✅ No hay empresas en la base de datos.');
      return;
    }

    console.log(`📊 Empresas encontradas: ${companies.length}`);
    console.log('');
    console.log('┌────────────────────────────────────────────┬──────────┬───────────┬───────────┐');
    console.log('│ Nombre                                     │ Usuarios │ Edificios │ Inquilinos│');
    console.log('├────────────────────────────────────────────┼──────────┼───────────┼───────────┤');
    
    for (const company of companies) {
      const nombre = company.nombre.substring(0, 40).padEnd(42);
      const users = company._count.users.toString().padStart(8);
      const buildings = company._count.buildings.toString().padStart(9);
      const tenants = company._count.tenants.toString().padStart(10);
      console.log(`│ ${nombre} │ ${users} │ ${buildings} │ ${tenants}│`);
    }
    
    console.log('└────────────────────────────────────────────┴──────────┴───────────┴───────────┘');

    if (isDryRun) {
      console.log('\n🔍 Modo DRY-RUN: No se eliminará nada.');
      console.log('   Para ejecutar la eliminación, usa: --confirm');
      return;
    }

    console.log('\n⚠️  ELIMINANDO DATOS...\n');

    // Orden de eliminación por dependencias (de más dependiente a menos)
    const deletionOrder = [
      { model: 'payment', label: 'Pagos' },
      { model: 'maintenanceRequest', label: 'Solicitudes de Mantenimiento' },
      { model: 'incidence', label: 'Incidencias' },
      { model: 'contract', label: 'Contratos' },
      { model: 'candidate', label: 'Candidatos' },
      { model: 'tenant', label: 'Inquilinos' },
      { model: 'unit', label: 'Unidades' },
      { model: 'building', label: 'Edificios' },
      { model: 'provider', label: 'Proveedores' },
      { model: 'activity', label: 'Actividades' },
      { model: 'task', label: 'Tareas' },
      { model: 'moduleCompany', label: 'Módulos de Empresas' },
      { model: 'user', label: 'Usuarios (excepto super_admin)' },
      { model: 'company', label: 'Empresas' },
    ];

    for (const { model, label } of deletionOrder) {
      try {
        // @ts-ignore - Acceso dinámico al modelo
        const prismaModel = prisma[model];
        if (prismaModel && typeof prismaModel.deleteMany === 'function') {
          // Para usuarios, mantener super_admin
          if (model === 'user') {
            const result = await prismaModel.deleteMany({
              where: {
                role: { not: 'super_admin' }
              }
            });
            console.log(`  ✅ ${label}: ${result.count} eliminados`);
          } else {
            const result = await prismaModel.deleteMany({});
            console.log(`  ✅ ${label}: ${result.count} eliminados`);
          }
        }
      } catch (error: any) {
        // Algunos modelos pueden no existir o tener restricciones
        if (!error.message.includes('does not exist')) {
          console.log(`  ⚠️  ${label}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Limpieza completada.');
    console.log('');
    console.log('📝 Notas:');
    console.log('   - Los usuarios super_admin se han mantenido');
    console.log('   - La base de datos está lista para datos reales');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanFakeCompanies();
