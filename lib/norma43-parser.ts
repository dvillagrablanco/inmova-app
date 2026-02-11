/**
 * Parser de ficheros Norma 43 (AEB Cuaderno 43)
 * 
 * Formato estándar de la banca española para extractos de cuenta.
 * Todos los bancos españoles (Bankinter, BBVA, Santander, CaixaBank, etc.)
 * exportan movimientos en este formato.
 * 
 * Estructura del fichero:
 * - Registro 11: Cabecera de cuenta
 * - Registro 22: Cabecera de movimiento  
 * - Registro 23: Concepto complementario (opcional, múltiples)
 * - Registro 24: Equivalencia en divisa (opcional)
 * - Registro 33: Final de cuenta
 * - Registro 88: Final de fichero
 * 
 * Coste: €0 - El usuario descarga el fichero desde la banca online
 * 
 * @see https://www.aeb.es/servicio/descargar/cuaderno-43
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface N43Account {
  bankCode: string;        // Código entidad (4 dígitos) - Bankinter: 0128
  branchCode: string;      // Código oficina (4 dígitos)
  accountNumber: string;   // Número de cuenta (10 dígitos)
  startDate: Date;         // Fecha inicial
  endDate: Date;           // Fecha final
  initialBalance: number;  // Saldo inicial
  finalBalance: number;    // Saldo final
  currency: string;        // Moneda (978 = EUR)
  iban?: string;           // IBAN reconstruido
  entries: number;         // Número de apuntes debe
  entriesCredit: number;   // Número de apuntes haber
  totalDebit: number;      // Total debe
  totalCredit: number;     // Total haber
  transactions: N43Transaction[];
}

export interface N43Transaction {
  branchCode: string;          // Oficina origen
  transactionDate: Date;       // Fecha operación
  valueDate: Date;             // Fecha valor
  commonConcept: string;       // Concepto común (2 dígitos)
  ownConcept: string;          // Concepto propio (3 dígitos)
  debitCredit: 'D' | 'H';     // D=Débito, H=Haber (crédito)
  amount: number;              // Importe (siempre positivo, signo por debitCredit)
  signedAmount: number;        // Importe con signo (+ ingreso, - gasto)
  documentNumber: string;      // Número de documento
  reference1?: string;         // Referencia 1
  reference2?: string;         // Referencia 2
  description: string;         // Descripción (concatenación de conceptos complementarios)
  conceptLines: string[];      // Líneas de concepto complementario individuales
  rawLine: string;             // Línea original del fichero
}

export interface N43ParseResult {
  accounts: N43Account[];
  errors: string[];
  warnings: string[];
  totalTransactions: number;
  fileName?: string;
}

// ============================================================================
// MAPEO DE CONCEPTOS COMUNES (Cuaderno 43, Registro 22, posiciones 23-24)
// ============================================================================

const COMMON_CONCEPTS: Record<string, string> = {
  '01': 'Reintegro en efectivo / talonario',
  '02': 'Ingreso en efectivo',
  '03': 'Domiciliación/recibo',
  '04': 'Transferencia',
  '05': 'Cheque',
  '06': 'Efectos',
  '07': 'Operaciones en divisas',
  '08': 'Amortización préstamo',
  '09': 'Cancelación préstamo',
  '10': 'Efectos cartera',
  '11': 'Remesa de efectos',
  '12': 'Descuento comercial',
  '13': 'Factoring',
  '14': 'Corresponsalía',
  '15': 'Operaciones extranjero',
  '16': 'Compra/venta valores',
  '17': 'Dividendos/cupones',
  '18': 'Gestión de cobro/recobro',
  '19': 'Devolución impagados',
  '20': 'Intereses',
  '21': 'Liquidaciones',
  '22': 'Comisiones',
  '23': 'Impuestos/retenciones',
  '24': 'Créditos documentarios',
  '25': 'Seguros',
  '26': 'Operaciones varias',
  '27': 'Avales/fianzas',
  '28': 'Cajero automático',
  '29': 'Tarjeta crédito/débito',
  '30': 'Nómina',
  '31': 'Seguridad Social',
  '32': 'Hacienda Pública',
  '33': 'Periodificación seguros',
  '34': 'Otras periodificaciones',
  '35': 'Canon',
  '36': 'Pago proveedores',
  '37': 'Cobros clientes',
  '38': 'Traspasos internos',
  '39': 'Traspaso a plazo fijo',
  '40': 'Traspaso desde plazo fijo',
  '98': 'Anulación / corrección',
  '99': 'Varios',
};

// Bancos españoles por código de entidad
const BANK_CODES: Record<string, string> = {
  '0049': 'Santander',
  '0182': 'BBVA',
  '2100': 'CaixaBank',
  '0081': 'Sabadell',
  '0128': 'Bankinter',
  '1465': 'ING',
  '0073': 'Openbank',
  '2085': 'Ibercaja',
  '2038': 'Bankia',
  '0075': 'Popular',
  '2013': 'Catalunyacaixa',
  '0019': 'Deutsche Bank',
  '0065': 'Barclays',
  '0487': 'Deutsche Bank SAE',
  '3058': 'Cajamar',
  '3085': 'Caja España',
  '0030': 'Bankinter (alt)',
};

// ============================================================================
// PARSER
// ============================================================================

/**
 * Parsea un fichero Norma 43 completo
 */
