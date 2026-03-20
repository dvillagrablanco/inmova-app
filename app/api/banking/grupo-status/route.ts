import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isSaltEdgeConfigured } from '@/lib/saltedge-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/banking/grupo-status
 *
 * Estado detallado de la integración bancaria para todas las sociedades
 * del Grupo Vidaro. Incluye:
 *   - Estado de conexión Salt Edge por sociedad
 *   - Últimas sincronizaciones
 *   - Movimientos pendientes de conciliar
 *   - Estado de GoCardless SEPA por sociedad
 *
 * Solo accesible para super_admin y administrador.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!['super_admin', 'administrador'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    // 1. Buscar todas las sociedades del grupo
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
      select: { id: true, nombre: true, iban: true, parentCompanyId: true },
      orderBy: { nombre: 'asc' },
    });

    // 2. Para cada sociedad, obtener estado bancario
    const companyStatuses = await Promise.all(
      companies.map(async (company) => {
        const [
          saltEdgeConnections,
          nordigenConnections,
          sepaActiveCount,
          sepaTotalCount,
          pendingRecon,
          bankTxTotal,
          bankTxPending,
          pendingSepaPayments,
          gcPayoutsCount,
        ] = await Promise.all([
          prisma.bankConnection.findMany({
            where: { companyId: company.id, proveedor: 'saltedge', estado: 'conectado' },
            select: { id: true, nombreBanco: true, ultimaSync: true },
          }),
          prisma.bankConnection.findMany({
            where: { companyId: company.id, proveedor: 'nordigen', estado: 'conectado' },
            select: { id: true, nombreBanco: true, ultimaSync: true },
          }),
          prisma.sepaMandate
            .count({ where: { companyId: company.id, status: 'active' } })
            .catch(() => 0),
          prisma.sepaMandate.count({ where: { companyId: company.id } }).catch(() => 0),
          prisma.sepaPayment
            .count({
              where: {
                companyId: company.id,
                conciliado: false,
                status: { in: ['confirmed', 'paid_out'] },
              },
            })
            .catch(() => 0),
          prisma.bankTransaction.count({ where: { companyId: company.id } }).catch(() => 0),
          prisma.bankTransaction
            .count({
              where: { companyId: company.id, estado: 'pendiente_revision' },
            })
            .catch(() => 0),
          prisma.sepaPayment
            .count({
              where: { companyId: company.id, status: { in: ['pending_submission', 'submitted'] } },
            })
            .catch(() => 0),
          prisma.gCPayout.count({ where: { companyId: company.id } }).catch(() => 0),
        ]);

        // Determinar si la conexión Salt Edge del grupo aplica a esta sociedad
        // (conexión del grupo = misma conexión compartida, identificada por connectionId)
        const saltEdgeGroupConns = await prisma.bankConnection.findMany({
          where: {
            proveedor: 'saltedge',
            estado: 'conectado',
            proveedorItemId: { not: '' },
          },
          select: {
            id: true,
            companyId: true,
            nombreBanco: true,
            ultimaSync: true,
          },
          orderBy: { ultimaSync: 'desc' },
          take: 50,
        });

        // Cuentas de esta empresa en el grupo conectado
        const groupConnForThisCompany = saltEdgeGroupConns.filter(
          (c) => c.companyId === company.id
        );

        const lastSync =
          groupConnForThisCompany[0]?.ultimaSync ||
          saltEdgeConnections[0]?.ultimaSync ||
          nordigenConnections[0]?.ultimaSync ||
          null;

        return {
          companyId: company.id,
          companyName: company.nombre,
          iban: company.iban,
          isHolding:
            !company.parentCompanyId && companies.some((c) => c.parentCompanyId === company.id),
          banking: {
            saltEdge: {
              connected: saltEdgeConnections.length > 0 || groupConnForThisCompany.length > 0,
              connections: [...saltEdgeConnections, ...groupConnForThisCompany]
                .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i)
                .map((c) => ({
                  bank: c.nombreBanco,
                  lastSync: c.ultimaSync?.toISOString() ?? null,
                })),
            },
            nordigen: {
              connected: nordigenConnections.length > 0,
              connections: nordigenConnections.map((c) => ({
                bank: c.nombreBanco,
                lastSync: c.ultimaSync?.toISOString() ?? null,
              })),
            },
            lastSync: lastSync?.toISOString() ?? null,
          },
          sepa: {
            mandatesActive: sepaActiveCount,
            mandatesTotal: sepaTotalCount,
            pendingPayments: pendingSepaPayments,
            payouts: gcPayoutsCount,
          },
          reconciliation: {
            pendingReconciliation: pendingRecon,
            bankTransactionsTotal: bankTxTotal,
            bankTransactionsPending: bankTxPending,
          },
          alerts: [
            ...(bankTxPending > 10 ? [`${bankTxPending} movimientos pendientes de conciliar`] : []),
            ...(pendingRecon > 0 ? [`${pendingRecon} pagos SEPA sin conciliar`] : []),
            ...(!saltEdgeConnections.length &&
            !groupConnForThisCompany.length &&
            !nordigenConnections.length
              ? ['Sin conexión bancaria activa']
              : []),
          ],
        };
      })
    );

    // 3. Estado global de Salt Edge
    const saltEdgeStatus = {
      configured: isSaltEdgeConfigured(),
      totalConnections: await prisma.bankConnection.count({
        where: { proveedor: 'saltedge', estado: 'conectado' },
      }),
      connectedBanks: await prisma.bankConnection
        .findMany({
          where: { proveedor: 'saltedge', estado: 'conectado' },
          select: { nombreBanco: true },
          distinct: ['nombreBanco'],
        })
        .then((rows) => [...new Set(rows.map((r) => r.nombreBanco))]),
    };

    // 4. Resumen de conciliación global
    const globalReconciliation = {
      totalPending: companyStatuses.reduce(
        (sum, c) => sum + c.reconciliation.pendingReconciliation,
        0
      ),
      totalBankTxPending: companyStatuses.reduce(
        (sum, c) => sum + c.reconciliation.bankTransactionsPending,
        0
      ),
      totalBankTx: companyStatuses.reduce(
        (sum, c) => sum + c.reconciliation.bankTransactionsTotal,
        0
      ),
      totalMandatesActive: companyStatuses.reduce((sum, c) => sum + c.sepa.mandatesActive, 0),
    };

    // 5. Bancos por conectar (del IBAN map que aún no tienen conexión Salt Edge)
    const { GRUPO_VIDARO_IBAN_MAP } = await import('@/lib/banking-unified-service');
    const bancosPorConectar = [
      ...new Set(Object.values(GRUPO_VIDARO_IBAN_MAP).map((v) => v.banco)),
    ].map((banco) => {
      const connectedForBanco = companyStatuses.some((cs) =>
        cs.banking.saltEdge.connections.some((conn) =>
          conn.bank.toLowerCase().includes(banco.toLowerCase())
        )
      );
      return { banco, connected: connectedForBanco };
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      grupoVidaro: {
        totalSociedades: companies.length,
        companies: companyStatuses,
      },
      saltEdge: saltEdgeStatus,
      globalReconciliation,
      bancosPorConectar,
      // Códigos verificados de Salt Edge API v6 para España
      availableBanks: [
        {
          code: 'bankinter_es',
          name: 'Bankinter',
          sociedades: ['Rovida', 'Viroda', 'Vidaro'],
          priority: 'HIGH',
        },
        { code: 'santander_es', name: 'Santander', sociedades: ['Vidaro'], priority: 'HIGH' },
        {
          code: 'santander_empresas_es',
          name: 'Santander Empresas',
          sociedades: ['Vidaro'],
          priority: 'HIGH',
        },
        { code: 'la_caixa_es', name: 'CaixaBank', sociedades: ['Vidaro'], priority: 'MEDIUM' },
        { code: 'kutxabank_es', name: 'Kutxabank', sociedades: ['Vidaro'], priority: 'LOW' },
        { code: 'ibercaja_es', name: 'Ibercaja', sociedades: ['Vidaro'], priority: 'LOW' },
      ],
    });
  } catch (error: any) {
    logger.error('[Grupo Status Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/banking/grupo-status
 * Dispara la sincronización + conciliación para TODAS las sociedades del Grupo Vidaro.
 */
export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!['super_admin', 'administrador'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const { fullSyncAllGrupoVidaro } = await import('@/lib/banking-unified-service');
    const result = await fullSyncAllGrupoVidaro();

    return NextResponse.json({
      success: true,
      ...result,
      message: `${result.totalNewTransactions} nuevas transacciones, ${result.totalReconciled} conciliadas en ${result.companies.length} sociedades`,
    });
  } catch (error: any) {
    logger.error('[Grupo Sync Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
