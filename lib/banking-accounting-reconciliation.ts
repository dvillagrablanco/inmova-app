/**
 * RECONCILIACIÓN BANCARIA ↔ CONTABILIDAD (Zucchetti)
 *
 * Cruza los movimientos bancarios reales (Enable Banking / CAMT.053)
 * con los apuntes contables de Zucchetti (grupo 57 = cuentas bancarias).
 *
 * Objetivo: detectar discrepancias entre lo que el banco refleja
 * y lo que está registrado en la contabilidad del Grupo Vidaro.
 *
 * Flujo:
 *   1. BankTransaction (Enable Banking) ↔ AccountingTransaction (Zucchetti grupo 57)
 *      → Match por: importe exacto + fecha ±5 días + referencia
 *   2. BankTransaction no matcheada → pendiente de contabilizar
 *   3. AccountingTransaction no matcheada → apunte contable sin movimiento bancario
 *
 * @module lib/banking-accounting-reconciliation
 */

import { logger } from '@/lib/logger';
import { getPrismaClient } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ReconciliationMatch {
  bankTxId: string;
  accountingTxId: string;
  bankDate: Date;
  accountingDate: Date;
  amount: number;
  matchType: 'exact' | 'amount_date' | 'amount_only' | 'reference';
  confidence: number; // 0-100
  bankDescription: string;
  accountingConcepto: string;
}

export interface ReconciliationGap {
  type: 'bank_only' | 'accounting_only';
  txId: string;
  date: Date;
  amount: number;
  description: string;
  companyId: string;
  companyName?: string;
}

