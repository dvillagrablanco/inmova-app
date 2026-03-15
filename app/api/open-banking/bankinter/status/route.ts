import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBankinterService, isBankinterConfigured } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

/**
 * GET /api/open-banking/bankinter/status
 * Estado de configuración y conexiones activas de Bankinter/Redsys.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const companyId = (session?.user as any)?.companyId;

    if (!companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const configured = isBankinterConfigured();
    const prisma = await getPrisma();
    const consentId = request.nextUrl.searchParams.get('consentId');

    const connections = await prisma.bankConnection.findMany({
      where: {
        companyId,
        proveedor: { in: ['bankinter_redsys', 'bankinter_camt053'] },
      },
      select: {
        id: true,
        proveedor: true,
        provider: true,
        nombreBanco: true,
        estado: true,
        consentId: true,
        ultimaSync: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    let consentStatus: string | null = null;
    if (configured && consentId) {
      try {
        consentStatus = await getBankinterService().getConsentStatus(consentId);
      } catch (error: any) {
        logger.warn('[Bankinter Status] No se pudo consultar estado del consentimiento', {
          consentId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      configured,
      environment: process.env.REDSYS_ENVIRONMENT || 'sandbox',
      consentStatus,
      connections,
      summary: {
        total: connections.length,
        active: connections.filter((connection) => connection.estado === 'conectado').length,
      },
    });
  } catch (error: any) {
    logger.error('[Bankinter Status]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
