/**
 * SERVICIO DE CONCILIACIÓN BANCARIA
 * 
 * Sistema automático de matching entre transacciones bancarias y pagos pendientes.
 * 
 * Flujo de conciliación:
 * 1. Obtiene transacciones bancarias no conciliadas
 * 2. Para cada transacción, busca pagos pendientes que coincidan:
 *    - Mismo importe (con tolerancia configurable)
 *    - Referencia en concepto que coincida con patrón
 *    - Fecha coherente
 * 3. Si encuentra match, marca el pago como "pagado"
 * 4. Registra la conciliación para auditoría
 * 
 * @module BankReconciliationService
 */

import { prisma } from './db';
import logger from './logger';
import { format, subDays, isAfter, isBefore, addDays } from 'date-fns';

// ============================================================================
// TIPOS
// ============================================================================

export interface ReconciliationResult {
  success: boolean;
  transactionsProcessed: number;
  paymentsReconciled: number;
  manualReviewRequired: number;
  errors: ReconciliationError[];
  details: ReconciliationDetail[];
}

export interface ReconciliationError {
  transactionId: string;
  error: string;
}

export interface ReconciliationDetail {
  transactionId: string;
  paymentId: string | null;
  amount: number;
  status: 'matched' | 'unmatched' | 'manual_review' | 'error';
  matchType?: 'exact_amount' | 'reference' | 'tenant_iban' | 'fuzzy';
  confidence: number; // 0-100
  reason?: string;
}

export interface ReconciliationOptions {
  companyId?: string;
  bankConnectionId?: string;
  daysBack?: number;
  amountTolerance?: number; // Tolerancia en euros
  dryRun?: boolean;
  autoApproveThreshold?: number; // Confianza mínima para auto-aprobar (0-100)
}

export interface MatchCandidate {
  paymentId: string;
  confidence: number;
  matchType: string;
  reasons: string[];
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const DEFAULT_OPTIONS: Required<ReconciliationOptions> = {
  companyId: '',
  bankConnectionId: '',
  daysBack: 30,
  amountTolerance: 0.01, // 1 céntimo de tolerancia
  dryRun: false,
  autoApproveThreshold: 90, // Auto-aprobar si confianza >= 90%
};

// Patrones para detectar referencias de alquiler en conceptos
const RENT_PATTERNS = [
  /alquiler/i,
  /renta/i,
  /mensualidad/i,
  /piso\s*\d/i,
  /apartamento/i,
  /vivienda/i,
  /arrendamiento/i,
  /inquilino/i,
];

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

/**
 * Ejecuta la conciliación bancaria automática
 */
export async function runBankReconciliation(
  options: ReconciliationOptions = {}
): Promise<ReconciliationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const result: ReconciliationResult = {
    success: true,
    transactionsProcessed: 0,
    paymentsReconciled: 0,
    manualReviewRequired: 0,
    errors: [],
    details: [],
  };

  try {
    logger.info('🏦 Iniciando conciliación bancaria', opts);

    // 1. Obtener transacciones bancarias no conciliadas
    const transactions = await getUnreconciledTransactions(opts);
    result.transactionsProcessed = transactions.length;

    logger.info(`📋 Transacciones a procesar: ${transactions.length}`);

    // 2. Procesar cada transacción
    for (const transaction of transactions) {
      try {
        const detail = await processTransaction(transaction, opts);
        result.details.push(detail);

        if (detail.status === 'matched' && detail.paymentId) {
          result.paymentsReconciled++;
        } else if (detail.status === 'manual_review') {
          result.manualReviewRequired++;
        }
      } catch (error: any) {
        result.errors.push({
          transactionId: transaction.id,
          error: error.message,
        });
        result.details.push({
          transactionId: transaction.id,
          paymentId: null,
          amount: Number(transaction.amount),
          status: 'error',
          confidence: 0,
          reason: error.message,
        });
      }
    }

    result.success = result.errors.length === 0;

    logger.info('📊 Conciliación completada', {
      processed: result.transactionsProcessed,
      reconciled: result.paymentsReconciled,
      manualReview: result.manualReviewRequired,
      errors: result.errors.length,
    });

    return result;
  } catch (error: any) {
    logger.error('Error en conciliación bancaria:', error);
    result.success = false;
    result.errors.push({
      transactionId: 'global',
      error: error.message,
    });
    return result;
  }
}

/**
 * Obtiene transacciones bancarias no conciliadas
 */
async function getUnreconciledTransactions(
  opts: Required<ReconciliationOptions>
): Promise<any[]> {
  const dateFrom = subDays(new Date(), opts.daysBack);

  const where: any = {
    conciliado: false,
    tipo: 'ingreso', // Solo ingresos (cobros)
    fecha: { gte: dateFrom },
  };

  if (opts.companyId) {
    where.bankConnection = {
      companyId: opts.companyId,
    };
  }

  if (opts.bankConnectionId) {
    where.bankConnectionId = opts.bankConnectionId;
  }

  return prisma.bankTransaction.findMany({
    where,
    include: {
      bankConnection: {
        include: {
          company: true,
        },
      },
    },
    orderBy: { fecha: 'desc' },
  });
}

