/**
 * SWIFT MT535 Custody Statement Parser
 *
 * Parses SWIFT MT535 (Statement of Holdings) messages used for investment position
 * reconciliation. Supports custody statements from custodians such as CACEIS,
 * Banca March, and other institutional custodians.
 *
 * MT535 format structure:
 * - :16R:GENL / :16S:GENL = General Information (account, dates)
 * - :16R:SUBSAFE / :16S:SUBSAFE = Sub-safekeeping account
 * - :16R:FIN / :16S:FIN = Financial instrument (position)
 *   - :35B: = ISIN and security description
 *   - :36B: = Quantity
 *   - :19A: = Amounts (market value, cost)
 *   - :70E: = Supplementary details
 *   - :98A: = Price date
 *   - :90B: = Price
 *
 * @module swift-mt535-parser
 */

import logger from '@/lib/logger';

/** ISIN pattern: 2-letter country code + 9 alphanumeric + 1 check digit (12 chars total) */
const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

/**
 * Represents a single position (financial instrument holding) within an MT535 statement.
 */
export interface MT535Position {
  /** ISIN code (12 character alphanumeric, ISO 6166) */
  isin: string;
  /** Security name/description */
  securityName: string;
  /** Quantity held (units or nominal) */
  quantity: number;
  /** Market value in statement currency */
  marketValue: number;
  /** Cost/acquisition value in statement currency */
  costValue: number;
  /** Currency code (ISO 4217, e.g. EUR, USD) */
  currency: string;
  /** Price valuation date (YYYY-MM-DD) */
  priceDate: string | null;
  /** Unit price */
  price: number;
  /** Supplementary details from :70E: tag */
  supplementaryDetails: string;
}

/**
 * Represents a complete MT535 custody statement (one account, one statement date).
 */
export interface MT535Statement {
  /** Safekeeping account identifier */
  accountId: string;
  /** Statement date (YYYY-MM-DD) */
  statementDate: string;
  /** Preparation date (YYYY-MM-DD) */
  preparationDate: string;
  /** List of positions */
  positions: MT535Position[];
  /** Total market value across all positions */
  totalMarketValue: number;
  /** Statement currency */
  currency: string;
}

/**
 * Extracts the text body from SWIFT message blocks.
 * Handles Block 4 (application block) which contains the MT535 content.
 *
 * @param content - Raw SWIFT message content
 * @returns Array of message body strings (one per message in file)
 */
function extractMessageBodies(content: string): string[] {
  const bodies: string[] = [];
  // Block 4 format: {4:\n...\n-}
  const block4Regex = /\{4:([\s\S]*?)(?:\r?\n-?\})/g;
  let match;
  while ((match = block4Regex.exec(content)) !== null) {
    bodies.push(match[1].trim());
  }
  // If no Block 4 found, treat entire content as message body (plain MT535 format)
  if (bodies.length === 0 && content.trim().length > 0) {
    bodies.push(content.trim());
  }
  return bodies;
}

/**
 * Parses a number with comma as decimal separator (European format).
 * Handles: 1.234,56 (dot=thousands, comma=decimal) and 1234,56
 *
 * @param value - String representation of number
 * @returns Parsed number or 0 if invalid
 */
