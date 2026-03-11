/**
 * Parser for MdF Gestefin reporting PDFs (Grupo Vidaro / Baldomero).
 *
 * Supports three report types:
 *   - AF (Activos Financieros): Positions across Inversis, Pictet, Banca March, CACEIS
 *   - AR (Asset Report): Bankinter, UBS, Inversis positions
 *   - Amper: Separate portfolio managed by Inversis
 *
 * Extracts:
 *   - Portfolio summary (total value, P&L, allocation)
 *   - Individual positions with ISIN, value, weight, P&L
 *   - PE fund positions (commitments, distributions, TVPI)
 *   - Performance data (monthly, YTD, since inception)
 *   - Fee breakdown
 */

import logger from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MdfPortfolioSummary {
  reportDate: string; // YYYY-MM-DD
  portfolioCode: string; // e.g. "1149.01"
  portfolioName: string; // e.g. "BALDOMERO AF GRUPO"
  currency: string;
  totalValue: number;
  previousValue: number;
  deposits: number;
  withdrawals: number;
  netPnl: number;
  fees: number;
}

export interface MdfAssetAllocation {
  category: string; // "Mercado monetario", "Renta fija", "Renta variable", etc.
  subcategory?: string;
  value: number;
  weight: number;
  target?: number;
  difference?: number;
}

export interface MdfPosition {
  name: string;
  isin?: string;
  currency: string;
  type: 'monetario' | 'renta_fija' | 'renta_variable' | 'commodities' | 'alternativos' | 'tesoreria' | 'pe_fund';
  subcategory?: string;
  custodian?: string; // Inversis, Pictet, Banca March, CACEIS
  quantity?: number;
  price?: number;
  costBasis?: number;
  currentValue: number;
  weight: number;
  pnl?: number;
  pnlPct?: number;
  return12m?: number;
  returnYtd?: number;
}

export interface MdfPEPosition {
  fundName: string;
  shortName: string;
  vintageYear: number;
  commitment: number;
  calledCapital: number;
  currentValue: number;
  pendingCalls: number;
  totalValuePlusDistributions: number;
  distributions: number;
  tvpiMultiple: number;
}

export interface MdfCustodianBreakdown {
  custodian: string;
  monetario: number;
  rentaFija: number;
  rentaVariable: number;
  commodities: number;
  alternativos: number;
  total: number;
  deposits: number;
  netPnl: number;
  previousValue: number;
}

export interface MdfPerformance {
  portfolio: string;
  ytd: number;
  year2025?: number;
  year2024?: number;
  year2023?: number;
  sinceInception: number;
  annualized: number;
  volatility12m?: number;
  sharpeRatio?: number;
}

export interface MdfReportingData {
  reportType: 'AF' | 'AR' | 'AMPER' | 'MIFID';
  reportDate: string;
  portfolioCode: string;
  portfolioName: string;
  summary: MdfPortfolioSummary;
  assetAllocation: MdfAssetAllocation[];
  positions: MdfPosition[];
  pePositions: MdfPEPosition[];
  custodians: MdfCustodianBreakdown[];
  performance: MdfPerformance[];
  rawText: string;
}

// ---------------------------------------------------------------------------
// Parsing utilities
// ---------------------------------------------------------------------------

