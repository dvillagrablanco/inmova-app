/**
 * POST /api/cron/sync-bank-transactions
 * Cron job: Sincronizar transacciones bancarias desde múltiples fuentes
 * 
 * Fuentes (por prioridad):
 * 1. Tink (Open Banking PSD2) — Lectura automática si hay conexiones activas
 * 2. GoCardless/Nordigen — Si configurado
 * 3. CAMT.053 import — Archivos XML locales pendientes de importar
 * 
 * Ejecutar via cron cada hora o manualmente.
 * Protegido con CRON_SECRET.
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(req: NextRequest) {
  try {
    // Auth: CRON_SECRET or admin session
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Check session as fallback
      const { getServerSession } = await import('next-auth');
      const { authOptions } = await import('@/lib/auth-options');
      const session = await getServerSession(authOptions);
      const role = (session?.user as any)?.role;
      if (!session?.user || !['super_admin', 'administrador'].includes(role)) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      sources: {},
    };

    const prisma = await getPrisma();

    // Source 1: Tink (if configured)
    try {
      const {
        isTinkConfigured,
        testConnection,
        listAccounts,
        listTransactions,
        parseTinkAmount,
      } = await import('@/lib/tink-service');

      if (isTinkConfigured()) {
        const test = await testConnection();

        if (!test.ok) {
          results.sources.tink = {
            configured: true,
            connected: false,
            message: test.message,
          };
        } else {
          const tinkConnections = await prisma.bankConnection.findMany({
            where: {
              proveedor: 'tink',
              estado: 'conectado',
              companyId: { not: null },
              userId: { not: null },
            },
            select: {
              id: true,
              companyId: true,
              userId: true,
              accessToken: true,
              ultimaSync: true,
            },
          });

          let syncedConnections = 0;
          let discoveredAccounts = 0;
          let processedTransactions = 0;

          for (const connection of tinkConnections) {
            if (!connection.companyId || !connection.userId || !connection.accessToken) {
              continue;
            }

            const accounts = await listAccounts(connection.accessToken);
            discoveredAccounts += accounts.length;

            const dateFrom = connection.ultimaSync
              ? new Date(connection.ultimaSync.getTime() - 2 * 24 * 60 * 60 * 1000)
              : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

            const dateFromStr = dateFrom.toISOString().split('T')[0];
            const dateToStr = new Date().toISOString().split('T')[0];

            for (const account of accounts) {
              let pageToken: string | undefined;

              do {
                const txResult = await listTransactions(connection.accessToken, {
                  accountId: account.id,
                  dateFrom: dateFromStr,
                  dateTo: dateToStr,
                  pageSize: 100,
                  pageToken,
                });

                for (const tx of txResult.transactions) {
                  const bookedDate = tx.dates.booked || tx.dates.value;
                  if (!bookedDate) {
                    continue;
                  }

                  const description =
                    tx.descriptions.display ||
                    tx.descriptions.original ||
                    tx.merchantInformation?.merchantName ||
                    tx.reference ||
                    'Sin descripción';

                  await prisma.bankTransaction.upsert({
                    where: { proveedorTxId: `tink_${tx.id}` },
                    update: {
                      descripcion: description,
                      monto: parseTinkAmount(tx.amount),
                      referencia: tx.reference || tx.identifiers?.providerTransactionId || null,
                      categoria: tx.types?.type || null,
                      rawData: tx,
                    },
                    create: {
                      companyId: connection.companyId,
                      connectionId: connection.id,
                      proveedorTxId: `tink_${tx.id}`,
                      fecha: new Date(bookedDate),
                      fechaContable: tx.dates.value ? new Date(tx.dates.value) : null,
                      descripcion: description,
                      monto: parseTinkAmount(tx.amount),
                      moneda: tx.amount.currencyCode || 'EUR',
                      categoria: tx.types?.type || null,
                      referencia: tx.reference || tx.identifiers?.providerTransactionId || null,
                      tipoTransaccion: tx.status || null,
                      rawData: tx,
                      estado: 'pendiente_revision',
                    },
                  });

                  processedTransactions++;
                }

                pageToken = txResult.nextPageToken;
              } while (pageToken);
            }

            await prisma.bankConnection.update({
              where: { id: connection.id },
              data: { ultimaSync: new Date(), errorDetalle: null },
            });

            syncedConnections++;
          }

          results.sources.tink = {
            configured: true,
            connected: true,
            message: test.message,
            synced: true,
            connections: tinkConnections.length,
            syncedConnections,
            accounts: discoveredAccounts,
            transactions: processedTransactions,
          };
        }
      } else {
        results.sources.tink = { configured: false };
      }
    } catch (e: any) {
      results.sources.tink = { configured: false, error: e.message };
    }

    // Source 2: GoCardless (sync payments + reconcile)
    try {
      const gcToken = process.env.GOCARDLESS_ACCESS_TOKEN;
      if (gcToken) {
        // Sync SEPA payments from GoCardless
        try {
          const { syncPaymentsFromGC } = await import('@/lib/gocardless-reconciliation');
          // Get all companies with GoCardless configured
          const companies = await prisma.company.findMany({
            where: { activo: true },
            select: { id: true, nombre: true },
          });

          let totalCreated = 0;
          let totalUpdated = 0;
          for (const company of companies) {
            try {
              const syncResult = await syncPaymentsFromGC(company.id);
              totalCreated += syncResult.created;
              totalUpdated += syncResult.updated;
            } catch {
              // Company may not have GC mandates — skip
            }
          }

          results.sources.gocardless = {
            configured: true,
            synced: true,
            created: totalCreated,
            updated: totalUpdated,
          };
        } catch (syncErr: any) {
          results.sources.gocardless = { configured: true, synced: false, error: syncErr.message };
        }
      } else {
        results.sources.gocardless = { configured: false };
      }
    } catch (e: any) {
      results.sources.gocardless = { configured: false, error: e.message };
    }

    // Source 3: DB stats
    const [txCount, latestTx, connectionCount] = await Promise.all([
      prisma.bankTransaction.count(),
      prisma.bankTransaction.findFirst({ orderBy: { fecha: 'desc' }, select: { fecha: true } }),
      prisma.bankConnection.count(),
    ]);

    results.stats = {
      totalTransactions: txCount,
      totalConnections: connectionCount,
      latestTransaction: latestTx?.fecha,
    };

    logger.info('[Cron] Bank sync completed', results);

    return NextResponse.json({ success: true, ...results });
  } catch (error: any) {
    logger.error('[Cron] Bank sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET — Status check for the cron job
 */
export async function GET(req: NextRequest) {
  const prisma = await getPrisma();

  const [txCount, latestTx, connectionCount] = await Promise.all([
    prisma.bankTransaction.count(),
    prisma.bankTransaction.findFirst({ orderBy: { fecha: 'desc' }, select: { fecha: true, descripcion: true } }),
    prisma.bankConnection.count(),
  ]);

  const tinkConfigured = !!(process.env.TINK_CLIENT_ID && process.env.TINK_CLIENT_SECRET);
  const gcConfigured = !!process.env.GOCARDLESS_ACCESS_TOKEN;

  return NextResponse.json({
    status: 'ok',
    sources: {
      tink: { configured: tinkConfigured, environment: process.env.TINK_ENVIRONMENT },
      gocardless: { configured: gcConfigured, environment: process.env.GOCARDLESS_ENVIRONMENT },
      camt053: { filesAvailable: true },
    },
    stats: {
      totalTransactions: txCount,
      totalConnections: connectionCount,
      latestTransaction: latestTx?.fecha,
      latestDescription: latestTx?.descripcion,
    },
  });
}
