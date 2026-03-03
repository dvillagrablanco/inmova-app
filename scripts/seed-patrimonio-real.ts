/**
 * Seed: Real patrimonio data from MdF Reporting Baldomero
 * 
 * Source: REPORTING_BALDOMERO_AF.pdf (35 págs) + REPORTING_BALDOMERO_AR.pdf (63 págs)
 * Date: 31 enero 2026
 * 
 * Key figures:
 * - Total patrimonio grupo: 161.584.658€
 * - Activos financieros: 55.453.302€
 * - Activos en renta (inmobiliario): 44.743.029€
 * - Activos en crecimiento: 23.797.699€
 * - Desembolsos pendientes PE: (data in report)
 * 
 * Carteras:
 * - BALDOMERO BANKINTER: ~16.7M€ (a 31/12/2025)
 * - BALDOMERO RE INVERSIS: ~11.8M€ (a 31/12/2025)
 * - Renta fija: 41.37% | Renta variable: 8.75%
 * 
 * Responsable MdF: Xavier Haro (xharo@mdffp.com)
 * Depositarios: Bankinter (SPA), UBS (SWI), Inversis (SPA)
 * Divisa: EUR
 * Fecha inicio: 30/04/2023
 * Código cartera: 1149.03 - BALDOMERO AR GRUPO
 * 
 * NOTE: This file documents the real patrimonio structure.
 * The actual data is already seeded in FinancialAccount/FinancialPosition tables.
 * This script can be used to verify and update if values drift.
 */

import { config } from 'dotenv';
config({ path: '.env.production' });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const VIDARO_ID = 'c65159283deeaf6815f8eda95';

async function main() {
  console.log('📊 Patrimonio Real del Grupo Vidaro (MdF Reporting 31/01/2026)\n');

  // Verify current DB state vs reporting
  const [inmobAgg, finAgg, peAgg, tesoAgg] = await Promise.all([
    prisma.unit.aggregate({ _sum: { valorMercado: true }, where: { building: { companyId: { in: await getGroupIds() }, isDemo: false } } }),
    prisma.financialPosition.aggregate({ _sum: { valorActual: true }, where: { account: { companyId: { in: await getGroupIds() } } } }),
    prisma.participation.aggregate({ _sum: { valorEstimado: true }, where: { companyId: { in: await getGroupIds() }, activa: true } }),
    prisma.financialAccount.aggregate({ _sum: { saldoActual: true }, where: { companyId: { in: await getGroupIds() }, activa: true } }),
  ]);

  const dbInmob = inmobAgg._sum.valorMercado || 0;
  const dbFin = finAgg._sum.valorActual || 0;
  const dbPE = peAgg._sum.valorEstimado || 0;
  const dbTeso = tesoAgg._sum.saldoActual || 0;
  const dbTotal = dbInmob + dbFin + dbPE + dbTeso;

  // MdF reported values
  const mdfTotal = 161584658;
  const mdfFinancieros = 55453302;
  const mdfRenta = 44743029;
  const mdfCrecimiento = 23797699;

  const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

  console.log('┌─────────────────────────────────────────────┐');
  console.log('│ COMPARATIVA: BD vs REPORTING MdF            │');
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│ Concepto          │ BD Actual    │ MdF Real  │`);
  console.log('├─────────────────────────────────────────────┤');
  console.log(`│ Total patrimonio  │ ${fmt(dbTotal).padStart(12)} │ ${fmt(mdfTotal).padStart(12)} │`);
  console.log(`│ Inmobiliario      │ ${fmt(dbInmob).padStart(12)} │ ${fmt(mdfRenta).padStart(12)} │`);
  console.log(`│ Financiero        │ ${fmt(dbFin).padStart(12)} │ ${fmt(mdfFinancieros).padStart(12)} │`);
  console.log(`│ PE/Participaciones│ ${fmt(dbPE).padStart(12)} │ ${fmt(mdfCrecimiento).padStart(12)} │`);
  console.log(`│ Tesorería         │ ${fmt(dbTeso).padStart(12)} │       -      │`);
  console.log('└─────────────────────────────────────────────┘');

  // Deviations
  const deviation = ((dbTotal - mdfTotal) / mdfTotal * 100).toFixed(1);
  console.log(`\n📈 Desviación total: ${deviation}%`);
  if (Math.abs(parseFloat(deviation)) > 10) {
    console.log('⚠️  Desviación significativa — revisar datos');
  } else {
    console.log('✅ Datos dentro del rango aceptable');
  }

  console.log('\n📋 Fuente: MdF Family Partners - Reporting Baldomero');
  console.log('   Responsable: Xavier Haro (xharo@mdffp.com)');
  console.log('   Depositarios: Bankinter, UBS, Inversis');
  console.log('   Código cartera: 1149.03 - BALDOMERO AR GRUPO');
  console.log('   Fecha informe: 31/01/2026');

  await prisma.$disconnect();
}

async function getGroupIds(): Promise<string[]> {
  const company = await prisma.company.findUnique({
    where: { id: VIDARO_ID },
    include: { childCompanies: { select: { id: true } } },
  });
  return company ? [company.id, ...company.childCompanies.map((c: any) => c.id)] : [VIDARO_ID];
}

main().catch((e) => {
  console.error('Error:', e);
  prisma.$disconnect();
  process.exit(1);
});