/**
 * Procesa una transacción e intenta encontrar un pago coincidente
 */
async function processTransaction(
  transaction: any,
  opts: Required<ReconciliationOptions>
): Promise<ReconciliationDetail> {
  const amount = Number(transaction.amount);
  const companyId = transaction.bankConnection?.companyId;

  // Buscar pagos pendientes candidatos
  const candidates = await findMatchingPayments(
    transaction,
    companyId,
    opts.amountTolerance
  );

  // Si no hay candidatos
  if (candidates.length === 0) {
    return {
      transactionId: transaction.id,
      paymentId: null,
      amount,
      status: 'unmatched',
      confidence: 0,
      reason: 'No se encontraron pagos pendientes que coincidan',
    };
  }

  // Ordenar por confianza
  candidates.sort((a, b) => b.confidence - a.confidence);
  const bestMatch = candidates[0];

  // Si la confianza es alta y no es dry run, conciliar automáticamente
  if (bestMatch.confidence >= opts.autoApproveThreshold && !opts.dryRun) {
    await reconcilePayment(transaction, bestMatch.paymentId);

    return {
      transactionId: transaction.id,
      paymentId: bestMatch.paymentId,
      amount,
      status: 'matched',
      matchType: bestMatch.matchType as any,
      confidence: bestMatch.confidence,
      reason: `Auto-conciliado: ${bestMatch.reasons.join(', ')}`,
    };
  }

  // Si hay match pero no suficiente confianza, marcar para revisión manual
  if (bestMatch.confidence >= 50) {
    if (!opts.dryRun) {
      await markForManualReview(transaction, candidates);
    }

    return {
      transactionId: transaction.id,
      paymentId: bestMatch.paymentId,
      amount,
      status: 'manual_review',
      matchType: bestMatch.matchType as any,
      confidence: bestMatch.confidence,
      reason: `Requiere revisión: ${bestMatch.reasons.join(', ')}`,
    };
  }

  // Confianza muy baja
  return {
    transactionId: transaction.id,
    paymentId: null,
    amount,
    status: 'unmatched',
    confidence: bestMatch.confidence,
    reason: 'Coincidencia de baja confianza',
  };
}

/**
 * Busca pagos pendientes que puedan coincidir con la transacción
 */
async function findMatchingPayments(
  transaction: any,
  companyId: string,
  amountTolerance: number
): Promise<MatchCandidate[]> {
  const amount = Number(transaction.amount);
  const transactionDate = new Date(transaction.fecha);
  const concept = transaction.concepto || '';

  // Buscar pagos pendientes con importe similar
  const pendingPayments = await prisma.payment.findMany({
    where: {
      estado: { in: ['pendiente', 'atrasado'] },
      contract: {
        unit: {
          building: { companyId },
        },
      },
      monto: {
        gte: amount - amountTolerance,
        lte: amount + amountTolerance,
      },
    },
    include: {
      contract: {
        include: {
          tenant: true,
          unit: {
            include: {
              building: true,
            },
          },
        },
      },
    },
  });

  const candidates: MatchCandidate[] = [];

  for (const payment of pendingPayments) {
    let confidence = 0;
    const reasons: string[] = [];
    let matchType = 'fuzzy';

    // 1. Match exacto de importe (40 puntos)
    const paymentAmount = Number(payment.monto);
    if (Math.abs(paymentAmount - amount) < 0.01) {
      confidence += 40;
      reasons.push('Importe exacto');
      matchType = 'exact_amount';
    } else if (Math.abs(paymentAmount - amount) <= amountTolerance) {
      confidence += 30;
      reasons.push('Importe aproximado');
    }

    // 2. Referencia en concepto (30 puntos)
    const tenant = payment.contract.tenant;
    const unit = payment.contract.unit;
    const building = unit.building;

    // Buscar nombre del inquilino en concepto
    if (concept.toLowerCase().includes(tenant.nombreCompleto.toLowerCase().split(' ')[0])) {
      confidence += 25;
      reasons.push('Nombre inquilino en concepto');
      matchType = 'reference';
    }

    // Buscar referencia de unidad (ej: "PISO 3B")
    if (concept.toLowerCase().includes(unit.numero.toLowerCase())) {
      confidence += 20;
      reasons.push('Referencia de unidad');
      matchType = 'reference';
    }

    // Buscar patrones de alquiler
    for (const pattern of RENT_PATTERNS) {
      if (pattern.test(concept)) {
        confidence += 10;
        reasons.push('Patrón de alquiler detectado');
        break;
      }
    }

    // 3. IBAN del inquilino coincide (20 puntos)
    const senderIban = transaction.ibanOrigen || transaction.counterpartyIban;
    if (senderIban && tenant.iban && normalizeIban(senderIban) === normalizeIban(tenant.iban)) {
      confidence += 20;
      reasons.push('IBAN coincide');
      matchType = 'tenant_iban';
    }

    // 4. Fecha coherente (10 puntos)
    const dueDate = new Date(payment.fechaVencimiento);
    const daysDiff = Math.abs(
      (transactionDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff <= 7) {
      confidence += 10;
      reasons.push('Fecha cercana al vencimiento');
    } else if (daysDiff <= 15) {
      confidence += 5;
    }

    // Solo considerar candidatos con algo de confianza
    if (confidence > 0) {
      candidates.push({
        paymentId: payment.id,
        confidence: Math.min(confidence, 100),
        matchType,
        reasons,
      });
    }
  }

  return candidates;
}

/**
 * Marca un pago como conciliado
 */
async function reconcilePayment(
  transaction: any,
  paymentId: string
): Promise<void> {
  await prisma.$transaction([
    // Actualizar el pago
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        estado: 'pagado',
        fechaPago: new Date(transaction.fecha),
        metodoPago: 'transferencia',
        referenciaBancaria: transaction.referencia || transaction.id,
      },
    }),
    // Marcar la transacción como conciliada
    prisma.bankTransaction.update({
      where: { id: transaction.id },
      data: {
        conciliado: true,
        conciliadoEn: new Date(),
        paymentId,
      },
    }),
  ]);

  logger.info(`✅ Pago ${paymentId} conciliado con transacción ${transaction.id}`);
}

