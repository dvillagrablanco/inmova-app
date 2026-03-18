/**
 * Parser de Norma 43 (AEB Cuaderno 43)
 *
 * Formato estándar español para extractos bancarios.
 * Archivos de texto plano con registros de 80 caracteres por línea.
 *
 * Tipos de registro:
 *   11 — Cabecera de cuenta
 *   22 — Movimiento principal
 *   23 — Movimiento complementario (texto adicional)
 *   33 — Final de cuenta (saldo final, totales)
 *   88 — Final de archivo
 *
 * Referencia: https://www.norma43.net/blog/la-estructura-de-un-fichero-en-norma-43/
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface Norma43Statement {
  /** Código de entidad (banco), 4 dígitos */
  bankCode: string;
  /** Código de oficina/sucursal, 4 dígitos */
  branchCode: string;
  /** Número de cuenta, 10 dígitos */
  accountNumber: string;
  /** Cuenta completa (entidad+oficina+DC+cuenta) */
  fullAccount: string;
  /** Fecha inicio del extracto (YYYY-MM-DD) */
  startDate: string;
  /** Fecha fin del extracto (YYYY-MM-DD) */
  endDate: string;
  /** Saldo inicial */
  openingBalance: number;
  /** Signo del saldo inicial: 1=deudor(negativo), 2=acreedor(positivo) */
  openingBalanceSign: number;
  /** Saldo final */
  closingBalance: number;
  /** Signo del saldo final */
  closingBalanceSign: number;
  /** Número de apuntes al debe */
  debitCount: number;
  /** Número de apuntes al haber */
  creditCount: number;
  /** Total importes al debe */
  totalDebits: number;
  /** Total importes al haber */
  totalCredits: number;
  /** Moneda (EUR por defecto) */
  currency: string;
  /** Movimientos */
  movements: Norma43Movement[];
}

export interface Norma43Movement {
  /** Fecha de operación (YYYY-MM-DD) */
  date: string;
  /** Fecha valor (YYYY-MM-DD) */
  valueDate: string;
  /** Importe (positivo para crédito, negativo para débito) */
  amount: number;
  /** Importe absoluto */
  absoluteAmount: number;
  /** Crédito o débito */
  creditDebit: 'CRDT' | 'DBIT';
  /** Código concepto común AEB (2 dígitos) */
  commonConcept: string;
  /** Código concepto propio de la entidad (3 dígitos) */
  ownConcept: string;
  /** Descripción combinada (registro 22 + registros 23) */
  description: string;
  /** Referencia 1 del movimiento */
  reference1?: string;
  /** Referencia 2 del movimiento */
  reference2?: string;
  /** Número de documento */
  documentNumber?: string;
  /** Líneas complementarias (de registros 23) */
  complementaryInfo: string[];
}

