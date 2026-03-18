/**
 * GET /api/open-banking/tink/accounts
 * Lista cuentas bancarias conectadas vía Tink
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

    const { isTinkConfigured, listAccounts } = await import('@/lib/tink-service');
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

    const accounts = await listAccounts(connection.accessToken);

    return NextResponse.json({ success: true, accounts });
  } catch (error: any) {
    logger.error('[Tink Accounts]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
