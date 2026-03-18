/**
 * Carga Masiva: Contabilidad Zucchetti → INMOVA
 *
 * Lee TODOS los apuntes contables del SQL Server de Zucchetti para las 3 sociedades
 * del Grupo Vidaro y los importa en INMOVA como:
 *   - AccountingTransaction (apuntes operativos: grupos 1-4, 6-7)
 *   - BankTransaction (movimientos bancarios: grupo 57)
 *
 * Datos:
 *   RSQ (Rovida): CONT_RSQ → 80K+ apuntes
 *   VID (Vidaro): CONT_VID → 38K+ apuntes
 *   VIR (Viroda): DAT_VIR → 38K+ apuntes
 *
 * Uso: npx tsx scripts/load-zucchetti-accounting.ts [--from 2025-01-01] [--company VID] [--dry-run]
 *
 * Requiere: credenciales Zucchetti en .env.local o .env.production
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
dotenv.config();

import sql from 'mssql';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// CONFIG
// ============================================================================

const DBS: Record<string, { db: string; user: string; pass: string; companyId: string; label: string }> = {
  RSQ: { db: 'CONT_RSQ', user: process.env.ZUCCHETTI_RSQ_USER || '', pass: process.env.ZUCCHETTI_RSQ_PASS || '', companyId: 'rovida-sl', label: 'Rovida' },
  VID: { db: 'CONT_VID', user: process.env.ZUCCHETTI_VID_USER || '', pass: process.env.ZUCCHETTI_VID_PASS || '', companyId: 'vidaro-inversiones', label: 'Vidaro' },
  VIR: { db: 'DAT_VIR', user: process.env.ZUCCHETTI_VIR_USER || '', pass: process.env.ZUCCHETTI_VIR_PASS || '', companyId: 'viroda-inversiones', label: 'Viroda' },
};

const SERVER = process.env.ZUCCHETTI_SERVER || 'server.avannubo.com';
const PORT = parseInt(process.env.ZUCCHETTI_PORT || '33680', 10);

const BATCH_SIZE = 200;

// ============================================================================
// CLASIFICACIÓN PGC → AccountingCategory
// ============================================================================

function classifySubcuenta(subcuenta: string, titulo: string): { tipo: 'ingreso' | 'gasto'; categoria: string } | null {
  const sub = (subcuenta || '').trim();
  const tit = (titulo || '').toLowerCase();

  // Grupo 7: Ingresos
  if (sub.startsWith('7')) {
    // Arrendamientos (752x)
    if (sub.startsWith('752')) {
      if (tit.includes('garaje') || tit.includes('plaza') || tit.includes('parking')) return { tipo: 'ingreso', categoria: 'ingreso_renta_garaje' };
      if (tit.includes('local')) return { tipo: 'ingreso', categoria: 'ingreso_renta_local' };
      if (tit.includes('nave') || tit.includes('cuba')) return { tipo: 'ingreso', categoria: 'ingreso_renta_nave' };
      if (tit.includes('oficina') || tit.includes('europa')) return { tipo: 'ingreso', categoria: 'ingreso_renta_oficina' };
      if (tit.includes('piamonte') || tit.includes('edif')) return { tipo: 'ingreso', categoria: 'ingreso_renta_edificio' };
      if (tit.includes('silvela')) return { tipo: 'ingreso', categoria: 'ingreso_renta_silvela' };
      if (tit.includes('reina')) return { tipo: 'ingreso', categoria: 'ingreso_renta_reina' };
      if (tit.includes('pelayo')) return { tipo: 'ingreso', categoria: 'ingreso_renta_pelayo' };
      if (tit.includes('tejada')) return { tipo: 'ingreso', categoria: 'ingreso_renta_tejada' };
      if (tit.includes('candelaria')) return { tipo: 'ingreso', categoria: 'ingreso_renta_candelaria' };
      if (tit.includes('viviend') || tit.includes('apto') || tit.includes('gemelos') || tit.includes('benidorm')) return { tipo: 'ingreso', categoria: 'ingreso_renta_vivienda' };
      if (tit.includes('terreno') || tit.includes('finca') || tit.includes('grijota')) return { tipo: 'ingreso', categoria: 'ingreso_renta_terreno' };
      return { tipo: 'ingreso', categoria: 'ingreso_renta' };
    }
    // Inversiones
    if (sub.startsWith('761')) return { tipo: 'ingreso', categoria: 'ingreso_intereses' };
    if (sub.startsWith('766')) return { tipo: 'ingreso', categoria: 'ingreso_beneficio_inversiones' };
    if (sub.startsWith('760')) return { tipo: 'ingreso', categoria: 'ingreso_dividendos' };
    if (sub.startsWith('771') || sub.startsWith('772')) return { tipo: 'ingreso', categoria: 'ingreso_enajenacion_participaciones' };
    if (sub.startsWith('768')) return { tipo: 'ingreso', categoria: 'ingreso_diferencias_cambio' };
    if (sub.startsWith('740') || sub.startsWith('705')) return { tipo: 'ingreso', categoria: 'ingreso_servicios_intragrupo' };
    return { tipo: 'ingreso', categoria: 'ingreso_otro' };
  }

  // Grupo 6: Gastos
  if (sub.startsWith('6')) {
    if (sub.startsWith('622')) return { tipo: 'gasto', categoria: 'gasto_reparacion' };
    if (sub.startsWith('625')) return { tipo: 'gasto', categoria: 'gasto_seguro' };
    if (sub.startsWith('628')) return { tipo: 'gasto', categoria: 'gasto_suministros' };
    if (sub.startsWith('631')) return { tipo: 'gasto', categoria: 'gasto_impuesto' };
    if (sub.startsWith('630')) return { tipo: 'gasto', categoria: 'gasto_impuesto_sociedades' };
    if (sub.startsWith('627')) return { tipo: 'gasto', categoria: 'gasto_comunidad' };
    if (sub.startsWith('621')) return { tipo: 'gasto', categoria: 'gasto_arrendamiento' };
    if (sub.startsWith('623')) return { tipo: 'gasto', categoria: 'gasto_profesionales' };
    if (sub.startsWith('640') || sub.startsWith('641')) return { tipo: 'gasto', categoria: 'gasto_personal' };
    if (sub.startsWith('662') || sub.startsWith('663') || sub.startsWith('669')) return { tipo: 'gasto', categoria: 'gasto_bancario' };
    if (sub.startsWith('681') || sub.startsWith('682')) return { tipo: 'gasto', categoria: 'gasto_amortizacion' };
    if (sub.startsWith('666')) return { tipo: 'gasto', categoria: 'gasto_perdida_inversiones' };
    if (sub.startsWith('668')) return { tipo: 'gasto', categoria: 'gasto_otro' }; // diferencias cambio
    if (sub.startsWith('651') || sub.startsWith('659')) return { tipo: 'gasto', categoria: 'gasto_otro' };
    if (sub.startsWith('624')) return { tipo: 'gasto', categoria: 'gasto_vehiculos' };
    if (sub.startsWith('626')) return { tipo: 'gasto', categoria: 'gasto_bancario' };
    return { tipo: 'gasto', categoria: 'gasto_otro' };
  }

  // Grupos 1-4 (balance): no son gastos/ingresos operativos — omitir de AccountingTransaction
  // pero necesitamos los del grupo 57 para BankTransaction (se manejan aparte)
  return null;
}

// ============================================================================
// LOAD FUNCTIONS
// ============================================================================

async function loadAccountingEntries(
  key: string,
  pool: sql.ConnectionPool,
  fromDate: string,
  dryRun: boolean
): Promise<{ created: number; skipped: number; errors: number }> {
  const conf = DBS[key];
  console.log(`\n  📊 Cargando apuntes operativos (grupos 6+7)...`);

  // Leer apuntes de grupos 6 y 7 (gastos e ingresos operativos)
  const result = await pool.request()
    .input('fromDate', sql.Date, fromDate)
    .query(`
      SELECT a.Codigo, a.Fecha, a.CodEjercicio, a.Asiento, a.Apunte,
             a.Subcuenta, a.ConceptoTexto, a.Debe, a.Haber,
             a.Factura, a.Documento, a.CentroDeCoste, a.FechaValor,
             s.Titulo AS NombreSubcuenta
      FROM Apuntes a
      LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
      WHERE a.Fecha >= @fromDate
        AND (a.Subcuenta LIKE '6%' OR a.Subcuenta LIKE '7%')
      ORDER BY a.Fecha, a.Asiento, a.Apunte
    `);

  console.log(`     ${result.recordset.length} apuntes operativos leídos`);

  let created = 0, skipped = 0, errors = 0;

  for (let i = 0; i < result.recordset.length; i += BATCH_SIZE) {
    const batch = result.recordset.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const sub = (row.Subcuenta || '').trim();
      const titulo = (row.NombreSubcuenta || '').trim();
      const classification = classifySubcuenta(sub, titulo);

      if (!classification) {
        skipped++;
        continue;
      }

      const debe = parseFloat(row.Debe || 0);
      const haber = parseFloat(row.Haber || 0);
      const monto = Math.abs(debe - haber);
      if (monto === 0) { skipped++; continue; }

      const referencia = `ZUC-${key}-${row.CodEjercicio}-${row.Asiento}-${row.Apunte}`;
      const concepto = [
        row.ConceptoTexto || '',
        titulo ? `(${sub} ${titulo})` : `(${sub})`,
      ].filter(Boolean).join(' ').substring(0, 500);

      if (dryRun) {
        if (created < 5) {
          const fecha = new Date(row.Fecha).toISOString().split('T')[0];
          console.log(`     [DRY] ${fecha} ${classification.tipo} ${classification.categoria} ${monto.toFixed(2)}€ — ${concepto.substring(0, 60)}`);
        }
        created++;
        continue;
      }

      try {
        const existing = await prisma.accountingTransaction.findFirst({
          where: { companyId: conf.companyId, referencia },
          select: { id: true },
        });
        if (existing) { skipped++; continue; }

        await prisma.accountingTransaction.create({
          data: {
            companyId: conf.companyId,
            tipo: classification.tipo as any,
            categoria: classification.categoria as any,
            concepto,
            monto,
            fecha: new Date(row.Fecha),
            referencia,
            notas: `Zucchetti ${key} (${conf.label}). Ej:${row.CodEjercicio} As:${row.Asiento}/${row.Apunte}. Subcta:${sub}. ${row.Factura ? 'Fra:' + row.Factura.trim() : ''}`.trim(),
          },
        });
        created++;
      } catch (err: any) {
        if (err.code === 'P2002') { skipped++; } else { errors++; }
      }
    }

    if (!dryRun && i > 0 && i % 1000 === 0) {
      process.stdout.write(`     ${i}/${result.recordset.length} procesados...\r`);
    }
  }

  return { created, skipped, errors };
}

async function loadBankMovements(
  key: string,
  pool: sql.ConnectionPool,
  fromDate: string,
  dryRun: boolean
): Promise<{ created: number; skipped: number; errors: number }> {
  const conf = DBS[key];
  console.log(`\n  🏦 Cargando movimientos bancarios (grupo 57)...`);

  const result = await pool.request()
    .input('fromDate', sql.Date, fromDate)
    .query(`
      SELECT a.Codigo, a.Fecha, a.CodEjercicio, a.Asiento, a.Apunte,
             a.Subcuenta, a.Contrapartida, a.ConceptoTexto,
             a.Debe, a.Haber, a.Factura, a.Documento, a.FechaValor,
             s.Titulo AS NombreBanco,
             cp.Titulo AS NombreContrapartida
      FROM Apuntes a
      LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
      LEFT JOIN Subcuentas cp ON a.Contrapartida = cp.Codigo
      WHERE a.Fecha >= @fromDate AND a.Subcuenta LIKE '57%'
      ORDER BY a.Fecha, a.Asiento, a.Apunte
    `);

  console.log(`     ${result.recordset.length} movimientos bancarios leídos`);

  // Buscar o crear BankConnection para esta empresa
  let connectionId: string;
  const existingConn = await prisma.bankConnection.findFirst({
    where: { companyId: conf.companyId, proveedor: 'zucchetti_sql' },
    select: { id: true },
  });

  if (existingConn) {
    connectionId = existingConn.id;
  } else if (!dryRun) {
    const conn = await prisma.bankConnection.create({
      data: {
        companyId: conf.companyId,
        proveedor: 'zucchetti_sql',
        provider: 'zucchetti_sql',
        nombreBanco: `Zucchetti ${conf.label}`,
        tipoCuenta: 'corriente',
        moneda: 'EUR',
        estado: 'conectado',
      },
    });
    connectionId = conn.id;
  } else {
    connectionId = 'dry-run';
  }

  let created = 0, skipped = 0, errors = 0;

  for (let i = 0; i < result.recordset.length; i += BATCH_SIZE) {
    const batch = result.recordset.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const debe = parseFloat(row.Debe || 0);
      const haber = parseFloat(row.Haber || 0);
      const monto = debe - haber; // Positivo = entrada, negativo = salida
      if (monto === 0) { skipped++; continue; }

      const txId = `ZUC-BK-${key}-${row.CodEjercicio}-${row.Asiento}-${row.Apunte}`;

      if (dryRun) {
        if (created < 5) {
          const fecha = new Date(row.Fecha).toISOString().split('T')[0];
          const banco = (row.NombreBanco || '').trim().substring(0, 40);
          console.log(`     [DRY] ${fecha} ${monto > 0 ? '+' : ''}${monto.toFixed(2)}€ ${banco} — ${(row.ConceptoTexto || '').substring(0, 50)}`);
        }
        created++;
        continue;
      }

      try {
        // Verificar duplicado
        const existing = await prisma.bankTransaction.findFirst({
          where: { proveedorTxId: txId },
          select: { id: true },
        });
        if (existing) { skipped++; continue; }

        await prisma.bankTransaction.create({
          data: {
            companyId: conf.companyId,
            connectionId,
            proveedorTxId: txId,
            fecha: new Date(row.Fecha),
            fechaContable: row.FechaValor ? new Date(row.FechaValor) : undefined,
            descripcion: (row.ConceptoTexto || 'Movimiento bancario').substring(0, 500),
            monto,
            moneda: 'EUR',
            beneficiario: (row.NombreContrapartida || '').trim() || undefined,
            referencia: (row.Factura || row.Documento || '').trim() || undefined,
            tipoTransaccion: monto > 0 ? 'ingreso' : 'gasto',
            estado: 'pendiente_revision',
            rawData: {
              source: 'zucchetti_sql',
              key,
              ejercicio: row.CodEjercicio,
              asiento: row.Asiento,
              apunte: row.Apunte,
              subcuenta: (row.Subcuenta || '').trim(),
              contrapartida: (row.Contrapartida || '').trim(),
              banco: (row.NombreBanco || '').trim(),
            },
          },
        });
        created++;
      } catch (err: any) {
        if (err.code === 'P2002') { skipped++; } else { errors++; }
      }
    }

    if (!dryRun && i > 0 && i % 1000 === 0) {
      process.stdout.write(`     ${i}/${result.recordset.length} procesados...\r`);
    }
  }

  return { created, skipped, errors };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  let fromDate = '2025-01-01';
  let companyFilter: string | undefined;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--from') fromDate = args[++i];
    if (args[i] === '--company') companyFilter = args[++i]?.toUpperCase();
    if (args[i] === '--dry-run') dryRun = true;
  }

  console.log('====================================================================');
  console.log('  CARGA MASIVA: Zucchetti SQL Server → INMOVA');
  console.log('====================================================================');
  console.log(`  Modo: ${dryRun ? 'DRY RUN' : 'PRODUCCIÓN'}`);
  console.log(`  Desde: ${fromDate}`);
  if (companyFilter) console.log(`  Sociedad: ${companyFilter}`);

  const keys = companyFilter ? [companyFilter] : Object.keys(DBS);

  const totals = { accCreated: 0, accSkipped: 0, accErrors: 0, bkCreated: 0, bkSkipped: 0, bkErrors: 0 };

  for (const key of keys) {
    const conf = DBS[key];
    if (!conf) { console.log(`❌ Sociedad ${key} no encontrada`); continue; }
    if (!conf.user || !conf.pass) { console.log(`❌ ${key}: Credenciales no configuradas`); continue; }

    console.log(`\n🔄 ${key} (${conf.label}) — BD: ${conf.db} → companyId: ${conf.companyId}`);

    const pool = new sql.ConnectionPool({
      server: SERVER,
      port: PORT,
      user: conf.user,
      password: conf.pass,
      database: conf.db,
      options: { encrypt: false, trustServerCertificate: true, requestTimeout: 120000, connectionTimeout: 15000 },
    });

    try {
      await pool.connect();

      // 1. Apuntes operativos → AccountingTransaction
      const acc = await loadAccountingEntries(key, pool, fromDate, dryRun);
      console.log(`  ✅ Apuntes operativos: ${acc.created} creados, ${acc.skipped} saltados, ${acc.errors} errores`);
      totals.accCreated += acc.created;
      totals.accSkipped += acc.skipped;
      totals.accErrors += acc.errors;

      // 2. Movimientos bancarios → BankTransaction
      const bk = await loadBankMovements(key, pool, fromDate, dryRun);
      console.log(`  ✅ Movimientos bancarios: ${bk.created} creados, ${bk.skipped} saltados, ${bk.errors} errores`);
      totals.bkCreated += bk.created;
      totals.bkSkipped += bk.skipped;
      totals.bkErrors += bk.errors;

      // 3. Actualizar última sync
      if (!dryRun) {
        await prisma.company.update({
          where: { id: conf.companyId },
          data: {
            zucchettiLastSync: new Date(),
            zucchettiSyncErrors: acc.errors + bk.errors,
          },
        });
      }

      await pool.close();
    } catch (err: any) {
      console.error(`  ❌ Error: ${err.message}`);
      try { await pool.close(); } catch {}
    }
  }

  console.log('\n====================================================================');
  console.log('  RESUMEN FINAL');
  console.log('====================================================================');
  console.log(`  AccountingTransaction: ${totals.accCreated} creados, ${totals.accSkipped} saltados, ${totals.accErrors} errores`);
  console.log(`  BankTransaction:       ${totals.bkCreated} creados, ${totals.bkSkipped} saltados, ${totals.bkErrors} errores`);
  console.log(`  Total:                 ${totals.accCreated + totals.bkCreated} registros creados`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error fatal:', err);
  await prisma.$disconnect();
  process.exit(1);
});
