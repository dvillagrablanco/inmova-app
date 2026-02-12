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
 * Sincroniza transacciones de una conexión Nordigen
 * Body: { connectionId: string, dateFrom?: string, dateTo?: string }
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

    const { connectionId, dateFrom, dateTo } = await request.json();
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId requerido' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, companyId: session.user.companyId, proveedor: 'nordigen' },
    });

    if (!connection || !connection.accessToken) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    // accessToken stores comma-separated Nordigen account IDs
    const accountIds = connection.accessToken.split(',').filter(Boolean);
    let totalAdded = 0;
    let totalBalances = 0;

    for (const accountId of accountIds) {
      // Get transactions
      const txResult = await getTransactions(accountId, dateFrom, dateTo);
      if (txResult) {
        for (const tx of [...txResult.booked, ...txResult.pending]) {
          const txId = tx.transactionId || `${accountId}_${tx.bookingDate}_${tx.transactionAmount.amount}`;
          const amount = parseFloat(tx.transactionAmount.amount);
          const desc = tx.remittanceInformationUnstructured ||
            tx.remittanceInformationStructured ||
            tx.creditorName || tx.debtorName || 'Sin descripción';

          try {
            await prisma.bankTransaction.upsert({
              where: { proveedorTxId: txId },
              update: {
                descripcion: desc,
                monto: amount,
              },
              create: {
                companyId: session.user.companyId,
                connectionId: connection.id,
                proveedorTxId: txId,
                fecha: new Date(tx.bookingDate),
                fechaContable: tx.valueDate ? new Date(tx.valueDate) : null,
                descripcion: desc,
                monto: amount,
                moneda: tx.transactionAmount.currency || 'EUR',
                categoria: tx.bankTransactionCode || null,
                estado: 'pendiente_revision',
              },
            });
            totalAdded++;
          } catch (e) {
            // Skip duplicates
          }
        }
      }

      // Get balances
      const balances = await getAccountBalances(accountId);
      if (balances.length > 0) totalBalances++;
    }

    // Update last sync
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { ultimaSincronizacion: new Date() },
    });

    logger.info(`[Nordigen Sync] ${connection.id}: ${totalAdded} transacciones de ${accountIds.length} cuentas`);

    return NextResponse.json({
      success: true,
      accounts: accountIds.length,
      transactions: totalAdded,
      message: `${totalAdded} transacciones sincronizadas de ${accountIds.length} cuentas`,
    });
  } catch (error: any) {
    logger.error('[Nordigen Sync Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
