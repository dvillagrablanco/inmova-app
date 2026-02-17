import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import { getGCClient } from '@/lib/gocardless-integration';
import { fullSyncAndReconcile } from '@/lib/banking-unified-service';
import { smartReconcileBatch } from '@/lib/ai-reconciliation-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/cron/sync-gocardless
 *
 * Cron job que se ejecuta cada 15 minutos (configurar en vercel.json o crontab).
 * Sincroniza pagos y payouts de GoCardless, ejecuta conciliación unificada
 * y la conciliación inteligente con IA para todas las empresas con GC activo.
 *
 * Para proteger el endpoint, verificar CRON_SECRET header.
 *
 * vercel.json:
 *   "crons": [{ "path": "/api/cron/sync-gocardless", "schedule": "*/15 * * * *" }]
 *
 * PM2/crontab:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://inmovaapp.com/api/cron/sync-gocardless
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación cron
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const gc = getGCClient();
    if (!gc) {
      return NextResponse.json({ message: 'GoCardless no configurado, skip' });
    }

    const prisma = getPrismaClient();

    // Obtener todas las empresas que tienen mandatos SEPA o conexiones GC
    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { sepaMandates: { some: {} } },
          { gcCustomers: { some: {} } },
          { bankConnections: { some: { proveedor: 'gocardless' } } },
        ],
      },
      select: { id: true, nombre: true },
    });

    if (companies.length === 0) {
      return NextResponse.json({ message: 'No hay empresas con GC activo' });
    }

    const results = [];

    for (const company of companies) {
      try {
        // 1. Sync GC + conciliación unificada
        const syncResult = await fullSyncAndReconcile(company.id);

        // 2. Conciliación inteligente (reglas + IA) para transferencias directas
        const smartResult = await smartReconcileBatch(company.id, 50, true);

        results.push({
          company: company.nombre,
          sync: syncResult.sync,
          unified: {
            sepa: syncResult.reconciliation.sepaToPayment.matched,
            payout: syncResult.reconciliation.payoutToBankTx.matched,
            bankTx: syncResult.reconciliation.bankTxToPayment.matched,
          },
          smart: {
            processed: smartResult.processed,
            reconciled: smartResult.reconciled,
          },
        });

        logger.info(
          `[Cron GC] ${company.nombre}: sync ${syncResult.sync.payments}p/${syncResult.sync.payouts}po, ` +
          `unified ${syncResult.reconciliation.sepaToPayment.matched}+${syncResult.reconciliation.payoutToBankTx.matched}+${syncResult.reconciliation.bankTxToPayment.matched}, ` +
          `smart ${smartResult.reconciled}/${smartResult.processed}`
        );
      } catch (e: any) {
        logger.error(`[Cron GC] Error for ${company.nombre}:`, e.message);
        results.push({ company: company.nombre, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      companies: results,
    });
  } catch (error: any) {
    logger.error('[Cron GC] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