function parseEuropeanNumber(str: string): number {
  if (!str || str.trim() === '-' || str.trim() === '') return 0;
  const cleaned = str.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function extractDate(text: string): string {
  const months: Record<string, string> = {
    enero: '01', febrero: '02', marzo: '03', abril: '04',
    mayo: '05', junio: '06', julio: '07', agosto: '08',
    septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12',
  };

  // "31 enero 2026"
  const match = text.match(/(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = months[match[2].toLowerCase()];
    return `${match[3]}-${month}-${day}`;
  }

  // DD/MM/YYYY format
  const match2 = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match2) {
    return `${match2[3]}-${match2[2]}-${match2[1]}`;
  }

  return '';
}

function detectReportType(text: string): 'AF' | 'AR' | 'AMPER' | 'MIFID' {
  if (/MiFID\s*II/i.test(text)) return 'MIFID';
  if (/1149\.01.*BALDOMERO AF/i.test(text) || /BALDOMERO AF GRUPO/i.test(text)) return 'AF';
  if (/1149\.03.*BALDOMERO AR/i.test(text) || /BALDOMERO AR GRUPO/i.test(text)) return 'AR';
  if (/1142\.09.*BALDOMERO AMPER/i.test(text) || /BALDOMERO AMPER/i.test(text)) return 'AMPER';
  return 'AF';
}

function extractPortfolioCode(text: string): string {
  const match = text.match(/(\d{4}\.\d{2})\s*-\s*BALDOMERO/);
  return match ? match[1] : '';
}

// ---------------------------------------------------------------------------
// Section parsers
// ---------------------------------------------------------------------------

function parseSummary(text: string, reportDate: string, reportType: string): MdfPortfolioSummary {
  const code = extractPortfolioCode(text) ||
    (reportType === 'AF' ? '1149.01' : reportType === 'AR' ? '1149.03' : '1142.09');

  const nameMap: Record<string, string> = {
    AF: 'BALDOMERO AF GRUPO',
    AR: 'BALDOMERO AR GRUPO',
    AMPER: 'BALDOMERO AMPER',
    MIFID: 'BALDOMERO AF GRUPO',
  };

  let totalValue = 0;
  let previousValue = 0;
  let deposits = 0;
  let netPnl = 0;
  let fees = 0;

  // "Patrimonio a cierre de mes 31/01/2026 44.743.029"
  const patrimonioMatch = text.match(/Patrimonio a cierre de mes\s+\d{2}\/\d{2}\/\d{4}\s+([\d.,]+)/);
  if (patrimonioMatch) totalValue = parseEuropeanNumber(patrimonioMatch[1]);

  // "PATRIMONIO A 31/12/2025 43.802.502"
  const prevMatch = text.match(/PATRIMONIO A \d{2}\/\d{2}\/\d{4}\s+([0-9.,]+)/);
  if (prevMatch) previousValue = parseEuropeanNumber(prevMatch[1]);

  // "Aportaciones / Retiradas / Traspasos 7.521"
  const depMatch = text.match(/Aportaciones\s*\/\s*Retiradas\s*\/\s*Traspasos\s+(-?[0-9.,]+)/);
  if (depMatch) deposits = parseEuropeanNumber(depMatch[1]);

  // "Evolución de la cartera 964.071"
  const pnlMatch = text.match(/Evolución de la cartera\s+(-?[0-9.,]+)/);
  if (pnlMatch) netPnl = parseEuropeanNumber(pnlMatch[1]);

  // "Comisiones -18.736"
  const feeMatch = text.match(/Comisiones\s+(-?[0-9.,]+)/);
  if (feeMatch) fees = parseEuropeanNumber(feeMatch[1]);

  return {
    reportDate,
    portfolioCode: code,
    portfolioName: nameMap[reportType] || 'BALDOMERO',
    currency: 'EUR',
    totalValue,
    previousValue,
    deposits,
    withdrawals: 0,
    netPnl,
    fees,
  };
}

function parseAssetAllocation(text: string): MdfAssetAllocation[] {
  const allocations: MdfAssetAllocation[] = [];

  // Match lines like: "Renta fija 16.069.618,00 35,92% 43,00% -7,08%"
  const pattern = /^(\S[^\d]*?)\s+([\d.,]+)\s+([\d.,]+)%\s*([\d.,]+)%?\s*(-?[\d.,]+)%?\s*$/gm;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const name = match[1].trim();
    if (/fecha|activo|total|patrimonio|null|índice/i.test(name)) continue;

    allocations.push({
      category: name,
      value: parseEuropeanNumber(match[2]),
      weight: parseEuropeanNumber(match[3]),
      target: match[4] ? parseEuropeanNumber(match[4]) : undefined,
      difference: match[5] ? parseEuropeanNumber(match[5]) : undefined,
    });
  }

  return allocations;
}

