import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isNordigenConfigured } from '@/lib/nordigen-service';
import { getPrismaClient } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/nordigen/status
 * Estado de Nordigen y conexiones activas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const prisma = getPrismaClient();
    const connections = await prisma.bankConnection.findMany({
      where: { companyId: session.user.companyId, proveedor: 'nordigen' },
      select: {
        id: true, nombreBanco: true, estado: true,
        ultimaSincronizacion: true, createdAt: true, cuentas: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const txCounts = await prisma.bankTransaction.groupBy({
      by: ['connectionId'],
      where: { companyId: session.user.companyId, connection: { proveedor: 'nordigen' } },
      _count: true,
    });
    const txMap = Object.fromEntries(txCounts.map(t => [t.connectionId, t._count]));

    return NextResponse.json({
      success: true,
      nordigen: { configured: isNordigenConfigured() },
      connections: connections.map(c => ({
        ...c, transactionCount: txMap[c.id] || 0,
      })),
      summary: {
        total: connections.length,
        active: connections.filter(c => c.estado === 'conectado').length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
