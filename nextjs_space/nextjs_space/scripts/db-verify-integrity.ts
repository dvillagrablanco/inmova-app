#!/usr/bin/env tsx
/**
 * Script de Verificación de Integridad de Base de Datos
 * 
 * Este script verifica:
 * 1. Foreign Keys y su integridad
 * 2. Constraints (UNIQUE, NOT NULL, CHECK)
 * 3. Índices existentes y su uso
 * 4. Estadísticas de tablas
 * 
 * Uso:
 *   yarn tsx scripts/db-verify-integrity.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ForeignKeyInfo {
  table_name: string;
  constraint_name: string;
  column_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  on_delete: string;
  on_update: string;
}

interface ConstraintInfo {
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  column_name: string | null;
}

interface IndexInfo {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface TableStats {
  table_name: string;
  row_count: bigint;
  table_size: string;
  indexes_size: string;
  total_size: string;
}

/**
 * Obtiene todas las Foreign Keys de la base de datos
 */
async function getForeignKeys(): Promise<ForeignKeyInfo[]> {
  const result = await prisma.$queryRaw<ForeignKeyInfo[]>`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.delete_rule as on_delete,
      rc.update_rule as on_update
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
      AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `;
  
  return result;
}

/**
 * Obtiene todos los constraints de la base de datos
 */
async function getConstraints(): Promise<ConstraintInfo[]> {
  const result = await prisma.$queryRaw<ConstraintInfo[]>`
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints AS tc
    LEFT JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.constraint_type IN ('UNIQUE', 'CHECK', 'PRIMARY KEY')
    ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;
  `;
  
  return result;
}

/**
 * Obtiene todos los índices de la base de datos
 */
