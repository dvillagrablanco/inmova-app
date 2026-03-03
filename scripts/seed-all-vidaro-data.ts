/**
 * SEED CONSOLIDADO: Todos los datos del Drive Vidaro
 * 
 * Datos extraídos:
 * - 1.372 registros catastrales (21 Excel)
 * - 396 clientes únicos con NIF, email, teléfono, IBAN (2 Excel)
 * - 250 facturas febrero 2026 (2 Excel)
 * - 210 registros de inmuebles/contratos mensuales (2 Excel, 16 tabs)
 * - 3 pólizas de seguros (3 PDFs) — ya en BD
 * - 34 ISINs fondos/bonos cartera Bankinter+Inversis (PDF MdF)
 * - 96 ISINs cartera completa AR (PDF MdF)
 * - Patrimonio total verificado: 161.584.658€
 * - 17 escrituras de compraventa (PDFs)
 * 
 * Run: npx tsx scripts/seed-all-vidaro-data.ts
 */

import { config } from 'dotenv';
config({ path: '.env.production' });

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const DATA_DIR = path.join(process.cwd(), 'data', 'vidaro-files');

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║  SEED CONSOLIDADO - DATOS GRUPO VIDARO                  ║');
  console.log('║  Fuente: Google Drive compartido por el usuario          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // ── 1. VERIFICAR ARCHIVOS DISPONIBLES ──
  const files = {
    catastral: path.join(DATA_DIR, 'extracted_catastral.json'),
    clients: path.join(DATA_DIR, 'extracted_clients.json'),
    invoices: path.join(DATA_DIR, 'extracted_invoices.json'),
    properties: path.join(DATA_DIR, 'extracted_properties.json'),
  };

  for (const [name, fpath] of Object.entries(files)) {
    const exists = fs.existsSync(fpath);
    console.log(`  ${exists ? '✅' : '❌'} ${name}: ${exists ? 'OK' : 'NO ENCONTRADO'}`);
  }

  // ── 2. RESUMEN DE DATOS ──
  console.log('\n📊 RESUMEN DE DATOS EXTRAÍDOS:\n');

  if (fs.existsSync(files.catastral)) {
    const data = JSON.parse(fs.readFileSync(files.catastral, 'utf-8'));
    const usos: Record<string, number> = {};
    data.forEach((r: any) => { usos[r.uso || 'Sin uso'] = (usos[r.uso || 'Sin uso'] || 0) + 1; });
    console.log(`  🏗️ Registros catastrales: ${data.length}`);
    for (const [uso, cnt] of Object.entries(usos).sort((a: any, b: any) => b[1] - a[1])) {
      console.log(`     ${uso}: ${cnt}`);
    }
  }

  if (fs.existsSync(files.clients)) {
    const data = JSON.parse(fs.readFileSync(files.clients, 'utf-8'));
    console.log(`\n  👤 Clientes: ${data.length} únicos`);
    console.log(`     Con email: ${data.filter((c: any) => c.email).length}`);
    console.log(`     Con teléfono: ${data.filter((c: any) => c.telefono).length}`);
    console.log(`     Con IBAN: ${data.filter((c: any) => c.iban).length}`);
  }

  if (fs.existsSync(files.invoices)) {
    const data = JSON.parse(fs.readFileSync(files.invoices, 'utf-8'));
    const totalBase = data.reduce((s: number, i: any) => s + Math.abs(i.baseImporte || 0), 0);
    console.log(`\n  🧾 Facturas: ${data.length} (Feb 2026)`);
    console.log(`     Base total: ${totalBase.toLocaleString('es-ES', {style:'currency', currency:'EUR'})}`);
    console.log(`     Rovida: ${data.filter((i: any) => i.company === 'ROV').length}`);
    console.log(`     Viroda: ${data.filter((i: any) => i.company === 'VIR').length}`);
  }

  if (fs.existsSync(files.properties)) {
    const data = JSON.parse(fs.readFileSync(files.properties, 'utf-8'));
    const edificios = new Set(data.map((p: any) => p.edificio));
    console.log(`\n  🏠 Inmuebles mensuales: ${data.length} registros en ${edificios.size} edificios`);
    const vacios = data.filter((p: any) => (p.tipoContrato || '').toUpperCase().includes('VACIO'));
    console.log(`     Vacíos: ${vacios.length}`);
  }

  // ── 3. ESTADO BD ACTUAL ──
  console.log('\n📊 ESTADO BD ACTUAL:\n');
  const dbStats = {
    buildings: await prisma.building.count({ where: { isDemo: false } }),
    units: await prisma.unit.count({ where: { building: { isDemo: false } } }),
    tenants: await prisma.tenant.count(),
    contracts: await prisma.contract.count(),
    payments: await prisma.payment.count(),
    insurancePolicies: await prisma.insurancePolicy.count(),
    financialPositions: await prisma.financialPosition.count(),
  };

  for (const [key, val] of Object.entries(dbStats)) {
    console.log(`  ${key}: ${val}`);
  }

  // ── 4. PATRIMONIO ──
  const VIDARO_ID = 'c65159283deeaf6815f8eda95';
  const company = await prisma.company.findUnique({
    where: { id: VIDARO_ID },
    include: { childCompanies: { select: { id: true } } },
  });
  const allIds = company ? [company.id, ...company.childCompanies.map((c: any) => c.id)] : [VIDARO_ID];

  const [inmob, fin, pe, teso] = await Promise.all([
    prisma.unit.aggregate({ _sum: { valorMercado: true }, where: { building: { companyId: { in: allIds }, isDemo: false } } }),
    prisma.financialPosition.aggregate({ _sum: { valorActual: true }, where: { account: { companyId: { in: allIds } } } }),
    prisma.participation.aggregate({ _sum: { valorEstimado: true }, where: { companyId: { in: allIds }, activa: true } }),
    prisma.financialAccount.aggregate({ _sum: { saldoActual: true }, where: { companyId: { in: allIds }, activa: true } }),
  ]);

  const fmt = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  console.log('\n💰 PATRIMONIO (BD vs MdF Reporting):\n');
  console.log(`  Inmobiliario:  BD ${fmt(inmob._sum.valorMercado || 0)} | MdF 44.743.029€`);
  console.log(`  Financiero:    BD ${fmt(fin._sum.valorActual || 0)} | MdF 55.453.302€`);
  console.log(`  PE:            BD ${fmt(pe._sum.valorEstimado || 0)} | MdF 23.797.699€`);
  console.log(`  Tesorería:     BD ${fmt(teso._sum.saldoActual || 0)}`);
  console.log(`  ────────────────────────────────────────────`);
  console.log(`  MdF TOTAL:     161.584.658€ (Reporting Baldomero 31/01/2026)`);

  await prisma.$disconnect();
  console.log('\n✅ Seed report complete');
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
