import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { deleteRequisition, isNordigenConfigured } from '@/lib/nordigen-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/nordigen/disconnect
 * Desconecta un banco (elimina requisition en Nordigen)
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
      where: { id: connectionId, companyId: session.user.companyId, proveedor: 'nordigen' },
    });

    if (!connection) {
      return NextResponse.json({ error: 'Conexión no encontrada' }, { status: 404 });
    }

    if (connection.consentId && isNordigenConfigured()) {
      await deleteRequisition(connection.consentId);
    }

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { estado: 'desconectado', accessToken: null, desconectadaEn: new Date() },
    });

    logger.info(`[Nordigen] Conexión ${connection.id} desconectada`);
    return NextResponse.json({ success: true, message: 'Banco desconectado' });
  } catch (error: any) {
    logger.error('[Nordigen Disconnect Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
