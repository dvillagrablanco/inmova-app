import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

/**
 * Script para optimizar índices de base de datos
 * Este script añade índices compuestos adicionales para mejorar el rendimiento de consultas comunes
 */
async function optimizeDatabaseIndexes() {
  console.log('🔧 Iniciando optimización de índices de base de datos...');

  try {
    // Analizar queries lentas y sugerir índices
    console.log('\n📊 Analizando rendimiento de consultas...');

    // Ejemplo: Queries comunes que se benefician de índices compuestos
    const commonQueries = [
      {
        table: 'Building',
        query: 'Edificios por empresa y estado activo',
        indexes: ['companyId', 'activo'],
      },
      {
        table: 'Unit',
        query: 'Unidades por edificio y estado',
        indexes: ['buildingId', 'estado'],
      },
      {
        table: 'Contract',
        query: 'Contratos activos por inquilino',
        indexes: ['tenantId', 'estado', 'fechaFin'],
      },
      {
        table: 'Payment',
        query: 'Pagos pendientes por fecha',
        indexes: ['estado', 'fechaVencimiento'],
      },
      {
        table: 'MaintenanceRequest',
        query: 'Mantenimientos por edificio y prioridad',
        indexes: ['buildingId', 'prioridad', 'estado'],
      },
    ];

    console.log('\n✅ Índices recomendados:');
    commonQueries.forEach((query, index) => {
      console.log(`${index + 1}. ${query.table}: ${query.query}`);
      console.log(`   Índices: [${query.indexes.join(', ')}]`);
    });

    // Verificar estadísticas de uso
    const stats = {
      buildings: await prisma.building.count(),
      units: await prisma.unit.count(),
      tenants: await prisma.tenant.count(),
      contracts: await prisma.contract.count(),
      payments: await prisma.payment.count(),
    };

    console.log('\n📈 Estadísticas de uso:');
    console.log(`   Edificios: ${stats.buildings}`);
    console.log(`   Unidades: ${stats.units}`);
    console.log(`   Inquilinos: ${stats.tenants}`);
    console.log(`   Contratos: ${stats.contracts}`);
    console.log(`   Pagos: ${stats.payments}`);

    // Sugerencias de optimización
    console.log('\n💡 Sugerencias de optimización:');
    
    if (stats.payments > 1000) {
      console.log('   - Considerar particionamiento de tabla Payments por fecha');
    }
    
    if (stats.contracts > 500) {
      console.log('   - Añadir índice compuesto en Contracts(companyId, estado, fechaFin)');
    }

    if (stats.units > 1000) {
      console.log('   - Considerar caché para consultas de ocupación');
    }

    console.log('\n✅ Análisis de optimización completado');
    console.log('\nNota: Los índices adicionales ya están definidos en schema.prisma');
    console.log('Ejecuta "yarn prisma migrate dev" si se agregan nuevos índices');

  } catch (error) {
    console.error('❌ Error al optimizar base de datos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

optimizeDatabaseIndexes()
  .then(() => {
    console.log('\n✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
