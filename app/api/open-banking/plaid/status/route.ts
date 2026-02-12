import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isPlaidConfigured, getPlaidEnv } from '@/lib/plaid-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/plaid/status
 * Estado de la integración Plaid y conexiones activas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();

    // Get connections for this company
    const connections = await prisma.bankConnection.findMany({
      where: { companyId: session.user.companyId, proveedor: 'plaid' },
      select: {
        id: true,
        nombreBanco: true,
        estado: true,
        ultimaSincronizacion: true,
        createdAt: true,
        cuentas: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count transactions per connection
    const transactionCounts = await prisma.bankTransaction.groupBy({
      by: ['connectionId'],
      where: { companyId: session.user.companyId },
      _count: true,
    });

    const txMap = Object.fromEntries(
      transactionCounts.map(t => [t.connectionId, t._count])
    );

    return NextResponse.json({
      success: true,
      plaid: {
        configured: isPlaidConfigured(),
        environment: getPlaidEnv(),
      },
      connections: connections.map(c => ({
        ...c,
        transactionCount: txMap[c.id] || 0,
      })),
      summary: {
        total: connections.length,
        active: connections.filter(c => c.estado === 'conectado').length,
      },
    });
  } catch (error: any) {
    logger.error('[Plaid Status Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
