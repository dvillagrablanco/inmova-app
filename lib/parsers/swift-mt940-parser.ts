/**
 * SWIFT MT940 Bank Statement Parser
 *
 * Parses MT940 format bank statement files (standard banking format for account movements).
 * Supports multi-statement files and handles European amount format (comma as decimal separator).
 *
 * @module lib/parsers/swift-mt940-parser
 */

import logger from '@/lib/logger';

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Represents a single transaction line from an MT940 statement.
 */
export interface MT940Transaction {
  /** Value date in YYYY-MM-DD format */
  date: string;
  /** Entry date in MM-DD format (or empty if not present) */
  entryDate: string;
  /** Debit ('D') or Credit ('C') indicator */
  debitCredit: 'D' | 'C';
  /** Transaction amount (always positive) */
  amount: number;
  /** ISO 4217 currency code (3 chars) */
  currency: string;
  /** Transaction type identification code (e.g. NTRF, DDT, CHK) */
  transactionType: string;
  /** Customer/bank reference */
  reference: string;
  /** Free text description from :86 block */
  description: string;
  /** Supplementary details from :61 line */
  supplementaryDetails: string;
}

/**
 * Represents a complete MT940 bank statement (one account, one period).
 */
export interface MT940Statement {
  /** Transaction reference from :20: */
  transactionReference: string;
  /** Account identification (IBAN) from :25: */
  accountId: string;
  /** Statement number/sequence from :28C: */
  statementNumber: string;
  /** Opening balance amount (signed: negative for debit) */
  openingBalance: number;
  /** Closing balance amount (signed: negative for debit) */
  closingBalance: number;
  /** List of transactions */
  transactions: MT940Transaction[];
  /** Currency code for the statement */
  currency: string;
  /** Bank code if present in account identification */
  bankCode: string;
}

// ============================================================================
// PARSING HELPERS
// ============================================================================

/**
 * Parses European-format amount (comma as decimal separator).
 * @param str - Amount string (e.g. "1234,56" or "1234")
 * @returns Parsed number or 0 if invalid
 */
