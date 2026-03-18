/**
 * GET /api/open-banking/tink/transactions
 * Lista transacciones bancarias vía Tink
 * Query: ?accountId=xxx&dateFrom=2026-01-01&dateTo=2026-03-06
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { isTinkConfigured, listTransactions, parseTinkAmount } = await import(
      '@/lib/tink-service'
    );
    if (!isTinkConfigured()) {
      return NextResponse.json({ error: 'Tink no configurado' }, { status: 503 });
    }

    const { getPrismaClient } = await import('@/lib/db');
    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const connection = await prisma.bankConnection.findFirst({
      where: {
        companyId,
        userId,
        proveedor: 'tink',
        accessToken: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      select: { accessToken: true, estado: true },
    });

    if (!connection?.accessToken) {
      return NextResponse.json(
        { error: 'No hay conexion Tink activa. Debes reconectar el banco.' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);

    const result = await listTransactions(connection.accessToken, {
      accountId: searchParams.get('accountId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      pageSize: parseInt(searchParams.get('pageSize') || '50'),
      pageToken: searchParams.get('pageToken') || undefined,
    });

    // Parse amounts to readable numbers
    const transactions = result.transactions.map(tx => ({
      ...tx,
      parsedAmount: parseTinkAmount(tx.amount),
    }));

    return NextResponse.json({
      success: true,
      transactions,
      nextPageToken: result.nextPageToken,
      count: transactions.length,
    });
  } catch (error: any) {
    logger.error('[Tink Transactions]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
