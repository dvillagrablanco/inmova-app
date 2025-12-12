#!/usr/bin/env tsx
/**
 * Script de Optimización de Base de Datos
 * 
 * Este script ejecuta tareas de mantenimiento y optimización:
 * 1. VACUUM para recuperar espacio
 * 2. ANALYZE para actualizar estadísticas
 * 3. REINDEX para reconstruir índices
 * 
 * ADVERTENCIA: Algunas operaciones pueden ser pesadas en bases de datos grandes.
 * 
 * Uso:
 *   yarn tsx scripts/db-optimize.ts [--vacuum] [--analyze] [--reindex]
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CliArgs {
  vacuum: boolean;
  analyze: boolean;
  reindex: boolean;
  all: boolean;
}

/**
 * Parsea los argumentos de la línea de comandos
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  
  return {
    vacuum: args.includes('--vacuum'),
    analyze: args.includes('--analyze'),
    reindex: args.includes('--reindex'),
    all: args.includes('--all') || args.length === 0,
  };
}

/**
 * Ejecuta VACUUM para recuperar espacio
 */
async function runVacuum() {
  console.log('🧹 Ejecutando VACUUM...');
  console.log('   Esto recuperará espacio de almacenamiento y optimizará el rendimiento.');
  
  try {
    // VACUUM no puede ejecutarse dentro de una transacción
    // Usar VACUUM ANALYZE para ambas operaciones
    await prisma.$executeRawUnsafe('VACUUM ANALYZE;');
    console.log('✅ VACUUM completado exitosamente');
  } catch (error: any) {
    // Si falla el VACUUM completo, intentar por tablas
    console.log('⚠️  VACUUM completo falló, intentando por tablas...');
    
    const tables = [
      'users', 'buildings', 'units', 'tenants', 'contracts',
      'payments', 'notifications', 'documents', 'tasks', 'expenses'
    ];
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`VACUUM ANALYZE "${table}";`);
        console.log(`   ✓ ${table}`);
      } catch (tableError: any) {
        console.log(`   ✗ ${table}: ${tableError.message}`);
      }
    }
  }
}

/**
 * Ejecuta ANALYZE para actualizar estadísticas
 */
async function runAnalyze() {
  console.log('📊 Ejecutando ANALYZE...');
  console.log('   Esto actualizará las estadísticas de las tablas para mejorar el optimizador de consultas.');
  
  try {
    await prisma.$executeRawUnsafe('ANALYZE;');
    console.log('✅ ANALYZE completado exitosamente');
  } catch (error: any) {
    console.error(`❌ Error en ANALYZE: ${error.message}`);
  }
}

/**
 * Ejecuta REINDEX para reconstruir índices
 */
async function runReindex() {
  console.log('🔄 Ejecutando REINDEX...');
  console.log('   ⚠️  ADVERTENCIA: Esta operación puede ser pesada y bloquear tablas temporalmente.');
  
  try {
    // REINDEX DATABASE requiere permisos especiales
    // En su lugar, reconstruimos índices de tablas importantes
    const tables = [
      'users', 'buildings', 'units', 'tenants', 'contracts',
      'payments', 'notifications'
    ];
    
    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`REINDEX TABLE "${table}";`);
        console.log(`   ✓ ${table}`);
      } catch (tableError: any) {
        console.log(`   ✗ ${table}: ${tableError.message}`);
      }
    }
    
    console.log('✅ REINDEX completado');
  } catch (error: any) {
    console.error(`❌ Error en REINDEX: ${error.message}`);
  }
}

/**
 * Muestra el uso del script
 */
function showUsage() {
  console.log('\nUso: yarn tsx scripts/db-optimize.ts [opciones]\n');
  console.log('Opciones:');
  console.log('  --vacuum   Ejecuta VACUUM para recuperar espacio');
  console.log('  --analyze  Ejecuta ANALYZE para actualizar estadísticas');
  console.log('  --reindex  Ejecuta REINDEX para reconstruir índices');
  console.log('  --all      Ejecuta todas las operaciones (por defecto)\n');
  console.log('Ejemplos:');
  console.log('  yarn tsx scripts/db-optimize.ts --vacuum');
  console.log('  yarn tsx scripts/db-optimize.ts --vacuum --analyze');
  console.log('  yarn tsx scripts/db-optimize.ts --all\n');
}

/**
 * Función principal
 */
async function main() {
  const args = parseArgs();
  
  console.log('\n' + '='.repeat(70));
  console.log('⚡ OPTIMIZACIÓN DE BASE DE DATOS');
  console.log('='.repeat(70) + '\n');
  
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showUsage();
    return;
  }
  
  try {
    const startTime = Date.now();
    
    if (args.all || args.vacuum) {
      await runVacuum();
      console.log();
    }
    
    if (args.all || args.analyze) {
      await runAnalyze();
      console.log();
    }
    
    if (args.all || args.reindex) {
      await runReindex();
      console.log();
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('='.repeat(70));
    console.log('✅ OPTIMIZACIÓN COMPLETADA');
    console.log('='.repeat(70));
    console.log(`\nTiempo total: ${duration} segundos\n`);
    
  } catch (error) {
    console.error('\n❌ Error durante la optimización:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
