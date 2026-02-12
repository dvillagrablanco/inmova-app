import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { removeItem, isPlaidConfigured } from '@/lib/plaid-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/plaid/disconnect
 * Desconecta una cuenta bancaria (revoca acceso en Plaid)
 * Body: { connectionId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { connectionId } = await request.json();
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId requerido' }, { status: 400 });
    }

    const prisma = getPrismaClient();
    const connection = await prisma.bankConnection.findFirst({
      where: { id: connectionId, companyId: session.user.companyId, proveedor: 'plaid' },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    // Revoke in Plaid
    if (connection.accessToken && isPlaidConfigured()) {
      await removeItem(connection.accessToken);
    }

    // Update DB
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        estado: 'desconectado',
        accessToken: null,
        desconectadaEn: new Date(),
      },
    });

    logger.info(`[Plaid] Conexión ${connection.id} desconectada`);

    return NextResponse.json({ success: true, message: 'Banco desconectado' });
  } catch (error: any) {
    logger.error('[Plaid Disconnect Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
