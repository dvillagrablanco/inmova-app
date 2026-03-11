// @ts-nocheck
/**
 * Parser for accounting analytics mapping Excel.
 * Structure: Row 1 = company + headers, Row 2 = Cuenta, Título, Largo, Empresa + paired month columns (date, empty).
 * Each month has 2 columns: centro_coste_code, centro_coste_description.
 */

import logger from '@/lib/logger';

export interface CostCenterMapping {
  cuenta: string;
  titulo: string;
  largo: number;
  empresa: string;
  epigrafe: string;
  epigrafeDesc: string;
  monthlyMappings: Map<string, { code: string; description: string }>;
}

export interface AnalyticsMappingResult {
  company: string;
  mappings: CostCenterMapping[];
  months: string[];
  totalAccounts: number;
}

const MONTH_PATTERN = /(\d{4})[-]?(\d{2})/;

function parseEuropeanNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const s = String(val).trim();
  const cleaned = s.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function extractMonthFromHeader(cell: string): string | null {
  const s = String(cell || '').trim();
  const m = s.match(MONTH_PATTERN);
  if (m) return `${m[1]}-${m[2]}`;
  return null;
}

export async function parseAnalyticsMapping(buffer: Buffer): Promise<AnalyticsMappingResult> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: '',
  }) as unknown[][];

  if (!sheet || sheet.length < 2) {
    logger.warn('[Analytics Mapping] Sheet too small');
    return {
      company: '',
      mappings: [],
      months: [],
      totalAccounts: 0,
    };
  }

  const row0 = sheet[0] || [];
  const row1 = sheet[1] || [];

  let company = '';
  const firstCell = String(row0[0] ?? '').trim();
  if (firstCell) company = firstCell;

  // Find fixed columns: Cuenta (0), Título (1), Largo (2), Empresa (3)
  const colCuenta = 0;
  const colTitulo = 1;
  const colLargo = 2;
  const colEmpresa = 3;

  // From column 4 onwards: paired columns per month (code, description)
  const monthColumns: { month: string; codeCol: number; descCol: number }[] = [];
  let c = 4;
  while (c < row1.length) {
    const headerCell = String(row1[c] ?? '').trim();
    const month =
      extractMonthFromHeader(headerCell) || extractMonthFromHeader(String(row0[c] ?? ''));
    if (month) {
      monthColumns.push({ month, codeCol: c, descCol: c + 1 });
      c += 2;
    } else {
      c++;
    }
  }

  // If no months found in row1, try row0
  if (monthColumns.length === 0) {
    for (let i = 4; i < row0.length; i += 2) {
      const m = extractMonthFromHeader(String(row0[i] ?? ''));
      if (m) monthColumns.push({ month: m, codeCol: i, descCol: i + 1 });
    }
  }

  const months = [...new Set(monthColumns.map((mc) => mc.month))].sort();

  const mappings: CostCenterMapping[] = [];

  for (let r = 2; r < sheet.length; r++) {
    const row = sheet[r] || [];
    const cuenta = String(row[colCuenta] ?? '').trim();
    if (!cuenta || cuenta.length < 3) continue;

    const titulo = String(row[colTitulo] ?? '').trim();
    const largo = parseEuropeanNumber(row[colLargo]) || cuenta.length;
    const empresa = String(row[colEmpresa] ?? '').trim();

    const monthlyMappings = new Map<string, { code: string; description: string }>();

    for (const mc of monthColumns) {
      const code = String(row[mc.codeCol] ?? '').trim();
      const desc = String(row[mc.descCol] ?? '').trim();
      if (code || desc) {
        monthlyMappings.set(mc.month, { code, description: desc });
      }
    }

    mappings.push({
      cuenta,
      titulo,
      largo: Math.round(largo),
      empresa,
      epigrafe: '',
      epigrafeDesc: titulo,
      monthlyMappings,
    });
  }

  logger.info(
    `[Analytics Mapping] Parsed ${mappings.length} accounts, ${months.length} months for ${company}`
  );

  return {
    company,
    mappings,
    months,
    totalAccounts: mappings.length,
  };
}

/**
 * Find the cost center for a given account and month.
 * Tries exact match first, then prefix match for parent accounts.
 */
export function getCostCenter(
  mappings: CostCenterMapping[],
  cuenta: string,
  month: string
): { code: string; description: string } | null {
  const normalizedCuenta = cuenta.trim();
  if (!normalizedCuenta) return null;

  // Exact match
  const exact = mappings.find((m) => m.cuenta === normalizedCuenta);
  if (exact) {
    const mm = exact.monthlyMappings.get(month);
    if (mm && (mm.code || mm.description)) return mm;
    // Try nearest month
    const sortedMonths = [...exact.monthlyMappings.keys()].sort();
    const idx = sortedMonths.findIndex((m) => m >= month);
    const fallbackMonth = idx >= 0 ? sortedMonths[idx] : sortedMonths[sortedMonths.length - 1];
    if (fallbackMonth) {
      const mm = exact.monthlyMappings.get(fallbackMonth);
      if (mm) return mm;
    }
  }

  // Prefix match (parent account)
  const candidates = mappings
    .filter((m) => normalizedCuenta.startsWith(m.cuenta) || m.cuenta.startsWith(normalizedCuenta))
    .sort((a, b) => b.cuenta.length - a.cuenta.length);

  for (const c of candidates) {
    const mm = c.monthlyMappings.get(month);
    if (mm && (mm.code || mm.description)) return mm;
  }

  return null;
}