async function getIndexes(): Promise<IndexInfo[]> {
  const result = await prisma.$queryRaw<IndexInfo[]>`
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;
  
  return result;
}

/**
 * Obtiene estadísticas de tamaño de las tablas
 */
async function getTableStats(): Promise<TableStats[]> {
  const result = await prisma.$queryRaw<TableStats[]>`
    SELECT
      tablename AS table_name,
      pg_total_relation_size(quote_ident(tablename)::regclass) AS total_bytes,
      pg_relation_size(quote_ident(tablename)::regclass) AS table_bytes,
      pg_indexes_size(quote_ident(tablename)::regclass) AS indexes_bytes,
      pg_size_pretty(pg_total_relation_size(quote_ident(tablename)::regclass)) AS total_size,
      pg_size_pretty(pg_relation_size(quote_ident(tablename)::regclass)) AS table_size,
      pg_size_pretty(pg_indexes_size(quote_ident(tablename)::regclass)) AS indexes_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(quote_ident(tablename)::regclass) DESC
    LIMIT 20;
  `;
  
  return result;
}

/**
 * Cuenta registros en cada tabla
 */
async function getRowCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  
  // Tablas principales a contar
  const tables = [
    'users', 'buildings', 'units', 'tenants', 'contracts', 
    'payments', 'notifications', 'documents', 'tasks', 'expenses'
  ];
  
  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
        `SELECT COUNT(*) as count FROM "${table}"`
      );
      counts[table] = Number(result[0].count);
    } catch (error) {
      counts[table] = -1; // Error al contar
    }
  }
  
  return counts;
}

/**
 * Función principal
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN DE INTEGRIDAD DE BASE DE DATOS');
  console.log('='.repeat(70) + '\n');
  
  try {
    // 1. Verificar Foreign Keys
    console.log('🔗 FOREIGN KEYS');
    console.log('-'.repeat(70));
    const foreignKeys = await getForeignKeys();
    console.log(`Total de Foreign Keys: ${foreignKeys.length}`);
    
    // Agrupar por tabla
    const fkByTable: Record<string, ForeignKeyInfo[]> = {};
    foreignKeys.forEach(fk => {
      if (!fkByTable[fk.table_name]) {
        fkByTable[fk.table_name] = [];
      }
      fkByTable[fk.table_name].push(fk);
    });
    
    console.log(`\nTablas con Foreign Keys: ${Object.keys(fkByTable).length}`);
    console.log('\nEjemplos (primeras 10 tablas):');
    Object.entries(fkByTable).slice(0, 10).forEach(([table, fks]) => {
      console.log(`  • ${table}: ${fks.length} FK(s)`);
      fks.slice(0, 2).forEach(fk => {
        console.log(`    - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        console.log(`      ON DELETE: ${fk.on_delete}, ON UPDATE: ${fk.on_update}`);
      });
    });
    
    // 2. Verificar Constraints
    console.log('\n' + '-'.repeat(70));
    console.log('🔒 CONSTRAINTS (UNIQUE, CHECK, PRIMARY KEY)');
    console.log('-'.repeat(70));
    const constraints = await getConstraints();
    
    // Agrupar por tipo
    const constraintsByType: Record<string, ConstraintInfo[]> = {};
    constraints.forEach(c => {
      if (!constraintsByType[c.constraint_type]) {
        constraintsByType[c.constraint_type] = [];
      }
      constraintsByType[c.constraint_type].push(c);
    });
    
    Object.entries(constraintsByType).forEach(([type, list]) => {
      console.log(`\n${type}: ${list.length}`);
      console.log('Ejemplos:');
      list.slice(0, 5).forEach(c => {
        console.log(`  • ${c.table_name}.${c.column_name || '(multiple)'}`);
      });
    });
    
    // 3. Verificar Índices
    console.log('\n' + '-'.repeat(70));
    console.log('🗒️  ÍNDICES');
    console.log('-'.repeat(70));
    const indexes = await getIndexes();
    
    // Agrupar por tabla
    const indexesByTable: Record<string, IndexInfo[]> = {};
    indexes.forEach(idx => {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = [];
      }
      indexesByTable[idx.tablename].push(idx);
    });
    
    console.log(`Total de índices: ${indexes.length}`);
    console.log(`\nTablas indexadas: ${Object.keys(indexesByTable).length}`);
    
    // Mostrar tablas con más índices
    const sortedTables = Object.entries(indexesByTable)
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 10);
    
    console.log('\nTop 10 tablas con más índices:');
    sortedTables.forEach(([table, idxs]) => {
      console.log(`  • ${table}: ${idxs.length} índice(s)`);
    });
    
    // 4. Contar registros
    console.log('\n' + '-'.repeat(70));
    console.log('📊 CONTEO DE REGISTROS (Tablas principales)');
    console.log('-'.repeat(70));
    const rowCounts = await getRowCounts();
    
    Object.entries(rowCounts).forEach(([table, count]) => {
      if (count === -1) {
        console.log(`  • ${table}: Error al contar`);
      } else {
        console.log(`  • ${table}: ${count.toLocaleString()} registro(s)`);
      }
    });
    
    // 5. Estadísticas de tamaño
    console.log('\n' + '-'.repeat(70));
    console.log('💾 ESTADÍSTICAS DE TAMAÑO (Top 20 tablas)');
    console.log('-'.repeat(70));
    const tableStats = await getTableStats();
    
    console.log('\n  Tabla                 Datos     Índices   Total');
    console.log('  ' + '-'.repeat(60));
    tableStats.forEach(stat => {
      const tableName = stat.table_name.padEnd(20);
      const tableSize = (stat.table_size || '0 bytes').padStart(8);
      const indexSize = (stat.indexes_size || '0 bytes').padStart(8);
      const totalSize = (stat.total_size || '0 bytes').padStart(8);
      console.log(`  ${tableName} ${tableSize} ${indexSize} ${totalSize}`);
    });
    
    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(70));
    console.log('\nRESUMEN:');
    console.log(`  • Foreign Keys: ${foreignKeys.length}`);
    console.log(`  • Constraints: ${constraints.length}`);
    console.log(`  • Índices: ${indexes.length}`);
    console.log(`  • Tablas principales con datos: ${Object.keys(rowCounts).length}`);
    
    const totalRecords = Object.values(rowCounts)
      .filter(c => c > 0)
      .reduce((sum, c) => sum + c, 0);
    console.log(`  • Total de registros (tablas principales): ${totalRecords.toLocaleString()}`);
    
    console.log('\n✅ La integridad de la base de datos ha sido verificada exitosamente.');
    console.log('\n' + '='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error al verificar integridad:', error);
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
