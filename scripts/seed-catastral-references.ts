/**
 * Seed: Catastral references from individual building Excel files
 * 
 * Updates unit records with:
 * - Referencia catastral
 * - Superficie construida (from catastro)
 * - Año construcción
 * - Uso (residencial, comercial, garaje, etc.)
 * 
 * Run: npx tsx scripts/seed-catastral-references.ts [--execute]
 */

import { config } from 'dotenv';
config({ path: '.env.production' });

import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';

const prisma = new PrismaClient();

interface CatastralRecord {
  referenciaCatastral: string;
  direccion: string;
  uso: string;
  superficieConstruida: number;
  anoConstruccion: number;
  participacion: number;
  sourceFile: string;
}

function parseCatastralExcel(filePath: string): CatastralRecord[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', range: 2 }); // Skip header rows

  return rows
    .filter((r: any) => r['REFERENCIA CATASTRAL'] && String(r['REFERENCIA CATASTRAL']).length > 10)
    .map((r: any) => ({
      referenciaCatastral: String(r['REFERENCIA CATASTRAL']).trim(),
      direccion: String(r['DIRECCIÓN'] || '').trim(),
      uso: String(r['USO'] || '').trim(),
      superficieConstruida: parseInt(String(r['SUP. CONSTRUIDA (m2)'] || '0').trim()) || 0,
      anoConstruccion: parseInt(String(r['AÑO'] || '0').trim()) || 0,
      participacion: parseFloat(String(r['PARTICIPACIÓN DEL INMUEBLE'] || '0').trim().replace(',', '.')) || 0,
      sourceFile: path.basename(filePath),
    }));
}

async function main() {
  const dryRun = !process.argv.includes('--execute');
  console.log(dryRun ? '🔍 DRY RUN' : '⚡ EXECUTING');
  console.log('');

  const dataDir = path.join(process.cwd(), 'data', 'vidaro-files');
  const files = fs.readdirSync(dataDir).filter(f => f.startsWith('bldg_') && f.endsWith('.xlsx'));

  let totalRecords = 0;
  const allRecords: CatastralRecord[] = [];

  for (const file of files) {
    const records = parseCatastralExcel(path.join(dataDir, file));
    if (records.length > 0) {
      const firstAddr = records[0]?.direccion || '?';
      console.log(`  📄 ${file}: ${records.length} refs — ${firstAddr.substring(0, 50)}`);
      allRecords.push(...records);
      totalRecords += records.length;
    }
  }

  console.log(`\n📊 Total catastral references: ${totalRecords}`);

  // Stats by use
  const byUse: Record<string, number> = {};
  for (const r of allRecords) {
    const uso = r.uso || 'Sin uso';
    byUse[uso] = (byUse[uso] || 0) + 1;
  }
  console.log('\n  Por uso:');
  for (const [uso, count] of Object.entries(byUse).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${uso}: ${count}`);
  }

  // Stats by year
  const years = allRecords.filter(r => r.anoConstruccion > 0).map(r => r.anoConstruccion);
  if (years.length > 0) {
    console.log(`\n  Años: ${Math.min(...years)} - ${Math.max(...years)}`);
  }

  // Total surface
  const totalSurface = allRecords.reduce((sum, r) => sum + r.superficieConstruida, 0);
  console.log(`  Superficie total: ${totalSurface.toLocaleString('es-ES')} m²`);

  if (!dryRun) {
    console.log('\n⚡ Updating units with catastral references...');
    // TODO: Match catastral records with existing units in DB
    // This requires matching by address/building name
    console.log('  (Match logic to be implemented based on address patterns)');
  }

  await prisma.$disconnect();
  console.log('\n✅ Done');
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
