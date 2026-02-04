import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { sincronizarTransacciones } from '@/lib/open-banking-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/sync
 *
 * Sincroniza transacciones para cualquier conexión bancaria (modo real o demo)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { connectionId, diasAtras } = await request.json();
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId requerido' }, { status: 400 });
    }

    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        companyId: session.user.companyId,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexión no encontrada o sin acceso' },
        { status: 404 }
      );
    }

    const resultado = await sincronizarTransacciones(connectionId, diasAtras);

    return NextResponse.json({
      success: true,
      total: resultado.total,
      transacciones: resultado.transacciones,
      message: resultado.message || 'Sincronización completada',
    });
  } catch (error: any) {
    logger.error('Error sincronizando transacciones:', error);
    return NextResponse.json(
      {
        error: 'Error al sincronizar transacciones',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