function parseAmount(str: string): number {
  if (!str || typeof str !== 'string') return 0;
  const cleaned = str.trim().replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Converts YYMMDD to YYYY-MM-DD.
 */
function parseDateYYMMDD(str: string): string {
  if (!str || str.length < 6) return '';
  const yy = parseInt(str.slice(0, 2), 10);
  const mm = str.slice(2, 4);
  const dd = str.slice(4, 6);
  const year = yy >= 50 ? 1900 + yy : 2000 + yy;
  return `${year}-${mm}-${dd}`;
}

/**
 * Converts MMDD to MM-DD.
 */
function parseEntryDateMMDD(str: string): string {
  if (!str || str.length < 4) return '';
  return `${str.slice(0, 2)}-${str.slice(2, 4)}`;
}

/**
 * Extracts bank code from account identification (e.g. /C/1234 from :25:).
 * Some banks use format like "ES1234567890123456789012/1234".
 */
function extractBankCode(accountId: string): string {
  const slashPart = accountId.split('/').find((p) => p && !p.startsWith('C') && p.length <= 8);
  return slashPart?.trim() ?? '';
}

// ============================================================================
// BLOCK PARSERS
// ============================================================================

/**
 * Parses :60F: or :60M: opening balance.
 * Format: D/CYYMMDDCURamount (e.g. C250101EUR1234,56)
 */
function parseOpeningBalance(value: string): { amount: number; currency: string; date: string } {
  const result = { amount: 0, currency: 'EUR', date: '' };
  if (!value || value.length < 10) return result;

  const dc = value.charAt(0);
  const dateStr = value.slice(1, 7);
  const rest = value.slice(7).trim();

  const currencyMatch = rest.match(/^([A-Z]{3})(.*)$/);
  if (currencyMatch) {
    result.currency = currencyMatch[1];
    const amountStr = currencyMatch[2].trim();
    result.amount = parseAmount(amountStr);
    if (dc === 'D') result.amount = -result.amount;
  }
  result.date = parseDateYYMMDD(dateStr);
  return result;
}

/**
 * Parses :62F: closing balance.
 * Format: D/CYYMMDDCURamount
 */
function parseClosingBalance(value: string): { amount: number; currency: string; date: string } {
  return parseOpeningBalance(value);
}

/**
 * Parses :61: statement line.
 * Format: YYMMDDMMDDD/CamountNTRFreference//bankref
 * Or: YYMMDDMMDDD/CamountNTRF
 * Transaction type can be Nxxx or Fxxx (N=non-FX, F=FX).
 */
function parseStatementLine(
  value: string,
  currency: string
): Partial<MT940Transaction> & { amount: number; debitCredit: 'D' | 'C'; date: string } {
  const tx: Partial<MT940Transaction> & { amount: number; debitCredit: 'D' | 'C'; date: string } = {
    date: '',
    entryDate: '',
    debitCredit: 'C',
    amount: 0,
    currency,
    transactionType: '',
    reference: '',
    description: '',
    supplementaryDetails: '',
  };

  if (!value || value.length < 12) return tx;

  const dateStr = value.slice(0, 6);
  tx.date = parseDateYYMMDD(dateStr);

  const entryStr = value.slice(6, 10);
  if (entryStr && /^\d{4}$/.test(entryStr)) {
    tx.entryDate = parseEntryDateMMDD(entryStr);
  }

  const dcChar = value.charAt(10);
  tx.debitCredit = dcChar === 'D' ? 'D' : 'C';

  const afterDc = value.slice(11);

  // MT940 :61: format after D/C: [FundsCode]Amount[TransactionType][Reference]
  // FundsCode is optional single letter, Amount is digits+comma, then type code (N/F + 3 chars)
  // Note: NO currency code in :61: lines (currency comes from :60F: balance)
  const amountMatch = afterDc.match(/^([A-Z]?)([\d,]+)(.*)$/);
  if (amountMatch) {
    const amountStr = amountMatch[2];
    tx.amount = parseAmount(amountStr);
    const txTypeAndRest = amountMatch[3] || '';

    // Transaction type: standard is N/F/S + 3 chars, but banks may use other prefixes (D, C, etc.)
    const txTypeMatch = txTypeAndRest.match(/^([A-Z][A-Z0-9]{2,3})(.*)$/);
    if (txTypeMatch) {
      tx.transactionType = txTypeMatch[1];
      const refPart = txTypeMatch[2].trim();

      const refMatch = refPart.match(/^(.+?)(?:\/\/(.+))?$/s);
      if (refMatch) {
        tx.reference = (refMatch[1] || '').trim();
        tx.supplementaryDetails = (refMatch[2] || '').trim();
      } else {
        tx.reference = refPart;
      }
    } else {
      tx.reference = txTypeAndRest.trim();
    }
  }

  return tx;
}

/**
 * Splits content into statement blocks. Each block starts with :20: and runs until
 * the next :20: or end of file.
 */
function splitIntoStatementBlocks(content: string): string[] {
  const blocks: string[] = [];
  const lines = content.split(/\r?\n/);

  let currentBlock: string[] = [];
  let inStatement = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const tagMatch = trimmed.match(/^:(\d{2}[A-Z]?):/);
    if (tagMatch) {
      const tag = tagMatch[1];
      if (tag === '20' || tag.startsWith('20')) {
        if (inStatement && currentBlock.length > 0) {
          blocks.push(currentBlock.join('\n'));
          currentBlock = [];
        }
        inStatement = true;
      }
      currentBlock.push(trimmed);
    } else if (inStatement && currentBlock.length > 0) {
      const lastLine = currentBlock[currentBlock.length - 1];
      if (lastLine.includes(':86:')) {
        currentBlock[currentBlock.length - 1] = lastLine + '\n' + trimmed;
      } else if (lastLine.includes(':61:')) {
        currentBlock[currentBlock.length - 1] = lastLine + trimmed;
      } else {
        currentBlock.push(trimmed);
      }
    }
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join('\n'));
  }

  return blocks;
}

/**
 * Extracts tag value from a block (handles multi-line for :86).
 */
function getTagValue(block: string, tagCode: string): string {
  const tagPattern = new RegExp(`:${tagCode}:([\\s\\S]*?)(?=:\\d{2}[A-Z]?:|$)`, 'm');
  const match = block.match(tagPattern);
  if (!match) return '';

  let value = match[1].trim();
  const lines = value.split(/\r?\n/);
  const result: string[] = [];

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('/') && result.length > 0) {
      result[result.length - 1] += '\n' + t;
    } else {
      result.push(t);
    }
  }

  return result.join('\n').replace(/\n+/g, ' ').trim();
}

/**
 * Gets all :61: lines with their following :86: in order.
 */
