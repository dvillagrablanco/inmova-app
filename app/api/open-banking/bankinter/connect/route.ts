import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { getBankinterService, isBankinterConfigured } from '@/lib/bankinter-integration-service';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/bankinter/connect
 * Inicia el flujo AIS de Bankinter via Redsys PSD2.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const companyId = (session?.user as any)?.companyId;
    const userId = (session?.user as any)?.id;

    if (!companyId || !userId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const psuIpAddress =
      body.psuIpAddress ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';

    const service = getBankinterService();
    const { consentId, authUrl } = await service.conectarCuentaBankinter(
      companyId,
      userId,
      psuIpAddress
    );

    return NextResponse.json({
      success: true,
      configured: isBankinterConfigured(),
      consentId,
      authUrl,
      requiresAuth: true,
    });
  } catch (error: any) {
    logger.error('[Bankinter Connect]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
