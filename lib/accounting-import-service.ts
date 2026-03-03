/**
 * Orchestrates accounting parsers and applies the Auxiliar1 override rule.
 * Cost center resolution: auxiliar1 > analytics mapping > default (OTHER).
 */

import logger from '@/lib/logger';
import {
  parseAccountingJournal,
  type AccountingJournal,
  type AccountingEntry,
} from './parsers/accounting-journal-parser';
import {
  parseAnalyticsMapping,
  type AnalyticsMappingResult,
  getCostCenter,
} from './parsers/analytics-mapping-parser';

export type CostCenterCategory = 'DIR' | 'CDI' | 'DF-GEN' | 'DI-COGE' | 'OTHER';
export type CompanyCode = 'VID' | 'ROV' | 'VIR' | 'VIBLA';

export interface ImportedEntry extends AccountingEntry {
  costCenter: string;
  costCenterDescription: string;
  costCenterCategory: CostCenterCategory;
  costCenterSource: 'auxiliar1' | 'mapping' | 'default';
  company: CompanyCode;
}

export interface ImportResult {
  success: boolean;
  company: string;
  totalEntries: number;
  entriesProcessed: number;
  entriesWithAuxiliar1Override: number;
  entriesFromMapping: number;
  entriesDefault: number;
  errors: string[];
  summary: {
    totalDebe: number;
    totalHaber: number;
    byCostCenter: Record<string, { debe: number; haber: number; count: number }>;
    byCategory: Record<CostCenterCategory, { debe: number; haber: number; count: number }>;
  };
}

/**
 * Categorize cost center code into categories.
 * DIR = direct property costs
 * CDI = administration costs allocated to properties
 * DF-GEN = financial direction general
 * DI-COGE = general management
 */
export function categorizeCostCenter(code: string): CostCenterCategory {
  const upper = (code || '').toUpperCase().trim();
  if (!upper) return 'OTHER';
  if (upper.startsWith('DIR') || /^DIR\b/.test(upper)) return 'DIR';
  if (upper.startsWith('CDI') || /^CDI\b/.test(upper)) return 'CDI';
  if (upper.startsWith('DF-GEN') || /^DFGEN/i.test(upper)) return 'DF-GEN';
  if (upper.startsWith('DI-COGE') || /^DICOGE/i.test(upper)) return 'DI-COGE';
  return 'OTHER';
}

/**
 * Map company name from journal header to company code.
 */
export function detectCompanyCode(companyName: string): CompanyCode {
  const name = (companyName || '').toLowerCase();
  if (name.includes('vidaro')) return 'VID';
  if (name.includes('rovida')) return 'ROV';
  if (name.includes('viroda')) return 'VIR';
  if (name.includes('vibla')) return 'VIBLA';
  return 'VID';
}

/**
 * Get month string from entry date for mapping lookup.
 */
function getMonthFromEntry(entry: AccountingEntry): string {
  if (entry.fecha) {
    const d = entry.fecha instanceof Date ? entry.fecha : new Date(entry.fecha);
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
  }
  return '';
}

/**
 * Import journal with cost center mapping.
 * For each entry:
 * a. If auxiliar1 has value → use as cost center (source: 'auxiliar1')
 * b. Else if mapping exists for subcuenta + month → use mapping (source: 'mapping')
 * c. Else → mark as 'OTHER' (source: 'default')
 */
export async function importJournalWithMapping(
  journalBuffer: Buffer,
  mappingResult?: AnalyticsMappingResult
): Promise<ImportResult> {
  const errors: string[] = [];
  const byCostCenter: Record<string, { debe: number; haber: number; count: number }> = {};
  const byCategory: Record<CostCenterCategory, { debe: number; haber: number; count: number }> = {
    DIR: { debe: 0, haber: 0, count: 0 },
    CDI: { debe: 0, haber: 0, count: 0 },
    'DF-GEN': { debe: 0, haber: 0, count: 0 },
    'DI-COGE': { debe: 0, haber: 0, count: 0 },
    OTHER: { debe: 0, haber: 0, count: 0 },
  };

  let journal: AccountingJournal;
  try {
    journal = await parseAccountingJournal(journalBuffer);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`Failed to parse journal: ${msg}`);
    logger.error('[Accounting Import] Journal parse failed', e);
    return {
      success: false,
      company: 'Unknown',
      totalEntries: 0,
      entriesProcessed: 0,
      entriesWithAuxiliar1Override: 0,
      entriesFromMapping: 0,
      entriesDefault: 0,
      errors,
      summary: {
        totalDebe: 0,
        totalHaber: 0,
        byCostCenter: {},
        byCategory,
      },
    };
  }

  const company = detectCompanyCode(journal.company);
  const mappings = mappingResult?.mappings ?? [];
  let entriesWithAuxiliar1Override = 0;
  let entriesFromMapping = 0;
  let entriesDefault = 0;

  const inc = (key: string, category: CostCenterCategory, debe: number, haber: number) => {
    if (!byCostCenter[key]) byCostCenter[key] = { debe: 0, haber: 0, count: 0 };
    byCostCenter[key].debe += debe;
    byCostCenter[key].haber += haber;
    byCostCenter[key].count += 1;
    byCategory[category].debe += debe;
    byCategory[category].haber += haber;
    byCategory[category].count += 1;
  };

  for (const entry of journal.entries) {
    let costCenter = '';
    let costCenterDescription = '';
    let source: ImportedEntry['costCenterSource'] = 'default';

    if (entry.auxiliar1 && entry.auxiliar1.trim()) {
      costCenter = entry.auxiliar1.trim();
      costCenterDescription = entry.auxiliar1.trim();
      source = 'auxiliar1';
      entriesWithAuxiliar1Override++;
    } else if (mappings.length > 0) {
      const month = getMonthFromEntry(entry);
      const mapping = getCostCenter(mappings, entry.subcuenta, month);
      if (mapping && (mapping.code || mapping.description)) {
        costCenter = mapping.code || mapping.description;
        costCenterDescription = mapping.description || mapping.code;
        source = 'mapping';
        entriesFromMapping++;
      } else {
        costCenter = 'OTHER';
        costCenterDescription = 'Sin asignar';
        entriesDefault++;
      }
    } else {
      costCenter = 'OTHER';
      costCenterDescription = 'Sin asignar';
      entriesDefault++;
    }

    const category = categorizeCostCenter(costCenter);
    inc(costCenter, category, entry.debe, entry.haber);
  }

  logger.info(
    `[Accounting Import] ${journal.entries.length} entries, auxiliar1: ${entriesWithAuxiliar1Override}, mapping: ${entriesFromMapping}, default: ${entriesDefault}`
  );

  return {
    success: errors.length === 0,
    company: journal.company,
    totalEntries: journal.entries.length,
    entriesProcessed: journal.entries.length,
    entriesWithAuxiliar1Override,
    entriesFromMapping,
    entriesDefault,
    errors,
    summary: {
      totalDebe: journal.totalDebe,
      totalHaber: journal.totalHaber,
      byCostCenter,
      byCategory,
    },
  };
}