function parsePositions(text: string): MdfPosition[] {
  const positions: MdfPosition[] = [];
  const lines = text.split('\n');

  let currentType: MdfPosition['type'] = 'monetario';
  let currentSubcategory = '';
  let inPositionSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (/INFORME DE POSICIONES DETALLADO/i.test(line)) {
      inPositionSection = true;
      continue;
    }

    if (!inPositionSection) continue;

    // Detect asset type headers
    if (/^Mercado monetario/i.test(line)) { currentType = 'monetario'; continue; }
    if (/^Renta fija\b/i.test(line)) { currentType = 'renta_fija'; continue; }
    if (/^Renta variable\b/i.test(line)) { currentType = 'renta_variable'; continue; }
    if (/^Commodities/i.test(line)) { currentType = 'commodities'; continue; }
    if (/^Alternativos/i.test(line)) { currentType = 'alternativos'; continue; }
    if (/^Tesorería/i.test(line)) { currentType = 'tesoreria'; continue; }

    // Detect subcategory headers
    if (/^(Monetario|Corporativa|Emergente|Gobiernos|High Yield|Global|Europa|Asia|Japón|Norteamérica|Metales|Energia|Long\/Short|Retorno Absoluto)\b/i.test(line)) {
      currentSubcategory = line.split(/\s+/)[0];
      continue;
    }

    // Match position line with ISIN
    const isinMatch = line.match(/^(.+?)\s+((?:LU|IE|FR|FI|DE|GB|ES|IT|NL|CH|US|JE)\d{8,12})\s+/);
    if (isinMatch) {
      const name = isinMatch[1].trim();
      const isin = isinMatch[2];

      // Extract currency and values from the rest of the line
      const rest = line.substring(isinMatch[0].length);
      const numbers = rest.match(/-?[\d.,]+/g) || [];
      const eurNumbers = numbers.map(parseEuropeanNumber);

      if (eurNumbers.length >= 2) {
        const position: MdfPosition = {
          name: name.replace(/\s+/g, ' '),
          isin,
          currency: 'EUR',
          type: currentType,
          subcategory: currentSubcategory,
          currentValue: 0,
          weight: 0,
        };

        // Typical layout: quantity, price, costBasis, currentValue, weight%, pnl, pnl12m, ytd
        if (eurNumbers.length >= 4) {
          position.quantity = eurNumbers[0];
          position.price = eurNumbers[1];
          position.costBasis = eurNumbers[2];
          position.currentValue = eurNumbers[3];
        }
        if (eurNumbers.length >= 5) {
          position.weight = eurNumbers[4];
        }

        if (position.currentValue > 0 || position.costBasis) {
          positions.push(position);
        }
      }
    }
  }

  return positions;
}

function parsePEPositions(text: string): MdfPEPosition[] {
  const positions: MdfPEPosition[] = [];
  const seen = new Set<string>();

  // Only match from the "ACTIVOS EN CRECIMIENTO" section with the TVPI table
  // Pattern: "HELIA III 19 2019 2.500.000 1.516.000 1.916.224 984.000 2.900.224 89.773 1,32x"
  // The 'x' suffix distinguishes the commitment table from the monthly/annual performance tables
  const pePattern = /^([A-Z][A-Z\s.]+?\d{2}[A-Z]?)\s+(\d{4})\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)x/gm;
  let match;

  while ((match = pePattern.exec(text)) !== null) {
    const fundName = match[1].trim();
    if (seen.has(fundName)) continue;
    seen.add(fundName);

    positions.push({
      fundName,
      shortName: fundName.replace(/\s+\d{2}[A-Z]?$/, ''),
      vintageYear: parseInt(match[2]),
      commitment: parseEuropeanNumber(match[3]),
      calledCapital: parseEuropeanNumber(match[4]),
      currentValue: parseEuropeanNumber(match[5]),
      pendingCalls: parseEuropeanNumber(match[6]),
      totalValuePlusDistributions: parseEuropeanNumber(match[7]),
      distributions: parseEuropeanNumber(match[8]),
      tvpiMultiple: parseEuropeanNumber(match[9]),
    });
  }

  return positions;
}

