/**
 * Parser de ficheros CAMT.053 (ISO 20022 - Bank to Customer Statement)
 *
 * Formato XML estándar ISO usado por Bankinter y otros bancos europeos
 * para exportar extractos de cuenta. Es el sucesor del formato Norma 43.
 *
 * Namespace: urn:iso:std:iso:20022:tech:xsd:camt.053.001.02
 *
 * Estructura:
 * - Document > BkToCstmrStmt > GrpHdr (cabecera)
 * - Document > BkToCstmrStmt > Stmt (extracto)
 *   - Stmt > Acct (cuenta: IBAN, titular, banco)
 *   - Stmt > Bal (saldos: OPBD=apertura, CLBD=cierre)
 *   - Stmt > Ntry[] (movimientos)
 *     - Ntry > Amt, CdtDbtInd, BookgDt, ValDt
 *     - Ntry > NtryDtls > TxDtls > RltdPties (partes)
 *     - Ntry > NtryDtls > TxDtls > RmtInf > Ustrd (concepto)
 *
 * Coste: €0 - Descarga desde banca online de Bankinter
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface CAMT053Statement {
  messageId: string;
  creationDate: string;
  account: CAMT053Account;
  balances: CAMT053Balance[];
  entries: CAMT053Entry[];
  periodFrom: string;
  periodTo: string;
}

export interface CAMT053Account {
  iban: string;
  ownerName: string;
  bankName: string;
  country: string;
}

export interface CAMT053Balance {
  type: 'OPBD' | 'CLBD' | string; // OPBD=apertura, CLBD=cierre
  amount: number;
  currency: string;
  creditDebit: 'CRDT' | 'DBIT';
  date: string;
  signedAmount: number; // Positivo si CRDT, negativo si DBIT
}

export interface CAMT053Entry {
  amount: number;
  currency: string;
  creditDebit: 'CRDT' | 'DBIT';
  signedAmount: number;
  status: string; // BOOK, PDNG, etc.
  bookingDate: string;
  valueDate: string;
  // Código de transacción bancaria
  domainCode?: string;    // PMNT, etc.
  familyCode?: string;    // RCDT, RDDT, ICDT, etc.
  subFamilyCode?: string; // ESCT, BBDD, DMCT, etc.
  // Partes relacionadas
  debtorName?: string;
  debtorId?: string;
  creditorName?: string;
  creditorId?: string;
  ultimateDebtorName?: string;
  ultimateCreditorName?: string;
  // Información de remesa / concepto
  description: string;
  reference?: string;
  // Clasificación para Inmova
  tipo: 'ingreso' | 'gasto';
  categoriasugerida: string;
}

export interface CAMT053ParseResult {
  statements: CAMT053Statement[];
  errors: string[];
  warnings: string[];
  totalEntries: number;
  fileName?: string;
}

// ============================================================================
// CLASIFICACIÓN DE TRANSACCIONES ISO 20022
// ============================================================================

// Domain > Family > SubFamily
// PMNT = Payments
//   RCDT = Received Credit Transfers
//     ESCT = SEPA Credit Transfer
//     DMCT = Domestic Credit Transfer
//   RDDT = Received Direct Debits
//     BBDD = SEPA B2B Direct Debit
//     ESDD = SEPA Core Direct Debit
//   ICDT = Issued Credit Transfers
//     ESCT = SEPA Credit Transfer
//   IDDT = Issued Direct Debits

const FAMILY_DESCRIPTIONS: Record<string, string> = {
  'RCDT': 'Transferencia recibida',
  'RDDT': 'Adeudo directo recibido',
  'ICDT': 'Transferencia emitida',
  'IDDT': 'Adeudo directo emitido',
  'MCRD': 'Tarjeta',
  'CNTR': 'Efectivo/ventanilla',
  'COMM': 'Comisiones',
  'NTAV': 'No disponible',
};

const SUBFAMILY_DESCRIPTIONS: Record<string, string> = {
  'ESCT': 'Transferencia SEPA',
  'DMCT': 'Transferencia doméstica',
  'BBDD': 'Adeudo directo B2B SEPA',
  'ESDD': 'Adeudo directo core SEPA',
  'AUTT': 'Transferencia automática',
  'SALA': 'Nómina',
  'TAXS': 'Impuestos',
  'GOVT': 'Gobierno/administración',
  'OTHR': 'Otros',
};

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

/**
 * Parsea un fichero CAMT.053 (ISO 20022 XML)
 */