export function parseNorma43(content: string, fileName?: string): N43ParseResult {
  const result: N43ParseResult = {
    accounts: [],
    errors: [],
    warnings: [],
    totalTransactions: 0,
    fileName,
  };

  // Normalizar saltos de línea
  const lines = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    result.errors.push('Fichero vacío');
    return result;
  }

  let currentAccount: N43Account | null = null;
  let currentTransaction: N43Transaction | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    const recordType = line.substring(0, 2);

    try {
      switch (recordType) {
        case '11': // Cabecera de cuenta
          currentAccount = parseAccountHeader(line, lineNumber, result);
          currentTransaction = null;
          break;

        case '22': // Movimiento principal
          if (!currentAccount) {
            result.errors.push(`Línea ${lineNumber}: Movimiento sin cabecera de cuenta`);
            break;
          }
          // Si hay una transacción anterior pendiente, guardarla
          if (currentTransaction) {
            finalizeTransaction(currentTransaction);
            currentAccount.transactions.push(currentTransaction);
          }
          currentTransaction = parseTransaction(line, lineNumber, currentAccount, result);
          break;

        case '23': // Concepto complementario
          if (currentTransaction) {
            parseComplementaryConcept(line, currentTransaction);
          } else {
            result.warnings.push(`Línea ${lineNumber}: Concepto complementario sin movimiento asociado`);
          }
          break;

        case '24': // Equivalencia en divisas (ignorar por ahora)
          break;

        case '33': // Final de cuenta
          if (currentTransaction) {
            finalizeTransaction(currentTransaction);
            currentAccount?.transactions.push(currentTransaction);
            currentTransaction = null;
          }
          if (currentAccount) {
            parseAccountFooter(line, currentAccount, lineNumber, result);
            result.accounts.push(currentAccount);
            result.totalTransactions += currentAccount.transactions.length;
            currentAccount = null;
          }
          break;

        case '88': // Final de fichero
          // Nada que hacer, ya se procesó todo
          break;

        default:
          result.warnings.push(`Línea ${lineNumber}: Tipo de registro desconocido "${recordType}"`);
      }
    } catch (error: any) {
      result.errors.push(`Línea ${lineNumber}: ${error.message}`);
    }
  }

  // Si quedó una transacción o cuenta sin cerrar
  if (currentTransaction && currentAccount) {
    finalizeTransaction(currentTransaction);
    currentAccount.transactions.push(currentTransaction);
  }
  if (currentAccount) {
    result.accounts.push(currentAccount);
    result.totalTransactions += currentAccount.transactions.length;
    result.warnings.push('Fichero terminó sin registro 33 (cierre de cuenta)');
  }

  return result;
}

// ============================================================================
// PARSERS DE REGISTROS INDIVIDUALES
// ============================================================================

function parseAccountHeader(line: string, lineNumber: number, result: N43ParseResult): N43Account {
  // Reg 11: Cabecera de cuenta
  // Pos 1-2: Tipo registro (11)
  // Pos 3-6: Código entidad (4)
  // Pos 7-10: Código oficina (4)
  // Pos 11-20: Número de cuenta (10)
  // Pos 21-26: Fecha inicio (AAMMDD)
  // Pos 27-32: Fecha final (AAMMDD)
  // Pos 33-33: Clave debe/haber saldo inicial (1=Debe/deudor, 2=Haber/acreedor)
  // Pos 34-47: Importe saldo inicial (14, 2 decimales)
  // Pos 48-50: Clave divisa (3)
  // Pos 51-51: Modalidad información (1=Pesetas, 2=Divisa, 3=ambas)

  const bankCode = line.substring(2, 6);
  const branchCode = line.substring(6, 10);
  const accountNumber = line.substring(10, 20);
  const startDate = parseN43Date(line.substring(20, 26));
  const endDate = parseN43Date(line.substring(26, 32));
  const balanceSign = line.substring(32, 33); // 1=Debe(negativo), 2=Haber(positivo)
  const initialBalance = parseN43Amount(line.substring(33, 47));
  const currencyCode = line.substring(47, 50).trim();

  const signedBalance = balanceSign === '1' ? -initialBalance : initialBalance;
  const currency = currencyCode === '978' ? 'EUR' : (currencyCode || 'EUR');

  // Intentar reconstruir IBAN (España = ES)
  const iban = reconstructIBAN(bankCode, branchCode, accountNumber);

  const bankName = BANK_CODES[bankCode] || `Banco ${bankCode}`;

  return {
    bankCode,
    branchCode,
    accountNumber,
    startDate,
    endDate,
    initialBalance: signedBalance,
    finalBalance: 0, // Se llenará con registro 33
    currency,
    iban,
    entries: 0,
    entriesCredit: 0,
    totalDebit: 0,
    totalCredit: 0,
    transactions: [],
  };
}

