import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { isEnableBankingConfigured, startAuth } from '@/lib/enablebanking-service';
import { getPrismaClient } from '@/lib/db';
import logger from '@/lib/logger';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/open-banking/enablebanking/connect
 *
 * Inicia el flujo OAuth2 PSD2 de Enable Banking.
 * Devuelve la URL a la que redirigir el usuario para que autorice
 * el acceso a su cuenta bancaria.
 *
 * Body: { bankName: string, countryCode?: string, companyId?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!isEnableBankingConfigured()) {
      return NextResponse.json(
        {
          error: 'Enable Banking no configurado',
          help: 'Añadir ENABLE_BANKING_APP_ID y ENABLE_BANKING_PRIVATE_KEY al .env.production. Dashboard: https://enablebanking.com/dashboard',
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const bankName: string = body.bankName || 'Bankinter';
    const countryCode: string = body.countryCode || 'ES';
    const targetCompanyId: string = body.companyId || session.user.companyId;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://inmovaapp.com';
    const callbackUrl = `${appUrl}/api/open-banking/enablebanking/callback`;

    // State para CSRF — codifica companyId y userId
    const state = Buffer.from(
      JSON.stringify({
        companyId: targetCompanyId,
        userId: session.user.id,
        ts: Date.now(),
        nonce: crypto.randomBytes(8).toString('hex'),
      })
    ).toString('base64url');

    const authSession = await startAuth({
      bankName,
      countryCode,
      callbackUrl,
      state,
      psuType: 'business',
    });

    if (!authSession.url) {
      return NextResponse.json({ error: 'No se obtuvo URL de autorización' }, { status: 500 });
    }

    // Guardar sesión pendiente en BD
    const prisma = getPrismaClient();
    await prisma.bankConnection.create({
      data: {
        companyId: targetCompanyId,
        userId: session.user.id,
        proveedor: 'enablebanking',
        provider: 'enablebanking',
        proveedorItemId: `eb_pending_${Date.now()}_${targetCompanyId}`,
        nombreBanco: bankName,
        estado: 'renovacion_requerida',
        consentId: null,
        // Guardar state para verificar en callback
        refreshToken: state,
      },
    });

    logger.info(`[EnableBanking] Auth iniciada: ${bankName} para company ${targetCompanyId}`);

    return NextResponse.json({
      success: true,
      authUrl: authSession.url,
      expiresAt: authSession.expiresAt,
      message: `Redirigir al usuario a authUrl para autorizar ${bankName}`,
    });
  } catch (error: any) {
    logger.error('[EnableBanking Connect Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