export interface ReconciliationResult {
  companyId: string;
  companyName: string;
  period: { from: Date; to: Date };
  summary: {
    bankTransactions: number;
    accountingTransactions: number;
    matched: number;
    bankOnly: number; // movimientos bancarios sin apunte contable
    accountingOnly: number; // apuntes contables sin movimiento bancario
    matchRate: number; // % de coincidencias
    bankBalance: number;
    accountingBalance: number;
    discrepancy: number; // diferencia entre saldo bancario y contable
  };
  matches: ReconciliationMatch[];
  gaps: ReconciliationGap[];
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

const DATE_TOLERANCE_DAYS = 5;
const AMOUNT_TOLERANCE_PCT = 0.001; // 0.1% de tolerancia de importe
const AMOUNT_TOLERANCE_ABS = 0.02; // o ±0.02 €

// Cuentas contables PGC que representan movimientos bancarios (grupo 57)
const BANK_PGC_ACCOUNTS = [
  '570',
  '571',
  '572',
  '573',
  '574',
  '575',
  '576',
  '577',
  '5700',
  '5701',
  '5720',
  '5721',
  '5722',
  '5723',
];

// ═══════════════════════════════════════════════════════════════
// FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════

function amountMatches(a: number, b: number): boolean {
  const absDiff = Math.abs(a - b);
  const relDiff = Math.abs(a) > 0 ? absDiff / Math.abs(a) : absDiff;
  return absDiff <= AMOUNT_TOLERANCE_ABS || relDiff <= AMOUNT_TOLERANCE_PCT;
}

function dateMatches(d1: Date, d2: Date): boolean {
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  return diffMs <= DATE_TOLERANCE_DAYS * 24 * 60 * 60 * 1000;
}

function normalizeReference(ref?: string | null): string {
  if (!ref) return '';
  return ref
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function referenceMatches(ref1?: string | null, ref2?: string | null): boolean {
  const r1 = normalizeReference(ref1);
  const r2 = normalizeReference(ref2);
  if (!r1 || !r2) return false;
  return r1.includes(r2) || r2.includes(r1) || r1 === r2;
}

// ═══════════════════════════════════════════════════════════════
// MOTOR DE RECONCILIACIÓN
// ═══════════════════════════════════════════════════════════════

/**
 * Ejecuta la reconciliación bancaria-contable para una sociedad.
 *
 * @param companyId   ID de la sociedad en Inmova
 * @param fromDate    Fecha inicio del período a reconciliar
 * @param toDate      Fecha fin del período a reconciliar
 */
export async function reconcileBankingVsAccounting(
  companyId: string,
  fromDate: Date,
  toDate: Date
): Promise<ReconciliationResult> {
  const prisma = getPrismaClient();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true },
  });

  const result: ReconciliationResult = {
    companyId,
    companyName: company?.nombre || companyId,
    period: { from: fromDate, to: toDate },
    summary: {
      bankTransactions: 0,
      accountingTransactions: 0,
      matched: 0,
      bankOnly: 0,
      accountingOnly: 0,
      matchRate: 0,
      bankBalance: 0,
      accountingBalance: 0,
      discrepancy: 0,
    },
    matches: [],
    gaps: [],
  };

  // 1. Obtener movimientos bancarios del período (Enable Banking / CAMT.053)
  const bankTxs = await prisma.bankTransaction.findMany({
    where: {
      companyId,
      fecha: { gte: fromDate, lte: toDate },
      estado: { not: 'descartado' },
    },
    select: {
      id: true,
      fecha: true,
      monto: true,
      descripcion: true,
      referencia: true,
      creditorName: true,
      debtorName: true,
      estado: true,
    },
    orderBy: { fecha: 'asc' },
  });

  // 2. Obtener apuntes contables del período (Zucchetti grupo 57 = cuentas bancarias)
  //    La categoría 'ingreso_financiero' y 'gasto_financiero' + tipo 'cobro'/'pago'
  //    corresponden a movimientos de cuentas bancarias en PGC
  const accountingTxs = await prisma.accountingTransaction.findMany({
    where: {
      companyId,
      fecha: { gte: fromDate, lte: toDate },
      // Incluir todos los tipos: cobros, pagos, transferencias bancarias
      tipo: { in: ['cobro', 'pago', 'transferencia', 'ajuste'] as any[] },
    },
    select: {
      id: true,
      fecha: true,
      monto: true,
      concepto: true,
      referencia: true,
      tipo: true,
      categoria: true,
    },
    orderBy: { fecha: 'asc' },
  });

  result.summary.bankTransactions = bankTxs.length;
  result.summary.accountingTransactions = accountingTxs.length;

  // Calcular saldos
  result.summary.bankBalance = bankTxs.reduce((sum, tx) => sum + tx.monto, 0);
  result.summary.accountingBalance = accountingTxs.reduce((sum, tx) => {
    // En contabilidad, cobros = positivo, pagos = negativo
    return sum + (tx.tipo === 'pago' ? -Math.abs(tx.monto) : Math.abs(tx.monto));
  }, 0);
  result.summary.discrepancy = result.summary.bankBalance - result.summary.accountingBalance;

  logger.info(
    `[Reconciliation] ${company?.nombre}: ${bankTxs.length} bank txs, ${accountingTxs.length} accounting txs`
  );

  // 3. Algoritmo de matching
  const matchedBankIds = new Set<string>();
  const matchedAccountingIds = new Set<string>();

  // Paso A: Match exacto por importe + fecha + referencia (confianza 100)
  for (const bankTx of bankTxs) {
    for (const accTx of accountingTxs) {
      if (matchedAccountingIds.has(accTx.id)) continue;

      const sameAmount = amountMatches(Math.abs(bankTx.monto), Math.abs(accTx.monto));
      const sameDate = dateMatches(bankTx.fecha, accTx.fecha);
      const sameRef = referenceMatches(bankTx.referencia, accTx.referencia);

      if (sameAmount && sameDate && sameRef) {
        result.matches.push({
          bankTxId: bankTx.id,
          accountingTxId: accTx.id,
          bankDate: bankTx.fecha,
          accountingDate: accTx.fecha,
          amount: Math.abs(bankTx.monto),
          matchType: 'reference',
          confidence: 100,
          bankDescription: bankTx.descripcion,
          accountingConcepto: accTx.concepto,
        });
        matchedBankIds.add(bankTx.id);
        matchedAccountingIds.add(accTx.id);
        break;
      }
    }
  }

  // Paso B: Match por importe + fecha (confianza 85)
  for (const bankTx of bankTxs) {
    if (matchedBankIds.has(bankTx.id)) continue;

    for (const accTx of accountingTxs) {
      if (matchedAccountingIds.has(accTx.id)) continue;

      const sameAmount = amountMatches(Math.abs(bankTx.monto), Math.abs(accTx.monto));
      const sameDate = dateMatches(bankTx.fecha, accTx.fecha);

      if (sameAmount && sameDate) {
        result.matches.push({
          bankTxId: bankTx.id,
          accountingTxId: accTx.id,
          bankDate: bankTx.fecha,
          accountingDate: accTx.fecha,
          amount: Math.abs(bankTx.monto),
          matchType: 'amount_date',
          confidence: 85,
          bankDescription: bankTx.descripcion,
          accountingConcepto: accTx.concepto,
        });
        matchedBankIds.add(bankTx.id);
        matchedAccountingIds.add(accTx.id);
        break;
      }
    }
  }

  // Paso C: Match solo por importe (confianza 60)
  for (const bankTx of bankTxs) {
    if (matchedBankIds.has(bankTx.id)) continue;

    for (const accTx of accountingTxs) {
      if (matchedAccountingIds.has(accTx.id)) continue;

      const sameAmount = amountMatches(Math.abs(bankTx.monto), Math.abs(accTx.monto));

      if (sameAmount) {
        result.matches.push({
          bankTxId: bankTx.id,
          accountingTxId: accTx.id,
          bankDate: bankTx.fecha,
          accountingDate: accTx.fecha,
          amount: Math.abs(bankTx.monto),
          matchType: 'amount_only',
          confidence: 60,
          bankDescription: bankTx.descripcion,
          accountingConcepto: accTx.concepto,
        });
        matchedBankIds.add(bankTx.id);
        matchedAccountingIds.add(accTx.id);
        break;
      }
    }
  }

  // 4. Detectar brechas
  // Movimientos bancarios sin apunte contable
  for (const bankTx of bankTxs) {
    if (!matchedBankIds.has(bankTx.id)) {
      result.gaps.push({
        type: 'bank_only',
        txId: bankTx.id,
        date: bankTx.fecha,
        amount: bankTx.monto,
        description: bankTx.descripcion,
        companyId,
        companyName: company?.nombre,
      });
    }
  }

  // Apuntes contables sin movimiento bancario
  for (const accTx of accountingTxs) {
    if (!matchedAccountingIds.has(accTx.id)) {
      result.gaps.push({
        type: 'accounting_only',
        txId: accTx.id,
        date: accTx.fecha,
        amount: accTx.monto,
        description: accTx.concepto,
        companyId,
        companyName: company?.nombre,
      });
    }
  }

  // 5. Actualizar estado de conciliación en BankTransaction
  if (result.matches.length > 0) {
    await prisma.$transaction(
      result.matches.map((m) =>
        prisma.bankTransaction.update({
          where: { id: m.bankTxId },
          data: {
            estado: 'conciliado',
            conciliadoPor: `accounting_${m.matchType}`,
            conciliadoEn: new Date(),
            notasConciliacion: `Apunte Zucchetti: ${m.accountingTxId} (confianza: ${m.confidence}%)`,
          },
        })
      )
    );
  }

  result.summary.matched = result.matches.length;
  result.summary.bankOnly = result.gaps.filter((g) => g.type === 'bank_only').length;
  result.summary.accountingOnly = result.gaps.filter((g) => g.type === 'accounting_only').length;
  result.summary.matchRate =
    result.summary.bankTransactions > 0
      ? Math.round((result.summary.matched / result.summary.bankTransactions) * 100)
      : 0;

  logger.info(
    `[Reconciliation] ${company?.nombre}: ${result.summary.matched} matches (${result.summary.matchRate}%), ` +
      `${result.summary.bankOnly} bank_only, ${result.summary.accountingOnly} accounting_only, ` +
      `discrepancy: ${result.summary.discrepancy.toFixed(2)}€`
  );

  return result;
}