function parseCustodians(text: string): MdfCustodianBreakdown[] {
  const custodians: MdfCustodianBreakdown[] = [];
  const custodianNames = ['INVERSIS', 'PICTET', 'BANCA MARCH', 'CACEIS', 'BANKINTER', 'UBS'];

  // Page 9 structure: table row per custodian with values and percentages
  // "BALDOMERO INVERSIS ... BALDOMERO PICTET ... BALDOMERO AF GRUPO"
  // Each custodian column has: value pct% for each asset class, then total

  // Strategy: find the position summary page and extract custodian totals
  // Pattern: "PPAATTRRIIMMOONNIIOO 9.787.985 100,00 % 12.051.482 100,00 % ..."
  const totalLineMatch = text.match(
    /PPAATTRRIIMMOONNIIOO\s+([\d.,]+)\s+100[,.]00\s*%?\s+([\d.,]+)\s+100[,.]00\s*%?\s+([\d.,]+)\s+100[,.]00\s*%?\s+([\d.,]+)\s+100[,.]00\s*%?\s+([\d.,]+)/
  );

  if (totalLineMatch) {
    // AF report: Inversis, Pictet, Banca March, CACEIS, Total
    const custodianValues = [
      { name: 'INVERSIS', total: parseEuropeanNumber(totalLineMatch[1]) },
      { name: 'PICTET', total: parseEuropeanNumber(totalLineMatch[2]) },
      { name: 'BANCA MARCH', total: parseEuropeanNumber(totalLineMatch[3]) },
      { name: 'CACEIS', total: parseEuropeanNumber(totalLineMatch[4]) },
    ];

    for (const cv of custodianValues) {
      custodians.push({
        custodian: cv.name,
        monetario: 0, rentaFija: 0, rentaVariable: 0,
        commodities: 0, alternativos: 0,
        total: cv.total,
        deposits: 0, netPnl: 0, previousValue: 0,
      });
    }
  } else {
    // Fallback: search for individual custodian totals
    for (const name of custodianNames) {
      // "Patrimonio a 31/12/2025 9.547.479"
      const prevPattern = new RegExp(
        `${name}[\\s\\S]{0,200}?Patrimonio a \\d{2}/\\d{2}/\\d{4}\\s+([\\d.,]+)`,
        'i'
      );
      const prevMatch = text.match(prevPattern);

      // "Beneficio Neto 240.611"
      const pnlPattern = new RegExp(
        `${name}[\\s\\S]{0,200}?Beneficio Neto\\s+([\\d.,]+)`,
        'i'
      );
      const pnlMatch = text.match(pnlPattern);

      if (prevMatch) {
        custodians.push({
          custodian: name,
          monetario: 0, rentaFija: 0, rentaVariable: 0,
          commodities: 0, alternativos: 0,
          total: 0,
          deposits: 0,
          netPnl: pnlMatch ? parseEuropeanNumber(pnlMatch[1]) : 0,
          previousValue: parseEuropeanNumber(prevMatch[1]),
        });
      }
    }
  }

  // Extract P&L and deposits per custodian from the detail section
  const detailPattern = /Aportación\/Retirada\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/;
  const detailMatch = text.match(detailPattern);
  if (detailMatch && custodians.length >= 4) {
    custodians[0].deposits = parseEuropeanNumber(detailMatch[1]);
    custodians[1].deposits = parseEuropeanNumber(detailMatch[2]);
    custodians[2].deposits = parseEuropeanNumber(detailMatch[3]);
    custodians[3].deposits = parseEuropeanNumber(detailMatch[4]);
  }

  const pnlPattern = /Beneficio Neto\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/;
  const pnlMatch = text.match(pnlPattern);
  if (pnlMatch && custodians.length >= 4) {
    custodians[0].netPnl = parseEuropeanNumber(pnlMatch[1]);
    custodians[1].netPnl = parseEuropeanNumber(pnlMatch[2]);
    custodians[2].netPnl = parseEuropeanNumber(pnlMatch[3]);
    custodians[3].netPnl = parseEuropeanNumber(pnlMatch[4]);
  }

  const prevPattern = /Patrimonio a \d{2}\/\d{2}\/\d{4}\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)/;
  const prevMatchLine = text.match(prevPattern);
  if (prevMatchLine && custodians.length >= 4) {
    custodians[0].previousValue = parseEuropeanNumber(prevMatchLine[1]);
    custodians[1].previousValue = parseEuropeanNumber(prevMatchLine[2]);
    custodians[2].previousValue = parseEuropeanNumber(prevMatchLine[3]);
    custodians[3].previousValue = parseEuropeanNumber(prevMatchLine[4]);
  }

  return custodians;
}