export function parseCamt053(xmlContent: string, fileName?: string): CAMT053ParseResult {
  const result: CAMT053ParseResult = {
    statements: [],
    errors: [],
    warnings: [],
    totalEntries: 0,
    fileName,
  };

  try {
    // Parsear XML manualmente (sin dependencias externas)
    const doc = parseXMLSimple(xmlContent);

    // Buscar todos los Stmt (statements)
    const stmts = findElements(doc, 'Stmt');

    if (stmts.length === 0) {
      result.errors.push('No se encontraron extractos (Stmt) en el fichero');
      return result;
    }

    // Cabecera
    const grpHdr = findElement(doc, 'GrpHdr');
    const msgId = getElementText(grpHdr, 'MsgId') || '';
    const creDtTm = getElementText(grpHdr, 'CreDtTm') || '';

    for (const stmt of stmts) {
      try {
        const statement = parseStatement(stmt, msgId, creDtTm);
        result.statements.push(statement);
        result.totalEntries += statement.entries.length;
      } catch (error: any) {
        result.errors.push(`Error parseando extracto: ${error.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Error parseando XML: ${error.message}`);
  }

  return result;
}

// ============================================================================
// PARSERS INTERNOS
// ============================================================================

function parseStatement(stmtXml: string, msgId: string, creDtTm: string): CAMT053Statement {
  // Periodo
  const frDtTm = getElementText(stmtXml, 'FrDtTm') || '';
  const toDtTm = getElementText(stmtXml, 'ToDtTm') || '';

  // Cuenta
  const acctBlock = findElement(stmtXml, 'Acct') || '';
  const iban = getElementText(acctBlock, 'IBAN') || '';
  const ownerName = getNestedText(acctBlock, 'Ownr', 'Nm') || '';
  const svcr = findElement(acctBlock, 'Svcr') || '';
  const bankName = getNestedText(svcr, 'FinInstnId', 'Nm') || '';
  const country = getElementText(svcr, 'Ctry') || 'ES';

  // Saldos
  const balances = parseBalances(stmtXml);

  // Movimientos
  const entries = parseEntries(stmtXml);

  return {
    messageId: msgId,
    creationDate: creDtTm,
    account: { iban, ownerName, bankName, country },
    balances,
    entries,
    periodFrom: frDtTm.split('T')[0],
    periodTo: toDtTm.split('T')[0],
  };
}

function parseBalances(stmtXml: string): CAMT053Balance[] {
  const balances: CAMT053Balance[] = [];
  const balBlocks = findAllElements(stmtXml, 'Bal');

  for (const bal of balBlocks) {
    const typeCode = getElementText(bal, 'Cd') || '';
    const amtMatch = bal.match(/<Amt\s+Ccy="([^"]+)">([^<]+)<\/Amt>/);
    const currency = amtMatch?.[1] || 'EUR';
    const amount = parseFloat(amtMatch?.[2] || '0');
    const cdtDbt = getElementText(bal, 'CdtDbtInd') || 'CRDT';
    const date = getElementText(bal, 'Dt') || '';

    const signedAmount = cdtDbt === 'DBIT' ? -amount : amount;

    balances.push({
      type: typeCode,
      amount,
      currency,
      creditDebit: cdtDbt as 'CRDT' | 'DBIT',
      date,
      signedAmount,
    });
  }

  return balances;
}

function parseEntries(stmtXml: string): CAMT053Entry[] {
  const entries: CAMT053Entry[] = [];
  const ntryBlocks = findAllElements(stmtXml, 'Ntry');

  for (const ntry of ntryBlocks) {
    try {
      const entry = parseSingleEntry(ntry);
      entries.push(entry);
    } catch {
      // Skip malformed entries
    }
  }

  return entries;
}

function parseSingleEntry(ntryXml: string): CAMT053Entry {
  // Importe y moneda
  const amtMatch = ntryXml.match(/<Amt\s+Ccy="([^"]+)">([^<]+)<\/Amt>/);
  const currency = amtMatch?.[1] || 'EUR';
  const amount = parseFloat(amtMatch?.[2] || '0');

  // Débito/Crédito
  const cdtDbt = getElementText(ntryXml, 'CdtDbtInd') || 'DBIT';
  const signedAmount = cdtDbt === 'DBIT' ? -amount : amount;

  // Estado
  const status = getElementText(ntryXml, 'Sts') || 'BOOK';

  // Fechas
  const bookingDtBlock = findElement(ntryXml, 'BookgDt') || '';
  const bookingDate = (getElementText(bookingDtBlock, 'DtTm') || getElementText(bookingDtBlock, 'Dt') || '').split('T')[0];
  const valDtBlock = findElement(ntryXml, 'ValDt') || '';
  const valueDate = (getElementText(valDtBlock, 'Dt') || getElementText(valDtBlock, 'DtTm') || '').split('T')[0];

  // Código de transacción
  const txCd = findElement(ntryXml, 'BkTxCd') || '';
  const domn = findElement(txCd, 'Domn') || '';
  const domainCode = getDirectChildText(domn, 'Cd') || '';
  const fmly = findElement(domn, 'Fmly') || '';
  const familyCode = getDirectChildText(fmly, 'Cd') || '';
  const subFamilyCode = getElementText(fmly, 'SubFmlyCd') || '';

  // Detalles de la transacción
  const txDtls = findElement(ntryXml, 'TxDtls') || '';
  const rltdPties = findElement(txDtls, 'RltdPties') || '';

  // Partes
  const dbtrBlock = findElement(rltdPties, 'Dbtr') || '';
  const debtorName = cleanName(getElementText(dbtrBlock, 'Nm') || '');

  const cdtrBlock = findElement(rltdPties, 'Cdtr') || '';
  const creditorName = cleanName(getElementText(cdtrBlock, 'Nm') || '');

  const ultDbtrBlock = findElement(rltdPties, 'UltmtDbtr') || '';
  const ultimateDebtorName = cleanName(getElementText(ultDbtrBlock, 'Nm') || '');
  const debtorId = getNestedDeepText(ultDbtrBlock, 'Id') || '';

  const ultCdtrBlock = findElement(rltdPties, 'UltmtCdtr') || '';
  const ultimateCreditorName = cleanName(getElementText(ultCdtrBlock, 'Nm') || '');
  const creditorId = getNestedDeepText(cdtrBlock, 'Id') || '';

  // Concepto / remittance info
  const rmtInf = findElement(txDtls, 'RmtInf') || '';
  const ustrd = getElementText(rmtInf, 'Ustrd') || '';

  // Construir descripción
  let description = ustrd;
  if (!description) {
    const counterparty = cdtDbt === 'DBIT' ? creditorName : debtorName;
    description = counterparty || `${FAMILY_DESCRIPTIONS[familyCode] || familyCode} - ${SUBFAMILY_DESCRIPTIONS[subFamilyCode] || subFamilyCode}`;
  }

  // Clasificar
  const { tipo, categoriasugerida } = classifyCamt053Entry(
    cdtDbt as 'CRDT' | 'DBIT',
    familyCode,
    subFamilyCode,
    description,
    debtorName,
    creditorName
  );

  return {
    amount,
    currency,
    creditDebit: cdtDbt as 'CRDT' | 'DBIT',
    signedAmount,
    status,
    bookingDate,
    valueDate,
    domainCode,
    familyCode,
    subFamilyCode,
    debtorName: debtorName || undefined,
    debtorId: debtorId || undefined,
    creditorName: creditorName || undefined,
    creditorId: creditorId || undefined,
    ultimateDebtorName: ultimateDebtorName || undefined,
    ultimateCreditorName: ultimateCreditorName || undefined,
    description,
    reference: ustrd || undefined,
    tipo,
    categoriasugerida,
  };
}