function getTransactionPairs(block: string): Array<{ line61: string; line86: string }> {
  const pairs: Array<{ line61: string; line86: string }> = [];

  const blockNormalized = block.replace(/\r\n/g, '\n');
  const lines = blockNormalized.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const tag61Match = line.match(/^:61:(.+)$/);
    if (tag61Match) {
      let line61 = tag61Match[1];
      let line86 = '';

      i++;
      while (i < lines.length) {
        const nextLine = lines[i];
        // Check :86: FIRST (before general tag check, since :86: also matches the tag pattern)
        const m86 = nextLine.match(/^:86:(.*)$/);
        if (m86) {
          line86 = (m86[1] ?? '').trim();
          i++;
          // Collect continuation lines for :86:
          while (i < lines.length && !lines[i].match(/^:\d{2}[A-Z]?:/)) {
            line86 += ' ' + lines[i].trim();
            i++;
          }
          break;
        }
        // Any other tag means end of this :61: block
        if (nextLine.match(/^:\d{2}[A-Z]?:/)) break;
        // Non-tag continuation of :61:
        line61 += nextLine.trim();
        i++;
      }

      pairs.push({
        line61: line61.replace(/\s+/g, ' ').trim(),
        line86: line86.replace(/\s+/g, ' ').trim(),
      });
    } else {
      i++;
    }
  }

  return pairs;
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parses raw SWIFT MT940 text content into structured statements.
 *
 * @param content - Raw MT940 file content (string)
 * @returns Array of parsed statements (one per :20: block)
 * @throws Never throws; returns empty array and logs on parse errors
 *
 * @example
 * ```ts
 * const content = `:20:REF001
 * :25:ES1234567890123456789012
 * :28C:1/1
 * :60F:C250101EUR1000,00
 * :61:2501020102C100,00NTRFPAYMENT REF
 * :86:Payment for invoice 123
 * :62F:C250131EUR1100,00`;
 * const statements = parseMT940(content);
 * ```
 */
export function parseMT940(content: string): MT940Statement[] {
  const statements: MT940Statement[] = [];

  if (!content || typeof content !== 'string') {
    logger.warn('[MT940] Empty or invalid content');
    return statements;
  }

  const blocks = splitIntoStatementBlocks(content).filter((b) => b.includes(':20:'));

  for (let idx = 0; idx < blocks.length; idx++) {
    const block = blocks[idx];

    try {
      const transactionReference = getTagValue(block, '20') || `statement-${idx + 1}`;
      const accountId = getTagValue(block, '25') || '';
      const statementNumber = getTagValue(block, '28C') || '';

      const openingBalanceStr = getTagValue(block, '60F') || getTagValue(block, '60M') || '';
      const opening = parseOpeningBalance(openingBalanceStr);
      const currency = opening.currency || 'EUR';

      const closingBalanceStr = getTagValue(block, '62F') || '';
      const closing = parseClosingBalance(closingBalanceStr);

      if (closing.currency && !opening.currency) {
        opening.currency = closing.currency;
      }

      const transactions: MT940Transaction[] = [];
      const pairs = getTransactionPairs(block);

      for (const { line61, line86 } of pairs) {
        const txData = parseStatementLine(line61, currency);
        transactions.push({
          date: txData.date || '',
          entryDate: txData.entryDate || '',
          debitCredit: txData.debitCredit ?? 'C',
          amount: txData.amount ?? 0,
          currency: txData.currency ?? currency,
          transactionType: txData.transactionType ?? '',
          reference: txData.reference ?? '',
          description: line86,
          supplementaryDetails: txData.supplementaryDetails ?? '',
        });
      }

      statements.push({
        transactionReference,
        accountId,
        statementNumber,
        openingBalance: opening.amount,
        closingBalance: closing.amount,
        transactions,
        currency,
        bankCode: extractBankCode(accountId),
      });
    } catch (err) {
      logger.warn('[MT940] Failed to parse statement block', {
        blockIndex: idx,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.debug('[MT940] Parsed statements', {
    count: statements.length,
    totalTransactions: statements.reduce((sum, s) => sum + s.transactions.length, 0),
  });

  return statements;
}

/**
 * Parses an MT940 file from a Buffer (e.g. from file read or upload).
 * Attempts UTF-8 first, falls back to Latin-1/ISO-8859-1 for legacy bank files.
 *
 * @param buffer - File buffer
 * @returns Array of parsed statements
 *
 * @example
 * ```ts
 * const buffer = fs.readFileSync('statement.txt');
 * const statements = parseMT940File(buffer);
 * ```
 */
export function parseMT940File(buffer: Buffer): MT940Statement[] {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    logger.warn('[MT940] Invalid buffer');
    return [];
  }

  let content: string;
  try {
    content = buffer.toString('utf-8');
    if (content.includes('\uFFFD')) {
      content = buffer.toString('latin1');
    }
  } catch {
    logger.warn('[MT940] Failed to decode buffer');
    return [];
  }

  return parseMT940(content);
}
