/**
 * Enriquecimiento completo de INMOVA desde contabilidad Zucchetti
 *
 * Extrae datos de las 3 sociedades del Grupo Vidaro y enriquece:
 * 1. Reclasifica gasto_otro con mapeo PGC mejorado
 * 2. NOI por inmueble → actualiza Building (IBI, comunidad)
 * 3. Deuda inquilinos → saldos pendientes reales
 * 4. Fianzas contables
 * 5. Proveedores con volúmenes
 * 6. Amortizaciones → valor contable
 * 7. Regenera CashFlowStatement
 *
 * Uso: npx tsx scripts/enrich-from-zucchetti.ts [--dry-run]
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });
dotenv.config();

import sql from 'mssql';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SERVER = process.env.ZUCCHETTI_SERVER || 'server.avannubo.com';
const PORT = parseInt(process.env.ZUCCHETTI_PORT || '33680', 10);

const DBS: Record<string, { db: string; user: string; pass: string; companyId: string; label: string }> = {
  RSQ: { db: 'CONT_RSQ', user: process.env.ZUCCHETTI_RSQ_USER || '', pass: process.env.ZUCCHETTI_RSQ_PASS || '', companyId: 'cef19f55f7b6ce0637d5ffb53', label: 'Rovida' },
  VID: { db: 'CONT_VID', user: process.env.ZUCCHETTI_VID_USER || '', pass: process.env.ZUCCHETTI_VID_PASS || '', companyId: 'c65159283deeaf6815f8eda95', label: 'Vidaro' },
  VIR: { db: 'DAT_VIR', user: process.env.ZUCCHETTI_VIR_USER || '', pass: process.env.ZUCCHETTI_VIR_PASS || '', companyId: 'cmkctneuh0001nokn7nvhuweq', label: 'Viroda' },
};

const dryRun = process.argv.includes('--dry-run');

// ============================================================================
// 1. RECLASIFICADOR PGC MEJORADO
// ============================================================================

function improvedClassify(sub: string, titulo: string): string | null {
  const s = (sub || '').trim();
  const t = (titulo || '').toLowerCase();

  if (s.startsWith('666')) return 'gasto_perdida_inversiones';
  if (s.startsWith('668')) return 'gasto_otro'; // diferencias cambio
  if (s.startsWith('662') || s.startsWith('663') || s.startsWith('669') || s.startsWith('626')) return 'gasto_bancario';
  if (s.startsWith('640') || s.startsWith('641')) return 'gasto_personal';
  if (s.startsWith('651') || s.startsWith('678')) return 'gasto_otro'; // multas
  if (s.startsWith('624')) return 'gasto_vehiculos';
  if (s.startsWith('629')) return 'gasto_otro';

  // By title keywords
  if (t.includes('consejero') || t.includes('consejera') || t.includes('asignación consej')) return 'gasto_consejeros';
  if (t.includes('seg. social') || t.includes('seguridad social')) return 'gasto_personal';
  if (t.includes('pérdida') && (t.includes('partic') || t.includes('valor') || t.includes('acc'))) return 'gasto_perdida_inversiones';
  if (t.includes('comisi') && (t.includes('banco') || t.includes('banc') || t.includes('gestión'))) return 'gasto_bancario';
  if (t.includes('amortiz')) return 'gasto_amortizacion';
  if (t.includes('iva no deducible') || t.includes('prorrata')) return 'gasto_impuesto';
  if (t.includes('impuesto') || t.includes('ibi') || t.includes('tributo')) return 'gasto_impuesto';
  if (t.includes('intragrupo') || t.includes('según arc')) return 'gasto_intragrupo';
  if (t.includes('seguro') || t.includes('póliza')) return 'gasto_seguro';
  if (t.includes('comunidad') || t.includes('cdad') || t.includes('c.p.')) return 'gasto_comunidad';
  if (t.includes('asesor') || t.includes('profes') || t.includes('abogad') || t.includes('gestor') || t.includes('auditor')) return 'gasto_profesionales';
  if (t.includes('electric') || t.includes('gas ') || t.includes('agua ') || t.includes('luz ') || t.includes('teléfono') || t.includes('alarma')) return 'gasto_suministros';
  if (t.includes('reparac') || t.includes('mantenim') || t.includes('obra')) return 'gasto_reparacion';

  return null; // Keep current
}

async function reclassifyGastoOtro() {
  console.log('\n📋 1. RECLASIFICANDO gasto_otro...');

  // Get all gasto_otro with ZUC- reference
  const items = await prisma.accountingTransaction.findMany({
    where: { categoria: 'gasto_otro', referencia: { startsWith: 'ZUC-' } },
    select: { id: true, concepto: true, referencia: true },
  });

  console.log(`   ${items.length} registros con gasto_otro`);
  let reclassified = 0;
  const changes: Record<string, number> = {};

  for (const item of items) {
    // Extract subcuenta from concepto (format: "... (XXXXXXX Titulo)")
    const match = item.concepto?.match(/\((\d{6,16})\s/);
    const sub = match ? match[1] : '';
    const newCat = improvedClassify(sub, item.concepto || '');

    if (newCat && newCat !== 'gasto_otro') {
      changes[newCat] = (changes[newCat] || 0) + 1;
      if (!dryRun) {
        await prisma.accountingTransaction.update({
          where: { id: item.id },
          data: { categoria: newCat as any },
        });
      }
      reclassified++;
    }
  }

  console.log(`   Reclasificados: ${reclassified}`);
  for (const [cat, cnt] of Object.entries(changes).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${cat}: ${cnt}`);
  }
}

// ============================================================================
// 2. NOI POR INMUEBLE → BUILDING
// ============================================================================

async function enrichBuildings(key: string, pool: sql.ConnectionPool) {
  const conf = DBS[key];
  console.log(`\n🏢 2. ENRIQUECIENDO EDIFICIOS (${conf.label})...`);

  // Get buildings for this company
  const buildings = await prisma.building.findMany({
    where: { companyId: conf.companyId },
    select: { id: true, nombre: true, direccion: true, ibiAnual: true, gastosComunidad: true },
  });

  if (buildings.length === 0) {
    console.log('   No hay edificios para esta empresa');
    return;
  }

  // Get IBI by property from Zucchetti
  const ibiData = await pool.request().query(`
    SELECT a.Subcuenta, s.Titulo,
      SUM(ISNULL(a.Debe,0))/100.0 as ibi
    FROM Apuntes a LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
    WHERE a.Subcuenta LIKE '631%' AND a.Fecha >= '2025-01-01'
    GROUP BY a.Subcuenta, s.Titulo
  `);

  // Get community expenses
  const comunidadData = await pool.request().query(`
    SELECT a.Subcuenta, s.Titulo,
      SUM(ISNULL(a.Debe,0))/100.0 as comunidad
    FROM Apuntes a LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
    WHERE (a.Subcuenta LIKE '622%' OR a.Subcuenta LIKE '627%')
      AND a.Fecha >= '2025-01-01'
      AND s.Titulo LIKE '%Cdad%' OR s.Titulo LIKE '%Comunidad%' OR s.Titulo LIKE '%C.P.%'
    GROUP BY a.Subcuenta, s.Titulo
  `);

  // Match by address keywords
  const addressKeywords: Record<string, string[]> = {};
  for (const b of buildings) {
    const words = (b.direccion + ' ' + b.nombre).toLowerCase()
      .replace(/[,./]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['calle', 'madrid', 'palencia', 'valladolid', 'marbella', 'benidorm'].includes(w));
    addressKeywords[b.id] = words;
  }

  function findBuilding(titulo: string): string | null {
    const t = (titulo || '').toLowerCase();
    let bestMatch = { id: '', score: 0 };
    for (const [id, words] of Object.entries(addressKeywords)) {
      const score = words.filter(w => t.includes(w)).length;
      if (score > bestMatch.score) {
        bestMatch = { id, score };
      }
    }
    return bestMatch.score >= 1 ? bestMatch.id : null;
  }

  let updated = 0;
  for (const row of ibiData.recordset) {
    const buildingId = findBuilding(row.Titulo || '');
    if (buildingId && !dryRun) {
      await prisma.building.update({
        where: { id: buildingId },
        data: { ibiAnual: row.ibi },
      });
      updated++;
      const b = buildings.find(b => b.id === buildingId);
      console.log(`   IBI ${b?.nombre}: ${row.ibi.toFixed(2)}€`);
    }
  }

  for (const row of comunidadData.recordset) {
    const buildingId = findBuilding(row.Titulo || '');
    if (buildingId && !dryRun) {
      const monthlyComm = row.comunidad / 12;
      await prisma.building.update({
        where: { id: buildingId },
        data: { gastosComunidad: monthlyComm },
      });
      const b = buildings.find(b => b.id === buildingId);
      console.log(`   Comunidad ${b?.nombre}: ${monthlyComm.toFixed(2)}€/mes`);
    }
  }
  console.log(`   ${updated} edificios actualizados`);
}

// ============================================================================
// 3. DEUDA INQUILINOS
// ============================================================================

async function enrichTenantDebt(key: string, pool: sql.ConnectionPool) {
  const conf = DBS[key];
  console.log(`\n👤 3. DEUDA INQUILINOS (${conf.label})...`);

  const deuda = await pool.request().query(`
    SELECT a.Subcuenta, s.Titulo, t.Nombre, t.Nif,
      SUM(ISNULL(a.Debe,0))/100.0 as facturado,
      SUM(ISNULL(a.Haber,0))/100.0 as cobrado,
      SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0))/100.0 as saldo
    FROM Apuntes a
    LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
    LEFT JOIN Terceros t ON s.CodigoTercero = t.Codigo
    WHERE a.Subcuenta LIKE '43%' AND a.Fecha >= '2025-01-01'
    GROUP BY a.Subcuenta, s.Titulo, t.Nombre, t.Nif
    HAVING ABS(SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0))) > 100
    ORDER BY SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0)) DESC
  `);

  let enriched = 0;
  for (const row of deuda.recordset) {
    if (Math.abs(row.saldo) < 1) continue;
    const nombre = (row.Nombre || row.Titulo || '').trim();
    const nif = (row.Nif || '').trim();
    if (!nombre) continue;

    // Try to find tenant by name or NIF
    const tenant = await prisma.tenant.findFirst({
      where: {
        companyId: conf.companyId,
        OR: [
          ...(nif ? [{ dni: nif }] : []),
          { nombreCompleto: { contains: nombre.split(',')[0].trim().split(' ')[0], mode: 'insensitive' as const } },
        ],
      },
      select: { id: true, nombreCompleto: true },
    });

    if (!dryRun) {
      // Store as accounting transaction for debt tracking
      const ref = `ZUC-DEBT-${key}-${(row.Subcuenta || '').trim()}`;
      const existing = await prisma.accountingTransaction.findFirst({
        where: { referencia: ref },
      });
      if (!existing && row.saldo > 0) {
        await prisma.accountingTransaction.create({
          data: {
            companyId: conf.companyId,
            tipo: 'ingreso',
            categoria: 'ingreso_renta' as any,
            concepto: `Saldo pendiente: ${nombre} (${row.saldo.toFixed(2)}€ por cobrar)`,
            monto: row.saldo,
            fecha: new Date(),
            referencia: ref,
            notas: `Deuda inquilino/cliente ${nombre}. NIF:${nif}. Subcta:${(row.Subcuenta || '').trim()}. Facturado:${row.facturado.toFixed(2)} Cobrado:${row.cobrado.toFixed(2)}`,
          },
        });
      }
    }

    if (row.saldo > 100) {
      console.log(`   ${nombre}: ${row.saldo.toFixed(2)}€ pendiente${tenant ? ' → Tenant: ' + tenant.nombreCompleto : ''}`);
      enriched++;
    }
  }
  console.log(`   ${enriched} deudas > 100€ detectadas`);
}

// ============================================================================
// 4. FIANZAS
// ============================================================================

async function enrichFianzas(key: string, pool: sql.ConnectionPool) {
  const conf = DBS[key];
  console.log(`\n🔒 4. FIANZAS (${conf.label})...`);

  const fianzas = await pool.request().query(`
    SELECT a.Subcuenta, s.Titulo,
      SUM(ISNULL(a.Debe,0))/100.0 as depositado,
      SUM(ISNULL(a.Haber,0))/100.0 as devuelto,
      SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0))/100.0 as saldo
    FROM Apuntes a LEFT JOIN Subcuentas s ON a.Subcuenta = s.Codigo
    WHERE (a.Subcuenta LIKE '560%' OR s.Titulo LIKE '%fianza%' OR s.Titulo LIKE '%Fianza%')
      AND a.Fecha >= '2020-01-01'
    GROUP BY a.Subcuenta, s.Titulo
    HAVING ABS(SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0))) > 10
    ORDER BY ABS(SUM(ISNULL(a.Debe,0) - ISNULL(a.Haber,0))) DESC
  `);

  let count = 0;
  for (const row of fianzas.recordset) {
    if (Math.abs(row.saldo) < 1) continue;
    const ref = `ZUC-FIANZA-${key}-${(row.Subcuenta || '').trim()}`;
    if (!dryRun) {
      const existing = await prisma.accountingTransaction.findFirst({ where: { referencia: ref } });
      if (!existing) {
        await prisma.accountingTransaction.create({
          data: {
            companyId: conf.companyId,
            tipo: row.saldo > 0 ? 'ingreso' : 'gasto',
            categoria: 'ingreso_deposito' as any,
            concepto: `Fianza: ${(row.Titulo || '').trim()} (saldo: ${row.saldo.toFixed(2)}€)`,
            monto: Math.abs(row.saldo),
            fecha: new Date(),
            referencia: ref,
            notas: `Fianza contable. Depositado:${row.depositado.toFixed(2)} Devuelto:${row.devuelto.toFixed(2)}. Subcta:${(row.Subcuenta || '').trim()}`,
          },
        });
        count++;
      }
    }
    if (Math.abs(row.saldo) > 100) {
      console.log(`   ${(row.Titulo || '').trim().substring(0, 50)}: ${row.saldo.toFixed(2)}€`);
    }
  }
  console.log(`   ${count} fianzas importadas`);
}

// ============================================================================
// 5. REGENERAR CashFlowStatement
// ============================================================================

async function regenerateCashFlow() {
  console.log('\n📊 5. REGENERANDO CashFlowStatement...');

  for (const [key, conf] of Object.entries(DBS)) {
    const txns = await prisma.accountingTransaction.findMany({
      where: { companyId: conf.companyId, referencia: { startsWith: 'ZUC-' }, NOT: { referencia: { startsWith: 'ZUC-DEBT-' } } },
      select: { fecha: true, tipo: true, monto: true, categoria: true },
    });

    const monthlyMap = new Map<string, { ingresos: number; gastos: number; ingRenta: number; ingOtros: number; gastosMant: number }>();
    for (const t of txns) {
      const p = t.fecha.toISOString().substring(0, 7);
      if (!monthlyMap.has(p)) monthlyMap.set(p, { ingresos: 0, gastos: 0, ingRenta: 0, ingOtros: 0, gastosMant: 0 });
      const m = monthlyMap.get(p)!;
      if (t.tipo === 'ingreso') {
        m.ingresos += t.monto;
        if (t.categoria?.startsWith('ingreso_renta')) m.ingRenta += t.monto;
        else m.ingOtros += t.monto;
      } else {
        m.gastos += t.monto;
        if (t.categoria?.includes('mantenimiento') || t.categoria?.includes('reparacion')) m.gastosMant += t.monto;
      }
    }

    let created = 0;
    for (const [periodo, data] of monthlyMap.entries()) {
      const [year, month] = periodo.split('-').map(Number);
      if (!dryRun) {
        const existing = await prisma.cashFlowStatement.findFirst({ where: { companyId: conf.companyId, periodo } });
        const cfData = {
          ingresosTotales: data.ingresos,
          gastosTotales: data.gastos,
          flujoNeto: data.ingresos - data.gastos,
          ingresosRenta: data.ingRenta,
          ingresosOtros: data.ingOtros,
          gastosMantenimiento: data.gastosMant,
          saldoInicial: 0,
          saldoFinal: data.ingresos - data.gastos,
        };
        if (existing) {
          await prisma.cashFlowStatement.update({ where: { id: existing.id }, data: cfData });
        } else {
          await prisma.cashFlowStatement.create({
            data: { companyId: conf.companyId, periodo, fechaInicio: new Date(year, month - 1, 1), fechaFin: new Date(year, month, 0), ...cfData },
          });
        }
        created++;
      }
    }
    console.log(`   ${key}: ${created} períodos`);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('====================================================================');
  console.log('  ENRIQUECIMIENTO INMOVA DESDE ZUCCHETTI');
  console.log(`  Modo: ${dryRun ? 'DRY RUN' : 'PRODUCCIÓN'}`);
  console.log('====================================================================');

  // 1. Reclasificar
  await reclassifyGastoOtro();

  // Per-company enrichment
  for (const [key, conf] of Object.entries(DBS)) {
    if (!conf.user || !conf.pass) continue;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${conf.label} (${key})`);
    console.log(`${'='.repeat(60)}`);

    try {
      const pool = new sql.ConnectionPool({
        server: SERVER, port: PORT, user: conf.user, password: conf.pass, database: conf.db,
        options: { encrypt: false, trustServerCertificate: true, requestTimeout: 60000 },
      });
      await pool.connect();

      await enrichBuildings(key, pool);
      await enrichTenantDebt(key, pool);
      await enrichFianzas(key, pool);

      await pool.close();
    } catch (err: any) {
      console.error(`  ❌ Error ${key}: ${err.message.substring(0, 100)}`);
    }
  }

  // 5. CashFlow
  await regenerateCashFlow();

  console.log('\n====================================================================');
  console.log('  ENRIQUECIMIENTO COMPLETADO');
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error fatal:', err);
  await prisma.$disconnect();
  process.exit(1);
});