// ============================================================================
// CLASIFICACIÓN AUTOMÁTICA
// ============================================================================

function classifyCamt053Entry(
  cdtDbt: 'CRDT' | 'DBIT',
  familyCode: string,
  subFamilyCode: string,
  description: string,
  debtorName: string,
  creditorName: string
): { tipo: 'ingreso' | 'gasto'; categoriasugerida: string } {
  const tipo = cdtDbt === 'CRDT' ? 'ingreso' : 'gasto';
  let cat = 'otros';

  const desc = description.toLowerCase();
  const debtor = debtorName.toLowerCase();
  const creditor = creditorName.toLowerCase();

  // Por familia ISO 20022
  if (familyCode === 'RDDT' || familyCode === 'IDDT') {
    cat = 'domiciliacion';
  } else if (familyCode === 'RCDT' && cdtDbt === 'CRDT') {
    cat = 'cobro_transferencia';
  } else if (familyCode === 'RCDT' && cdtDbt === 'DBIT') {
    cat = 'pago_transferencia';
  } else if (familyCode === 'MCRD') {
    cat = 'tarjeta';
  } else if (familyCode === 'COMM') {
    cat = 'comisiones_bancarias';
  }

  // Refinamiento por descripción
  if (desc.includes('alquiler') || desc.includes('renta') || desc.includes('arrendamiento') || desc.includes('mensualidad')) {
    cat = tipo === 'ingreso' ? 'cobro_alquiler' : 'pago_alquiler';
  } else if (desc.includes('fianza') || desc.includes('deposito')) {
    cat = 'fianza';
  } else if (desc.includes('comunidad') || desc.includes('comunid')) {
    cat = 'comunidad';
  } else if (desc.includes('seguro') || desc.includes('poliza') || desc.includes('mapfre') || desc.includes('axa') || desc.includes('allianz') || desc.includes('generali')) {
    cat = 'seguros';
  } else if (desc.includes('agua') || desc.includes('luz') || desc.includes('gas') || desc.includes('electric') || desc.includes('iberdrola') || desc.includes('endesa') || desc.includes('naturgy')) {
    cat = 'suministros';
  } else if (desc.includes('ibi') || desc.includes('hacienda') || desc.includes('ayuntamiento') || desc.includes('agencia tributaria') || desc.includes('impuesto') || desc.includes('tasa')) {
    cat = 'impuestos';
  } else if (desc.includes('nomina') || desc.includes('salario') || subFamilyCode === 'SALA') {
    cat = 'nomina';
  } else if (desc.includes('comision') || desc.includes('mantenimiento cuenta') || desc.includes('liquidacion')) {
    cat = 'comisiones_bancarias';
  } else if (desc.includes('hipoteca') || desc.includes('prestamo') || desc.includes('amortizacion')) {
    cat = 'hipoteca';
  } else if (desc.includes('prosegur') || desc.includes('alarma') || desc.includes('securitas')) {
    cat = 'seguridad';
  } else if (desc.includes('prevencion') || desc.includes('limpieza') || desc.includes('mantenimiento')) {
    cat = 'mantenimiento';
  } else if (desc.includes('devolucion')) {
    cat = 'devolucion';
  }

  // Por nombre de contraparte
  if (debtor.includes('confederacion hidrografica') || creditor.includes('confederacion hidrografica')) {
    cat = 'suministros'; // canon de agua
  }

  return { tipo, categoriasugerida: cat };
}

