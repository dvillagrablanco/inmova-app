/**
 * Seed: Transacciones PE del Grupo Vidaro (cartera BALDOMERO PE PRE-MDF)
 * 
 * Fuente: Spreadsheet MdF Gestefin - Cash flows históricos Vidaro Inversiones S.L.
 * 
 * Fondos:
 * - HELIA III (2019): Fondo generalista
 * - STONEHENGE (2020): Fondo inmobiliario/infraestructuras
 * - ASABYS (2020): Fondo healthcare/life sciences
 * - PORTOBELLO (2020): Fondo mid-market español
 * - GREEN TRANS (2022): Fondo transición energética
 * - TITAN II A (2022): Fondo infraestructuras
 * 
 * 79 transacciones (compras = capital calls, ventas = distribuciones)
 * Total capital calls: ~€13.5M
 * Total distribuciones: ~€1.8M
 * 
 * Uso: npx tsx scripts/seed-vidaro-pe-transactions.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env: try .env.production first, then .env
dotenv.config({ path: '.env.production' });
dotenv.config(); // fallback
const prisma = new PrismaClient();

// Fund metadata
const FUND_METADATA: Record<string, { fullName: string; strategy: string; vintage: number; gestora: string }> = {
  'HELIA III 19': { fullName: 'Helia III', strategy: 'Generalista / Buyout', vintage: 2019, gestora: 'Helia Capital' },
  'STONEHENGE 20': { fullName: 'Stonehenge Fund', strategy: 'Real Estate / Infraestructuras', vintage: 2020, gestora: 'Stonehenge Capital' },
  'ASABYS 20': { fullName: 'Asabys Healthcare Innovation', strategy: 'Healthcare / Life Sciences', vintage: 2020, gestora: 'Asabys Partners' },
  'PORTOBELLO 20': { fullName: 'Portobello Capital Fund', strategy: 'Mid-Market Buyout España', vintage: 2020, gestora: 'Portobello Capital' },
  'GREEN TRANS 22': { fullName: 'Green Transition Fund', strategy: 'Transición Energética / ESG', vintage: 2022, gestora: 'Green Transition Partners' },
  'TITAN II A 22': { fullName: 'Titan Inversiones en Infraestructuras II Clase A', strategy: 'Infraestructuras', vintage: 2022, gestora: 'Titan Capital' },
};

function parseEuropeanNumber(s: string): number {
  if (!s || s.trim() === '') return 0;
  // Remove dots (thousand separator), replace comma with dot (decimal)
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
}

function parseDate(s: string): Date {
  // Format: dd/mm/yyyy
  const [day, month, year] = s.split('/');
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
}

async function main() {
  console.log('====================================================================');
  console.log('  SEED: Transacciones PE - Grupo Vidaro');
  console.log('  Fuente: MdF Gestefin / BALDOMERO PE PRE-MDF');
  console.log('====================================================================\n');

  // Find Vidaro company
  const vidaro = await prisma.company.findFirst({
    where: { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });

  if (!vidaro) {
    console.error('❌ Vidaro no encontrada en BD');
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`✅ Empresa: ${vidaro.nombre} (${vidaro.id})\n`);

  // Find or create VIBLA SCR as the investment vehicle
  let vibla = await prisma.company.findFirst({
    where: { nombre: { contains: 'VIBLA', mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });

  // Read CSV
  const csvPath = path.join(__dirname, '..', 'data', 'vidaro-pe-transactions.csv');
  let csvContent: string;
  
  // Try local file first, then /tmp
  try {
    csvContent = fs.readFileSync(csvPath, 'utf-8');
  } catch {
    try {
      csvContent = fs.readFileSync('/tmp/vidaro_pe.csv', 'utf-8');
    } catch {
      console.error('❌ CSV no encontrado. Coloca el archivo en data/vidaro-pe-transactions.csv');
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  const lines = csvContent.split('\n').filter(l => l.trim());
  const header = lines[0];
  const dataLines = lines.slice(1).filter(l => {
    // Skip empty lines and footer notes
    return l.trim() && !l.startsWith(',*') && !l.startsWith(',,');
  });

  console.log(`📄 ${dataLines.length} transacciones en CSV\n`);

  // Parse transactions and group by fund
  const fundTotals: Record<string, { calls: number; distributions: number; firstDate: Date; lastDate: Date; txCount: number }> = {};
  const transactions: Array<{
    fund: string;
    date: Date;
    type: 'compra' | 'venta';
    amount: number;
    ticket: string;
  }> = [];

  for (const line of dataLines) {
    // Simple CSV parse (handles quoted fields with commas)
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    if (fields.length < 11) continue;
    
    const [estado, fOperacion, , , contrato, isin, sentido, cantidad, precio, tipoCambio, efectivoFinal] = fields;
    
    if (!isin || !sentido || !fOperacion) continue;
    const fund = isin.trim();
    if (!FUND_METADATA[fund]) continue;

    const date = parseDate(fOperacion);
    const amount = Math.abs(parseEuropeanNumber(efectivoFinal));
    const type = sentido.trim().toLowerCase() === 'compra' ? 'compra' : 'venta';
    const ticket = fields[14] || '';

    if (amount === 0 && parseEuropeanNumber(cantidad) === 0) continue;

    transactions.push({ fund, date, type, amount: amount || Math.abs(parseEuropeanNumber(cantidad)), ticket });

    if (!fundTotals[fund]) {
      fundTotals[fund] = { calls: 0, distributions: 0, firstDate: date, lastDate: date, txCount: 0 };
    }
    fundTotals[fund].txCount++;
    if (type === 'compra') fundTotals[fund].calls += amount;
    else fundTotals[fund].distributions += amount;
    if (date < fundTotals[fund].firstDate) fundTotals[fund].firstDate = date;
    if (date > fundTotals[fund].lastDate) fundTotals[fund].lastDate = date;
  }

  // Upsert fund participations
  console.log('📊 Fondos PE detectados:\n');
  
  let created = 0;
  let updated = 0;

  for (const [fundCode, totals] of Object.entries(fundTotals)) {
    const meta = FUND_METADATA[fundCode];
    const netInvested = totals.calls - totals.distributions;
    
    console.log(`  ${meta.fullName} (${fundCode})`);
    console.log(`    Gestora: ${meta.gestora}`);
    console.log(`    Estrategia: ${meta.strategy}`);
    console.log(`    Vintage: ${meta.vintage}`);
    console.log(`    Transacciones: ${totals.txCount}`);
    console.log(`    Capital Calls: €${totals.calls.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`);
    console.log(`    Distribuciones: €${totals.distributions.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`);
    console.log(`    Neto Invertido: €${netInvested.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`);
    console.log('');

    // Upsert participation
    const existing = await prisma.participation.findFirst({
      where: {
        companyId: vidaro.id,
        targetCompanyName: { contains: fundCode.split(' ')[0], mode: 'insensitive' },
      },
    });

    const dpi = totals.calls > 0 ? totals.distributions / totals.calls : 0;
    
    const participationData = {
      companyId: vidaro.id,
      targetCompanyName: meta.fullName,
      tipo: 'pe_fund' as const,
      porcentaje: 0, // LP participation
      fechaAdquisicion: totals.firstDate,
      costeAdquisicion: totals.calls,
      valorContable: netInvested,
      capitalLlamado: totals.calls,
      capitalDistribuido: totals.distributions,
      dpi: Math.round(dpi * 100) / 100,
      moic: dpi > 0 ? Math.round(dpi * 100) / 100 : undefined,
      anoCompromiso: meta.vintage,
      vehiculoInversor: 'VIBLA_SCR',
      gestora: meta.gestora,
      fechaUltimaValoracion: totals.lastDate,
      activa: true,
      notas: `Cartera BALDOMERO PE PRE-MDF. Estrategia: ${meta.strategy}. ${totals.txCount} operaciones. Capital calls: €${totals.calls.toLocaleString('es-ES', { maximumFractionDigits: 0 })}. Distribuciones: €${totals.distributions.toLocaleString('es-ES', { maximumFractionDigits: 0 })}. Última operación: ${totals.lastDate.toLocaleDateString('es-ES')}.`,
    };

    if (existing) {
      await prisma.participation.update({
        where: { id: existing.id },
        data: participationData,
      });
      updated++;
    } else {
      await prisma.participation.create({
        data: participationData,
      });
      created++;
    }
  }

  // Summary
  const totalCalls = Object.values(fundTotals).reduce((s, f) => s + f.calls, 0);
  const totalDist = Object.values(fundTotals).reduce((s, f) => s + f.distributions, 0);

  console.log('====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Fondos PE: ${Object.keys(fundTotals).length}`);
  console.log(`  Transacciones procesadas: ${transactions.length}`);
  console.log(`  Participaciones creadas: ${created}`);
  console.log(`  Participaciones actualizadas: ${updated}`);
  console.log(`  Total Capital Calls: €${totalCalls.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`);
  console.log(`  Total Distribuciones: €${totalDist.toLocaleString('es-ES', { maximumFractionDigits: 0 })}`);
  console.log(`  Total Neto Invertido: €${(totalCalls - totalDist).toLocaleString('es-ES', { maximumFractionDigits: 0 })}`);
  console.log(`  MOIC: ${totalDist > 0 ? (totalDist / totalCalls).toFixed(2) + 'x' : 'N/A (sin distribuciones significativas)'}`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
