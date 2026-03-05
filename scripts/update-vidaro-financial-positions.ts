/**
 * Actualizar posiciones financieras Vidaro desde informe MdF Gestefin
 * 
 * Fuente: Spreadsheet MdF con posiciones a 04/03/2026
 * 7 carteras: Inversis, Bankinter, Pictet, Banca March, RE Inversis, CACEIS, Amper
 * ~160 posiciones con valor total ~€67.4M
 * 
 * Uso: npx tsx scripts/update-vidaro-financial-positions.ts
 */

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.production' });
dotenv.config();

const prisma = new PrismaClient();

function parseNum(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/\./g, '').replace(',', '.')) || 0;
}

function parseDate(s: string): Date {
  if (!s) return new Date();
  const parts = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (parts) return new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
  return new Date(s);
}

// Map cartera code to entidad name
const CARTERA_MAP: Record<string, { entidad: string; tipoEntidad: string }> = {
  '1142.01': { entidad: 'Inversis', tipoEntidad: 'banca_privada' },
  '1142.03': { entidad: 'Bankinter', tipoEntidad: 'banca_privada' },
  '1142.04': { entidad: 'Pictet', tipoEntidad: 'banca_privada' },
  '1142.05': { entidad: 'Banca March', tipoEntidad: 'banca_privada' },
  '1142.07': { entidad: 'RE Inversis', tipoEntidad: 'banca_privada' },
  '1142.08': { entidad: 'CACEIS', tipoEntidad: 'banca_privada' },
  '1142.09': { entidad: 'Amper', tipoEntidad: 'banca_privada' },
};

// Map tipo activo to our categories
const TIPO_MAP: Record<string, string> = {
  'Renta fija': 'renta_fija',
  'Renta variable': 'renta_variable',
  'Mercado monetario': 'monetario',
  'Commodities': 'commodities',
  'Alternativos': 'alternativos',
};

