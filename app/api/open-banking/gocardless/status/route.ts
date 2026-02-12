import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/gocardless/status
 * Estado de GoCardless: creditor, mandatos, pagos por empresa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const token = process.env.GOCARDLESS_ACCESS_TOKEN;
    const env = process.env.GOCARDLESS_ENVIRONMENT || 'live';

    if (!token) {
      return NextResponse.json({ error: 'GoCardless no configurado' }, { status: 503 });
    }

    const prisma = getPrismaClient();

    // Get mandates from DB for this company
    const mandates = await prisma.bankConnection.findMany({
      where: { companyId: session.user.companyId, proveedor: 'gocardless' },
      select: {
        id: true, tenantId: true, nombreBanco: true, estado: true,
        ultimaSincronizacion: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Count transactions
    const txCounts = await prisma.bankTransaction.groupBy({
      by: ['connectionId'],
      where: {
        companyId: session.user.companyId,
        connection: { proveedor: 'gocardless' },
      },
      _count: true,
      _sum: { monto: true },
    });

    const txMap = Object.fromEntries(
      txCounts.map(t => [t.connectionId, { count: t._count, total: t._sum.monto || 0 }])
    );

    // Get creditor info from GoCardless API
    let creditor = null;
    try {
      const baseUrl = env === 'live' ? 'https://api.gocardless.com' : 'https://api-sandbox.gocardless.com';
      const res = await fetch(`${baseUrl}/creditors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'GoCardless-Version': '2015-07-06',
        },
      });
      const data = await res.json();
      if (data.creditors?.[0]) {
        const c = data.creditors[0];
        creditor = { id: c.id, name: c.name, createdAt: c.created_at };
      }
    } catch (e) {
      logger.warn('[GC Status] Error fetching creditor');
    }

    return NextResponse.json({
      success: true,
      gocardless: {
        configured: true,
        environment: env,
        creditor,
      },
      mandates: mandates.map(m => ({
        ...m,
        payments: txMap[m.id] || { count: 0, total: 0 },
      })),
      summary: {
        totalMandates: mandates.length,
        active: mandates.filter(m => m.estado === 'conectado').length,
        totalPayments: txCounts.reduce((s, t) => s + t._count, 0),
        totalAmount: txCounts.reduce((s, t) => s + (t._sum.monto || 0), 0),
      },
    });
  } catch (error: any) {
    logger.error('[GC Status Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
