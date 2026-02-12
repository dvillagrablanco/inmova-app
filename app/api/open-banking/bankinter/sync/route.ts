import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import { getBankinterService, isBankinterConfigured } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/bankinter/sync
 * 
 * Sincroniza transacciones de una conexión de Bankinter
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Resolver companyId con soporte multi-empresa (cookie > JWT)
    const cookieCompanyId = request.cookies.get('activeCompanyId')?.value;
    const __resolvedCompanyId = cookieCompanyId || session.user.companyId;
    if (!__resolvedCompanyId) {
      return NextResponse.json({ error: 'Empresa no definida' }, { status: 400 });
    }
    // Inyectar companyId resuelto en session para compatibilidad
    (session.user as any).companyId = __resolvedCompanyId;

    if (!isBankinterConfigured()) {
      return NextResponse.json(
        {
          error: 'Integración con Bankinter no configurada'
        },
        { status: 503 }
      );
    }

    const { connectionId, diasAtras } = await request.json();

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId requerido' },
        { status: 400 }
      );
    }

    // Verificar que la conexión pertenece a la compañía del usuario
    const connection = await prisma.bankConnection.findFirst({
      where: {
        id: connectionId,
        companyId: session.user.companyId
      }
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Conexión no encontrada o sin acceso' },
        { status: 404 }
      );
    }

    const bankinterService = getBankinterService();
    // Sincronizar transacciones
    const resultado = await bankinterService.sincronizarTransaccionesBankinter(
      connectionId,
      diasAtras || 90
    );

    logger.info(`💳 ${resultado.total} transacciones sincronizadas de Bankinter`);

    return NextResponse.json({
      success: true,
      total: resultado.total,
      transacciones: resultado.transacciones,
      message: `${resultado.total} transacciones sincronizadas`
    });
  } catch (error: any) {
    logger.error('Error sincronizando transacciones:', error);
    return NextResponse.json(
      {
        error: 'Error al sincronizar transacciones',
        details: error.message
      },
      { status: 500 }
    );
  }
}