async function main() {
  console.log('====================================================================');
  console.log('  ACTUALIZAR: Posiciones Financieras Vidaro');
  console.log('  Fuente: MdF Gestefin - 04/03/2026');
  console.log('====================================================================\n');

  // Find Vidaro
  const vidaro = await prisma.company.findFirst({
    where: { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
    select: { id: true, nombre: true },
  });

  if (!vidaro) {
    console.error('❌ Vidaro no encontrada');
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`✅ Empresa: ${vidaro.nombre}\n`);

  // Read CSV
  const csvPath = '/tmp/mdff_financiero.csv';
  let csvContent: string;
  try {
    csvContent = fs.readFileSync(csvPath, 'utf-8');
  } catch {
    console.error('❌ CSV no encontrado en /tmp/mdff_financiero.csv');
    await prisma.$disconnect();
    process.exit(1);
  }

  const lines = csvContent.split('\n');
  const header = lines[0];
  
  // Parse positions
  interface Position {
    cartera: string;
    isin: string;
    activo: string;
    tipo: string;
    divisa: string;
    cantidad: number;
    valorCompra: number;
    valorActual: number;
    plusvalia: number;
    plusvaliaPct: number;
    rentMes: number;
    rentAnio: number;
    rent12m: number;
    fecha: Date;
  }

  const positions: Position[] = [];
  const carteraTotals: Record<string, { total: number; count: number; entidad: string }> = {};

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parse handling quoted fields
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
      else { current += char; }
    }
    fields.push(current.trim());

    if (fields.length < 16) continue;
    
    const cartera = fields[1]?.trim();
    const isin = fields[4]?.trim();
    const activo = fields[5]?.trim();
    const tipo = fields[6]?.trim();
    const divisa = fields[7]?.trim();
    const valorActual = parseNum(fields[15]);

    if (!cartera || !isin || valorActual === 0) continue;
    // Skip cash positions (INV EUR, INV USD, etc.)
    if (activo?.startsWith('INV ') && valorActual < 50000) continue;

    const pos: Position = {
      cartera,
      isin,
      activo: activo || isin,
      tipo: tipo || 'otro',
      divisa: divisa || 'EUR',
      cantidad: parseNum(fields[8]),
      valorCompra: parseNum(fields[11]),
      valorActual,
      plusvalia: parseNum(fields[17]),
      plusvaliaPct: parseNum(fields[19]),
      rentMes: parseNum(fields[22]),
      rentAnio: parseNum(fields[23]),
      rent12m: parseNum(fields[24]),
      fecha: parseDate(fields[0]),
    };

    positions.push(pos);

    const carteraInfo = CARTERA_MAP[cartera] || { entidad: cartera, tipoEntidad: 'otro' };
    if (!carteraTotals[cartera]) {
      carteraTotals[cartera] = { total: 0, count: 0, entidad: carteraInfo.entidad };
    }
    carteraTotals[cartera].total += valorActual;
    carteraTotals[cartera].count++;
  }

  console.log(`📊 Posiciones parseadas: ${positions.length}\n`);

  // Find or create financial accounts for each cartera
  let accountsCreated = 0;
  let accountsUpdated = 0;
  let positionsUpdated = 0;

  for (const [carteraCode, totals] of Object.entries(carteraTotals)) {
    const carteraInfo = CARTERA_MAP[carteraCode] || { entidad: carteraCode, tipoEntidad: 'otro' };
    const alias = `BALDOMERO ${carteraInfo.entidad.toUpperCase()}`;
    
    console.log(`📁 ${alias}: ${totals.count} posiciones, €${Math.round(totals.total).toLocaleString('es-ES')}`);

    // Find or create FinancialAccount
    let account = await prisma.financialAccount.findFirst({
      where: {
        companyId: vidaro.id,
        OR: [
          { alias: { contains: carteraInfo.entidad, mode: 'insensitive' } },
          { entidad: { contains: carteraInfo.entidad, mode: 'insensitive' } },
        ],
      },
    });

    if (account) {
      await prisma.financialAccount.update({
        where: { id: account.id },
        data: {
          saldoActual: totals.total,
          valorMercado: totals.total,
          ultimaSync: new Date(),
        },
      });
      accountsUpdated++;
    } else {
      account = await prisma.financialAccount.create({
        data: {
          companyId: vidaro.id,
          entidad: carteraInfo.entidad,
          tipoEntidad: carteraInfo.tipoEntidad,
          numeroCuenta: carteraCode,
          alias,
          divisa: 'EUR',
          saldoActual: totals.total,
          valorMercado: totals.total,
          ultimaSync: new Date(),
        },
      });
      accountsCreated++;
    }

    // Upsert financial positions for this account
    const carteraPositions = positions.filter(p => p.cartera === carteraCode);
    
    for (const pos of carteraPositions) {
      const existing = await prisma.financialPosition.findFirst({
        where: {
          accountId: account.id,
          isin: pos.isin,
        },
      });

      const data = {
        nombre: pos.activo,
        tipo: (TIPO_MAP[pos.tipo] || 'otro') as any,
        divisa: pos.divisa,
        cantidad: pos.cantidad,
        precioMedio: pos.valorCompra > 0 && pos.cantidad > 0 ? pos.valorCompra / pos.cantidad : 0,
        valorActual: pos.valorActual,
        costeTotal: pos.valorCompra,
        pnlNoRealizado: pos.plusvalia,
        pnlPct: pos.plusvaliaPct,
        ultimaActualizacion: pos.fecha,
      };

      if (existing) {
        await prisma.financialPosition.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.financialPosition.create({
          data: {
            accountId: account.id,
            isin: pos.isin,
            ...data,
          },
        });
      }
      positionsUpdated++;
    }
  }

  // Grand total
  const totalValue = Object.values(carteraTotals).reduce((s, c) => s + c.total, 0);

  console.log('\n====================================================================');
  console.log('  RESUMEN');
  console.log('====================================================================');
  console.log(`  Carteras: ${Object.keys(carteraTotals).length}`);
  console.log(`  Cuentas creadas: ${accountsCreated}`);
  console.log(`  Cuentas actualizadas: ${accountsUpdated}`);
  console.log(`  Posiciones procesadas: ${positionsUpdated}`);
  console.log(`  Valor total cartera: €${Math.round(totalValue).toLocaleString('es-ES')}`);
  console.log('====================================================================');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