export interface Norma43ParseResult {
  success: boolean;
  statements: Norma43Statement[];
  errors: string[];
  /** Total de movimientos en todos los extractos */
  totalMovements: number;
  /** Total de líneas procesadas */
  linesProcessed: number;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrae substring de posición fija (1-based positions como en la spec).
 * pos es 0-based aquí para simplicidad interna.
 */
function substr(line: string, start: number, length: number): string {
  return (line.substring(start, start + length) || '').trim();
}

/**
 * Parsea una fecha en formato AAMMDD → YYYY-MM-DD.
 * Si el año < 80, asume 20XX; si >= 80 asume 19XX.
 */
function parseDate(yymmdd: string): string {
  if (!yymmdd || yymmdd.length < 6) return '';
  const yy = parseInt(yymmdd.substring(0, 2), 10);
  const mm = yymmdd.substring(2, 4);
  const dd = yymmdd.substring(4, 6);
  const yyyy = yy < 80 ? 2000 + yy : 1900 + yy;
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parsea un importe en formato de la Norma 43: 14 dígitos con 2 decimales implícitos.
 */
function parseAmount(raw: string): number {
  const cleaned = raw.replace(/\s/g, '');
  if (!cleaned) return 0;
  const num = parseInt(cleaned, 10);
  return num / 100;
}

/**
 * Decodifica el signo del saldo: 1=deudor(negativo), 2=acreedor(positivo).
 */
function applySign(amount: number, sign: number): number {
  return sign === 1 ? -Math.abs(amount) : Math.abs(amount);
}

// ============================================================================
// PARSER PRINCIPAL
// ============================================================================

/**
 * Parsea un archivo de texto en formato Norma 43 (AEB Cuaderno 43).
 *
 * @param content Contenido del archivo como string
 * @returns Resultado del parseo con extractos, movimientos y errores
 */
export function parseNorma43(content: string): Norma43ParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  const errors: string[] = [];
  const statements: Norma43Statement[] = [];

  let currentStatement: Norma43Statement | null = null;
  let currentMovement: Norma43Movement | null = null;
  let lineNumber = 0;

  for (const rawLine of lines) {
    lineNumber++;
    // Norma 43 lines should be 80 chars; pad if shorter
    const line = rawLine.padEnd(80);
    const recordType = line.substring(0, 2);

    try {
      switch (recordType) {
        case '11': {
          // ── CABECERA DE CUENTA ──
          // Pos 0-1: Tipo registro (11)
          // Pos 2-5: Código de entidad (banco)
          // Pos 6-9: Código de oficina
          // Pos 10-19: Número de cuenta
          // Pos 20-21: Saldo inicial debe(1)/haber(2)
          // Pos 22-27: Fecha inicial (AAMMDD)
          // Pos 28-41: Saldo inicial (14 dígitos, 2 decimales)
          // Pos 42-44: Clave de divisa (978 = EUR)
          // Pos 45-47: Modalidad de información
          // Pos 48-73: Nombre abreviado de la cuenta
          // Pos 74-79: Libre

          // Si hay un statement anterior abierto sin cerrar, guardarlo
          if (currentStatement) {
            if (currentMovement) {
              currentStatement.movements.push(currentMovement);
              currentMovement = null;
            }
            statements.push(currentStatement);
          }

          const bankCode = substr(line, 2, 4);
          const branchCode = substr(line, 6, 4);
          const accountNumber = substr(line, 10, 10);
          const balanceSign = parseInt(substr(line, 20, 2), 10) || 2;
          const startDate = parseDate(substr(line, 22, 6));
          const openingBalance = parseAmount(substr(line, 28, 14));
          const currencyCode = substr(line, 42, 3);

          currentStatement = {
            bankCode,
            branchCode,
            accountNumber,
            fullAccount: `${bankCode}${branchCode}${accountNumber}`,
            startDate,
            endDate: '',
            openingBalance: applySign(openingBalance, balanceSign),
            openingBalanceSign: balanceSign,
            closingBalance: 0,
            closingBalanceSign: 2,
            debitCount: 0,
            creditCount: 0,
            totalDebits: 0,
            totalCredits: 0,
            currency: currencyCode === '978' ? 'EUR' : currencyCode || 'EUR',
            movements: [],
          };
          break;
        }

        case '22': {
          // ── MOVIMIENTO PRINCIPAL ──
          // Pos 0-1: Tipo registro (22)
          // Pos 2-5: Código de entidad (=cabecera)
          // Pos 6-9: Código de oficina (=cabecera)
          // Pos 10-19: Número de cuenta (=cabecera)
          // Pos 20-27: Fecha de operación (compartida: libre+AAMMDD)
          //   o bien Pos 20-25: Fecha de operación AAMMDD
          // Pos 26-31: Fecha valor AAMMDD
          // Pos 32-33: Concepto común (código AEB, 2 dígitos)
          // Pos 34-36: Concepto propio (3 dígitos entidad)
          // Pos 37-38: Debe(1)/Haber(2)
          // Pos 39-52: Importe (14 dígitos, 2 decimales)
          // Pos 53-63: Número de documento
          // Pos 64-68: Referencia 1
          // Pos 69-79: Referencia 2

          if (!currentStatement) {
            errors.push(`Línea ${lineNumber}: Movimiento sin cabecera de cuenta`);
            break;
          }

          // Guardar movimiento anterior si existe
          if (currentMovement) {
            currentStatement.movements.push(currentMovement);
          }

          const opDate = parseDate(substr(line, 20, 6));
          const valDate = parseDate(substr(line, 26, 6));
          const commonConcept = substr(line, 32, 2);
          const ownConcept = substr(line, 34, 3);
          const debitCredit = parseInt(substr(line, 37, 2), 10) || 2;
          const amount = parseAmount(substr(line, 39, 14));
          const docNumber = substr(line, 53, 11);
          const ref1 = substr(line, 64, 5);
          const ref2 = substr(line, 69, 11);

          const isDebit = debitCredit === 1;
          const signedAmount = isDebit ? -amount : amount;

          currentMovement = {
            date: opDate,
            valueDate: valDate,
            amount: signedAmount,
            absoluteAmount: amount,
            creditDebit: isDebit ? 'DBIT' : 'CRDT',
            commonConcept,
            ownConcept,
            description: '', // Se completará con registros 23
            reference1: ref1 || undefined,
            reference2: ref2 || undefined,
            documentNumber: docNumber || undefined,
            complementaryInfo: [],
          };
          break;
        }

        case '23': {
          // ── MOVIMIENTO COMPLEMENTARIO ──
          // Pos 0-1: Tipo registro (23)
          // Pos 2-3: Código de dato (01-06)
          // Pos 4-41: Concepto / texto libre 1
          // Pos 42-79: Concepto / texto libre 2

          if (!currentMovement) {
            // Registro 23 sin movimiento 22 previo — ignorar
            break;
          }

          const dataCode = substr(line, 2, 2);
          const text1 = substr(line, 4, 38);
          const text2 = substr(line, 42, 38);

          const combined = [text1, text2].filter(Boolean).join(' ').trim();
          if (combined) {
            currentMovement.complementaryInfo.push(combined);
          }
          break;
        }

        case '33': {
          // ── FINAL DE CUENTA ──
          // Pos 0-1: Tipo registro (33)
          // Pos 2-5: Código de entidad
          // Pos 6-9: Código de oficina
          // Pos 10-19: Número de cuenta
          // Pos 20-24: Número de apuntes al debe
          // Pos 25-38: Total importes al debe (14 dígitos)
          // Pos 39-43: Número de apuntes al haber
          // Pos 44-57: Total importes al haber (14 dígitos)
          // Pos 58-59: Saldo final debe(1)/haber(2)
          // Pos 60-73: Saldo final (14 dígitos)
          // Pos 74-77: Divisa
          // Pos 78-79: Libre

          if (!currentStatement) {
            errors.push(`Línea ${lineNumber}: Final de cuenta sin cabecera`);
            break;
          }

          // Guardar último movimiento
          if (currentMovement) {
            currentStatement.movements.push(currentMovement);
            currentMovement = null;
          }

          currentStatement.debitCount = parseInt(substr(line, 20, 5), 10) || 0;
          currentStatement.totalDebits = parseAmount(substr(line, 25, 14));
          currentStatement.creditCount = parseInt(substr(line, 39, 5), 10) || 0;
          currentStatement.totalCredits = parseAmount(substr(line, 44, 14));
          const closingSign = parseInt(substr(line, 58, 2), 10) || 2;
          const closingBal = parseAmount(substr(line, 60, 14));
          currentStatement.closingBalance = applySign(closingBal, closingSign);
          currentStatement.closingBalanceSign = closingSign;

          // Fecha fin = fecha del último movimiento o fecha de cierre
          if (currentStatement.movements.length > 0) {
            const lastMov = currentStatement.movements[currentStatement.movements.length - 1];
            currentStatement.endDate = lastMov.date || lastMov.valueDate;
          }

          statements.push(currentStatement);
          currentStatement = null;
          break;
        }

        case '88': {
          // ── FINAL DE ARCHIVO ──
          // Guardar lo que quede pendiente
          if (currentMovement && currentStatement) {
            currentStatement.movements.push(currentMovement);
            currentMovement = null;
          }
          if (currentStatement) {
            statements.push(currentStatement);
            currentStatement = null;
          }
          break;
        }

        default: {
          // Líneas desconocidas — ignorar silenciosamente
          // (pueden ser líneas vacías o formatos extendidos)
          break;
        }
      }
    } catch (err: any) {
      errors.push(`Línea ${lineNumber}: ${err.message}`);
    }
  }

  // Cerrar cualquier cosa que quede abierta
  if (currentMovement && currentStatement) {
    currentStatement.movements.push(currentMovement);
  }
  if (currentStatement) {
    statements.push(currentStatement);
  }

  // Post-proceso: construir description de cada movimiento combinando registros 23
  for (const stmt of statements) {
    for (const mov of stmt.movements) {
      const parts: string[] = [];
      if (mov.complementaryInfo.length > 0) {
        parts.push(...mov.complementaryInfo);
      }
      mov.description = parts.join(' | ').trim();
    }
  }

  const totalMovements = statements.reduce((sum, s) => sum + s.movements.length, 0);

  return {
    success: errors.length === 0,
    statements,
    errors,
    totalMovements,
    linesProcessed: lineNumber,
  };
}

/**
 * Detecta si un contenido de texto es formato Norma 43.
 * Busca registros 11 y 22 al inicio del archivo.
 */
export function isNorma43(content: string): boolean {
  const lines = content.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return false;

  // Primera línea significativa debe ser registro 11
  const first = lines[0];
  if (first.length >= 2 && first.substring(0, 2) === '11') return true;

  // O buscar en las primeras 5 líneas
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const lt = lines[i].substring(0, 2);
    if (lt === '11' || lt === '22') return true;
  }

  return false;
}
