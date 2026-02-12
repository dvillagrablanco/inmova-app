import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { syncTransactions, isPlaidConfigured } from '@/lib/plaid-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/plaid/sync
 * Sincroniza transacciones de una conexión Plaid
 * Body: { connectionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isPlaidConfigured()) {
      return NextResponse.json({ error: 'Plaid no configurado' }, { status: 503 });
    }

    const { connectionId } = await request.json();
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId requerido' }, { status: 400 });
    }

    const prisma = getPrismaClient();

    // Get connection
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, companyId: session.user.companyId, proveedor: 'plaid' },
    });

    if (!connection || !connection.accessToken) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    // Sync transactions using cursor for incremental sync
    const result = await syncTransactions(
      connection.accessToken,
      connection.syncCursor || undefined
    );

    if (!result) {
      return NextResponse.json({ error: 'Error sincronizando transacciones' }, { status: 500 });
    }

    // Save new transactions to DB
    let created = 0;
    for (const tx of result.added) {
      try {
        await prisma.bankTransaction.upsert({
          where: { proveedorTxId: tx.transactionId },
          update: {
            descripcion: tx.name,
            monto: -tx.amount, // Plaid uses positive for debits
            categoria: tx.category?.[0] || null,
          },
          create: {
            companyId: session.user.companyId,
            connectionId: connection.id,
            proveedorTxId: tx.transactionId,
            fecha: new Date(tx.date),
            descripcion: tx.name,
            monto: -tx.amount,
            moneda: tx.currency || 'EUR',
            categoria: tx.category?.[0] || null,
            subcategoria: tx.merchantName || null,
            estado: tx.pending ? 'pendiente_revision' : 'pendiente_revision',
          },
        });
        created++;
      } catch (e: any) {
        // Skip duplicate
      }
    }

    // Remove deleted transactions
    let removed = 0;
    for (const tx of result.removed) {
      try {
        await prisma.bankTransaction.deleteMany({
          where: { proveedorTxId: tx.transactionId },
        });
        removed++;
      } catch (e) {}
    }

    // Update cursor and last sync time
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        syncCursor: result.nextCursor,
        ultimaSincronizacion: new Date(),
      },
    });

    logger.info(`[Plaid Sync] ${connection.id}: +${created} -${removed} transacciones`);

    return NextResponse.json({
      success: true,
      added: created,
      modified: result.modified.length,
      removed,
      message: `Sincronización completada: ${created} nuevas transacciones`,
    });
  } catch (error: any) {
    logger.error('[Plaid Sync Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