function parsePerformance(text: string): MdfPerformance[] {
  const performances: MdfPerformance[] = [];

  // "BALDOMERO AF GRUPO 3,56% 8,40% 7,98% 2,16% 23,84% 7,51%"
  const perfPattern = /BALDOMERO\s+([\w\s]+?)\s+(-?[\d.,]+)%\s+(-?[\d.,]+)%\s+(-?[\d.,]+)%\s+(-?[\d.,]+)%\s+(-?[\d.,]+)%\s+(-?[\d.,]+)%/g;
  let match;

  while ((match = perfPattern.exec(text)) !== null) {
    performances.push({
      portfolio: `BALDOMERO ${match[1].trim()}`,
      year2023: parseEuropeanNumber(match[2]),
      year2024: parseEuropeanNumber(match[3]),
      year2025: parseEuropeanNumber(match[4]),
      ytd: parseEuropeanNumber(match[5]),
      sinceInception: parseEuropeanNumber(match[6]),
      annualized: parseEuropeanNumber(match[7]),
    });
  }

  return performances;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

export async function parseMdfReporting(buffer: Buffer): Promise<MdfReportingData> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const text = data.text;

  if (!text || text.length < 100) {
    logger.warn('[MdF Parser] Insufficient text extracted from PDF');
    return emptyReport();
  }

  const reportDate = extractDate(text);
  const reportType = detectReportType(text);

  logger.info(`[MdF Parser] Type: ${reportType}, Date: ${reportDate}, Text: ${text.length} chars`);

  const summary = parseSummary(text, reportDate, reportType);
  const assetAllocation = parseAssetAllocation(text);
  const positions = parsePositions(text);
  const pePositions = parsePEPositions(text);
  const custodians = parseCustodians(text);
  const performance = parsePerformance(text);

  return {
    reportType,
    reportDate,
    portfolioCode: summary.portfolioCode,
    portfolioName: summary.portfolioName,
    summary,
    assetAllocation,
    positions,
    pePositions,
    custodians,
    performance,
    rawText: text,
  };
}

function emptyReport(): MdfReportingData {
  return {
    reportType: 'AF',
    reportDate: '',
    portfolioCode: '',
    portfolioName: '',
    summary: {
      reportDate: '', portfolioCode: '', portfolioName: '',
      currency: 'EUR', totalValue: 0, previousValue: 0,
      deposits: 0, withdrawals: 0, netPnl: 0, fees: 0,
    },
    assetAllocation: [],
    positions: [],
    pePositions: [],
    custodians: [],
    performance: [],
    rawText: '',
  };
}

/**
 * Parse a Capital Call / Distribution notice PDF.
 */
export interface MdfCapitalCallData {
  fundName: string;
  noticeDate: string;
  paymentDate: string;
  currency: string;
  investorName: string;
  commitment: number;
  participationPct: number;
  calledAmount: number;
  cumulativeCalledAmount: number;
  pendingCapital: number;
  cumulativeDistributions: number;
  isDistribution: boolean;
  bankDetails?: {
    beneficiary: string;
    bank: string;
    iban: string;
    bic: string;
  };
}

