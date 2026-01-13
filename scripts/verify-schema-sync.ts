/**
 * 🔍 Schema Sync Verification Script
 * 
 * Verifica que el schema de Prisma está sincronizado con la BD.
 * EJECUTAR ANTES DE CADA DEPLOYMENT.
 * 
 * Uso: npx tsx scripts/verify-schema-sync.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ColumnCheck {
  table: string;
  column: string;
  critical: boolean;
}

// Columnas críticas que DEBEN existir
const CRITICAL_COLUMNS: ColumnCheck[] = [
  // Users
  { table: 'users', column: 'email', critical: true },
  { table: 'users', column: 'password', critical: true },
  { table: 'users', column: 'role', critical: true },
  { table: 'users', column: 'activo', critical: true },
  { table: 'users', column: 'companyId', critical: true },
  
  // Company
  { table: 'company', column: 'nombre', critical: true },
  { table: 'company', column: 'activo', critical: true },
  { table: 'company', column: 'subscriptionPlanId', critical: true },
  { table: 'company', column: 'esInterno', critical: false },
  
  // Subscription Plans
  { table: 'subscription_plans', column: 'nombre', critical: true },
  { table: 'subscription_plans', column: 'precioMensual', critical: true },
  { table: 'subscription_plans', column: 'activo', critical: true },
  { table: 'subscription_plans', column: 'esInterno', critical: true },
];

async function checkColumnExists(table: string, column: string): Promise<boolean> {
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = '${table}' AND column_name = '${column}'
    `) as any[];
    
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Verificando sincronización de Schema...\n');
  
  let hasErrors = false;
  let hasCriticalErrors = false;
  const missingColumns: string[] = [];
  
  for (const check of CRITICAL_COLUMNS) {
    const exists = await checkColumnExists(check.table, check.column);
    
    if (!exists) {
      hasErrors = true;
      if (check.critical) {
        hasCriticalErrors = true;
        console.log(`❌ CRÍTICO: ${check.table}.${check.column} NO EXISTE`);
      } else {
        console.log(`⚠️ ADVERTENCIA: ${check.table}.${check.column} no existe`);
      }
      missingColumns.push(`${check.table}.${check.column}`);
    } else {
      console.log(`✅ ${check.table}.${check.column}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (hasCriticalErrors) {
    console.log('\n❌ SCHEMA NO SINCRONIZADO - ERRORES CRÍTICOS');
    console.log('Columnas faltantes:', missingColumns.join(', '));
    console.log('\nEjecuta: npx prisma db push');
    console.log('O añade las columnas manualmente.\n');
    process.exit(1);
  } else if (hasErrors) {
    console.log('\n⚠️ Schema parcialmente sincronizado');
    console.log('Columnas no críticas faltantes:', missingColumns.join(', '));
    console.log('\nPuedes continuar, pero considera sincronizar.\n');
    process.exit(0);
  } else {
    console.log('\n✅ SCHEMA COMPLETAMENTE SINCRONIZADO');
    process.exit(0);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
