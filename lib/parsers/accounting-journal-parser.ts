// @ts-nocheck
/**
 * Parser for DF's accounting journal Excel files (Vidaro, Rovida, Viroda diarios).
 * Structure: Row 1 = header with company, Row 2 = date range, Row 3 = empty, Row 4 = column headers, Row 5+ = data.
 */

import logger from '@/lib/logger';

export interface AccountingEntry {
  subcuenta: string;
  tituloSubcuenta: string;
  fecha: Date | null;
  asiento: string;
  apunte: string;
  factura: string;
  contrapartida: string;
  concepto: string;
  debe: number;
  haber: number;
  saldo: number;
  auxiliar1: string;
  isSaldoAnterior: boolean;
}

export interface AccountingJournal {
  company: string;
  dateRange: { from: string; to: string };
  entries: AccountingEntry[];
  totalEntries: number;
  totalDebe: number;
  totalHaber: number;
}

const HEADER_ROW = 4; // 0-based: row index 4 = 5th row
const EXPECTED_HEADERS = [
  'subcuenta',
  'título de subcuenta',
  'titulo de subcuenta',
  'fecha',
  'asiento',
  'apunte',
  'factura',
  'contrapartida',
  'concepto',
  'debe',
  'haber',
  'saldo',
  'auxiliar1',
];

function parseEuropeanNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  const s = String(val).trim();
  if (s === '-' || s === '') return 0;
  const cleaned = s.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseExcelDate(val: unknown): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) return val;
  const s = String(val).trim();
  if (!s) return null;
  // Excel serial number
  const num = parseFloat(s);
  if (!isNaN(num) && num > 0) {
    const epoch = new Date(1899, 11, 30);
    const d = new Date(epoch.getTime() + num * 86400000);
    return isNaN(d.getTime()) ? null : d;
  }
  // DD/MM/YYYY
  const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) {
    const [, day, month, year] = m;
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function extractCompanyFromHeader(row1: string): string {
  const vidaro = /Vidaro|VIDARO/i;
  const rovida = /Rovida|ROVIDA/i;
  const viroda = /Viroda|VIRODA/i;
  if (vidaro.test(row1)) return 'Vidaro';
  if (rovida.test(row1)) return 'Rovida';
  if (viroda.test(row1)) return 'Viroda';
  return 'Unknown';
}

function extractDateRange(row2: string): { from: string; to: string } {
  const match = row2.match(
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s*[-–a]\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i
  );
  if (match) {
    const parse = (s: string) => {
      const m =
        s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/) ||
        s.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (m) {
        const [, a, b, c] = m;
        if (parseInt(a, 10) > 31) return `${a}-${b!.padStart(2, '0')}-${c!.padStart(2, '0')}`;
        return `${c}-${b!.padStart(2, '0')}-${a!.padStart(2, '0')}`;
      }
      return s;
    };
    return { from: parse(match[1]), to: parse(match[2]) };
  }
  return { from: '', to: '' };
}

function findHeaderIndices(sheet: unknown[][]): Record<string, number> {
  const indices: Record<string, number> = {};
  const row = sheet[HEADER_ROW] || [];
  for (let c = 0; c < row.length; c++) {
    const cell = String(row[c] || '')
      .toLowerCase()
      .trim();
    if (cell.includes('subcuenta') && !indices.subcuenta) indices.subcuenta = c;
    if ((cell.includes('título') || cell.includes('titulo')) && cell.includes('subcuenta'))
      indices.tituloSubcuenta = c;
    if (cell === 'fecha') indices.fecha = c;
    if (cell === 'asiento') indices.asiento = c;
    if (cell === 'apunte') indices.apunte = c;
    if (cell === 'factura') indices.factura = c;
    if (cell === 'contrapartida') indices.contrapartida = c;
    if (cell === 'concepto') indices.concepto = c;
    if (cell === 'debe') indices.debe = c;
    if (cell === 'haber') indices.haber = c;
    if (cell === 'saldo') indices.saldo = c;
    if (cell === 'auxiliar1') indices.auxiliar1 = c;
  }
  return indices;
}

export async function parseAccountingJournal(buffer: Buffer): Promise<AccountingJournal> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    header: 1,
    raw: false,
    defval: '',
  }) as unknown[][];

  if (!sheet || sheet.length < HEADER_ROW + 1) {
    logger.warn('[Accounting Journal] Sheet too small or empty');
    return {
      company: 'Unknown',
      dateRange: { from: '', to: '' },
      entries: [],
      totalEntries: 0,
      totalDebe: 0,
      totalHaber: 0,
    };
  }

  const row1 = sheet[0]?.map((c) => String(c ?? '')).join(' ') || '';
  const row2 = sheet[1]?.map((c) => String(c ?? '')).join(' ') || '';

  const company = extractCompanyFromHeader(row1);
  const dateRange = extractDateRange(row2);

  const indices = findHeaderIndices(sheet);
  const col = (name: string) => indices[name] ?? -1;

  const entries: AccountingEntry[] = [];
  let totalDebe = 0;
  let totalHaber = 0;

  for (let r = HEADER_ROW + 1; r < sheet.length; r++) {
    const row = sheet[r] || [];
    const get = (idx: number) => (idx >= 0 && row[idx] !== undefined ? row[idx] : '');

    const subcuenta = String(get(col('subcuenta')) ?? '').trim();
    const concepto = String(get(col('concepto')) ?? '').trim();
    const isSaldoAnterior = /saldo\s*anterior/i.test(concepto);

    if (
      !subcuenta &&
      !concepto &&
      parseEuropeanNumber(get(col('debe'))) === 0 &&
      parseEuropeanNumber(get(col('haber'))) === 0
    ) {
      continue;
    }

    const debe = parseEuropeanNumber(get(col('debe')));
    const haber = parseEuropeanNumber(get(col('haber')));
    const saldo = parseEuropeanNumber(get(col('saldo')));

    totalDebe += debe;
    totalHaber += haber;

    entries.push({
      subcuenta,
      tituloSubcuenta: String(get(col('tituloSubcuenta')) ?? '').trim(),
      fecha: parseExcelDate(get(col('fecha'))),
      asiento: String(get(col('asiento')) ?? '').trim(),
      apunte: String(get(col('apunte')) ?? '').trim(),
      factura: String(get(col('factura')) ?? '').trim(),
      contrapartida: String(get(col('contrapartida')) ?? '').trim(),
      concepto,
      debe,
      haber,
      saldo,
      auxiliar1: String(get(col('auxiliar1')) ?? '').trim(),
      isSaldoAnterior,
    });
  }

  logger.info(`[Accounting Journal] Parsed ${entries.length} entries for ${company}`);

  return {
    company,
    dateRange,
    entries,
    totalEntries: entries.length,
    totalDebe,
    totalHaber,
  };
}
