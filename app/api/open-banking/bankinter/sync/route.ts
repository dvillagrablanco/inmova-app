import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBankinterService } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * POST /api/open-banking/bankinter/sync
 * Sincroniza transacciones de una conexión Bankinter existente.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const companyId = (session?.user as any)?.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { connectionId, diasAtras = 90 } = await request.json();
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId requerido' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, companyId, proveedor: 'bankinter_redsys' },
      select: { id: true },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    const service = getBankinterService();
    const result = await service.sincronizarTransaccionesBankinter(connectionId, diasAtras);

    return NextResponse.json({
      success: true,
      connectionId,
      total: result.total,
      transacciones: result.transacciones,
    });
  } catch (error: any) {
    logger.error('[Bankinter Sync]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