// ============================================================================
// XML PARSER SIMPLE (sin dependencias externas)
// ============================================================================

function parseXMLSimple(xml: string): string {
  // Devolver el XML limpio como string para procesamiento con regex
  return xml.replace(/<!--[\s\S]*?-->/g, '').trim();
}

function findElement(xml: string, tag: string): string | null {
  // Busca el primer bloque <tag>...</tag> (non-greedy)
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[0] : null;
}

function findElements(xml: string, tag: string): string[] {
  // Busca todos los bloques <tag>...</tag> al primer nivel
  const results: string[] = [];
  let remaining = xml;
  const openTag = `<${tag}`;
  const closeTag = `</${tag}>`;

  while (true) {
    const startIdx = remaining.indexOf(openTag);
    if (startIdx === -1) break;

    // Encontrar el cierre correspondiente (considerando anidamiento)
    let depth = 0;
    let pos = startIdx;
    let endIdx = -1;

    while (pos < remaining.length) {
      const nextOpen = remaining.indexOf(openTag, pos + 1);
      const nextClose = remaining.indexOf(closeTag, pos + 1);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        pos = nextOpen + 1;
      } else {
        if (depth === 0) {
          endIdx = nextClose + closeTag.length;
          break;
        }
        depth--;
        pos = nextClose + 1;
      }
    }

    if (endIdx === -1) break;

    results.push(remaining.substring(startIdx, endIdx));
    remaining = remaining.substring(endIdx);
  }

  return results;
}

