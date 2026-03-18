/**
 * POST /api/open-banking/tink/connect
 * Genera un enlace de Tink Link para conectar una cuenta bancaria
 * 
 * Body: { market?: string, bankId?: string }
 * Returns: { tinkLinkUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function getPrisma() {
  const { getPrismaClient } = await import('@/lib/db');
  return getPrismaClient();
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { isTinkConfigured, createUser, generateTinkLink } = await import('@/lib/tink-service');

    if (!isTinkConfigured()) {
      return NextResponse.json({ error: 'Tink no configurado' }, { status: 503 });
    }

    const companyId = (session.user as any).companyId;
    const userId = (session.user as any).id;
    const body = await req.json().catch(() => ({}));

    // Create or get Tink user — use real Tink user_id (not external_user_id)
    const externalUserId = `inmova_${companyId}_${userId}_${Date.now()}`;
    let tinkUserId: string;
    try {
      tinkUserId = await createUser(externalUserId, body.market || 'ES');
      logger.info('[Tink] User created', { externalUserId, tinkUserId });
    } catch (createErr: any) {
      // User may already exist — create a new one with unique ID
      logger.warn('[Tink] Create user failed, retrying with fresh ID:', createErr.message?.substring(0, 100));
      const freshId = `inmova_${companyId}_${Date.now()}`;
      tinkUserId = await createUser(freshId, body.market || 'ES');
    }

    // Generate Tink Link using the real Tink user_id
    const redirectUri = `${process.env.NEXTAUTH_URL || 'https://inmovaapp.com'}/api/open-banking/tink/callback`;
    const tinkLinkUrl = await generateTinkLink({
      userId: tinkUserId,
      market: body.market || 'ES',
      redirectUri,
    });

    logger.info('[Tink] Connect link generated', { companyId, tinkUserId });

    return NextResponse.json({
      success: true,
      tinkLinkUrl,
      tinkUserId,
    });
  } catch (error: any) {
    logger.error('[Tink Connect]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/open-banking/tink/connect
 * Verifica el estado de conexión de Tink
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { isTinkConfigured, testConnection, SPANISH_BANKS } = await import('@/lib/tink-service');

    const configured = isTinkConfigured();
    let connectionTest = { ok: false, message: 'No configurado' };
    
    if (configured) {
      connectionTest = await testConnection();
    }

    return NextResponse.json({
      configured,
      connected: connectionTest.ok,
      message: connectionTest.message,
      availableBanks: SPANISH_BANKS,
    });
  } catch (error: any) {
    logger.error('[Tink Status]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
