import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getTransactions, getAccountBalances, isNordigenConfigured } from '@/lib/nordigen-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/nordigen/sync
 * Sincroniza transacciones de conexiones Nordigen.
 * Body: { connectionId?: string, companyId?: string, dateFrom?: string, dateTo?: string }
 * Si connectionId no se proporciona, sincroniza todas las conexiones activas de la empresa.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isNordigenConfigured()) {
      return NextResponse.json({ error: 'Nordigen no configurado' }, { status: 503 });
    }

    const body = await request.json().catch(() => ({}));
    const { connectionId, companyId, dateFrom, dateTo } = body as {
      connectionId?: string;
      companyId?: string;
      dateFrom?: string;
      dateTo?: string;
    };

    const targetCompanyId = companyId || session.user.companyId;
    const prisma = getPrismaClient();

    // Determinar qué conexiones sincronizar
    const connections = connectionId
      ? await prisma.bankConnection.findMany({
          where: {
            id: connectionId,
            companyId: targetCompanyId,
            proveedor: { in: ['nordigen', 'gocardless'] },
          },
        })
      : await prisma.bankConnection.findMany({
          where: {
            companyId: targetCompanyId,
            proveedor: { in: ['nordigen', 'gocardless'] },
            estado: 'conectado',
            accessToken: { not: null },
          },
        });

    if (connections.length === 0) {
      return NextResponse.json({
        success: false,
        error: connectionId
          ? 'Conexión no encontrada o sin cuentas asociadas'
          : 'No hay conexiones Nordigen activas. Conecta un banco primero desde /finanzas/bancaria-setup',
        newTransactions: 0,
      });
    }

    let totalAdded = 0;
    let totalUpdated = 0;
    const errors: string[] = [];

    for (const connection of connections) {
      if (!connection.accessToken) continue;

      const accountIds = connection.accessToken.split(',').filter(Boolean);

      // Calcular rango de fechas: desde última sync o últimos 90 días
      const syncFrom =
        dateFrom ||
        (connection.ultimaSync
          ? new Date(connection.ultimaSync.getTime() - 2 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
          : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      const syncTo = dateTo || new Date().toISOString().split('T')[0];

      for (const accountId of accountIds) {
        try {
          const txResult = await getTransactions(accountId, syncFrom, syncTo);
          if (!txResult) continue;

          for (const tx of [...txResult.booked, ...(txResult.pending || [])]) {
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
                  data: { descripcion: desc, monto: amount },
                });
                totalUpdated++;
              } else {
                await prisma.bankTransaction.create({
                  data: {
                    companyId: targetCompanyId,
                    connectionId: connection.id,
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
                    rawData: tx as any,
                    estado: 'pendiente_revision',
                  },
                });
                totalAdded++;
              }
            } catch (e: any) {
              if (!e.message?.includes('Unique constraint')) {
                errors.push(`Tx ${txId}: ${e.message}`);
              }
            }
          }
        } catch (e: any) {
          errors.push(`Account ${accountId}: ${e.message}`);
        }
      }

      // Actualizar última sincronización
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: { ultimaSync: new Date() },
      });

      logger.info(
        `[Nordigen Sync] ${connection.nombreBanco || connection.id}: +${totalAdded} nuevas, ${totalUpdated} actualizadas`
      );
    }

    return NextResponse.json({
      success: true,
      connectionsProcessed: connections.length,
      newTransactions: totalAdded,
      updatedTransactions: totalUpdated,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      message: `${totalAdded} nuevas transacciones, ${totalUpdated} actualizadas de ${connections.length} conexión(es)`,
    });
  } catch (error: any) {
    logger.error('[Nordigen Sync Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
