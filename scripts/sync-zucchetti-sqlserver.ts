/**
 * Sincronización: SQL Server Zucchetti → INMOVA (PostgreSQL)
 *
 * Lee asientos contables del SQL Server de Zucchetti y los importa
 * como AccountingTransaction en la BD de INMOVA.
 *
 * Para cada sociedad configurada (RSQ, VID, VIR):
 *   1. Conecta al SQL Server
 *   2. Lee asientos desde la última sincronización
 *   3. Los mapea a AccountingTransaction
 *   4. Los inserta/actualiza en PostgreSQL
 *   5. Actualiza la fecha de última sync
 *
 * Prerequisitos:
 *   - Credenciales SQL Server en .env.local o .env.production
 *   - IP del servidor autorizada en firewall de Avannubo
 *   - Discovery ejecutado (para conocer nombres de tablas)
 *
 * Uso: npx tsx scripts/sync-zucchetti-sqlserver.ts [--company VID] [--from 2025-01-01] [--dry-run]
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import {
  getConfiguredCompanyKeys,
  getAccountingEntries,
  mapCompanyKeyToInmovaId,
  isZucchettiSqlConfigured,
  closeAllPools,
  type ZucchettiCompanyKey,
  type ZucchettiAsiento,
} from '../lib/zucchetti-sqlserver';

const prisma = new PrismaClient();

// ============================================================================
// CLI ARGS
// ============================================================================

function parseArgs(): {
  company?: ZucchettiCompanyKey;
  fromDate: string;
  toDate: string;
  dryRun: boolean;
  database?: string;
} {
  const args = process.argv.slice(2);
  let company: ZucchettiCompanyKey | undefined;
  let fromDate = '';
  let toDate = new Date().toISOString().split('T')[0];
  let dryRun = false;
  let database: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--company':
        company = args[++i]?.toUpperCase() as ZucchettiCompanyKey;
        break;
      case '--from':
        fromDate = args[++i];
        break;
      case '--to':
        toDate = args[++i];
        break;
      case '--database':
      case '--db':
        database = args[++i];
        break;
      case '--dry-run':
        dryRun = true;
        break;
    }
  }

  return { company, fromDate, toDate, dryRun, database };
}

// ============================================================================
// MAPEO ZUCCHETTI → INMOVA
// ============================================================================

type TxnType = 'ingreso' | 'gasto';
type TxnCategory = string;

function classifyEntry(
  subcuenta: string,
  debe: number,
  haber: number
): { tipo: TxnType; categoria: TxnCategory } {
  const sub = String(subcuenta);

  // Grupo 7: Ingresos
  if (sub.startsWith('7')) {
    if (sub.startsWith('752')) return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    if (sub.startsWith('765')) return { tipo: 'ingreso', categoria: 'ingreso_deposito' };
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }

  // Grupo 6: Gastos
  if (sub.startsWith('6')) {
    if (sub.startsWith('622')) return { tipo: 'gasto', categoria: 'gasto_mantenimiento' };
    if (sub.startsWith('631')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (sub.startsWith('625')) return { tipo: 'gasto', categoria: 'gasto_seguro' };
    if (sub.startsWith('628')) return { tipo: 'gasto', categoria: 'gasto_servicio' };
    if (sub.startsWith('627')) return { tipo: 'gasto', categoria: 'gasto_comunidad' };
    if (sub.startsWith('623')) return { tipo: 'gasto', categoria: 'gasto_administracion' };
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }

  // Por defecto basado en debe/haber
  return debe > haber
    ? { tipo: 'gasto', categoria: 'gasto_otro' }
    : { tipo: 'ingreso', categoria: 'ingreso_otro' };
}

// ============================================================================
// SYNC
// ============================================================================

interface SyncResult {
  companyKey: string;
  companyId: string;
  total: number;
  created: number;
  skipped: number;
  errors: number;
  errorMessages: string[];
}

async function syncCompany(
  companyKey: ZucchettiCompanyKey,
  fromDate: string,
  toDate: string,
  dryRun: boolean,
  database: string
): Promise<SyncResult> {
  const companyId = mapCompanyKeyToInmovaId(companyKey);
  if (!companyId) {
    return {
      companyKey,
      companyId: 'UNKNOWN',
      total: 0,
      created: 0,
      skipped: 0,
      errors: 1,
      errorMessages: [`No hay mapeo de ${companyKey} a companyId INMOVA`],
    };
  }

  console.log(`\n  📊 Leyendo asientos de ${companyKey} (${database})...`);
  console.log(`     Período: ${fromDate} → ${toDate}`);

  const asientos = await getAccountingEntries(companyKey, database, fromDate, toDate);
  console.log(`     Encontrados: ${asientos.length} asientos`);

  if (asientos.length === 0) {
    return {
      companyKey,
      companyId,
      total: 0,
      created: 0,
      skipped: 0,
      errors: 0,
      errorMessages: [],
    };
  }

  let created = 0;
  let skipped = 0;
  let errors = 0;
  const errorMessages: string[] = [];

  for (const asiento of asientos) {
    for (const linea of asiento.lineas) {
      // Saltar líneas con importe 0
      if (linea.debe === 0 && linea.haber === 0) {
        skipped++;
        continue;
      }

      const { tipo, categoria } = classifyEntry(linea.subcuenta, linea.debe, linea.haber);
      const monto = Math.abs(linea.debe - linea.haber);
      const fecha = new Date(asiento.fecha);
      const referencia = `ZUC-${companyKey}-${asiento.numero}`;
      const concepto = [
        linea.concepto || asiento.descripcion,
        linea.nombreSubcuenta ? `(${linea.subcuenta} ${linea.nombreSubcuenta})` : `(${linea.subcuenta})`,
      ]
        .filter(Boolean)
        .join(' ');

      if (dryRun) {
        console.log(`     [DRY] ${fecha.toISOString().split('T')[0]} ${tipo} ${categoria} ${monto.toFixed(2)}€ — ${concepto.substring(0, 60)}`);
        created++;
        continue;
      }

      try {
        // Upsert por referencia (evitar duplicados)
        const existing = await prisma.accountingTransaction.findFirst({
          where: { companyId, referencia },
          select: { id: true },
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.accountingTransaction.create({
          data: {
            companyId,
            tipo: tipo as any,
            categoria: categoria as any,
            concepto: concepto.substring(0, 500),
            monto,
            fecha,
            referencia,
            notas: `Importado de Zucchetti SQL Server (${companyKey}). Subcuenta: ${linea.subcuenta}. Asiento #${asiento.numero}.`,
          },
        });
        created++;
      } catch (err: any) {
        errors++;
        if (errorMessages.length < 10) {
          errorMessages.push(`${referencia}: ${err.message}`);
        }
      }
    }
  }

  return {
    companyKey,
    companyId,
    total: asientos.reduce((sum, a) => sum + a.lineas.length, 0),
    created,
    skipped,
    errors,
    errorMessages,
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const { company, fromDate, toDate, dryRun, database } = parseArgs();

  console.log('====================================================================');
  console.log('  SINCRONIZACIÓN: Zucchetti SQL Server → INMOVA');
  console.log('====================================================================');
  console.log(`  Modo: ${dryRun ? 'DRY RUN (sin escritura)' : 'PRODUCCIÓN'}`);
  console.log(`  Período: ${fromDate || '(desde última sync)'} → ${toDate}`);
  if (company) console.log(`  Sociedad: ${company}`);
  if (database) console.log(`  Base de datos: ${database}`);

  if (!isZucchettiSqlConfigured()) {
    console.error('\n❌ SQL Server de Zucchetti no configurado. Revisa las variables de entorno.');
    process.exit(1);
  }

  const keys = company ? [company] : getConfiguredCompanyKeys();
  const results: SyncResult[] = [];

  for (const key of keys) {
    console.log(`\n🔄 Sincronizando ${key}...`);

    // Determinar fecha de inicio
    let effectiveFrom = fromDate;
    if (!effectiveFrom) {
      const companyId = mapCompanyKeyToInmovaId(key);
      if (companyId) {
        const companyRecord = await prisma.company.findUnique({
          where: { id: companyId },
          select: { zucchettiLastSync: true },
        });
        if (companyRecord?.zucchettiLastSync) {
          effectiveFrom = companyRecord.zucchettiLastSync.toISOString().split('T')[0];
        }
      }
      if (!effectiveFrom) {
        effectiveFrom = '2025-01-01';
      }
    }

    // Determinar nombre de BD
    // NOTA: Esto se actualizará tras el discovery con los nombres reales
    const dbName = database || `CONT_${key}`;

    try {
      const result = await syncCompany(key, effectiveFrom, toDate, dryRun, dbName);
      results.push(result);

      // Actualizar última sync en la empresa
      if (!dryRun && result.created > 0) {
        const companyId = mapCompanyKeyToInmovaId(key);
        if (companyId) {
          await prisma.company.update({
            where: { id: companyId },
            data: {
              zucchettiLastSync: new Date(),
              zucchettiSyncErrors: result.errors,
            },
          });
        }
      }

      console.log(`  ✅ ${key}: ${result.created} creados, ${result.skipped} saltados, ${result.errors} errores`);
    } catch (err: any) {
      console.error(`  ❌ ${key}: ${err.message}`);
      results.push({
        companyKey: key,
        companyId: mapCompanyKeyToInmovaId(key) || 'UNKNOWN',
        total: 0,
        created: 0,
        skipped: 0,
        errors: 1,
        errorMessages: [err.message],
      });
    }
  }

  // Resumen final
  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  for (const r of results) {
    const status = r.errors > 0 ? '⚠️' : '✅';
    console.log(`  ${status} ${r.companyKey} (${r.companyId}): ${r.created} creados, ${r.skipped} saltados, ${r.errors} errores`);
    if (r.errorMessages.length > 0) {
      for (const msg of r.errorMessages) {
        console.log(`     ❌ ${msg}`);
      }
    }
  }

  const totalCreated = results.reduce((s, r) => s + r.created, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);
  console.log(`\n  Total: ${totalCreated} transacciones ${dryRun ? '(simuladas)' : 'creadas'}, ${totalErrors} errores`);
  console.log('====================================================================');

  await closeAllPools();
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error fatal:', err);
  await closeAllPools();
  await prisma.$disconnect();
  process.exit(1);
});