function parseAmount(value: string | undefined): number {
  if (value === undefined || value === null || value.trim() === '') return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  // European: comma = decimal, dot = thousands (e.g. 1.234,56)
  const hasComma = trimmed.includes(',');
  const hasDot = trimmed.includes('.');
  let normalized: string;
  if (hasComma && hasDot) {
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = trimmed.replace(',', '.');
  } else {
    normalized = trimmed;
  }
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Validates and extracts ISIN from text.
 * ISIN: 2-letter country code + 9 alphanumeric + 1 check digit.
 *
 * @param text - Text that may contain ISIN (e.g. "ISIN US0378331005" or "US0378331005 BOND")
 * @returns Valid ISIN or empty string
 */
function extractISIN(text: string | undefined): string {
  if (!text || typeof text !== 'string') return '';
  // Match ISIN after "ISIN " or standalone 12-char pattern
  const isinMatch = text.match(/(?:ISIN\s+)?([A-Z]{2}[A-Z0-9]{9}[0-9])/i);
  if (!isinMatch) return '';
  const candidate = isinMatch[1].toUpperCase();
  return ISIN_REGEX.test(candidate) ? candidate : '';
}

/**
 * Parses SWIFT date (YYYYMMDD) to ISO format (YYYY-MM-DD).
 *
 * @param dateStr - Date string in YYYYMMDD format
 * @returns ISO date string or empty string
 */
function parseSwiftDate(dateStr: string | undefined): string {
  if (!dateStr || dateStr.length < 8) return '';
  const cleaned = dateStr.replace(/\D/g, '');
  if (cleaned.length !== 8) return '';
  return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 6)}-${cleaned.slice(6, 8)}`;
}

/**
 * Extracts value after qualifier in SWIFT format.
 * Format: QUAL//VALUE or QUAL/VALUE or QUAL VALUE
 *
 * @param text - Full tag value
 * @param qualifier - Qualifier to search for (e.g. STAT, PREP, MKTN, COST)
 * @returns Extracted value or undefined
 */
function extractQualifiedValue(text: string, qualifier: string): string | undefined {
  if (!text) return undefined;
  const patterns = [
    new RegExp(`${qualifier}\\/\\/([^/\\n]+)`, 'i'),
    new RegExp(`${qualifier}\\/([^/\\n]+)`, 'i'),
    new RegExp(`${qualifier}\\s+([^/\\n]+)`, 'i'),
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim();
  }
  return undefined;
}

/**
 * Parses a single FIN (financial instrument) block into MT535Position.
 *
 * @param block - Content of :16R:FIN ... :16S:FIN block
 * @param defaultCurrency - Fallback currency
 * @returns Parsed position or null if invalid
 */
function parseFinBlock(block: string, defaultCurrency: string): MT535Position | null {
  // :35B: ISIN and description
  const tag35B = block.match(/:35B:([\s\S]*?)(?=:[0-9]{2}[A-Z]:|$)/);
  const value35B = tag35B?.[1]?.trim() ?? '';
  const isin = extractISIN(value35B);
  if (!isin) {
    logger.debug('[MT535] Skipping FIN block: no valid ISIN', { block: block.slice(0, 100) });
    return null;
  }
  // Security name: rest of :35B: after ISIN, or second line
  const lines35B = value35B
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const securityName =
    lines35B.length > 1
      ? lines35B.slice(1).join(' ').trim()
      : value35B.replace(/ISIN\s+[A-Z]{2}[A-Z0-9]{9}[0-9]/i, '').trim() || isin;

  // :36B: Quantity (UNIT// or NOM//)
  const tag36B = block.match(/:36B:([\s\S]*?)(?=:[0-9]{2}[A-Z]:|$)/);
  const value36B = tag36B?.[1] ?? '';
  const qtyMatch =
    value36B.match(/(?:UNIT|NOM)\/\/\s*([\d\s.,]+)/i) ?? value36B.match(/([\d\s.,]+)/);
  const quantity = parseAmount(qtyMatch?.[1]);

  // :19A: Amounts - MKTN (market value), COST (cost value)
  const tag19AMatches = block.matchAll(/:19A:([\s\S]*?)(?=:[0-9]{2}[A-Z]:|$)/g);
  let marketValue = 0;
  let costValue = 0;
  let currency = defaultCurrency;
  for (const m of tag19AMatches) {
    const v = m[1];
    const mktnMatch = v.match(/MKTN\/\/\s*([A-Z]{3})\s*([\d\s.,]+)/i);
    const costMatch = v.match(/COST\/\/\s*([A-Z]{3})\s*([\d\s.,]+)/i);
    if (mktnMatch) {
      currency = mktnMatch[1] || defaultCurrency;
      marketValue = parseAmount(mktnMatch[2]);
    }
    if (costMatch) {
      costValue = parseAmount(costMatch[2]);
    }
  }
  // Fallback: first :19A: with 3-letter currency and amount
  if (marketValue === 0) {
    const fallback = block.match(/:19A:.*?([A-Z]{3})\s*([\d\s.,]+)/);
    if (fallback) {
      currency = fallback[1];
      marketValue = parseAmount(fallback[2]);
    }
  }

  // :70E: Supplementary details
  const tag70E = block.match(/:70E:([\s\S]*?)(?=:[0-9]{2}[A-Z]:|$)/);
  const supplementaryDetails = (tag70E?.[1] ?? '').trim().replace(/\r?\n/g, ' ').slice(0, 500);

  // :98A: Price date
  const tag98A = block.match(/:98A:([\s\S]*?)(?=:[0-9]{2}[A-Z]:|$)/);
  const dateVal = tag98A?.[1] ?? '';
  const priceDateStr =
    extractQualifiedValue(dateVal, 'PRIC') ??
    dateVal.match(/(\d{8})/)?.[1] ??
    extractQualifiedValue(dateVal, 'STAT') ??
    '';
  const priceDate = priceDateStr ? parseSwiftDate(priceDateStr) : null;

  // :90B: Price
  const tag90B = block.match(/:90B:([\s\S]*?)(?=:[0-9]{2}[A-Z]:|$)/);
  const priceVal = tag90B?.[1] ?? '';
  const priceMatch =
    priceVal.match(/(?:PRIC|MRKT)\/\/\s*[A-Z]{3}\s*([\d.,]+)/i) ?? priceVal.match(/([\d.,]+)/);
  const price = parseAmount(priceMatch?.[1]);

  return {
    isin,
    securityName,
    quantity,
    marketValue,
    costValue,
    currency,
    priceDate,
    price,
    supplementaryDetails,
  };
}

/**
 * Parses a single MT535 message body into MT535Statement.
 *
 * @param body - Message body (Block 4 content or plain MT535 text)
 * @returns Parsed statement
 */
function parseMessageBody(body: string): MT535Statement {
  const positions: MT535Position[] = [];
  let accountId = '';
  let statementDate = '';
  let preparationDate = '';
  let currency = 'EUR';

  // Extract GENL block for account and dates
  const genlMatch = body.match(/:16R:GENL([\s\S]*?):16S:GENL/);
  const genlBlock = genlMatch?.[1] ?? body;

  // :97A: Account (SAFE//accountId)
  const acctMatch = genlBlock.match(/:97A:.*?SAFE\/\/\s*(\S+)/i);
  if (acctMatch) {
    accountId = acctMatch[1].trim();
  } else {
    const altMatch = genlBlock.match(/:97A:([\s\S]*?)(?=:[0-9]{2}[A-Z]:|$)/);
    if (altMatch) {
      accountId = altMatch[1].trim().split(/\s+/)[0] ?? '';
    }
  }

  // :13A: Dates - STAT (statement), PREP (preparation)
  const tag13AMatches = genlBlock.matchAll(/:13A:([\s\S]*?)(?=:[0-9]{2}[A-Z]:|$)/g);
  for (const m of tag13AMatches) {
    const v = m[1];
    const stat = extractQualifiedValue(v, 'STAT') ?? v.match(/STAT\/\/\s*(\d{8})/)?.[1];
    const prep = extractQualifiedValue(v, 'PREP') ?? v.match(/PREP\/\/\s*(\d{8})/)?.[1];
    if (stat) statementDate = parseSwiftDate(stat);
    if (prep) preparationDate = parseSwiftDate(prep);
  }
  if (!statementDate) {
    const dateMatch = genlBlock.match(/:98A:.*?STAT\/\/\s*(\d{8})/);
    if (dateMatch) statementDate = parseSwiftDate(dateMatch[1]);
  }

  // Default preparation date to statement date
  if (!preparationDate && statementDate) preparationDate = statementDate;

  // Extract currency from first :19A: in GENL if present
  const genl19A = genlBlock.match(/:19A:.*?([A-Z]{3})\s*[\d.,]+/);
  if (genl19A) currency = genl19A[1];

  // Parse all SUBSAFE blocks and their FIN blocks
  const subsafeRegex = /:16R:SUBSAFE([\s\S]*?):16S:SUBSAFE/g;
  let subsafeMatch;
  while ((subsafeMatch = subsafeRegex.exec(body)) !== null) {
    const subsafeBlock = subsafeMatch[1];
    const finRegex = /:16R:FIN([\s\S]*?):16S:FIN/g;
    let finMatch;
    while ((finMatch = finRegex.exec(subsafeBlock)) !== null) {
      const pos = parseFinBlock(finMatch[1], currency);
      if (pos) positions.push(pos);
    }
  }

  // Fallback: parse FIN blocks at top level (some messages omit SUBSAFE)
  if (positions.length === 0) {
    const finRegex = /:16R:FIN([\s\S]*?):16S:FIN/g;
    let finMatch;
    while ((finMatch = finRegex.exec(body)) !== null) {
      const pos = parseFinBlock(finMatch[1], currency);
      if (pos) positions.push(pos);
    }
  }

  const totalMarketValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  if (positions.length > 0 && currency === 'EUR') {
    const firstCur = positions[0].currency;
    if (firstCur && firstCur !== 'EUR') currency = firstCur;
  }

  return {
    accountId,
    statementDate,
    preparationDate,
    positions,
    totalMarketValue,
    currency,
  };
}

/**
 * Parses SWIFT MT535 content and returns one or more custody statements.
 *
 * Handles:
 * - Single message or multiple messages in one file
 * - Block 4 format {4:...-} or plain MT535 text
 * - European number format (comma as decimal separator)
 * - Multiple sub-safekeeping accounts
 * - Missing optional fields (cost, price date, etc.)
 *
 * @param content - Raw SWIFT MT535 content (string)
 * @returns Array of parsed statements (one per message)
 *
 * @example
 * ```ts
 * const statements = parseMT535(swiftContent);
 * for (const st of statements) {
 *   console.log(st.accountId, st.totalMarketValue, st.positions.length);
 * }
 * ```
 */
export function parseMT535(content: string): MT535Statement[] {
  if (!content || typeof content !== 'string') {
    logger.warn('[MT535] Empty or invalid content');
    return [];
  }

  try {
    const bodies = extractMessageBodies(content);
    const statements: MT535Statement[] = [];

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      if (!body || body.length < 20) {
        logger.debug('[MT535] Skipping empty or too short message body', { index: i });
        continue;
      }
      const st = parseMessageBody(body);
      if (st.positions.length > 0 || st.accountId || st.statementDate) {
        statements.push(st);
      } else {
        logger.debug('[MT535] Message body produced no data', {
          index: i,
          preview: body.slice(0, 80),
        });
      }
    }

    if (statements.length === 0) {
      logger.warn('[MT535] No valid statements parsed from content');
    } else {
      logger.info('[MT535] Parsed statements', {
        count: statements.length,
        totalPositions: statements.reduce((s, st) => s + st.positions.length, 0),
      });
    }

    return statements;
  } catch (err) {
    logger.error('[MT535] Parse error', {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/**
 * Parses a SWIFT MT535 file from a Buffer.
 *
 * Handles UTF-8 and common encodings. Strips BOM if present.
 *
 * @param buffer - File contents as Buffer
 * @returns Array of parsed statements
 *
 * @example
 * ```ts
 * const buf = fs.readFileSync('statement.mt535');
 * const statements = parseMT535File(buf);
 * ```
 */
export function parseMT535File(buffer: Buffer): MT535Statement[] {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    logger.warn('[MT535] Invalid buffer');
    return [];
  }

  let content: string;
  try {
    content = buffer.toString('utf-8');
  } catch {
    logger.warn('[MT535] Failed to decode buffer as UTF-8');
    return [];
  }

  // Strip BOM if present
  if (content.charCodeAt(0) === 0xfeff) {
    content = content.slice(1);
  }

  return parseMT535(content);
}