/**
 * Reconcilia TODAS las sociedades del Grupo Vidaro.
 */
export async function reconcileAllGrupoVidaro(
  fromDate?: Date,
  toDate?: Date
): Promise<ReconciliationResult[]> {
  const prisma = getPrismaClient();

  const from = fromDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const to = toDate || new Date();

  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { nombre: { contains: 'Rovida', mode: 'insensitive' } },
        { nombre: { contains: 'Viroda', mode: 'insensitive' } },
        { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
        { nombre: { contains: 'VIBLA', mode: 'insensitive' } },
      ],
      activo: true,
    },
    select: { id: true, nombre: true },
  });

  const results: ReconciliationResult[] = [];

  for (const company of companies) {
    try {
      const result = await reconcileBankingVsAccounting(company.id, from, to);
      results.push(result);
    } catch (e: any) {
      logger.error(`[Reconciliation] Error en ${company.nombre}:`, e);
    }
  }

  const total = results.reduce(
    (acc, r) => ({
      matched: acc.matched + r.summary.matched,
      bankOnly: acc.bankOnly + r.summary.bankOnly,
      accountingOnly: acc.accountingOnly + r.summary.accountingOnly,
      discrepancy: acc.discrepancy + r.summary.discrepancy,
    }),
    { matched: 0, bankOnly: 0, accountingOnly: 0, discrepancy: 0 }
  );

  logger.info(
    `[Reconciliation] Grupo completo: ${total.matched} matches, ` +
      `${total.bankOnly} bank_only, ${total.accountingOnly} accounting_only, ` +
      `discrepancia total: ${total.discrepancy.toFixed(2)}€`
  );

  return results;
}
