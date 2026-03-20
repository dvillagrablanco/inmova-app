import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST /api/banking/sync-grupo-vidaro
 *
 * Carga todos los movimientos bancarios del Grupo Vidaro desde Enable Banking
 * y ejecuta la reconciliación bancaria ↔ contabilidad (Zucchetti).
 *
 * Fases:
 *   1. Sync Enable Banking → BankTransaction (todas las sociedades)
 *   2. Sync Zucchetti SQL → AccountingTransaction (cuentas grupo 57)
 *   3. Reconciliación BankTransaction ↔ AccountingTransaction
 *   4. Reconciliación SEPA → Payment (alquileres)
 *
 * Solo accesible para super_admin y administrador.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }
    if (!['super_admin', 'administrador'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const fromDate = body.fromDate
      ? new Date(body.fromDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const toDate = body.toDate ? new Date(body.toDate) : new Date();

    const startTime = Date.now();
    logger.info(`[SyncGrupoVidaro] Iniciando sync completo del Grupo Vidaro`);

    const report: any = {
      period: {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
      },
      phases: {},
    };

    // ── FASE 1: Enable Banking → BankTransaction ─────────────────────────
    report.phases.enableBanking = { status: 'skip', message: 'No configurado' };
    try {
      const { isEnableBankingConfigured, syncEnableBankingTransactions } =
        await import('@/lib/enablebanking-service');

      if (isEnableBankingConfigured()) {
        const { getPrismaClient } = await import('@/lib/db');
        const prisma = getPrismaClient();

        const companies = await prisma.company.findMany({
          where: {
            OR: [
              { nombre: { contains: 'Rovida', mode: 'insensitive' } },
              { nombre: { contains: 'Viroda', mode: 'insensitive' } },
              { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
            ],
            activo: true,
          },
          select: { id: true, nombre: true },
        });

        let totalNew = 0;
        let totalUpdated = 0;
        const ebByCompany: any[] = [];

        for (const company of companies) {
          const result = await syncEnableBankingTransactions(company.id);
          totalNew += result.newTransactions;
          totalUpdated += result.updatedTransactions;
          ebByCompany.push({
            company: company.nombre,
            new: result.newTransactions,
            updated: result.updatedTransactions,
            errors: result.errors.length,
          });
        }

        report.phases.enableBanking = {
          status: 'ok',
          newTransactions: totalNew,
          updatedTransactions: totalUpdated,
          byCompany: ebByCompany,
        };
        logger.info(
          `[SyncGrupoVidaro] Enable Banking: +${totalNew} nuevas, ${totalUpdated} actualizadas`
        );
      }
    } catch (e: any) {
      report.phases.enableBanking = { status: 'error', message: e.message };
      logger.error('[SyncGrupoVidaro] Enable Banking error:', e);
    }

    // ── FASE 2: Zucchetti SQL → AccountingTransaction ────────────────────
    report.phases.zucchetti = { status: 'skip', message: 'No configurado' };
    try {
      const { getPrismaClient } = await import('@/lib/db');
      const prisma = getPrismaClient();

      // Verificar si hay empresas con Zucchetti habilitado
      const zucchettiCompanies = await prisma.company.findMany({
        where: { zucchettiEnabled: true },
        select: { id: true, nombre: true, zucchettiLastSync: true },
      });

      if (zucchettiCompanies.length > 0) {
        // Llamar al endpoint de refresh de contabilidad de Zucchetti
        const refreshRes = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/accounting/refresh-from-source`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fromDate: fromDate.toISOString(),
              toDate: toDate.toISOString(),
            }),
          }
        ).catch(() => null);

        if (refreshRes?.ok) {
          const refreshData = await refreshRes.json();
          report.phases.zucchetti = {
            status: 'ok',
            companies: zucchettiCompanies.map((c) => c.nombre),
            ...refreshData,
          };
        } else {
          report.phases.zucchetti = {
            status: 'partial',
            message: 'Refresh no disponible — verificar conexión SQL Server',
            companies: zucchettiCompanies.map((c) => c.nombre),
          };
        }
      }
    } catch (e: any) {
      report.phases.zucchetti = { status: 'error', message: e.message };
    }

    // ── FASE 3: Reconciliación BankTransaction ↔ AccountingTransaction ───
    report.phases.bankingAccounting = { status: 'skip' };
    try {
      const { reconcileAllGrupoVidaro } = await import('@/lib/banking-accounting-reconciliation');
      const reconResults = await reconcileAllGrupoVidaro(fromDate, toDate);

      const totalMatched = reconResults.reduce((s, r) => s + r.summary.matched, 0);
      const totalBankOnly = reconResults.reduce((s, r) => s + r.summary.bankOnly, 0);
      const totalAccOnly = reconResults.reduce((s, r) => s + r.summary.accountingOnly, 0);
      const totalDiscrepancy = reconResults.reduce((s, r) => s + r.summary.discrepancy, 0);

      report.phases.bankingAccounting = {
        status: 'ok',
        totalMatched,
        totalBankOnly,
        totalAccOnly,
        totalDiscrepancy: Math.round(totalDiscrepancy * 100) / 100,
        byCompany: reconResults.map((r) => ({
          company: r.companyName,
          matched: r.summary.matched,
          bankOnly: r.summary.bankOnly,
          accountingOnly: r.summary.accountingOnly,
          matchRate: r.summary.matchRate,
          discrepancy: Math.round(r.summary.discrepancy * 100) / 100,
          bankBalance: Math.round(r.summary.bankBalance * 100) / 100,
          accountingBalance: Math.round(r.summary.accountingBalance * 100) / 100,
        })),
      };
    } catch (e: any) {
      report.phases.bankingAccounting = { status: 'error', message: e.message };
    }

    // ── FASE 4: Reconciliación SEPA ↔ Pagos alquiler ─────────────────────
    report.phases.sepaPayments = { status: 'skip' };
    try {
      const { fullSyncAllGrupoVidaro } = await import('@/lib/banking-unified-service');
      const sepaResult = await fullSyncAllGrupoVidaro();
      report.phases.sepaPayments = {
        status: 'ok',
        totalReconciled: sepaResult.totalReconciled,
        companies: sepaResult.companies.length,
      };
    } catch (e: any) {
      report.phases.sepaPayments = { status: 'error', message: e.message };
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    report.duration = `${duration}s`;
    report.timestamp = new Date().toISOString();

    logger.info(`[SyncGrupoVidaro] Completado en ${duration}s`);

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    logger.error('[SyncGrupoVidaro Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/banking/sync-grupo-vidaro
 * Último estado de la conciliación sin ejecutar sync nuevo.
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const prisma = getPrismaClient();

    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { nombre: { contains: 'Rovida', mode: 'insensitive' } },
          { nombre: { contains: 'Viroda', mode: 'insensitive' } },
          { nombre: { contains: 'Vidaro', mode: 'insensitive' } },
        ],
        activo: true,
      },
      select: { id: true, nombre: true, zucchettiLastSync: true },
    });

    const statusByCompany = await Promise.all(
      companies.map(async (c) => {
        const [bankTxCount, accTxCount, bankOnly, sepaActive] = await Promise.all([
          prisma.bankTransaction.count({
            where: { companyId: c.id, estado: { not: 'descartado' } },
          }),
          prisma.accountingTransaction.count({ where: { companyId: c.id } }),
          prisma.bankTransaction.count({
            where: { companyId: c.id, estado: 'pendiente_revision' },
          }),
          prisma.sepaMandate.count({ where: { companyId: c.id, status: 'active' } }),
        ]);

        return {
          company: c.nombre,
          bankTransactions: bankTxCount,
          accountingTransactions: accTxCount,
          pendingReconciliation: bankOnly,
          sepaActive,
          zucchettiLastSync: c.zucchettiLastSync?.toISOString() ?? null,
        };
      })
    );

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      companies: statusByCompany,
      totals: {
        bankTransactions: statusByCompany.reduce((s, c) => s + c.bankTransactions, 0),
        accountingTransactions: statusByCompany.reduce((s, c) => s + c.accountingTransactions, 0),
        pendingReconciliation: statusByCompany.reduce((s, c) => s + c.pendingReconciliation, 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