/**
 * Marca una transacción para revisión manual
 */
async function markForManualReview(
  transaction: any,
  candidates: MatchCandidate[]
): Promise<void> {
  await prisma.bankTransaction.update({
    where: { id: transaction.id },
    data: {
      requiereRevision: true,
      candidatosConciliacion: JSON.stringify(candidates.slice(0, 5)),
    },
  });
}

/**
 * Normaliza un IBAN para comparación
 */
function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase();
}

// ============================================================================
// FUNCIONES DE GESTIÓN MANUAL
// ============================================================================

/**
 * Obtiene transacciones pendientes de revisión manual
 */
export async function getTransactionsForManualReview(
  companyId?: string
): Promise<any[]> {
  const where: any = {
    conciliado: false,
    requiereRevision: true,
  };

  if (companyId) {
    where.bankConnection = { companyId };
  }

  return prisma.bankTransaction.findMany({
    where,
    include: {
      bankConnection: true,
    },
    orderBy: { fecha: 'desc' },
  });
}

/**
 * Concilia manualmente una transacción con un pago
 */
export async function manualReconciliation(
  transactionId: string,
  paymentId: string,
  userId: string
): Promise<void> {
  const transaction = await prisma.bankTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new Error('Transacción no encontrada');
  }

  if (transaction.conciliado) {
    throw new Error('Transacción ya conciliada');
  }

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        estado: 'pagado',
        fechaPago: new Date(transaction.fecha),
        metodoPago: 'transferencia',
        referenciaBancaria: transaction.referencia || transaction.id,
      },
    }),
    prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        conciliado: true,
        conciliadoEn: new Date(),
        conciliadoPor: userId,
        paymentId,
        requiereRevision: false,
      },
    }),
  ]);

  logger.info(`✅ Conciliación manual: ${transactionId} -> ${paymentId} por ${userId}`);
}

/**
 * Descarta una transacción (no es un pago de alquiler)
 */
export async function discardTransaction(
  transactionId: string,
  reason: string,
  userId: string
): Promise<void> {
  await prisma.bankTransaction.update({
    where: { id: transactionId },
    data: {
      conciliado: true,
      conciliadoEn: new Date(),
      conciliadoPor: userId,
      notas: `Descartado: ${reason}`,
      requiereRevision: false,
    },
  });

  logger.info(`🗑️ Transacción descartada: ${transactionId} - ${reason}`);
}

/**
 * Obtiene estadísticas de conciliación
 */
export async function getReconciliationStats(
  companyId?: string
): Promise<{
  totalTransactions: number;
  reconciled: number;
  pendingReview: number;
  unmatched: number;
  lastReconciliation: Date | null;
}> {
  const where = companyId
    ? { bankConnection: { companyId } }
    : {};

  const [total, reconciled, pendingReview] = await Promise.all([
    prisma.bankTransaction.count({ where }),
    prisma.bankTransaction.count({ 
      where: { ...where, conciliado: true } 
    }),
    prisma.bankTransaction.count({ 
      where: { ...where, conciliado: false, requiereRevision: true } 
    }),
  ]);

  const lastReconciled = await prisma.bankTransaction.findFirst({
    where: { ...where, conciliado: true },
    orderBy: { conciliadoEn: 'desc' },
    select: { conciliadoEn: true },
  });

  return {
    totalTransactions: total,
    reconciled,
    pendingReview,
    unmatched: total - reconciled - pendingReview,
    lastReconciliation: lastReconciled?.conciliadoEn || null,
  };
}