function parseTransaction(
  line: string,
  lineNumber: number,
  account: N43Account,
  result: N43ParseResult
): N43Transaction {
  // Reg 22: Cabecera de movimiento
  // Pos 1-2: Tipo registro (22)
  // Pos 3-6: Libre (código entidad se repite o libre)
  // Pos 7-10: Código oficina origen (4)
  // Pos 11-16: Fecha operación (AAMMDD)
  // Pos 17-22: Fecha valor (AAMMDD)
  // Pos 23-24: Concepto común (2)
  // Pos 25-27: Concepto propio de la entidad (3)
  // Pos 28-28: Clave debe/haber (1=Debe, 2=Haber)
  // Pos 29-42: Importe (14, 2 decimales implícitos)
  // Pos 43-52: Número documento (10)
  // Pos 53-64: Referencia 1 (12)
  // Pos 65-80: Referencia 2 (16)

  const branchCode = line.substring(6, 10);
  const transactionDate = parseN43Date(line.substring(10, 16));
  const valueDate = parseN43Date(line.substring(16, 22));
  const commonConcept = line.substring(22, 24);
  const ownConcept = line.substring(24, 27);
  const debitCredit = line.substring(27, 28) === '1' ? 'D' : 'H';
  const amount = parseN43Amount(line.substring(28, 42));
  const documentNumber = line.substring(42, 52).trim();
  const reference1 = line.substring(52, 64).trim() || undefined;
  const reference2 = line.substring(64, 80).trim() || undefined;

  const signedAmount = debitCredit === 'D' ? -amount : amount;

  // Descripción inicial con el concepto común
  const conceptDesc = COMMON_CONCEPTS[commonConcept] || `Concepto ${commonConcept}`;

  return {
    branchCode,
    transactionDate,
    valueDate,
    commonConcept,
    ownConcept,
    debitCredit: debitCredit as 'D' | 'H',
    amount,
    signedAmount,
    documentNumber,
    reference1,
    reference2,
    description: conceptDesc,
    conceptLines: [],
    rawLine: line,
  };
}

function parseComplementaryConcept(line: string, transaction: N43Transaction): void {
  // Reg 23: Concepto complementario
  // Pos 1-2: Tipo registro (23)
  // Pos 3-4: Código dato (01-63, define tipo de información)
  // Pos 5-42: Concepto 1 (38 caracteres)
  // Pos 43-80: Concepto 2 (38 caracteres)

  const dataCode = line.substring(2, 4);
  const concept1 = line.substring(4, 42).trim();
  const concept2 = line.substring(42, 80).trim();

  if (concept1) {
    transaction.conceptLines.push(concept1);
  }
  if (concept2) {
    transaction.conceptLines.push(concept2);
  }
}

function parseAccountFooter(
  line: string,
  account: N43Account,
  lineNumber: number,
  result: N43ParseResult
): void {
  // Reg 33: Final de cuenta
  // Pos 1-2: Tipo registro (33)
  // Pos 3-6: Código entidad (4)
  // Pos 7-10: (libre)
  // Pos 11-14: Número de apuntes al debe (4)
  // Pos 15-28: Total importes al debe (14, 2 decimales)
  // Pos 29-32: Número de apuntes al haber (4)
  // Pos 33-46: Total importes al haber (14, 2 decimales)
  // Pos 47-47: Clave debe/haber saldo final
  // Pos 48-61: Saldo final (14, 2 decimales)
  // Pos 62-64: Clave divisa

  const entries = parseInt(line.substring(10, 14), 10) || 0;
  const totalDebit = parseN43Amount(line.substring(14, 28));
  const entriesCredit = parseInt(line.substring(28, 32), 10) || 0;
  const totalCredit = parseN43Amount(line.substring(32, 46));
  const finalBalanceSign = line.substring(46, 47);
  const finalBalance = parseN43Amount(line.substring(47, 61));

  account.entries = entries;
  account.entriesCredit = entriesCredit;
  account.totalDebit = totalDebit;
  account.totalCredit = totalCredit;
  account.finalBalance = finalBalanceSign === '1' ? -finalBalance : finalBalance;
}