export async function parseMdfCapitalCall(buffer: Buffer): Promise<MdfCapitalCallData | null> {
  const pdfParse = (await import('pdf-parse')).default;
  const data = await pdfParse(buffer);
  const text = data.text;

  if (!text || text.length < 50) return null;

  const isDistribution = /distribu/i.test(text);

  // Fund name
  const fundNameMatch = text.match(/Nombre del Fondo\s+(.+?)(?:\n|$)/i) ||
    text.match(/(?:SOLICITUD DE DESEMBOLSO|Capital (?:Call|Distribution) Notice)\s*\n\s*(.+?)(?:\n|,)/i);
  const fundName = fundNameMatch ? fundNameMatch[1].trim() : '';

  // Dates
  const noticeDateMatch = text.match(/Fecha de Notificación\s+(\d{2}\/\d{2}\/\d{4})/i);
  const paymentDateMatch = text.match(/(?:Fecha para desembolso|fecha límite)\s+(\d{2}\/\d{2}\/\d{4}|\d+ de \w+ del? \d{4})/i);

  // Amounts for investor
  const commitmentMatch = text.match(/Compromiso del inversor\s+([\d.,]+)/i);
  const participationMatch = text.match(/% de participación del inversor[^0-9]*([\d.,]+)\s*%/i);
  const calledMatch = text.match(/Cantidad a desembolsar en la presente notificación\s+([\d.,]+)/i) ||
    text.match(/Cantidad a desembolsar\/distribuir[^0-9]*([\d.,]+)/i);
  const cumulativeCalledMatch = text.match(/Desembolsos.*acumulados.*incluyendo[^0-9]*([\d.,]+)/i);
  const pendingMatch = text.match(/Capital pendiente de desembolsar.*incluyendo[^0-9]*([\d.,]+)/i);
  const distribMatch = text.match(/Distribuciones.*acumuladas[^0-9]*\(?([0-9.,]+)\)?/i);

  // Bank details
  const ibanMatch = text.match(/IBAN:\s*([A-Z]{2}\d{22,24})/i);
  const bicMatch = text.match(/BIC:\s*(\w+)/i);
  const bankMatch = text.match(/Banco:\s*(.+?)(?:\n|$)/i);
  const beneficiaryMatch = text.match(/Beneficiario:\s*(.+?)(?:\n|$)/i);

  // Investor name
  const investorMatch = text.match(/(?:nivel de|información.*de)\s+(Vidaro[^.]*?S\.L\.?|Vibla[^.]*?S\.C\.R[^.]*)/i);

  return {
    fundName,
    noticeDate: noticeDateMatch ? noticeDateMatch[1] : '',
    paymentDate: paymentDateMatch ? paymentDateMatch[1] : '',
    currency: 'EUR',
    investorName: investorMatch ? investorMatch[1].trim() : 'Vidaro Inversiones S.L.',
    commitment: commitmentMatch ? parseEuropeanNumber(commitmentMatch[1]) : 0,
    participationPct: participationMatch ? parseEuropeanNumber(participationMatch[1]) : 0,
    calledAmount: calledMatch ? parseEuropeanNumber(calledMatch[1]) : 0,
    cumulativeCalledAmount: cumulativeCalledMatch ? parseEuropeanNumber(cumulativeCalledMatch[1]) : 0,
    pendingCapital: pendingMatch ? parseEuropeanNumber(pendingMatch[1]) : 0,
    cumulativeDistributions: distribMatch ? parseEuropeanNumber(distribMatch[1]) : 0,
    isDistribution,
    bankDetails: ibanMatch ? {
      beneficiary: beneficiaryMatch?.[1]?.trim() || '',
      bank: bankMatch?.[1]?.trim() || '',
      iban: ibanMatch[1],
      bic: bicMatch?.[1] || '',
    } : undefined,
  };
}
