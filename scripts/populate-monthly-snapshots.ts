/**
 * Populate MonthlySnapshot table from downloaded DiliTrust reporting PDFs.
 * Processes all AF, AR, and AMPER reports to create historical monthly data.
 *
 * Usage:
 *   npx tsx scripts/populate-monthly-snapshots.ts
 *   npx tsx scripts/populate-monthly-snapshots.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const prisma = new PrismaClient();
const isDryRun = process.argv.includes('--dry-run');
const DOCS_DIR = path.join(process.cwd(), 'data/dilitrust-docs');

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

async function getCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({
    where: { OR: [
      { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
      { nombre: { contains: 'Baldomero', mode: 'insensitive' } },
    ]},
    select: { id: true, nombre: true },
  });
  if (!company) throw new Error('Vidaro company not found');
  log(`Company: ${company.nombre} (${company.id})`);
  return company.id;
}

function findReportingPdfs(): string[] {
  const patterns = [
    'Operativa MdF_Reporting_*/*.pdf',
    'Operativa MdF_Houseview/*.pdf',
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = glob.sync(path.join(DOCS_DIR, pattern));
    files.push(...matches);
  }

  return files
    .filter(f => {
      const fn = path.basename(f).toLowerCase();
      return fn.includes('reporting') || fn.includes('mifid');
    })
    .sort();
}

async function processReport(filePath: string, companyId: string): Promise<boolean> {
  try {
    const buffer = fs.readFileSync(filePath);
    const { parseMdfReporting } = await import('../lib/parsers/mdf-reporting-parser');
    const report = await parseMdfReporting(buffer);

    if (!report.reportDate || !report.summary.totalValue) {
      return false;
    }

    const reportDate = new Date(report.reportDate);
    reportDate.setUTCHours(0, 0, 0, 0);

    // Extract asset allocation values from the allocation data
    let monetario = 0, rentaFija = 0, rentaVariable = 0, commodities = 0, alternativos = 0;
    let targetMonetario: number | null = null;
    let targetRentaFija: number | null = null;
    let targetRentaVariable: number | null = null;

    for (const a of report.assetAllocation) {
      const name = a.category.toLowerCase();
      if (name.includes('monetario')) {
        monetario = a.value;
        if (a.target) targetMonetario = a.target;
      }
      else if (name.includes('renta fija') || name === 'renta fija') {
        rentaFija = a.value;
        if (a.target) targetRentaFija = a.target;
      }
      else if (name.includes('renta variable') || name === 'renta variable') {
        rentaVariable = a.value;
        if (a.target) targetRentaVariable = a.target;
      }
      else if (name.includes('commodit')) commodities = a.value;
      else if (name.includes('alternativ')) alternativos = a.value;
    }

    // If allocation values are zero, estimate from portfolio total and weights
    if (monetario === 0 && rentaFija === 0 && report.summary.totalValue > 0) {
      for (const a of report.assetAllocation) {
        const name = a.category.toLowerCase();
        if (a.weight > 0) {
          const val = (a.weight / 100) * report.summary.totalValue;
          if (name.includes('monetario')) monetario = val;
          else if (name.includes('renta fija') || name === 'renta fija') rentaFija = val;
          else if (name.includes('renta variable') || name === 'renta variable') rentaVariable = val;
          else if (name.includes('commodit')) commodities = val;
          else if (name.includes('alternativ')) alternativos = val;
        }
      }
    }

    // Extract performance data
    let returnYtd: number | null = null;
    let returnSinceInception: number | null = null;
    let annualizedReturn: number | null = null;
    let return2023: number | null = null;
    let return2024: number | null = null;
    let return2025: number | null = null;
    let volatility12m: number | null = null;
    let sharpeRatio: number | null = null;

    for (const p of report.performance) {
      if (p.portfolio.includes('AF GRUPO') || p.portfolio.includes('AR GRUPO') || p.portfolio.includes('AMPER')) {
        returnYtd = p.ytd || null;
        returnSinceInception = p.sinceInception || null;
        annualizedReturn = p.annualized || null;
        return2023 = p.year2023 || null;
        return2024 = p.year2024 || null;
        return2025 = p.year2025 || null;
        volatility12m = p.volatility12m || null;
        sharpeRatio = p.sharpeRatio || null;
        break;
      }
    }

    // Custodian breakdown
    const custodianBreakdown = report.custodians.length > 0
      ? report.custodians.map(c => ({
          custodian: c.custodian,
          total: c.total,
          pnl: c.netPnl,
          deposits: c.deposits,
          previousValue: c.previousValue,
        }))
      : null;

    const snapshotData = {
      companyId,
      portfolioCode: report.portfolioCode || (report.reportType === 'AF' ? '1149.01' : report.reportType === 'AR' ? '1149.03' : '1142.09'),
      portfolioName: report.portfolioName,
      reportDate,
      reportType: report.reportType,
      totalValue: report.summary.totalValue,
      previousValue: report.summary.previousValue,
      deposits: report.summary.deposits,
      netPnl: report.summary.netPnl,
      fees: report.summary.fees,
      monetario,
      rentaFija,
      rentaVariable,
      commodities,
      alternativos,
      targetMonetario,
      targetRentaFija,
      targetRentaVariable,
      returnYtd,
      returnSinceInception,
      annualizedReturn,
      return2023,
      return2024,
      return2025,
      volatility12m,
      sharpeRatio,
      custodianBreakdown: custodianBreakdown as any,
      feeBreakdown: null,
      sourceFileName: path.basename(filePath),
    };

    if (isDryRun) {
      log(`  [DRY] ${report.reportType} ${report.reportDate}: €${report.summary.totalValue.toLocaleString()}`);
      return true;
    }

    await prisma.monthlySnapshot.upsert({
      where: {
        companyId_portfolioCode_reportDate: {
          companyId: snapshotData.companyId,
          portfolioCode: snapshotData.portfolioCode,
          reportDate: snapshotData.reportDate,
        },
      },
      create: snapshotData,
      update: snapshotData,
    });

    return true;
  } catch (err: any) {
    log(`  ERROR: ${path.basename(filePath)}: ${err.message}`);
    return false;
  }
}

async function main() {
  log('='.repeat(60));
  log(`Populate Monthly Snapshots ${isDryRun ? '(DRY RUN)' : ''}`);
  log('='.repeat(60));

  const companyId = await getCompanyId();
  const pdfs = findReportingPdfs();
  log(`Found ${pdfs.length} reporting PDFs`);

  let success = 0;
  let failed = 0;

  for (const pdf of pdfs) {
    const fn = path.basename(pdf);
    const ok = await processReport(pdf, companyId);
    if (ok) {
      success++;
    } else {
      failed++;
      log(`  SKIP: ${fn} (no data extracted)`);
    }
  }

  log(`\n${'='.repeat(60)}`);
  log(`Complete: ${success} snapshots created/updated, ${failed} skipped`);
  log('='.repeat(60));
}

main()
  .catch(err => { console.error('Fatal:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