function finalizeTransaction(transaction: N43Transaction): void {
  // Construir descripción completa concatenando los conceptos complementarios
  if (transaction.conceptLines.length > 0) {
    transaction.description = transaction.conceptLines.join(' ').trim();
  }
  // Si no hay conceptos complementarios, mantener el concepto común como descripción
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Parsea una fecha en formato AAMMDD
 */
function parseN43Date(dateStr: string): Date {
  if (!dateStr || dateStr.length !== 6) {
    return new Date();
  }
  const year = parseInt(dateStr.substring(0, 2), 10);
  const month = parseInt(dateStr.substring(2, 4), 10);
  const day = parseInt(dateStr.substring(4, 6), 10);

  // Años 00-49 = 2000-2049, 50-99 = 1950-1999
  const fullYear = year < 50 ? 2000 + year : 1900 + year;

  return new Date(fullYear, month - 1, day);
}

/**
 * Parsea un importe Norma 43 (14 dígitos, 2 decimales implícitos)
 */
function parseN43Amount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/\s/g, '');
  const value = parseInt(cleaned, 10);
  if (isNaN(value)) return 0;
  return value / 100; // 2 decimales implícitos
}

/**
 * Reconstruye el IBAN español a partir de los componentes
 */
function reconstructIBAN(bankCode: string, branchCode: string, accountNumber: string): string {
  // CCC (Código Cuenta Cliente) = entidad(4) + oficina(4) + DC(2) + cuenta(10)
  // El IBAN español = ES + 2 dígitos de control + CCC (20 dígitos)
  // Los DC del CCC no están en el N43, así que reconstruimos con XX
  const ccc = bankCode + branchCode + accountNumber;
  
  // Intentar calcular dígitos de control IBAN
  // Para simplificar, devolvemos formato parcial
  return `ES**${bankCode}${branchCode}**${accountNumber}`;
}

/**
 * Obtiene el nombre del banco a partir de su código
 */
export function getBankName(bankCode: string): string {
  return BANK_CODES[bankCode] || `Banco (${bankCode})`;
}

/**
 * Obtiene la descripción de un concepto común
 */
export function getConceptDescription(conceptCode: string): string {
  return COMMON_CONCEPTS[conceptCode] || `Concepto ${conceptCode}`;
}

/**
 * Clasifica automáticamente una transacción N43 como ingreso o gasto
 * y sugiere una categoría
 */
export function classifyTransaction(tx: N43Transaction): {
  tipo: 'ingreso' | 'gasto';
  categoriasugerida: string;
} {
  const tipo = tx.debitCredit === 'H' ? 'ingreso' : 'gasto';
  
  let categoriasugerida = 'otros';
  
  const concept = tx.commonConcept;
  const desc = tx.description.toLowerCase();

  // Mapeo de conceptos a categorías Inmova
  if (['02', '04', '37'].includes(concept)) {
    categoriasugerida = tipo === 'ingreso' ? 'cobro_alquiler' : 'transferencia';
  } else if (['03'].includes(concept)) {
    categoriasugerida = 'domiciliacion';
  } else if (['20', '21'].includes(concept)) {
    categoriasugerida = 'intereses';
  } else if (['22'].includes(concept)) {
    categoriasugerida = 'comisiones_bancarias';
  } else if (['23', '32'].includes(concept)) {
    categoriasugerida = 'impuestos';
  } else if (['25'].includes(concept)) {
    categoriasugerida = 'seguros';
  } else if (['29'].includes(concept)) {
    categoriasugerida = 'tarjeta';
  } else if (['30'].includes(concept)) {
    categoriasugerida = 'nomina';
  } else if (['31'].includes(concept)) {
    categoriasugerida = 'seguridad_social';
  } else if (['36'].includes(concept)) {
    categoriasugerida = 'proveedor';
  } else if (['38', '39', '40'].includes(concept)) {
    categoriasugerida = 'traspaso_interno';
  }

  // Refinamiento por descripción
  if (desc.includes('alquiler') || desc.includes('renta') || desc.includes('arrendamiento')) {
    categoriasugerida = 'cobro_alquiler';
  } else if (desc.includes('comunidad') || desc.includes('comunid')) {
    categoriasugerida = 'comunidad';
  } else if (desc.includes('seguro') || desc.includes('poliza')) {
    categoriasugerida = 'seguros';
  } else if (desc.includes('agua') || desc.includes('luz') || desc.includes('gas') || desc.includes('electricidad')) {
    categoriasugerida = 'suministros';
  } else if (desc.includes('ibi') || desc.includes('hacienda') || desc.includes('ayuntamiento')) {
    categoriasugerida = 'impuestos';
  }

  return { tipo, categoriasugerida };
}
