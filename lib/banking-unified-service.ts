/**
 * SERVICIO UNIFICADO DE BANCA - VIRODA & ROVIDA
 *
 * Unifica las tres vías de integración bancaria:
 * 1. GoCardless Payments (SEPA Direct Debit) → cobrar alquileres a inquilinos
 * 2. GoCardless Bank Account Data (Nordigen) → leer movimientos Bankinter
 * 3. Importación CAMT.053 → movimientos bancarios offline (Bankinter)
 *
 * Sociedades:
 *   ROVIDA S.L.              → IBAN ES5601280250590100083954 (Bankinter)
 *   VIRODA INVERSIONES S.L.  → IBAN ES8801280250590100081826 (Bankinter)
 *
 * Flujo de conciliación:
 *   1. GoCardless cobra al inquilino (SEPA Direct Debit)
 *   2. El dinero llega a la cuenta de Bankinter (payout)
 *   3. Los movimientos de Bankinter se leen via Nordigen o CAMT.053
 *   4. Se cruzan los payouts de GC con los ingresos en Bankinter
 *   5. Se cruzan los pagos SEPA con los pagos de alquiler en Inmova
 */

import { logger } from '@/lib/logger';
import { getPrismaClient } from '@/lib/db';
import { getGCClient, centsToEuros } from '@/lib/gocardless-integration';

// ============================================================================
// CONSTANTS - Datos de las sociedades
// ============================================================================

export const SOCIEDADES = {
  ROVIDA: {
    nombre: 'ROVIDA S.L.',
    searchNames: ['ROVIDA', 'ROVIDA S L', 'ROVIDA SL', 'ROVIDA S.L.'],
    iban: 'ES5601280250590100083954',
    banco: 'Bankinter',
    bic: 'BKBKESMMXXX',
  },
  VIRODA: {
    nombre: 'VIRODA INVERSIONES S.L.',
    searchNames: ['VIRODA', 'VIRODA INVERSIONES', 'VIDARO', 'VIRODA INVERSIONES SL'],
    iban: 'ES8801280250590100081826',
    banco: 'Bankinter',
    bic: 'BKBKESMMXXX',
  },
} as const;

// Nordigen institution ID para Bankinter
export const BANKINTER_NORDIGEN_ID = 'BANKINTER_BKBKESMMXXX';

// ============================================================================
// TYPES
// ============================================================================

export interface CompanyBankingConfig {
  companyId: string;
  companyName: string;
  iban: string;
  banco: string;
  gcConfigured: boolean;
  nordigenConnected: boolean;
  bankConnectionId?: string;
  totalMandates: number;
  activeMandates: number;
  totalPayments: number;
  pendingReconciliation: number;
  lastSync?: Date;
}

export interface UnifiedReconciliationResult {
  companyId: string;
  companyName: string;
  sepaToPayment: { matched: number; total: number };
  payoutToBankTx: { matched: number; total: number };
  bankTxToPayment: { matched: number; total: number };
}

// ============================================================================
// COMPANY BANKING STATUS
// ============================================================================

/**
 * Obtener estado de la configuración bancaria para una sociedad
 */
export async function getCompanyBankingStatus(companyId: string): Promise<CompanyBankingConfig | null> {
  const prisma = getPrismaClient();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { id: true, nombre: true, iban: true },
  });

  if (!company) return null;

  // GC info
  const [mandateCount, activeMandates, paymentCount, pendingRecon] = await Promise.all([
    prisma.sepaMandate.count({ where: { companyId } }),
    prisma.sepaMandate.count({ where: { companyId, status: 'active' } }),
    prisma.sepaPayment.count({ where: { companyId } }),
    prisma.sepaPayment.count({ where: { companyId, conciliado: false, status: { in: ['confirmed', 'paid_out'] } } }),
  ]);

  // Nordigen/bank connection
  const bankConn = await prisma.bankConnection.findFirst({
    where: {
      companyId,
      proveedor: { in: ['nordigen', 'bankinter_redsys', 'gocardless'] },
      estado: 'conectado',
    },
    select: { id: true, ultimaSync: true, proveedor: true },
  });

  const sociedad = Object.values(SOCIEDADES).find(s =>
    s.searchNames.some(n => company.nombre?.toUpperCase().includes(n))
  );

  return {
    companyId,
    companyName: company.nombre || '',
    iban: company.iban || sociedad?.iban || '',
    banco: sociedad?.banco || 'Desconocido',
    gcConfigured: !!getGCClient(),
    nordigenConnected: !!bankConn,
    bankConnectionId: bankConn?.id,
    totalMandates: mandateCount,
    activeMandates,
    totalPayments: paymentCount,
    pendingReconciliation: pendingRecon,
    lastSync: bankConn?.ultimaSync || undefined,
  };
}

