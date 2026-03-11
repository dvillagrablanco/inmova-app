// @ts-nocheck
/**
 * Parser for Pictet investment PDF statements.
 * Extracts transactions with dates, amounts (European format), and operation types.
 */

import logger from '@/lib/logger';

export interface PictetTransaction {
  operationDate: string;
  valueDate: string;
  executionDate: string;
  description: string;
  operationType:
    | 'subscription'
    | 'redemption'
    | 'stock_exchange'
    | 'purchase'
    | 'sale'
    | 'fee'
    | 'dividend'
    | 'transfer'
    | 'other';
  debit: number;
  credit: number;
  balance: number;
  currency: string;
  fundName?: string;
}

export interface PictetStatement {
  accountName: string;
  currency: string;
  period: { from: string; to: string };
  transactions: PictetTransaction[];
  closingBalance: number;
}

// Spanish operation type -> enum mapping
const OPERATION_TYPE_MAP: Record<string, PictetTransaction['operationType']> = {
  suscripción: 'subscription',
  suscripcion: 'subscription',
  reembolso: 'redemption',
  'stock exchange': 'stock_exchange',
  compra: 'purchase',
  venta: 'sale',
  comisión: 'fee',
  comision: 'fee',
  dividend: 'dividend',
  dividendo: 'dividend',
  transferencia: 'transfer',
  transfer: 'transfer',
};

// European amount format: 1.234,56 or 123.456,78 (dots = thousands, comma = decimal)
const EUROPEAN_AMOUNT_REGEX = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/g;

// Date format DD/MM/YYYY
const DATE_REGEX = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g;

function parseEuropeanAmount(str: string): number {
  if (!str || str.trim() === '-') return 0;
  const cleaned = str.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function parseDateToISO(match: RegExpMatchArray): string {
  const [, day, month, year] = match;
  return `${year}-${month!.padStart(2, '0')}-${day!.padStart(2, '0')}`;
}

function mapOperationType(spanishType: string): PictetTransaction['operationType'] {
  const normalized = spanishType.toLowerCase().trim();
  for (const [key, value] of Object.entries(OPERATION_TYPE_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return 'other';
}

export async function parsePictetPDF(buffer: Buffer): Promise<PictetStatement> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const text = data.text;

  if (!text || text.length < 50) {
    logger.warn('[Pictet PDF] Insufficient text extracted from PDF');
    return {
      accountName: '',
      currency: 'EUR',
      period: { from: '', to: '' },
      transactions: [],
      closingBalance: 0,
    };
  }

  // Detect currency from header
  let currency = 'EUR';
  if (/\bUSD\b|\$\s*[\d.,]+\s*USD/i.test(text)) currency = 'USD';
  else if (/\bEUR\b|€|\s*EUR\s/i.test(text)) currency = 'EUR';
  else if (/\bCHF\b|\s*CHF\s/i.test(text)) currency = 'CHF';

  // Extract account name (often in first lines)
  let accountName = '';
  const firstLines = text.split('\n').slice(0, 10).join(' ');
  const accountMatch = firstLines.match(/(?:Account|Cuenta|Compte)[:\s]+([^\n]+)/i);
  if (accountMatch) accountName = accountMatch[1].trim();

  // Extract period
  const dateMatches = [...text.matchAll(DATE_REGEX)];
  const period = { from: '', to: '' };
  if (dateMatches.length >= 2) {
    period.from = parseDateToISO(dateMatches[0]);
    period.to = parseDateToISO(dateMatches[dateMatches.length - 1]);
  }

  const transactions: PictetTransaction[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Transaction line pattern: dates, description, type, amounts
  // Typical: "01/01/2025  02/01/2025  03/01/2025  JP MORGAN GLOBAL...  Suscripción  -1.234,56  0,00  12.345,67"
  const amountPattern =
    /(-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?|-?\d+(?:,\d{2})?)\s+(-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?|-?\d+(?:,\d{2})?|-)\s+(-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?|-?\d+(?:,\d{2})?|-)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dates = [...line.matchAll(DATE_REGEX)];
    const amounts = line.match(amountPattern);

    if (dates.length >= 1 && amounts) {
      const opDate = dates[0];
      const valueDate = dates[1] ? parseDateToISO(dates[1]) : parseDateToISO(opDate);
      const execDate = dates[2] ? parseDateToISO(dates[2]) : valueDate;

      // Extract description (between last date and first amount-like token)
      const amountStartIdx = line.search(amountPattern);
      const beforeAmounts = amountStartIdx >= 0 ? line.substring(0, amountStartIdx) : line;
      const parts = beforeAmounts
        .split(/\s{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);

      let description = '';
      let operationType = 'other';
      if (parts.length >= 2) {
        description = parts[0];
        operationType = parts[parts.length - 1];
      } else if (parts.length === 1) {
        description = parts[0];
      }

      const [, debitStr, creditStr, balanceStr] = amounts;
      const debit = parseEuropeanAmount(debitStr || '0');
      const credit = parseEuropeanAmount(creditStr || '0');
      const balance = parseEuropeanAmount(balanceStr || '0');

      // Skip header-like rows
      if (
        /fecha|date|débito|crédito|saldo|debit|credit|balance/i.test(description) &&
        !/[A-Z]{2,}\s|FUND|JP MORGAN|DEEPBLUE|GLOBAL/i.test(description)
      ) {
        continue;
      }

      transactions.push({
        operationDate: parseDateToISO(opDate),
        valueDate,
        executionDate: execDate,
        description,
        operationType: mapOperationType(operationType),
        debit: debit < 0 ? Math.abs(debit) : 0,
        credit: credit > 0 ? credit : 0,
        balance,
        currency,
        fundName: description || undefined,
      });
    }
  }

  // Alternative: line-by-line with looser regex for multi-page PDFs
  if (transactions.length === 0) {
    const looseDate = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const looseAmount = /(-?\d[\d.,]*)/g;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const dateMatch = line.match(looseDate);
      if (!dateMatch) continue;
      const nums = line.match(looseAmount);
      if (!nums || nums.length < 3) continue;
      const lastThree = nums.slice(-3).map((n) => parseEuropeanAmount(n));
      const [debitVal, creditVal, balanceVal] = lastThree;
      const desc = line
        .replace(looseDate, '')
        .replace(/-?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g, '')
        .trim();
      if (desc.length < 3) continue;

      const [, d, m, y] = dateMatch;
      const isoDate = `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;

      transactions.push({
        operationDate: isoDate,
        valueDate: isoDate,
        executionDate: isoDate,
        description: desc.substring(0, 200),
        operationType: 'other',
        debit: debitVal < 0 ? Math.abs(debitVal) : 0,
        credit: creditVal > 0 ? creditVal : 0,
        balance: balanceVal,
        currency,
        fundName: desc || undefined,
      });
    }
  }

  const closingBalance =
    transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;

  logger.info(`[Pictet PDF] Parsed ${transactions.length} transactions, currency ${currency}`);

  return {
    accountName,
    currency,
    period,
    transactions,
    closingBalance,
  };
}
