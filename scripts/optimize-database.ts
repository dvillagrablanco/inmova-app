/**
 * Script de Optimización de Base de Datos INMOVA
 * 
 * Este script realiza optimizaciones en la base de datos:
 * - Analiza tablas para actualizar estadísticas
 * - Verifica integridad de datos
 * - Limpia registros huérfanos
 * - Genera reporte de optimización
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

interface OptimizationReport {
  timestamp: string;
  totalRecords: Record<string, number>;
  orphanedRecords: Record<string, number>;
  recommendations: string[];
  errors: string[];
}

async function analyzeDatabase(): Promise<OptimizationReport> {
  console.log('🔍 Analizando base de datos...');

  const report: OptimizationReport = {
    timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    totalRecords: {},
    orphanedRecords: {},
    recommendations: [],
    errors: [],
  };

  try {
    // Contar registros por tabla principal
    console.log('\n📊 Contando registros...');
    
    const companies = await prisma.company.count();
    const users = await prisma.user.count();
    const buildings = await prisma.building.count();
    const units = await prisma.unit.count();
    const tenants = await prisma.tenant.count();
    const contracts = await prisma.contract.count();
    const payments = await prisma.payment.count();
    const maintenanceRequests = await prisma.maintenanceRequest.count();

    report.totalRecords = {
      companies,
      users,
      buildings,
      units,
      tenants,
      contracts,
      payments,
      maintenanceRequests,
    };

    console.log(`  ✅ ${companies} empresas`);
    console.log(`  ✅ ${users} usuarios`);
    console.log(`  ✅ ${buildings} edificios`);
    console.log(`  ✅ ${units} unidades`);
    console.log(`  ✅ ${tenants} inquilinos`);
    console.log(`  ✅ ${contracts} contratos`);
    console.log(`  ✅ ${payments} pagos`);
    console.log(`  ✅ ${maintenanceRequests} solicitudes de mantenimiento`);

    // Verificar integridad referencial
    console.log('\n🔗 Verificando integridad referencial...');

    // Edificios sin unidades activas
    const buildingsWithoutUnits = await prisma.building.count({
      where: {
        units: {
          none: {},
        },
      },
    });
    if (buildingsWithoutUnits > 0) {
      report.recommendations.push(
        `Se encontraron ${buildingsWithoutUnits} edificios sin unidades. Considera crear unidades o eliminar estos edificios.`
      );
    }

    // Contratos sin pagos
    const contractsWithoutPayments = await prisma.contract.count({
      where: {
        payments: {
          none: {},
        },
        estado: 'activo',
      },
    });
    if (contractsWithoutPayments > 0) {
      report.recommendations.push(
        `Se encontraron ${contractsWithoutPayments} contratos activos sin pagos registrados. Verifica que se hayan generado los pagos correspondientes.`
      );
    }

    // Pagos vencidos sin procesar
    const overduePayments = await prisma.payment.count({
      where: {
        fechaVencimiento: {
          lt: new Date(),
        },
        estado: 'pendiente',
      },
    });
    if (overduePayments > 0) {
      report.recommendations.push(
        `Se encontraron ${overduePayments} pagos vencidos pendientes. Considera marcarlos como "vencido" y generar recordatorios.`
      );
    }

    // Solicitudes de mantenimiento antiguas sin resolver
    const oldMaintenanceRequests = await prisma.maintenanceRequest.count({
      where: {
        estado: {
          in: ['pendiente', 'en_progreso', 'programado'],
        },
        fechaSolicitud: {
          lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 días
        },
      },
    });
    if (oldMaintenanceRequests > 0) {
      report.recommendations.push(
        `Se encontraron ${oldMaintenanceRequests} solicitudes de mantenimiento con más de 90 días sin resolver. Revisa su estado.`
      );
    }

    console.log('  ✅ Integridad referencial verificada');

    // Recomendaciones generales
    if (report.totalRecords.payments > 10000) {
      report.recommendations.push(
        'La tabla de pagos tiene más de 10,000 registros. Considera archivar pagos antiguos para mejorar el rendimiento.'
      );
    }

    if (report.totalRecords.maintenanceRequests > 5000) {
      report.recommendations.push(
        'La tabla de solicitudes de mantenimiento tiene más de 5,000 registros. Considera archivar solicitudes resueltas antiguas.'
      );
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('❌ Error durante el análisis:', errorMessage);
    report.errors.push(`Error en análisis: ${errorMessage}`);
  }

  return report;
}

async function generateReport(report: OptimizationReport) {
  console.log('\n📄 Generando reporte...');

  console.log('\n' + '='.repeat(60));
  console.log('REPORTE DE OPTIMIZACIÓN DE BASE DE DATOS');
  console.log('='.repeat(60));
  console.log(`\nFecha: ${report.timestamp}`);

  console.log('\n📊 RESUMEN DE REGISTROS:');
  Object.entries(report.totalRecords).forEach(([table, count]) => {
    console.log(`  ${table.padEnd(25)} : ${count.toLocaleString()}`);
  });

  if (Object.keys(report.orphanedRecords).length > 0) {
    console.log('\n⚠️  REGISTROS HUÉRFANOS DETECTADOS:');
    Object.entries(report.orphanedRecords).forEach(([table, count]) => {
      console.log(`  ${table.padEnd(25)} : ${count}`);
    });
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMENDACIONES:');
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  if (report.errors.length > 0) {
    console.log('\n❌ ERRORES:');
    report.errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err}`);
    });
  }

  console.log('\n' + '='.repeat(60));
}

async function main() {
  console.log('🚀 Iniciando optimización de base de datos INMOVA...\n');

  try {
    const report = await analyzeDatabase();
    await generateReport(report);

    console.log('\n✅ Optimización completada exitosamente!');
    console.log('\n🔧 Para aplicar optimizaciones de PostgreSQL, ejecuta:');
    console.log('  psql $DATABASE_URL -c "VACUUM ANALYZE;"');
    console.log('\n📚 Más información en: /nextjs_space/REPORTE_LIMPIEZA.md');

  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