/**
 * Obtener status de ambas sociedades
 */
export async function getAllCompanyBankingStatus(): Promise<CompanyBankingConfig[]> {
  const prisma = getPrismaClient();

  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { nombre: { contains: 'Rovida', mode: 'insensitive' } },
        { nombre: { contains: 'Viroda', mode: 'insensitive' } },
        { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  });

  const results: CompanyBankingConfig[] = [];
  for (const c of companies) {
    const status = await getCompanyBankingStatus(c.id);
    if (status) results.push(status);
  }

  return results;
}

// ============================================================================
// UNIFIED RECONCILIATION
// ============================================================================

/**
 * Conciliación unificada de 3 capas:
 *
 * Capa 1: SepaPayment (GC) → Payment (Inmova)
 *   Cruzar pagos SEPA confirmados con pagos de alquiler pendientes.
 *
 * Capa 2: GCPayout → BankTransaction (Bankinter)
 *   Cruzar payouts de GC con ingresos en cuenta Bankinter.
 *
 * Capa 3: BankTransaction → Payment (Inmova)
 *   Cruzar movimientos bancarios no-GC con pagos (transferencias directas).
 */
export async function unifiedReconcile(companyId: string): Promise<UnifiedReconciliationResult> {
  const prisma = getPrismaClient();

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { nombre: true },
  });

  const result: UnifiedReconciliationResult = {
    companyId,
    companyName: company?.nombre || '',
    sepaToPayment: { matched: 0, total: 0 },
    payoutToBankTx: { matched: 0, total: 0 },
    bankTxToPayment: { matched: 0, total: 0 },
  };

  // ─── CAPA 1: SEPA Payment → Inmova Payment ───
  const unreconciledSepa = await prisma.sepaPayment.findMany({
    where: {
      companyId,
      conciliado: false,
      status: { in: ['confirmed', 'paid_out'] },
    },
    include: {
      mandate: { include: { customer: true } },
    },
    take: 500,
  });

  result.sepaToPayment.total = unreconciledSepa.length;

  for (const sepa of unreconciledSepa) {
    const tenantId = sepa.tenantId || sepa.mandate.customer?.tenantId;
    if (!tenantId) continue;

    const amountEuros = centsToEuros(sepa.amount);
    const match = await prisma.payment.findFirst({
      where: {
        contract: { tenantId, companyId },
        estado: { in: ['pendiente', 'atrasado'] },
        monto: { gte: amountEuros - 0.02, lte: amountEuros + 0.02 },
      },
      orderBy: { fechaVencimiento: 'asc' },
    });

    if (match) {
      await prisma.$transaction([
        prisma.sepaPayment.update({
          where: { id: sepa.id },
          data: {
            conciliado: true,
            conciliadoEn: new Date(),
            conciliadoPor: 'auto_unified',
            inmovaPaymentId: match.id,
            tenantId,
            contractId: match.contractId,
          },
        }),
        prisma.payment.update({
          where: { id: match.id },
          data: {
            estado: 'pagado',
            fechaPago: sepa.chargeDate ? new Date(sepa.chargeDate) : new Date(),
            metodoPago: 'sepa_direct_debit',
          },
        }),
      ]);
      result.sepaToPayment.matched++;
    }
  }

  // ─── CAPA 2: GCPayout → BankTransaction ───
  const unreconciledPayouts = await prisma.gCPayout.findMany({
    where: { companyId, conciliado: false, status: 'paid' },
    take: 200,
  });

  result.payoutToBankTx.total = unreconciledPayouts.length;

  for (const payout of unreconciledPayouts) {
    const payoutAmountEuros = centsToEuros(payout.amount);
    const arrivalDate = payout.arrivalDate;

    // Buscar ingreso en Bankinter que coincida con el payout
    const bankTx = await prisma.bankTransaction.findFirst({
      where: {
        companyId,
        monto: { gte: payoutAmountEuros - 1.0, lte: payoutAmountEuros + 1.0 },
        fecha: {
          gte: new Date(arrivalDate.getTime() - 3 * 24 * 60 * 60 * 1000),
          lte: new Date(arrivalDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
        estado: 'pendiente_revision',
        OR: [
          { descripcion: { contains: 'GOCARDLESS', mode: 'insensitive' } },
          { creditorName: { contains: 'GOCARDLESS', mode: 'insensitive' } },
          { debtorName: { contains: 'GOCARDLESS', mode: 'insensitive' } },
          { referencia: { contains: payout.reference || '__NOMATCH__', mode: 'insensitive' } },
        ],
      },
    });

    if (bankTx) {
      await prisma.$transaction([
        prisma.gCPayout.update({
          where: { id: payout.id },
          data: {
            conciliado: true,
            conciliadoEn: new Date(),
            bankTransactionId: bankTx.id,
            notaConciliacion: `Auto-matched con tx bancaria ${bankTx.proveedorTxId}`,
          },
        }),
        prisma.bankTransaction.update({
          where: { id: bankTx.id },
          data: {
            estado: 'conciliado',
            notasConciliacion: `Payout GoCardless ${payout.gcPayoutId}`,
          },
        }),
      ]);
      result.payoutToBankTx.matched++;
    }
  }

  // ─── CAPA 3: BankTransaction (transferencias directas) → Payment ───
  // Para pagos que llegan por transferencia directa (no GC)
  const unreconciledBankTx = await prisma.bankTransaction.findMany({
    where: {
      companyId,
      estado: 'pendiente_revision',
      monto: { gt: 0 }, // Solo ingresos
      // Excluir los ya matched con GC
      NOT: {
        OR: [
          { descripcion: { contains: 'GOCARDLESS', mode: 'insensitive' } },
          { notasConciliacion: { contains: 'Payout GoCardless' } },
        ],
      },
    },
    take: 500,
    orderBy: { fecha: 'desc' },
  });

  result.bankTxToPayment.total = unreconciledBankTx.length;

  for (const tx of unreconciledBankTx) {
    // Intentar matchear por nombre de inquilino + monto
    const candidates = await prisma.payment.findMany({
      where: {
        contract: { companyId },
        estado: { in: ['pendiente', 'atrasado'] },
        monto: { gte: tx.monto * 0.99, lte: tx.monto * 1.01 },
      },
      include: {
        contract: {
          select: { tenant: { select: { nombreCompleto: true, id: true } } },
        },
      },
      take: 10,
    });

    for (const candidate of candidates) {
      const tenantName = candidate.contract.tenant.nombreCompleto.toUpperCase();
      const txText = `${tx.debtorName || ''} ${tx.descripcion || ''} ${tx.creditorName || ''}`.toUpperCase();

      // Match por nombre del inquilino en la descripción de la transacción
      const nameParts = tenantName.split(' ').filter(p => p.length > 2);
      const nameMatches = nameParts.filter(part => txText.includes(part)).length;

      if (nameMatches >= 2 || (nameParts.length === 1 && nameMatches === 1)) {
        await prisma.$transaction([
          prisma.bankTransaction.update({
            where: { id: tx.id },
            data: {
              estado: 'conciliado',
              paymentId: candidate.id,
              conciliadoPor: 'auto_unified',
              conciliadoEn: new Date(),
              notasConciliacion: `Transferencia directa de ${candidate.contract.tenant.nombreCompleto}`,
            },
          }),
          prisma.payment.update({
            where: { id: candidate.id },
            data: {
              estado: 'pagado',
              fechaPago: tx.fecha,
              metodoPago: 'transferencia_bancaria',
            },
          }),
        ]);
        result.bankTxToPayment.matched++;
        break;
      }
    }
  }

  logger.info(
    `[UnifiedReconcile] ${company?.nombre}: ` +
    `SEPA→Pay: ${result.sepaToPayment.matched}/${result.sepaToPayment.total}, ` +
    `Payout→BankTx: ${result.payoutToBankTx.matched}/${result.payoutToBankTx.total}, ` +
    `BankTx→Pay: ${result.bankTxToPayment.matched}/${result.bankTxToPayment.total}`
  );

  return result;
}

// ============================================================================
// SYNC ALL - Sincronizar todo para una sociedad
// ============================================================================

/**
 * Sincronización completa para una sociedad:
 * 1. Sync pagos desde GoCardless API
 * 2. Sync payouts desde GoCardless API
 * 3. Conciliación unificada
 */
export async function fullSyncAndReconcile(companyId: string): Promise<{
  sync: { payments: number; payouts: number };
  reconciliation: UnifiedReconciliationResult;
}> {
  const gc = getGCClient();
  const prisma = getPrismaClient();

  let syncPayments = 0;
  let syncPayouts = 0;

  // 1. Sync payments from GC
  if (gc) {
    try {
      const { syncPaymentsFromGC, syncPayoutsFromGC } = await import('@/lib/gocardless-reconciliation');
      const pResult = await syncPaymentsFromGC(companyId);
      syncPayments = pResult.created + pResult.updated;
      const poResult = await syncPayoutsFromGC(companyId);
      syncPayouts = poResult.created + poResult.updated;
    } catch (e) {
      logger.warn(`[FullSync] GC sync error for ${companyId}:`, e);
    }
  }

  // 2. Run unified reconciliation
  const reconciliation = await unifiedReconcile(companyId);

  return {
    sync: { payments: syncPayments, payouts: syncPayouts },
    reconciliation,
  };
}
