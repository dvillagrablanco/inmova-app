import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/open-banking/bankinter/callback
 * Callback posterior a la autorización SCA en Bankinter/Redsys.
 */
export async function GET(request: NextRequest) {
  const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const redirectToOpenBanking = (params: Record<string, string>) => {
    const url = new URL('/open-banking', appUrl);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return NextResponse.redirect(url);
  };

  try {
    const consentId =
      request.nextUrl.searchParams.get('consentId') ||
      request.nextUrl.searchParams.get('state');
    const status = request.nextUrl.searchParams.get('status');
    const code = request.nextUrl.searchParams.get('code');
    const error = request.nextUrl.searchParams.get('error');

    if (!consentId) {
      return redirectToOpenBanking({ bankinter: 'error', message: 'missing_consent' });
    }

    const prisma = getPrismaClient();
    const connection = await prisma.bankConnection.findFirst({
      where: {
        proveedor: 'bankinter_redsys',
        OR: [{ consentId }, { proveedorItemId: consentId }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!connection) {
      return redirectToOpenBanking({ bankinter: 'error', message: 'connection_not_found' });
    }

    if (error || (status && status !== 'success' && !code)) {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: {
          estado: 'error',
          errorDetalle: error || `callback_status_${status}`,
        },
      });

      return redirectToOpenBanking({
        bankinter: 'error',
        message: error || status || 'authorization_failed',
      });
    }

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        estado: 'conectado',
        errorDetalle: null,
        ultimaSync: new Date(),
      },
    });

    logger.info('[Bankinter Callback] Conexión autorizada', {
      consentId,
      connectionId: connection.id,
    });

    return redirectToOpenBanking({
      bankinter: 'success',
      consentId,
      connectionId: connection.id,
    });
  } catch (error: any) {
    logger.error('[Bankinter Callback]:', error);
    return redirectToOpenBanking({ bankinter: 'error', message: 'callback_failed' });
  }
}