function findAllElements(xml: string, tag: string): string[] {
  // Versión más simple: encuentra todos los <tag>...</tag>
  const results: string[] = [];
  const openTag = `<${tag}`;
  const closeTag = `</${tag}>`;
  let searchFrom = 0;

  while (true) {
    const start = xml.indexOf(openTag, searchFrom);
    if (start === -1) break;

    const end = xml.indexOf(closeTag, start);
    if (end === -1) break;

    results.push(xml.substring(start, end + closeTag.length));
    searchFrom = end + closeTag.length;
  }

  return results;
}

function getElementText(xml: string | null, tag: string): string {
  if (!xml) return '';
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function getDirectChildText(xml: string | null, tag: string): string {
  // Obtiene el texto del primer hijo directo con ese tag (no anidado)
  if (!xml) return '';
  // Buscar <Cd> que no esté dentro de otro sub-bloque
  const regex = new RegExp(`>\\s*<${tag}>([^<]*)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function getNestedText(xml: string | null, parentTag: string, childTag: string): string {
  if (!xml) return '';
  const parent = findElement(xml, parentTag);
  if (!parent) return '';
  return getElementText(parent, childTag);
}

function getNestedDeepText(xml: string | null, tag: string): string {
  if (!xml) return '';
  // Buscar recursivamente
  const block = findElement(xml, tag);
  if (!block) return '';
  // Buscar el texto más profundo (ej: Othr > Id)
  const innerMatch = block.match(/<Id>([^<]+)<\/Id>/);
  return innerMatch ? innerMatch[1].trim() : '';
}

function cleanName(name: string): string {
  // Limpiar nombres que vienen con prefijos CORE o padding
  return name
    .replace(/^CORE/g, '')
    .replace(/\s+/g, ' ')
    .replace(/NOTPROVIDE$/i, '')
    .trim();
}

// ============================================================================
// UTILIDADES EXPORTADAS
// ============================================================================

/**
 * Detecta si un contenido es CAMT.053 XML
 */
export function isCamt053(content: string): boolean {
  return content.includes('camt.053') || content.includes('BkToCstmrStmt');
}

/**
 * Detecta si un contenido es Norma 43 (texto plano con registros 11/22/33/88)
 */
export function isNorma43(content: string): boolean {
  const firstLine = content.trim().substring(0, 2);
  return firstLine === '11' || firstLine === '00';
}
