/**
 * Seed: Datos contables completos (IBIs, Amortizaciones, Proveedores, Seguros, Inversiones, Intragrupo)
 *
 * Lee de data/contabilidad_extraida.json (extraído de diarios generales 2025)
 * Carga en: Expense (IBIs, amortizaciones, seguros), Provider (proveedores),
 * FinancialPosition (inversiones), datos intragrupo
 *
 * Idempotente. Busca empresas por nombre.
 *
 * Uso: npx tsx scripts/seed-contabilidad-completa.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

async function findCompany(hint: string) {
  return prisma.company.findFirst({
    where: { nombre: { contains: hint, mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });
}

// ============================================================================
// IBI POR UNIDAD → Expense con categoría 'ibi'
// ============================================================================

async function seedIBIs(
  companyId: string,
  companyName: string,
  ibis: Array<{ cuenta: string; nombre: string; importe: number }>
) {
  console.log(`\n  🏛️ IBIs ${companyName}: ${ibis.length} conceptos`);

  // Find buildings for this company
  const buildings = await prisma.building.findMany({
    where: { companyId },
    select: { id: true, nombre: true },
  });

  if (buildings.length === 0) {
    console.log(`    ⚠️ Sin edificios, saltando IBIs`);
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const ibi of ibis) {
    const n = ibi.nombre.toLowerCase();

    // Match to building
    let buildingId: string | null = null;
    for (const b of buildings) {
      const bn = b.nombre.toLowerCase();
      if (
        (n.includes('espronceda') && bn.includes('espronceda')) ||
        (n.includes('piamonte') && bn.includes('piamonte')) ||
        (n.includes('barquillo') && bn.includes('barquillo')) ||
        (n.includes('reina') && bn.includes('reina')) ||
        (n.includes('pelayo 15') && bn.includes('pelayo 15')) ||
        (n.includes('pelayo 17') && bn.includes('pelayo 17')) ||
        (n.includes('europa') && bn.includes('europa')) ||
        (n.includes('constitución 8') && bn.includes('constitución 8')) ||
        (n.includes('constitución 5') && bn.includes('constitución 5')) ||
        (n.includes('metal') && bn.includes('metal')) ||
        (n.includes('cuba') && bn.includes('cuba')) ||
        (n.includes('benidorm') && bn.includes('gemelo')) ||
        (n.includes('tomillar') && bn.includes('tomillar')) ||
        (n.includes('silvela') && bn.includes('silvela')) ||
        (n.includes('candelaria') && bn.includes('candelaria')) ||
        (n.includes('tejada') && bn.includes('tejada')) ||
        (n.includes('marbella') && bn.includes('cela')) ||
        (n.includes('prado') && bn.includes('prado'))
      ) {
        buildingId = b.id;
        break;
      }
    }

    // Check duplicate
    const existing = await prisma.expense.findFirst({
      where: {
        buildingId: buildingId || undefined,
        categoria: 'ibi',
        concepto: { contains: ibi.cuenta },
        fecha: { gte: new Date(2025, 0, 1), lt: new Date(2026, 0, 1) },
      },
    });

    if (existing) { skipped++; continue; }

    await prisma.expense.create({
      data: {
        buildingId,
        concepto: `IBI ${ibi.nombre} [${ibi.cuenta}]`,
        categoria: 'ibi',
        monto: ibi.importe,
        fecha: new Date(2025, 6, 1), // Mid-year
        ejercicio: 2025,
        subcategoria: 'E21a',
      },
    });
    created++;
  }

  console.log(`    ✅ ${created} IBIs creados, ${skipped} ya existían`);
}

// ============================================================================
// AMORTIZACIONES → Expense con categoría 'amortizaciones'
// ============================================================================

async function seedAmortizaciones(
  companyId: string,
  companyName: string,
  amorts: Array<{ cuenta: string; nombre: string; importe: number }>
) {
  console.log(`\n  📉 Amortizaciones ${companyName}: ${amorts.length} conceptos`);

  const buildings = await prisma.building.findMany({
    where: { companyId },
    select: { id: true, nombre: true },
  });

  let created = 0;
  let skipped = 0;

  for (const amort of amorts) {
    const n = amort.nombre.toLowerCase();
    let buildingId: string | null = null;

    for (const b of buildings) {
      const bn = b.nombre.toLowerCase();
      if (
        (n.includes('espronceda') && bn.includes('espronceda')) ||
        (n.includes('piamonte') && bn.includes('piamonte')) ||
        (n.includes('barquillo') && bn.includes('barquillo')) ||
        (n.includes('reina') && bn.includes('reina')) ||
        (n.includes('pelayo') && bn.includes('pelayo')) ||
        (n.includes('europa') && bn.includes('europa')) ||
        (n.includes('constitución') && bn.includes('constitución')) ||
        (n.includes('metal') && bn.includes('metal')) ||
        (n.includes('cuba') && bn.includes('cuba')) ||
        (n.includes('benidorm') && bn.includes('gemelo')) ||
        (n.includes('gemelos') && bn.includes('gemelo')) ||
        (n.includes('tomillar') && bn.includes('tomillar')) ||
        (n.includes('magaz') && bn.includes('magaz')) ||
        (n.includes('silvela') && bn.includes('silvela')) ||
        (n.includes('candelaria') && bn.includes('candelaria')) ||
        (n.includes('tejada') && bn.includes('tejada')) ||
        (n.includes('marbella') && bn.includes('cela')) ||
        (n.includes('prado') && bn.includes('prado'))
      ) {
        buildingId = b.id;
        break;
      }
    }

    const existing = await prisma.expense.findFirst({
      where: {
        buildingId: buildingId || undefined,
        categoria: 'amortizaciones',
        concepto: { contains: amort.cuenta },
        fecha: { gte: new Date(2025, 0, 1), lt: new Date(2026, 0, 1) },
      },
    });

    if (existing) { skipped++; continue; }

    await prisma.expense.create({
      data: {
        buildingId,
        concepto: `Amort. ${amort.nombre} [${amort.cuenta}]`,
        categoria: 'amortizaciones',
        monto: amort.importe,
        fecha: new Date(2025, 11, 31), // Year-end
        ejercicio: 2025,
        subcategoria: 'E24',
      },
    });
    created++;
  }

  console.log(`    ✅ ${created} amortizaciones creadas, ${skipped} ya existían`);
}

// ============================================================================
// SEGUROS → Expense con categoría 'seguros'
// ============================================================================

async function seedSeguros(
  companyId: string,
  companyName: string,
  seguros: Array<{ cuenta: string; nombre: string; importe: number }>
) {
  console.log(`\n  🛡️ Seguros ${companyName}: ${seguros.length} pólizas`);

  const buildings = await prisma.building.findMany({
    where: { companyId },
    select: { id: true, nombre: true },
  });

  let created = 0;
  let skipped = 0;

  for (const seg of seguros) {
    const n = seg.nombre.toLowerCase();
    let buildingId: string | null = null;

    for (const b of buildings) {
      const bn = b.nombre.toLowerCase();
      if (
        (n.includes('espronceda') && bn.includes('espronceda')) ||
        (n.includes('piamonte') && bn.includes('piamonte')) ||
        (n.includes('barquillo') && bn.includes('barquillo')) ||
        (n.includes('reina') && bn.includes('reina')) ||
        (n.includes('pelayo') && bn.includes('pelayo')) ||
        (n.includes('europa') && bn.includes('europa')) ||
        (n.includes('constitución') && bn.includes('constitución')) ||
        (n.includes('benidorm') && bn.includes('gemelo')) ||
        (n.includes('tomillar') && bn.includes('tomillar')) ||
        (n.includes('magaz') && bn.includes('magaz')) ||
        (n.includes('silvela') && bn.includes('silvela')) ||
        (n.includes('candelaria') && bn.includes('candelaria')) ||
        (n.includes('tejada') && bn.includes('tejada')) ||
        (n.includes('marbella') && bn.includes('cela')) ||
        (n.includes('prado') && bn.includes('prado'))
      ) {
        buildingId = b.id;
        break;
      }
    }

    const existing = await prisma.expense.findFirst({
      where: {
        categoria: 'seguros',
        concepto: { contains: seg.cuenta },
        fecha: { gte: new Date(2025, 0, 1), lt: new Date(2026, 0, 1) },
      },
    });

    if (existing) { skipped++; continue; }

    await prisma.expense.create({
      data: {
        buildingId,
        concepto: `Seguro ${seg.nombre} [${seg.cuenta}]`,
        categoria: 'seguros',
        monto: seg.importe,
        fecha: new Date(2025, 0, 1),
        ejercicio: 2025,
        subcategoria: 'E20a06',
      },
    });
    created++;
  }

  console.log(`    ✅ ${created} seguros creados, ${skipped} ya existían`);
}

// ============================================================================
// PROVEEDORES
// ============================================================================

async function seedProveedores(
  companyId: string,
  companyName: string,
  proveedores: Array<{ cuenta: string; nombre: string; saldo: number }>
) {
  console.log(`\n  🏭 Proveedores ${companyName}: ${proveedores.length} con saldo`);

  let created = 0;
  let skipped = 0;

  for (const prov of proveedores) {
    if (!prov.nombre || prov.nombre.length < 3) continue;

    const existing = await prisma.provider.findFirst({
      where: {
        companyId,
        nombre: { equals: prov.nombre, mode: 'insensitive' },
      },
    });

    if (existing) { skipped++; continue; }

    try {
      await prisma.provider.create({
        data: {
          companyId,
          nombre: prov.nombre,
          tipo: 'general',
          notas: `Subcuenta contable: ${prov.cuenta}. Saldo 2025: €${prov.saldo.toFixed(2)}`,
          activo: true,
        },
      });
      created++;
    } catch {
      // Skip unique constraint violations
      skipped++;
    }
  }

  console.log(`    ✅ ${created} proveedores creados, ${skipped} ya existían`);
}

// ============================================================================
// INVERSIONES FINANCIERAS VIDARO (todas las 250x)
// ============================================================================

async function seedInversionesCompletas(
  vidaroId: string,
  inversiones: Array<{ cuenta: string; nombre: string; isin: string; saldo: number }>
) {
  console.log(`\n  📊 Inversiones LP Vidaro: ${inversiones.length} instrumentos`);

  const account = await prisma.financialAccount.findFirst({
    where: { companyId: vidaroId, alias: { contains: 'Inversis' } },
  });

  if (!account) {
    console.log('    ⚠️ Sin cuenta Inversis, saltando');
    return;
  }

  let created = 0;
  let skipped = 0;

  for (const inv of inversiones) {
    // Determine type
    const n = inv.nombre.toLowerCase();
    let tipo = 'fondo_inversion';
    if (n.includes('acc') || n.includes('accion')) tipo = 'accion';
    else if (n.includes('etf') || n.includes('ishares') || n.includes('x-tracker')) tipo = 'etf';
    else if (n.includes('bono') || n.includes('deuda') || n.includes('letras') || n.includes('govt') || n.includes('vto')) tipo = 'bono';
    else if (n.includes('pe ') || n.includes('scr') || n.includes('portobello') || n.includes('helia')) tipo = 'pe_fund';

    const existing = await prisma.financialPosition.findFirst({
      where: {
        accountId: account.id,
        OR: [
          { isin: inv.isin || undefined },
          { nombre: inv.nombre },
        ],
      },
    });

    if (existing) {
      await prisma.financialPosition.update({
        where: { id: existing.id },
        data: { valorActual: inv.saldo },
      });
      skipped++;
      continue;
    }

    try {
      await prisma.financialPosition.create({
        data: {
          accountId: account.id,
          nombre: inv.nombre.substring(0, 100),
          isin: inv.isin || null,
          tipo,
          cantidad: 0,
          precioMedio: 0,
          costeTotal: 0,
          valorActual: inv.saldo,
          divisa: 'EUR',
          pnlNoRealizado: 0,
          pnlRealizado: 0,
          pnlPct: 0,
        },
      });
      created++;
    } catch {
      skipped++;
    }
  }

  console.log(`    ✅ ${created} posiciones creadas, ${skipped} actualizadas/existían`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('📋 Seed Contabilidad Completa\n');

  const dataPath = path.join(process.cwd(), 'data', 'contabilidad_extraida.json');
  if (!fs.existsSync(dataPath)) {
    console.error('❌ data/contabilidad_extraida.json no encontrado');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const companies: Record<string, { id: string; nombre: string } | null> = {
    ROVIDA: await findCompany('Rovida'),
    VIDARO: await findCompany('Vidaro'),
    VIRODA: await findCompany('Viroda'),
  };

  for (const [soc, company] of Object.entries(companies)) {
    if (!company) { console.log(`⚠️ ${soc} no encontrada`); continue; }
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${company.nombre} (${company.id})`);
    console.log(`${'═'.repeat(60)}`);

    const d = data[soc];
    if (!d) continue;

    if (d.ibis?.length) await seedIBIs(company.id, company.nombre, d.ibis);
    if (d.amortizaciones?.length) await seedAmortizaciones(company.id, company.nombre, d.amortizaciones);
    if (d.seguros?.length) await seedSeguros(company.id, company.nombre, d.seguros);
    if (d.proveedores?.length) await seedProveedores(company.id, company.nombre, d.proveedores);
    if (d.inversiones?.length) await seedInversionesCompletas(company.id, d.inversiones);
  }

  // Summary
  const expenseCount = await prisma.expense.count({ where: { ejercicio: 2025 } });
  const providerCount = await prisma.provider.count();
  const positionCount = await prisma.financialPosition.count();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESUMEN`);
  console.log(`  Gastos 2025: ${expenseCount}`);
  console.log(`  Proveedores: ${providerCount}`);
  console.log(`  Posiciones financieras: ${positionCount}`);
  console.log(`${'═'.repeat(60)}`);
  console.log('\n✅ Seed completado.');
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
