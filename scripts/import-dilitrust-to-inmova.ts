/**
 * Import DiliTrust documents into Inmova — updates Grupo Vidaro financial data.
 *
 * Processes all downloaded PDFs:
 *   - Reporting AF/AR/Amper → FinancialAccount + FinancialPosition
 *   - Capital Calls → Participation updates (calledCapital, pendingCalls)
 *   - Distributions → Participation updates (distributions)
 *
 * Usage:
 *   npx tsx scripts/import-dilitrust-to-inmova.ts
 *   npx tsx scripts/import-dilitrust-to-inmova.ts --latest-only
 *   npx tsx scripts/import-dilitrust-to-inmova.ts --dry-run
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const DOCS_DIR = path.join(process.cwd(), 'data/dilitrust-docs');
const INVENTORY_FILE = path.join(process.cwd(), 'data/dilitrust-inventory.json');

const isDryRun = process.argv.includes('--dry-run');
const latestOnly = process.argv.includes('--latest-only');

interface ImportStats {
  reportsProcessed: number;
  positionsUpdated: number;
  accountsUpdated: number;
  participationsUpdated: number;
  capitalCallsProcessed: number;
  distributionsProcessed: number;
  errors: string[];
}

const stats: ImportStats = {
  reportsProcessed: 0,
  positionsUpdated: 0,
  accountsUpdated: 0,
  participationsUpdated: 0,
  capitalCallsProcessed: 0,
  distributionsProcessed: 0,
  errors: [],
};

function log(msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

function parseEuropeanNumber(str: string): number {
  if (!str || str.trim() === '-') return 0;
  return parseFloat(str.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}

// ---------------------------------------------------------------------------
// Find Vidaro company
// ---------------------------------------------------------------------------
async function getVidaroCompanyId(): Promise<string> {
  const company = await prisma.company.findFirst({
    where: {
      OR: [
        { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
        { nombre: { contains: 'Baldomero', mode: 'insensitive' } },
      ],
    },
    select: { id: true, nombre: true },
  });

  if (!company) {
    throw new Error('Company Vidaro not found in database. Run seed script first.');
  }

  log(`Company: ${company.nombre} (${company.id})`);
  return company.id;
}

// ---------------------------------------------------------------------------
// Custodian → FinancialAccount mapping
// ---------------------------------------------------------------------------
const CUSTODIAN_MAP: Record<string, { entidad: string; tipoEntidad: string; alias: string }> = {
  INVERSIS: { entidad: 'Inversis', tipoEntidad: 'banca_privada', alias: 'Baldomero Inversis' },
  PICTET: { entidad: 'Pictet', tipoEntidad: 'gestora_fondos', alias: 'Baldomero Pictet' },
  'BANCA MARCH': { entidad: 'Banca March', tipoEntidad: 'banca_privada', alias: 'Baldomero Banca March' },
  CACEIS: { entidad: 'CACEIS', tipoEntidad: 'custodio', alias: 'Baldomero CACEIS' },
  BANKINTER: { entidad: 'Bankinter', tipoEntidad: 'banca_comercial', alias: 'Baldomero Bankinter' },
  UBS: { entidad: 'UBS', tipoEntidad: 'banca_privada', alias: 'Baldomero UBS' },
  CAIXABANK: { entidad: 'CaixaBank', tipoEntidad: 'banca_comercial', alias: 'Baldomero CaixaBank' },
};

async function getOrCreateAccount(
  companyId: string,
  custodian: string,
): Promise<string> {
  const config = CUSTODIAN_MAP[custodian.toUpperCase()] || {
    entidad: custodian,
    tipoEntidad: 'otro_financiero',
    alias: `Baldomero ${custodian}`,
  };

  let account = await prisma.financialAccount.findFirst({
    where: {
      companyId,
      entidad: config.entidad,
    },
    select: { id: true },
  });

  if (!account) {
    if (isDryRun) {
      log(`  [DRY RUN] Would create account: ${config.alias}`);
      return 'dry-run-id';
    }
    account = await prisma.financialAccount.create({
      data: {
        companyId,
        entidad: config.entidad,
        tipoEntidad: config.tipoEntidad as any,
        alias: config.alias,
        divisa: 'EUR',
        conexionTipo: 'ocr_pdf',
        activa: true,
      },
      select: { id: true },
    });
    log(`  Created account: ${config.alias}`);
    stats.accountsUpdated++;
  }

  return account.id;
}

// ---------------------------------------------------------------------------
// Map position type
// ---------------------------------------------------------------------------
function mapPositionType(type: string): string {
  const map: Record<string, string> = {
    monetario: 'fondo_inversion',
    renta_fija: 'bono',
    renta_variable: 'accion',
    commodities: 'etf',
    alternativos: 'fondo_inversion',
    tesoreria: 'cuenta_corriente',
    pe_fund: 'pe_fund',
  };
  return map[type] || 'otro_instrumento';
}

// ---------------------------------------------------------------------------
// Process a single reporting PDF
// ---------------------------------------------------------------------------
async function processReportingPdf(filePath: string, companyId: string) {
  try {
    const buffer = fs.readFileSync(filePath);

    // Dynamic import of the parser
    const { parseMdfReporting } = await import('../lib/parsers/mdf-reporting-parser');
    const report = await parseMdfReporting(buffer);

    if (!report.reportDate) {
      stats.errors.push(`No date found in ${path.basename(filePath)}`);
      return;
    }

    log(`  ${report.reportType} ${report.reportDate}: ${report.portfolioName}`);
    log(`    Value: €${report.summary.totalValue.toLocaleString()}, P&L: €${report.summary.netPnl.toLocaleString()}`);
    log(`    Positions: ${report.positions.length}, PE: ${report.pePositions.length}`);

    if (isDryRun) {
      stats.reportsProcessed++;
      return;
    }

    // Update positions by custodian
    for (const custodian of report.custodians) {
      const accountId = await getOrCreateAccount(companyId, custodian.custodian);

      await prisma.financialAccount.update({
        where: { id: accountId },
        data: {
          saldoActual: custodian.total,
          valorMercado: custodian.total,
          pnlTotal: custodian.netPnl,
          ultimaSync: new Date(report.reportDate),
        },
      });
      stats.accountsUpdated++;
    }

    // Upsert individual positions
    for (const pos of report.positions) {
      if (!pos.isin || pos.currentValue === 0) continue;

      const custodianName = pos.custodian || 'CACEIS';
      const accountId = await getOrCreateAccount(companyId, custodianName);

      const existing = await prisma.financialPosition.findFirst({
        where: { accountId, isin: pos.isin },
        select: { id: true },
      });

      const posData = {
        nombre: pos.name,
        isin: pos.isin,
        tipo: mapPositionType(pos.type) as any,
        categoria: pos.subcategory || pos.type,
        cantidad: pos.quantity || 0,
        precioMedio: pos.price || 0,
        valorActual: pos.currentValue,
        divisa: pos.currency,
        costeTotal: pos.costBasis || 0,
        pnlNoRealizado: pos.pnl || 0,
        pnlPct: pos.pnlPct || 0,
        peso: pos.weight,
        ultimaActualizacion: new Date(report.reportDate),
        return12m: pos.return12m || null,
        returnYtd: pos.returnYtd || null,
        portfolioCode: report.portfolioCode || null,
        custodian: pos.custodian || custodianName,
      };

      if (existing) {
        await prisma.financialPosition.update({
          where: { id: existing.id },
          data: posData,
        });
      } else {
        await prisma.financialPosition.create({
          data: { accountId, ...posData },
        });
      }
      stats.positionsUpdated++;
    }

    // Upsert PE positions as Participations
    for (const pe of report.pePositions) {
      const existing = await prisma.participation.findFirst({
        where: {
          companyId,
          targetCompanyName: { contains: pe.shortName, mode: 'insensitive' },
        },
        select: { id: true },
      });

      const peData = {
        compromisoTotal: pe.commitment,
        capitalLlamado: pe.calledCapital,
        capitalPendiente: pe.pendingCalls,
        capitalDistribuido: pe.distributions,
        valoracionActual: pe.currentValue,
        tvpi: pe.tvpiMultiple,
        anoCompromiso: pe.vintageYear,
        fechaUltimaValoracion: new Date(report.reportDate),
      };

      if (existing) {
        await prisma.participation.update({
          where: { id: existing.id },
          data: peData,
        });
      } else {
        await prisma.participation.create({
          data: {
            companyId,
            targetCompanyName: pe.fundName,
            tipo: 'pe_fund',
            porcentaje: 0,
            fechaAdquisicion: new Date(`${pe.vintageYear}-01-01`),
            vehiculoInversor: pe.fundName.includes('VIBLA') ? 'Vibla SCR' : 'Vidaro Inversiones',
            gestora: 'MdF Gestefin',
            ...peData,
          },
        });
      }
      stats.participationsUpdated++;
    }

    stats.reportsProcessed++;
  } catch (err: any) {
    stats.errors.push(`Error processing ${path.basename(filePath)}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Process Capital Call / Distribution PDF
// ---------------------------------------------------------------------------
async function processCapitalCallPdf(filePath: string, companyId: string) {
  try {
    const buffer = fs.readFileSync(filePath);
    const { parseMdfCapitalCall } = await import('../lib/parsers/mdf-reporting-parser');
    const call = await parseMdfCapitalCall(buffer);

    if (!call) return;

    const isCC = !call.isDistribution;
    log(`  ${isCC ? 'Capital Call' : 'Distribution'}: ${call.fundName}`);
    log(`    Amount: €${call.calledAmount.toLocaleString()}, Commitment: €${call.commitment.toLocaleString()}`);

    if (isDryRun) {
      if (isCC) stats.capitalCallsProcessed++;
      else stats.distributionsProcessed++;
      return;
    }

    // Find matching participation
    const fundNameClean = call.fundName.replace(/,?\s*S\.?C\.?R\.?.*$/i, '').trim();
    const participation = await prisma.participation.findFirst({
      where: {
        companyId,
        targetCompanyName: { contains: fundNameClean.substring(0, 20), mode: 'insensitive' },
      },
    });

    if (participation) {
      const updateData: any = {};

      if (call.cumulativeCalledAmount > 0) {
        updateData.capitalLlamado = call.cumulativeCalledAmount;
      }
      if (call.pendingCapital > 0) {
        updateData.capitalPendiente = call.pendingCapital;
      }
      if (call.cumulativeDistributions > 0) {
        updateData.capitalDistribuido = call.cumulativeDistributions;
      }
      if (call.commitment > 0) {
        updateData.compromisoTotal = call.commitment;
      }

      updateData.fechaUltimaValoracion = new Date();

      await prisma.participation.update({
        where: { id: participation.id },
        data: updateData,
      });

      if (isCC) stats.capitalCallsProcessed++;
      else stats.distributionsProcessed++;
    } else {
      log(`    WARNING: No matching participation found for "${fundNameClean}"`);
    }
  } catch (err: any) {
    stats.errors.push(`Error processing CC ${path.basename(filePath)}: ${err.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  log('='.repeat(60));
  log(`DiliTrust → Inmova Import ${isDryRun ? '(DRY RUN)' : ''}`);
  log('='.repeat(60));

  const companyId = await getVidaroCompanyId();

  // Load inventory
  if (!fs.existsSync(INVENTORY_FILE)) {
    log('ERROR: No inventory file found. Run dilitrust-sync.py first.');
    return;
  }

  const inventory: Array<{ id: string; filename: string; folder_path: string; url: string }> =
    JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));

  log(`Inventory: ${inventory.length} documents`);

  // Sort by date (newest first for latest-only)
  const sortedDocs = [...inventory].sort((a, b) => b.filename.localeCompare(a.filename));

  // Categorize documents
  const reportings: string[] = [];
  const capitalCalls: string[] = [];
  const distributions: string[] = [];
  const presentations: string[] = [];
  const other: string[] = [];

  for (const doc of sortedDocs) {
    const fn = doc.filename.toLowerCase();
    const folderPath = doc.folder_path;

    // Build file path
    const sanitizedFolder = folderPath.replace(/\//g, '_');
    const possiblePaths = [
      path.join(DOCS_DIR, sanitizedFolder, doc.filename),
      path.join(DOCS_DIR, folderPath.replace(/\//g, path.sep), doc.filename),
    ];

    let filePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      // Try finding by filename across all subdirs
      const found = findFile(DOCS_DIR, doc.filename);
      if (found) filePath = found;
    }

    if (!filePath) continue;

    if (fn.includes('reporting') || fn.includes('mifid')) {
      reportings.push(filePath);
    } else if (fn.includes('call') || fn.includes('desembolso')) {
      capitalCalls.push(filePath);
    } else if (fn.includes('distr') || fn.includes('distribution')) {
      distributions.push(filePath);
    } else if (fn.includes('presentación') || fn.includes('presentacion') || fn.includes('houseview')) {
      presentations.push(filePath);
    } else {
      other.push(filePath);
    }
  }

  log(`\nCategorized:`);
  log(`  Reportings: ${reportings.length}`);
  log(`  Capital Calls: ${capitalCalls.length}`);
  log(`  Distributions: ${distributions.length}`);
  log(`  Presentations: ${presentations.length}`);
  log(`  Other: ${other.length}`);

  // Process most recent reporting of each type
  log('\n--- Processing Reportings ---');

  const processedTypes = new Set<string>();
  for (const filePath of reportings) {
    const fn = path.basename(filePath).toLowerCase();

    let reportKey = '';
    if (fn.includes('amper') && fn.includes('mifid')) reportKey = 'amper_mifid';
    else if (fn.includes('af') && fn.includes('mifid')) reportKey = 'af_mifid';
    else if (fn.includes('ar') && fn.includes('mifid')) reportKey = 'ar_mifid';
    else if (fn.includes('amper')) reportKey = 'amper';
    else if (fn.includes(' af') || fn.includes('_af') || fn.includes(' af.')) reportKey = 'af';
    else if (fn.includes(' ar') || fn.includes('_ar') || fn.includes(' ar.')) reportKey = 'ar';
    else reportKey = fn;

    if (latestOnly && processedTypes.has(reportKey)) continue;
    processedTypes.add(reportKey);

    await processReportingPdf(filePath, companyId);
  }

  // Process capital calls
  log('\n--- Processing Capital Calls ---');
  for (const filePath of capitalCalls) {
    await processCapitalCallPdf(filePath, companyId);
  }

  // Process distributions
  log('\n--- Processing Distributions ---');
  for (const filePath of distributions) {
    await processCapitalCallPdf(filePath, companyId);
  }

  // Summary
  log('\n' + '='.repeat(60));
  log('Import Summary:');
  log(`  Reports processed: ${stats.reportsProcessed}`);
  log(`  Accounts updated: ${stats.accountsUpdated}`);
  log(`  Positions updated: ${stats.positionsUpdated}`);
  log(`  Participations updated: ${stats.participationsUpdated}`);
  log(`  Capital Calls processed: ${stats.capitalCallsProcessed}`);
  log(`  Distributions processed: ${stats.distributionsProcessed}`);
  if (stats.errors.length > 0) {
    log(`  Errors (${stats.errors.length}):`);
    for (const err of stats.errors) {
      log(`    - ${err}`);
    }
  }
  log('='.repeat(60));
}

function findFile(dir: string, filename: string): string | null {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findFile(fullPath, filename);
        if (found) return found;
      } else if (entry.name === filename) {
        return fullPath;
      }
    }
  } catch { }
  return null;
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
