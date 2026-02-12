import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getAccounts, isPlaidConfigured } from '@/lib/plaid-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/plaid/accounts?connectionId=xxx
 * Obtiene cuentas y saldos actuales de una conexión Plaid
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isPlaidConfigured()) {
      return NextResponse.json({ error: 'Plaid no configurado' }, { status: 503 });
    }

    const connectionId = request.nextUrl.searchParams.get('connectionId');
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId requerido' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, companyId: session.user.companyId, proveedor: 'plaid' },
    });

    if (!connection || !connection.accessToken) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    const result = await getAccounts(connection.accessToken);
    if (!result) {
      return NextResponse.json({ error: 'Error obteniendo cuentas' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    logger.error('[Plaid Accounts Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
