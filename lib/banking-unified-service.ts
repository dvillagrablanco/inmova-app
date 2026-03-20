// @ts-nocheck
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
    searchNames: ['VIRODA', 'VIRODA INVERSIONES', 'VIRODA INVERSIONES SL'],
    iban: 'ES8801280250590100081826',
    banco: 'Bankinter',
    bic: 'BKBKESMMXXX',
  },
  VIDARO: {
    nombre: 'VIDARO INVERSIONES S.L.',
    searchNames: ['VIDARO', 'VIDARO INVERSIONES', 'VIDARO INVERSIONES SL'],
    iban: 'ES5301280250500100070675',
    banco: 'Bankinter',
    bic: 'BKBKESMMXXX',
  },
  VIBLA: {
    nombre: 'VIBLA Private Equity SCR S.A.',
    searchNames: ['VIBLA', 'VIBLA PRIVATE', 'VIBLA PE'],
    iban: '',
    banco: 'Bankinter',
    bic: 'BKBKESMMXXX',
  },
} as const;

// Nordigen institution ID para Bankinter
export const BANKINTER_NORDIGEN_ID = 'BANKINTER_BKBKESMMXXX';

/**
 * Mapa completo IBAN → datos de la sociedad del Grupo Vidaro.
 * Cubre todas las cuentas conocidas de las 3 sociedades operativas.
 * Se usa para asociar automáticamente las cuentas que devuelve Salt Edge
 * a la sociedad correcta en base al IBAN.
 */
export const GRUPO_VIDARO_IBAN_MAP: Record<
  string,
  {
    sociedadKey: string;
    nombre: string;
    searchName: string; // para buscar la empresa en BD por nombre
    banco: string;
    alias: string;
  }
> = {
  // ── ROVIDA S.L.U. ─────────────────────────────────────────────
  ES5601280250590100083954: {
    sociedadKey: 'ROVIDA',
    nombre: 'ROVIDA S.L.',
    searchName: 'Rovida',
    banco: 'Bankinter',
    alias: 'Bankinter Rovida',
  },
  ES2301820496680201728339: {
    sociedadKey: 'ROVIDA',
    nombre: 'ROVIDA S.L.',
    searchName: 'Rovida',
    banco: 'BBVA',
    alias: 'BBVA Rovida',
  },
  // ── VIRODA INVERSIONES S.L.U. ────────────────────────────────
  ES8801280250590100081826: {
    sociedadKey: 'VIRODA',
    nombre: 'VIRODA INVERSIONES S.L.',
    searchName: 'Viroda',
    banco: 'Bankinter',
    alias: 'Bankinter Viroda',
  },
  ES5301820496610201744438: {
    sociedadKey: 'VIRODA',
    nombre: 'VIRODA INVERSIONES S.L.',
    searchName: 'Viroda',
    banco: 'BBVA',
    alias: 'BBVA Viroda',
  },
  // ── VIDARO INVERSIONES S.L. (holding) ────────────────────────
  ES4501820496610201685315: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'BBVA',
    alias: 'BBVA Principal',
  },
  ES9800750142560600679446: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Santander',
    alias: 'Santander Principal',
  },
  ES5301280250500100070675: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Bankinter',
    alias: 'Bankinter Principal',
  },
  ES1101826462710201514692: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'BBVA',
    alias: 'BBVA Inversión 2',
  },
  ES4500496740612416120184: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Santander',
    alias: 'Santander Inversión',
  },
  ES0600610377810088770119: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Banca March',
    alias: 'March Principal',
  },
  ES8915441202436650183570: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'AndBank',
    alias: 'AndBank',
  },
  ES4102320543510038870971: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Inversis',
    alias: 'Inversis 1',
  },
  ES0701280250510100088644: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Bankinter',
    alias: 'Bankinter Asesorada MdF',
  },
  LU631980017392000100: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Pictet',
    alias: 'Pictet Luxemburgo',
  },
  ES1700610377860104020113: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Banca March',
    alias: 'March Inversión',
  },
  ES6502320543500039016185: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Inversis',
    alias: 'Inversis 2 (MdF AF)',
  },
  ES1602320543500043715359: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Inversis',
    alias: 'Inversis 3',
  },
  ES2800385777190016147134: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'CACEIS',
    alias: 'CACEIS España',
  },
  ES0701280250520500008031: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Bankinter',
    alias: 'Bankinter Póliza Crédito',
  },
  CH7908270287843892001: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'BBVA Suiza',
    alias: 'BBVA Suiza 1',
  },
  CH1408270287843892007: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'BBVA Suiza',
    alias: 'BBVA Suiza 2',
  },
  CH7100206206550611608: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'UBS',
    alias: 'UBS Suiza',
  },
  LU141770003673B00978: {
    sociedadKey: 'VIDARO',
    nombre: 'VIDARO INVERSIONES S.L.',
    searchName: 'Vidaro',
    banco: 'Bankinter',
    alias: 'Bankinter Luxemburgo',
  },
};

/**
 * Dado un IBAN, busca la sociedad del Grupo Vidaro a la que pertenece.
 * Primero usa el mapa estático; si no coincide, consulta la BD.
 */
export async function findSociedadByIban(iban: string): Promise<{
  companyId: string;
  companyName: string;
  banco: string;
  alias: string;
} | null> {
  const prisma = getPrismaClient();

  // 1. Buscar en mapa estático
  const ibanClean = iban.replace(/\s/g, '').toUpperCase();
  const staticMatch = GRUPO_VIDARO_IBAN_MAP[ibanClean];

  if (staticMatch) {
    // Buscar companyId real en BD por nombre
    const company = await prisma.company.findFirst({
      where: { nombre: { contains: staticMatch.searchName, mode: 'insensitive' } },
      select: { id: true, nombre: true },
    });
    if (company) {
      return {
        companyId: company.id,
        companyName: company.nombre,
        banco: staticMatch.banco,
        alias: staticMatch.alias,
      };
    }
  }

  // 2. Buscar directamente por IBAN en Company.iban
  const companyByIban = await prisma.company.findFirst({
    where: { iban: ibanClean },
    select: { id: true, nombre: true },
  });
  if (companyByIban) {
    return {
      companyId: companyByIban.id,
      companyName: companyByIban.nombre,
      banco: staticMatch?.banco || 'Desconocido',
      alias: staticMatch?.alias || ibanClean,
    };
  }

  // 3. Buscar en FinancialAccount.numeroCuenta
  const fa = await prisma.financialAccount.findFirst({
    where: { numeroCuenta: ibanClean },
    select: { companyId: true, entidad: true, alias: true, company: { select: { nombre: true } } },
  });
  if (fa) {
    return {
      companyId: fa.companyId,
      companyName: (fa as any).company?.nombre || fa.companyId,
      banco: fa.entidad || 'Desconocido',
      alias: fa.alias || ibanClean,
    };
  }

  return null;
}

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
export async function getCompanyBankingStatus(
  companyId: string
): Promise<CompanyBankingConfig | null> {
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
    prisma.sepaPayment.count({
      where: { companyId, conciliado: false, status: { in: ['confirmed', 'paid_out'] } },
    }),
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

  const sociedad = Object.values(SOCIEDADES).find((s) =>
    s.searchNames.some((n) => company.nombre?.toUpperCase().includes(n))
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
export async function getAllCompanyBankingStatus(
  companyIds?: string[]
): Promise<CompanyBankingConfig[]> {
  const prisma = getPrismaClient();

  const companies = await prisma.company.findMany({
    where: {
      ...(companyIds && companyIds.length > 0
        ? { id: { in: companyIds } }
        : {
            OR: [
              { nombre: { contains: 'Rovida', mode: 'insensitive' } },
              { nombre: { contains: 'Viroda', mode: 'insensitive' } },
              { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
            ],
          }),
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: 'asc' },
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
      const txText =
        `${tx.debtorName || ''} ${tx.descripcion || ''} ${tx.creditorName || ''}`.toUpperCase();

      // Match por nombre del inquilino en la descripción de la transacción
      const nameParts = tenantName.split(' ').filter((p) => p.length > 2);
      const nameMatches = nameParts.filter((part) => txText.includes(part)).length;

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
// SYNC NORDIGEN BANK TRANSACTIONS
// ============================================================================

/**
 * Descarga movimientos bancarios nuevos desde Nordigen (Open Banking)
 * para todas las conexiones activas de una sociedad.
 *
 * Busca las BankConnection con proveedor='nordigen' y estado='conectado',
 * lee las transacciones de los últimos 90 días (o desde última sync),
 * y las inserta/actualiza en BankTransaction.
 */
export async function syncNordigenTransactions(companyId: string): Promise<{
  connections: number;
  newTransactions: number;
  updatedTransactions: number;
  errors: string[];
}> {
  const prisma = getPrismaClient();
  const result = {
    connections: 0,
    newTransactions: 0,
    updatedTransactions: 0,
    errors: [] as string[],
  };

  const { isNordigenConfigured, getTransactions, getAccountBalances } =
    await import('@/lib/nordigen-service');
  if (!isNordigenConfigured()) {
    logger.info('[NordigenSync] Nordigen no configurado, saltando sync de movimientos bancarios');
    return result;
  }

  const connections = await prisma.bankConnection.findMany({
    where: {
      companyId,
      proveedor: { in: ['nordigen', 'gocardless'] },
      estado: 'conectado',
      accessToken: { not: null },
    },
    select: {
      id: true,
      accessToken: true,
      ultimaSync: true,
      nombreBanco: true,
    },
  });

  result.connections = connections.length;
  if (connections.length === 0) {
    logger.info(`[NordigenSync] No hay conexiones Nordigen activas para company ${companyId}`);
    return result;
  }

  for (const conn of connections) {
    try {
      const accountIds = (conn.accessToken || '').split(',').filter(Boolean);
      if (accountIds.length === 0) continue;

      // Calcular rango de fechas: desde última sync o últimos 90 días
      const dateFrom = conn.ultimaSync
        ? new Date(conn.ultimaSync.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 días antes de última sync para solapamiento
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const dateFromStr = dateFrom.toISOString().split('T')[0];
      const dateToStr = new Date().toISOString().split('T')[0];

      for (const accountId of accountIds) {
        const txResult = await getTransactions(accountId, dateFromStr, dateToStr);
        if (!txResult) continue;

        const allTx = [...txResult.booked, ...(txResult.pending || [])];
        for (const tx of allTx) {
          const txId =
            tx.transactionId || `${accountId}_${tx.bookingDate}_${tx.transactionAmount.amount}`;
          const amount = parseFloat(tx.transactionAmount.amount);
          const desc =
            tx.remittanceInformationUnstructured ||
            tx.remittanceInformationStructured ||
            tx.creditorName ||
            tx.debtorName ||
            'Sin descripción';

          try {
            const existing = await prisma.bankTransaction.findUnique({
              where: { proveedorTxId: txId },
              select: { id: true },
            });

            if (existing) {
              await prisma.bankTransaction.update({
                where: { proveedorTxId: txId },
                data: {
                  descripcion: desc,
                  monto: amount,
                  creditorName: tx.creditorName || undefined,
                  debtorName: tx.debtorName || undefined,
                  creditorIban: tx.creditorAccount?.iban || undefined,
                  debtorIban: tx.debtorAccount?.iban || undefined,
                },
              });
              result.updatedTransactions++;
            } else {
              await prisma.bankTransaction.create({
                data: {
                  companyId,
                  connectionId: conn.id,
                  proveedorTxId: txId,
                  fecha: new Date(tx.bookingDate),
                  fechaContable: tx.valueDate ? new Date(tx.valueDate) : null,
                  descripcion: desc,
                  monto: amount,
                  moneda: tx.transactionAmount.currency || 'EUR',
                  categoria: tx.bankTransactionCode || null,
                  creditorName: tx.creditorName || null,
                  debtorName: tx.debtorName || null,
                  creditorIban: tx.creditorAccount?.iban || null,
                  debtorIban: tx.debtorAccount?.iban || null,
                  tipoTransaccion: tx.bankTransactionCode || null,
                  rawData: tx as any,
                  estado: 'pendiente_revision',
                },
              });
              result.newTransactions++;
            }
          } catch (e: any) {
            if (!e.message?.includes('Unique constraint')) {
              result.errors.push(`Tx ${txId}: ${e.message}`);
            }
          }
        }
      }

      // Actualizar última sincronización
      await prisma.bankConnection.update({
        where: { id: conn.id },
        data: { ultimaSync: new Date() },
      });

      logger.info(
        `[NordigenSync] ${conn.nombreBanco || conn.id}: ${result.newTransactions} nuevas, ${result.updatedTransactions} actualizadas`
      );
    } catch (e: any) {
      logger.error(`[NordigenSync] Error en conexión ${conn.id}:`, e);
      result.errors.push(`Connection ${conn.id}: ${e.message}`);
    }
  }

  return result;
}

// ============================================================================
// SYNC ALL - Sincronizar todo para una sociedad
// ============================================================================

/**
 * Ejecuta fullSyncAndReconcile para TODAS las sociedades del Grupo Vidaro.
 * Busca las empresas por nombre en BD, procesa cada una en paralelo limitado.
 */
export async function fullSyncAllGrupoVidaro(): Promise<{
  companies: Array<{
    companyId: string;
    companyName: string;
    sync: {
      payments: number;
      payouts: number;
      bankTransactions: number;
      newBankTransactions: number;
    };
    reconciliation: UnifiedReconciliationResult;
  }>;
  totalNewTransactions: number;
  totalReconciled: number;
}> {
  const prisma = getPrismaClient();

  // Buscar todas las sociedades del grupo
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
    orderBy: { nombre: 'asc' },
  });

  logger.info(`[GrupoVidaro] Sincronizando ${companies.length} sociedades`);

  const results = [];
  let totalNewTransactions = 0;
  let totalReconciled = 0;

  for (const company of companies) {
    try {
      const result = await fullSyncAndReconcile(company.id);
      results.push({
        companyId: company.id,
        companyName: company.nombre,
        ...result,
      });
      totalNewTransactions += result.sync.newBankTransactions;
      totalReconciled +=
        (result.reconciliation.sepaToPayment?.matched || 0) +
        (result.reconciliation.payoutToBankTx?.matched || 0) +
        (result.reconciliation.bankTxToPayment?.matched || 0);
    } catch (e: any) {
      logger.error(`[GrupoVidaro] Error en ${company.nombre}:`, e);
      results.push({
        companyId: company.id,
        companyName: company.nombre,
        error: e.message,
        sync: { payments: 0, payouts: 0, bankTransactions: 0, newBankTransactions: 0 },
        reconciliation: {
          companyId: company.id,
          companyName: company.nombre,
          sepaToPayment: { matched: 0, total: 0 },
          payoutToBankTx: { matched: 0, total: 0 },
          bankTxToPayment: { matched: 0, total: 0 },
        },
      });
    }
  }

  logger.info(
    `[GrupoVidaro] Completado: ${totalNewTransactions} nuevas tx, ${totalReconciled} conciliadas`
  );

  return { companies: results, totalNewTransactions, totalReconciled };
}

/**
 * Sincronización completa para una sociedad:
 * 1. Sync movimientos bancarios desde Salt Edge (si configurado) o Nordigen
 * 2. Sync pagos SEPA desde GoCardless API
 * 3. Sync payouts desde GoCardless API
 * 4. Conciliación unificada de 3 capas
 */
export async function fullSyncAndReconcile(companyId: string): Promise<{
  sync: {
    payments: number;
    payouts: number;
    bankTransactions: number;
    newBankTransactions: number;
  };
  reconciliation: UnifiedReconciliationResult;
}> {
  const gc = getGCClient();

  let syncPayments = 0;
  let syncPayouts = 0;
  let syncBankTx = 0;
  let newBankTx = 0;

  // 1. Sync bank transactions — Salt Edge primero, Nordigen como fallback
  let openBankingUsed = 'none';
  try {
    const { isSaltEdgeConfigured, syncSaltEdgeTransactions } =
      await import('@/lib/saltedge-service');
    if (isSaltEdgeConfigured()) {
      const seResult = await syncSaltEdgeTransactions(companyId);
      syncBankTx = seResult.newTransactions + seResult.updatedTransactions;
      newBankTx = seResult.newTransactions;
      openBankingUsed = 'saltedge';
      if (seResult.errors.length > 0) {
        logger.warn(
          `[FullSync] Salt Edge sync warnings for ${companyId}: ${seResult.errors.join('; ')}`
        );
      }
    }
  } catch (e) {
    logger.warn(`[FullSync] Salt Edge sync error for ${companyId}:`, e);
  }

  // Fallback 2: Enable Banking
  if (openBankingUsed === 'none' || syncBankTx === 0) {
    try {
      const { isEnableBankingConfigured, syncEnableBankingTransactions } =
        await import('@/lib/enablebanking-service');
      if (isEnableBankingConfigured()) {
        const ebResult = await syncEnableBankingTransactions(companyId);
        const ebNew = ebResult.newTransactions + ebResult.updatedTransactions;
        if (ebNew > 0) {
          syncBankTx += ebNew;
          newBankTx += ebResult.newTransactions;
          openBankingUsed = 'enablebanking';
        }
        if (ebResult.errors.length > 0) {
          logger.warn(`[FullSync] Enable Banking sync warnings: ${ebResult.errors.join('; ')}`);
        }
      }
    } catch (e) {
      logger.warn(`[FullSync] Enable Banking sync error for ${companyId}:`, e);
    }
  }

  // Fallback 3: Nordigen (si ambos anteriores fallan)
  if (openBankingUsed === 'none' || syncBankTx === 0) {
    try {
      const nordigenResult = await syncNordigenTransactions(companyId);
      const nordigenNew = nordigenResult.newTransactions + nordigenResult.updatedTransactions;
      if (nordigenNew > 0) {
        syncBankTx += nordigenNew;
        newBankTx += nordigenResult.newTransactions;
        openBankingUsed = 'nordigen';
      }
      if (nordigenResult.errors.length > 0) {
        logger.warn(`[FullSync] Nordigen sync warnings: ${nordigenResult.errors.join('; ')}`);
      }
    } catch (e) {
      logger.warn(`[FullSync] Nordigen sync error for ${companyId}:`, e);
    }
  }

  logger.info(`[FullSync] Open banking used for ${companyId}: ${openBankingUsed}`);

  // 2. Sync payments from GC
  if (gc) {
    try {
      const { syncPaymentsFromGC, syncPayoutsFromGC } =
        await import('@/lib/gocardless-reconciliation');
      const pResult = await syncPaymentsFromGC(companyId);
      syncPayments = pResult.created + pResult.updated;
      const poResult = await syncPayoutsFromGC(companyId);
      syncPayouts = poResult.created + poResult.updated;
    } catch (e) {
      logger.warn(`[FullSync] GC sync error for ${companyId}:`, e);
    }
  }

  // 3. Run unified reconciliation
  const reconciliation = await unifiedReconcile(companyId);

  return {
    sync: {
      payments: syncPayments,
      payouts: syncPayouts,
      bankTransactions: syncBankTx,
      newBankTransactions: newBankTx,
    },
    reconciliation,
  };
}
